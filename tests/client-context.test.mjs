import test from 'node:test';import assert from 'node:assert/strict';
import {managedClients,resolveClient,clientContextSearch} from '../src/lib/clientContext.mjs';
import {platformHref} from '../src/lib/platformRoutes.mjs';
test('operating workspace is excluded and global client context survives navigation without old document/task state',()=>{
 const clients=managedClients([{id:'w',name:'어니스톤'},{id:'b',name:'나무'},{id:'a',name:'경호'}],'w');assert.deepEqual(clients.map(c=>c.id),['a','b']);
 const p=clientContextSearch('scope=today&standard=ISO_9001&task=old&file=secret&folder=old&client=wrong',{id:'a'});
 assert.equal(p.get('company'),'a');assert.equal(p.get('task'),null);assert.equal(p.get('file'),null);assert.equal(p.get('scope'),'today');
 assert.match(platformHref('schedule',p.toString()),/company=a/);assert.equal(resolveClient(clients,'w'),null);assert.equal(clientContextSearch(p.toString(),null).get('company'),null);
});
