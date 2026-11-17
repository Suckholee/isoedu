import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import PublicPeopleFrame from '../../../components/PublicPeopleFrame';
import {PartnerBrandPage,PartnerPosts,PartnerSocialCards} from '../../../components/PartnerBrandPage';
import {EXTERNAL_ARTICLES,getProfile,profilePath,profileSchema,contributionGroups} from '../../../lib/people/model.mjs';
import {brandingProfile} from '../../../lib/people/branding.mjs';
import {readBranding,readSocialContent} from '../../../lib/people/branding-public';
import {readContributions} from '../../../lib/people/public';
import {SITE_ORIGIN,jsonLd} from '../../../lib/articles/seo.mjs';
export const dynamic='force-dynamic';
export async function generateMetadata({params}){
 const p=getProfile(params.slug);if(!p)notFound();const {content}=await readBranding(p.slug);
 return {title:`${p.name} · ${content.headline||p.field} | 써티멘토 파트너스`,description:content.about||p.bio,alternates:{canonical:SITE_ORIGIN+profilePath(p)},openGraph:{title:`${p.name} · ${content.headline||p.field}`,description:content.about||p.bio,url:SITE_ORIGIN+profilePath(p)}};
}
async function Contributions({profile}){
 const result=await readContributions(profile.slug),articles=[...EXTERNAL_ARTICLES,...result.articles];
 return <><PartnerPosts groups={contributionGroups(profile.slug,articles)} available={result.available}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(profileSchema(profile,SITE_ORIGIN,articles))}}/></>;
}
async function SocialContent({slug,branding}){return <PartnerSocialCards feeds={await readSocialContent(slug,branding)} links={branding.links}/>;}
export default async function ProfilePage({params}){
 const p=getProfile(params.slug);if(!p)notFound();const {content}=await readBranding(p.slug),profile=brandingProfile(p,content);
 return <PublicPeopleFrame><PartnerBrandPage profile={profile} branding={content}><Suspense fallback={<p role="status" className="text-sm text-slate-500">공개 글을 확인하고 있습니다.</p>}><Contributions profile={profile}/></Suspense><Suspense fallback={<p role="status" className="mt-4 text-sm text-slate-500">채널의 최신 콘텐츠를 확인하고 있습니다.</p>}><SocialContent slug={p.slug} branding={content}/></Suspense></PartnerBrandPage></PublicPeopleFrame>;
}
