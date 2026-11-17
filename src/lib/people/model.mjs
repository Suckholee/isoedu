import directory from './directory.json' with {type:'json'};
export const PROFILES=directory.profiles;
export const EXTERNAL_ARTICLES=directory.articles;
export const profilePath=profile=>`/people/${typeof profile==='string'?profile:profile.slug}`;
export const getProfile=slug=>PROFILES.find(p=>p.slug===slug)||null;
export function profileGroup(field){
 if(field==='전문 분야 소개 예정')return '소개 준비 중';
 if(/행정/.test(field))return '행정';
 if(/세무|회계/.test(field))return '세무 · 회계';
 if(/안전|노무/.test(field))return '안전 · 노무';
 return '경영 · AX · IT';
}
export function filterProfiles(query='',group='전체'){
 const term=query.toLowerCase().replace(/\s/g,'');
 return PROFILES.filter(p=>(group==='전체'||profileGroup(p.field)===group)&&`${p.name} ${p.field} ${p.org||''}`.toLowerCase().replace(/\s/g,'').includes(term));
}
export function contributionGroups(slug,articles=[]){
 return {authored:articles.filter(a=>a.author_slug===slug),reviewed:articles.filter(a=>a.reviewer_slug===slug),sourced:articles.filter(a=>a.source_author_slug===slug)};
}
export function attributionInput(input,now=new Date()){
 const author_slug=input.author_slug||null,reviewer_slug=input.reviewer_slug||null;
 const attribution_note=input.attribution_note||'',reviewed_on=input.reviewed_on||null;
 if((author_slug&&!getProfile(author_slug))||(reviewer_slug&&getProfile(reviewer_slug)?.entityType!=='Person'))throw Error('공개 프로필에서 작성자·검토자를 선택해 주세요.');
 if(typeof attribution_note!=='string'||attribution_note.length>2000||((author_slug||reviewer_slug)&&!attribution_note.trim()))throw Error('작성·검토 참여와 이름 공개를 확인한 근거를 입력해 주세요.');
 if(reviewer_slug){
  const date=new Date(`${reviewed_on}T00:00:00Z`);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  if(typeof reviewed_on!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(reviewed_on)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==reviewed_on||reviewed_on>today)throw Error('실제 검토일을 오늘 이전 날짜로 입력해 주세요.');
 }
 return {author_slug,reviewer_slug,attribution_note:attribution_note.trim(),reviewed_on:reviewer_slug?reviewed_on:null};
}
export function profileEntity(profile,origin){
 const url=origin+profilePath(profile);
 return {'@type':profile.entityType,'@id':url+'#entity',name:profile.name,url,description:profile.bio,sameAs:[...new Set([profile.sourceUrl,...(profile.publicLinks||[])])],...(profile.topics.length?{knowsAbout:profile.topics}:{}),...(profile.portrait?{image:origin+profile.portrait}:{}),...(profile.org&&profile.entityType==='Person'?{worksFor:{'@type':'Organization',name:profile.org}}:{})};
}
export function profileSchema(profile,origin,articles=[]){
 const groups=contributionGroups(profile.slug,articles);
 return {'@context':'https://schema.org','@type':'ProfilePage','@id':origin+profilePath(profile),url:origin+profilePath(profile),mainEntity:profileEntity(profile,origin),subjectOf:groups.sourced.map(a=>({'@type':'CreativeWork',name:a.title,url:a.url,creditText:`원문 ${profile.name} · ${a.attributionLabel}`})),hasPart:[...groups.authored.map(a=>({'@type':'Article',headline:a.title,url:a.url,author:{'@id':origin+profilePath(profile)+'#entity'}})),...groups.reviewed.map(a=>({'@type':'WebPage',name:a.title,url:a.url,reviewedBy:{'@id':origin+profilePath(profile)+'#entity'},lastReviewed:a.reviewed_on}))]};
}
