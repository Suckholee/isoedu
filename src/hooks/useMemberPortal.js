'use client';
import {useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {isCloudMode} from '../lib/dataConfig';
import {companyRpc} from '../lib/companyProjectRepository';
const DEMO={mode:'consultant',companies:[],requests:[]};
export function useMemberPortal(){
 const {user,profile,isLoading}=useAuth(),[snapshot,setSnapshot]=useState(null),[revision,setRevision]=useState(0),identity=`${user?.id||''}/${profile?.id||''}`;
 useEffect(()=>{let active=true;if(!isCloudMode||isLoading||!user||!profile)return;
  companyRpc('my_company_connections',{}).then(data=>{if(!Array.isArray(data?.companies)||!['enterprise','consultant','admin','auditor'].includes(data.mode))throw Error('회원 화면 정보를 확인하지 못했습니다.');if(active)setSnapshot({identity,data,error:''});}).catch(e=>{if(active)setSnapshot({identity,data:null,error:e.message});});return()=>{active=false;};
 },[identity,isLoading,revision]);
 useEffect(()=>{const refresh=()=>setRevision(v=>v+1);window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[]);
 const current=snapshot?.identity===identity?snapshot:null,context=isCloudMode?current?.data:DEMO,error=current?.error||'';
 return {context,error,loading:isCloudMode&&(isLoading||Boolean(user&&(!profile||!context&&!error))),reload:()=>{setSnapshot(s=>s?.error?null:s);setRevision(v=>v+1);},enterprise:context?.mode==='enterprise'};
}
