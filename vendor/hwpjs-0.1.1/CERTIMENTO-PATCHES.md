# Pinned HWPJS browser renderer

Source: @ohah/hwpjs 0.1.1 from npm, https://github.com/ohah/hwpjs (MIT). Original package README and THIRD_PARTY_NOTICES are included. Runtime assets are served from the same application origin; user documents are never sent to a converter service.

Local patches in chunk-sg8m4ms8.js:
- Resolve the self-package EditorState import to ./index.js for browser modules.
- Table vertical alignment permits a 1e-7 px floating-point tolerance and clamps negative residual shift to zero. Real fixture required=226.42666666666665 vs cellHeight=226.42666666666662 (roundoff only). Larger overflows still fail.

The adapter rejects incomplete/nonpaginated layout. Package upgrades require real document layout and image checks. Original source documents are private and excluded from this directory.

2026-11-17 page readability correction (font-ink-v4):
- Prepare the bundled Noto Sans KR variable font before measuring the document; use it as the canvas fallback instead of an OS-dependent system font. Preserve source font declarations when available. Font loading failures stop image completion.
- Rasterize the canvas at 2x and crop in 2x pixel coordinates. The previous adapter enlarged a 1x image, smearing glyph strokes into thin borders.
- In chunk-a94gkc3m.js, source cell insets have a preview minimum of 4px horizontally/3px vertically (capped at one eighth of source cell size). Apply the same insets to measuring, wrapping, pagination and drawing; do not paint over neighbouring cells or shrink text to hide overflow. Larger source margins stay intact. Printing pagination may differ.
- Renderer version participates only in direct HWP/HWPX image keys. Preserve previous page manifests and evaluation/chat/review history; do not reuse previous geometry/overlays after pagination changes. PDF attachments keep their existing keys.
- Font file copied unchanged from installed @ohah/hwpjs/fonts/NotoSansKR-Regular.ttf. Upstream: https://github.com/google/fonts/tree/main/ofl/notosanskr ; license fonts/OFL.txt (SIL OFL 1.1).
- Text measurement now uses the same top baseline as painting. `certimento-ink.js` reserves the complete actual ink box and offsets glyphs whose ink rises above the top baseline (real split-cell emoji ascent 3.265625px). This prevents glyph tops from crossing a continued-cell boundary.
