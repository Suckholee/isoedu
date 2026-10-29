// Match across PDF text fragments while preserving original UTF-16 offsets.
export function findPdfMatches(strings,query){
 const source=strings.join('');let text='',starts=[],ends=[],offset=0;
 for(const char of source){const normalized=char.normalize('NFKC').toLowerCase().replace(/\s/g,'');for(let i=0;i<normalized.length;i++){text+=normalized[i];starts.push(offset);ends.push(offset+char.length);}offset+=char.length;}
 const needle=query.normalize('NFKC').toLowerCase().replace(/\s/g,'');if(!needle)return [];
 const matches=[];for(let index=text.indexOf(needle);index!==-1;index=text.indexOf(needle,index+needle.length))matches.push({start:starts[index],end:ends[index+needle.length-1]});return matches;
}
export function splitPdfHighlights(text,offset,matches){
 const parts=[];let cursor=0;
 for(const match of matches){const start=Math.max(0,match.start-offset),end=Math.min(text.length,match.end-offset);if(end<=start)continue;if(start>cursor)parts.push({text:text.slice(cursor,start)});parts.push({text:text.slice(start,end),hit:match.hit});cursor=end;}
 if(cursor<text.length)parts.push({text:text.slice(cursor)});return parts;
}
