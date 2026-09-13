#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict, Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse


NAME_KEYWORDS = [
    "夏彦",
    "水無瀬夏彦",
    "Luke Pearce",
    "강혁",
    "Raven",
]

PROFILE_HINTS = [
    "年龄",
    "歲",
    "岁",
    "生日",
    "年龄",
    "身高",
    "职业",
    "身份",
    "CV",
    "voice",
    "别名",
    "代号",
    "爱好",
    "興趣",
    "兴趣",
    "特性",
    "技能",
]

PERSONALITY_HINTS = [
    "乐观",
    "乐观",
    "幽默",
    "温柔",
    "开朗",
    "外向",
    "内向",
    "责任",
    "保护",
    "自我牺牲",
    "担当",
    "担责",
    "生气",
    "害羞",
    "嫉妒",
    "担心",
    "照顾",
    "牵挂",
    "放心",
    "优先",
    "责任感",
    "谨慎",
    "认真",
    "冷静",
    "敏捷",
]

SPEECH_HINTS = [
    "我",
    "你",
    "お前",
    "君",
    "彼女",
    "君は",
    "好き",
    "ごめん",
    "ご飯",
    "ごめんね",
    "大丈夫",
    "大好き",
    "ダメ",
    "だって",
]

RELATION_HINTS = [
    "她",
    "她?",
    "女主",
    "彼女",
    "和你",
    "恋爱",
    "喜欢",
    "保护",
    "照顾",
    "担心",
    "想念",
    "牵",
    "分手",
]

DAILY_HINTS = [
    "早晨",
    "早上",
    "晚上",
    "起床",
    "睡觉",
    "睡眠",
    "起き",
    "食",
    "料理",
    "做饭",
    "早餐",
    "晚饭",
    "天气",
    "运动",
    "摄影",
    "工作",
    "加班",
    "出門",
    "出行",
    "约会",
    "礼物",
]

COMM_HINTS = [
    "早安",
    "晚安",
    "おはよう",
    "おやすみ",
    "饭",
    "天气",
    "工作",
    "生病",
    "出门",
    "加班",
    "想你",
    "约会",
    "节日",
    "生日",
    "道歉",
    "撒娇",
    "安慰",
]

CARD_HINTS = ["SSR", "SR", "MR", "UR", "卡", "卡面", "獲得", "获得", "イベント", "限定"]

QUOTE_PATTERNS = [
    r"「([^」]{2,220})」",
    r"\"([^\"]{2,220})\"",
    r"‘([^’]{2,220})’",
    r"‚([^‘’]{2,220})‘",
    r"『([^』]{2,220})』",
]

INTERVIEW_HINTS = [
    "interview",
    "采访",
    "声優",
    "CV",
    "梶",
    "制作",
    "制作组",
    "インタビュー",
    "文案",
    "監督",
]

VISUAL_HINTS = ["img src=", "<img", ".jpg", ".png", "PV", "公式PV", "宣传", "海报", "主视觉", "配图"]


def clean_text(text: str) -> str:
    if not text:
        return ""
    t = re.sub(r"\s+", " ", text)
    t = t.replace("\u003C", "<").replace("\u003E", ">")
    # strip script/style/css fragments
    t = re.sub(r"<script[\s\S]*?</script>", " ", t, flags=re.IGNORECASE)
    t = re.sub(r"<style[\s\S]*?</style>", " ", t, flags=re.IGNORECASE)
    t = re.sub(r"<[^>]+>", " ", t)
    t = t.replace("window.__NUXT__", " ")
    t = re.sub(r"window\.\w+\s*=\s*", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def contains_any(text: str, words):
    lower = text.lower()
    for w in words:
        if w.lower() in lower:
            return w
    return ""


def extract_quotes(text: str, limit: int = 8):
    out = []
    for p in QUOTE_PATTERNS:
        out.extend(re.findall(p, text))
    dedup = []
    seen = set()
    for q in out:
        q = q.strip()
        if not q or q in seen:
            continue
        if len(q) < 3:
            continue
        seen.add(q)
        dedup.append(q)
    return dedup[:limit]


def image_urls(text: str):
    return re.findall(r"https?://[^\"'\s)]+\.(?:png|jpe?g|webp|gif)(?:\?[^\"'\s)]*)?", text, flags=re.IGNORECASE)


def classify_record(rec: dict) -> tuple[dict, list[str]]:
    title = rec.get("source_title", "") or ""
    excerpt = rec.get("raw_excerpt", "") or ""
    summary = rec.get("summary", "") or ""
    blob = f"{title} {summary} {excerpt}"
    blob_clean = clean_text(blob)
    blob_l = blob_clean.lower()

    categories = {
        "character_profile": False,
        "personality": False,
        "speech_style": False,
        "jp_variant": False,
        "story_growth": False,
        "relationship": False,
        "daily_habits": False,
        "messages_comm": False,
        "interview": False,
        "cards": False,
        "visual": False,
        "timeline": False,
    }

    # language/official split already done outside
    # name variants
    has_luke = any(k in blob_clean for k in NAME_KEYWORDS)

    if (rec.get("language") == "jp" and has_luke) or "水無" in blob_clean:
        categories["jp_variant"] = True

    if contains_any(blob_clean, PROFILE_HINTS) and has_luke:
        categories["character_profile"] = True

    if contains_any(blob_clean, PERSONALITY_HINTS):
        categories["personality"] = True

    if any(k in blob_clean for k in SPEECH_HINTS) and ("「" in blob or "\"" in blob or "』" in blob):
        categories["speech_style"] = True

    if any(k in blob_clean for k in [
        "剧情",
        "主线",
        "活动",
        "故事",
        "event",
        "story",
        "リリース",
        "周年",
        "重逢",
        "童年",
        "恋爱线",
        "关系",
    ]):
        categories["story_growth"] = True

    if any(k in blob_clean for k in RELATION_HINTS):
        categories["relationship"] = True

    if any(k in blob_clean for k in DAILY_HINTS):
        categories["daily_habits"] = True

    if any(k in blob_clean for k in COMM_HINTS):
        categories["messages_comm"] = True

    if rec.get("content_type", "").startswith("official_interview") or rec.get("content_type", "").startswith("reference_interview"):
        categories["interview"] = True
    if contains_any(blob_clean, INTERVIEW_HINTS):
        categories["interview"] = True

    if rec.get("content_type") == "official_card" or contains_any(blob_clean, CARD_HINTS):
        categories["cards"] = True

    if rec.get("content_type") == "official_card" or image_urls(blob_clean):
        categories["visual"] = True

    if (rec.get("publish_date") or rec.get("event_name") or any(ch in blob_clean for ch in ["2021", "2022", "2023", "2024", "2025", "2026"])):
        categories["timeline"] = True

    evidence = {
        "confidence": rec.get("confidence", 0),
        "region": rec.get("region", ""),
        "language": rec.get("language", ""),
        "official": rec.get("official", False),
        "source_site": rec.get("source_site", ""),
        "publish_date": rec.get("publish_date", ""),
        "content_type": rec.get("content_type", ""),
        "event_name": rec.get("event_name", ""),
        "card_name": rec.get("card_name", ""),
        "developer_intent": rec.get("developer_intent", False),
        "tags": rec.get("tags", []),
        "canon_level": rec.get("canon_level", ""),
    }

    tags = []
    if categories["character_profile"]:
        tags.append("character_profile")
    if categories["personality"]:
        tags.append("personality")
    if categories["speech_style"]:
        tags.append("speech_style")
    if categories["relationship"]:
        tags.append("relationship")
    if categories["daily_habits"]:
        tags.append("daily_habits")
    if categories["story_growth"]:
        tags.append("story_growth")
    if categories["messages_comm"]:
        tags.append("messages_comm")
    if categories["interview"]:
        tags.append("interview")
    if categories["cards"]:
        tags.append("cards")
    if categories["visual"]:
        tags.append("visual")
    if categories["timeline"]:
        tags.append("timeline")
    if categories["jp_variant"]:
        tags.append("jp_variant")

    q = extract_quotes(blob_clean)
    imgs = image_urls(blob_clean)

    item = {
        "source_index": rec.get("source_index", 0),
        "source_url": rec.get("source_url", ""),
        "source_title": rec.get("source_title", ""),
        "content_type": rec.get("content_type", ""),
        "region": rec.get("region", ""),
        "language": rec.get("language", ""),
        "official": rec.get("official", False),
        "canon_level": rec.get("canon_level", ""),
        "confidence": rec.get("confidence", 0),
        "category_flags": categories,
        "category_tags": tags,
        "evidence": evidence,
        "raw_excerpt_clean": blob_clean[:1800],
        "quotes": q,
        "image_urls": sorted(set(imgs))[:20],
        "event_name": rec.get("event_name", ""),
        "card_name": rec.get("card_name", ""),
        "publish_date": rec.get("publish_date", ""),
        "crawl_date": rec.get("crawl_date", ""),
        "developer_intent": rec.get("developer_intent", False),
    }

    return item, [k for k, v in categories.items() if v]


def build_category_rows(items):
    category_index = defaultdict(list)
    for it, cats in items:
        if not cats:
            category_index["misc"].append(it)
            continue
        for c in cats:
            category_index[c].append(it)
    return category_index


def dedupe_by_url(rows):
    seen = set()
    out = []
    for row in rows:
        url = row.get("source_url", "")
        if url in seen:
            continue
        seen.add(url)
        out.append(row)
    return out


def guess_timeline_type(rec):
    t = (rec.get("category_tags") or [])
    if "story_growth" in t and rec.get("publish_date"):
        return "release"
    blob = (rec.get("raw_excerpt_clean") or "").lower()
    for k in ["童年", "重逢", "主线", "周年", "生日", "个人", "事件"]:
        if k in blob:
            return "world" if any(x in blob for x in ["童年", "重逢", "主线", "剧情", "关系"]) else "release"
    if rec.get("publish_date"):
        return "release"
    return "world"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=r"outputs/luke_character_focus_20260911/luke_character_records.jsonl")
    parser.add_argument("--out_dir", default=r"outputs/luke_character_focus_20260911")
    args = parser.parse_args()

    source = Path(args.source)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    records = []
    for line in source.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if not line:
            continue
        records.append(json.loads(line))

    processed = []
    bucket = []
    for rec in records:
        item, cats = classify_record(rec)
        item["timeline_type"] = guess_timeline_type(item)
        item["scope"] = {
            "source_level": rec.get("source_level", ""),
            "source_site": rec.get("source_site", ""),
            "source_index": rec.get("source_index", 0),
            "url_level": rec.get("source_level", ""),
            "region": rec.get("region", ""),
            "character": rec.get("character", "夏彦"),
        }
        processed.append((item, cats))
        bucket.append(item)

    processed_dicts = [p[0] for p in processed]

    # dedupe
    processed_dicts = dedupe_by_url(processed_dicts)

    # category pack
    cat_index = build_category_rows([(p[0], p[1]) for p in processed])

    # keep original required metadata format and append extracted fields
    records_out = out_dir / "luke_character_focus_extracted.jsonl"
    with records_out.open("w", encoding="utf-8") as f:
        for row in processed_dicts:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")

    # summary/compact
    total = len(processed_dicts)
    category_counts = {k: len(v) for k, v in cat_index.items()}
    official_counts = Counter(r["official"] for r in processed_dicts)
    lang_counts = Counter(r["language"] for r in processed_dicts)
    conf_buckets = Counter(0 if r.get("confidence", 0) < 0.45 else (1 if r.get("confidence", 0) < 0.8 else 2) for r in processed_dicts)

    # top evidence tables
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": str(source),
        "total_rows": total,
        "high_confidence_rows": len([r for r in processed_dicts if r.get("confidence", 0) >= 0.8]),
        "medium_confidence_rows": len([r for r in processed_dicts if 0.45 <= r.get("confidence", 0) < 0.8]),
        "low_confidence_rows": len([r for r in processed_dicts if r.get("confidence", 0) < 0.45]),
        "official_rows": official_counts.get(True, 0),
        "community_rows": official_counts.get(False, 0),
        "language_distribution": dict(lang_counts),
        "category_distribution": category_counts,
        "conf_level_distribution": {
            "high_ge_0_8": conf_buckets[2],
            "mid_0_45_to_0_8": conf_buckets[1],
            "low_below_0_45": conf_buckets[0],
        },
        "pipeline": {
            "source_files": [str(source)],
            "output_files": [
                "luke_character_focus_extracted.jsonl",
                "character_focus_by_category.json",
                "character_focus_ready.json",
                "character_focus_timeline.jsonl",
            ],
        },
    }

    (out_dir / "luke_character_focus_extract_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    # by-category package
    by_cat = {k: sorted(v, key=lambda x: x.get("source_index", 0)) for k, v in cat_index.items()}
    (out_dir / "character_focus_by_category.json").write_text(json.dumps(by_cat, ensure_ascii=False, indent=2), encoding="utf-8")

    # ready-to-import dataset (drops noisy text fields)
    ready = []
    for r in processed_dicts:
        ready.append(
            {
                "source_url": r["source_url"],
                "source_title": r["source_title"],
                "source_site": r["source"] if False else r["scope"].get("source_site", ""),
                "source_level": r.get("source_site", ""),
                "official": r["official"],
                "region": r["region"],
                "language": r["language"],
                "publish_date": r["publish_date"],
                "crawl_date": r["crawl_date"],
                "author": r.get("scope", {}).get("author", ""),
                "content_type": r["content_type"],
                "character": "夏彦",
                "event_name": r["event_name"],
                "card_name": r["card_name"],
                "raw_excerpt": r["raw_excerpt_clean"],
                "summary": r["raw_excerpt_clean"][:300],
                "tags": r["category_tags"],
                "canon_level": r["canon_level"],
                "confidence": r["confidence"],
                "developer_intent": r["developer_intent"],
                "timeline_type": r["timeline_type"],
                "quotes": r["quotes"],
                "image_urls": r["image_urls"],
            }
        )

    (out_dir / "character_focus_ready.json").write_text(json.dumps(ready, ensure_ascii=False, indent=2), encoding="utf-8")

    # split timeline
    timeline_rows = []
    for r in ready:
        if r["publish_date"] or r["timeline_type"] == "world":
            timeline_rows.append(
                {
                    "source_url": r["source_url"],
                    "timeline_type": r["timeline_type"],
                    "event_name": r["event_name"],
                    "publish_date": r["publish_date"],
                    "title": r["source_title"],
                    "language": r["language"],
                    "region": r["region"],
                    "content_type": r["content_type"],
                    "confidence": r["confidence"],
                }
            )
    timeline_rows = sorted(timeline_rows, key=lambda x: (x.get("publish_date") or "", x.get("source_url", "")))
    with (out_dir / "character_focus_timeline.jsonl").open("w", encoding="utf-8") as f:
        for r in timeline_rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
