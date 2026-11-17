// web/preview/paragraph-split-command.mjs
function paragraphBreakIntent(message) {
  if (!Object.hasOwn(message, "breakBefore"))
    return null;
  if (message.kind !== "split")
    throw new Error("InvalidStructureCommand");
  if (message.anchored !== undefined && typeof message.anchored !== "boolean")
    throw new Error("InvalidAnchorMode");
  if (message.anchored === true)
    throw new Error("InvalidStructureCommand");
  if (message.breakBefore !== "page" && message.breakBefore !== "column")
    throw new Error("InvalidParagraphBreakKind");
  return message.breakBefore;
}
function applyParagraphSplit(editor, target, message, allowAnchored = false) {
  const intent = paragraphBreakIntent(message);
  if (intent !== null)
    return editor.splitParagraphWithBreak({ ...target, kind: intent });
  if (allowAnchored && message.anchored === true)
    return editor.splitParagraphAnchored(target);
  return editor.splitParagraph(target);
}

export { paragraphBreakIntent, applyParagraphSplit };
