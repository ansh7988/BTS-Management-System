import {useRef,useState} from 'react'
import {sb,inr,st,snapshot,ist,todayIST} from './db.js'
import {Call,Pill,Stat,ShipCard,Back,pick,wa,uid,phoneOk,cleanPhone} from './common.jsx'

const ROLES=['Owner','Accounts','Dispatch','Other']
async function persist(table,row,base,id){
 if(base){const r=await sb.from(table).update(row).eq('id',id).eq('updated_at',base).select().maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('Someone else changed this record. The latest version is now loaded. Please open Edit again.')}
 else{const r=await sb.from(table).insert({id,...row});if(r.error&&r.error.code!=='23505')throw r.error}}
const msg=x=>x.code==='23505'?'This name is already saved.':'Something Went Wrong: '+(x.message||'')

function CoForm({initial,load,close}){
 const base=useRef(initial?.updated_at),id=useRef(initial?.id||uid()),lock=useRef(false)
 const[n,setN]=useState(initial?.name||''),[a,setA]=useState(initial?.address||''),[em,setEm]=useState(initial?.email||''),[no,setNo]=useState(initial?.notes||''),[c,setC]=useState(initial?.contacts?.length?initial.contacts:[{role:'Owner',name:'',phone:''}]),[m,setM]=useState(''),[busy,setBusy]=useState(false)
 const up=(i,k,v)=>setC(c.map((x,j)=>j===i?{...x,[k]:v}:x))
 const save=async()=>{if(lock.current)return;if(!n.trim())return setM('Please enter the company name.');if(c.some(x=>!phoneOk(x.phone)))return setM('Please check the phone numbers. They should have 10 to 13 digits.')
  lock.current=true;setBusy(true);try{await persist('companies',{name:n.trim().replace(/\s+/g,' '),address:a||null,email:em||null,notes:no||null,contacts:c.filter(x=>x.phone||x.name).map(x=>({...x,phone:cleanPhone(x.phone)}))},base.current,id.current);await load();close()}catch(x){setM(msg(x))}lock.current=false;setBusy(false)}
 return<div className="card"><label>Company Name *</label><input className="in" value={n} onChange={e=>setN(e.target.value)}/><label>Address</label><input className="in" value={a} onChange={e=>setA(e.target.value)}/><label>Email (optional)</label><input className="in" type="email" value={em} onChange={e=>setEm(e.target.value)}/>
 <h3>Contacts</h3>{c.map((x,i)=><div key={i} className="card" style={{background:'#FBF9F4'}}><div className="grid"><select className="in" value={x.role} onChange={e=>up(i,'role',e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</select><input className="in" placeholder="Name" value={x.name} onChange={e=>up(i,'name',e.target.value)}/></div><input className="in" style={{marginTop:8}} type="tel" inputMode="tel" placeholder="Phone" value={x.phone} onChange={e=>up(i,'phone',e.target.value)}/>
 <div className="acts"><button className="btn o" onClick={()=>pick((nm,p)=>setC(c.map((y,j)=>j===i?{...y,name:nm,phone:p}:y)))}>Select Contact</button><button className="btn o" onClick={()=>setC(c.filter((_,j)=>j!==i))}>Remove</button></div></div>)}
 <button className="btn o" onClick={()=>setC([...c,{role:'Accounts',name:'',phone:''}])}>Add Another Contact</button><label>Notes</label><input className="in" value={no} onChange={e=>setNo(e.target.value)}/>
 {m&&<div className="err">{m}</div>}<div className="acts"><button className="btn g" style={{flex:1}} disabled={busy} onClick={save}>{busy?'Saving…':'Save Company'}</button><button className="btn o" onClick={close}>Close</button></div></div>}

function DrForm({initial,load,close}){
 const base=useRef(initial?.updated_at),id=useRef(initial?.id||uid()),lock=useRef(false)
 const[f,setF]=useState({name:initial?.name||'',phone:initial?.phone||'',truck_no:initial?.truck_no||'',address:initial?.address||'',notes:initial?.notes||''}),[m,setM]=useState(''),[busy,setBusy]=useState(false)
 const I=(k,l,p={})=><><label>{l}</label><input className="in" value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} {...p}/></>
 const save=async()=>{if(lock.current)return;if(!f.name.trim())return setM('Please enter the driver name.');if(!phoneOk(f.phone))return setM('Please check the phone number. It should have 10 to 13 digits.')
  lock.current=true;setBusy(true);try{await persist('drivers',{name:f.name.trim().replace(/\s+/g,' '),phone:cleanPhone(f.phone)||null,truck_no:f.truck_no.trim().toUpperCase()||null,address:f.address||null,notes:f.notes||null},base.current,id.current);await load();close()}catch(x){setM(msg(x))}lock.current=false;setBusy(false)}
 return<div className="card">{I('name','Driver Name *')}{I('phone','Phone',{type:'tel',inputMode:'tel'})}<div className="acts"><button className="btn o" onClick={()=>pick((n,p)=>setF({...f,name:n,phone:p}))}>Select Contact</button></div>{I('truck_no','Truck Number')}{I('address','Address')}{I('notes','Notes')}
 {m&&<div className="err">{m}</div>}<div className="acts"><button className="btn g" style={{flex:1}} disabled={busy} onClick={save}>{busy?'Saving…':'Save Driver'}</button><button className="btn o" onClick={close}>Close</button></div></div>}

function Dir({title,items,line,calls,form,open}){const[q,setQ]=useState(''),[add,setAdd]=useState(false)
 const L=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name))
 return<><div className="row"><h1>{title}</h1><button className="btn g" onClick={()=>setAdd(!add)}>{add?'Close':'➕ Add New'}</button></div>{add&&form(()=>setAdd(false))}<input className="in" placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/>
 {L.map(x=><div className="card" key={x.id}><div className="tap" onClick={()=>open(x.id)}><b>{x.name}</b><div className="sm">{line(x)}</div></div><div className="acts">{calls(x)}<button className="btn o" onClick={()=>open(x.id)}>Open</button></div></div>)}{!items.length&&<div className="card">No Records Yet</div>}</>}
export const Cos=({d,load,go})=><Dir title="Companies" items={d.companies} open={id=>go('co',id)} line={c=>[c.address,(c.contacts||[]).map(x=>x.name||x.role).join(', ')].filter(Boolean).join(' · ')} calls={c=>(c.contacts||[]).filter(x=>x.phone).slice(0,2).map((x,i)=><Call key={i} n={x.phone} t={x.role}/>)} form={close=><CoForm load={load} close={close}/>}/>
export const Drs=({d,load,go})=><Dir title="Drivers" items={d.drivers} open={id=>go('dr',id)} line={x=>[x.phone,x.truck_no,x.address].filter(Boolean).join(' · ')} calls={x=><Call n={x.phone} t="Call Driver"/>} form={close=><DrForm load={load} close={close}/>}/>

export function CoDetail({d,S,sel,go,load}){const c=d.companies.find(x=>x.id===sel),[ed,setEd]=useState(false);if(!c)return<><Back go={go} to="cos" t="Companies"/><div className="card">No Records Yet</div></>
 const L=S.filter(s=>s.company_id===c.id),live=L.filter(s=>s.status!=='Cancelled'),bal=live.reduce((a,s)=>a+s.recBal,0),pend=live.filter(s=>s.recBal>0.004)
 const rem='Hello, this is a reminder from Batra Transport Services. A balance of '+inr(bal)+' is pending for: '+pend.map(s=>s.code+' ('+inr(s.recBal)+')').join(', ')+'. Thank you.'
 return<><Back go={go} to="cos" t="Companies"/>{ed?<CoForm key={c.updated_at} initial={c} load={load} close={()=>setEd(false)}/>:<div className="card"><h1>{c.name}</h1><div className="sm">{[c.address,c.email].filter(Boolean).join(' · ')}</div>{c.notes&&<div className="sm">{c.notes}</div>}
 <h3>Contacts</h3>{(c.contacts||[]).map((x,i)=><div key={i} className="row" style={{padding:'6px 0'}}><span><b>{x.role}</b> {x.name}<div className="sm">{x.phone}</div></span><Call n={x.phone}/></div>)}{!(c.contacts||[]).length&&<div className="sm">No Records Yet</div>}
 <div className="acts"><button className="btn" onClick={()=>setEd(true)}>Edit</button>{bal>0.004&&<a className="btn o" target="_blank" rel="noreferrer" href={wa(rem)}>Payment Reminder</a>}</div></div>}
 <div className="grid"><Stat t="Shipments" v={L.length}/><Stat t="Balance Left" v={inr(bal)}/></div><h2>Shipments</h2>{L.length?[...L].sort((a,b)=>b.dispatch_date.localeCompare(a.dispatch_date)).map(s=><ShipCard key={s.id} s={s} go={go}/>):<div className="card">No Records Yet</div>}</>}

export function DrDetail({d,S,sel,go,load}){const v=d.drivers.find(x=>x.id===sel),[ed,setEd]=useState(false);if(!v)return<><Back go={go} to="drs" t="Drivers"/><div className="card">No Records Yet</div></>
 const L=S.filter(s=>s.driver_id===v.id),live=L.filter(s=>s.status!=='Cancelled'),bal=live.reduce((a,s)=>a+s.payBal,0)
 return<><Back go={go} to="drs" t="Drivers"/>{ed?<DrForm key={v.updated_at} initial={v} load={load} close={()=>setEd(false)}/>:<div className="card"><h1>{v.name}</h1><div>{v.phone}</div><div className="sm">{[v.truck_no,v.address].filter(Boolean).join(' · ')}</div>{v.notes&&<div className="sm">{v.notes}</div>}<div className="acts"><button className="btn" onClick={()=>setEd(true)}>Edit</button><Call n={v.phone} t="Call Driver"/></div></div>}
 <div className="grid"><Stat t="Shipments" v={L.length}/><Stat t="Balance Left" v={inr(bal)}/></div><h2>Shipments</h2>{L.length?[...L].sort((a,b)=>b.dispatch_date.localeCompare(a.dispatch_date)).map(s=><ShipCard key={s.id} s={s} go={go}/>):<div className="card">No Records Yet</div>}</>}

const KIND={receipt:'Money Received',driver:'Driver Payment',commission:'Commission'}
export function Hist({d,S,go}){const[k,setK]=useState(''),[a,setA]=useState(''),[b,setB]=useState(''),[q,setQ]=useState(''),by=Object.fromEntries(S.map(s=>[s.id,s]))
 const L=d.payments.filter(p=>(!k||p.kind===k)&&(!a||ist(p.paid_at)>=a)&&(!b||ist(p.paid_at)<=b)&&(!q||[by[p.shipment_id]?.code,by[p.shipment_id]?.truck_no,by[p.shipment_id]?.co?.name,by[p.shipment_id]?.dr?.name,p.reference].join(' ').toLowerCase().includes(q.toLowerCase()))).sort((x,y)=>y.paid_at.localeCompare(x.paid_at))
 const sum=L.filter(p=>!p.voided).reduce((t,p)=>t+ +p.amount,0)
 return<><h1>Payment History</h1><input className="in" placeholder="Search shipment, truck, company, driver or reference" value={q} onChange={e=>setQ(e.target.value)}/><select className="in" style={{marginTop:8}} value={k} onChange={e=>setK(e.target.value)}><option value="">All Payments</option>{Object.entries(KIND).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select>
 <div className="grid" style={{marginTop:8}}><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></div>
 <Stat t={L.filter(p=>!p.voided).length+' payments (cancelled not counted)'} v={inr(sum)}/>
 {L.map(p=>{const s=by[p.shipment_id];return<div key={p.id} className="card tap" style={{opacity:p.voided?.55:1}} onClick={()=>s&&go('ship',s.id)}><div className="row"><b>{KIND[p.kind]}</b><b style={{textDecoration:p.voided?'line-through':'none'}}>{inr(p.amount)}</b></div><div className="sm">{s?s.code+' · '+s.truck_no+' · '+(p.kind==='driver'?s.dr?.name:s.co?.name):'Unknown shipment'}</div><div className="sm">{new Date(p.paid_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})} · {p.mode}{p.reference&&' · '+p.reference}</div>{p.voided&&<div className="sm" style={{color:'#B0231D'}}>Cancelled: {p.void_reason}</div>}</div>})}{!L.length&&<div className="card">No Records Yet</div>}</>}

export function Rep({S}){const[a,setA]=useState(''),[b,setB]=useState(''),[busy,setBz]=useState(false),[m,setM]=useState('');const lock=useRef(false)
 const dl=async()=>{if(lock.current)return;if(!navigator.onLine)return setM('You are offline. Please connect to the internet and try again.');lock.current=true;setBz(true);setM('')
  try{const{downloadXlsx}=await import('./excel.js');await downloadXlsx(sb,a,b);setM('OK')}catch(e){setM('Excel could not be made, so nothing was downloaded. '+(e.message||'Please try again.'))}lock.current=false;setBz(false)}
 return<><h1>Reports and Excel</h1><div className="card"><p>Download a fresh Excel file with all saved records. Leave the dates empty to include everything.</p><div className="grid"><div><label>From</label><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/></div><div><label>To</label><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></div></div>{m==='OK'?<div className="good">Excel downloaded. It has the latest saved records.</div>:m&&<div className="err">{m}</div>}<br/><button className="btn g w" disabled={busy} onClick={dl}>{busy?'Making Excel…':'Download Excel'}</button></div>
 <div className="card sm">{S.length} shipments are saved. The file has 8 sheets: Shipment Register, Company Payments Received, Driver Payments Made, Commission, Money to Receive, Money to Pay, Daily and Monthly Summary, and Companies and Drivers. Dates are in India time.</div></>}

export function Set({user}){const[m,setM]=useState(''),[busy,setBz]=useState(false)
 const bk=async()=>{setBz(true);setM('');try{const d=await snapshot(sb),blob=new Blob([JSON.stringify({saved_at:new Date().toISOString(),...d},null,1)],{type:'application/json'}),u=document.createElement('a');u.href=URL.createObjectURL(blob);u.download='BTS-backup-'+todayIST()+'.json';document.body.appendChild(u);u.click();u.remove();setM('OK')}catch(e){setM('Backup could not be made. '+e.message)}setBz(false)}
 return<><h1>Settings and Backup</h1><div className="card">Signed in as <b>{user.email}</b><div className="acts"><button className="btn o" onClick={()=>confirm('Sign out now?')&&sb.auth.signOut()}>Sign Out</button></div></div>
 <div className="card"><h2>Keep a Backup</h2><p>Tap the button to save a full copy of all records on this phone. Keep the file private and save it to Google Drive. Do this once a week.</p>{m==='OK'?<div className="good">Backup file downloaded.</div>:m&&<div className="err">{m}</div>}<button className="btn g w" disabled={busy} onClick={bk}>{busy?'Please wait…':'Download Backup'}</button>
 <p className="sm">You can also download Excel from Reports and Excel. To restore a backup, ask your helper to follow the steps in the README.</p></div>
 <div className="card"><h2>Who Can Sign In</h2><p className="sm">Only people added by your helper in Supabase can sign in. Payments are never deleted. A wrong payment is cancelled and stays in the history.</p></div></>}
