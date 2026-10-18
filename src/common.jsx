import {st,inr} from './db.js'
export {todayIST as today} from './db.js'
export const wa=t=>'https://wa.me/?text='+encodeURIComponent(t)
export const uid=()=>globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=globalThis.crypto.getRandomValues(new Uint8Array(1))[0]&15;return(c==='x'?r:(r&3)|8).toString(16)})
export const phoneOk=p=>!p||/^\+?\d{10,13}$/.test(p.replace(/[\s-]/g,''))
export const cleanPhone=p=>(p||'').replace(/[\s-]/g,'')
export const pick=async set=>{const c=navigator.contacts;if(!c?.select)return alert('Contact picker is not available on this browser. Please type the details.');try{const r=await c.select(['name','tel'],{multiple:false});if(r[0])set(r[0].name?.[0]||'',cleanPhone(r[0].tel?.[0]||''))}catch{}}
export const Call=({n,t='Call'})=>n?<a className="btn o" href={'tel:'+n.replace(/[^\d+]/g,'')}>📞 {t}</a>:null
export const Pill=({v})=><span className={'pill '+v}>{v}</span>
export const Stat=({t,v,s})=><div className="card"><div className="sm">{t}</div><div className="big">{v}</div>{s&&<div className="sm">{s}</div>}</div>
export const ShipCard=({s,go})=><div className="card tap" onClick={()=>go('ship',s.id)}><div className="row"><b>{s.code}</b><Pill v={s.status}/></div><div>{s.truck_no} · {s.co?.name||'—'}</div><div className="sm">{s.origin} → {s.destination}</div><div className="row sm"><span>To receive: <b>{inr(s.recBal)}</b></span><span>To pay: <b>{inr(s.payBal)}</b></span></div></div>
export const Back=({go,to,t})=><button className="btn o" style={{marginBottom:8}} onClick={()=>go(to)}>← {t}</button>
export {st}
