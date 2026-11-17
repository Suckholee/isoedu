import {
  characterColorArg
} from "./chunk-jk4tbr51.js";

// js/character-range-batch.mjs
function encodeCharacterRanges(ranges) {
  if (!Array.isArray(ranges))
    throw new TypeError("InvalidCharacterRanges");
  if (ranges.length > 4096)
    throw new RangeError("LimitExceeded");
  const bytes = new Uint8Array(ranges.length * 16);
  const view = new DataView(bytes.buffer);
  for (let i = 0;i < ranges.length; i++) {
    const range = ranges[i];
    const names = ["section", "paragraph", "startUnit", "endUnit"];
    if (!range || typeof range !== "object" || Array.isArray(range) || Object.keys(range).some((key) => !names.includes(key)))
      throw new TypeError("InvalidCharacterRanges");
    const values = names.map((name) => {
      const value = range[name];
      if (!Number.isInteger(value) || value < 0 || value > 4294967295)
        throw new RangeError("InvalidTextPosition");
      return value;
    });
    if (values[3] < values[2])
      throw new RangeError("InvalidTextPosition");
    values.forEach((value, j) => view.setUint32(i * 16 + j * 4, value, true));
  }
  return bytes;
}

// js/paragraph-replacement.mjs
function normalizeParagraphReplacement(text) {
  return text.replace(/\r\n?/g, `
`);
}
function encodeParagraphReplacement(text) {
  if (typeof text !== "string" || !text.isWellFormed())
    throw new TypeError("InvalidText");
  if (text.length > 4 * 1024 * 1024)
    throw new RangeError("LimitExceeded");
  const bytes = new TextEncoder().encode(normalizeParagraphReplacement(text));
  if (bytes.length > 4 * 1024 * 1024)
    throw new RangeError("LimitExceeded");
  return bytes;
}

// js/character-shade-args.mjs
function characterShadeArgs(color) {
  return color === null ? [0, 0] : [1, characterColorArg(color)];
}

export { encodeCharacterRanges, normalizeParagraphReplacement, encodeParagraphReplacement, characterShadeArgs };
