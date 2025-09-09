#!/usr/bin/env python3
"""
Convert ChatGPT web export (conversations.json) into Markdown files.

Usage:
  python scripts/convert_chatgpt_export.py --input path/to/conversations.json --out docs/chat

Notes:
  - Handles both array-at-root and {"conversations": [...]} formats.
  - Orders messages by create_time when available, otherwise by insertion order.
  - Produces one Markdown per conversation with a sanitized filename.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


def read_export(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "conversations" in data and isinstance(data["conversations"], list):
        return data["conversations"]
    raise ValueError("Unsupported conversations.json format")


def sanitize_filename(name: str) -> str:
    name = name.strip() or "untitled"
    # Replace non-word chars with hyphens; collapse repeats
    name = re.sub(r"[^\w\- ]+", "-", name)
    name = re.sub(r"\s+", "-", name)
    name = re.sub(r"-+", "-", name).strip("-")
    return name or "untitled"


def iter_messages(conv: Dict[str, Any]) -> Iterable[Tuple[str, str, float]]:
    """Yield (role, text, create_time) tuples."""
    mapping = conv.get("mapping") or {}

    msgs: List[Tuple[str, str, float]] = []
    for node in mapping.values():
        msg = (node or {}).get("message") or {}
        if not msg:
            continue
        author = (msg.get("author") or {}).get("role") or "user"
        content = msg.get("content")
        text = extract_text(content)
        if not text:
            continue
        ct = msg.get("create_time")
        try:
            ts = float(ct) if ct is not None else float("inf")
        except Exception:
            ts = float("inf")
        msgs.append((author, text, ts))

    # Sort by timestamp when available; otherwise keep insertion order
    msgs.sort(key=lambda t: t[2])
    return msgs


def extract_text(content: Any) -> str:
    # Typical export: { content_type: "text", parts: ["..."] }
    if isinstance(content, dict):
        parts = content.get("parts")
        if isinstance(parts, list):
            return "\n\n".join(p for p in parts if isinstance(p, str)).strip()
    # Fallbacks: direct string
    if isinstance(content, str):
        return content.strip()
    return ""


def write_markdown(conv: Dict[str, Any], out_dir: Path) -> Path:
    title = conv.get("title") or "Untitled"
    fname = sanitize_filename(title) + ".md"
    path = out_dir / fname

    # Ensure unique filename if needed
    base = path.stem
    i = 2
    while path.exists():
        path = out_dir / f"{base}-{i}.md"
        i += 1

    msgs = list(iter_messages(conv))
    with path.open("w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        if not msgs:
            f.write("(No messages parsed)\n")
            return path
        for idx, (role, text, _ts) in enumerate(msgs, 1):
            f.write(f"## {idx}. {role}\n\n")
            f.write(text)
            f.write("\n\n---\n\n")
    return path


def main() -> None:
    ap = argparse.ArgumentParser(description="Convert ChatGPT conversations.json to Markdown files.")
    ap.add_argument("--input", "-i", type=str, required=True, help="Path to conversations.json from ChatGPT export")
    ap.add_argument("--out", "-o", type=str, default="docs/chat", help="Output directory for Markdown files")
    args = ap.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    out_dir = Path(args.out).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    conversations = read_export(input_path)
    written: List[Path] = []
    for conv in conversations:
        try:
            p = write_markdown(conv, out_dir)
            written.append(p)
        except Exception as e:
            # Skip bad conversation entries but continue
            print(f"Warning: failed to write a conversation: {e}")

    print(f"Done. Wrote {len(written)} Markdown file(s) to {out_dir}.")


if __name__ == "__main__":
    main()

