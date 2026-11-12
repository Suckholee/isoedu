import {test} from 'node:test';import assert from 'node:assert/strict';
import {preparationPath,parsePreparationPath} from '../src/lib/preparationRoutes.mjs';
import {validPlatformPath} from '../src/lib/platformRoutes.mjs';
const projectId='6d2ea069-6379-48bb-85bc-b358818ddd1c',documentId='d594eadb-598a-4482-a859-4ed99c0cab68';
test('document and original-file subroutes roundtrip, malformed paths stay unavailable',()=>{
 for(const type of ['documents','files']){const path=preparationPath({projectId,...(type==='files'?{fileId:documentId}:{documentId})});const route=parsePreparationPath(path);assert.equal(route.projectId,projectId);assert.equal(type==='files'?route.fileId:route.documentId,documentId);assert(validPlatformPath('dashboard',path.split('/').slice(2)));}
 assert.equal(parsePreparationPath('/dashboard/preparation/other/business-plan'),null);
 assert.equal(parsePreparationPath(`/dashboard/preparation/${projectId}/business-plan/unknown/${documentId}`),null);
 assert.equal(validPlatformPath('dashboard',['unknown']),false);
 assert.throws(()=>preparationPath({projectId,requestId:'../other'}));
});
