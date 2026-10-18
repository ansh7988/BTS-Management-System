import {useEffect,useRef} from 'react'
import {INTRO} from './config.js'
import BuiltInIntro from './BuiltInIntro.jsx'
// Shows the intro, then calls done(). The "ENTER" button is always there. A custom intro can end itself with:
//   window.parent.postMessage({type:'bts-intro-done'},'*')
export const introSeen=()=>{try{return INTRO.oncePerSession&&sessionStorage.getItem('bts-intro')==='1'}catch{return false}}
export default function IntroScreen({done}){
 const fin=useRef(false),go=()=>{if(fin.current)return;fin.current=true;try{sessionStorage.setItem('bts-intro','1')}catch{}done()}
 useEffect(()=>{const calm=matchMedia('(prefers-reduced-motion:reduce)').matches,custom=INTRO.mode==='custom-html'
  const t=setTimeout(go,custom?INTRO.maxMs:calm?INTRO.reducedMotionMs:INTRO.minMs)
  const on=e=>{if(e.data?.type==='bts-intro-done')go()};addEventListener('message',on);return()=>{clearTimeout(t);removeEventListener('message',on)}},[])
 return<div className="intro-wrap">{INTRO.mode==='custom-html'?<iframe title="BTS intro" src={INTRO.customUrl} sandbox="allow-scripts" className="intro-frame"/>:<BuiltInIntro/>}
</div>}