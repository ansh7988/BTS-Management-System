import {createClient} from '@supabase/supabase-js'
const u=import.meta.env?.VITE_SUPABASE_URL,k=import.meta.env?.VITE_SUPABASE_ANON_KEY
export const ok=!!(u&&k)
export const sb=ok?createClient(u,k):null
export const r2=n=>Math.round(((+n||0)+Number.EPSILON)*100)/100
export const inr=n=>'₹'+r2(n).toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:2})
export const ist=iso=>new Date(iso).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})
export const todayIST=()=>ist(new Date())
export const tot=(p,s,k)=>r2(p.filter(x=>x.shipment_id===s&&x.kind===k&&!x.voided).reduce((a,x)=>a+ +x.amount,0))
export const st=(paid,due)=>paid<=0?'Unpaid':paid+0.004>=due?'Paid':'Partially Paid'
export const TABLES=['companies','drivers','shipments','payments']
// Reads EVERY row (pages of 1000, stable order). Any failure throws, so nothing is silently left out.
export async function all(t,c=sb){if(!c)throw new Error('The database is not set up yet.');let o=[],i=0
for(;;){const{data,error}=await c.from(t).select('*').order('created_at').order('id').range(i,i+999);if(error)throw new Error(error.message||'Could not read '+t);if(!data)throw new Error('Could not read '+t);o=o.concat(data);if(data.length<1000)return o;i+=1000}}
export async function snapshot(c=sb){const r=await Promise.all(TABLES.map(t=>all(t,c)));return Object.fromEntries(TABLES.map((t,i)=>[t,r[i]]))}
export const enrich=d=>d.shipments.map(s=>{const due=r2(+s.customer_freight+ +s.extra_charges- +s.deductions),rec=tot(d.payments,s.id,'receipt'),paid=tot(d.payments,s.id,'driver'),cr=tot(d.payments,s.id,'commission'),df=r2(s.driver_freight),cm=r2(s.commission)
return{...s,co:d.companies.find(c=>c.id===s.company_id),dr:d.drivers.find(c=>c.id===s.driver_id),due,rec,paid,cr,recBal:r2(due-rec),payBal:r2(df-paid),comBal:r2(cm-cr)}})
