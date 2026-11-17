import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {sourceTableCellInsets} from '../vendor/hwpjs-0.1.1/chunk-a94gkc3m.js';
import {topBaselineInk} from '../vendor/hwpjs-0.1.1/certimento-ink.js';
import {HWP_RENDER_VERSION,needsHwpImageRefresh} from '../src/lib/businessPlans/hwpRenderVersion.mjs';
import {visualKey,documentEvaluationState} from '../src/lib/businessPlans/visionActions.mjs';
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
test('glyph ink stays inside the allocated line at a split table edge',()=>{
 for(const metrics of [
  {actualBoundingBoxAscent:3.265625,actualBoundingBoxDescent:16.734375},
  {actualBoundingBoxAscent:-.716714,actualBoundingBoxDescent:12.74579},
  {actualBoundingBoxAscent:0,actualBoundingBoxDescent:14}
 ]){const ink=topBaselineInk(metrics);assert(ink.offset-metrics.actualBoundingBoxAscent>=0);assert(ink.offset+metrics.actualBoundingBoxDescent<=ink.height);}
 assert.deepEqual(topBaselineInk({}),{offset:0,height:0});
});
test('HWP preview reserves border clearance without changing wider source margins or overflowing narrow cells',()=>{
 const table={sourceGeometry:{in_margin:[0,0,0,0]}};
 const cell={width:7500,height:1500,sourceMargin:{has_margin:false}};
 assert.deepEqual(sourceTableCellInsets(table,cell),{left:4,right:4,top:2.5,bottom:2.5});
 const narrow={...cell,width:150,height:150};
 const inset=sourceTableCellInsets(table,narrow);
 assert.equal(inset.left,.25);assert.equal(inset.right,.25);assert.equal(inset.top,.25);
 assert.deepEqual(sourceTableCellInsets(table,{...cell,sourceMargin:{has_margin:true,margin:[600,600,600,600]}}),{left:8,right:8,top:8,bottom:8});
 assert.equal(sourceTableCellInsets(table,{...cell,sourceMargin:{has_margin:true,margin:[-1,0,0,0]}}),null);
});
test('new HWP geometry invalidates only native image caches and current overlays, preserving source review records',()=>{
 const row={metadata:{format:'HWP',originalPath:'private/original.hwp',sourceUpload:{fingerprint:'original'},sourceVision:{key:hash(['original','private/original.hwp']),pages:[{id:1,hash:'old'}],prepared:true},sourceReview:{content:'보완 내용',revision:2},sourceCoach:{documents:[{key:'old-report'}],turns:[{id:'saved-chat'}]}}};
 const before=structuredClone(row);
 assert.equal(needsHwpImageRefresh(row),true);assert.notEqual(visualKey(row),row.metadata.sourceVision.key);
 assert.equal(documentEvaluationState(row).total,0);assert.deepEqual(row,before);
 row.metadata.sourceVision.rendererVersion=HWP_RENDER_VERSION;assert.equal(needsHwpImageRefresh(row),false);
 row.metadata.sourceRender={path:'private/attached.pdf'};assert.equal(visualKey(row),hash(['original','private/attached.pdf']));
 row.metadata.format='PDF';delete row.metadata.sourceRender;assert.equal(visualKey(row),hash(['original','private/original.hwp']));
});
