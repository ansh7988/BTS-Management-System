import {useRef,useState} from 'react'
import {sb,inr,snapshot,ist,todayIST} from './db.js'
import {Call,Stat,ShipList,Back,Icon,Alert,Empty,Search,pick,wa,uid,phoneOk,cleanPhone} from './common.jsx'

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
  return<div className="card"><div className="card-h"><h2>{initial?'Edit Company':'New Company'}</h2></div>
  <div className="fsec"><h2>Company details</h2>
   <label className="fld"><span className="lbl">Company Name *</span><input className="in" value={n} onChange={e=>setN(e.target.value)}/></label>
   <label className="fld"><span className="lbl">Address</span><input className="in" value={a} onChange={e=>setA(e.target.value)}/></label>
   <label className="fld"><span className="lbl">Email (optional)</span><input className="in" type="email" value={em} onChange={e=>setEm(e.target.value)}/></label></div>
  <div className="fsec"><h2>Contacts</h2>{c.map((x,i)=><div key={i} className="cbox"><div className="fgrid k2"><label className="fld"><span className="lbl">Role</span><select className="in" value={x.role} onChange={e=>up(i,'role',e.target.value)}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></label><label className="fld"><span className="lbl">Name</span><input className="in" placeholder="Name" value={x.name} onChange={e=>up(i,'name',e.target.value)}/></label></div>
   <label className="fld"><span className="lbl">Phone</span><input className="in" type="tel" inputMode="tel" placeholder="Phone" value={x.phone} onChange={e=>up(i,'phone',e.target.value)}/></label>
   <div className="acts" style={{marginTop:0}}><button className="btn o s" onClick={()=>pick((nm,p)=>setC(c.map((y,j)=>j===i?{...y,name:nm,phone:p}:y)))}><Icon n="contact"/>Select Contact</button><button className="btn o s" onClick={()=>setC(c.filter((_,j)=>j!==i))}><Icon n="x"/>Remove</button></div></div>)}
   <button className="btn o s" onClick={()=>setC([...c,{role:'Accounts',name:'',phone:''}])}><Icon n="plus"/>Add Another Contact</button></div>
  <div className="fsec"><label className="fld"><span className="lbl">Notes</span><input className="in" value={no} onChange={e=>setNo(e.target.value)}/></label></div>
  {m&&<Alert>{m}</Alert>}<div className="acts"><button className="btn g" style={{flex:1}} disabled={busy} onClick={save}>{busy?'Saving…':'Save Company'}</button><button className="btn o" onClick={close}>Close</button></div></div>}

function DrForm({initial,load,close}){
 const base=useRef(initial?.updated_at),id=useRef(initial?.id||uid()),lock=useRef(false)
 const[f,setF]=useState({name:initial?.name||'',phone:initial?.phone||'',truck_no:initial?.truck_no||'',address:initial?.address||'',notes:initial?.notes||''}),[m,setM]=useState(''),[busy,setBusy]=useState(false)
  const I=(k,l,p={})=><label className="fld"><span className="lbl">{l}</span><input className="in" value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})} {...p}/></label>
 const save=async()=>{if(lock.current)return;if(!f.name.trim())return setM('Please enter the driver name.');if(!phoneOk(f.phone))return setM('Please check the phone number. It should have 10 to 13 digits.')
  lock.current=true;setBusy(true);try{await persist('drivers',{name:f.name.trim().replace(/\s+/g,' '),phone:cleanPhone(f.phone)||null,truck_no:f.truck_no.trim().toUpperCase()||null,address:f.address||null,notes:f.notes||null},base.current,id.current);await load();close()}catch(x){setM(msg(x))}lock.current=false;setBusy(false)}
  return<div className="card"><div className="card-h"><h2>{initial?'Edit Driver':'New Driver'}</h2></div>
  <div className="fsec"><h2>Driver details</h2>{I('name','Driver Name *')}{I('phone','Phone',{type:'tel',inputMode:'tel'})}<div className="acts" style={{marginTop:0,marginBottom:12}}><button className="btn o s" onClick={()=>pick((n,p)=>setF({...f,name:n,phone:p}))}><Icon n="contact"/>Select Contact</button></div>{I('truck_no','Truck Number')}{I('address','Address')}{I('notes','Notes')}</div>
  {m&&<Alert>{m}</Alert>}<div className="acts"><button className="btn g" style={{flex:1}} disabled={busy} onClick={save}>{busy?'Saving…':'Save Driver'}</button><button className="btn o" onClick={close}>Close</button></div></div>}

function Dir({title,items,line,calls,form,open}){const[q,setQ]=useState(''),[add,setAdd]=useState(false)
 const L=items.filter(x=>JSON.stringify(x).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name))
  return<>
  <div className="bar"><p className="sub-t">{L.length+(L.length===1?' record':' records')}</p><button className="btn g" onClick={()=>setAdd(!add)}>{add?<><Icon n="x"/>Close</>:<><Icon n="plus"/>Add New</>}</button></div>{add&&form(()=>setAdd(false))}
  <div style={{margin:'0 0 14px'}}><Search label={'Search '+title} placeholder="Search" value={q} onChange={e=>setQ(e.target.value)}/></div>
  {L.length?<div className="card flush"><div className="tw"><table className="rt"><thead><tr><th>Name</th><th>Details</th><th className="r">Contact</th></tr></thead><tbody>{L.map(x=><tr key={x.id} className="click" onClick={()=>open(x.id)}><td className="m1 f"><button className="lnk">{x.name}</button></td><td className="m2 f"><span className="sm" style={{marginTop:0}}>{line(x)}</span></td><td className="r m3 f"><div className="acts" onClick={e=>e.stopPropagation()}>{calls(x)}<button className="btn o s" onClick={()=>open(x.id)}>Open</button></div></td></tr>)}</tbody></table></div></div>:<div className="card"><Empty>{items.length?'Nothing matches your search.':undefined}</Empty></div>}</>}

export const Cos=({d,load,go})=><Dir title="Companies" items={d.companies} open={id=>go('co',id)} line={c=>[c.address,(c.contacts||[]).map(x=>x.name||x.role).join(', ')].filter(Boolean).join(' · ')} calls={c=>(c.contacts||[]).filter(x=>x.phone).slice(0,2).map((x,i)=><Call key={i} n={x.phone} t={x.role}/>)} form={close=><CoForm load={load} close={close}/>}/>
export const Drs=({d,load,go})=><Dir title="Drivers" items={d.drivers} open={id=>go('dr',id)} line={x=>[x.phone,x.truck_no,x.address].filter(Boolean).join(' · ')} calls={x=><Call n={x.phone} t="Call Driver"/>} form={close=><DrForm load={load} close={close}/>}/>

export function CoDetail({d,S,sel,go,load}){const c=d.companies.find(x=>x.id===sel),[ed,setEd]=useState(false);if(!c)return<><Back go={go} to="cos" t="Companies"/><div className="card" style={{marginTop:14}}><Empty/></div></>
 const L=S.filter(s=>s.company_id===c.id),live=L.filter(s=>s.status!=='Cancelled'),bal=live.reduce((a,s)=>a+s.recBal,0),pend=live.filter(s=>s.recBal>0.004)
 const rem='Hello, this is a reminder from Batra Transport Services. A balance of '+inr(bal)+' is pending for: '+pend.map(s=>s.code+' ('+inr(s.recBal)+')').join(', ')+'. Thank you.'
  const meta=[c.address,c.email].filter(Boolean).join(' · ')
  return<>
  <div className="bar"><Back go={go} to="cos" t="Companies"/></div>
  {ed?<CoForm key={c.updated_at} initial={c} load={load} close={()=>setEd(false)}/>:<div className="card"><div className="eyebrow">Company</div><h2 style={{fontSize:22}}>{c.name}</h2>{meta&&<p className="sub-t" style={{marginTop:6}}>{meta}</p>}{c.notes&&<p className="note">{c.notes}</p>}
   <div className="fsec" style={{marginTop:16}}><h2>Contacts</h2>{(c.contacts||[]).map((x,i)=><div key={i} className="contact"><div><b>{x.name||x.role}</b><div className="sm">{(x.name?x.role+' · ':'')+(x.phone||'')}</div></div><Call n={x.phone}/></div>)}{!(c.contacts||[]).length&&<div className="sm">No contacts saved.</div>}</div>
   <div className="acts" style={{marginTop:0}}><button className="btn s" onClick={()=>setEd(true)}><Icon n="edit"/>Edit</button>{bal>0.004&&<a className="btn o s" target="_blank" rel="noreferrer" href={wa(rem)}><Icon n="chat"/>Payment Reminder</a>}</div></div>}
  <div className="kpis" style={{marginBottom:6}}><Stat t="Shipments" v={L.length}/><Stat tone="rec" t="Balance Left" v={inr(bal)}/></div>
  <div className="sec"><h2>Shipments</h2></div>{L.length?<ShipList rows={[...L].sort((a,b)=>b.dispatch_date.localeCompare(a.dispatch_date))} go={go}/>:<div className="card"><Empty/></div>}</>}

export function DrDetail({d,S,sel,go,load}){const v=d.drivers.find(x=>x.id===sel),[ed,setEd]=useState(false);if(!v)return<><Back go={go} to="drs" t="Drivers"/><div className="card" style={{marginTop:14}}><Empty/></div></>
 const L=S.filter(s=>s.driver_id===v.id),live=L.filter(s=>s.status!=='Cancelled'),bal=live.reduce((a,s)=>a+s.payBal,0)
  const meta=[v.truck_no,v.address].filter(Boolean).join(' · ')
  return<>
  <div className="bar"><Back go={go} to="drs" t="Drivers"/></div>
  {ed?<DrForm key={v.updated_at} initial={v} load={load} close={()=>setEd(false)}/>:<div className="card"><div className="eyebrow">Driver</div><h2 style={{fontSize:22}}>{v.name}</h2>{v.phone&&<p style={{margin:'6px 0 0',fontWeight:600}}>{v.phone}</p>}{meta&&<p className="sub-t" style={{marginTop:4}}>{meta}</p>}{v.notes&&<p className="note">{v.notes}</p>}
   <div className="acts"><button className="btn s" onClick={()=>setEd(true)}><Icon n="edit"/>Edit</button><Call n={v.phone} t="Call Driver"/></div></div>}
  <div className="kpis" style={{marginBottom:6}}><Stat t="Shipments" v={L.length}/><Stat tone="pay" t="Balance Left" v={inr(bal)}/></div>
  <div className="sec"><h2>Shipments</h2></div>{L.length?<ShipList rows={[...L].sort((a,b)=>b.dispatch_date.localeCompare(a.dispatch_date))} go={go}/>:<div className="card"><Empty/></div>}</>}

const KIND={receipt:'Money Received',driver:'Driver Payment',commission:'Commission'}
export function Hist({d,S,go}){const[k,setK]=useState(''),[a,setA]=useState(''),[b,setB]=useState(''),[q,setQ]=useState(''),by=Object.fromEntries(S.map(s=>[s.id,s]))
 const L=d.payments.filter(p=>(!k||p.kind===k)&&(!a||ist(p.paid_at)>=a)&&(!b||ist(p.paid_at)<=b)&&(!q||[by[p.shipment_id]?.code,by[p.shipment_id]?.truck_no,by[p.shipment_id]?.co?.name,by[p.shipment_id]?.dr?.name,p.reference].join(' ').toLowerCase().includes(q.toLowerCase()))).sort((x,y)=>y.paid_at.localeCompare(x.paid_at))
 const sum=L.filter(p=>!p.voided).reduce((t,p)=>t+ +p.amount,0)
  return<>
  <div className="card"><div className="filters"><Search label="Search payments" placeholder="Search shipment, truck, company, driver or reference" value={q} onChange={e=>setQ(e.target.value)}/>
   <label className="fld wide"><span className="lbl">Payment type</span><select className="in" value={k} onChange={e=>setK(e.target.value)}><option value="">All Payments</option>{Object.entries(KIND).map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
   <label className="fld"><span className="lbl">From</span><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/></label><label className="fld"><span className="lbl">To</span><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></label></div></div>
  <div style={{marginBottom:14}}><Stat t={L.filter(p=>!p.voided).length+' payments (cancelled not counted)'} v={inr(sum)}/></div>
  {L.length?<div className="card flush"><div className="tw"><table className="rt"><thead><tr><th>Date</th><th>Type</th><th>Shipment</th><th>Party</th><th>Mode and reference</th><th className="r">Amount</th></tr></thead><tbody>{L.map(p=>{const s=by[p.shipment_id];return<tr key={p.id} className={'click'+(p.voided?' void':'')} onClick={()=>s&&go('ship',s.id)}>
   <td className="m1">{new Date(p.paid_at).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium'})}<span className="sm">{new Date(p.paid_at).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata',timeStyle:'short'})}</span></td>
   <td className="m3 f"><b>{KIND[p.kind]}</b></td>
   <td className="m4 f">{s?<><button className="lnk">{s.code}</button><span className="sm">{s.truck_no}</span></>:'Unknown shipment'}</td>
   <td className="m5 f">{s?(p.kind==='driver'?s.dr?.name:s.co?.name):''}</td>
   <td className="m6 f">{[p.mode,p.reference].filter(Boolean).join(' · ')}{p.voided&&<div className="vr">Cancelled: {p.void_reason}</div>}</td>
   <td className="r m2 mr"><b className="amt">{inr(p.amount)}</b></td></tr>})}</tbody></table></div></div>:<div className="card"><Empty/></div>}</>}

const SHEETS=['Shipment Register','Company Payments Received','Driver Payments Made','Commission','Money to Receive','Money to Pay','Daily and Monthly Summary','Companies and Drivers']
export function Rep({S}){const[a,setA]=useState(''),[b,setB]=useState(''),[busy,setBz]=useState(false),[m,setM]=useState('');const lock=useRef(false)
 const dl=async()=>{if(lock.current)return;if(!navigator.onLine)return setM('You are offline. Please connect to the internet and try again.');lock.current=true;setBz(true);setM('')
  try{const{downloadXlsx}=await import('./excel.js');await downloadXlsx(sb,a,b);setM('OK')}catch(e){setM('Excel could not be made, so nothing was downloaded. '+(e.message||'Please try again.'))}lock.current=false;setBz(false)}
  return<>
  <div className="card"><div className="card-h"><h2>Download Excel</h2></div><p>Download a fresh Excel file with all saved records. Leave the dates empty to include everything.</p>
   <div className="fgrid k2"><label className="fld"><span className="lbl">From</span><input className="in" type="date" value={a} onChange={e=>setA(e.target.value)}/></label><label className="fld"><span className="lbl">To</span><input className="in" type="date" value={b} onChange={e=>setB(e.target.value)}/></label></div>
   {m==='OK'?<Alert k="good">Excel downloaded. It has the latest saved records.</Alert>:m&&<Alert>{m}</Alert>}<button className="btn g w" style={{maxWidth:360}} disabled={busy} onClick={dl}><Icon n="download"/>{busy?'Making Excel…':'Download Excel'}</button></div>
  <div className="card"><div className="card-h"><h2>What the file contains</h2></div><p className="sm" style={{margin:0}}>{S.length+' shipments are saved. The file has 8 sheets. Dates are in India time.'}</p><ol className="sheets">{SHEETS.map((x,i)=><li key={x}><i>{String(i+1).padStart(2,'0')}</i><span>{x}</span></li>)}</ol></div></>}

export function Set({user}){const[m,setM]=useState(''),[busy,setBz]=useState(false)
 const bk=async()=>{setBz(true);setM('');try{const d=await snapshot(sb),blob=new Blob([JSON.stringify({saved_at:new Date().toISOString(),...d},null,1)],{type:'application/json'}),u=document.createElement('a');u.href=URL.createObjectURL(blob);u.download='BTS-backup-'+todayIST()+'.json';document.body.appendChild(u);u.click();u.remove();setM('OK')}catch(e){setM('Backup could not be made. '+e.message)}setBz(false)}
  return<>
  <div className="card"><div className="who"><div><div className="sm">Signed in as</div><b>{user.email}</b></div><button className="btn o s" onClick={()=>confirm('Sign out now?')&&sb.auth.signOut()}><Icon n="logout"/>Sign Out</button></div></div>
  <div className="card"><div className="card-h"><h2>Keep a Backup</h2></div><p>Tap the button to save a full copy of all records on this phone. Keep the file private and save it to Google Drive. Do this once a week.</p>{m==='OK'?<Alert k="good">Backup file downloaded.</Alert>:m&&<Alert>{m}</Alert>}<button className="btn g w" style={{maxWidth:360}} disabled={busy} onClick={bk}><Icon n="download"/>{busy?'Please wait…':'Download Backup'}</button>
  <p className="note">You can also download Excel from Reports and Excel. To restore a backup, ask your helper to follow the steps in the README.</p></div>
  <div className="card"><div className="card-h"><h2>Who Can Sign In</h2></div><p className="sm" style={{margin:0}}>Only people added by your helper in Supabase can sign in. Payments are never deleted. A wrong payment is cancelled and stays in the history.</p></div></>}