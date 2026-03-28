export type TextLinkSegment =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "link";
      href: string;
      label: string;
    };

const linkPattern = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;

export function splitTrailingLinkPunctuation(value: string) {
  const match = value.match(/^(https?:\/\/[^\s]+?)([),.;!?]+)?$/);
  if (!match) {
    return { url: value, trailing: "" };
  }

  return {
    url: match[1] ?? value,
    trailing: match[2] ?? "",
  };
}

export function tokenizeTextWithLinks(value: string) {
  const segments: TextLinkSegment[] = [];
  let cursor = 0;

  for (const match of value.matchAll(linkPattern)) {
    const start = match.index ?? 0;

    if (start > cursor) {
      segments.push({
        type: "text",
        value: value.slice(cursor, start),
      });
    }

    if (match[1] && match[2]) {
      segments.push({
        type: "link",
        href: match[2],
        label: match[1],
      });
    } else {
      const rawUrl = match[3] ?? match[0];
      const { url, trailing } = splitTrailingLinkPunctuation(rawUrl);

      segments.push({
        type: "link",
        href: url,
        label: url,
      });

      if (trailing) {
        segments.push({
          type: "text",
          value: trailing,
        });
      }
    }

    cursor = start + match[0].length;
  }

  if (cursor < value.length) {
    segments.push({
      type: "text",
      value: value.slice(cursor),
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          type: "text",
          value,
        },
      ];
}
