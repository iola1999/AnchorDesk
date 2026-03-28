from __future__ import annotations

import re
from pathlib import Path


def infer_file_kind(storage_key: str, logical_path: str | None = None) -> str:
    source = (logical_path or storage_key or "").lower()
    suffix = Path(source).suffix

    if suffix == ".pdf":
        return "pdf"
    if suffix == ".docx":
        return "docx"
    if suffix in {".txt", ".md", ".markdown"}:
        return "text"
    return "unknown"


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def split_paragraphs(text: str) -> list[str]:
    normalized = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = [
        part.strip()
        for part in re.split(r"\n\s*\n+", normalized)
        if part and part.strip()
    ]
    if paragraphs:
        return paragraphs

    fallback = normalize_text(normalized)
    return [fallback] if fallback else []


def extract_section_label(text: str) -> str | None:
    normalized = normalize_text(text)
    if not normalized:
        return None

    match = re.match(
        r"^(第[\d一二三四五六七八九十百千零〇]+[编章节条款项]|[0-9]+(?:\.[0-9]+){1,4})",
        normalized,
    )
    if match:
        return match.group(1)
    return None


def guess_block_type(text: str) -> str:
    normalized = normalize_text(text)
    if not normalized:
        return "paragraph"

    if extract_section_label(normalized):
        return "heading"

    if len(normalized) <= 30 and normalized.endswith(("：", ":")):
        return "heading"

    return "paragraph"


def build_blocks_from_paragraphs(
    paragraphs: list[str],
    *,
    page_no: int,
    starting_order_index: int = 1,
    inherited_headings: list[str] | None = None,
) -> tuple[list[dict], list[str]]:
    blocks: list[dict] = []
    current_headings = list(inherited_headings or [])
    order_index = starting_order_index

    for paragraph in paragraphs:
        normalized = normalize_text(paragraph)
        if not normalized:
            continue

        block_type = guess_block_type(normalized)
        section_label = extract_section_label(normalized)

        if block_type == "heading":
            current_headings = [normalized]
        elif not section_label and current_headings:
            section_label = extract_section_label(current_headings[-1]) or current_headings[-1]

        blocks.append(
            {
                "page_no": page_no,
                "order_index": order_index,
                "block_type": block_type,
                "section_label": section_label,
                "heading_path": current_headings.copy(),
                "text": normalized,
                "bbox_json": None,
            }
        )
        order_index += 1

    return blocks, current_headings


def compute_parse_score_bp(page_count: int, text_length: int, block_count: int) -> int:
    if page_count <= 0 or text_length <= 0 or block_count <= 0:
        return 0

    page_score = min(1.0, page_count / 5)
    text_score = min(1.0, text_length / 4000)
    block_score = min(1.0, block_count / max(page_count, 1))
    combined = page_score * 0.25 + text_score * 0.5 + block_score * 0.25
    return int(min(0.99, combined) * 10_000)
