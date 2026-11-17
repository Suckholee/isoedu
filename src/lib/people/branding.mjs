import {getProfile} from './model.mjs';

export class BrandingError extends Error {
  constructor(message,status=400){super(message);this.status=status;}
}
const text=(value,max,label)=>{
  if(value==null)return '';
  if(typeof value!=='string'||value.length>max)throw new BrandingError(`${label}은 ${max}자 이내로 입력해 주세요.`);
  return value.trim();
};
export function publicLink(value,kind='website'){
  if(!value)return '';
  try{
    const u=new URL(value);
    if(u.protocol!=='https:'||u.username||u.password||u.port||u.href.length>1000)throw Error();
    if(kind==='instagram'&&(!['instagram.com','www.instagram.com'].includes(u.hostname)||!/^\/[A-Za-z0-9._]{1,30}\/?$/.test(u.pathname)||['p','reel','reels','stories','explore','accounts','direct'].includes(u.pathname.split('/')[1])))throw Error();
    if(kind==='youtube'&&(!['youtube.com','www.youtube.com'].includes(u.hostname)||!/^\/(?:channel\/UC[A-Za-z0-9_-]{22}|@[A-Za-z0-9_.%\-]+)\/?$/.test(u.pathname)))throw Error();
    if(kind!=='website'){u.search='';u.hash='';}
    return u.href;
  }catch{throw new BrandingError(`${kind==='instagram'?'인스타그램 프로필':kind==='youtube'?'유튜브 채널':'웹사이트'}의 올바른 https 주소를 입력해 주세요.`);}
}
export function brandingDefaults(slug){
  const p=getProfile(slug);if(!p)throw new BrandingError('등록된 파트너를 찾을 수 없습니다.',404);
  const cho=slug==='youngbin-cho';
  return {headline:p.field,about:p.bio,services:[...p.topics],links:{website:cho?'https://honestone.kr/':'',instagram:cho?'https://www.instagram.com/honestone_kevin/':'',youtube:cho?'https://www.youtube.com/channel/UC4bv_sw6JudKORw7lbLxe6w':''},youtubeChannelId:cho?'UC4bv_sw6JudKORw7lbLxe6w':'',clients:[],work:[],publicationNote:''};
}
export function brandingInput(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new BrandingError('프로필 입력을 확인해 주세요.');
  const services=input.services??[];
  if(!Array.isArray(services)||services.length>12)throw new BrandingError('전문 분야는 최대 12개까지 등록할 수 있습니다.');
  const links={};for(const key of ['website','instagram','youtube'])links[key]=publicLink(input.links?.[key]||'',key);
  const youtubeChannelId=text(input.youtubeChannelId,24,'유튜브 채널 ID');
  if(youtubeChannelId&&!/^UC[A-Za-z0-9_-]{22}$/.test(youtubeChannelId))throw new BrandingError('유튜브 채널 ID를 확인해 주세요.');
  const channel=links.youtube.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
  if(channel&&youtubeChannelId&&channel[1]!==youtubeChannelId)throw new BrandingError('유튜브 주소와 채널 ID가 일치하지 않습니다.');
  if(youtubeChannelId&&!links.youtube)throw new BrandingError('유튜브 채널 주소를 함께 입력해 주세요.');
  const list=(key)=>{
    const rows=input[key]??[];if(!Array.isArray(rows)||rows.length>24)throw new BrandingError('고객사와 작업 이력은 각각 최대 24개까지 등록할 수 있습니다.');
    const ids=new Set();return rows.map(row=>{
      if(!row||typeof row!=='object'||typeof row.isPublic!=='boolean')throw new BrandingError('항목별 공개 여부를 선택해 주세요.');
      const id=text(row.id,64,'항목 ID');if(!/^[a-zA-Z0-9_-]+$/.test(id)||ids.has(id))throw new BrandingError('항목 식별자가 중복되거나 올바르지 않습니다.');ids.add(id);
      const item={id,isPublic:row.isPublic,url:publicLink(row.url)};
      const fields=key==='clients'?{name:100,summary:300}:{title:160,client:100,period:80,role:100,description:2000};
      for(const [field,max] of Object.entries(fields))item[field]=text(row[field],max,field);
      if(!item[key==='clients'?'name':'title'])throw new BrandingError(key==='clients'?'고객사 이름을 입력해 주세요.':'작업 제목을 입력해 주세요.');
      return item;
    });
  };
  return {headline:text(input.headline,160,'한 줄 소개'),about:text(input.about,5000,'소개'),services:[...new Set(services.map(s=>text(s,60,'전문 분야')).filter(Boolean))],links,youtubeChannelId:channel?.[1]||youtubeChannelId,clients:list('clients'),work:list('work'),publicationNote:text(input.publicationNote,2000,'공개 확인 근거')};
}
export function publishedBranding(input){
  const b=brandingInput(input),{publicationNote,...visible}=b;
  for(const key of ['clients','work'])visible[key]=b[key].filter(x=>x.isPublic).map(({isPublic,...item})=>item);
  return visible;
}
export function brandingProfile(profile,branding){
  return {...profile,bio:branding.about||profile.bio,headline:branding.headline||profile.field,topics:branding.services.length?branding.services:profile.topics,publicLinks:Object.values(branding.links).filter(Boolean)};
}
