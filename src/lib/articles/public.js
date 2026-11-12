import {createClient} from '@supabase/supabase-js';
import {dataConfig} from '../dataConfig';
export function publicArticleDb(){return dataConfig.configured?createClient(dataConfig.url,dataConfig.key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,cache:'no-store',signal:AbortSignal.timeout(10000)})}}):null;}
export function articleCard(row){return {id:'site-'+row.id,title:row.title,date:row.published_at,category:row.category,siteUrl:`/insights/${row.id}`,blogUrl:null,source:'site',aiGenerated:row.ai_generated};}
