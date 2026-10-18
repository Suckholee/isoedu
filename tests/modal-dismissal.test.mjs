import test from 'node:test';
import assert from 'node:assert/strict';
import {createModalDismissalManager} from '../src/lib/modalDismissal.mjs';
function layer(order,zIndex=50,parent=null){return {order,zIndex,parent,isConnected:true,ownerDocument:{defaultView:{getComputedStyle:n=>({zIndex:n.zIndex})}},contains(other){for(let n=other;n;n=n.parent)if(n===this)return true;return false;},compareDocumentPosition(n){return this.order<n.order?4:2;}};}
function escape(extra={}){return {key:'Escape',isComposing:false,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};}
test('Escape closes only the top visible layer, regardless of effect registration order',()=>{
 const m=createModalDismissalManager(),closed=[],back=layer(1),front=layer(2);
 const remove=m.register(front,()=>closed.push('front'));m.register(back,()=>closed.push('back'));
 const e=escape();m.keydown(e);assert.deepEqual(closed,['front']);assert.equal(e.stopped,true);
 remove();m.keydown(escape());assert.deepEqual(closed,['front','back']);
});
test('stacking level and nested layers take precedence over DOM registration order',()=>{
 const m=createModalDismissalManager(),closed=[],high=layer(1,90),low=layer(2,50),nested=layer(0,10,high);
 m.register(low,()=>closed.push('low'));m.register(nested,()=>closed.push('nested'));m.register(high,()=>closed.push('high'));
 m.keydown(escape());assert.deepEqual(closed,['nested']);
});
test('inside clicks and lower backdrop clicks never dismiss a modal',()=>{
 const m=createModalDismissalManager(),node=layer(1),top=layer(2);let count=0;m.register(node,()=>count++);m.register(top,()=>count++);
 const event=(target,currentTarget)=>({target,currentTarget,stopPropagation(){}});
 m.backdrop(top,event({},top));m.backdrop(node,event(node,node));assert.equal(count,0);
 m.backdrop(top,event(top,top));assert.equal(count,1);
});
test('composition, handled keys, other keys and disconnected layers are ignored',()=>{
 const m=createModalDismissalManager(),node=layer(1);let count=0;const remove=m.register(node,()=>count++);
 m.keydown(escape({isComposing:true}));m.keydown(escape({defaultPrevented:true}));m.keydown(escape({key:'Enter'}));node.isConnected=false;m.keydown(escape());remove();m.keydown(escape());assert.equal(count,0);
});
