import {SITE_ORIGIN} from '../lib/articles/seo.mjs';
export default function robots(){return {rules:{userAgent:'*',allow:'/',disallow:['/api/','/auth/','/second-brain','/admin','/settings','/drive','/documents','/workspace']},sitemap:SITE_ORIGIN+'/sitemap.xml'};}
