import {enrich,r2,st,tot} from '../src/db.js'
import {mk} from './fixtures.js'
let n=0;const as=(c:boolean,m:string)=>{if(!c){console.error('FAIL',m);process.exit(1)}n++;console.log('ok',m)}
as(r2(0.1+0.2)===0.3,'rounding to paise (0.1+0.2)')
const d=mk(),[s1,s2]=enrich(d as any)
as(s1.due===50500,'amount due = freight + extra - deductions = 50500')
as(s1.rec===30000.5,'received = sum of saved receipts, cancelled one ignored')
as(s1.recBal===20499.5,'balance to receive 20499.5')
as(s1.paid===15000&&s1.payBal===30000,'driver paid 15000, balance 30000')
as(s1.cr===2000&&s1.comBal===3000,'commission received 2000 kept apart from freight receipts; still due 3000')
as(tot(d.payments as any,'s1','commission')===2000,'commission payments never mix with company receipts')
as(st(0,100)==='Unpaid'&&st(40,100)==='Partially Paid'&&st(100,100)==='Paid'&&st(99.999,100)==='Paid','status: Unpaid / Partially Paid / Paid')
as(s2.rec===0&&s2.recBal===9000,'shipment with no payments is Unpaid with full balance')
console.log(n+' calculation checks passed')
