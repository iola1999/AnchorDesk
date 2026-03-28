from __future__ import annotations

import io
import os
from typing import Protocol

from pypdf import PdfReader


class OCRProviderError(Exception):
    def __init__(self, *, code: str, message: str, provider_name: str):
        super().__init__(message)
        self.code = code
        self.message = message
        self.provider_name = provider_name

    def to_detail(self) -> dict:
        return {
            "code": self.code,
            "message": self.message,
            "ocr_provider": self.provider_name,
            "recoverable": True,
        }


class OCRProvider(Protocol):
    name: str

    def extract_pdf_pages(self, pdf_bytes: bytes) -> list[dict]:
        pass


class DisabledOCRProvider:
    name = "disabled"

    def extract_pdf_pages(self, pdf_bytes: bytes) -> list[dict]:
        raise OCRProviderError(
            code="ocr_required",
            message="No extractable PDF text found and OCR provider is disabled.",
            provider_name=self.name,
        )


class MockOCRProvider:
    name = "mock"

    def extract_pdf_pages(self, pdf_bytes: bytes) -> list[dict]:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        mock_text = (os.getenv("PARSER_OCR_MOCK_TEXT") or "").strip()
        if not mock_text:
            raise OCRProviderError(
                code="ocr_no_text",
                message="Mock OCR provider returned empty text.",
                provider_name=self.name,
            )

        pages: list[dict] = []
        for page_index, page in enumerate(reader.pages, start=1):
            width = float(page.mediabox.width) if page.mediabox else None
            height = float(page.mediabox.height) if page.mediabox else None
            pages.append(
                {
                    "page_no": page_index,
                    "width": width,
                    "height": height,
                    "text": mock_text if page_index == 1 else "",
                }
            )

        return pages


def get_ocr_provider() -> OCRProvider:
    provider_name = (os.getenv("PARSER_OCR_PROVIDER") or "disabled").strip().lower()

    if provider_name in {"", "disabled", "none"}:
        return DisabledOCRProvider()
    if provider_name == "mock":
        return MockOCRProvider()

    raise RuntimeError(f"Unsupported OCR provider: {provider_name}")
