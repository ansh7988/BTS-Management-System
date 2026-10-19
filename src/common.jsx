import {st,inr} from './db.js'
export {todayIST as today} from './db.js'
export const wa=t=>'https://wa.me/?text='+encodeURIComponent(t)
export const uid=()=>globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=globalThis.crypto.getRandomValues(new Uint8Array(1))[0]&15;return(c==='x'?r:(r&3)|8).toString(16)})
export const phoneOk=p=>!p||/^\+?\d{10,13}$/.test(p.replace(/[\s-]/g,''))
export const cleanPhone=p=>(p||'').replace(/[\s-]/g,'')
export const pick=async set=>{const c=navigator.contacts;if(!c?.select)return alert('Contact picker is not available on this browser. Please type the details.');try{const r=await c.select(['name','tel'],{multiple:false});if(r[0])set(r[0].name?.[0]||'',cleanPhone(r[0].tel?.[0]||''))}catch{}}
// ---- Icons: one consistent line-icon set (24px grid, 1.7 stroke) ----
const P={
 dash:<><rect x="4" y="4" width="6.5" height="7.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="4.5" rx="1"/><rect x="13.5" y="11.5" width="6.5" height="8.5" rx="1"/><rect x="4" y="14.5" width="6.5" height="5.5" rx="1"/></>,
 truck:<><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></>,
 plus:<path d="M12 5v14M5 12h14"/>,
 building:<><path d="M5 21V4.5L13 3v18"/><path d="M13 9l6 1.5V21"/><path d="M8.5 8h1M8.5 12h1M8.5 16h1M16 14h1M16 17.5h1"/><path d="M3 21h18"/></>,
 user:<><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/></>,
 recv:<><path d="M12 4v11"/><path d="M7.5 11l4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/></>,
 pay:<><path d="M12 15.5V4.5"/><path d="M7.5 8.5L12 4l4.5 4.5"/><path d="M5 19.5h14"/></>,
 receipt:<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></>,
 percent:<><path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.3"/><circle cx="17" cy="17" r="2.3"/></>,
 chart:<><path d="M5.5 20v-7M12 20V5M18.5 20v-10"/><path d="M3 20.5h18"/></>,
 sliders:<><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></>,
 phone:<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 006 6l1.5-2 4 1.5v3a2 2 0 01-2 2A16 16 0 014.5 5.5a2 2 0 012-2z"/>,
 back:<path d="M15 6l-6 6 6 6"/>,
 chev:<path d="M9 6l6 6-6 6"/>,
 arrow:<path d="M5 12h14M13 6l6 6-6 6"/>,
 search:<><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></>,
 download:<><path d="M12 4v11"/><path d="M7.5 11l4.5 4.5 4.5-4.5"/><path d="M5 20h14"/></>,
 menu:<path d="M4 7h16M4 12h16M4 17h16"/>,
 logout:<><path d="M9 4H5v16h4"/><path d="M16 8l4 4-4 4M20 12H9"/></>,
 alert:<><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/></>,
 check:<><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.6 2.6L16 9.5"/></>,
 inbox:<><path d="M4 13l2-8h12l2 8v6H4z"/><path d="M4 13h5l1 2h4l1-2h5"/></>,
 chat:<path d="M4 5h16v11H9.5L5 20v-4H4z"/>,
 edit:<><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></>,
 contact:<><circle cx="10" cy="9" r="3"/><path d="M4 19c0-3 2.7-5 6-5s6 2 6 5"/><path d="M18 8v6M15 11h6"/></>,
 x:<path d="M6 6l12 12M18 6L6 18"/>,
 trash:<><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/></>
}
export const Icon=({n,s=18})=><svg className="ic" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{P[n]}</svg>

export const Call=({n,t='Call'})=>n?<a className="btn o s" href={'tel:'+n.replace(/[^\d+]/g,'')}><Icon n="phone"/>{t}</a>:null
const TONE={Paid:'ok',Delivered:'ok',Unpaid:'bad',Cancelled:'bad',Booked:'warn','Partially Paid':'warn',Dispatched:'info','In Transit':'info'}
export const Pill=({v})=><span className={'pill '+(TONE[v]||'mute')}>{v}</span>
export const Stat=({t,v,s,tone=''})=><div className={'card stat '+tone}><div className="sm">{t}</div><div className="big">{v}</div>{s&&<div className="sub">{s}</div>}</div>
export const Empty=({children})=><div className="empty"><Icon n="inbox" s={24}/><b>No Records Yet</b>{children&&<span>{children}</span>}</div>
export const Alert=({k='bad',children})=><div className={'alert '+k} role={k==='bad'?'alert':'status'}><Icon n={k==='good'?'check':'alert'}/><div className="alert-b">{children}</div></div>
export const Search=({value,onChange,placeholder,label})=><div className="search"><Icon n="search" s={17}/><input className="in" type="text" inputMode="search" aria-label={label||placeholder} placeholder={placeholder} value={value} onChange={onChange}/></div>
export const Route=({a,b})=><span className="rt-route"><span>{a}</span><Icon n="arrow" s={14}/><span>{b}</span></span>
export const Back=({go,to,t})=><button className="btn o s back" onClick={()=>go(to)}><Icon n="back"/>{t}</button>

// One shipment table for every screen. On phones each row becomes a compact card.
export const ShipList=({rows,go})=><div className="card flush"><div className="tw"><table className="rt"><thead><tr><th>Shipment</th><th>Truck and driver</th><th>Company</th><th>Route</th><th>Status</th><th className="r">To receive</th><th className="r">To pay</th></tr></thead>
 <tbody>{rows.map(s=><tr key={s.id} className={'click'+(s.status==='Cancelled'?' cx':'')} onClick={()=>go('ship',s.id)}>
  <td className="m1"><button className="lnk">{s.code}</button><span className="sm">{s.dispatch_date}</span></td>
  <td className="m5 f">{s.truck_no}<span className="sm">{s.dr?.name||'—'}</span></td>
  <td className="m3 f"><b>{s.co?.name||'—'}</b></td>
  <td className="m4 f"><Route a={s.origin} b={s.destination}/></td>
  <td className="m2 mr"><Pill v={s.status}/></td>
  <td className="r m6 lb" data-label="To receive">{inr(s.recBal)}</td>
  <td className="r m7 lb" data-label="To pay">{inr(s.payBal)}</td></tr>)}</tbody></table></div></div>
export {st}

// Deletes a shipment ONLY when it has no payment records at all (not even cancelled ones).
// The database enforces the same rule, so payments can never be lost.
export async function removeShipment(c,s){
 const{count,error:e1}=await c.from('payments').select('id',{count:'exact',head:true}).eq('shipment_id',s.id)
 if(e1)return{error:e1.message||'Something Went Wrong'}
 if(count>0)return{blocked:true}
 const{data,error}=await c.from('shipments').delete().eq('id',s.id).eq('updated_at',s.updated_at).select().maybeSingle()
 return error?{error:error.message||'Something Went Wrong'}:data?{ok:true}:{stale:true}}