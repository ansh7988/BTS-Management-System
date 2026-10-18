import {useRef,useState} from 'react'
import {sb,inr,st,r2} from './db.js'
import {Pill,uid,today} from './common.jsx'
const friendly=e=>e.code==='23505'?'DUP':(e.message||'').replace(/^BTS: /,'')||'Something Went Wrong'
export default function Ledger({s,d,kind,title,agreed,paid,load}){
 const[a,setA]=useState(''),[mo,setMo]=useState('Cash'),[ref,setRef]=useState(''),[n,setN]=useState(''),[day,setDay]=useState(today()),[m,setM]=useState(''),[busy,setBusy]=useState(false)
 const[vid,setVid]=useState(null),[why,setWhy]=useState('')
 const pid=useRef(uid()),lock=useRef(false)            // one id per form: a double tap or retry can never save twice
 const bal=r2(agreed-paid),H=d.payments.filter(p=>p.shipment_id===s.id&&p.kind===kind).sort((x,y)=>y.paid_at.localeCompare(x.paid_at))
 const label=kind==='driver'?'Amount Paid':kind==='commission'?'Commission Received':'Amount Received'
 const add=async()=>{if(lock.current)return;const v=r2(a);setM('')
  if(!(v>0))return setM('Please enter an amount above zero.')
  if(v>bal+0.004)return setM('This is more than the balance left ('+inr(bal)+'). Please check the amount.')
  if(day>today())return setM('The date cannot be in the future.')
  lock.current=true;setBusy(true)
  const when=day===today()?new Date().toISOString():day+'T12:00:00+05:30'
  const{error}=await sb.from('payments').insert({id:pid.current,shipment_id:s.id,kind,amount:v,paid_at:when,mode:mo,reference:ref.trim()||null,notes:n.trim()||null})
  const f=error?friendly(error):'';setBusy(false);lock.current=false
  if(error&&f!=='DUP')return setM('Something Went Wrong: '+f)
  pid.current=uid();setA('');setRef('');setN('');setM('OK');load()}
 const cancel=async p=>{if(lock.current)return;if(!why.trim())return alert('Please write why this payment is wrong.');lock.current=true
  const{error}=await sb.from('payments').update({voided:true,void_reason:why.trim()}).eq('id',p.id).eq('voided',false);lock.current=false
  if(error)return alert('Something Went Wrong: '+friendly(error));setVid(null);setWhy('');load()}
 return<div className="card"><div className="row"><h2>{title}</h2><Pill v={st(paid,agreed)}/></div>
 <div className="grid"><div><div className="sm">Agreed</div><b>{inr(agreed)}</b></div><div><div className="sm">{label}</div><b>{inr(paid)}</b></div></div>
 <div className="sm">Balance Left</div><div className="big">{inr(bal)}</div>{bal<-0.004&&<div className="err">More than the agreed amount is saved. Please check the payment history.</div>}
 <h3>Payment History</h3>
 {H.length?H.map(p=><div key={p.id} style={{padding:'8px 0',borderTop:'1px solid #E5E0D5'}}>
  <div className="row sm" style={{opacity:p.voided?.55:1}}><span style={{textDecoration:p.voided?'line-through':'none'}}>{new Date(p.paid_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',dateStyle:'medium',timeStyle:'short'})} · {p.mode}{p.reference&&' · '+p.reference}{p.notes&&' · '+p.notes}</span><b style={{textDecoration:p.voided?'line-through':'none'}}>{inr(p.amount)}</b></div>
  {p.voided?<div className="sm" style={{color:'#B0231D'}}>Cancelled: {p.void_reason}</div>:vid===p.id?<div><input className="in" style={{marginTop:6}} placeholder="Why is this payment wrong?" value={why} onChange={e=>setWhy(e.target.value)}/><div className="acts"><button className="btn" onClick={()=>cancel(p)}>Cancel This Payment</button><button className="btn o" onClick={()=>{setVid(null);setWhy('')}}>Keep It</button></div></div>
  :<button className="btn o" style={{minHeight:40,marginTop:6}} onClick={()=>{setVid(p.id);setWhy('')}}>Wrong Payment?</button>}</div>):<div className="sm">No Records Yet</div>}
 {H.some(p=>!p.voided)&&<div className="sm" style={{marginTop:6}}>Made a mistake? Cancel the wrong payment, then add the correct one. Cancelled payments stay in the history.</div>}
 {bal>0.004&&s.status==='Cancelled'&&<div className="sm">Payments cannot be added to a cancelled shipment.</div>}
 {bal>0.004&&s.status!=='Cancelled'&&<><h3>Add Payment</h3><div className="grid"><input className="in" type="number" inputMode="decimal" placeholder="Amount" value={a} onChange={e=>setA(e.target.value)}/><select className="in" value={mo} onChange={e=>setMo(e.target.value)}>{['Cash','UPI','Bank Transfer','Cheque','Other'].map(x=><option key={x}>{x}</option>)}</select></div>
 <input className="in" style={{marginTop:8}} type="date" max={today()} value={day} onChange={e=>setDay(e.target.value)}/>
 <input className="in" style={{marginTop:8}} placeholder="Reference / UTR (optional)" value={ref} onChange={e=>setRef(e.target.value)}/><input className="in" style={{marginTop:8}} placeholder="Notes (optional)" value={n} onChange={e=>setN(e.target.value)}/>
 {m==='OK'?<div className="good">Payment Saved Successfully</div>:m&&<div className="err">{m}</div>}<br/><button className="btn g w" disabled={busy} onClick={add}>{busy?'Saving…':'Add Payment'}</button></>}</div>}