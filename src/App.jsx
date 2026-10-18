import {useEffect,useState,useCallback,useRef} from 'react'
import {sb,ok,snapshot,inr,st,enrich,ist,todayIST,r2} from './db.js'
import {Pill,Stat,ShipCard,Call,Back,wa} from './common.jsx'
import IntroScreen,{introSeen} from './intro/IntroScreen.jsx'
import Ledger from './Ledger.jsx'
import ShipForm from './ShipForm.jsx'
import {Cos,Drs,CoDetail,DrDetail,Hist,Rep,Set} from './Pages.jsx'

export function Login(){const[e,setE]=useState(''),[p,setP]=useState(''),[m,setM]=useState(''),[b,setB]=useState(false)
 const go=async ev=>{ev.preventDefault();setB(true);setM('');const{error}=await sb.auth.signInWithPassword({email:e.trim(),password:p});setB(false);if(error)setM(error.status===400?'Wrong email or password.':'Could not sign in. Please check your internet and try again.')}
 return<div className="center"><div className="card" style={{color:'#1e1b15',textAlign:'left',width:'100%',maxWidth:380}}><div className="mono" style={{width:56,height:56,fontSize:18}}>BTS</div><h1>Sign In</h1>
 {!ok?<div className="err">Setup needed: add the Supabase address and key to the .env file, then restart the app.</div>:
 <form onSubmit={go}><label>Email</label><input className="in" type="email" value={e} onChange={x=>setE(x.target.value)} required autoComplete="username"/><label>Password</label><input className="in" type="password" value={p} onChange={x=>setP(x.target.value)} required autoComplete="current-password"/>{m&&<div className="err">{m}</div>}<br/><button className="btn w" disabled={b}>{b?'Please wait…':'Sign In'}</button></form>}</div></div>}

export default function App(){const[intro,setIntro]=useState(!introSeen()),[user,setUser]=useState(null),[chk,setChk]=useState(ok)
 useEffect(()=>{if(!ok)return;sb.auth.getSession().then(({data})=>{setUser(data.session?.user||null);setChk(false)});const{data}=sb.auth.onAuthStateChange((_,s)=>setUser(s?.user||null));return()=>data.subscription.unsubscribe()},[])
 if(intro)return<IntroScreen done={()=>setIntro(false)}/>
 if(chk)return<div className="center">Loading…</div>
 return user?<Shell user={user}/>:<Login/>}

export const NAV=[['dash','Dashboard','🏠'],['ships','All Shipments','🚚'],['add','Add New Truck','➕'],['cos','Companies','🏢'],['drs','Drivers','👤'],['recv','Money to Receive','💰'],['pay','Money to Pay','💸'],['hist','Payment History','🧾'],['com','Commission','📒'],['rep','Reports and Excel','📊'],['set','Settings and Backup','⚙️']]
export function Pages({r,P,go}){
 const m={dash:<Dash {...P}/>,ships:<Ships key={P.sel} {...P}/>,add:<ShipForm key={P.sel||'new'} {...P}/>,ship:<Detail key={P.sel} {...P}/>,cos:<Cos {...P}/>,co:<CoDetail key={P.sel} {...P}/>,drs:<Drs {...P}/>,dr:<DrDetail key={P.sel} {...P}/>,recv:<Money {...P} k="recv"/>,pay:<Money {...P} k="pay"/>,hist:<Hist {...P}/>,com:<Com {...P}/>,rep:<Rep {...P}/>,set:<Set {...P}/>,
 more:<div><h1>More</h1>{NAV.slice(4).map(n=><button key={n[0]} className="btn o w" style={{marginBottom:8}} onClick={()=>go(n[0])}>{n[2]} {n[1]}</button>)}</div>}
 return m[r]||m.dash}

function Shell({user}){const[d,setD]=useState(null),[err,setErr]=useState(''),[denied,setDenied]=useState(false),[r,setR]=useState('dash'),[sel,setSel]=useState(null),[off,setOff]=useState(!navigator.onLine),last=useRef(0)
 const load=useCallback(async()=>{try{const{data:staff,error}=await sb.rpc('is_staff');if(error)throw new Error(error.message+' (Has the database setup been run?)');if(!staff){setDenied(true);return}setDenied(false);setD(await snapshot(sb));setErr('');last.current=Date.now()}catch(e){setErr(e.message||'Something Went Wrong')}},[])
 useEffect(()=>{load();const vis=()=>{if(document.visibilityState==='visible'&&Date.now()-last.current>30000)load()},on=()=>{setOff(false);load()},offl=()=>setOff(true)
  addEventListener('online',on);addEventListener('offline',offl);document.addEventListener('visibilitychange',vis);return()=>{removeEventListener('online',on);removeEventListener('offline',offl);document.removeEventListener('visibilitychange',vis)}},[load])
 useEffect(()=>{history.replaceState({r:'dash',id:null},'');const pop=e=>{const s=e.state||{r:'dash',id:null};setR(s.r);setSel(s.id)};addEventListener('popstate',pop);return()=>removeEventListener('popstate',pop)},[])
 const go=(x,id=null)=>{setR(x);setSel(id);scrollTo(0,0);history.pushState({r:x,id},'')}      // phone Back button works
 const S=d?enrich(d):[];const P={d,S,go,load,sel,user}
 const page=denied?<div className="err">Your account is not approved yet. Please ask the owner to approve it.<div className="acts"><button className="btn" onClick={()=>sb.auth.signOut()}>Sign Out</button></div></div>
 :err?<div className="err">Something Went Wrong: {err}<div className="acts"><button className="btn" onClick={load}>Try Again</button><button className="btn o" onClick={()=>sb.auth.signOut()}>Sign Out</button></div></div>:!d?<p>Loading…</p>:<Pages r={r} P={P} go={go}/>
 return<div className="app"><div className="side"><div className="mono" style={{width:56,height:56,fontSize:18}}>BTS</div>{NAV.map(n=><button key={n[0]} className={r===n[0]?'on':''} onClick={()=>go(n[0])}>{n[2]} {n[1]}</button>)}</div>
 <div className="main">{off&&<div className="err">You are offline. Saved records may be out of date. Changes cannot be saved until you are back online.</div>}{page}</div>
 <div className="nav">{[['dash','🏠','Home'],['ships','🚚','Shipments'],['add','➕','Add Truck'],['cos','🏢','Companies'],['more','☰','More']].map(n=><button key={n[0]} className={r===n[0]?'on':''} onClick={()=>go(n[0])}>{n[1]}<br/>{n[2]}</button>)}</div></div>}

const sumP=(d,k,f)=>d.payments.filter(p=>p.kind===k&&!p.voided&&f(ist(p.paid_at))).reduce((a,p)=>a+ +p.amount,0)
// Commission actually received between two India dates (by PAYMENT date). Cancelled shipments are included because the money really was received.
// Used by BOTH the Dashboard and the Commission Ledger so the two can never disagree. Cancelled-shipment money is reported separately so it can be told apart.
export function commissionIn(d,S,from,to){
 const by=Object.fromEntries(S.map(s=>[s.id,s]));let all=0,cancelled=0;const rows=[]
 for(const p of d.payments){if(p.kind!=='commission'||p.voided)continue;const day=ist(p.paid_at);if((from&&day<from)||(to&&day>to))continue
  const s=by[p.shipment_id],c=s?.status==='Cancelled';all+=+p.amount;if(c)cancelled+=+p.amount;rows.push({p,s,c})}
 return{all:r2(all),cancelled:r2(cancelled),rows}}
export function Dash({d,S,go}){const t=todayIST(),m=t.slice(0,7),L=S.filter(s=>s.status!=='Cancelled'),sum=(a,f)=>a.reduce((x,s)=>x+f(s),0),cm=commissionIn(d,S,m+'-01',endOfCurrentMonth()),[q,setQ]=useState('')
 return<><h1>Dashboard</h1><form onSubmit={e=>{e.preventDefault();go('ships',q.trim())}}><input className="in" placeholder="Search shipment, truck, driver, company or place" value={q} onChange={e=>setQ(e.target.value)}/></form>
 <div className="acts"><button className="btn g" onClick={()=>go('add')}>➕ Add New Truck</button><button className="btn" onClick={()=>go('recv')}>Add Payment</button><button className="btn" onClick={()=>go('pay')}>Record Driver Payment</button><button className="btn o" onClick={()=>go('rep')}>Download Excel</button></div>
 <div className="grid"><Stat t="Today's Shipments" v={L.filter(s=>s.dispatch_date===t).length}/><Stat t="In Transit" v={S.filter(s=>s.status==='In Transit').length}/><Stat t="Money to Receive" v={inr(sum(L,s=>s.recBal))}/><Stat t="Money to Pay" v={inr(sum(L,s=>s.payBal))}/>
 <Stat t="Received Today" v={inr(sumP(d,'receipt',x=>x===t))}/><Stat t="Paid Today" v={inr(sumP(d,'driver',x=>x===t))}/><Stat t="Commission Earned (This Month)" v={inr(sum(L.filter(s=>s.dispatch_date.startsWith(m)),s=>+s.commission))}/><Stat t="Commission Received (This Month)" v={inr(cm.all)} s={cm.cancelled>0?'Includes '+inr(cm.cancelled)+' on cancelled shipments':''}/></div>
 <h2>Recent Shipments</h2>{S.length?[...S].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,5).map(s=><ShipCard key={s.id} s={s} go={go}/>):<div className="card">No Records Yet</div>}
 <h2>Pending Payments</h2>{L.filter(s=>s.recBal>0.004).slice(0,5).map(s=><div key={s.id} className="card tap row" onClick={()=>go('ship',s.id)}><span>{s.co?.name} · {s.code}</span><b>{inr(s.recBal)}</b></div>)}{!L.some(s=>s.recBal>0.004)&&<div className="card">No Records Yet</div>}</>}

export function Ships({S,go,sel}){const[q,setQ]=useState(sel||''),[f,setF]=useState(''),[t,setT]=useState(''),[a,setA]=useState(''),[b,setB]=useState('')
 const L=S.filter(s=>(!f||s.status===f)&&(!t||s.service===t)&&(!a||s.dispatch_date>=a)&&(!b||s.dispatch_date<=b)&&[s.code,s.truck_no,s.dr?.name,s.co?.name,s.origin,s.destination,s.dispatch_date].join(' ').toLowerCase().includes(q.toLowerCase()))
 return<><div className="row"><h1>All Shipments</h1><button className="btn g" onClick={()=>go('add')}>➕ New Shipment</button></div><input className="in" placeholder="Search truck, driver, company, place or date" value={q} onChange={e=>setQ(e.target.value)}/>
 <div className="grid" style={{marginTop:8}}><select className="in" value={f} onChange={e=>setF(e.target.value)}><option value="">All Status</option>{['Booked','Dispatched','In Transit','Delivered','Cancelled'].map(x=><option key={x}>{x}</option>)}</select><select className="in" value={t} onChange={e=>setT(e.target.value)}><option value="">All Types</option>{['FTL','PTL','Industrial Goods Transport'].map(x=><option key={x}>{x}</option>)}</select><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></div>
 {L.length?[...L].sort((x,y)=>y.dispatch_date.localeCompare(x.dispatch_date)).map(s=><ShipCard key={s.id} s={s} go={go}/>):<div className="card">No Records Yet</div>}</>}

// Saves a status change only if nobody else changed the shipment first. Success is reported only when a row was really updated.
export async function changeStatus(c,s,v){
 const{data,error}=await c.from('shipments').update({status:v}).eq('id',s.id).eq('updated_at',s.updated_at).select().maybeSingle()
 return error?{error:error.message||'Something Went Wrong'}:data?{ok:true}:{stale:true}}

export function Detail({S,d,go,load,sel}){const s=S.find(x=>x.id===sel);if(!s)return<><Back go={go} to="ships" t="All Shipments"/><div className="card">No Records Yet</div></>
 const info='Shipment '+s.code+'\nTruck: '+s.truck_no+'\nFrom '+s.origin+' to '+s.destination+'\nStatus: '+s.status
 const rem='Hello, this is a reminder from Batra Transport Services. A balance of '+inr(s.recBal)+' is pending for shipment '+s.code+' ('+s.origin+' to '+s.destination+'). Thank you.'
 const setStatus=async v=>{if(v==='Cancelled'&&(s.rec>0||s.paid>0)&&!confirm('This shipment has saved payments. Cancel it anyway?'))return;const r=await changeStatus(sb,s,v);if(r.error)return alert('Something Went Wrong: '+r.error.replace(/^BTS: /,''));if(r.stale)alert('This shipment was changed by someone else. The latest version is now loaded. Please try again.');load()}
 return<><Back go={go} to="ships" t="All Shipments"/><div className="card"><div className="row"><h1>{s.code}</h1><Pill v={s.status}/></div><div>{s.truck_no} {s.truck_type&&'· '+s.truck_type} · {s.service}</div><div>{s.origin} → {s.destination}</div><div className="sm">{s.goods} {s.weight&&s.weight+' '+(s.unit||'')} · Dispatch {s.dispatch_date}{s.expected_date&&' · Expected '+s.expected_date}</div>
 <div style={{marginTop:8}}>Company: <b className="tap" onClick={()=>s.co&&go('co',s.co.id)}>{s.co?.name}</b> {s.contact_name&&'· '+s.contact_name}</div><div>Driver: <b className="tap" onClick={()=>s.dr&&go('dr',s.dr.id)}>{s.dr?.name}</b> {s.dr?.phone}</div>
 <div className="sm">Company freight {inr(s.customer_freight)}{+s.extra_charges>0&&' + extra '+inr(s.extra_charges)}{+s.deductions>0&&' − deductions '+inr(s.deductions)} = {inr(s.due)}</div>{s.notes&&<div className="sm">{s.notes}</div>}
 <label>Change Status</label><select className="in" value={s.status} onChange={e=>setStatus(e.target.value)}>{['Booked','Dispatched','In Transit','Delivered','Cancelled'].map(x=><option key={x}>{x}</option>)}</select>
 <div className="acts"><button className="btn" onClick={()=>go('add',s.id)}>Edit</button><Call n={s.dr?.phone} t="Call Driver"/><Call n={s.contact_phone} t="Call Company"/><a className="btn o" target="_blank" rel="noreferrer" href={wa(info)}>WhatsApp</a>{s.recBal>0.004&&<a className="btn o" target="_blank" rel="noreferrer" href={wa(rem)}>Payment Reminder</a>}</div></div>
 {s.status==='Cancelled'&&(s.rec>0||s.paid>0||s.cr>0)&&<div className="err"><b>Cancelled shipment with saved payments.</b> Received from company {inr(s.rec)} · Paid to driver {inr(s.paid)}{s.cr>0&&' · Commission received '+inr(s.cr)}. These payments are kept in the records and may need review. Nothing has been changed automatically.</div>}
 <Ledger s={s} d={d} kind="receipt" title="Money to Receive (Company)" agreed={s.due} paid={s.rec} load={load}/><Ledger s={s} d={d} kind="driver" title="Money to Pay (Driver)" agreed={+s.driver_freight} paid={s.paid} load={load}/><Ledger s={s} d={d} kind="commission" title="BTS Commission" agreed={+s.commission} paid={s.cr} load={load}/></>}

export function Money({S,go,k}){const r=k==='recv',[q,setQ]=useState(''),L=S.filter(s=>s.status!=='Cancelled'&&(r?s.recBal:s.payBal)>0.004&&[s.code,s.truck_no,r?s.co?.name:s.dr?.name].join(' ').toLowerCase().includes(q.toLowerCase()))
 return<><h1>{r?'Money to Receive':'Money to Pay'}</h1><div className="card"><div className="sm">Total Balance Left</div><div className="big">{inr(L.reduce((a,s)=>a+(r?s.recBal:s.payBal),0))}</div></div><input className="in" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/>
 {L.map(s=><div key={s.id} className="card tap" onClick={()=>go('ship',s.id)}><div className="row"><b>{r?s.co?.name:s.dr?.name}</b><b>{inr(r?s.recBal:s.payBal)}</b></div><div className="sm">{s.code} · {s.truck_no} · {s.origin} → {s.destination}</div><Pill v={st(r?s.rec:s.paid,r?s.due:+s.driver_freight)}/> <span className="sm">Tap to add a payment</span></div>)}{!L.length&&<div className="card">No Records Yet</div>}</>}

const endOfCurrentMonth = () => {
 const now=todayIST();
 const [y,m]=now.slice(0,7).split('-').map(Number);
 const lastDay=new Date(Date.UTC(y,m,0)).getUTCDate();
 return `${now.slice(0,7)}-${String(lastDay).padStart(2,'0')}`;
};

export function Com({S,d}){const[a,setA]=useState(todayIST().slice(0,8)+'01'),[b,setB]=useState(endOfCurrentMonth()),L=S.filter(s=>s.status!=='Cancelled'&&s.dispatch_date>=a&&s.dispatch_date<=b),x=f=>L.reduce((t,s)=>t+f(s),0),rc=commissionIn(d,S,a,b)
 const days=Object.entries(L.reduce((o,s)=>(o[s.dispatch_date]=(o[s.dispatch_date]||0)+ +s.commission,o),{})).sort().reverse()
 return<><h1>Commission Ledger</h1><div className="grid"><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></div>
 <div className="grid"><Stat t="Earned (dispatch date)" v={inr(x(s=>+s.commission))}/><Stat t="Received (payment date)" v={inr(rc.all)} s={rc.cancelled>0?'Includes '+inr(rc.cancelled)+' on cancelled shipments':''}/></div><Stat t="Still Due" v={inr(x(s=>s.comBal))}/>
 {days.length>0&&<div className="card"><h3>Earned Each Day</h3>{days.map(([k,v])=><div key={k} className="row sm"><span>{k}</span><b>{inr(v)}</b></div>)}</div>}
 {rc.rows.length>0&&<div className="card"><h3>Received in this period</h3>{[...rc.rows].sort((x,y)=>y.p.paid_at.localeCompare(x.p.paid_at)).map(({p,s,c})=><div key={p.id} className="sm"><div className="row"><span>{ist(p.paid_at)} · {s?s.code:'Unknown shipment'}{p.reference&&' · '+p.reference}</span><b>{inr(p.amount)}</b></div>{c&&<div style={{color:'#B0231D'}}>Cancelled shipment</div>}</div>)}</div>}
 {L.map(s=>{const rp=d.payments.filter(p=>p.shipment_id===s.id&&p.kind==='commission'&&!p.voided);return<div key={s.id} className="card"><div className="row"><b>{s.code} · {s.truck_no}</b><span className="sm">{s.dispatch_date}</span></div><div className="sm">{s.co?.name}</div><div className="row sm"><span>Earned {inr(s.commission)}</span><span>Received {inr(s.cr)}</span><span>Due {inr(s.comBal)}</span></div>{rp.map(p=><div key={p.id} className="sm">Received {inr(p.amount)} on {ist(p.paid_at)}{p.reference&&' · '+p.reference}</div>)}</div>})}{!L.length&&<div className="card">No Records Yet</div>}</>}