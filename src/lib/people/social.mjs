import {XMLParser,XMLValidator} from 'fast-xml-parser';
import {publicLink} from './branding.mjs';
import {plain} from '../articles/feed.mjs';

async function limitedBody(response,max=1_000_000){
  if(!response.ok||!response.body)throw Error('채널 연결 실패');
  const reader=response.body.getReader(),decoder=new TextDecoder();let size=0,body='';
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw Error('채널 응답 크기 초과');body+=decoder.decode(value,{stream:true});}return body+decoder.decode();}finally{await reader.cancel();}
}
const options=()=>({cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
export function parseYoutubeFeed(xml,channelId,now=Date.now()){
  if(typeof xml!=='string'||xml.length>1_000_000||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw Error('채널 피드 형식 오류');
  const feed=new XMLParser({ignoreAttributes:true,parseTagValue:false}).parse(xml)?.feed;
  const matchesChannel=feed&&(feed['yt:channelId']===channelId||(feed['yt:channelId']===channelId.slice(2)&&feed.author?.uri===`https://www.youtube.com/channel/${channelId}`));
  if(!matchesChannel)throw Error('채널이 일치하지 않습니다.');
  return [...new Map([].concat(feed.entry||[]).flatMap(e=>{
    const id=e['yt:videoId'],date=Date.parse(e.published),title=plain(e.title).slice(0,200);
    if(!/^[A-Za-z0-9_-]{11}$/.test(id||'')||e['yt:channelId']!==channelId||!title||!Number.isFinite(date)||date>now+300000)return [];
    return [[id,{id,provider:'youtube',title,date:new Date(date).toISOString(),url:`https://www.youtube.com/watch?v=${id}`,image:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}]];
  })).values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);
}
export async function youtubeFeed(branding,fetchImpl=fetch){
  publicLink(branding.links.youtube,'youtube');
  const id=branding.youtubeChannelId;
  if(!/^UC[A-Za-z0-9_-]{22}$/.test(id||''))return {provider:'youtube',status:'needs_channel',items:[]};
  const xml=await limitedBody(await fetchImpl(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`,options()));
  return {provider:'youtube',status:'connected',items:parseYoutubeFeed(xml,id),checkedAt:new Date().toISOString()};
}
export function instagramConnection(slug,env=process.env){
  try{const value=JSON.parse(env.PARTNER_INSTAGRAM_CONNECTIONS||'{}')[slug];return value&&/^\d{5,30}$/.test(value.userId)&&typeof value.accessToken==='string'&&value.accessToken.length>20?value:null;}catch{return null;}
}
export async function instagramFeed(slug,branding,{fetchImpl=fetch,env=process.env}={}){
  const profile=new URL(publicLink(branding.links.instagram,'instagram')),username=profile.pathname.split('/')[1].toLowerCase(),connection=instagramConnection(slug,env);
  if(!connection)return {provider:'instagram',status:'needs_connection',items:[]};
  const version=env.INSTAGRAM_GRAPH_VERSION;
  if(!/^v\d+\.0$/.test(version||''))return {provider:'instagram',status:'needs_connection',items:[]};
  const base=`https://graph.instagram.com/${version}`;
  const read=async suffix=>JSON.parse(await limitedBody(await fetchImpl(base+suffix,{...options(),headers:{Authorization:`Bearer ${connection.accessToken}`}})));
  const identityResponse=await read('/me?fields=user_id,username');
  const identity=identityResponse.data?.[0]||identityResponse;
  if(String(identity.user_id)!==connection.userId||identity.username?.toLowerCase()!==username)throw Error('연결된 인스타그램 계정이 다릅니다.');
  const data=await read(`/${connection.userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=6`);
  if(!Array.isArray(data.data))throw Error('콘텐츠를 확인하지 못했습니다.');
  const items=data.data.flatMap(item=>{
    let url;try{url=new URL(item.permalink);if(url.protocol!=='https:'||url.username||url.password||!['www.instagram.com','instagram.com'].includes(url.hostname)||!/^\/(p|reel)\/[\w-]+\/?$/.test(url.pathname))return [];}catch{return [];}
    const date=Date.parse(item.timestamp);if(!Number.isFinite(date)||date>Date.now()+300000)return [];
    let image='';try{const img=new URL(item.thumbnail_url||item.media_url);if(img.protocol==='https:'&&!img.username&&!img.password&&!img.port&&['cdninstagram.com','fbcdn.net'].some(host=>img.hostname===host||img.hostname.endsWith('.'+host)))image=img.href;}catch{}
    return [{id:String(item.id),provider:'instagram',title:plain(item.caption).slice(0,200)||'Instagram 게시물',url:url.href,image,date:new Date(date).toISOString()}];
  });
  return {provider:'instagram',status:'connected',items,checkedAt:new Date().toISOString()};
}
