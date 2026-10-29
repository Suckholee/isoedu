'use client';
import {createContext,useContext,useEffect,useRef,useState} from 'react';
import {useAuth} from './AuthContext';
import {GROWTH_KEY,validateGrowthDraft} from '../lib/growthIntake.mjs';
const Context=createContext(null);
export function GrowthIntakeProvider({children}){
 const {user,isLoading}=useAuth(),[draft,setValue]=useState(null),[hydrated,setHydrated]=useState(false),[storageWarning,setWarning]=useState('');const current=useRef(null);
 useEffect(()=>{try{const raw=sessionStorage.getItem(GROWTH_KEY);if(raw){if(raw.length>10000)throw Error();const d=JSON.parse(raw);validateGrowthDraft(d);setValue(d);current.current=d;}}catch{setWarning('이 브라우저에서는 임시 보관이 제한될 수 있습니다.');}setHydrated(true);},[]);
 function setDraft(value){current.current=value;setValue(value);try{if(value)sessionStorage.setItem(GROWTH_KEY,JSON.stringify(value));else sessionStorage.removeItem(GROWTH_KEY);}catch{setWarning('현재 화면에서는 입력을 유지하지만 브라우저를 닫으면 사라질 수 있습니다.');}}
 useEffect(()=>{if(hydrated&&!isLoading&&draft?.ownerId&&draft.ownerId!==user?.id)setDraft(null);},[hydrated,isLoading,user?.id,draft?.ownerId]);
 const visible=!draft?.ownerId||draft.ownerId===user?.id?draft:null;
 return <Context.Provider value={{draft:visible,hydrated,setDraft,storageWarning,clearIf:id=>{if(current.current?.id===id)setDraft(null);}}}>{children}</Context.Provider>;
}
export const useGrowthIntake=()=>useContext(Context);
