// js/table-diagonal-directions.mjs
var TABLE_DIAGONAL_DIRECTIONS = Object.freeze(["none", "rising", "falling", "cross"]);
function hwp5DiagonalDirections(attributes) {
  if (!Number.isInteger(attributes) || attributes < 0 || attributes > 65535)
    return null;
  const slash = attributes >>> 2 & 7, back = attributes >>> 5 & 7;
  if ((attributes & 65280) !== 0 || ![0, 2].includes(slash) || ![0, 2].includes(back))
    return null;
  return slash === 2 ? back === 2 ? "cross" : "rising" : back === 2 ? "falling" : "none";
}
function hwpxDiagonalDirections(style) {
  if (!style || style.center_line !== "NONE" || !["slash_crooked", "slash_is_counter", "back_slash_crooked", "back_slash_is_counter"].every((key) => style[key] === "0") || !["NONE", "CENTER"].includes(style.slash) || !["NONE", "CENTER"].includes(style.back_slash))
    return null;
  return style.slash === "CENTER" ? style.back_slash === "CENTER" ? "cross" : "rising" : style.back_slash === "CENTER" ? "falling" : "none";
}

// js/created-table-identity.mjs
function createdTableIdentity(value) {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,19}$/.test(value))
    throw new RangeError("InvalidCreatedTableIdentity");
  const id = BigInt(value);
  if (id > 18446744073709551615n)
    throw new RangeError("InvalidCreatedTableIdentity");
  return id;
}

// js/character-effect-args.mjs
var CHARACTER_EFFECTS = Object.freeze(["emboss", "engrave", "superscript", "subscript"]);
function characterEffectMode(exclusive) {
  if (typeof exclusive !== "boolean")
    throw new TypeError("InvalidCharacterEffectMode");
  return exclusive;
}
function characterEffectArgs(effect, enabled) {
  const kind = CHARACTER_EFFECTS.indexOf(effect);
  if (kind < 0 || typeof enabled !== "boolean")
    throw new TypeError("InvalidCharacterEffect");
  return [kind, Number(enabled)];
}

// js/character-outline-args.mjs
var HWP5_CHARACTER_OUTLINE_KINDS = Object.freeze([
  "none",
  "solid",
  "dot",
  "thick",
  "dash",
  "dash-dot",
  "dash-dot-dot"
]);
function hwp5CharacterOutlineArg(kind) {
  const value = HWP5_CHARACTER_OUTLINE_KINDS.indexOf(kind);
  if (value < 0)
    throw new TypeError("InvalidCharacterOutline");
  return value;
}
function characterOutlineArg(kind) {
  const value = hwp5CharacterOutlineArg(kind);
  if (value > 1)
    throw new TypeError("InvalidCharacterOutline");
  return value;
}

export { TABLE_DIAGONAL_DIRECTIONS, hwp5DiagonalDirections, hwpxDiagonalDirections, CHARACTER_EFFECTS, characterEffectMode, characterEffectArgs, HWP5_CHARACTER_OUTLINE_KINDS, hwp5CharacterOutlineArg, characterOutlineArg, createdTableIdentity };
