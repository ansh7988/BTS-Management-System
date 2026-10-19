import {Fragment,useRef,useState} from 'react'
import {sb,inr,st,r2} from './db.js'
import {Pill,Alert,Empty,uid,today} from './common.jsx'
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
 const fmt=(iso,o)=>new Date(iso).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',...o})
 return<section className="card ledger"><div className="card-h"><h2>{title}</h2><Pill v={st(paid,agreed)}/></div>
 <div className="lsum"><div><div className="sm">Agreed</div><b>{inr(agreed)}</b></div><div><div className="sm">{label}</div><b>{inr(paid)}</b></div><div className="lbal"><div className="sm">Balance Left</div><div className="big">{inr(bal)}</div></div></div>
 {bal<-0.004&&<Alert>More than the agreed amount is saved. Please check the payment history.</Alert>}
 <div className="lh"><h3>Payment History</h3></div>
 {H.length?<div className="tw"><table className="rt"><thead><tr><th>Date</th><th>Mode</th><th>Reference and notes</th><th className="r">Amount</th><th><span className="sr">Action</span></th></tr></thead><tbody>{H.map(p=><Fragment key={p.id}><tr className={p.voided?'void':''}>
  <td className="m1">{fmt(p.paid_at,{dateStyle:'medium'})}<span className="sm">{fmt(p.paid_at,{timeStyle:'short'})}</span></td>
  <td className="m3 f">{p.mode}</td>
  <td className="m4 f">{[p.reference,p.notes].filter(Boolean).join(' · ')}</td>
  <td className="r m2 mr"><b className="amt">{inr(p.amount)}</b></td>
  <td className="m5 f">{!p.voided&&vid!==p.id&&<button className="btn o s" onClick={()=>{setVid(p.id);setWhy('')}}>Wrong Payment?</button>}</td></tr>
  {p.voided&&<tr className="sub"><td colSpan={5} className="f"><div className="vr">Cancelled: {p.void_reason}</div></td></tr>}
  {!p.voided&&vid===p.id&&<tr className="sub"><td colSpan={5} className="f"><label className="sr" htmlFor={'why-'+p.id}>Why is this payment wrong?</label><input id={'why-'+p.id} className="in" placeholder="Why is this payment wrong?" value={why} onChange={e=>setWhy(e.target.value)}/><div className="inl"><button className="btn s" onClick={()=>cancel(p)}>Cancel This Payment</button><button className="btn o s" onClick={()=>{setVid(null);setWhy('')}}>Keep It</button></div></td></tr>}</Fragment>)}</tbody></table></div>:<div className="lb-pad"><Empty/></div>}
 {H.some(p=>!p.voided)&&<div className="lb-pad"><p className="note">Made a mistake? Cancel the wrong payment, then add the correct one. Cancelled payments stay in the history.</p></div>}
 {bal>0.004&&s.status==='Cancelled'&&<div className="lb-pad"><p className="note">Payments cannot be added to a cancelled shipment.</p></div>}
 {bal>0.004&&s.status!=='Cancelled'&&<div className="addpay"><h3>Add Payment</h3>
  <div className="fgrid k2"><label className="fld"><span className="lbl">Amount (₹)</span><input className="in" type="number" inputMode="decimal" placeholder="0" value={a} onChange={e=>setA(e.target.value)}/></label><label className="fld"><span className="lbl">Payment mode</span><select className="in" value={mo} onChange={e=>setMo(e.target.value)}>{['Cash','UPI','Bank Transfer','Cheque','Other'].map(x=><option key={x}>{x}</option>)}</select></label></div>
  <label className="fld"><span className="lbl">Payment date</span><input className="in" type="date" max={today()} value={day} onChange={e=>setDay(e.target.value)}/></label>
  <div className="fgrid"><label className="fld"><span className="lbl">Reference / UTR (optional)</span><input className="in" placeholder="Reference / UTR (optional)" value={ref} onChange={e=>setRef(e.target.value)}/></label><label className="fld"><span className="lbl">Notes (optional)</span><input className="in" placeholder="Notes (optional)" value={n} onChange={e=>setN(e.target.value)}/></label></div>
  {m==='OK'?<Alert k="good">Payment Saved Successfully</Alert>:m&&<Alert>{m}</Alert>}<button className="btn g w" disabled={busy} onClick={add}>{busy?'Saving…':'Add Payment'}</button></div>}</section>}