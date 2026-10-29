'use client';
import {useEffect,useState} from 'react';
export function usePublicPrograms(){
 const [feed,setFeed]=useState({programs:[],coverage:'',lastChecked:null}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();const timeout=setTimeout(()=>{controller.abort();setError('공고 응답이 지연되고 있습니다. 다시 불러오기를 눌러 주세요.');setLoading(false);},15000);setLoading(true);setError('');fetch('/api/government-programs',{cache:'no-store',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data.programs))throw Error();if(!controller.signal.aborted)setFeed(data);}).catch(e=>{if(e.name!=='AbortError'&&!controller.signal.aborted)setError('공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');}).finally(()=>{clearTimeout(timeout);if(!controller.signal.aborted)setLoading(false);});return()=>{clearTimeout(timeout);controller.abort();};},[revision]);
 return {...feed,loading,error,reload:()=>setRevision(v=>v+1)};
}
