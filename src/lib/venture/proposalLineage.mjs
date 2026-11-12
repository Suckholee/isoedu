// One review saves the current draft assembled from source imports and chat edits.
export function proposalParents(chat={},excludeId){
 const active=chat.proposal?[chat.proposal.turnId,...(chat.proposal.parentTurnIds||[])]:[];
 const pending=(chat.turns||[]).filter(t=>t.state==='ready'&&!t.savedRevision&&!t.discarded).map(t=>t.id);
 return [...new Set([...active,...pending])].filter(id=>id&&id!==excludeId);
}
