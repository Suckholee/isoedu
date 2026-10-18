'use client';
import {useEffect,useRef} from 'react';
import {modalDismissal} from '../../lib/modalDismissal.mjs';
export default function ModalLayer({onClose,children,...props}){
 const root=useRef(null),close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  const node=root.current,previous=document.activeElement;
  const unregister=modalDismissal.register(node,()=>close.current?.());
  const keydown=event=>modalDismissal.keydown(event);
  window.addEventListener('keydown',keydown,true);
  return()=>{unregister();window.removeEventListener('keydown',keydown,true);if(previous?.isConnected&&(node.contains(document.activeElement)||document.activeElement===document.body))previous.focus?.();};
 },[]);
 return <div {...props} ref={root} data-modal-layer="true" onClick={event=>modalDismissal.backdrop(root.current,event)}>{children}</div>;
}
