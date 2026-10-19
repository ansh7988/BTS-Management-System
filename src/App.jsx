import {useEffect,useState,useCallback,useRef} from 'react'
import {sb,ok,snapshot,inr,st,enrich,ist,todayIST,r2} from './db.js'
import {Pill,Stat,ShipList,Route,Call,Back,Icon,Alert,Empty,Search,removeShipment,wa} from './common.jsx'
import IntroScreen,{introSeen} from './intro/IntroScreen.jsx'
import Ledger from './Ledger.jsx'
import ShipForm from './ShipForm.jsx'
import {Cos,Drs,CoDetail,DrDetail,Hist,Rep,Set} from './Pages.jsx'

export function Login(){const[e,setE]=useState(''),[p,setP]=useState(''),[m,setM]=useState(''),[b,setB]=useState(false)
 const go=async ev=>{ev.preventDefault();setB(true);setM('');const{error}=await sb.auth.signInWithPassword({email:e.trim(),password:p});setB(false);if(error)setM(error.status===400?'Wrong email or password.':'Could not sign in. Please check your internet and try again.')}
  return<div className="center"><div className="auth"><div className="auth-brand"><div className="mono">BTS</div><div className="auth-name">BATRA TRANSPORT SERVICES</div><div className="auth-sub">Transport Desk · Ludhiana</div></div>
  <div className="auth-card"><h1>Sign In</h1><p className="sm">Use the email and password given to you by the owner.</p>
  {!ok?<Alert>Setup needed: add the Supabase address and key to the .env file, then restart the app.</Alert>:
  <form onSubmit={go}><div className="fld"><label htmlFor="li-email">Email</label><input id="li-email" className="in" type="email" value={e} onChange={x=>setE(x.target.value)} required autoComplete="username"/></div><div className="fld"><label htmlFor="li-pass">Password</label><input id="li-pass" className="in" type="password" value={p} onChange={x=>setP(x.target.value)} required autoComplete="current-password"/></div>{m&&<Alert>{m}</Alert>}<button className="btn g w" disabled={b}>{b?'Please wait…':'Sign In'}</button></form>}</div></div></div>}

export default function App(){const[intro,setIntro]=useState(!introSeen()),[user,setUser]=useState(null),[chk,setChk]=useState(ok)
 useEffect(()=>{if(!ok)return;sb.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setChk(false)});const{data}=sb.auth.onAuthStateChange((_,s)=>setUser(s?.user||null));return()=>data.subscription.unsubscribe()},[])
 if(intro)return<IntroScreen done={()=>setIntro(false)}/>
if(chk)return<div className="center"><div className="state"><span className="spin"/>Loading…</div></div>
 return user?<Shell user={user}/>:<Login/>}

export const NAV=[['dash','Dashboard','dash'],['ships','All Shipments','truck'],['add','Add New Truck','plus'],['cos','Companies','building'],['drs','Drivers','user'],['recv','Money to Receive','recv'],['pay','Money to Pay','pay'],['hist','Payment History','receipt'],['com','Commission','percent'],['rep','Reports and Excel','chart'],['set','Settings and Backup','sliders']]
const GROUPS=[['Operations',['dash','ships','add']],['Directory',['cos','drs']],['Accounts',['recv','pay','hist','com']],['Insights',['rep','set']]]
const TITLES={dash:'Dashboard',ships:'All Shipments',add:'Add New Truck',cos:'Companies',drs:'Drivers',recv:'Money to Receive',pay:'Money to Pay',hist:'Payment History',com:'Commission Ledger',rep:'Reports and Excel',set:'Settings and Backup',ship:'Shipment Details',co:'Company Details',dr:'Driver Details',more:'More'}
const PARENT={ship:'ships',co:'cos',dr:'drs'}
const SECT={ship:'Operations',co:'Directory',dr:'Directory',more:'Menu'}
function More({go}){return<div className="card flush">{NAV.slice(4).map(n=><button key={n[0]} className="mrow" onClick={()=>go(n[0])}><Icon n={n[2]} s={20}/><span>{n[1]}</span><Icon n="chev" s={16}/></button>)}</div>}
export function Pages({r,P,go}){
 const m={dash:<Dash {...P}/>,ships:<Ships key={P.sel} {...P}/>,add:<ShipForm key={P.sel||'new'} {...P}/>,ship:<Detail key={P.sel} {...P}/>,cos:<Cos {...P}/>,co:<CoDetail key={P.sel} {...P}/>,drs:<Drs {...P}/>,dr:<DrDetail key={P.sel} {...P}/>,recv:<Money {...P} k="recv"/>,pay:<Money {...P} k="pay"/>,hist:<Hist {...P}/>,com:<Com {...P}/>,rep:<Rep {...P}/>,set:<Set {...P}/>,
  more:<More go={go}/>}
 return m[r]||m.dash}

function Shell({user}){const[d,setD]=useState(null),[err,setErr]=useState(''),[denied,setDenied]=useState(false),[r,setR]=useState('dash'),[sel,setSel]=useState(null),[off,setOff]=useState(!navigator.onLine),last=useRef(0)
 const load=useCallback(async()=>{try{const{data:staff,error}=await sb.rpc('is_staff');if(error)throw new Error(error.message+' (Has the database setup been run?)');if(!staff){setDenied(true);return}setDenied(false);setD(await snapshot(sb));setErr('');last.current=Date.now()}catch(e){setErr(e.message||'Something Went Wrong')}},[])
 useEffect(()=>{load();const vis=()=>{if(document.visibilityState==='visible'&&Date.now()-last.current>30000)load()},on=()=>{setOff(false);load()},offl=()=>setOff(true)
  addEventListener('online',on);addEventListener('offline',offl);document.addEventListener('visibilitychange',vis);return()=>{removeEventListener('online',on);removeEventListener('offline',offl);document.removeEventListener('visibilitychange',vis)}},[load])
 useEffect(()=>{history.replaceState({r:'dash',id:null},'');const pop=e=>{const s=e.state||{r:'dash',id:null};setR(s.r);setSel(s.id)};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[])
 const go=(x,id=null)=>{setR(x);setSel(id);scrollTo(0,0);history.pushState({r:x,id},'')}      // phone Back button works
 const S=d?enrich(d):[];const P={d,S,go,load,sel,user}
  const page=denied?<Alert>Your account is not approved yet. Please ask the owner to approve it.<div className="acts"><button className="btn" onClick={()=>sb.auth.signOut()}>Sign Out</button></div></Alert>
  :err?<Alert>Something Went Wrong: {err}<div className="acts"><button className="btn" onClick={load}>Try Again</button><button className="btn o" onClick={()=>sb.auth.signOut()}>Sign Out</button></div></Alert>:!d?<div className="state"><span className="spin"/>Loading…</div>:<Pages r={r} P={P} go={go}/>
  const cur=PARENT[r]||r,title=r==='add'&&sel?'Edit Shipment':TITLES[r]||'Dashboard',sect=SECT[r]||(GROUPS.find(g=>g[1].includes(r))||['Operations'])[0],lab=Object.fromEntries(NAV.map(n=>[n[0],n])),dateStr=new Date().toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',weekday:'long',day:'numeric',month:'long',year:'numeric'})
  return<div className="app"><a className="skip" href="#main">Skip to content</a>
  <aside className="side"><div className="brand"><div className="mono">BTS</div><div><div className="brand-n">BATRA TRANSPORT</div><div className="brand-s">Transport Desk</div></div></div>
   <nav aria-label="Main">{GROUPS.map(([g,ks])=><div key={g} className="ngrp"><div className="ngl">{g}</div>{ks.map(k=>{const n=lab[k];return<button key={k} className={'ni'+(cur===k?' on':'')} aria-current={cur===k?'page':undefined} onClick={()=>go(k)}><Icon n={n[2]}/><span>{n[1]}</span></button>})}</div>)}</nav>
   <div className="side-f"><div className="sm">Signed in as</div><div className="em">{user.email}</div><button className="ni" onClick={()=>confirm('Sign out now?')&&sb.auth.signOut()}><Icon n="logout"/><span>Sign Out</span></button></div></aside>
  <div className="col"><header className="top"><div className="mono s">BTS</div><div className="tt"><div className="eyebrow">{sect}</div><h1>{title}</h1></div><div className="top-r"><span className="date">{dateStr}</span>{r!=='add'&&r!=='dash'&&<button className="btn g s" onClick={()=>go('add')}><Icon n="plus"/>Add New Truck</button>}</div></header>
  <main className="main" id="main">{off&&<Alert k="warn">You are offline. Saved records may be out of date. Changes cannot be saved until you are back online.</Alert>}{page}</main></div>
  <nav className="nav" aria-label="Quick navigation">{[['dash','dash','Home'],['ships','truck','Shipments'],['add','plus','Add Truck'],['cos','building','Companies'],['more','menu','More']].map(([k,ic,t])=>{const on=k==='more'?!['dash','ships','add','cos'].includes(cur):cur===k;return<button key={k} className={'nv'+(on?' on':'')+(k==='add'?' add':'')} aria-current={on?'page':undefined} onClick={()=>go(k)}>{k==='add'?<span className="ic-b"><Icon n={ic} s={20}/></span>:<Icon n={ic}/>}<span>{t}</span></button>})}</nav></div>}

const sumP=(d,k,f)=>d.payments.filter(p=>p.kind===k&&!p.voided&&f(ist(p.paid_at))).reduce((a,p)=>a+ +p.amount,0)
// Commission actually received between two India dates (by PAYMENT date). Cancelled shipments are included because the money really was received.
// Used by BOTH the Dashboard and the Commission Ledger so the two can never disagree. Cancelled-shipment money is reported separately so it can be told apart.
export function commissionIn(d,S,from,to){
 const by=Object.fromEntries(S.map(s=>[s.id,s]));let all=0,cancelled=0;const rows=[]
 for(const p of d.payments){if(p.kind!=='commission'||p.voided)continue;const day=ist(p.paid_at);if((from&&day<from)||(to&&day>to))continue
  const s=by[p.shipment_id],c=s?.status==='Cancelled';all+=+p.amount;if(c)cancelled+=+p.amount;rows.push({p,s,c})}
 return{all:r2(all),cancelled:r2(cancelled),rows}}
export function Dash({d,S,go}){const t=todayIST(),m=t.slice(0,7),L=S.filter(s=>s.status!=='Cancelled'),sum=(a,f)=>a.reduce((x,s)=>x+f(s),0),cm=commissionIn(d,S,m+'-01',endOfCurrentMonth()),[q,setQ]=useState('')
  const pend=L.filter(s=>s.recBal>0.004).slice(0,5)
  return<>
  <div className="qa"><button className="btn g" onClick={()=>go('add')}><Icon n="plus"/>Add New Truck</button><button className="btn" onClick={()=>go('recv')}><Icon n="recv"/>Add Payment</button><button className="btn" onClick={()=>go('pay')}><Icon n="pay"/>Record Driver Payment</button><button className="btn o" onClick={()=>go('rep')}><Icon n="download"/>Download Excel</button></div>
  <form onSubmit={e=>{e.preventDefault();go('ships',q.trim())}} style={{marginBottom:18}}><Search label="Search shipments" placeholder="Search shipment, truck, driver, company or place" value={q} onChange={e=>setQ(e.target.value)}/></form>
  <div className="dgrid">
   <section className="g-ops" aria-label="Operations"><div className="gl">Operations</div><div className="kpis"><Stat t="Today's Shipments" v={L.filter(s=>s.dispatch_date===t).length}/><Stat t="In Transit" v={S.filter(s=>s.status==='In Transit').length}/></div></section>
   <section className="g-mon" aria-label="Receivables and payables"><div className="gl">Receivables and payables</div><div className="kpis"><Stat tone="rec" t="Money to Receive" v={inr(sum(L,s=>s.recBal))}/><Stat tone="pay" t="Money to Pay" v={inr(sum(L,s=>s.payBal))}/><Stat tone="rec" t="Received Today" v={inr(sumP(d,'receipt',x=>x===t))}/><Stat tone="pay" t="Paid Today" v={inr(sumP(d,'driver',x=>x===t))}/></div></section>
   <section className="g-com" aria-label="Commission"><div className="gl">Commission</div><div className="kpis"><Stat tone="com" t="Commission Earned (This Month)" v={inr(sum(L.filter(s=>s.dispatch_date.startsWith(m)),s=>+s.commission))}/><Stat tone="com" t="Commission Received (This Month)" v={inr(cm.all)} s={cm.cancelled>0?'Includes '+inr(cm.cancelled)+' on cancelled shipments':''}/></div></section>
  </div>
  <div className="sec"><h2>Recent Shipments</h2><button className="lnk" onClick={()=>go('ships')}>View all</button></div>
  {S.length?<ShipList rows={[...S].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,5)} go={go}/>:<div className="card"><Empty>Shipments you add will appear here.</Empty></div>}
  <div className="sec"><h2>Pending Payments</h2><button className="lnk" onClick={()=>go('recv')}>View all</button></div>
  {pend.length?<div className="card flush"><div className="tw"><table className="rt"><thead><tr><th>Company</th><th>Shipment</th><th className="r">Balance to receive</th></tr></thead><tbody>{pend.map(s=><tr key={s.id} className="click" onClick={()=>go('ship',s.id)}><td className="m1"><b>{s.co?.name}</b></td><td className="m3 f"><button className="lnk">{s.code}</button></td><td className="r m2 mr"><b>{inr(s.recBal)}</b></td></tr>)}</tbody></table></div></div>:<div className="card"><Empty>Shipments with a balance left to receive will appear here.</Empty></div>}</>}

export function Ships({S,go,sel}){const[q,setQ]=useState(sel||''),[f,setF]=useState(''),[t,setT]=useState(''),[a,setA]=useState(''),[b,setB]=useState('')
 const L=S.filter(s=>(!f||s.status===f)&&(!t||s.service===t)&&(!a||s.dispatch_date>=a)&&(!b||s.dispatch_date<=b)&&[s.code,s.truck_no,s.dr?.name,s.co?.name,s.origin,s.destination,s.dispatch_date].join(' ').toLowerCase().includes(q.toLowerCase()))
  const opt=(v,all,list)=><select className="in" value={v[0]} onChange={e=>v[1](e.target.value)}><option value="">{all}</option>{list.map(x=><option key={x}>{x}</option>)}</select>
  return<>
  <div className="bar"><p className="sub-t">{L.length+' of '+S.length+' shipments'}</p><button className="btn g" onClick={()=>go('add')}><Icon n="plus"/>New Shipment</button></div>
  <div className="card"><div className="filters"><Search label="Search shipments" placeholder="Search truck, driver, company, place or date" value={q} onChange={e=>setQ(e.target.value)}/>
   <label className="fld"><span className="lbl">Status</span>{opt([f,setF],'All Status',['Booked','Dispatched','In Transit','Delivered','Cancelled'])}</label>
   <label className="fld"><span className="lbl">Type</span>{opt([t,setT],'All Types',['FTL','PTL','Industrial Goods Transport'])}</label>
   <label className="fld"><span className="lbl">Dispatched from</span><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/></label>
   <label className="fld"><span className="lbl">Dispatched to</span><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></label></div></div>
  {L.length?<ShipList rows={[...L].sort((x,y)=>y.dispatch_date.localeCompare(x.dispatch_date))} go={go}/>:<div className="card"><Empty>No shipment matches these filters.</Empty></div>}</>}

// Saves a status change only if nobody else changed the shipment first. Success is reported only when a row was really updated.
export async function changeStatus(c,s,v){
 const{data,error}=await c.from('shipments').update({status:v}).eq('id',s.id).eq('updated_at',s.updated_at).select().maybeSingle()
 return error?{error:error.message||'Something Went Wrong'}:data?{ok:true}:{stale:true}}

export function Detail({S,d,go,load,sel}){const s=S.find(x=>x.id===sel);if(!s)return<><Back go={go} to="ships" t="All Shipments"/><div className="card" style={{marginTop:14}}><Empty/></div></>
 const info='Shipment '+s.code+'\nTruck: '+s.truck_no+'\nFrom '+s.origin+' to '+s.destination+'\nStatus: '+s.status
 const rem='Hello, this is a reminder from Batra Transport Services. A balance of '+inr(s.recBal)+' is pending for shipment '+s.code+' ('+s.origin+' to '+s.destination+'). Thank you.'
 const setStatus=async v=>{if(v==='Cancelled'&&(s.rec>0||s.paid>0)&&!confirm('This shipment has saved payments. Cancel it anyway?'))return;const r=await changeStatus(sb,s,v);if(r.error)return alert('Something Went Wrong: '+r.error.replace(/^BTS: /,''));if(r.stale)alert('This shipment was changed by someone else. The latest version is now loaded. Please try again.');load()}
  const hasPay=d.payments.some(p=>p.shipment_id===s.id)
  const del=async()=>{if(!confirm('Delete shipment '+s.code+' permanently? This cannot be undone.'))return;const r=await removeShipment(sb,s);if(r.error)return alert('Something Went Wrong: '+r.error.replace(/^BTS: /,''));if(r.blocked){alert('This shipment has payment records, so it cannot be deleted. Set the status to Cancelled instead.');return load()}if(r.stale){alert('This shipment was changed by someone else. The latest version is now loaded. Please try again.');return load()}await load();go('ships')}
  const cx=s.status==='Cancelled'
  return<>
  <div className="bar"><Back go={go} to="ships" t="All Shipments"/></div>
  <div className={'card detail'+(cx?' cx':'')}>
   <div className="dh"><div><div className="eyebrow">Shipment</div><h2>{s.code}</h2></div><Pill v={s.status}/></div>
   <div className="routeline"><span>{s.origin}</span><Icon n="arrow"/><span>{s.destination}</span></div>
   <dl className="facts">
    <div><dt>Truck</dt><dd>{s.truck_no}{s.truck_type&&' · '+s.truck_type}</dd></div>
    <div><dt>Service</dt><dd>{s.service}</dd></div>
    <div><dt>Dispatch date</dt><dd>{s.dispatch_date}</dd></div>
    <div><dt>Expected delivery</dt><dd>{s.expected_date||'—'}</dd></div>
    <div><dt>Goods</dt><dd>{[s.goods,s.weight&&s.weight+' '+(s.unit||'')].filter(Boolean).join(' · ')||'—'}</dd></div>
    <div><dt>Company</dt><dd><button className="lnk" onClick={()=>s.co&&go('co',s.co.id)}>{s.co?.name||'—'}</button>{s.contact_name&&<div className="sm">{s.contact_name}</div>}</dd></div>
    <div><dt>Driver</dt><dd><button className="lnk" onClick={()=>s.dr&&go('dr',s.dr.id)}>{s.dr?.name||'—'}</button>{s.dr?.phone&&<div className="sm">{s.dr.phone}</div>}</dd></div>
   </dl>
   <div className="money"><div><span>Company freight</span><b>{inr(s.customer_freight)}</b></div>{+s.extra_charges>0&&<div><span>Extra charges</span><b>{'+ '+inr(s.extra_charges)}</b></div>}{+s.deductions>0&&<div><span>Deductions</span><b>{'− '+inr(s.deductions)}</b></div>}<div><span>Amount due from company</span><b>{inr(s.due)}</b></div></div>
   {s.notes&&<p className="note">{s.notes}</p>}
   <div className="fld" style={{marginTop:14,maxWidth:320}}><label htmlFor="st-sel">Change Status</label><select id="st-sel" className="in" value={s.status} onChange={e=>setStatus(e.target.value)}>{['Booked','Dispatched','In Transit','Delivered','Cancelled'].map(x=><option key={x}>{x}</option>)}</select></div>
   <div className="acts"><button className="btn s" onClick={()=>go('add',s.id)}><Icon n="edit"/>Edit</button><Call n={s.dr?.phone} t="Call Driver"/><Call n={s.contact_phone} t="Call Company"/><a className="btn o s" target="_blank" rel="noreferrer" href={wa(info)}><Icon n="chat"/>WhatsApp</a>{s.recBal>0.004&&<a className="btn o s" target="_blank" rel="noreferrer" href={wa(rem)}><Icon n="chat"/>Payment Reminder</a>}</div></div>
  {s.status==='Cancelled'&&(s.rec>0||s.paid>0||s.cr>0)&&<Alert><b>Cancelled shipment with saved payments.</b> Received from company {inr(s.rec)} · Paid to driver {inr(s.paid)}{s.cr>0&&' · Commission received '+inr(s.cr)}. These payments are kept in the records and may need review. Nothing has been changed automatically.</Alert>}
  <Ledger s={s} d={d} kind="receipt" title="Money to Receive (Company)" agreed={s.due} paid={s.rec} load={load}/><Ledger s={s} d={d} kind="driver" title="Money to Pay (Driver)" agreed={+s.driver_freight} paid={s.paid} load={load}/><Ledger s={s} d={d} kind="commission" title="BTS Commission" agreed={+s.commission} paid={s.cr} load={load}/>
  <div className="card danger"><div className="card-h"><h2>Delete Shipment</h2></div>{hasPay?<p className="sm" style={{margin:0}}>This shipment has payment records, so it cannot be deleted. Payments are never removed from the records. To stop using it, set the status to Cancelled.</p>:<><p className="sm">Remove this shipment from the records permanently. This cannot be undone.</p><button className="btn danger s" onClick={del}><Icon n="trash"/>Delete Shipment</button></>}</div></>}

export function Money({S,go,k}){const r=k==='recv',[q,setQ]=useState(''),L=S.filter(s=>s.status!=='Cancelled'&&(r?s.recBal:s.payBal)>0.004&&[s.code,s.truck_no,r?s.co?.name:s.dr?.name].join(' ').toLowerCase().includes(q.toLowerCase()))
  const tot=L.reduce((a,s)=>a+(r?s.recBal:s.payBal),0)
  return<>
  <Stat tone={r?'rec':'pay'} t="Total Balance Left" v={inr(tot)}/>
  <div style={{margin:'14px 0'}}><Search label="Search" placeholder={r?'Search company, shipment or truck':'Search driver, shipment or truck'} value={q} onChange={e=>setQ(e.target.value)}/></div>
  {L.length?<div className="card flush"><div className="tw"><table className="rt"><thead><tr><th>{r?'Company':'Driver'}</th><th>Shipment</th><th>Route</th><th>Status</th><th className="r">Balance left</th></tr></thead><tbody>{L.map(s=><tr key={s.id} className="click" onClick={()=>go('ship',s.id)}><td className="m1"><b>{r?s.co?.name:s.dr?.name}</b></td><td className="m3 f"><button className="lnk">{s.code}</button><span className="sm">{s.truck_no}</span></td><td className="m4 f"><Route a={s.origin} b={s.destination}/></td><td className="m5 f"><Pill v={st(r?s.rec:s.paid,r?s.due:+s.driver_freight)}/></td><td className="r m2 mr"><b>{inr(r?s.recBal:s.payBal)}</b></td></tr>)}</tbody></table></div></div>:<div className="card"><Empty/></div>}
  {L.length>0&&<p className="note">Open a shipment to add a payment.</p>}</>}

const endOfCurrentMonth = () => {
 const now=todayIST();
 const [y,m]=now.slice(0,7).split('-').map(Number);
 const lastDay=new Date(Date.UTC(y,m,0)).getUTCDate();
 return `${now.slice(0,7)}-${String(lastDay).padStart(2,'0')}`;
};

export function Com({S,d}){const[a,setA]=useState(todayIST().slice(0,8)+'01'),[b,setB]=useState(endOfCurrentMonth()),L=S.filter(s=>s.status!=='Cancelled'&&s.dispatch_date>=a&&s.dispatch_date<=b),x=f=>L.reduce((t,s)=>t+f(s),0),rc=commissionIn(d,S,a,b)
 const days=Object.entries(L.reduce((o,s)=>(o[s.dispatch_date]=(o[s.dispatch_date]||0)+ +s.commission,o),{})).sort().reverse()
  return<>
  <div className="card"><div className="fgrid k2"><label className="fld"><span className="lbl">From</span><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/></label><label className="fld"><span className="lbl">To</span><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></label></div></div>
  <div className="kpis k3" style={{marginBottom:14}}><Stat tone="com" t="Earned (dispatch date)" v={inr(x(s=>+s.commission))}/><Stat tone="com" t="Received (payment date)" v={inr(rc.all)} s={rc.cancelled>0?'Includes '+inr(rc.cancelled)+' on cancelled shipments':''}/><Stat tone="pay" t="Still Due" v={inr(x(s=>s.comBal))}/></div>
  {days.length>0&&<div className="card flush"><div className="card-h"><h2>Earned Each Day</h2></div><div className="tw"><table className="rt"><thead><tr><th>Dispatch date</th><th className="r">Commission earned</th></tr></thead><tbody>{days.map(([k,v])=><tr key={k}><td className="m1">{k}</td><td className="r m2 mr">{inr(v)}</td></tr>)}</tbody></table></div></div>}
  {rc.rows.length>0&&<div className="card flush"><div className="card-h"><h2>Received in this period</h2></div><div className="tw"><table className="rt"><thead><tr><th>Payment date</th><th>Shipment</th><th>Reference</th><th className="r">Amount</th></tr></thead><tbody>{[...rc.rows].sort((x,y)=>y.p.paid_at.localeCompare(x.p.paid_at)).map(({p,s,c})=><tr key={p.id}><td className="m1">{ist(p.paid_at)}</td><td className="m3 f"><b>{s?s.code:'Unknown shipment'}</b>{c&&<span className="tag">Cancelled shipment</span>}</td><td className="m4 f">{p.reference}</td><td className="r m2 mr"><b>{inr(p.amount)}</b></td></tr>)}</tbody></table></div></div>}
  <div className="sec"><h2>Shipments in this period</h2></div>
  {L.length?<div className="card flush"><div className="tw"><table className="rt"><thead><tr><th>Shipment</th><th>Company</th><th className="r">Earned</th><th className="r">Received</th><th className="r">Due</th></tr></thead><tbody>{L.map(s=>{const rp=d.payments.filter(p=>p.shipment_id===s.id&&p.kind==='commission'&&!p.voided);return<tr key={s.id} className="c3"><td className="m1 f"><b>{s.code} · {s.truck_no}</b><span className="sm">{s.dispatch_date}</span>{rp.map(p=><span key={p.id} className="sm">Received {inr(p.amount)} on {ist(p.paid_at)}{p.reference&&' · '+p.reference}</span>)}</td><td className="m2 f">{s.co?.name}</td><td className="r m3 lb" data-label="Earned">{inr(s.commission)}</td><td className="r m4 lb" data-label="Received">{inr(s.cr)}</td><td className="r m5 lb" data-label="Due">{inr(s.comBal)}</td></tr>})}</tbody></table></div></div>:<div className="card"><Empty/></div>}</>}