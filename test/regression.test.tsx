// Regression tests for F1 (Expected Delivery), F4 (Today's Shipments) and S4 (status update). FAKE data only, no network.
import {renderToString} from 'react-dom/server'
import {readFileSync} from 'fs'
import {Dash,changeStatus} from '../src/App.jsx'
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
console.log(n+' regression checks passed')