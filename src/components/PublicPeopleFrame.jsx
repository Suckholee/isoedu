'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '../context/AuthContext';
import LandingMasthead from './LandingMasthead';
import AuthModal from './AuthModal';
export default function PublicPeopleFrame({children}){
 const {user}=useAuth(),router=useRouter(),[auth,setAuth]=useState(false);
 return <main><LandingMasthead user={user} onLogin={()=>setAuth(true)} onStart={key=>router.push(key?`/?interest=${encodeURIComponent(key)}#start`:'/#start')} pageContent={children}/><AuthModal brandName="써티멘토" isOpen={auth} onClose={()=>setAuth(false)} initialMode="login"/></main>;
}
