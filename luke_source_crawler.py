#!/usr/bin/env python
from __future__ import annotations

import argparse
import asyncio
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from scrapling.fetchers import FetcherSession, DynamicSession
from scrapling.spiders import Request, Spider


DYNAMIC_HINT_HOSTS = {
    "bilibili.com",
    "weibo.com",
    "x.com",
    "twitter.com",
    "instagram.com",
    "facebook.com",
    "youtube.com",
    "reddit.com",
    "xiaohongshu.com",
    "douyin.com",
    "kuaishou.com",
    "weixin.sogou.com",
    "cafe.naver.com",
    "naver.com",
    "discord.com",
    "discord.gg",
    "bilibili.com",
    "tiktok.com",
}

URL_RE = re.compile(r"https?://[^\s)\]]+")


def infer_level_section(region: str, line: str, current_level: str | None, current_section: str | None):
    if re.search(r"S\s*级", line):
        current_level = "S"
        return current_level, current_section
    if re.search(r"A\s*级", line):
        current_level = "A"
        return current_level, current_section
    if re.search(r"B\s*级", line):
        current_level = "B"
        return current_level, current_section
    if re.search(r"C\s*级", line):
        current_level = "C"
        return current_level, current_section
    if re.search(r"D\s*级", line):
        current_level = "D"
        return current_level, current_section
    if re.search(r"E\s*级", line):
        current_level = "E"
        return current_level, current_section

    if "中国大陆官方" in line:
        current_section = "China_official"
    elif "全球服" in line:
        current_section = "Global_official"
    elif "日本官方" in line:
        current_section = "JP_official"
    elif "韩国官方" in line:
        current_section = "KR_official"
    elif "台港澳官方" in line:
        current_section = "TW_HK_official"
    elif "中文媒体" in line:
        current_section = "Media_CN"
    elif "英文媒体" in line:
        current_section = "Media_EN"
    elif "日本媒体" in line:
        current_section = "Media_JP"
    elif "玩家社区" in line and current_level == "C":
        current_section = "Community"
    elif "搜索、网页存档、跨站发现工具" in line:
        current_section = "Discovery"
    elif "更多线索发现平台" in line:
        current_section = "Discovery"
    elif "中文" in line and current_section == "Discovery" and current_level == "E":
        current_section = "Discovery_CN"
    elif ("海外" in line and current_section in {"Discovery", "Discovery_CN"}) or (
        "日本补充平台" in line
    ):
        current_section = "Discovery_Overseas"
    elif "日本补充平台" in line and current_level == "E":
        current_section = "Discovery_JP"
    elif "韩国补充平台" in line and current_level == "E":
        current_section = "Discovery_KR"
    elif region:
        current_section = region

    return current_level, current_section


def host_region(host: str) -> str:
    if not host:
        return "unknown"
    h = host.lower()
    if h.endswith(".jp") or ".jp/" in h:
        return "JP"
    if h.endswith(".kr") or ".kr/" in h:
        return "KR"
    if h.endswith(".tw") or ".hk" in h:
        return "TW"
    if any(x in h for x in ("x.com", "twitter.com", "facebook.com", "instagram.com", "youtube.com")):
        return "Global"
    if any(x in h for x in ("mihoyo", "hoyoverse", "miyoushe", "taptap", "wechat", "apps.apple.com", "play.google.com")):
        return "CN"
    return "Global"


def load_sources(path: str):
    text = Path(path).read_text(encoding="utf-8")
    current_level = None
    current_section = None
    items = []
    seen = set()

    for line in text.splitlines():
        current_level, current_section = infer_level_section(host_region(""), line, current_level, current_section)
        matches = URL_RE.findall(line)
        if not matches:
            continue
        region = None
        for raw in matches:
            url = raw.rstrip(").,;")
            parsed = urlparse(url)
            if not parsed.scheme.startswith("http"):
                continue
            if url in seen:
                continue
            seen.add(url)
            host = parsed.hostname or ""
            region = host_region(host)
            section = current_section or region
            need_dynamic = any(h in host.lower() for h in DYNAMIC_HINT_HOSTS)
            if current_level is None:
                lvl = "unknown"
            else:
                lvl = current_level
            official = lvl in {"S", "A"}
            items.append(
                {
                    "url": url,
                    "source_level": lvl,
                    "section": section,
                    "region": region,
                    "official": official,
                    "need_dynamic": need_dynamic,
                    "line": line.strip(),
                }
            )

    return items


def pick(response, selector: str, default: str = ""):
    try:
        return (response.css(selector).get(default="") or "").strip()
    except Exception:
        return default


def extract_text(response, max_len: int = 12000):
    try:
        texts = response.css("body ::text").getall()
    except Exception:
        raw = getattr(response, "text", "") or ""
        texts = [raw]
    merged = " ".join(t.strip() for t in texts if t and t.strip())
    merged = re.sub(r"\s+", " ", merged).strip()
    return merged[:max_len]


class LukeSourceSpider(Spider):
    name = "luke_source_crawler"
    concurrent_requests = 6

    # Keep this conservative to avoid stressing dynamic sites.
    request_timeout = 25

    def __init__(self, source_file: str, out_dir: str, limit: int | None = None):
        self.out_dir = Path(out_dir)
        self.out_dir.mkdir(parents=True, exist_ok=True)
        self.source_file = source_file
        self.limit = limit
        self.sources = load_sources(source_file)
        if limit:
            self.sources = self.sources[:limit]
        self.results_path = self.out_dir / "luke_raw_records.jsonl"
        self.summary_path = self.out_dir / "luke_raw_summary.jsonl"
        self.failed_path = self.out_dir / "luke_failed.jsonl"

        # clear previous outputs for a clean run
        for p in (self.results_path, self.summary_path, self.failed_path):
            if p.exists():
                p.unlink()

        super().__init__()

    def configure_sessions(self, manager):
        manager.add("default", FetcherSession(), default=True)
        manager.add("dynamic", DynamicSession(), lazy=True)

    async def start_requests(self):
        for idx, item in enumerate(self.sources, 1):
            sid = "dynamic" if item.get("need_dynamic") else "default"
            request = Request(
                item["url"],
                callback=self.parse,
                sid=sid,
                meta={"source": item, "index": idx},
            )
            yield request

    async def parse(self, response):
        request = getattr(response, "request", None)
        source = getattr(request, "meta", {}).get("source", {})
        source_url = source.get("url")
        if not source_url:
            source_url = getattr(request, "url", getattr(response, "url", ""))
        crawl_date = datetime.now(timezone.utc).isoformat()
        status = getattr(response, "status", None)

        title = pick(response, "title::text")
        if not title:
            title = pick(response, "meta[property='og:title']::attr(content)")
        language = pick(response, "html::attr(lang)") or pick(response, "html ::attr(lang)") or ""

        publish_date = ""
        for sel in [
            "meta[property='article:published_time']::attr(content)",
            "meta[property='article:publish_date']::attr(content)",
            "meta[name='pubdate']::attr(content)",
            "meta[name='publish_date']::attr(content)",
            "meta[name='date']::attr(content)",
            "time::attr(datetime)",
        ]:
            publish_date = pick(response, sel)
            if publish_date:
                break

        record = {
            "crawl_date": crawl_date,
            "source_url": source_url,
            "source_title": title,
            "source_level": source.get("source_level"),
            "official": source.get("official", False),
            "publish_date": publish_date,
            "language": language,
            "region": source.get("region"),
            "request_region": host_region(urlparse(source_url).hostname or ""),
            "http_status": status,
            "page_lang": language,
            "content_excerpt": extract_text(response, 4000),
            "source_section": source.get("section"),
            "source_line": source.get("line"),
            "raw_url": source_url,
            "final_url": getattr(response, "url", source_url),
            "text_length": len((getattr(response, "text", "") or "")),
        }

        if request is None or getattr(request, "meta", {}).get("index") is None:
            index = source.get("index", "")
        else:
            index = request.meta["index"]
        record["source_index"] = index
        path = self.results_path
        if status and status >= 400:
            path = self.failed_path
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        yield record

    async def close(self):  # save summary
        # keep simple summary
        total = 0
        failed = 0
        by_level = {}

        if self.results_path.exists():
            with self.results_path.open("r", encoding="utf-8") as f:
                for line in f:
                    total += 1
                    info = json.loads(line)
                    lvl = info.get("source_level", "unknown")
                    by_level[lvl] = by_level.get(lvl, 0) + 1

        if self.failed_path.exists():
            with self.failed_path.open("r", encoding="utf-8") as f:
                for line in f:
                    failed += 1

        summary = {
            "total": total + failed,
            "success": total,
            "failed_or_error_status": failed,
            "by_level": by_level,
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        with self.summary_path.open("w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source_file", default=r"C:/Users/Administrator/Downloads/tears-of-themis-luke-source-sites.md")
    parser.add_argument("--out_dir", default=str(Path("F:/夏彦软件/luke_source_crawl_runs")))
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    spider = LukeSourceSpider(
        source_file=args.source_file,
        out_dir=args.out_dir,
        limit=args.limit,
    )
    spider.start(crawldir=args.out_dir)


if __name__ == "__main__":
    main()
