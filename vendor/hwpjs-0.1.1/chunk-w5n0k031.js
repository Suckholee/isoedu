import {
  retainedTextView,
  sourceDisplayPosition,
  paragraphAlignmentValue,
  paragraphAlignmentLabel,
  validateHwp5PictureSources
} from "./chunk-jk4tbr51.js";
import {
  hwpUnitPixels,
  xmlSigned32,
  hwp5TableFlags,
  hwp5TableUnsupportedObjectFlags,
  hwp5TableGeometry,
  hwp5TablePagination,
  paragraphSpacing,
  hwp5DrawingPaintTail,
  withObservedDrawingObjectExtensions,
  hwp5DrawingGeometry,
  attachHwp5DrawingGeometry,
  strokeDashPattern,
  hwp5StrokeDisplay,
  selectNoteSourceTables,
  bindSourceNoteBodies,
  attachHwp5PageAreas,
  normalizedNotePagePolicy,
  attachHwp5CaptionGeometry,
  attachHwp5DocumentProperties,
  hwp5NumberFormat,
  storedAutomaticNumberText,
  hwp5PictureAbsentVersion,
  hwp5PictureAbsentProfile,
  hwp5PictureAbsentSourceMatches,
  hwp5PictureBaseMatches,
  hwp5PictureTailLayout
} from "./chunk-a94gkc3m.js";
import {
  HWP5_STRUCTURAL_ANCHOR_KINDS,
  validateHwp5MasterPageSources,
  validateHwp5PageControlSources,
  validateHwp5NoteSources,
  validateHwp5FormSources,
  validateHwp5FormAnchors,
  validateHwp5FormProperties,
  validateHwp5DrawingSources,
  validateHwp5DrawingComponentSources,
  validateHwp5DrawingListSources,
  validateHwp5DrawingLocalTransforms,
  validateHwp5DrawingRectangleCorners,
  validateHwp5DrawingPolygonPoints,
  validateHwp5DrawingStyleSources,
  validateHwp5PictureTailSources
} from "./chunk-x8k5ryaa.js";
import {
  validateHwp5AutomaticNumberSources,
  validateHwp5NoteShapeSources,
  validateHwp5CaptionSources,
  validateHwp5DrawingAnchors,
  validateHwp5DrawingMatrixSources,
  validateHwp5DrawingCurvePoints,
  validateHwp5DrawingLineEndpoints
} from "./chunk-rmgwrdxt.js";
import {
  validateSectionTabs
} from "./chunk-mff70c55.js";
import {
  validateTabSources,
  validateTabDefinitions
} from "./chunk-wvrkyaca.js";

// web/preview/hwpx-page-area-declarations.mjs
function attachHwpxPageAreaDeclarations(editor, content, available) {
  if (!available)
    return content;
  content.pageAreaDeclarations = [];
  content.pageAreaDeclarationErrors = [];
  const sections = new Set((content.paragraphFlows ?? []).filter((row) => row.page_area).map((row) => row.section));
  for (const section of sections) {
    try {
      const rows = editor.pageAreaDeclarations(section);
      content.pageAreaDeclarations.push(...rows.map((row) => ({ ...row, section, paragraph: row.paragraph - 1 })));
    } catch (error) {
      content.pageAreaDeclarationErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/character-underline-content.mjs
function attachCharacterUnderlines(editor, content) {
  content.characterUnderlines = null;
  content.characterUnderlinesError = null;
  content.characterUnderlineStyles = null;
  content.characterUnderlineStylesError = null;
  if (content.characterUnderlineAvailable === true && editor) {
    try {
      content.characterUnderlines = editor.characterUnderlines();
    } catch (error) {
      content.characterUnderlinesError = error.message;
    }
  }
  if (content.characterUnderlineAvailable === true && typeof editor?.characterUnderlineStyles === "function") {
    try {
      content.characterUnderlineStyles = editor.characterUnderlineStyles();
    } catch (error) {
      content.characterUnderlineStylesError = error.message;
    }
  }
  return content;
}

// web/preview/character-text-color-content.mjs
function attachCharacterTextColors(editor, content) {
  content.characterTextColors = null;
  content.characterTextColorsError = null;
  if (typeof editor?.characterTextColors === "function") {
    try {
      content.characterTextColors = editor.characterTextColors();
    } catch (error) {
      content.characterTextColorsError = error.message;
    }
  }
  return content;
}

// web/preview/character-shade-content.mjs
function attachCharacterShades(editor, content) {
  content.characterShades = null;
  content.characterShadesError = null;
  if (typeof editor?.characterShades === "function") {
    try {
      content.characterShades = editor.characterShades();
    } catch (error) {
      content.characterShadesError = error.message;
    }
  }
  return content;
}

// web/preview/character-effect-content.mjs
function attachCharacterEffects(editor, content) {
  content.characterEffects = null;
  content.characterEffectsError = null;
  if (typeof editor?.characterEffects === "function") {
    try {
      content.characterEffects = editor.characterEffects();
    } catch (error) {
      content.characterEffectsError = error?.message ?? "CharacterEffectsUnavailable";
    }
  }
  return content;
}

// web/preview/character-outline-content.mjs
function attachCharacterOutlines(editor, content) {
  content.characterOutlines = null;
  content.characterOutlinesError = null;
  if (typeof editor?.characterOutlines === "function") {
    try {
      content.characterOutlines = editor.characterOutlines();
    } catch (error) {
      content.characterOutlinesError = error?.message ?? "CharacterOutlinesUnavailable";
    }
  }
  return content;
}

// web/preview/character-font-content.mjs
function attachCharacterFonts(editor, content) {
  for (const key of [
    "fontFaces",
    "fontFaceMetadata",
    "characterFontReferences",
    "characterFontMetrics"
  ]) {
    content[key] = null;
    content[`${key}Error`] = null;
    if (typeof editor?.[key] !== "function")
      continue;
    try {
      content[key] = editor[key]();
    } catch (error) {
      content[`${key}Error`] = error.message;
    }
  }
  return content;
}

// web/preview/character-strike-content.mjs
function attachCharacterStrikes(editor, content) {
  content.characterStrikes = null;
  content.characterStrikesError = null;
  content.characterStrikeStyles = null;
  content.characterStrikeStylesError = null;
  if (content.characterStrikeAvailable === true && editor) {
    try {
      content.characterStrikes = editor.characterStrikes();
    } catch (error) {
      content.characterStrikesError = error.message;
    }
  }
  if (content.characterStrikeAvailable === true && typeof editor?.characterStrikeStyles === "function") {
    try {
      content.characterStrikeStyles = editor.characterStrikeStyles();
    } catch (error) {
      content.characterStrikeStylesError = error.message;
    }
  }
  return content;
}

// web/preview/tab-source-content.mjs
function attachTabSources(editor, content) {
  for (const paragraph of content.paragraphs) {
    paragraph.tabSources = null;
    delete paragraph.tabSourcesError;
    if (!paragraph.text.includes("\t") || paragraph.clipped)
      continue;
    try {
      if (typeof editor.tabSources !== "function")
        throw new Error("HwpxTabSourcesAbiUnavailable");
      const result = validateTabSources(editor.tabSources(paragraph.section, paragraph.paragraph + 1));
      if (result.section !== paragraph.section || result.paragraph !== paragraph.paragraph + 1)
        throw new Error("TabSourcesParagraphMismatch");
      const positions = [];
      for (let i = 0;i < paragraph.text.length; i++)
        if (paragraph.text[i] === "\t")
          positions.push(i);
      if (positions.length !== result.rows.length || result.rows.some((row, i) => row.unit !== positions[i]))
        throw new Error("TabSourcesDisplayMismatch");
      paragraph.tabSources = result.rows.map((row) => ({ ...row }));
    } catch (error) {
      paragraph.tabSourcesError = error.message;
    }
  }
  return content;
}

// web/preview/hwpx-style-content.mjs
function attachHwpxStyles(editor, content, available) {
  content.characterShapes = null;
  content.characterShapesError = null;
  if (available) {
    try {
      content.characterShapes = editor.characterShapes();
    } catch (error) {
      content.characterShapesError = error.message;
    }
  }
  for (const paragraph of content.paragraphs) {
    paragraph.characterRanges = null;
    paragraph.selectable = paragraph.editable === true;
    delete paragraph.characterRangesError;
    if (!available || paragraph.clipped)
      continue;
    try {
      const ranges = editor.characterRanges(paragraph.section, paragraph.paragraph + 1);
      if ((ranges.at(-1)?.end ?? 0) !== paragraph.text.length)
        throw new Error("CharacterDisplayLengthMismatch");
      paragraph.characterRanges = ranges;
      paragraph.selectable = paragraph.text.length > 0 || paragraph.editable === true;
    } catch (error) {
      paragraph.characterRangesError = error.message;
    }
  }
  return attachTabSources(editor, attachCharacterOutlines(editor, attachCharacterEffects(editor, attachCharacterShades(editor, attachCharacterStrikes(editor, attachCharacterFonts(editor, attachCharacterTextColors(editor, attachCharacterUnderlines(editor, content))))))));
}

// web/preview/tab-definition-content.mjs
function attachTabDefinitions(editor, content) {
  content.tabDefinitions = null;
  delete content.tabDefinitionsError;
  const selected = [];
  for (const paragraph of content.paragraphs) {
    paragraph.tabDefinition = null;
    delete paragraph.tabDefinitionError;
    if (paragraph.text.includes("\t") && !paragraph.clipped)
      selected.push(paragraph);
  }
  if (!selected.length)
    return content;
  try {
    if (typeof editor.tabDefinitions !== "function")
      throw new Error("HwpxTabDefinitionsAbiUnavailable");
    const rows = validateTabDefinitions(editor.tabDefinitions());
    content.tabDefinitions = rows;
    const byId = new Map(rows.map((row) => [row.id, row]));
    for (const paragraph of selected) {
      const id = paragraph.tabDefinitionId;
      if (!Number.isInteger(id) || id < 0 || id > 4294967295 || !byId.has(id)) {
        paragraph.tabDefinitionError = "TabDefinitionReferenceUnavailable";
        continue;
      }
      paragraph.tabDefinition = byId.get(id);
    }
  } catch (error) {
    content.tabDefinitionsError = error.message;
    for (const paragraph of selected)
      paragraph.tabDefinitionError = error.message;
  }
  return content;
}

// web/preview/section-tab-interval.mjs
function resolveSectionTabInterval(rows, section) {
  const unavailable = (error) => ({ state: "unavailable", error });
  if (!Number.isInteger(section) || section < 0 || section > 4294967295)
    return unavailable("InvalidTabSection");
  try {
    validateSectionTabs(rows);
  } catch {
    return unavailable("InvalidSectionTabSources");
  }
  const declarations = rows.filter((row) => row.section === section && Number.isInteger(row.body_owner));
  if (declarations.length !== 1)
    return unavailable(declarations.length ? "AmbiguousSectionTabDefinition" : "MissingSectionTabOwner");
  const row = declarations[0], legacy = row.tab_stop === null ? null : xmlSigned32(row.tab_stop);
  if (row.tab_stop !== null && legacy === null)
    return unavailable("InvalidSectionTabInterval");
  if (row.tab_stop_val !== null || row.tab_stop_unit !== null) {
    if (row.tab_stop_val === null || row.tab_stop_unit === null)
      return unavailable("IncompleteSectionTabInterval");
    const value = xmlSigned32(row.tab_stop_val);
    if (value === null || value <= 0)
      return unavailable("InvalidSectionTabInterval");
    const unit = row.tab_stop_unit.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
    if (unit !== "HWPUNIT")
      return unavailable("UnsupportedSectionTabUnit");
    return {
      state: "resolved",
      section,
      node: row.node,
      bodyOwner: row.body_owner,
      pixels: hwpUnitPixels(value),
      basis: "tabStopVal",
      legacyMismatch: legacy !== null && legacy / 2 !== value
    };
  }
  if (legacy === null)
    return unavailable("MissingSectionTabInterval");
  if (legacy <= 0)
    return unavailable("InvalidSectionTabInterval");
  return {
    state: "resolved",
    section,
    node: row.node,
    bodyOwner: row.body_owner,
    pixels: hwpUnitPixels(legacy) / 2,
    basis: "tabStop",
    legacyMismatch: false
  };
}

// web/preview/section-tab-content.mjs
function attachSectionTabSources(editor, content) {
  content.sectionTabSources = null;
  delete content.sectionTabSourcesError;
  const selected = [];
  for (const paragraph of content.paragraphs) {
    paragraph.sectionTabSources = null;
    paragraph.sectionTabInterval = null;
    if (paragraph.text.includes("\t") && !paragraph.clipped)
      selected.push(paragraph);
  }
  if (!selected.length)
    return content;
  try {
    if (typeof editor.sectionTabSources !== "function")
      throw new Error("HwpxSectionTabsAbiUnavailable");
    const rows = validateSectionTabs(editor.sectionTabSources());
    content.sectionTabSources = rows;
    const intervals = new Map;
    for (const paragraph of selected) {
      paragraph.sectionTabSources = rows.filter((row) => row.section === paragraph.section);
      if (!intervals.has(paragraph.section))
        intervals.set(paragraph.section, resolveSectionTabInterval(rows, paragraph.section));
      paragraph.sectionTabInterval = intervals.get(paragraph.section);
    }
  } catch (error) {
    content.sectionTabSourcesError = error.message;
  }
  return content;
}

// web/preview/hwp5-style-content.mjs
function projectHwp5Ranges(ranges, source, text) {
  const rawUnits = source.tokens.reduce((sum, token) => sum + token.raw.length / 2, 0);
  if ((ranges.at(-1)?.end ?? 0) !== rawUnits)
    throw new Error("CharacterDisplayLengthMismatch");
  const retained = retainedTextView(source);
  if (!retained && source.tokens.some((t) => t.type === "control" && t.code !== 13))
    throw new Error("UnsupportedCharacterDisplayControls");
  const fullText = retained?.text ?? source.text;
  if (text !== fullText)
    throw new Error("CharacterDisplayLengthMismatch");
  const offsets = retained?.offsets ?? [{ at: 0, source: 0 }];
  const map = (unit) => {
    const boundary = offsets.findLast((row) => row.source <= unit);
    if (!boundary)
      throw new Error("InvalidCharacterDisplayPosition");
    return Math.min(text.length, boundary.at + unit - boundary.source);
  };
  const output = [];
  let cursor = 0;
  let rawCursor = 0;
  for (const range of ranges) {
    if (range.start !== rawCursor || range.end < range.start)
      throw new Error("CharacterDisplayLengthMismatch");
    rawCursor = range.end;
    const start = map(range.start), end = map(range.end);
    if (start !== cursor || end < start)
      throw new Error("CharacterDisplayLengthMismatch");
    cursor = end;
    if (end === start) {
      if (start === text.length)
        output.push({ start, end, charShapeId: range.charShapeId });
      continue;
    }
    const previous = output.at(-1);
    if (previous?.charShapeId === range.charShapeId)
      previous.end = end;
    else
      output.push({ start, end, charShapeId: range.charShapeId });
  }
  if (cursor !== text.length)
    throw new Error("CharacterDisplayLengthMismatch");
  return output;
}
function attachHwp5Styles(editor, preview, content, openError = null) {
  content.characterShapes = null;
  content.characterShapesError = openError;
  if (editor) {
    try {
      content.characterShapes = editor.characterShapes();
      content.characterShapesError = null;
    } catch (error) {
      content.characterShapesError = error.message;
    }
  }
  for (const paragraph of content.paragraphs) {
    paragraph.characterRanges = null;
    if (!editor)
      continue;
    try {
      const source = preview.sections[paragraph.section].paragraphs[paragraph.paragraph];
      paragraph.characterRanges = projectHwp5Ranges(editor.characterRanges(paragraph.section, paragraph.paragraph), source, paragraph.text);
    } catch (error) {
      paragraph.characterRangesError = error.message;
    }
  }
  return attachCharacterOutlines(editor, attachCharacterEffects(editor, attachCharacterShades(editor, attachCharacterStrikes(editor, attachCharacterFonts(editor, attachCharacterTextColors(editor, attachCharacterUnderlines(editor, content)))))));
}

// web/preview/table-content.mjs
function attachTables(editor, preview, content) {
  content.tables = [];
  content.tableBindingsErrors = [];
  for (const paragraph of content.paragraphs)
    delete paragraph.tableCell;
  if (!editor)
    return content;
  const displayed = new Map(content.paragraphs.map((p) => [`${p.section}:${p.paragraph}`, p]));
  for (const section of preview.sections) {
    let bindings;
    try {
      bindings = editor.tableBindings(section.index);
    } catch (error) {
      content.tableBindingsErrors.push({ section: section.index, error: error.message });
      continue;
    }
    const tables = new Map, cellsByList = new Map;
    const selectedTables = content.window ? new Set(bindings.filter((binding) => displayed.has(`${section.index}:${binding.paragraph}`)).map((binding) => binding.tableNode)) : null;
    for (const binding of bindings) {
      if (selectedTables && !selectedTables.has(binding.tableNode))
        continue;
      let table = tables.get(binding.tableNode);
      if (!table) {
        table = {
          section: section.index,
          tableNode: binding.tableNode,
          rows: binding.rows,
          columns: binding.columns,
          cells: [],
          partial: false
        };
        tables.set(binding.tableNode, table);
      }
      const cellKey = `${binding.tableNode}:${binding.listNode}`;
      let cell = cellsByList.get(cellKey);
      if (!cell) {
        cell = {
          listNode: binding.listNode,
          row: binding.row,
          column: binding.column,
          rowSpan: binding.rowSpan,
          columnSpan: binding.columnSpan,
          width: binding.width,
          height: binding.height,
          paragraphs: []
        };
        cellsByList.set(cellKey, cell);
        table.cells.push(cell);
      }
      const paragraph = displayed.get(`${section.index}:${binding.paragraph}`);
      if (!paragraph) {
        table.partial = true;
        continue;
      }
      if (paragraph.clipped)
        table.partial = true;
      cell.paragraphs.push(binding.paragraph);
      paragraph.tableCell = {
        tableNode: binding.tableNode,
        listNode: binding.listNode,
        row: binding.row,
        column: binding.column,
        rowSpan: binding.rowSpan,
        columnSpan: binding.columnSpan
      };
    }
    content.tables.push(...tables.values());
  }
  return content;
}

// web/preview/table-placements-content.mjs
function attachTablePlacements(editor, sections, content, paragraphOffset = 0) {
  content.tablePlacementsErrors = [];
  for (const section of sections) {
    let placements;
    try {
      placements = editor.tablePlacements(section.index);
    } catch (error) {
      content.tablePlacementsErrors.push({ section: section.index, error: error.message });
      continue;
    }
    const tables = new Map(content.tables.filter((t) => t.section === section.index).map((t) => [t.tableNode, t]));
    for (const placement of placements) {
      const table = tables.get(placement.tableNode);
      if (!table)
        continue;
      table.hostParagraph = placement.paragraph + paragraphOffset;
      if (Object.hasOwn(placement, "anchorUnit"))
        table.anchorUnit = placement.anchorUnit;
      table.parentTableNode = placement.parentTableNode;
      table.parentListNode = placement.parentListNode;
    }
  }
  return content;
}

// web/preview/hwp5-table-layout-content.mjs
function attachHwp5TableLayoutSources(editor, content) {
  content.tableLayoutSourceErrors = [];
  for (const table of content.tables)
    delete table.layoutSource;
  if (!editor)
    return content;
  const sections = new Set(content.tables.map((table) => table.section));
  for (const section of sections) {
    try {
      const sources = editor.tableLayoutSources(section), byNode = new Map;
      for (const source of sources) {
        if (byNode.has(source.table_record_node))
          throw new Error("AmbiguousTableLayoutSource");
        byNode.set(source.table_record_node, source);
      }
      const tables = content.tables.filter((table) => table.section === section), attachments = [];
      if (sources.length !== tables.length)
        throw new Error("IncompleteTableLayoutInventory");
      for (const table of tables) {
        const source = byNode.get(table.tableNode);
        if (!source || source.rows !== table.rows || source.columns !== table.columns)
          throw new Error("TableLayoutSourceBindingMismatch");
        if (!Number.isInteger(table.hostParagraph) || table.hostParagraph < 0 || !content.paragraphs.some((row) => row.section === section && row.paragraph === table.hostParagraph))
          throw new Error("MissingTableLayoutHost");
        attachments.push({ table, source });
      }
      for (const { table, source } of attachments)
        table.layoutSource = source;
    } catch (error) {
      content.tableLayoutSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-cell-layout-content.mjs
function attachHwp5CellLayoutSources(editor, content) {
  content.cellLayoutSourceErrors = [];
  for (const table of content.tables)
    for (const cell of table.cells) {
      delete cell.layoutSource;
      delete cell.sourceMargin;
      delete cell.sourceVerticalAlignment;
      delete cell.sourceLineWrap;
      delete cell.sourceTextDirection;
    }
  if (!editor)
    return content;
  for (const section of new Set(content.tables.map((table) => table.section))) {
    try {
      const sources = editor.cellLayoutSources(section), byList = new Map;
      for (const row of sources) {
        if (byList.has(row.list_node))
          throw new Error("AmbiguousCellLayoutSource");
        byList.set(row.list_node, row);
      }
      const selected = content.tables.filter((table) => table.section === section), attachments = [], seen = new Set;
      for (const table of selected)
        for (const cell of table.cells) {
          const row = byList.get(cell.listNode);
          if (!row || row.table_record_node !== table.tableNode || seen.has(cell.listNode))
            throw new Error("CellLayoutSourceBindingMismatch");
          seen.add(cell.listNode);
          attachments.push({ cell, row });
        }
      if (seen.size !== sources.length)
        throw new Error("IncompleteCellLayoutInventory");
      for (const { cell, row } of attachments) {
        cell.layoutSource = row;
        cell.sourceMargin = {
          has_margin: row.has_margin,
          margin: [...row.margins],
          header: row.header
        };
        cell.sourceVerticalAlignment = row.vertical_alignment;
        cell.sourceLineWrap = row.line_wrap;
        cell.sourceTextDirection = row.text_direction;
      }
    } catch (error) {
      content.cellLayoutSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-table-anchor-content.mjs
function attachHwp5TableAnchors(editor, content) {
  content.tableAnchorErrors = [];
  for (const table of content.tables) {
    delete table.anchorUnit;
    delete table.anchorSource;
  }
  if (!editor)
    return content;
  const paragraphs = new Map(content.paragraphs.map((row) => [`${row.section}:${row.paragraph}`, row]));
  for (const section of new Set(content.tables.map((row) => row.section))) {
    try {
      const anchors = editor.tableAnchors(section), tables = content.tables.filter((row) => row.section === section), byNode = new Map;
      for (const row of anchors) {
        if (byNode.has(row.table_record_node))
          throw new Error("AmbiguousTableDisplayAnchor");
        byNode.set(row.table_record_node, row);
      }
      if (anchors.length !== tables.length)
        throw new Error("IncompleteTableDisplayAnchors");
      const prepared = [];
      for (const table of tables) {
        const row = byNode.get(table.tableNode), paragraph = paragraphs.get(`${section}:${table.hostParagraph}`);
        if (!row || row.paragraph !== table.hostParagraph || row.control_node !== table.layoutSource?.table_node || !paragraph || paragraph.clipped)
          throw new Error("TableDisplayAnchorBindingMismatch");
        const unit = sourceDisplayPosition(row.current_unit, paragraph.sourceOffsets, paragraph.text.length);
        const end = sourceDisplayPosition(row.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
        if (end !== unit + 1 || paragraph.text[unit] !== "￼")
          throw new Error("TableDisplayAnchorMismatch");
        prepared.push({ table, row, unit });
      }
      for (const { table, row, unit } of prepared) {
        table.anchorUnit = unit;
        table.anchorSource = row;
      }
    } catch (error) {
      content.tableAnchorErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-table-geometry-content.mjs
function attachHwp5TableGeometry(content) {
  content.tableGeometryErrors = [];
  for (const table of content.tables) {
    delete table.sourceGeometry;
    delete table.pagination;
    try {
      if (!table.layoutSource)
        throw new Error("MissingTableLayoutSource");
      const geometry = hwp5TableGeometry(table.layoutSource), pagination = hwp5TablePagination(table.layoutSource);
      table.sourceGeometry = geometry;
      table.pagination = pagination;
    } catch (error) {
      const raw = table.layoutSource?.table_flags;
      const decoded = Number.isInteger(raw) && raw >= 0 && raw <= 4294967295 ? hwp5TableFlags(raw) : null;
      content.tableGeometryErrors.push({
        section: table.section,
        tableNode: table.tableNode,
        error: error.message,
        rawTableFlags: decoded ? raw : null,
        unknownTableFlags: decoded?.unknown_flags ?? null,
        rawObjectFlags: hwp5TableUnsupportedObjectFlags(table.layoutSource?.object_flags) === null ? null : table.layoutSource.object_flags,
        unsupportedObjectFlags: hwp5TableUnsupportedObjectFlags(table.layoutSource?.object_flags),
        objectExtraBytes: table.layoutSource?.object_extra_bytes ?? null,
        tableExtraBytes: table.layoutSource?.table_extra_bytes ?? null
      });
    }
  }
  return content;
}

// web/preview/hwp5-window-table-sources.mjs
function hwp5WindowTableSourceEditor(editor, content) {
  const scoped = Object.create(editor);
  const select = (section, query, key, selected, error) => {
    const rows = query(section), seen = new Set;
    for (const row of rows) {
      if (seen.has(row[key]))
        throw new Error(error);
      seen.add(row[key]);
    }
    return rows.filter((row) => selected.has(row[key]));
  };
  const tables = (section) => content.tables.filter((row) => row.section === section);
  const nodes = (section) => new Set(tables(section).map((row) => row.tableNode));
  scoped.tableLayoutSources = (section) => select(section, (index) => editor.tableLayoutSources(index), "table_record_node", nodes(section), "AmbiguousTableLayoutSource");
  scoped.tableAnchors = (section) => select(section, (index) => editor.tableAnchors(index), "table_record_node", nodes(section), "AmbiguousTableDisplayAnchor");
  scoped.cellLayoutSources = (section) => select(section, (index) => editor.cellLayoutSources(index), "list_node", new Set(tables(section).flatMap((row) => row.cells.map((cell) => cell.listNode))), "AmbiguousCellLayoutSource");
  return scoped;
}

// web/preview/hwp5-table-border-content.mjs
function attachHwp5TableBorderSources(editor, content) {
  content.hwp5BorderFillSources = null;
  content.hwp5BorderFillSourceError = null;
  if (!editor || !content.tables?.length)
    return content;
  try {
    if (typeof editor.borderFillSources !== "function")
      throw new Error("Hwp5BorderFillSourcesAbiUnavailable");
    content.hwp5BorderFillSources = editor.borderFillSources();
  } catch (error) {
    content.hwp5BorderFillSourceError = error.message;
  }
  return content;
}

// web/preview/hwp5-table-content.mjs
function attachHwp5Tables(editor, preview, content) {
  attachTables(editor, preview, content);
  attachHwp5TableBorderSources(editor, content);
  if (!editor) {
    content.tablePlacementsErrors = [];
    return content;
  }
  attachTablePlacements(editor, preview.sections, content);
  const sources = content.window ? hwp5WindowTableSourceEditor(editor, content) : editor;
  return attachHwp5TableGeometry(attachHwp5TableAnchors(sources, attachHwp5CellLayoutSources(sources, attachHwp5TableLayoutSources(sources, content))));
}

// web/preview/paragraph-format-options.mjs
function paragraphFormatOptions(ids, shapes = []) {
  const byId = new Map(shapes.map((shape) => [shape.id, shape]));
  return ids.map((id) => {
    const shape = byId.get(id), parts = [`ID ${id}`];
    const alignment = paragraphAlignmentLabel(shape?.alignment);
    if (alignment)
      parts.push(alignment);
    if (Number.isInteger(shape?.indent))
      parts.push(`들여쓰기 ${shape.indent} HWPUNIT`);
    const { kind: spacingKind, value: spacingValue } = paragraphSpacing(shape);
    if (spacingKind === 0 && Number.isInteger(spacingValue))
      parts.push(`줄 간격 ${spacingValue}%`);
    return { value: String(id), label: parts.join(" · ") };
  });
}

// web/preview/hwp5-paragraph-geometry.mjs
function hwp5ParagraphGeometry(shape) {
  return shape ? { ...shape, spacingFormat: "hwp5" } : shape;
}

// web/preview/hwp5-paragraph-formats.mjs
function attachHwp5ParagraphFormats(editor, content, available) {
  content.paragraphFormatAvailable = false;
  if (!editor || content.readOnly || !available)
    return content;
  content.paragraphShapeCount = editor.paragraphShapeCount();
  let shapes = null;
  try {
    shapes = editor.paragraphShapes();
  } catch (error) {
    content.paragraphDisplayError = error.message;
  }
  content.paragraphShapeOptions = paragraphFormatOptions(Array.from({ length: content.paragraphShapeCount }, (_, id) => id), shapes ?? []);
  for (const paragraph of content.paragraphs) {
    if (!paragraph.clipped) {
      paragraph.paraShapeId = editor.paragraphShapeId(paragraph.section, paragraph.paragraph);
      if (shapes) {
        const shape = shapes[paragraph.paraShapeId];
        paragraph.paragraphShape = hwp5ParagraphGeometry(shape);
      }
    }
  }
  content.paragraphFormatAvailable = true;
  return content;
}

// web/preview/hwpx-paragraph-geometry.mjs
function hwpxParagraphGeometry(shape) {
  const unitValue = (measure) => measure && (measure.unit == null || measure.unit === "HWPUNIT") ? measure.value : undefined;
  const marginValue = (measure) => measure && (measure.unit == null || measure.unit === "HWPUNIT") ? measure.value : undefined;
  const spacingKinds = { PERCENT: 0, FIXED: 1, BETWEEN_LINES: 2, AT_LEAST: 3 };
  const kind = Object.hasOwn(spacingKinds, shape.spacing_type) ? spacingKinds[shape.spacing_type] : undefined;
  const spacing = kind === 0 ? shape.spacing?.value : unitValue(shape.spacing);
  return {
    spacingFormat: "hwpx",
    ...Object.hasOwn(shape, "break_settings") ? { breakSettings: shape.break_settings === null ? null : { ...shape.break_settings } } : {},
    alignment: paragraphAlignmentValue(shape.horizontal),
    indent: marginValue(shape.margins[0]),
    left: marginValue(shape.margins[1]),
    right: marginValue(shape.margins[2]),
    before: marginValue(shape.margins[3]),
    after: marginValue(shape.margins[4]),
    legacySpacingKind: kind,
    legacySpacing: spacing
  };
}

// web/preview/hwpx-paragraph-formats.mjs
function attachHwpxParagraphFormats(editor, content, available) {
  content.paragraphFormatAvailable = false;
  for (const paragraph of content.paragraphs)
    delete paragraph.tabDefinitionId;
  if (!editor || !available)
    return content;
  const ids = editor.paragraphShapeIds();
  content.paragraphShapeIds = ids;
  content.paragraphShapeCount = ids.length;
  let shapes = null;
  if (typeof editor.paragraphShapes === "function") {
    try {
      shapes = new Map(editor.paragraphShapes().map((shape) => [shape.id, shape]));
    } catch (error) {
      content.paragraphShapesError = error.message;
    }
  }
  const sections = new Map;
  content.paragraphShapeOptions = paragraphFormatOptions(ids, shapes ? Array.from(shapes.values(), (shape) => ({ id: shape.id, ...hwpxParagraphGeometry(shape) })) : []);
  for (const paragraph of content.paragraphs) {
    if (paragraph.clipped)
      continue;
    if (!sections.has(paragraph.section))
      sections.set(paragraph.section, editor.paragraphShapeRefs(paragraph.section));
    const refs = sections.get(paragraph.section), index = paragraph.paragraph + 1 - refs.firstParagraph;
    if (index < 0 || index >= refs.ids.length)
      throw new Error("ParagraphDisplayBindingMismatch");
    paragraph.paraShapeId = refs.ids[index];
    if (shapes) {
      const shape = shapes.get(paragraph.paraShapeId);
      if (!shape)
        throw new Error("ParagraphDisplayResourceMismatch");
      paragraph.paragraphShape = hwpxParagraphGeometry(shape);
      paragraph.tabDefinitionId = shape.tab_pr_id;
    }
  }
  content.paragraphFormatAvailable = true;
  return content;
}

// web/preview/hwp5-formulas-content.mjs
function attachHwp5Formulas(editor, content, available) {
  content.formulas = [];
  content.formulaErrors = [];
  content.formulaDefinitionAvailable = Boolean(editor) && available === true;
  if (!editor)
    return content;
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    try {
      for (const row of editor.formulaSources(section))
        content.formulas.push({
          section,
          beginElement: row.source_node,
          owner: { paragraph: row.paragraph },
          formula: row.formula,
          last_result: row.last_result,
          derived: row.derived
        });
    } catch (error) {
      content.formulaErrors.push({ section, error: error.message || String(error) });
    }
  }
  return content;
}

// web/preview/hwp5-form-content.mjs
function attachHwp5Forms(editor, content) {
  content.hwp5FormSourcesAvailable = editor?.supportsFormSources?.() === true;
  content.hwp5Forms = [];
  content.hwp5FormErrors = [];
  if (!content.hwp5FormSourcesAvailable)
    return;
  for (const section of new Set(content.paragraphs.map((p) => p.section))) {
    try {
      const sources = validateHwp5FormSources(editor.formSources(section));
      const anchors = validateHwp5FormAnchors(editor.formAnchors(section)), rows = [];
      if (sources.length !== anchors.length)
        throw Error("IncompleteHwp5FormAnchors");
      const byControl = new Map(anchors.map((anchor) => [anchor.control_node, anchor])), paragraphs = new Map;
      for (const p of content.paragraphs)
        if (p.section === section) {
          if (paragraphs.has(p.paragraph))
            throw Error("AmbiguousCurrentHwp5FormOwner");
          paragraphs.set(p.paragraph, p);
        }
      for (const source of sources) {
        const anchor = byControl.get(source.control_node);
        if (!anchor || anchor.object_node !== source.object_node || anchor.source_unit !== source.source_unit)
          throw Error("AmbiguousHwp5FormAnchor");
        const p = paragraphs.get(anchor.paragraph);
        if (!p || p.clipped)
          throw Error("MissingCurrentHwp5FormOwner");
        const unit = sourceDisplayPosition(anchor.current_unit, p.sourceOffsets, p.text.length);
        const end = sourceDisplayPosition(anchor.current_unit + 8, p.sourceOffsets, p.text.length);
        if (p.text[unit] !== "￼" || end !== unit + 1)
          throw Error("InvalidCurrentHwp5FormAnchor");
        rows.push({
          section,
          controlNode: source.control_node,
          formNode: source.object_node,
          paragraph: anchor.paragraph,
          anchorUnit: unit,
          source,
          anchor
        });
      }
      content.hwp5Forms.push(...rows);
    } catch (error) {
      content.hwp5FormErrors.push({ section, error: error.message });
    }
  }
}

// web/preview/hwp5-form-property-content.mjs
function attachHwp5FormProperties(editor, content) {
  content.hwp5FormPropertiesAvailable = editor?.supportsFormProperties?.() === true;
  content.hwp5FormPropertyErrors = [];
  for (const form of content.hwp5Forms ?? [])
    form.properties = null;
  if (!content.hwp5FormPropertiesAvailable)
    return;
  const sections = new Map;
  for (const form of content.hwp5Forms ?? []) {
    const rows = sections.get(form.section) ?? [];
    rows.push(form);
    sections.set(form.section, rows);
  }
  for (const [section, forms] of sections) {
    try {
      const properties = validateHwp5FormProperties(editor.formProperties(section));
      const byControl = new Map(properties.map((row) => [row.control_node, row]));
      if (properties.length !== forms.length)
        throw Error("IncompleteHwp5FormProperties");
      const selected = forms.map((form) => {
        const row = byControl.get(form.controlNode);
        if (!row || row.object_node !== form.formNode || row.known_nodes + row.deferred_nodes !== form.source.property_nodes)
          throw Error("MismatchedHwp5FormProperties");
        return row;
      });
      forms.forEach((form, index) => {
        form.properties = selected[index];
      });
    } catch (error) {
      content.hwp5FormPropertyErrors.push({ section, error: error.message });
    }
  }
}

// web/preview/table-caption-content.mjs
function attachTableCaptions(editor, sections, content) {
  content.tableCaptionBindingErrors = [];
  for (const paragraph of content.paragraphs)
    delete paragraph.tableCaption;
  for (const table of content.tables)
    table.captionParagraphs = [];
  const paragraphs = new Map(content.paragraphs.map((p) => [`${p.section}:${p.paragraph}`, p]));
  const tables = new Map(content.tables.map((t) => [`${t.section}:${t.tableNode}`, t]));
  for (const { index } of sections) {
    let bindings;
    try {
      bindings = editor.tableCaptionBindings(index);
    } catch (error) {
      content.tableCaptionBindingErrors.push({ section: index, error: error.message });
      continue;
    }
    for (const { paragraph: nativeParagraph, owner } of bindings) {
      const id = nativeParagraph - 1;
      const table = tables.get(`${index}:${owner.table_node}`);
      const paragraph = paragraphs.get(`${index}:${id}`);
      if (!table) {
        if (content.window && !paragraph)
          continue;
        content.tableCaptionBindingErrors.push({
          section: index,
          paragraph: id,
          error: "MissingCaptionTable"
        });
        continue;
      }
      if (!paragraph) {
        table.partial = true;
        continue;
      }
      if (paragraph.clipped)
        table.partial = true;
      table.captionParagraphs.push(id);
      paragraph.tableCaption = {
        tableNode: owner.table_node,
        captionNode: owner.caption_node,
        listNode: owner.list_node
      };
    }
  }
  return content;
}

// web/preview/hwpx-table-content.mjs
function attachHwpxTables(editor, content) {
  const sections = [...new Set(content.paragraphs.map((p) => p.section))].map((index) => ({
    index
  }));
  const displayed = {
    tableBindings(section) {
      return editor.tableBindings(section).map((row) => ({ ...row, paragraph: row.paragraph - 1 }));
    }
  };
  attachTables(displayed, { sections }, content);
  attachTablePlacements(editor, sections, content, -1);
  attachTableCaptions(editor, sections, content);
  content.tablePaginationErrors = [];
  content.tableGeometryErrors = [];
  content.tableCellMarginErrors = [];
  content.tableCaptionErrors = [];
  for (const table of content.tables) {
    for (const cell of table.cells) {
      try {
        cell.sourceMargin = editor.tableCellMargin(table.section, cell.listNode);
        cell.sourceVerticalAlignment = cell.sourceMargin.vertical_alignment;
        cell.sourceLineWrap = cell.sourceMargin.line_wrap;
        cell.sourceTextDirection = cell.sourceMargin.text_direction;
      } catch (error) {
        content.tableCellMarginErrors.push({
          section: table.section,
          listNode: cell.listNode,
          error: error.message
        });
      }
    }
    try {
      table.sourceGeometry = editor.tableGeometry(table.section, table.tableNode);
    } catch (error) {
      content.tableGeometryErrors.push({
        section: table.section,
        tableNode: table.tableNode,
        error: error.message
      });
    }
    try {
      table.sourceCaption = editor.tableCaption(table.section, table.tableNode);
    } catch (error) {
      content.tableCaptionErrors.push({
        section: table.section,
        tableNode: table.tableNode,
        error: error.message
      });
    }
  }
  for (const section of sections) {
    try {
      const rows = editor.tablePagination(section.index);
      const tables = new Map(content.tables.filter((table) => table.section === section.index).map((table) => [table.tableNode, table]));
      for (const row of rows) {
        const table = tables.get(row.table_node);
        if (table)
          table.pagination = row.values;
      }
    } catch (error) {
      content.tablePaginationErrors.push({ section: section.index, error: error.message });
    }
  }
  return content;
}

// web/preview/hwpx-table-border-content.mjs
function attachHwpxTableBorders(editor, content, available) {
  if (!available)
    return content;
  content.tableBorderSources = [];
  content.tableBorderSourceErrors = [];
  const sections = new Set((content.tables ?? []).map((table) => table.section));
  let batch;
  if (typeof editor.tableBorderSourcesBatch === "function") {
    batch = new Map;
    const selected = [...sections], limit = editor.tableBorderSourcesBatchMaxSections ?? Math.max(1, selected.length);
    if (!Number.isInteger(limit) || limit < 1) {
      for (const section of selected)
        batch.set(section, { section, error: "InvalidTableBorderBatchLimit" });
    } else
      for (let start = 0;start < selected.length; start += limit) {
        const chunk = selected.slice(start, start + limit);
        try {
          for (const entry of editor.tableBorderSourcesBatch(chunk))
            batch.set(entry.section, entry);
        } catch (error) {
          for (const section of chunk)
            batch.set(section, { section, error: error.message });
        }
      }
  }
  for (const section of sections) {
    try {
      const entry = batch?.get(section);
      if (batch && !entry)
        throw new Error("MissingTableBorderBatchSection");
      if (entry?.error)
        throw new Error(entry.error);
      const report = entry ? entry.value : editor.tableBorderSources(section);
      const selected = [];
      const byList = new Map, used = new Set;
      for (const row of report.cells) {
        const key = `${row.table_node}:${row.list_node}`;
        byList.set(key, byList.has(key) ? null : row);
      }
      for (const table of content.tables.filter((t) => t.section === section))
        for (const cell of table.cells) {
          const key = `${table.tableNode}:${cell.listNode}`, row = byList.get(key);
          if (!row || used.has(key))
            throw new Error("TableBorderSourceOwnerMismatch");
          used.add(key);
          selected.push(row);
        }
      content.tableBorderSources.push({
        section,
        sourceOnly: true,
        cells: selected,
        styles: report.styles
      });
    } catch (error) {
      content.tableBorderSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/curve-owner-content.mjs
function queryCurveOwner(editor, section, node, root) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  try {
    if (typeof editor.curveOwner !== "function")
      throw new Error("HwpxCurveOwnerAbiUnavailable");
    if (![section, node, root].every(uint) || root >= node)
      throw new Error("CurveOwnerBindingMismatch");
    const result = editor.curveOwner(section, node), owner = result?.owner;
    if (result?.sourceOnly !== true || result.node !== node || !owner || owner.anchor_node !== root || !uint(owner.paragraph) || owner.paragraph < 1 || !uint(owner.anchor_unit))
      throw new Error("CurveOwnerBindingMismatch");
    return { state: "bound", owner };
  } catch (error) {
    return { state: "unavailable", error: error.message };
  }
}

// web/preview/curve-text-content.mjs
function readCurveTextSource(editor, section, node, bindings, paragraphs) {
  let source;
  try {
    if (typeof editor.curveGeometry !== "function")
      return { state: "not-curve" };
    source = editor.curveGeometry(section, node);
  } catch (error) {
    if (["InvalidCurveGeometryNode", "HwpxCurveGeometryAbiUnavailable"].includes(error.message))
      return { state: "not-curve" };
    return { state: "unavailable", error: error.message };
  }
  const fail = (error) => ({ state: "unavailable", error });
  if (source?.sourceOnly !== true || source.node !== node || !source.text || !Array.isArray(bindings) || !bindings.length || bindings.some((row) => row.drawingNode !== node || (row.kind ?? "text") !== "text" || row.listNode !== source.text.list_node || row.textNode !== source.text.node))
    return fail("CurveTextSourceBindingMismatch");
  const current = queryCurveOwner(editor, section, node, source.common?.group_context?.root_anchor);
  if (current.state !== "bound")
    return current;
  const host = paragraphs.get(`${section}:${current.owner.paragraph - 1}`);
  if (!host || host.clipped || typeof host.text !== "string" || host.text[current.owner.anchor_unit] !== "￼")
    return fail("CurveTextHostBindingMismatch");
  return {
    state: "bound",
    item: {
      section,
      curveNode: node,
      hostParagraph: current.owner.paragraph - 1,
      anchorUnit: current.owner.anchor_unit,
      owner: current.owner,
      source
    }
  };
}

// web/preview/drawing-text-content.mjs
function attachDrawingTextBindings(editor, content) {
  content.drawingTextBindingErrors = [];
  content.drawingTextSnapshotErrors = [];
  content.drawings = [];
  content.curveTextSources = [];
  content.curveTextSourceErrors = [];
  const paragraphs = new Map(content.paragraphs.map((paragraph) => [
    `${paragraph.section}:${paragraph.paragraph}`,
    paragraph
  ]));
  for (const paragraph of content.paragraphs) {
    delete paragraph.drawingText;
    delete paragraph.drawingCaption;
  }
  for (const section of new Set(content.paragraphs.map((paragraph) => paragraph.section))) {
    let usingRequested = false;
    try {
      const allRows = editor.drawingTextBindings(section);
      const selectedDrawings = content.window ? new Set(allRows.filter((row) => paragraphs.has(`${section}:${row.paragraph - 1}`)).map((row) => row.drawingNode)) : null;
      const rows = selectedDrawings ? allRows.filter((row) => selectedDrawings.has(row.drawingNode)) : allRows;
      if (rows.some((row) => !paragraphs.has(`${section}:${row.paragraph - 1}`)))
        throw new Error("DrawingTextDisplayBindingMismatch");
      const nodes = [...new Set(rows.map((row) => row.drawingNode))];
      let requested = null, batch = null;
      if (nodes.length && typeof editor.drawingTextRequested === "function") {
        usingRequested = true;
        const limit = editor.drawingTextRequestedMaxNodes;
        if (!Number.isInteger(limit) || limit < 1 || limit > 1024)
          throw Error("InvalidDrawingTextRequestLimit");
        requested = new Map;
        for (let start = 0;start < nodes.length; start += limit) {
          const chunk = nodes.slice(start, start + limit);
          const result = editor.drawingTextRequested(section, chunk);
          if (!Array.isArray(result) || result.length !== chunk.length)
            throw Error("InvalidDrawingTextRequested");
          for (let index = 0;index < chunk.length; index++) {
            const entry = result[index];
            if (!entry || entry.node !== chunk[index] || requested.has(entry.node))
              throw Error("InvalidDrawingTextRequested");
            if (Object.hasOwn(entry, "source") === Object.hasOwn(entry, "unavailable"))
              throw Error("InvalidDrawingTextRequested");
            if (Object.hasOwn(entry, "unavailable") && typeof entry.unavailable !== "string")
              throw Error("InvalidDrawingTextRequested");
            if (entry.unavailable === "OutOfMemory")
              throw Error("OutOfMemory");
            requested.set(entry.node, entry);
          }
        }
      } else if (rows.length && typeof editor.drawingTextSnapshots === "function") {
        try {
          batch = new Map(editor.drawingTextSnapshots(section).map((row) => [row.drawing_node, row]));
        } catch {}
      }
      for (const row of rows) {
        const paragraph = paragraphs.get(`${section}:${row.paragraph - 1}`);
        if (row.kind === "caption")
          paragraph.drawingCaption = {
            drawingNode: row.drawingNode,
            captionNode: row.textNode,
            listNode: row.listNode
          };
        else
          paragraph.drawingText = {
            drawingNode: row.drawingNode,
            textNode: row.textNode,
            listNode: row.listNode
          };
      }
      for (const drawingNode of nodes) {
        try {
          const entry = requested?.get(drawingNode);
          if (requested && !entry)
            throw Error("InvalidDrawingTextRequested");
          if (entry && Object.hasOwn(entry, "unavailable"))
            throw Error(entry.unavailable);
          const source = requested ? entry.source : batch?.get(drawingNode) ?? editor.drawingTextSnapshot(section, drawingNode);
          if (source.drawing_node !== drawingNode || !paragraphs.has(`${section}:${source.paragraph - 1}`))
            throw new Error("DrawingTextDisplayBindingMismatch");
          content.drawings.push({
            section,
            drawingNode,
            hostParagraph: source.paragraph - 1,
            anchorUnit: source.anchor_unit,
            source
          });
        } catch (error) {
          if (usingRequested && error.message === "OutOfMemory")
            throw error;
          if (error.message === "UnsupportedDrawingTextAnchor") {
            const curve = readCurveTextSource(editor, section, drawingNode, rows.filter((row) => row.drawingNode === drawingNode), paragraphs);
            if (curve.state === "bound") {
              content.curveTextSources.push(curve.item);
              continue;
            }
            if (curve.state === "unavailable") {
              if (usingRequested && curve.error === "OutOfMemory")
                throw Error("OutOfMemory");
              content.curveTextSourceErrors.push({
                section,
                curveNode: drawingNode,
                error: curve.error
              });
            }
          }
          content.drawingTextSnapshotErrors.push({ section, drawingNode, error: error.message });
        }
      }
    } catch (error) {
      if (usingRequested && error.message === "OutOfMemory")
        throw error;
      content.drawingTextBindingErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/ellipse-content.mjs
function attachEllipses(editor, content, available) {
  if (!available)
    return content;
  content.ellipses = [];
  content.ellipseSourceErrors = [];
  for (const section of new Set(content.paragraphs.map((p) => p.section))) {
    try {
      const rows = editor.ellipseSources(section);
      for (const source of rows) {
        const owner = content.paragraphs.find((p) => p.section === section && p.paragraph === source.owner.paragraph - 1);
        if (!owner && content.window)
          continue;
        if (!owner)
          throw new Error("EllipseDisplayBindingMismatch");
        content.ellipses.push({ section, source });
      }
    } catch (error) {
      content.ellipseSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwpx-picture-content.mjs
function attachHwpxPictures(editor, content) {
  content.pictures = [];
  content.pictureErrors = [];
  const sections = [...new Set(content.paragraphs.map((paragraph) => paragraph.section))];
  const displayed = content.window ? new Set(content.paragraphs.map((paragraph) => `${paragraph.section}:${paragraph.paragraph}`)) : null;
  for (const section of sections) {
    let sites;
    try {
      sites = editor.pictureSites(section);
    } catch (error) {
      content.pictureErrors.push({ section, error: error.message });
      continue;
    }
    let owners = null, ownerBatchError = null;
    if (typeof editor.pictureOwners === "function" && sites.some((site) => site.state === "located" || site.state === "unsupported_anchor")) {
      try {
        owners = new Map(editor.pictureOwners(section).map((row) => [row.pictureNode, row]));
      } catch (error) {
        if (error.message !== "HwpxPictureOwnersAbiUnavailable")
          ownerBatchError = error.message;
      }
    }
    for (const site of sites) {
      const picture = {
        ...site,
        section,
        paragraph: site.paragraph === null ? null : site.paragraph - 1,
        owner: null,
        ownerError: null,
        geometry: null,
        geometryError: null,
        sizeProtected: null,
        sizeProtectionError: null,
        position: null,
        positionError: null,
        flow: null,
        flowError: null,
        crop: null,
        cropError: null,
        transform: null,
        transformError: null,
        renderingCorners: null,
        renderingCornersError: null
      };
      if (site.state === "located" || site.state === "unsupported_anchor") {
        try {
          if (ownerBatchError)
            throw new Error(ownerBatchError);
          let owner;
          if (owners) {
            const row = owners.get(site.pictureNode);
            if (!row)
              throw new Error("MissingPictureOwnerBatchRow");
            if (row.error !== null)
              throw new Error(row.error);
            owner = row.owner;
          } else {
            if (typeof editor.pictureOwner !== "function")
              throw new Error("HwpxPictureOwnerAbiUnavailable");
            owner = editor.pictureOwner(section, site.pictureNode);
          }
          picture.owner = { ...owner, paragraph: owner.paragraph - 1 };
        } catch (error) {
          picture.ownerError = error.message;
        }
      }
      const host = picture.owner?.paragraph ?? picture.paragraph;
      if (displayed && host !== null && !displayed.has(`${section}:${host}`))
        continue;
      if (site.state === "located" || picture.owner !== null) {
        try {
          if (typeof editor.pictureFlow !== "function")
            throw new Error("HwpxPictureFlowAbiUnavailable");
          picture.flow = editor.pictureFlow(section, site.pictureNode);
        } catch (error) {
          picture.flowError = error.message;
        }
        try {
          if (typeof editor.picturePosition !== "function")
            throw new Error("HwpxPicturePositionAbiUnavailable");
          picture.position = editor.picturePosition(section, site.pictureNode);
        } catch (error) {
          picture.positionError = error.message;
        }
        try {
          picture.geometry = editor.pictureGeometry(section, site.pictureNode);
        } catch (error) {
          picture.geometryError = error.message;
        }
        try {
          if (typeof editor.pictureSizeProtection !== "function")
            throw new Error("HwpxPictureSizeProtectionAbiUnavailable");
          picture.sizeProtected = editor.pictureSizeProtection(section, site.pictureNode);
        } catch (error) {
          picture.sizeProtectionError = error.message;
        }
        try {
          picture.crop = editor.pictureCrop(section, site.pictureNode);
        } catch (error) {
          picture.cropError = error.message;
        }
        try {
          picture.transform = editor.pictureTransform(section, site.pictureNode);
        } catch (error) {
          picture.transformError = error.message;
        }
        try {
          if (typeof editor.pictureRenderingCorners !== "function")
            throw new Error("HwpxPictureCornersAbiUnavailable");
          picture.renderingCorners = editor.pictureRenderingCorners(section, site.pictureNode);
        } catch (error) {
          picture.renderingCornersError = error.message;
        }
      }
      picture.groupResizeAvailable = false;
      picture.groupResizeError = null;
      if (picture.owner && picture.owner.anchorNode !== site.pictureNode) {
        try {
          if (typeof editor.groupedPictureResizeAvailable !== "function")
            throw new Error("HwpxGroupedPictureResizeAbiUnavailable");
          picture.groupResizeAvailable = editor.groupedPictureResizeAvailable(section, site.pictureNode) === true;
        } catch (error) {
          picture.groupResizeError = error.message;
        }
      }
      content.pictures.push(picture);
    }
  }
  return content;
}

// web/preview/hwpx-picture-captions.mjs
function attachHwpxPictureCaptions(editor, content, available) {
  const pictureIds = new Set((content.pictures ?? []).map((p) => `${p.section}:${p.pictureNode}`));
  for (const paragraph of content.paragraphs)
    if (paragraph.drawingCaption && pictureIds.has(`${paragraph.section}:${paragraph.drawingCaption.drawingNode}`))
      delete paragraph.drawingCaption;
  for (const picture of content.pictures ?? []) {
    delete picture.caption;
    delete picture.captionPartial;
  }
  content.pictureCaptionAvailable = available === true;
  content.pictureCaptionErrors = [];
  if (!content.pictureCaptionAvailable)
    return content;
  const pending = [], claimed = new Set;
  const paragraphs = new Map(content.paragraphs.map((p) => [`${p.section}:${p.paragraph}`, p]));
  if (paragraphs.size !== content.paragraphs.length) {
    content.pictureCaptionErrors.push({ error: "AmbiguousPictureCaptionParagraphs" });
    return content;
  }
  for (const section of new Set((content.pictures ?? []).map((p) => p.section))) {
    try {
      const pictures = content.pictures.filter((p) => p.section === section);
      const byNode = new Map(pictures.map((p) => [p.pictureNode, p]));
      if (byNode.size !== pictures.length)
        throw new Error("AmbiguousPictureCaptionOwner");
      const bindings = editor.pictureCaptionBindings(section);
      for (const picture of pictures)
        picture.caption = editor.pictureCaption(section, picture.pictureNode);
      for (const binding of bindings) {
        const picture = byNode.get(binding.owner.picture_node);
        if (!picture && content.window)
          continue;
        const caption = picture?.caption;
        if (!caption || caption.caption_node !== binding.owner.caption_node || caption.list_node !== binding.owner.list_node)
          throw new Error("PictureCaptionBindingMismatch");
        const key = `${section}:${binding.paragraph - 1}`, paragraph = paragraphs.get(key);
        if (!paragraph && content.window) {
          picture.captionPartial = true;
          continue;
        }
        if (!paragraph || paragraph.drawingText || paragraph.drawingCaption || paragraph.tableCell || paragraph.tableCaption || claimed.has(key))
          throw new Error("PictureCaptionParagraphMismatch");
        claimed.add(key);
        pending.push({
          paragraph,
          owner: {
            drawingNode: picture.pictureNode,
            captionNode: caption.caption_node,
            listNode: caption.list_node
          }
        });
      }
    } catch (error) {
      content.pictureCaptionErrors.push({ section, error: error.message });
    }
  }
  if (!content.pictureCaptionErrors.length)
    for (const item of pending)
      item.paragraph.drawingCaption = item.owner;
  return content;
}

// web/preview/drawing-stroke-source-content.mjs
function drawingStrokeSourceContent(editor, section, node) {
  try {
    if (typeof editor.drawingStrokeSource !== "function")
      throw new Error("HwpxDrawingStrokeSourceAbiUnavailable");
    const value = editor.drawingStrokeSource(section, node);
    if (value.sourceOnly !== true || value.node !== node)
      throw new Error("DrawingStrokeSourceBindingMismatch");
    return { source: value, error: null };
  } catch (error) {
    return { source: null, error: error.message };
  }
}

// web/preview/arrow-reference-dimensions.mjs
var levels = ["SMALL", "MEDIUM", "LARGE"];
function arrowReferenceDimensions(strokeWidth, lineLength, size) {
  if (!Number.isFinite(strokeWidth) || strokeWidth <= 0 || !Number.isFinite(lineLength) || lineLength <= 0 || typeof size !== "string")
    return null;
  const parts = size.split("_");
  if (parts.length !== 2)
    return null;
  const width = levels.indexOf(parts[0]), length = levels.indexOf(parts[1]);
  if (width < 0 || length < 0)
    return null;
  const height = Math.max(strokeWidth * [1.5, 2.5, 3.5][width], 3);
  const extent = Math.min(height * [1, 1.5, 2][length], lineLength * 0.3);
  if (!Number.isFinite(height) || !Number.isFinite(extent) || extent <= 0)
    return null;
  return { length: extent, width: height, policy: "rhwp_reference" };
}

// web/preview/decorated-line-plan.mjs
function decoratedLinePlan(geometry, source) {
  const attr = source?.attributes;
  const fail = (error) => ({ state: "unavailable", error });
  if (!geometry || !source || source.sourceOnly !== true || geometry.node !== source.node || !attr)
    return fail("LineSourceBindingMismatch");
  if (attr.style !== "SOLID" || attr.endCap !== "FLAT" || attr.outlineStyle !== "NORMAL" || attr.alpha !== "0")
    return fail("UnsupportedDecoratedLineStyle");
  if (typeof attr.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(attr.color) || typeof attr.width !== "string" || !/^\+?[0-9]+$/.test(attr.width.trim()))
    return fail("InvalidDecoratedLineStroke");
  const rawWidth = Number(attr.width);
  if (!Number.isSafeInteger(rawWidth) || rawWidth <= 0 || rawWidth > 4294967295)
    return fail("UnsupportedDecoratedLineWidth");
  if (!Array.isArray(geometry.endpoints) || geometry.endpoints.length !== 2 || !geometry.endpoints.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)))
    return fail("InvalidDecoratedLineEndpoints");
  const endpoints = geometry.endpoints.map((p) => p.map(hwpUnitPixels));
  const length = Math.hypot(endpoints[1][0] - endpoints[0][0], endpoints[1][1] - endpoints[0][1]);
  if (!Number.isFinite(length) || length <= 0)
    return fail("DegenerateDecoratedLine");
  const width = hwpUnitPixels(rawWidth), arrows = [];
  for (const [side, index] of [
    ["head", 0],
    ["tail", 1]
  ]) {
    const style = attr[`${side}Style`];
    if (style === "NORMAL")
      continue;
    if (!["ARROW", "SPEAR"].includes(style))
      return fail("UnsupportedArrowStyle");
    const rawFill = attr[`${side}fill`];
    if (!["0", "1", "false", "true"].includes(rawFill))
      return fail("UnsupportedArrowFill");
    const dimensions = arrowReferenceDimensions(width, length, attr[`${side}Sz`]);
    if (!dimensions)
      return fail("UnsupportedArrowSize");
    arrows.push({
      style,
      tip: endpoints[index],
      direction: [
        endpoints[index][0] - endpoints[1 - index][0],
        endpoints[index][1] - endpoints[1 - index][1]
      ],
      length: dimensions.length,
      width: dimensions.width,
      fill: rawFill === "1" || rawFill === "true"
    });
  }
  return {
    state: "planned",
    policy: "rhwp_reference",
    endpoints,
    color: parseInt(attr.color.slice(1), 16),
    strokeWidth: width,
    arrows
  };
}

// web/preview/hwpx-line-content.mjs
function attachHwpxLines(editor, content) {
  content.lines = [];
  content.lineErrors = [];
  const displayed = content.window ? new Set(content.paragraphs.map((paragraph) => `${paragraph.section}:${paragraph.paragraph}`)) : null;
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    let nodes;
    try {
      if (typeof editor.lineNodes !== "function")
        throw new Error("HwpxLineDisplayAbiUnavailable");
      nodes = editor.lineNodes(section);
    } catch (error) {
      content.lineErrors.push({ section, error: error.message });
      continue;
    }
    let batch;
    if (typeof editor.lineDisplayBatch === "function") {
      batch = new Map;
      const limit = editor.lineDisplayBatchMaxNodes ?? Math.max(1, nodes.length);
      if (!Number.isInteger(limit) || limit < 1) {
        for (const node of nodes)
          batch.set(node, { node, error: "InvalidLineDisplayBatchLimit" });
      } else
        for (let start = 0;start < nodes.length; start += limit) {
          const selected = nodes.slice(start, start + limit);
          try {
            for (const entry of editor.lineDisplayBatch(section, selected))
              batch.set(entry.node, entry);
          } catch (error) {
            for (const node of selected)
              batch.set(node, { node, error: error.message });
          }
        }
    }
    for (const lineNode of nodes) {
      const entry = batch?.get(lineNode);
      try {
        if (batch && !entry)
          throw new Error("MissingLineDisplayBatchNode");
        if (entry?.error || entry?.displayError)
          throw new Error(entry.error || entry.displayError);
        if (typeof editor.lineDisplay !== "function")
          throw new Error("HwpxLineDisplayAbiUnavailable");
        const snapshot = entry ? entry.display : editor.lineDisplay(section, lineNode);
        if (displayed && !displayed.has(`${section}:${snapshot.paragraph - 1}`))
          continue;
        const row = {
          ...snapshot,
          section,
          paragraph: snapshot.paragraph - 1,
          state: "located",
          error: null,
          placement: null,
          placementError: null
        };
        try {
          if (typeof editor.linePlacement !== "function")
            throw new Error("HwpxLinePlacementAbiUnavailable");
          row.placement = editor.linePlacement(section, lineNode);
        } catch (error) {
          row.placementError = error.message;
        }
        const raw = drawingStrokeSourceContent(editor, section, lineNode);
        row.sourceStroke = raw.source;
        row.sourceStrokeError = raw.error;
        content.lines.push(row);
      } catch (error) {
        const raw = drawingStrokeSourceContent(editor, section, lineNode);
        let geometry = null, geometryError = null;
        try {
          if (batch && !entry?.geometry)
            throw new Error(entry?.error || "MissingLineDisplayBatchGeometry");
          if (!batch && typeof editor.lineGeometry !== "function")
            throw new Error("HwpxLineGeometryAbiUnavailable");
          const value = entry ? entry.geometry : editor.lineGeometry(section, lineNode);
          if (value.current !== true || value.paintable !== false || value.coordinateSpace !== "renderingInfo" || value.geometry?.node !== lineNode || !Number.isInteger(value.geometry.paragraph) || value.geometry.paragraph < 1)
            throw new Error("LineGeometryBindingMismatch");
          geometry = value.geometry;
          if (displayed && !displayed.has(`${section}:${geometry.paragraph - 1}`))
            continue;
        } catch (queryError) {
          geometryError = queryError.message;
        }
        const row = {
          section,
          lineNode,
          paragraph: geometry ? geometry.paragraph - 1 : null,
          anchorNode: geometry?.anchor_node ?? null,
          anchorUnit: geometry?.anchor_unit ?? null,
          endpoints: null,
          geometry,
          geometryError,
          sourceStroke: raw.source,
          sourceStrokeError: raw.error,
          state: "unavailable",
          error: error.message
        };
        if (error.message === "UnsupportedLineStrokeDecoration" && geometry && raw.source) {
          const plan = decoratedLinePlan(geometry, raw.source);
          if (plan.state === "planned") {
            try {
              if (typeof editor.linePlacement !== "function")
                throw new Error("HwpxLinePlacementAbiUnavailable");
              row.placement = editor.linePlacement(section, lineNode);
              row.referencePlan = plan;
              row.endpoints = geometry.endpoints;
              row.state = "reference_located";
              row.nativeDisplayError = error.message;
              row.error = null;
            } catch (placementError) {
              row.placementError = placementError.message;
            }
          } else
            row.referencePlanError = plan.error;
        }
        content.lines.push(row);
      }
    }
  }
  return content;
}

// web/preview/connector-reference-path.mjs
function connectorReferencePath(source, rendering) {
  const fail = (error) => ({ state: "unavailable", error });
  if (source?.sourceOnly !== true || rendering?.sourceOnly !== true || source.node !== rendering.node || rendering.coordinateSpace !== "renderingInfo")
    return fail("ConnectorPathBindingMismatch");
  const raw = source.geometry;
  if (!raw || !["STRAIGHT_NOARROW", "STRAIGHT_ONEWAY", "STRAIGHT_BOTH"].includes(raw.raw_type))
    return fail("UnsupportedConnectorPathType");
  let points;
  if (!raw.controls_present && raw.controls?.length === 0)
    points = rendering.endpoints;
  else if (raw.controls?.length === 2 && raw.controls[0].control_type === "3" && raw.controls[1].control_type === "26" && rendering.controls?.length === 2)
    points = rendering.controls;
  else
    return fail("UnsupportedConnectorControlPath");
  if (!Array.isArray(points) || points.length !== 2 || !points.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)))
    return fail("InvalidConnectorPathPoints");
  return { state: "planned", policy: "rhwp_reference", endpoints: points.map((p) => p.slice()) };
}

// web/preview/connector-reference-content.mjs
function connectorReferenceContent(editor, section, node, source, stroke, owner) {
  try {
    for (const point of [source.geometry.start, source.geometry.end]) {
      if (!point || point.subject_id_ref !== "0")
        throw new Error("UnresolvedConnectorSubject");
    }
    if (!stroke)
      throw new Error("ConnectorStrokeUnavailable");
    const head = stroke.attributes?.headStyle, tail = stroke.attributes?.tailStyle;
    const type = source.geometry.raw_type;
    if (type === "STRAIGHT_NOARROW" && (head !== "NORMAL" || tail !== "NORMAL") || type === "STRAIGHT_ONEWAY" && (head !== "NORMAL" || tail !== "ARROW") || type === "STRAIGHT_BOTH" && (head !== "ARROW" || tail !== "ARROW"))
      throw new Error("ConnectorArrowTypeMismatch");
    if (typeof editor.connectorRenderingSource !== "function")
      throw new Error("HwpxConnectorRenderingSourceAbiUnavailable");
    if (typeof editor.connectorPlacementSource !== "function")
      throw new Error("HwpxConnectorPlacementSourceAbiUnavailable");
    const path = connectorReferencePath(source, editor.connectorRenderingSource(section, node));
    if (path.state !== "planned")
      throw new Error(path.error);
    const plan = decoratedLinePlan({ node, endpoints: path.endpoints }, stroke);
    if (plan.state !== "planned")
      throw new Error(plan.error);
    const placement = editor.connectorPlacementSource(section, node);
    return {
      line: {
        section,
        lineNode: node,
        connectorNode: node,
        paragraph: owner.paragraph - 1,
        anchorNode: owner.anchor_node,
        anchorUnit: owner.anchor_unit,
        endpoints: path.endpoints,
        placement,
        referencePlan: plan,
        state: "reference_located",
        error: null
      },
      error: null
    };
  } catch (error) {
    return { line: null, error: error.message };
  }
}

// web/preview/hwpx-connector-content.mjs
function attachHwpxConnectors(editor, content) {
  content.connectors = [];
  content.connectorErrors = [];
  const visible = content.window ? new Set(content.paragraphs.map((row) => `${row.section}:${row.paragraph}`)) : null;
  for (const section of new Set(content.paragraphs.map((row) => row.section))) {
    let nodes;
    try {
      if (typeof editor.connectorNodes !== "function")
        throw new Error("HwpxConnectorSourceAbiUnavailable");
      nodes = editor.connectorNodes(section);
    } catch (error) {
      content.connectorErrors.push({ section, error: error.message });
      continue;
    }
    for (const node of nodes) {
      try {
        if (typeof editor.connectorOwner !== "function")
          throw new Error("HwpxConnectorOwnerAbiUnavailable");
        const owner = editor.connectorOwner(section, node);
        if (owner.current !== true || owner.node !== node || !Number.isInteger(owner.paragraph) || owner.paragraph < 1)
          throw new Error("ConnectorOwnerBindingMismatch");
        const paragraph = owner.paragraph - 1;
        if (visible && !visible.has(`${section}:${paragraph}`))
          continue;
        if (typeof editor.connectorGeometrySource !== "function")
          throw new Error("HwpxConnectorSourceAbiUnavailable");
        const source = editor.connectorGeometrySource(section, node);
        if (source.sourceOnly !== true || source.node !== node)
          throw new Error("ConnectorSourceBindingMismatch");
        const rawStroke = drawingStrokeSourceContent(editor, section, node);
        const { source: stroke, error: strokeError } = rawStroke;
        const reference = connectorReferenceContent(editor, section, node, source, stroke, owner);
        content.connectors.push({
          section,
          node,
          paragraph,
          anchorNode: owner.anchor_node,
          anchorUnit: owner.anchor_unit,
          geometry: source.geometry,
          stroke,
          strokeError,
          referenceLine: reference.line,
          referenceError: reference.error,
          state: "source_only",
          renderable: false,
          error: null
        });
      } catch (error) {
        content.connectors.push({
          section,
          node,
          paragraph: null,
          anchorNode: null,
          anchorUnit: null,
          geometry: null,
          stroke: null,
          strokeError: null,
          state: "unavailable",
          renderable: false,
          error: error.message
        });
      }
    }
  }
  return content;
}

// web/preview/hwp5-line-content.mjs
function attachHwp5Lines(editor, content) {
  content.lines = [];
  content.lineErrors = [];
  if (!editor)
    return content;
  const groupBindings = content.hwp5GroupGeometry?.state === "projected" ? content.hwp5GroupGeometry.lineBindings ?? [] : [];
  for (const section of new Set([
    ...(content.hwp5Drawings ?? []).filter((row) => row.source.kind_id === 611084654).map((row) => row.section),
    ...groupBindings.map((row) => row.section)
  ])) {
    try {
      if (content.hwp5DrawingErrors?.some((row) => row.section === section) || content.hwp5DrawingStyleErrors?.some((row) => row.section === section))
        throw new Error("IncompleteHwp5LineSources");
      if (typeof editor.drawingLineEndpoints !== "function")
        throw new Error("Hwp5DrawingLineEndpointsAbiUnavailable");
      const endpoints = validateHwp5DrawingLineEndpoints(editor.drawingLineEndpoints(section));
      const prepared = [];
      const roots = content.hwp5Drawings.filter((row) => row.section === section && row.source.kind_id === 611084654).map((root) => ({ root, group: null }));
      for (const group of groupBindings.filter((row) => row.section === section)) {
        if (group.component?.component_node !== group.lineNode || group.component.owner_node !== group.parentContainer || group.component.kind_id !== 611084654 || group.component.second_id !== null)
          throw new Error("Hwp5GroupedLineBindingMismatch");
        const anchors = content.hwp5Drawings.filter((row) => row.section === section && row.componentNode === group.rootAnchor && row.source.kind_id === 610496366);
        if (anchors.length !== 1 || group.parentContainer !== group.rootAnchor || group.hostParagraph !== anchors[0].hostParagraph || group.anchorUnit !== anchors[0].anchorUnit)
          throw new Error("UnsupportedHwp5GroupedLineOwner");
        roots.push({ root: anchors[0], group });
      }
      for (const { root, group } of roots) {
        if (root.source.component_node !== root.componentNode || root.source.control_node !== root.controlNode)
          throw new Error("Hwp5LineOwnerMismatch");
        const componentNode = group?.lineNode ?? root.componentNode, ownerNode = group?.parentContainer ?? root.controlNode;
        const matches = endpoints.filter((row) => row.component_node === componentNode && row.owner_node === ownerNode);
        const styles = (content.hwp5DrawingStyles ?? []).filter((row) => row.section === section && row.component_node === componentNode && row.owner_node === ownerNode);
        if (matches.length !== 1 || styles.length !== 1)
          throw new Error("MissingHwp5LineSource");
        const endpoint = matches[0], style = styles[0];
        validateHwp5DrawingStyleSources([style]);
        const tail = hwp5DrawingPaintTail(style), attributes = style.border.attributes.raw, stroke = hwp5StrokeDisplay(style.border);
        if (endpoint.attributes !== 0 || endpoint.extra_nonzero || ![0, 2].includes(endpoint.extra_bytes) || (group ? group.component.attributes !== 0 || group.component.rotation_angle !== 0 : root.source.component_attributes !== 0) || ![83886848, 83951617, 83951872].includes(style.fileVersion) || style.tailLayout !== "alpha_shadow_metadata" || style.borderLayout !== "observed13" || tail.state !== "selected" || style.fill_flags !== 0 || style.additional_bytes !== 0 || style.metadata?.shadow_alpha !== 0 || !stroke || !strokeDashPattern(stroke.style) || (attributes >>> 6 & 15) !== 1 || (attributes >>> 10 & 63) !== 0 || (attributes >>> 16 & 63) !== 0 || style.border.outline !== 0)
          throw new Error("UnsupportedHwp5LinePaint");
        const source = hwp5DrawingGeometry(root.source), g = source.geometry;
        if (source.has_caption)
          throw new Error("UnsupportedHwp5LineCaption");
        const paragraph = content.paragraphs.filter((row) => row.section === section && row.paragraph === root.hostParagraph);
        if (paragraph.length !== 1 || paragraph[0].clipped || paragraph[0].text[root.anchorUnit] !== "￼")
          throw new Error("MissingHwp5LineAnchor");
        prepared.push({
          section,
          lineNode: endpoint.line_node,
          anchorNode: componentNode,
          paragraph: root.hostParagraph,
          ...group ? {
            groupContext: {
              rootAnchor: group.rootAnchor,
              parentContainer: group.parentContainer
            }
          } : {},
          anchorUnit: root.anchorUnit,
          state: "located",
          error: null,
          placementError: null,
          endpoints: endpoint.points.map((point) => [...point]),
          rawSource: endpoint,
          stroke,
          placement: {
            geometry: {
              width: g.width,
              height: g.height,
              widthRelative: g.width_relative,
              heightRelative: g.height_relative,
              treatAsCharacter: g.treat_as_character,
              horizontalOffset: g.horizontal_offset,
              verticalOffset: g.vertical_offset
            },
            position: source.position,
            flow: {
              textWrap: source.text_wrap,
              zOrder: source.z_order,
              outsideMargins: [...source.out_margin]
            }
          }
        });
      }
      if (new Set(prepared.map((row) => row.anchorNode)).size !== roots.length)
        throw new Error("AmbiguousHwp5LineSource");
      content.lines.push(...prepared);
    } catch (error) {
      content.lineErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/grouped-shape-content.mjs
function attachGroupedShapeSources(editor, content) {
  content.containers = [];
  content.containerSourceErrors = [];
  content.groupRectangles = [];
  content.groupRectangleErrors = [];
  content.groupCurves = [];
  content.groupCurveErrors = [];
  content.groupCurveOwnerErrors = [];
  const visited = new Set;
  const owners = new Map;
  const addOwner = (section, node, paragraph, unit) => {
    if (![section, node, paragraph, unit].every((n) => Number.isSafeInteger(n) && n >= 0))
      return;
    const key = `${section}:${node}`, old = owners.get(key);
    if (old === null || old && (old.paragraph !== paragraph || old.unit !== unit))
      owners.set(key, null);
    else
      owners.set(key, { paragraph, unit });
  };
  const rectangleBatches = new Map;
  const currentRectangles = new Map((content.rectangles ?? []).map((r) => [`${r.section}:${r.drawingNode}`, r]));
  const rectangleSource = (section, node) => {
    const current = currentRectangles.get(`${section}:${node}`);
    if (current)
      return { rectangle_node: current.drawingNode, source: current.source };
    if (!rectangleBatches.has(section)) {
      let batch = null;
      if (typeof editor.rectangleRenderingSources === "function") {
        try {
          batch = new Map(editor.rectangleRenderingSources(section).map((row) => [row.rectangle_node, row]));
        } catch {}
      }
      rectangleBatches.set(section, batch);
    }
    return rectangleBatches.get(section)?.get(node) ?? editor.rectangleRenderingSource(section, node);
  };
  const pending = [];
  const currentCurves = new Map((content.curveTextSources ?? []).map((item) => [`${item.section}:${item.curveNode}`, item]));
  for (const item of currentCurves.values()) {
    const group = item.source?.common?.group_context;
    if (group && item.owner?.anchor_node === group.root_anchor) {
      pending.push({ section: item.section, node: group.parent_container });
      addOwner(item.section, group.root_anchor, item.owner.paragraph - 1, item.owner.anchor_unit);
    }
  }
  for (const ellipse of content.ellipses ?? []) {
    const group = ellipse.source?.common?.group_context;
    if (group) {
      pending.push({ section: ellipse.section, node: group.parent_container });
      const owner = ellipse.source.owner;
      if (owner && owner.anchor_node === group.root_anchor)
        addOwner(ellipse.section, group.root_anchor, owner.paragraph - 1, owner.anchor_unit);
    }
  }
  for (const drawing of [...content.drawings ?? [], ...content.rectangles ?? []]) {
    const group = drawing.source?.group_context;
    if (group) {
      pending.push({ section: drawing.section, node: group.parent_container });
      addOwner(drawing.section, group.root_anchor, drawing.hostParagraph, drawing.anchorUnit);
    }
  }
  for (const picture of content.pictures ?? []) {
    if (picture.owner && picture.owner.anchorNode !== picture.pictureNode) {
      pending.push({ section: picture.section, node: picture.owner.anchorNode });
      addOwner(picture.section, picture.owner.anchorNode, picture.owner.paragraph, picture.owner.anchorUnit);
    }
  }
  while (pending.length) {
    const { section, node } = pending.pop();
    const key = `${section}:${node}`;
    if (visited.has(key))
      continue;
    visited.add(key);
    try {
      if (typeof editor.containerSourceSnapshot !== "function")
        throw new Error("HwpxContainerSourceAbiUnavailable");
      const source = editor.containerSourceSnapshot(section, node);
      if (source.container_node !== node)
        throw new Error("ContainerSourceBindingMismatch");
      const ownerKey = `${section}:${source.group_context?.root_anchor ?? node}`;
      if (owners.has(ownerKey) && owners.get(ownerKey) === null)
        throw new Error("ConflictingGroupOwner");
      const owner = owners.get(ownerKey);
      content.containers.push({
        section,
        containerNode: node,
        source,
        ...owner ? { hostParagraph: owner.paragraph, anchorUnit: owner.unit } : {}
      });
      if (source.group_context)
        pending.push({ section, node: source.group_context.parent_container });
      for (const child of source.children) {
        if (child.namespace_uri !== "http://www.hancom.co.kr/hwpml/2011/paragraph")
          continue;
        if (child.local_name === "container")
          pending.push({ section, node: child.node });
        if (child.local_name === "curve") {
          try {
            if (typeof editor.curveGeometry !== "function")
              throw new Error("HwpxCurveGeometryAbiUnavailable");
            const current = currentCurves.get(`${section}:${child.node}`);
            const geometry = current?.source ?? editor.curveGeometry(section, child.node);
            if (geometry.node !== child.node || geometry.sourceOnly !== true || geometry.common && geometry.common.group_context?.parent_container !== node)
              throw new Error("GroupCurveBindingMismatch");
            const binding = current ? { state: "bound", owner: current.owner } : queryCurveOwner(editor, section, child.node, geometry.common?.group_context?.root_anchor);
            const rootKey = `${section}:${geometry.common?.group_context?.root_anchor}`, known = owners.get(rootKey);
            if (binding.state === "bound" && (known === null || known && (known.paragraph !== binding.owner.paragraph - 1 || known.unit !== binding.owner.anchor_unit))) {
              binding.state = "unavailable";
              binding.error = "CurveOwnerBindingMismatch";
            }
            if (binding.state === "bound")
              addOwner(section, binding.owner.anchor_node, binding.owner.paragraph - 1, binding.owner.anchor_unit);
            else
              content.groupCurveOwnerErrors.push({
                section,
                curveNode: child.node,
                error: binding.error
              });
            content.groupCurves.push({
              section,
              curveNode: child.node,
              parentContainer: node,
              source: geometry,
              ...binding.state === "bound" ? {
                owner: binding.owner,
                hostParagraph: binding.owner.paragraph - 1,
                anchorUnit: binding.owner.anchor_unit
              } : { ownerError: binding.error }
            });
          } catch (error) {
            content.groupCurveErrors.push({ section, curveNode: child.node, error: error.message });
          }
        }
        if (child.local_name !== "rect")
          continue;
        try {
          const rendering = rectangleSource(section, child.node);
          if (rendering.rectangle_node !== child.node)
            throw new Error("GroupRectangleBindingMismatch");
          content.groupRectangles.push({
            section,
            rectangleNode: child.node,
            parentContainer: node,
            source: rendering.source
          });
        } catch (error) {
          content.groupRectangleErrors.push({
            section,
            rectangleNode: child.node,
            error: error.message
          });
        }
      }
    } catch (error) {
      content.containerSourceErrors.push({ section, containerNode: node, error: error.message });
    }
  }
  content.containers.sort((a, b) => a.section - b.section || a.containerNode - b.containerNode);
  for (const container of content.containers) {
    const owner = owners.get(`${container.section}:${container.source.group_context?.root_anchor ?? container.containerNode}`);
    if (owner) {
      container.hostParagraph = owner.paragraph;
      container.anchorUnit = owner.unit;
    }
  }
  return content;
}

// web/preview/container-caption-content.mjs
function attachContainerCaptions(editor, content) {
  content.containerCaptionErrors = [];
  for (const p of content.paragraphs)
    if (p.drawingCaption?.ownerKind === "container")
      delete p.drawingCaption;
  const containers = content.containers ?? [];
  if (!containers.some((c) => c.source?.has_caption === true))
    return content;
  const paragraphs = new Map(content.paragraphs.map((p) => [`${p.section}:${p.paragraph}`, p]));
  const pending = [], claimed = new Set;
  try {
    if (paragraphs.size !== content.paragraphs.length)
      throw new Error("AmbiguousContainerCaptionParagraphs");
    for (const section of new Set(containers.map((c) => c.section))) {
      const selected = containers.filter((c) => c.section === section);
      const owners = new Map(selected.map((c) => [c.containerNode, c]));
      if (owners.size !== selected.length)
        throw new Error("AmbiguousContainerCaptionOwner");
      if (typeof editor.containerCaptionBindings !== "function")
        throw new Error("HwpxContainerCaptionBindingsAbiUnavailable");
      const seen = new Set;
      for (const binding of editor.containerCaptionBindings(section)) {
        const owner = owners.get(binding.owner.container_node);
        if (!owner && content.window)
          continue;
        const caption = owner?.source?.caption;
        if (!owner?.source?.has_caption || !caption || caption.caption_node !== binding.owner.caption_node || caption.list_node !== binding.owner.list_node)
          throw new Error("ContainerCaptionBindingMismatch");
        const key = `${section}:${binding.paragraph - 1}`, paragraph = paragraphs.get(key);
        if (!paragraph || paragraph.drawingCaption || paragraph.drawingText || paragraph.tableCell || paragraph.tableCaption || claimed.has(key))
          throw new Error("ContainerCaptionParagraphMismatch");
        claimed.add(key);
        seen.add(owner.containerNode);
        pending.push({
          paragraph,
          binding: {
            ownerKind: "container",
            drawingNode: owner.containerNode,
            captionNode: caption.caption_node,
            listNode: caption.list_node
          }
        });
      }
      if (selected.some((c) => c.source?.has_caption === true && !seen.has(c.containerNode)))
        throw new Error("IncompleteContainerCaptionOwnership");
    }
  } catch (error) {
    content.containerCaptionErrors.push({ error: error.message });
  }
  if (!content.containerCaptionErrors.length)
    for (const item of pending)
      item.paragraph.drawingCaption = item.binding;
  return content;
}

// web/preview/fill-brush-content.mjs
function attachFillBrushSources(editor, content) {
  content.fillBrushReports = [];
  content.fillBrushErrors = [];
  for (const section of new Set(content.paragraphs.map((p) => p.section))) {
    try {
      if (typeof editor.sectionFillBrushes !== "function")
        throw new Error("HwpxFillBrushesAbiUnavailable");
      content.fillBrushReports.push({ section, report: editor.sectionFillBrushes(section) });
    } catch (error) {
      content.fillBrushErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/rectangle-content.mjs
function attachRectangleSources(editor, content) {
  content.rectangles = [];
  content.rectangleSourceErrors = [];
  const paragraphs = new Set(content.paragraphs.map((p) => `${p.section}:${p.paragraph}`));
  for (const section of new Set(content.paragraphs.map((p) => p.section))) {
    let batch = null;
    if (typeof editor.rectangleRenderingSources === "function") {
      try {
        batch = new Map(editor.rectangleRenderingSources(section).map((row) => [row.rectangle_node, row]));
      } catch {}
    }
    let nodes;
    try {
      nodes = editor.rectangleNodes(section);
    } catch (error) {
      content.rectangleSourceErrors.push({ section, error: error.message });
      continue;
    }
    for (const node of nodes) {
      try {
        const value = batch?.get(node) ?? editor.rectangleRenderingSource(section, node);
        if (value.rectangle_node !== node || !paragraphs.has(`${section}:${value.owner.paragraph - 1}`))
          throw new Error("RectangleDisplayBindingMismatch");
        content.rectangles.push({
          section,
          drawingNode: node,
          hostParagraph: value.owner.paragraph - 1,
          anchorUnit: value.owner.anchor_unit,
          anchorNode: value.owner.anchor_node,
          source: value.source
        });
      } catch (error) {
        content.rectangleSourceErrors.push({ section, drawingNode: node, error: error.message });
      }
    }
  }
  return content;
}

// web/preview/hwpx-page-content.mjs
function attachHwpxPageSettings(editor, content) {
  const sections = new Set(content.paragraphs.map((row) => row.section));
  const displayed = content.window ? new Set(content.paragraphs.map((row) => `${row.section}:${row.paragraph}`)) : null;
  attachRectangleSources(editor, content);
  attachGroupedShapeSources(editor, content);
  attachContainerCaptions(editor, content);
  attachFillBrushSources(editor, content);
  content.pageSettings = [];
  content.noteShapes = null;
  content.noteShapesError = null;
  try {
    content.noteShapes = editor.noteShapes();
  } catch (error) {
    content.noteShapesError = error.message;
  }
  content.pageSettingsError = null;
  try {
    if (typeof editor.pageSettings !== "function")
      throw new Error("HwpxPageSettingsAbiUnavailable");
    content.pageSettings = editor.pageSettings();
    if (displayed)
      content.pageSettings = content.pageSettings.filter((row) => sections.has(row.section_ordinal));
  } catch (error) {
    content.pageSettingsError = error.message;
  }
  content.paragraphFlows = [];
  content.paragraphFlowErrors = [];
  for (const section of sections) {
    try {
      if (typeof editor.paragraphFlow !== "function")
        throw new Error("HwpxParagraphFlowAbiUnavailable");
      for (const row of editor.paragraphFlow(section)) {
        if (displayed && !displayed.has(`${section}:${row.paragraph - 1}`))
          continue;
        content.paragraphFlows.push({ ...row, section, paragraph: row.paragraph - 1 });
      }
    } catch (error) {
      content.paragraphFlowErrors.push({ section, error: error.message });
    }
  }
  const sourceTables = content.tables?.length ? selectNoteSourceTables(content) : null;
  const notes = bindSourceNoteBodies(content, sourceTables?.state === "selected" ? sourceTables : null);
  content.noteBodies = notes.state === "bound" ? notes.notes : [];
  content.noteBodyBindingError = notes.state === "bound" ? null : notes.error;
  return content;
}

// web/preview/hwp5-structural-anchor-content.mjs
function attachHwp5StructuralAnchors(editor, content) {
  content.structuralAnchorErrors = [];
  for (const paragraph of content.paragraphs)
    delete paragraph.structuralAnchors;
  if (!editor)
    return content;
  for (let section = 0;section < editor.sectionCount(); section++) {
    try {
      const paragraphs = new Map(content.paragraphs.filter((row) => row.section === section).map((row) => [row.paragraph, row]));
      const prepared = [], controls = new Set, positions = new Set;
      for (const row of editor.structuralAnchors(section)) {
        const paragraph = paragraphs.get(row.paragraph);
        if (!paragraph || paragraph.clipped || controls.has(row.control_node) || !HWP5_STRUCTURAL_ANCHOR_KINDS.includes(row.kind))
          throw new Error("StructuralDisplayAnchorBindingMismatch");
        const unit = sourceDisplayPosition(row.current_unit, paragraph.sourceOffsets, paragraph.text.length);
        const end = sourceDisplayPosition(row.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
        const key = `${row.paragraph}:${unit}`;
        if (end !== unit + 1 || paragraph.text[unit] !== "￼" || positions.has(key))
          throw new Error("StructuralDisplayAnchorMismatch");
        controls.add(row.control_node);
        positions.add(key);
        prepared.push({ paragraph, anchor: { ...row, unit } });
      }
      for (const { paragraph, anchor } of prepared)
        (paragraph.structuralAnchors ??= []).push(anchor);
    } catch (error) {
      content.structuralAnchorErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-master-page-content.mjs
function attachHwp5MasterPages(editor, content) {
  content.masterPageSources = [];
  content.masterPageSourceErrors = [];
  if (!editor)
    return content;
  const flows = content.currentParagraphFlows ?? [];
  for (const section of new Set(flows.filter((row) => row.host === "master_page").map((row) => row.section))) {
    try {
      const sources = validateHwp5MasterPageSources(editor.masterPageSources(section));
      const members = flows.filter((row) => row.section === section && row.host === "master_page");
      const matches = (source, row) => row.list_node === source.list_node && row.parent_node === source.owner_node;
      if (sources.some((source) => !members.some((row) => matches(source, row))) || members.some((row) => !sources.some((source) => matches(source, row))))
        throw new Error("Hwp5MasterPageBindingMismatch");
      content.masterPageSources.push(...sources.map((row) => ({ ...row, section })));
    } catch (error) {
      content.masterPageSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-note-page-policy.mjs
var widths = Object.freeze([
  "0.1 mm",
  "0.12 mm",
  "0.15 mm",
  "0.2 mm",
  "0.25 mm",
  "0.3 mm",
  "0.4 mm",
  "0.5 mm",
  "0.6 mm",
  "0.7 mm",
  "1.0 mm",
  "1.5 mm",
  "2.0 mm",
  "3.0 mm",
  "4.0 mm",
  "5.0 mm"
]);
function selectHwp5NotePagePolicy(rows, section, kind) {
  try {
    validateHwp5NoteShapeSources(rows);
  } catch {
    return { state: "unavailable", error: "InvalidHwp5NoteShapeSources" };
  }
  const shape = rows.find((row) => row.kind === kind);
  if (!shape)
    return { state: "unavailable", error: "InvalidNotePagePolicy" };
  const placement = shape.flags >>> 8 & 3;
  const places = kind === "footnote" ? ["EACH_COLUMN", "MERGED_COLUMN", "RIGHT_MOST_COLUMN"] : ["END_OF_DOCUMENT", "END_OF_SECTION"];
  if (shape.extra_bytes !== 0 || shape.flags >>> 14 !== 0 || shape.line_type !== 1 || !widths[shape.line_width] || shape.color > 16777215)
    return { state: "unavailable", error: "UnsupportedHwp5NotePagePolicy" };
  const color = `#${[shape.color & 255, shape.color >>> 8 & 255, shape.color >>> 16 & 255].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
  return normalizedNotePagePolicy({
    section,
    kind,
    sourceNode: shape.source_node,
    placement: places[placement],
    beneathText: Boolean(shape.flags & 1 << 13),
    between: shape.between,
    below: shape.below,
    above: shape.above,
    length: shape.separator_length,
    type: "SOLID",
    width: widths[shape.line_width],
    color
  });
}

// web/preview/hwp5-note-shape-content.mjs
function attachHwp5NoteShapes(editor, content) {
  content.hwp5NoteShapes = [];
  content.hwp5NotePolicies = [];
  content.hwp5NoteShapeErrors = [];
  if (!editor)
    return content;
  const sections = new Set((content.currentParagraphFlows ?? []).filter((row) => ["footnote", "endnote"].includes(row.host)).map((row) => row.section));
  for (const section of sections) {
    try {
      const shapes = validateHwp5NoteShapeSources(editor.noteShapeSources(section));
      const policies = shapes.map((shape) => selectHwp5NotePagePolicy(shapes, section, shape.kind));
      content.hwp5NoteShapes.push({ section, shapes });
      for (const [index, policy] of policies.entries()) {
        if (policy.state === "selected")
          content.hwp5NotePolicies.push(policy);
        else
          content.hwp5NoteShapeErrors.push({
            section,
            kind: shapes[index].kind,
            error: policy.error
          });
      }
    } catch (error) {
      content.hwp5NoteShapeErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-note-content.mjs
function attachHwp5Notes(editor, content) {
  content.hwp5Notes = [];
  content.hwp5NoteErrors = [];
  if (!editor)
    return attachHwp5NoteShapes(editor, content);
  const flows = content.currentParagraphFlows ?? [];
  for (const section of new Set(flows.filter((row) => ["footnote", "endnote"].includes(row.host)).map((row) => row.section))) {
    try {
      const sources = validateHwp5NoteSources(editor.noteSources(section)), prepared = [], positions = new Map, paragraphIds = new Set;
      for (const paragraph of content.paragraphs.filter((row) => row.section === section)) {
        if (paragraphIds.has(paragraph.paragraph))
          throw new Error("AmbiguousHwp5NoteParagraph");
        paragraphIds.add(paragraph.paragraph);
      }
      const members = flows.filter((row) => row.section === section && ["footnote", "endnote"].includes(row.host));
      if (new Set(members.map((row) => row.paragraph)).size !== members.length)
        throw new Error("AmbiguousHwp5NoteBody");
      for (const source of sources) {
        const paragraph = content.paragraphs.find((row) => row.section === section && row.paragraph === source.paragraph);
        if (!paragraph || paragraph.clipped)
          throw new Error("MissingHwp5NoteReferenceParagraph");
        const unit = sourceDisplayPosition(source.current_unit, paragraph.sourceOffsets, paragraph.text.length);
        const end = sourceDisplayPosition(source.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
        if (end !== unit + 1 || paragraph.text[unit] !== "￼")
          throw new Error("Hwp5NoteReferenceMismatch");
        const key = `${source.paragraph}:${unit}`, owner = positions.get(key);
        if (owner !== undefined && owner !== source.control_node)
          throw new Error("AmbiguousHwp5NoteReference");
        positions.set(key, source.control_node);
        const body = members.filter((row) => row.host === source.kind && row.list_node === source.list_node && row.parent_node === source.control_node);
        if (!body.length || body.some((row) => !content.paragraphs.some((p) => p.section === section && p.paragraph === row.paragraph && !p.clipped)))
          throw new Error("MissingHwp5NoteBody");
        prepared.push({
          section,
          kind: source.kind,
          controlNode: source.control_node,
          listNode: source.list_node,
          hostParagraph: source.paragraph,
          anchorUnit: unit,
          paragraphs: body.map((row) => row.paragraph),
          source
        });
      }
      if (members.some((row) => !prepared.some((note) => note.kind === row.host && note.listNode === row.list_node && note.controlNode === row.parent_node)))
        throw new Error("IncompleteHwp5NoteSources");
      content.hwp5Notes.push(...prepared);
    } catch (error) {
      content.hwp5NoteErrors.push({ section, error: error.message });
    }
  }
  return attachHwp5NoteShapes(editor, content);
}

// web/preview/hwp5-caption-content.mjs
function attachHwp5Captions(editor, content) {
  content.hwp5Captions = [];
  content.hwp5CaptionErrors = [];
  if (!editor)
    return attachHwp5CaptionGeometry(content);
  const flows = content.currentParagraphFlows ?? [];
  for (const section of new Set(flows.filter((row) => row.host === "table_caption").map((row) => row.section))) {
    try {
      const sources = validateHwp5CaptionSources(editor.captionSources(section));
      const members = flows.filter((row) => row.section === section && row.host === "table_caption"), prepared = [];
      if (new Set(members.map((row) => row.paragraph)).size !== members.length)
        throw new Error("AmbiguousHwp5CaptionFlow");
      const paragraphs = content.paragraphs.filter((row) => row.section === section);
      if (new Set(paragraphs.map((row) => row.paragraph)).size !== paragraphs.length)
        throw new Error("AmbiguousHwp5CaptionParagraph");
      for (const source of sources) {
        const tables = (content.tables ?? []).filter((row) => row.section === section && row.tableNode === source.table_record_node);
        if (tables.length !== 1 || tables[0].layoutSource?.table_node !== source.control_node)
          throw new Error("Hwp5CaptionTableMismatch");
        const body = members.filter((row) => row.list_node === source.list_node && row.parent_node === source.control_node);
        if (!body.length || body.some((row) => !paragraphs.some((p) => p.paragraph === row.paragraph && !p.clipped)))
          throw new Error("MissingHwp5CaptionBody");
        prepared.push({
          section,
          tableNode: source.table_record_node,
          controlNode: source.control_node,
          listNode: source.list_node,
          paragraphs: body.map((row) => row.paragraph),
          source
        });
      }
      if (members.some((row) => !prepared.some((caption) => caption.listNode === row.list_node && caption.controlNode === row.parent_node)))
        throw new Error("IncompleteHwp5CaptionSources");
      content.hwp5Captions.push(...prepared);
    } catch (error) {
      content.hwp5CaptionErrors.push({ section, error: error.message });
    }
  }
  return attachHwp5CaptionGeometry(content);
}

// web/preview/hwp5-drawing-body-content.mjs
function attachHwp5DrawingBodies(editor, content) {
  content.hwp5DrawingBodies = [];
  content.hwp5DrawingBodyErrors = [];
  if (!editor)
    return content;
  const flows = content.currentParagraphFlows ?? [];
  const sections = new Set([
    ...(content.hwp5Drawings ?? []).map((row) => row.section),
    ...flows.filter((row) => row.host === "drawing").map((row) => row.section)
  ]);
  for (const section of sections) {
    try {
      if (content.hwp5DrawingErrors?.some((row) => row.section === section))
        throw new Error("IncompleteHwp5DrawingSources");
      const sources = validateHwp5DrawingListSources(editor.drawingListSources(section)), prepared = [];
      const members = flows.filter((row) => row.section === section && row.host === "drawing");
      const paragraphs = content.paragraphs.filter((row) => row.section === section);
      if (new Set(members.map((row) => row.paragraph)).size !== members.length || new Set(paragraphs.map((row) => row.paragraph)).size !== paragraphs.length)
        throw new Error("AmbiguousHwp5DrawingBody");
      for (const source of sources) {
        if (!content.hwp5Drawings?.some((row) => row.section === section && row.controlNode === source.control_node))
          throw new Error("MissingHwp5DrawingBodyControl");
        const body = members.filter((row) => row.parent_node === source.owner_node && row.list_node === source.list_node);
        if (source.paragraph_count > 0 && !body.length || body.some((row) => !paragraphs.some((p) => p.paragraph === row.paragraph && !p.clipped)))
          throw new Error("MissingHwp5DrawingBodyParagraph");
        prepared.push({
          section,
          kind: source.kind,
          controlNode: source.control_node,
          ownerNode: source.owner_node,
          listNode: source.list_node,
          paragraphs: body.map((row) => row.paragraph),
          source
        });
      }
      if (members.some((row) => !prepared.some((body) => body.ownerNode === row.parent_node && body.listNode === row.list_node)))
        throw new Error("IncompleteHwp5DrawingBodies");
      content.hwp5DrawingBodies.push(...prepared);
    } catch (error) {
      content.hwp5DrawingBodyErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-drawing-matrix-content.mjs
function attachHwp5DrawingMatrices(editor, content) {
  content.hwp5DrawingMatrices = [];
  content.hwp5DrawingMatrixErrors = [];
  if (!editor)
    return content;
  for (const section of new Set((content.hwp5Drawings ?? []).map((row) => row.section))) {
    try {
      const rows = validateHwp5DrawingMatrixSources(editor.drawingMatrixSources(section));
      const components = new Map(rows.filter((row) => row.kind === "translation").map((row) => [row.component_node, row]));
      const drawings = content.hwp5Drawings.filter((row) => row.section === section);
      const roots = new Map(drawings.map((row) => [row.componentNode, row]));
      if (roots.size !== drawings.length)
        throw new Error("AmbiguousHwp5DrawingMatrixRoot");
      for (const root of drawings) {
        const first = components.get(root.componentNode);
        if (!first || first.owner_node !== root.controlNode || rows.filter((row) => row.component_node === root.componentNode && row.kind === "rotation").length !== root.source.matrix_pairs)
          throw new Error("Hwp5DrawingMatrixSourceMismatch");
      }
      for (const component of components.values()) {
        let current = component;
        while (!roots.has(current.component_node)) {
          const parent = components.get(current.owner_node);
          if (!parent || parent.component_node >= current.component_node)
            throw new Error("MissingHwp5DrawingMatrixParent");
          current = parent;
        }
      }
      content.hwp5DrawingMatrices.push(...rows.map((row) => ({ ...row, section })));
    } catch (error) {
      content.hwp5DrawingMatrixErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-drawing-local-content.mjs
function attachHwp5DrawingLocalTransforms(editor, content) {
  content.hwp5DrawingLocalTransforms = [];
  content.hwp5DrawingLocalErrors = [];
  if (!editor)
    return content;
  for (const section of new Set((content.hwp5Drawings ?? []).map((row) => row.section))) {
    try {
      if (content.hwp5DrawingMatrixErrors?.some((row) => row.section === section))
        throw new Error("IncompleteHwp5DrawingMatrices");
      const raw = (content.hwp5DrawingMatrices ?? []).filter((row) => row.section === section && row.kind === "translation");
      if (new Set(raw.map((row) => row.component_node)).size !== raw.length)
        throw new Error("AmbiguousHwp5DrawingTransformSource");
      const local = validateHwp5DrawingLocalTransforms(editor.drawingLocalTransforms(section));
      if (raw.length !== local.length)
        throw new Error("Hwp5DrawingTransformInventoryMismatch");
      for (const row of local)
        if (!raw.some((source) => source.component_node === row.component_node && source.owner_node === row.owner_node))
          throw new Error("Hwp5DrawingTransformOwnerMismatch");
      content.hwp5DrawingLocalTransforms.push(...local.map((row) => ({ ...row, section })));
    } catch (error) {
      content.hwp5DrawingLocalErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-drawing-corner-content.mjs
function attachHwp5DrawingCorners(editor, content) {
  content.hwp5DrawingCorners = [];
  content.hwp5DrawingCornerErrors = [];
  if (!editor)
    return content;
  for (const section of new Set((content.hwp5Drawings ?? []).map((row) => row.section))) {
    try {
      if (content.hwp5DrawingLocalErrors?.some((row) => row.section === section))
        throw new Error("IncompleteHwp5DrawingTransforms");
      const corners = validateHwp5DrawingRectangleCorners(editor.drawingRectangleCorners(section));
      const locals = (content.hwp5DrawingLocalTransforms ?? []).filter((row) => row.section === section);
      const nodes = new Set(locals.map((row) => row.component_node));
      if (nodes.size !== locals.length)
        throw new Error("AmbiguousHwp5DrawingCornerTransform");
      if (corners.some((row) => !nodes.has(row.component_node)))
        throw new Error("MissingHwp5DrawingCornerTransform");
      for (const drawing of content.hwp5Drawings.filter((row) => row.section === section && row.source.kind_id === 611476835)) {
        if (!corners.some((row) => row.component_node === drawing.componentNode))
          throw new Error("MissingHwp5RectangleCorners");
      }
      content.hwp5DrawingCorners.push(...corners.map((row) => ({ ...row, section })));
    } catch (error) {
      content.hwp5DrawingCornerErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-drawing-style-content.mjs
function attachHwp5DrawingStyles(editor, content) {
  content.hwp5DrawingStyles = [];
  content.hwp5DrawingStyleErrors = [];
  if (!editor)
    return content;
  for (const section of new Set((content.hwp5Drawings ?? []).map((row) => row.section))) {
    try {
      if (content.hwp5DrawingMatrixErrors?.some((row) => row.section === section))
        throw new Error("IncompleteHwp5DrawingMatrices");
      const components = (content.hwp5DrawingMatrices ?? []).filter((row) => row.section === section && row.kind === "translation");
      const owners = new Map(components.map((row) => [row.component_node, row.owner_node]));
      if (owners.size !== components.length)
        throw new Error("AmbiguousHwp5DrawingStyleOwner");
      const version = typeof editor.fileVersion === "function" ? editor.fileVersion() : null;
      const tail = [83886848, 83887360, 83951617, 83951872].includes(version) ? "alpha_shadow_metadata" : "fill_only";
      const rows = validateHwp5DrawingStyleSources(editor.drawingStyleSources(section, { border: "observed13", tail }));
      for (const row of rows) {
        if (!owners.has(row.component_node) || owners.get(row.component_node) !== row.owner_node)
          throw new Error("Hwp5DrawingStyleOwnerMismatch");
        if (tail === "fill_only" ? row.alpha !== null || row.shadow !== null || row.metadata !== null : row.fill_known && (row.alpha === null || row.shadow === null || row.metadata === null))
          throw new Error("Hwp5DrawingStyleProfileMismatch");
      }
      for (const corner of (content.hwp5DrawingCorners ?? []).filter((row) => row.section === section)) {
        if (!rows.some((row) => row.component_node === corner.component_node))
          throw new Error("MissingHwp5RectangleStyle");
      }
      content.hwp5DrawingStyles.push(...rows.map((row) => ({
        ...row,
        section,
        fileVersion: version,
        borderLayout: "observed13",
        tailLayout: tail
      })));
    } catch (error) {
      content.hwp5DrawingStyleErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-drawing-component-content.mjs
function attachHwp5DrawingComponents(editor, content) {
  content.hwp5DrawingComponents = [];
  content.hwp5DrawingComponentErrors = [];
  if (!editor)
    return content;
  for (const section of new Set((content.hwp5Drawings ?? []).map((row) => row.section))) {
    try {
      const rows = validateHwp5DrawingComponentSources(editor.drawingComponentSources(section));
      const roots = content.hwp5Drawings.filter((row) => row.section === section);
      const declared = rows.filter((row) => row.second_id !== null);
      if (roots.length !== declared.length || new Set(roots.map((row) => row.componentNode)).size !== roots.length)
        throw new Error("IncompleteHwp5DrawingComponents");
      for (const row of declared) {
        const root = roots.find((root) => root.componentNode === row.component_node);
        if (!root || root.controlNode !== row.owner_node)
          throw new Error("Hwp5DrawingComponentOwnerMismatch");
        for (const [key, sourceKey] of [
          ["kind_id", "kind_id"],
          ["offset_x", "component_offset_x"],
          ["offset_y", "component_offset_y"],
          ["original_width", "original_width"],
          ["original_height", "original_height"],
          ["current_width", "current_width"],
          ["current_height", "current_height"],
          ["attributes", "component_attributes"],
          ["rotation_angle", "rotation_angle"],
          ["matrix_pairs", "matrix_pairs"],
          ["extra_bytes", "component_extra_bytes"]
        ]) {
          if (row[key] !== root.source[sourceKey])
            throw new Error("Hwp5DrawingComponentSourceMismatch");
        }
      }
      content.hwp5DrawingComponents.push(...rows.map((row) => ({ ...row, section })));
    } catch (error) {
      content.hwp5DrawingComponentErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-shape-point-content.mjs
function attachHwp5ShapePoints(editor, content, contract) {
  content[contract.rows] = [];
  content[contract.errors] = [];
  if (!editor)
    return content;
  const components = content.hwp5DrawingComponents ?? [], layout = "observed_i32_points";
  for (const section of new Set(components.filter((r) => r.kind_id === contract.kind).map((r) => r.section))) {
    try {
      if ([
        ...content.hwp5DrawingComponentErrors ?? [],
        ...content.hwp5DrawingLocalErrors ?? []
      ].some((r) => r.section === section))
        throw new Error(contract.incomplete);
      const expected = components.filter((r) => r.section === section && r.kind_id === contract.kind);
      const points = contract.validate(contract.read(editor, section, layout));
      if (points.length !== expected.length || new Set(expected.map((r) => r.component_node)).size !== expected.length)
        throw new Error(contract.inventory);
      for (const row of points) {
        const matches = expected.filter((source) => source.component_node === row.component_node);
        const local = (content.hwp5DrawingLocalTransforms ?? []).filter((source) => source.section === section && source.component_node === row.component_node);
        if (matches.length !== 1 || local.length !== 1 || local[0].owner_node !== matches[0].owner_node)
          throw new Error(contract.owner);
      }
      content[contract.rows].push(...points.map((row) => ({ ...row, section, layout })));
    } catch (error) {
      content[contract.errors].push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-polygon-point-content.mjs
function attachHwp5PolygonPoints(editor, content) {
  return attachHwp5ShapePoints(editor, content, {
    kind: 611348332,
    rows: "hwp5PolygonPoints",
    errors: "hwp5PolygonPointErrors",
    validate: validateHwp5DrawingPolygonPoints,
    read: (e, section, layout) => e.drawingPolygonPoints(section, layout),
    incomplete: "IncompleteHwp5PolygonSources",
    inventory: "Hwp5PolygonInventoryMismatch",
    owner: "Hwp5PolygonTransformOwnerMismatch"
  });
}

// web/preview/hwp5-curve-point-content.mjs
function attachHwp5CurvePoints(editor, content) {
  return attachHwp5ShapePoints(editor, content, {
    kind: 610497906,
    rows: "hwp5CurvePoints",
    errors: "hwp5CurvePointErrors",
    validate: validateHwp5DrawingCurvePoints,
    read: (e, section, layout) => e.drawingCurvePoints(section, layout),
    incomplete: "IncompleteHwp5CurveSources",
    inventory: "Hwp5CurveInventoryMismatch",
    owner: "Hwp5CurveTransformOwnerMismatch"
  });
}

// web/preview/hwp5-drawing-content.mjs
function attachHwp5Drawings(editor, content) {
  content.hwp5Drawings = [];
  content.hwp5DrawingErrors = [];
  content.hwp5DrawingObjectExtraErrors = [];
  attachHwp5PolygonPoints(null, content);
  attachHwp5CurvePoints(null, content);
  attachHwp5DrawingComponents(null, content);
  if (!editor)
    return attachHwp5DrawingStyles(editor, attachHwp5DrawingGeometry(attachHwp5DrawingCorners(editor, attachHwp5DrawingLocalTransforms(editor, attachHwp5DrawingMatrices(editor, attachHwp5DrawingBodies(editor, content))))));
  for (const section of new Set((content.paragraphs ?? []).map((row) => row.section))) {
    try {
      let sources = validateHwp5DrawingSources(editor.drawingSources(section));
      try {
        sources = withObservedDrawingObjectExtensions(editor, sources, section);
      } catch (error) {
        content.hwp5DrawingObjectExtraErrors.push({ section, error: error.message });
      }
      const anchors = validateHwp5DrawingAnchors(editor.drawingAnchors(section)), prepared = [];
      if (sources.length !== anchors.length)
        throw new Error("IncompleteHwp5DrawingAnchors");
      const paragraphsInSection = content.paragraphs.filter((row) => row.section === section);
      const flowsInSection = (content.currentParagraphFlows ?? []).filter((row) => row.section === section);
      if (new Set(paragraphsInSection.map((row) => row.paragraph)).size !== paragraphsInSection.length || new Set(flowsInSection.map((row) => row.paragraph)).size !== flowsInSection.length)
        throw new Error("AmbiguousHwp5DrawingOwner");
      for (const source of sources) {
        const anchor = anchors.find((row) => row.control_node === source.control_node && row.component_node === source.component_node);
        if (!anchor)
          throw new Error("MissingHwp5DrawingAnchor");
        const paragraphs = content.paragraphs.filter((row) => row.section === section && row.paragraph === anchor.paragraph);
        if (paragraphs.length !== 1 || paragraphs[0].clipped)
          throw new Error("MissingHwp5DrawingParagraph");
        const paragraph = paragraphs[0], flow = content.currentParagraphFlows?.find((row) => row.section === section && row.paragraph === anchor.paragraph);
        if (flow?.source_node !== source.paragraph_node)
          throw new Error("Hwp5DrawingOwnerMismatch");
        const unit = sourceDisplayPosition(anchor.current_unit, paragraph.sourceOffsets, paragraph.text.length);
        const end = sourceDisplayPosition(anchor.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
        if (end !== unit + 1 || paragraph.text[unit] !== "￼")
          throw new Error("Hwp5DrawingDisplayAnchorMismatch");
        if (prepared.some((row) => row.hostParagraph === anchor.paragraph && row.anchorUnit === unit))
          throw new Error("AmbiguousHwp5DrawingAnchor");
        prepared.push({
          section,
          controlNode: source.control_node,
          componentNode: source.component_node,
          hostParagraph: anchor.paragraph,
          anchorUnit: unit,
          source,
          anchor
        });
      }
      content.hwp5Drawings.push(...prepared);
    } catch (error) {
      content.hwp5DrawingErrors.push({ section, error: error.message });
    }
  }
  attachHwp5DrawingComponents(editor, content);
  const prepared = attachHwp5DrawingStyles(editor, attachHwp5DrawingGeometry(attachHwp5DrawingCorners(editor, attachHwp5DrawingLocalTransforms(editor, attachHwp5DrawingMatrices(editor, attachHwp5DrawingBodies(editor, content))))));
  return attachHwp5CurvePoints(editor, attachHwp5PolygonPoints(editor, prepared));
}

// web/preview/hwp5-memo-content.mjs
function attachHwp5Memos(content) {
  content.hwp5Memos = [];
  content.hwp5MemoErrors = [];
  for (const paragraph of content.paragraphs ?? [])
    if (paragraph.memoSource) {
      const source = paragraph.memoSource;
      if (paragraph.selectionOwner === `section:${paragraph.section}:memo:${source.memoNode}:list:${source.listNode}`)
        paragraph.selectionOwner = null;
      delete paragraph.memoSource;
      delete paragraph.memoLabel;
    }
  const flows = content.currentParagraphFlows ?? [];
  const sections = new Set(flows.filter((row) => row.memo_node != null).map((row) => row.section));
  for (const section of sections) {
    try {
      const paragraphs = new Map;
      for (const row of content.paragraphs ?? []) {
        if (row.section !== section)
          continue;
        if (paragraphs.has(row.paragraph))
          throw new Error("AmbiguousHwp5MemoParagraph");
        paragraphs.set(row.paragraph, row);
      }
      const groups = new Map, seen = new Set;
      for (const row of flows) {
        if (row.section !== section || row.memo_node == null)
          continue;
        if (seen.has(row.paragraph))
          throw new Error("AmbiguousHwp5MemoParagraph");
        seen.add(row.paragraph);
        const paragraph = paragraphs.get(row.paragraph);
        if (!paragraph || paragraph.clipped)
          throw new Error("MissingHwp5MemoParagraph");
        if (!Number.isSafeInteger(row.memo_node) || row.memo_node < 0 || !Number.isSafeInteger(row.parent_node) || row.parent_node < 0 || row.host !== "other" || row.top_level !== false || row.list_node !== row.memo_node + 1 || !Number.isSafeInteger(row.memo_index) || row.memo_index < 0 || row.memo_index > 4294967295)
          throw new Error("InvalidHwp5MemoIdentity");
        let group = groups.get(row.memo_node);
        if (!group) {
          group = {
            section,
            memoNode: row.memo_node,
            memoIndex: row.memo_index,
            listNode: row.list_node,
            parentNode: row.parent_node,
            paragraphs: []
          };
          groups.set(row.memo_node, group);
        }
        if (group.memoIndex !== row.memo_index || group.listNode !== row.list_node || group.parentNode !== row.parent_node)
          throw new Error("ConflictingHwp5MemoIdentity");
        group.paragraphs.push(row.paragraph);
      }
      for (const group of groups.values())
        for (const index of group.paragraphs) {
          const paragraph = paragraphs.get(index);
          paragraph.memoSource = {
            memoNode: group.memoNode,
            memoIndex: group.memoIndex,
            listNode: group.listNode
          };
          paragraph.selectionOwner = `section:${section}:memo:${group.memoNode}:list:${group.listNode}`;
          paragraph.memoLabel = `구역 ${section + 1} · 메모 ${group.memoIndex} · 문단 ${index + 1}`;
        }
      content.hwp5Memos.push(...groups.values());
    } catch (error) {
      content.hwp5MemoErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-flow-content.mjs
function attachHwp5FlowSources(editor, content) {
  content.currentParagraphFlows = [];
  content.columnSources = [];
  content.flowSourceErrors = [];
  attachHwp5Memos(content);
  if (!editor)
    return attachHwp5Drawings(editor, attachHwp5Captions(editor, attachHwp5Notes(editor, attachHwp5MasterPages(editor, attachHwp5PageAreas(editor, attachHwp5StructuralAnchors(editor, content))))));
  for (let section = 0;section < editor.sectionCount(); section++) {
    try {
      const flows = editor.paragraphFlow(section), columns = editor.columnSources(section);
      for (const declaration of columns) {
        const owner = flows[declaration.current_paragraph];
        if (!owner || owner.generated || owner.source_node !== declaration.paragraph_node)
          throw new Error("ColumnSourceBindingMismatch");
      }
      content.currentParagraphFlows.push(...flows.map((row) => ({ ...row, section })));
      content.columnSources.push(...columns.map((row) => ({ ...row, section })));
    } catch (error) {
      content.flowSourceErrors.push({ section, error: error.message });
    }
  }
  return attachHwp5Drawings(editor, attachHwp5Captions(editor, attachHwp5Notes(editor, attachHwp5MasterPages(editor, attachHwp5PageAreas(editor, attachHwp5StructuralAnchors(editor, attachHwp5Memos(content)))))));
}

// web/preview/hwp5-column-display.mjs
function attachHwp5ColumnDisplay(content) {
  content.columnDisplaySources = [];
  content.columnDisplayErrors = [];
  const paragraphs = new Map((content.paragraphs ?? []).map((row) => [`${row.section}:${row.paragraph}`, row]));
  for (const source of content.columnSources ?? []) {
    try {
      const paragraph = paragraphs.get(`${source.section}:${source.current_paragraph}`);
      if (!paragraph || paragraph.clipped || !Array.isArray(paragraph.sourceOffsets))
        throw new Error("MissingColumnDisplaySource");
      const unit = sourceDisplayPosition(source.current_unit, paragraph.sourceOffsets, paragraph.text.length);
      const end = sourceDisplayPosition(source.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
      if (end !== unit + 1 || paragraph.text[unit] !== "￼")
        throw new Error("ColumnDisplayAnchorMismatch");
      content.columnDisplaySources.push({ ...source, display_unit: unit, display_end: end });
    } catch (error) {
      content.columnDisplayErrors.push({
        section: source.section,
        source_node: source.source_node,
        error: error.message
      });
    }
  }
  return content;
}

// web/preview/hwp5-note-reference-display.mjs
function attachHwp5NoteReferenceDisplay(content) {
  const paragraphs = new Map(content.paragraphs.map((p) => [`${p.section}:${p.paragraph}`, p]));
  for (const note of content.hwp5Notes ?? []) {
    const host = paragraphs.get(`${note.section}:${note.hostParagraph}`);
    if (!host || host.text[note.anchorUnit] !== "￼" || host.automaticNumbers?.some((row) => row.unit === note.anchorUnit))
      continue;
    const candidates = note.paragraphs.flatMap((id) => paragraphs.get(`${note.section}:${id}`)?.automaticNumbers ?? []);
    if (!candidates.length)
      continue;
    const number = candidates[0], expectedKind = note.kind === "footnote" ? 1 : note.kind === "endnote" ? 2 : null;
    if (expectedKind === null || candidates.some((candidate) => candidate.hwp5Source?.kind !== expectedKind || storedAutomaticNumberText(candidate.source) === null || candidate.source.values.num !== number.source?.values.num || candidate.source.format.supscript !== number.source?.format.supscript || JSON.stringify(candidate.source.format.raw) !== JSON.stringify(number.source?.format.raw)))
      continue;
    host.automaticNumbers ??= [];
    host.automaticNumbers.push({
      unit: note.anchorUnit,
      kind: "hwp5-note-reference",
      noteNode: note.controlNode,
      numberNode: number.numberNode,
      numberNodes: candidates.map((candidate) => candidate.numberNode),
      source: number.source
    });
  }
  return content;
}

// web/preview/hwp5-automatic-number-content.mjs
function ornament(unit) {
  if (unit >= 55296 && unit <= 57343)
    throw new Error("UnsupportedHwp5NumberOrnament");
  return unit === 0 ? "" : String.fromCharCode(unit);
}
function hwp5AutomaticNumberDisplay(row, host) {
  validateHwp5AutomaticNumberSources([row]);
  const format = hwp5NumberFormat(row.shape);
  const known = row.kind <= 5 && format !== null && (!row.superscript || row.kind === 1) && (row.attributes & ~8191) === 0 && row.extra_bytes === 0;
  return {
    values: { type_known: row.kind <= 5, num: row.number },
    format: {
      type_known: known,
      raw: [
        known ? format : "UNKNOWN",
        ornament(row.symbol),
        ornament(row.prefix),
        ornament(row.suffix)
      ],
      supscript: row.superscript
    },
    hwp5PageNumber: known && row.kind === 0 && ["header", "footer"].includes(host)
  };
}
function attachHwp5AutomaticNumbers(editor, content) {
  content.automaticNumberErrors = [];
  for (const paragraph of content.paragraphs) {
    paragraph.automaticNumbers = [];
    paragraph.automaticNumberPrefixes = [];
  }
  if (!editor)
    return content;
  for (let section = 0;section < editor.sectionCount(); section++) {
    try {
      const rows = validateHwp5AutomaticNumberSources(editor.automaticNumberSources(section)), prepared = [];
      for (const row of rows) {
        const paragraph = content.paragraphs.find((p) => p.section === section && p.paragraph === row.paragraph);
        if (!paragraph || paragraph.clipped)
          throw new Error("Hwp5AutomaticNumberOwnerMismatch");
        const unit = sourceDisplayPosition(row.current_unit, paragraph.sourceOffsets, paragraph.text.length);
        const end = sourceDisplayPosition(row.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
        if (end !== unit + 1 || paragraph.text[unit] !== "￼")
          throw new Error("Hwp5AutomaticNumberAnchorMismatch");
        const host = content.currentParagraphFlows.find((flow) => flow.section === section && flow.paragraph === row.paragraph)?.host;
        prepared.push({
          paragraph,
          number: {
            unit,
            numberNode: row.control_node,
            hwp5Source: row,
            source: hwp5AutomaticNumberDisplay(row, host)
          }
        });
      }
      for (const { paragraph, number } of prepared)
        paragraph.automaticNumbers.push(number);
    } catch (error) {
      content.automaticNumberErrors.push({ section, error: error.message });
    }
  }
  return attachHwp5NoteReferenceDisplay(content);
}

// web/preview/hwp5-page-control-content.mjs
function attachHwp5PageControls(editor, content) {
  content.pageControlSources = [];
  content.pageControlSourceErrors = [];
  for (const paragraph of content.paragraphs)
    paragraph.pageControls = [];
  if (!editor)
    return content;
  for (let section = 0;section < editor.sectionCount(); section++) {
    try {
      const rows = validateHwp5PageControlSources(editor.pageControlSources(section));
      const projected = rows.map((row) => {
        const owners = content.paragraphs.filter((p) => p.section === section && p.paragraph === row.paragraph);
        if (owners.length !== 1 || owners[0].clipped)
          throw new Error("Hwp5PageControlOwnerMismatch");
        const paragraph = owners[0], unit = sourceDisplayPosition(row.current_unit, paragraph.sourceOffsets, paragraph.text.length);
        const end = sourceDisplayPosition(row.current_unit + 8, paragraph.sourceOffsets, paragraph.text.length);
        if (end !== unit + 1 || paragraph.text[unit] !== "￼")
          throw new Error("Hwp5PageControlAnchorMismatch");
        return { ...row, section, unit };
      });
      content.pageControlSources.push(...projected);
      for (const row of projected)
        content.paragraphs.find((p) => p.section === section && p.paragraph === row.paragraph).pageControls.push(row);
    } catch (error) {
      content.pageControlSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-page-declaration-content.mjs
function attachHwp5PageDeclarations(editor, content, selectedSections = null) {
  content.pageSources = [];
  content.pageSourceErrors = [];
  content.sectionSources = [];
  content.sectionSourceErrors = [];
  if (!editor)
    return content;
  const sections = selectedSections ?? Array.from({ length: editor.sectionCount() }, (_, index) => index);
  for (const section of sections) {
    try {
      const setting = editor.sectionSettings(section);
      let fileVersion;
      try {
        fileVersion = editor.fileVersion?.();
      } catch (error) {
        if (error.message !== "Hwp5FileVersionAbiUnavailable")
          throw error;
      }
      content.sectionSources.push({
        section,
        ...setting,
        ...fileVersion === undefined ? {} : { fileVersion }
      });
    } catch (error) {
      content.sectionSourceErrors.push({ section, error: error.message });
    }
    try {
      content.pageSources.push({ section, ...editor.pageSettings(section) });
    } catch (error) {
      content.pageSourceErrors.push({ section, error: error.message });
    }
  }
  return content;
}

// web/preview/hwp5-page-content.mjs
function attachHwp5PageSources(editor, content) {
  attachHwp5PageDeclarations(editor, content);
  if (!editor)
    return attachHwp5PageControls(editor, attachHwp5ColumnDisplay(attachHwp5FlowSources(editor, content)));
  return attachHwp5DocumentProperties(editor, attachHwp5PageControls(editor, attachHwp5AutomaticNumbers(editor, attachHwp5ColumnDisplay(attachHwp5FlowSources(editor, content)))));
}

// web/preview/hwp5-picture-content.mjs
function attachHwp5Pictures(editor, content) {
  content.hwp5Pictures = [];
  content.hwp5PictureErrors = [];
  if (!editor)
    return content;
  for (const section of new Set((content.hwp5Drawings ?? []).map((row) => row.section))) {
    try {
      if (content.hwp5DrawingErrors?.some((row) => row.section === section) || content.hwp5DrawingMatrixErrors?.some((row) => row.section === section))
        throw new Error("IncompleteHwp5PictureOwners");
      const sources = validateHwp5PictureSources(editor.pictureSources(section, "base73"));
      const components = (content.hwp5DrawingMatrices ?? []).filter((row) => row.section === section && row.kind === "translation");
      const owners = new Map(components.map((row) => [row.component_node, row.owner_node]));
      if (owners.size !== components.length)
        throw new Error("AmbiguousHwp5PictureOwners");
      for (const source of sources)
        if (!owners.has(source.component_node) || owners.get(source.component_node) !== source.owner_node)
          throw new Error("Hwp5PictureOwnerMismatch");
      for (const root of content.hwp5Drawings.filter((row) => row.section === section && row.source.kind_id === 611346787)) {
        if (!sources.some((row) => row.component_node === root.componentNode && row.owner_node === root.controlNode))
          throw new Error("MissingHwp5PictureSource");
      }
      content.hwp5Pictures.push(...sources.map((source) => ({
        section,
        pictureNode: source.component_node,
        recordNode: source.picture_node,
        source
      })));
    } catch (error) {
      content.hwp5PictureErrors.push({ section, error: error.message });
    }
  }
  return content;
}
function readHwp5PictureBytes(editor, section, pictureNode) {
  const uint = (value) => Number.isInteger(value) && value >= 0 && value <= 4294967295;
  if (!uint(section) || !uint(pictureNode))
    throw new Error("InvalidHwp5PictureRequest");
  const sources = validateHwp5PictureSources(editor.pictureSources(section, "base73"));
  const selected = sources.filter((row) => row.component_node === pictureNode);
  if (selected.length !== 1)
    throw new Error("MissingHwp5PictureSource");
  return editor.binaryResource(selected[0].bin_data_id, { maxBytes: 32 * 1024 * 1024 });
}

// web/preview/hwp5-picture-tail-content.mjs
function attachHwp5PictureTails(editor, content) {
  content.hwp5PictureTails = [];
  content.hwp5PictureTailErrors = [];
  content.hwp5PictureAbsentTails = [];
  if (!editor)
    return content;
  for (const section of new Set((content.hwp5Pictures ?? []).map((row) => row.section))) {
    try {
      if (content.hwp5PictureErrors?.some((row) => row.section === section))
        throw new Error("IncompleteHwp5PictureSources");
      const version = editor.fileVersion();
      const raw = content.hwp5Pictures.filter((row) => row.section === section);
      if (hwp5PictureAbsentVersion(version)) {
        validateHwp5PictureSources(raw.map((row) => row.source));
        const selectedProfiles = raw.map((row) => hwp5PictureAbsentProfile(version, row.source)), profile = selectedProfiles[0];
        if (!profile || selectedProfiles.some((row) => row?.prefix !== profile.prefix) || new Set(raw.map((row) => row.pictureNode)).size !== raw.length || raw.some((row) => row.pictureNode !== row.source.component_node || row.recordNode !== row.source.picture_node))
          throw new Error("UnsupportedHwp5PictureAbsentTail");
        const selected = profile.prefix === "base73" ? raw.map((row) => row.source) : validateHwp5PictureSources(editor.pictureSources(section, profile.prefix));
        const byComponent = new Map(selected.map((row) => [row.component_node, row]));
        if (selected.length !== raw.length || byComponent.size !== raw.length)
          throw new Error("Hwp5PictureTailInventoryMismatch");
        const proofs = raw.map((row) => ({
          section,
          component_node: row.pictureNode,
          picture_node: row.recordNode,
          owner_node: row.source.owner_node,
          fileVersion: version,
          layout: profile.layout
        }));
        for (const [index, row] of raw.entries()) {
          const source = byComponent.get(row.pictureNode);
          if (!source || !hwp5PictureBaseMatches(row.source, source) || !hwp5PictureAbsentSourceMatches(proofs[index], source))
            throw new Error("UnsupportedHwp5PictureAbsentTail");
        }
        for (const row of raw)
          row.source = byComponent.get(row.pictureNode);
        content.hwp5PictureAbsentTails.push(...proofs);
        continue;
      }
      const layout = hwp5PictureTailLayout(version);
      if (layout === null)
        throw new Error("UnselectedHwp5PictureTailVersion");
      const tails = validateHwp5PictureTailSources(editor.pictureTailSources(section, layout));
      if (tails.some((row) => layout === "effects_only" ? row.image_width !== null || row.image_height !== null || row.image_alpha !== null || row.extra_bytes !== 0 : row.image_width === null || (layout === "dimensions8" ? row.image_alpha !== null : row.image_alpha === null)))
        throw new Error("Hwp5PictureTailLayoutMismatch");
      if (raw.length !== tails.length || new Set(raw.map((row) => row.pictureNode)).size !== raw.length)
        throw new Error("Hwp5PictureTailInventoryMismatch");
      for (const tail of tails) {
        if (!raw.some((row) => row.pictureNode === tail.component_node && row.recordNode === tail.picture_node && row.source.owner_node === tail.owner_node))
          throw new Error("Hwp5PictureTailOwnerMismatch");
      }
      content.hwp5PictureTails.push(...tails.map((row) => ({ ...row, section, fileVersion: version, layout })));
    } catch (error) {
      content.hwp5PictureTailErrors.push({ section, error: error.message });
    }
  }
  return content;
}

export { attachHwpxPageAreaDeclarations, attachHwpxStyles, attachTabDefinitions, attachSectionTabSources, attachHwp5Styles, attachHwp5Tables, hwp5ParagraphGeometry, attachHwp5ParagraphFormats, hwpxParagraphGeometry, attachHwpxParagraphFormats, attachHwp5Formulas, attachHwp5Forms, attachHwp5FormProperties, attachHwpxTables, attachHwpxTableBorders, attachDrawingTextBindings, attachEllipses, attachHwpxPictures, attachHwpxPictureCaptions, attachHwpxLines, attachHwpxConnectors, attachHwp5Lines, attachHwpxPageSettings, attachHwp5StructuralAnchors, attachHwp5MasterPages, attachHwp5Notes, attachHwp5Captions, attachHwp5Drawings, attachHwp5ColumnDisplay, attachHwp5AutomaticNumbers, attachHwp5PageControls, attachHwp5PageDeclarations, attachHwp5PageSources, attachHwp5Pictures, readHwp5PictureBytes, attachHwp5PictureTails };
