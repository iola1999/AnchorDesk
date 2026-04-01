import { describe, expect, it } from "vitest";

import { conversationDensityClassNames } from "./conversation-density";

describe("conversationDensityClassNames", () => {
  it("keeps the conversation stack tighter than the default sparse layout", () => {
    expect(conversationDensityClassNames.sessionStack).toContain("min-w-0");
    expect(conversationDensityClassNames.sessionStack).toContain("gap-5");
    expect(conversationDensityClassNames.sessionStack).not.toContain("gap-10");
    expect(conversationDensityClassNames.sessionStack).not.toContain("gap-12");
  });

  it("widens user turns and tightens text leading for denser reading", () => {
    expect(conversationDensityClassNames.userWrap).toContain("min-w-0");
    expect(conversationDensityClassNames.userWrap).toContain("max-w-[860px]");
    expect(conversationDensityClassNames.userText).toContain("text-[14px]");
    expect(conversationDensityClassNames.userText).toContain("leading-7");
    expect(conversationDensityClassNames.resultPanel).toContain("min-w-0");
    expect(conversationDensityClassNames.answerText).toContain("text-[14px]");
    expect(conversationDensityClassNames.answerText).toContain("leading-7");
  });

  it("uses a stepped timeline layout with a vertical rail and expandable task cards", () => {
    expect(conversationDensityClassNames.timelineShell).toContain("max-w-full");
    expect(conversationDensityClassNames.timelineShell).toContain("rounded-[24px]");
    expect(conversationDensityClassNames.timelineList).toContain("before:absolute");
    expect(conversationDensityClassNames.timelineEntry).toContain("group/timeline-entry");
    expect(conversationDensityClassNames.timelineEntrySummary).toContain(
      "grid-cols-[2rem_minmax(0,1fr)]",
    );
    expect(conversationDensityClassNames.timelineEntryCard).toContain("rounded-[22px]");
    expect(conversationDensityClassNames.timelineEntryDetails).toContain(
      "grid-cols-[2rem_minmax(0,1fr)]",
    );
    expect(conversationDensityClassNames.timelineArgument).toContain("rounded-xl");
    expect(conversationDensityClassNames.timelinePreviewItem).toContain("rounded-xl");
    expect(conversationDensityClassNames.payloadDisclosure).toContain("overflow-hidden");
    expect(conversationDensityClassNames.payloadPre).toContain("max-w-full");
    expect(conversationDensityClassNames.payloadPre).toContain("break-all");
    expect(conversationDensityClassNames.payloadPre).toContain("select-text");
    expect(conversationDensityClassNames.payloadDisclosure).toContain("bg-app-surface-soft");
  });

  it("keeps the stage composer compact while preserving attachment visibility", () => {
    expect(conversationDensityClassNames.composerShell).toContain("sticky");
    expect(conversationDensityClassNames.composerShell).toContain("bottom-0");
    expect(conversationDensityClassNames.composerShell).not.toContain("backdrop-blur");
    expect(conversationDensityClassNames.composerShell).not.toContain("linear-gradient");
    expect(conversationDensityClassNames.composerCard).toContain("rounded-[24px]");
    expect(conversationDensityClassNames.composerCard).toContain("border");
    expect(conversationDensityClassNames.composerCard).toContain("px-4");
    expect(conversationDensityClassNames.composerCard).toContain("py-3");
    expect(conversationDensityClassNames.composerCard).toContain("shadow-[0_16px_28px");
    expect(conversationDensityClassNames.composerText).toContain("text-[14px]");
    expect(conversationDensityClassNames.composerAttachments).toContain("gap-1.5");
  });
});
