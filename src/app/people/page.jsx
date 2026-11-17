import PeopleDirectory from '../../components/PeopleDirectory';
import PublicPeopleFrame from '../../components/PublicPeopleFrame';
import {PROFILES,profilePath} from '../../lib/people/model.mjs';
import {SITE_ORIGIN,jsonLd} from '../../lib/articles/seo.mjs';
export const metadata={title:'파트너스 | 써티멘토',description:'단단 스터디 인물·기관의 전문 분야, 개인 프로필과 작성·검토한 공개 글을 확인하세요.',alternates:{canonical:SITE_ORIGIN+'/people'}};
export default function PeoplePage(){
 const schema={'@context':'https://schema.org','@type':'ItemList',itemListElement:PROFILES.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:SITE_ORIGIN+profilePath(p)}))};
 return <PublicPeopleFrame><PeopleDirectory/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(schema)}}/></PublicPeopleFrame>;
}
