import unittest

from parser_utils import (
    build_blocks_from_paragraphs,
    compute_parse_score_bp,
    extract_section_label,
    guess_block_type,
    infer_file_kind,
    split_paragraphs,
)


class ParserUtilsTestCase(unittest.TestCase):
    def test_infer_file_kind(self):
        self.assertEqual(infer_file_kind("workspaces/ws/a.pdf"), "pdf")
        self.assertEqual(infer_file_kind("docs/contract.docx"), "docx")
        self.assertEqual(infer_file_kind("docs/notes.md"), "text")
        self.assertEqual(infer_file_kind("docs/archive.bin"), "unknown")

    def test_split_paragraphs(self):
        paragraphs = split_paragraphs("第一段\n\n第二段\r\n\r\n第三段")
        self.assertEqual(paragraphs, ["第一段", "第二段", "第三段"])

    def test_heading_detection(self):
        self.assertEqual(extract_section_label("第8条 不可抗力"), "第8条")
        self.assertEqual(extract_section_label("5.1 付款条件"), "5.1")
        self.assertEqual(guess_block_type("第8条 不可抗力"), "heading")
        self.assertEqual(guess_block_type("发生不可抗力时双方互不承担责任。"), "paragraph")

    def test_build_blocks_propagates_headings(self):
        blocks, headings = build_blocks_from_paragraphs(
            [
                "第8条 不可抗力",
                "发生不可抗力时，受影响一方应及时通知对方。",
            ],
            page_no=3,
        )

        self.assertEqual(len(blocks), 2)
        self.assertEqual(blocks[0]["block_type"], "heading")
        self.assertEqual(blocks[1]["heading_path"], ["第8条 不可抗力"])
        self.assertEqual(blocks[1]["section_label"], "第8条")
        self.assertEqual(headings, ["第8条 不可抗力"])

    def test_compute_parse_score_bp(self):
        self.assertEqual(compute_parse_score_bp(0, 100, 2), 0)
        score = compute_parse_score_bp(3, 1800, 9)
        self.assertGreater(score, 0)
        self.assertLessEqual(score, 9900)


if __name__ == "__main__":
    unittest.main()
