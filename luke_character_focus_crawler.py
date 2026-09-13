#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from scrapling.fetchers import FetcherSession, DynamicSession
from scrapling.spiders import Request, Spider

URL_RE = re.compile(r"https?://[^\s)\]]+")

KEYWORDS = {
    "name_cn": "夏彦",
    "name_jp": "水無瀬夏彦",
    "name_en": "Luke Pearce",
    "name_kr": "강혁",
    "alias": "Raven",
}

OFFICIAL_HOSTS = {
    "tot.hoyoverse.com",
    "wd.mihoyo.com",
    "www.hoyolab.com",
    "www.hoyoverse.com",
    "tot.tw.hoyoverse.com",
    "prtimes.jp",
    "gamebiz.jp",
    "dengekionline.com",
    "www.gamer.ne.jp",
    "www.pashplus.jp",
    "www.4gamer.net",
    "www.bs-log.com",
}

DYNAMIC_HINT_HOSTS = {
    "x.com",
    "twitter.com",
    "instagram.com",
    "facebook.com",
    "youtube.com",
    "tiktok.com",
    "discord.com",
    "discord.gg",
}


def detect_language(url: str, lang_attr: str | None = None) -> str:
    if lang_attr:
        l = lang_attr.lower().strip()
        if l.startswith("zh"):
            return "zh"
        if l.startswith("ja"):
            return "jp"
        if l.startswith("en"):
            return "en"
        if l.startswith("ko"):
            return "kr"
    u = (url or "").lower()
    if "/ja" in u or "/jp" in u:
        return "jp"
    if "/en" in u or "en-us" in u:
        return "en"
    if "/ko" in u or "ko-kr" in u:
        return "kr"
    return "zh"


def language_bucket(lang: str) -> str:
    return {
        "zh": "official-cn",
        "jp": "official-jp",
        "en": "official-en",
        "kr": "official-kr",
    }.get(lang, "official-cn")


def infer_official(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(h == host or host.endswith("." + h) for h in OFFICIAL_HOSTS)


def infer_level(url: str) -> str:
    # 使用原清单的 S/A/B 逻辑时不可靠，统一先用 S/E 兜底
    return "S" if infer_official(url) else "E"


def load_source_urls(path: str):
    seen = set()
    urls = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        for u in URL_RE.findall(line):
            u = u.rstrip(")].,;")
            if not u.startswith("http"):
                continue
            if u not in seen:
                seen.add(u)
                urls.append(u)
    return urls


def pick(response, selector: str, default: str = "") -> str:
    try:
        return (response.css(selector).get(default="") or "").strip()
    except Exception:
        return default


def extract_text(response, max_len: int = 20000) -> str:
    try:
        parts = response.css("body ::text").getall()
    except Exception:
        parts = [getattr(response, "text", "") or ""]
    text = " ".join(x.strip() for x in parts if x and x.strip())
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_len]


def contains_luke(text: str) -> bool:
    return any(v in text for v in KEYWORDS.values())


def detect_content_type(url: str, title: str, text: str) -> str:
    blob = f"{url} {title} {text}".lower()
    if any(x in blob for x in ["interview", "采访", "インタビュー", "聲優", "配音", "梶", "金弦", "voice"]):
        return "official_interview" if infer_official(url) else "reference_interview"
    if any(x in blob for x in ["卡", "思绪", "sr", "mr", "ssr", "card", "思绪", "思い出"]) :
        return "official_card"
    if any(x in blob for x in ["角色", "角色介紹", "プロフィール", "character", "主角", "公式紹介", "character profile"]):
        return "official_profile"
    if any(x in blob for x in ["活动", "イベント", "周年", "生日", "誕生日", "event", "activity", "story", "ストーリー", "剧情"]):
        return "official_event" if infer_official(url) else "reference_story"
    return "reference" if not infer_official(url) else "official"


def extract_event_name(text: str, title: str) -> str:
    m = re.search(r"([\u4e00-\u9fa5]{2,12})(活动|イベント|周年|誕生日|story|event)", f"{title} {text}")
    return m.group(0) if m else ""


def extract_card_name(text: str, title: str) -> str:
    m = re.search(r"(SSR|SR|MR|UR|思绪)[^。\n]{0,80}", f"{title} {text}")
    return m.group(0) if m else ""


def extract_publish_date(response) -> str:
    for sel in [
        "meta[property='article:published_time']::attr(content)",
        "meta[name='publish_date']::attr(content)",
        "meta[name='pubdate']::attr(content)",
        "time::attr(datetime)",
    ]:
        v = pick(response, sel)
        if v:
            return v
    return ""


def extract_author(response) -> str:
    for sel in ["meta[name='author']::attr(content)", "meta[property='article:author']::attr(content)"]:
        v = pick(response, sel)
        if v:
            return v
    return ""


def collect_tags(url: str, title: str, text: str, lang: str, content_type: str):
    blob = f"{url} {title} {text}".lower()
    tags = set()
    if "summer" in blob or "夏彦" in blob:
        tags.add("character:luo")
    if "水無瀬夏彦" in blob or "みなせ" in blob or "ミズナセ夏彦" in blob:
        tags.add("character:water")
    if "luke" in blob or "luke pearce" in blob:
        tags.add("character:luke")
    if "梶裕貴" in blob:
        tags.add("voice_actor:kaji")
    if "卡" in blob:
        tags.add("content:card")
    if "活动" in blob or "event" in blob:
        tags.add("content:event")
    if "剧情" in blob or "story" in blob:
        tags.add("content:story")
    tags.add(f"lang:{lang}")
    tags.add(f"type:{content_type}")
    if infer_official(url):
        tags.add("source:official")
    if "x.com" in url or "youtube.com" in url:
        tags.add("source:social")
    return sorted(tags)


class LukeCharacterSpider(Spider):
    name = "luke_character_focus"
    concurrent_requests = 6
    request_timeout = 25

    def __init__(self, source_file: str, out_dir: str):
        self.out_dir = Path(out_dir)
        self.out_dir.mkdir(parents=True, exist_ok=True)
        self.source_file = source_file
        self.sources = load_source_urls(source_file)

        # output files
        self.all_path = self.out_dir / "luke_character_records.jsonl"
        self.failed_path = self.out_dir / "luke_character_failed.jsonl"
        for p in [self.all_path, self.failed_path, self.out_dir / "summary.json", self.out_dir / "index.json"]:
            if p.exists():
                p.unlink()
        for d in ["official-cn", "official-jp", "official-en", "official-kr", "reference-media", "reference-wiki", "reference-community"]:
            path = self.out_dir / d
            path.mkdir(parents=True, exist_ok=True)
            fp = path / "luke_character_records.jsonl"
            if fp.exists():
                fp.unlink()

        super().__init__()

    def configure_sessions(self, manager):
        manager.add("default", FetcherSession(), default=True)
        manager.add("dynamic", DynamicSession(), lazy=True)

    async def start_requests(self):
        for i, url in enumerate(self.sources, 1):
            host = (urlparse(url).hostname or "").lower()
            sid = "dynamic" if any(x in host for x in DYNAMIC_HINT_HOSTS) else "default"
            yield Request(url, callback=self.parse, sid=sid, meta={"source_index": i})

    async def parse(self, response):
        req = getattr(response, "request", None)
        source_url = getattr(req, "meta", {}).get("source_url", None)
        if source_url is None:
            source_url = getattr(req, "url", getattr(response, "url", ""))

        status = getattr(response, "status", None)
        title = pick(response, "title::text") or pick(response, "meta[property='og:title']::attr(content)")
        lang_attr = pick(response, "html::attr(lang)") or pick(response, "html ::attr(lang)")
        lang = detect_language(source_url, lang_attr)

        text = extract_text(response)
        official = infer_official(source_url)
        content_type = detect_content_type(source_url, title, text)
        publish_date = extract_publish_date(response)
        author = extract_author(response)

        tags = collect_tags(source_url, title, text, lang, content_type)

        # 仅保留与夏彦直接相关度较高的页面
        if not contains_luke(f"{title} {text}") and "luke" not in source_url.lower() and "waterlessa" not in source_url.lower():
            # 仍保留官方列表页和索引页（后续可用于关联），但标低置信度
            tags.append("character:weak")

        record = {
            "source_url": source_url,
            "source_title": title,
            "source_site": urlparse(source_url).hostname or "",
            "source_level": infer_level(source_url),
            "official": official,
            "region": "JP" if lang == "jp" else ("KR" if lang == "kr" else ("EN" if lang == "en" else "CN")),
            "language": lang,
            "publish_date": publish_date,
            "crawl_date": datetime.now(timezone.utc).isoformat(),
            "author": author,
            "content_type": content_type,
            "character": "夏彦",
            "event_name": extract_event_name(text, title),
            "card_name": extract_card_name(text, title),
            "raw_excerpt": text[:2000],
            "summary": text[:360],
            "tags": tags,
            "canon_level": "canon_main" if official else "canon_side",
            "source_index": req.meta.get("source_index", 0) if req else 0,
            "http_status": status,
            "request_region": lang,
            "raw_url": source_url,
            "final_url": getattr(response, "url", source_url),
            "confidence": 0.0,
            "developer_intent": content_type == "official_interview" or "voice_actor" in " ".join(tags),
        }

        if not contains_luke(f"{title} {text}") and not record["developer_intent"]:
            record["canon_level"] = "canon_side"

        if "official_interview" in content_type:
            record["canon_level"] = "canon_side"
            if "reference" in (record["tags"] or []):
                record["tags"].append("developer_intent")
            record["tags"] = sorted(set(record["tags"] + ["developer_intent", "voice_actor_interpretation"]))

        c = 0.35
        if official:
            c += 0.35
        if contains_luke(f"{title} {text}"):
            c += 0.2
        if status and status < 400:
            c += 0.1
        record["confidence"] = max(0.0, min(1.0, round(c, 2)))

        bucket = None
        if official:
            bucket = self.out_dir / language_bucket(lang)
        else:
            host = (record["source_site"] or "").lower()
            if "wiki" in host or "wikipedia" in host:
                bucket = self.out_dir / "reference-wiki"
            elif "fandom" in host or "reddit" in host or "xiaohongshu" in host or "zhihu" in host:
                bucket = self.out_dir / "reference-community"
            else:
                bucket = self.out_dir / "reference-media"

        with self.all_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
        with (bucket / "luke_character_records.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
        if status and status >= 400:
            with self.failed_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

        yield record

    async def close(self):
        rows = []
        if self.all_path.exists():
            with self.all_path.open(encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    rows.append(json.loads(line))

        failed = sum(1 for r in rows if (r.get("http_status") or 0) >= 400)
        cnt_type = Counter(r.get("content_type") for r in rows)
        cnt_lang = Counter(r.get("language") for r in rows)
        cnt_canon = Counter(r.get("canon_level") for r in rows)

        summary = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total": len(rows),
            "failed": failed,
            "by_content_type": dict(cnt_type),
            "by_language": dict(cnt_lang),
            "by_canon_level": dict(cnt_canon),
        }
        with (self.out_dir / "summary.json").open("w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        with (self.out_dir / "index.json").open("w", encoding="utf-8") as f:
            json.dump({
                "records": len(rows),
                "fields": [
                    "source_url",
                    "source_title",
                    "source_site",
                    "source_level",
                    "official",
                    "region",
                    "language",
                    "publish_date",
                    "crawl_date",
                    "author",
                    "content_type",
                    "character",
                    "event_name",
                    "card_name",
                    "raw_excerpt",
                    "summary",
                    "tags",
                    "canon_level",
                    "confidence",
                    "developer_intent",
                ],
                "summary": summary,
            }, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source_file", default=r"F:/夏彦软件/luke_character_focus_seed_urls.txt")
    parser.add_argument("--out_dir", default=str(Path("F:/夏彦软件/luke_character_focus_runs")))
    args = parser.parse_args()

    LukeCharacterSpider(source_file=args.source_file, out_dir=args.out_dir).start(crawldir=args.out_dir)


if __name__ == "__main__":
    main()
