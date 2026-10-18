// Regression tests for F1 (Expected Delivery), F4 (Today's Shipments) and S4 (status update). FAKE data only, no network.
import {renderToString} from 'react-dom/server'
import {readFileSync} from 'fs'
import {Dash,Com,Pages,changeStatus,commissionIn} from '../src/App.jsx'
import ShipForm from '../src/ShipForm.jsx'
import {enrich,todayIST} from '../src/db.js'
import {mk} from './fixtures.js'
let n=0;const as=(c:boolean,m:string)=>{if(!c){console.error('FAIL',m);process.exit(1)}n++;console.log('ok',m)}
const go=()=>{},load=async()=>{}

// ---- F1: the Expected Delivery input must be editable (it must have an onChange handler)
const warnings:string[]=[],origErr=console.error;console.error=(...a:any[])=>{warnings.push(a.map(String).join(' '))}
const d:any=mk();d.shipments[0].expected_date='2026-10-25'
const editHtml=renderToString(<ShipForm d={d} go={go} load={load} sel="s1"/>)
const addHtml=renderToString(<ShipForm d={mk() as any} go={go} load={load} sel={null}/>)
console.error=origErr
as(!warnings.some(w=>w.includes('without an `onChange` handler')),'F1: no form field is rendered read-only (no "value without onChange" warning)')
as(/Expected Delivery[^]*?<input[^>]*type="date"[^>]*value="2026-10-25"/.test(editHtml),'F1: Edit shows the saved expected date (2026-10-25)')
as(/Expected Delivery[^]*?<input[^>]*type="date"[^>]*value=""/.test(addHtml),'F1: Add shows an empty expected date')
const form=readFileSync('src/ShipForm.jsx','utf8')
as(!/onChange\s*:\s*undefined/.test(form),'F1: no input has its onChange overridden with undefined')
as(/Expected delivery \(\$\{f\.expected_date\}\) cannot be before dispatch/.test(form),'F1: "expected cannot be before dispatch" validation is still in the form')

// ---- F4: Today's Shipments must not count Cancelled shipments
const today=todayIST()
const todays=(statuses:string[])=>{const dd:any=mk();dd.payments=[];dd.shipments=statuses.map((st,i)=>({...dd.shipments[0],id:'s'+i,code:'T'+i,status:st,dispatch_date:today}))
 const h=renderToString(<Dash d={dd} S={enrich(dd)} go={go}/>);const m=h.slice(h.indexOf('Today')).match(/class="big">([^<]*)</);return m?m[1]:'?'}
as(todays(['Booked'])==='1','F4: one Booked shipment today counts as 1')
as(todays(['Cancelled'])==='0','F4: a Cancelled shipment today is not counted')
as(todays(['Booked','Cancelled','Delivered'])==='2','F4: 3 shipments today (1 Cancelled) count as 2')

// ---- S4: status update must never fail silently
const fake=(result:any,log:any[])=>({from:(t:string)=>({update:(row:any)=>{log.push(['update',t,row]);const q:any={eq:(k:string,v:any)=>{log.push(['eq',k,v]);return q},select:()=>{log.push(['select']);return q},maybeSingle:async()=>result};return q}})})
const ship={id:'s1',updated_at:'T1'}
let log:any[]=[]
as((await changeStatus(fake({data:{id:'s1'},error:null},log),ship,'Delivered')).ok===true,'S4: a really updated row is reported as success')
as(log.some(x=>x[0]==='eq'&&x[1]==='updated_at'&&x[2]==='T1')&&log.some(x=>x[0]==='eq'&&x[1]==='id'&&x[2]==='s1')&&log.some(x=>x[0]==='select'),'S4: update is limited to this shipment AND its last-seen updated_at, and asks for the saved row back')
const stale=await changeStatus(fake({data:null,error:null},[]),ship,'Delivered')
as(stale.stale===true&&!stale.ok&&!stale.error,'S4: 0 rows updated (someone else changed it) is reported as stale, never as success')
const err=await changeStatus(fake({data:null,error:{message:'BTS: the new company amount is lower'}},[]),ship,'Cancelled')
as(!!err.error&&!err.ok&&!err.stale,'S4: a database error is reported as an error, never as success')
const err2=await changeStatus(fake({data:null,error:{}},[]),ship,'Cancelled')
as(err2.error==='Something Went Wrong','S4: an error without a message still gives a clear message')
const app=readFileSync('src/App.jsx','utf8')
as(/changeStatus\(sb,s,v\)/.test(app)&&!/update\(\{status:v\}\)\.eq\('id',s\.id\)\.eq\('updated_at',s\.updated_at\);error\?/.test(app),'S4: the Detail screen uses changeStatus (old silent version is gone)')

// ---- F2: "Commission Received" = commission payments received in the date range, by PAYMENT date, same rule on Dashboard and Ledger
const strip=(h:string)=>h.replace(/<!-- -->/g,'')
const esc=(t:string)=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
const statOf=(h:string,label:string)=>{const m=strip(h).match(new RegExp(esc(label)+'</div><div class="big">([^<]*)</div>'));return m?m[1]:'?'}
const mon=today.slice(0,7),prevM=new Date(Date.UTC(+mon.slice(0,4),+mon.slice(5)-2,15)).toISOString().slice(0,10),nowIso=new Date().toISOString()
const sh=(o:any)=>({...(mk() as any).shipments[0],...o})
const comData=(withCancelled:boolean)=>{const dd:any=mk()
 dd.shipments=[sh({id:'a1',code:'A1',status:'Delivered',dispatch_date:prevM,commission:5000}),sh({id:'a2',code:'A2',status:'Cancelled',dispatch_date:today,commission:800}),sh({id:'a3',code:'A3',status:'Booked',dispatch_date:today,commission:1000})]
 dd.payments=[{id:'q1',shipment_id:'a1',kind:'commission',amount:2000,paid_at:nowIso,mode:'UPI',voided:false},
  ...(withCancelled?[{id:'q2',shipment_id:'a2',kind:'commission',amount:500,paid_at:nowIso,mode:'Cash',voided:false}]:[]),
  {id:'q3',shipment_id:'a1',kind:'commission',amount:700,paid_at:prevM+'T10:00:00Z',mode:'Cash',voided:false},
  {id:'q4',shipment_id:'a3',kind:'commission',amount:900,paid_at:nowIso,mode:'Cash',voided:true,void_reason:'typed wrong'},
  {id:'q5',shipment_id:'a3',kind:'receipt',amount:300,paid_at:nowIso,mode:'Cash',voided:false}]
 return dd}
{const dd=comData(true),S=enrich(dd),before=JSON.stringify(dd.payments),c=commissionIn(dd,S,mon+'-01',mon+'-31')
 as(c.all===2500&&c.cancelled===500&&c.rows.length===2,'F2: this month = 2000 (shipment from last month) + 500 (cancelled shipment); voided, other-month and non-commission payments are left out')
 const dash=renderToString(<Dash d={dd} S={S} go={go}/>),led=renderToString(<Com d={dd} S={S}/>)
 as(statOf(dash,'Commission Received (This Month)')==='₹2,500','F2: Dashboard "Commission Received" = ₹2,500 (payment-date basis)')
 as(statOf(led,'Received (payment date)')==='₹2,500','F2: Commission Ledger "Received" = ₹2,500 (same figure as the Dashboard)')
 as(strip(dash).includes('Includes ₹500 on cancelled shipments')&&strip(led).includes('Includes ₹500 on cancelled shipments'),'F2: both screens label the ₹500 that belongs to cancelled shipments')
 as(strip(led).includes('Cancelled shipment')&&strip(led).includes('A2')&&strip(led).includes('A1'),'F2: Ledger lists each received payment and tags the cancelled shipment one')
 as(!strip(led).includes('₹900')&&!strip(led).includes('₹700')&&!strip(led).includes('₹300'),'F2: voided, other-month and receipt payments are not listed in the Ledger')
 as(statOf(led,'Earned (dispatch date)')==='₹1,000'&&statOf(dash,'Commission Earned (This Month)')==='₹1,000','F2: "Earned" is unchanged (dispatch-date basis, Cancelled shipments not counted)')
 as(JSON.stringify(dd.payments)===before,'F2: payment records are not altered by reporting')
 const dd2=comData(false),S2=enrich(dd2)
 as(statOf(renderToString(<Dash d={dd2} S={S2} go={go}/>),'Commission Received (This Month)')==='₹2,000'&&statOf(renderToString(<Com d={dd2} S={S2}/>),'Received (payment date)')==='₹2,000','F2: with no cancelled-shipment commission both screens show ₹2,000 and agree')
 as(!strip(renderToString(<Com d={dd2} S={S2}/>)).includes('on cancelled shipments'),'F2: no cancelled label is shown when there is nothing to label')
 const fx:any=mk();fx.payments=[{id:'f1',shipment_id:'s1',kind:'commission',amount:100,paid_at:'2026-10-02T19:00:00Z',voided:false}] // 3 Oct 00:30 India time
 as(commissionIn(fx,enrich(fx),'2026-10-03','2026-10-03').all===100&&commissionIn(fx,enrich(fx),'2026-10-02','2026-10-02').all===0,'F2: date range uses India date (payment at 00:30 IST on 3 Oct counts on 3 Oct, not 2 Oct)')
 as((app.match(/commissionIn\(/g)||[]).length>=3,'F2: Dashboard and Ledger both use the one shared commissionIn()')}

// ---- F3: cancelled shipments with saved payments: read-only warning, no new payments, history untouched
const ledgerSrc=readFileSync('src/Ledger.jsx','utf8')
const cancelledData=(pay:any[])=>{const dd:any=mk();dd.payments=pay;return dd}
const detail=(dd:any,id:string)=>strip(renderToString(<Pages r="ship" go={go} P={{d:dd,S:enrich(dd),go,load,sel:id,user:{email:'t@x.test'}}}/>))
const pay3=[{id:'k1',shipment_id:'s2',kind:'receipt',amount:4000,paid_at:nowIso,mode:'UPI',reference:'KEEP1',voided:false},
 {id:'k2',shipment_id:'s2',kind:'driver',amount:3000,paid_at:nowIso,mode:'Cash',reference:'KEEP2',voided:false},
 {id:'k3',shipment_id:'s2',kind:'commission',amount:300,paid_at:nowIso,mode:'Cash',voided:false},
 {id:'k4',shipment_id:'s2',kind:'receipt',amount:999,paid_at:nowIso,mode:'Cash',voided:true,void_reason:'typed wrong'}]
{const dd=cancelledData(pay3),before=JSON.stringify(dd.payments),h=detail(dd,'s2')
 as(h.includes('Cancelled shipment with saved payments.')&&h.includes('Received from company ₹4,000')&&h.includes('Paid to driver ₹3,000')&&h.includes('Commission received ₹300'),'F3: cancelled shipment with payments shows a warning with company received, driver paid (and commission)')
 as(h.includes('kept in the records and may need review'),'F3: the warning says the payments are retained and may need review')
 as(!/refund/i.test(h),'F3: no refund is assumed or mentioned')
 as(!h.includes('Add Payment')&&h.includes('Payments cannot be added to a cancelled shipment.'),'F3: the Add Payment form is hidden on a cancelled shipment')
 as(h.includes('KEEP1')&&h.includes('KEEP2')&&h.includes('typed wrong'),'F3: existing payments (and the already-cancelled one with its reason) are still shown in the history')
 as(JSON.stringify(dd.payments)===before,'F3: payment records are not altered')
 const ph=strip(renderToString(<Pages r="hist" go={go} P={{d:dd,S:enrich(dd),go,load,sel:null,user:{email:'t@x.test'}}}/>))
 as(ph.includes('KEEP1')&&ph.includes('KEEP2')&&ph.includes('₹4,000'),'F3: Payment History still lists payments on cancelled shipments')
 const cd:any=cancelledData([{id:'k9',shipment_id:'s2',kind:'receipt',amount:4000,paid_at:nowIso,mode:'Cash',voided:false}])
 as(statOf(renderToString(<Dash d={cd} S={enrich(cd)} go={go}/>),'Received Today')==='₹4,000','F3: cash "Received Today" still counts money received on a cancelled shipment (history stays accurate)')}
{const h=detail(cancelledData([]),'s2')
 as(!h.includes('Cancelled shipment with saved payments.')&&!h.includes('Add Payment'),'F3: cancelled shipment with no payments: no warning, and still no Add Payment form')
 const hv=detail(cancelledData([pay3[3]]),'s2')
 as(!hv.includes('Cancelled shipment with saved payments.'),'F3: only cancelled (voided) payments do not trigger the warning')
 const hn=detail(cancelledData(pay3),'s1')
 as(hn.includes('Add Payment')&&!hn.includes('Cancelled shipment with saved payments.'),'F3: a normal (not cancelled) shipment still has the Add Payment form and no warning')}
as(!/\.delete\(/.test(app+ledgerSrc),'F3: the app code has no delete call on any record')
console.log(n+' regression checks passed')