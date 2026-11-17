import {
  FONT_LANGUAGES
} from "./chunk-jk4tbr51.js";

// js/character-font-args.mjs
function characterFontArgs(language, fontId) {
  const index = FONT_LANGUAGES.indexOf(language);
  if (index < 0)
    throw new RangeError("InvalidCharacterFontLanguage");
  if (!Number.isInteger(fontId) || fontId < 0 || fontId > 4294967295)
    throw new RangeError("InvalidFontId");
  return [index, fontId];
}

// js/character-font-name-args.mjs
function characterFontNameArgs(language, name) {
  const index = characterFontArgs(language, 0)[0];
  if (typeof name !== "string")
    throw new TypeError("InvalidFontName");
  for (let i = 0;i < name.length; i++) {
    const unit = name.charCodeAt(i);
    if (unit >= 55296 && unit <= 56319) {
      const next = name.charCodeAt(++i);
      if (!(next >= 56320 && next <= 57343))
        throw new RangeError("InvalidFontName");
    } else if (unit >= 56320 && unit <= 57343)
      throw new RangeError("InvalidFontName");
  }
  const bytes = new TextEncoder().encode(name);
  if (bytes.length === 0)
    throw new RangeError("InvalidFontName");
  if (bytes.length > 4096)
    throw new RangeError("LimitExceeded");
  return { language: index, bytes };
}

// js/character-property-args.mjs
function characterPropertyArgs(properties) {
  const names = ["size", "bold", "italic"];
  if (!properties || typeof properties !== "object" || Array.isArray(properties) || Object.keys(properties).some((key) => !names.includes(key)))
    throw new TypeError("InvalidCharacterProperties");
  let mask = 0;
  const values = names.map((key, index) => {
    if (!Object.hasOwn(properties, key) || properties[key] === null)
      return 0;
    const value = properties[key];
    if (key === "size") {
      if (!Number.isInteger(value) || value < 0 || value > 409600)
        throw new RangeError("InvalidCharacterSize");
    } else if (typeof value !== "boolean")
      throw new TypeError("InvalidCharacterProperties");
    mask |= 1 << index;
    return key === "size" ? value : Number(value);
  });
  return [mask, ...values];
}

export { characterFontArgs, characterFontNameArgs, characterPropertyArgs };
