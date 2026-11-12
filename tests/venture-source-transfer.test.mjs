import test from 'node:test';
import assert from 'node:assert/strict';
import {retrySourceTransfer,sourceTransferMessage} from '../src/lib/venture/sourceTransfer.mjs';

test('immutable source transfer retries a lost reply and verifies the already uploaded object',async()=>{
 let calls=0,stored=false;const waits=[];
 const result=await retrySourceTransfer(async()=>{
  calls++;if(!stored){stored=true;throw new TypeError('Failed to fetch');}
  // The caller compares the immutable object's digest rather than overwriting it.
  return 'existing bytes verified';
 },{wait:async ms=>waits.push(ms)});
 assert.equal(result,'existing bytes verified');assert.equal(calls,2);assert.deepEqual(waits,[1000]);
});
test('source transfer retries are bounded and permission/size failures stop immediately',async()=>{
 let calls=0;await assert.rejects(()=>retrySourceTransfer(async()=>{calls++;throw {statusCode:'503',message:'unavailable'};},{wait:async()=>{}}));assert.equal(calls,3);
 for(const statusCode of [401,403,413]){calls=0;await assert.rejects(()=>retrySourceTransfer(async()=>{calls++;throw {statusCode};},{wait:async()=>{}}));assert.equal(calls,1);}
 assert.match(sourceTransferMessage({statusCode:413}),/크기/);assert.match(sourceTransferMessage({statusCode:403}),/권한/);assert.match(sourceTransferMessage({statusCode:503}),/503/);
});
test('stopping during source transfer retry does not send another request',async()=>{
 const controller=new AbortController();let calls=0;
 await assert.rejects(()=>retrySourceTransfer(async()=>{calls++;throw new TypeError('network');},{signal:controller.signal,wait:async()=>controller.abort()}),{name:'AbortError'});assert.equal(calls,1);
});
test('source analysis reconnects after gateway failure and never bypasses an active unit claim',async()=>{
 let calls=0;const result=await retrySourceTransfer(async()=>{if(++calls===1)throw Object.assign(Error('analysis timeout'),{status:502});return {source:{readyUnits:[1,2,3]}};},{wait:async()=>{}});
 assert.deepEqual(result.source.readyUnits,[1,2,3]);assert.equal(calls,2);
 calls=0;await assert.rejects(()=>retrySourceTransfer(async()=>{calls++;throw Object.assign(Error('another analysis pending'),{status:409});},{wait:async()=>{}}));assert.equal(calls,1);
});
