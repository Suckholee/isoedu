// Bump when font metrics, pagination, or rasterization changes. Old images and
// their evaluations must never be reused for a different page layout.
export const HWP_RENDER_VERSION='hwpjs-0.1.1-font-ink-v4';
export const usesNativeHwpRenderer=row=>['HWP','HWPX'].includes(row.metadata.format)&&!row.metadata.sourceRender?.path;
export const needsHwpImageRefresh=row=>usesNativeHwpRenderer(row)&&Boolean(row.metadata.sourceVision?.pages?.length)&&row.metadata.sourceVision.rendererVersion!==HWP_RENDER_VERSION;
