// A single Escape dismisses only the visually uppermost registered layer.
export function createModalDismissalManager(){
 const entries=new Set();
 const stackingLevel=node=>Math.max(0,...[...entries].filter(e=>e.node===node||e.node.contains(node)).map(e=>Number(e.node.ownerDocument.defaultView.getComputedStyle(e.node).zIndex)||0));
 function top(){return [...entries].filter(e=>e.node.isConnected).sort((a,b)=>{
  if(a.node.contains(b.node))return -1;
  if(b.node.contains(a.node))return 1;
  const az=stackingLevel(a.node);
  const bz=stackingLevel(b.node);
  if(az!==bz)return az-bz;
  return a.node.compareDocumentPosition(b.node)&4?-1:1;
 }).at(-1);}
 return {
  register(node,close){const entry={node,close};entries.add(entry);return()=>entries.delete(entry);},
  keydown(event){if(event.key!=='Escape'||event.isComposing||event.defaultPrevented)return;const entry=top();if(!entry)return;event.preventDefault();event.stopImmediatePropagation();entry.close();},
  backdrop(node,event){if(event.target===event.currentTarget&&top()?.node===node){event.stopPropagation();top().close();}},
 };
}
export const modalDismissal=createModalDismissalManager();
