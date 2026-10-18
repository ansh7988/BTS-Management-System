
import ExcelJS from 'exceljs'
import {buildWorkbook,makeXlsx} from '../src/excel.js'
import {mk} from './fixtures.js'

let n=0
const as=(c:boolean,m:string)=>{
 if(!c){console.error('FAIL',m);process.exit(1)}
 n++
 console.log('ok',m)
}

const NAMES=[
 'Shipment Register','Company Payments Received','Driver Payments Made',
 'Commission','Money to Receive','Money to Pay',
 'Daily and Monthly Summary','Companies and Drivers'
]

const fake=(db:any,fail?:string,nullData?:string)=>({
 from:(t:string)=>({
  select:()=>({
   order:()=>({
    order:()=>({
     range:async(a:number,b:number)=>
      fail===t
       ?{data:null,error:{message:'boom '+t}}
       :nullData===t
        ?{data:null,error:null}
        :{data:db[t].slice(a,b+1),error:null}
    })
   })
  })
 })
}) as any

const load=async(wbb:ExcelJS.Workbook)=>{
 const w=new ExcelJS.Workbook()
 await w.xlsx.load(await wbb.xlsx.writeBuffer() as any)
 return w
}

const rows=(w:ExcelJS.Workbook,name:string)=>{
 const o:any[]=[]
 w.getWorksheet(name)!.eachRow((r,i)=>{
  if(i>3)o.push(r.values)
 })
 return o
}

const num=(c:any)=>typeof c==='object'&&c&&'result' in c?c.result:c

const w=await load(buildWorkbook(
 mk() as any,undefined,undefined,new Date('2026-10-18T05:00:00Z')
))

as(
 JSON.stringify(w.worksheets.map(x=>x.name))===JSON.stringify(NAMES),
 'exactly the 8 sheets, in order'
)

for(const x of w.worksheets){
 as(x.views[0]?.state==='frozen'&&!!x.autoFilter,x.name+': frozen header + filter')
 as(
  x.getRow(1).getCell(1).value==='Exported on'&&
  String(x.getRow(2).getCell(2).value).includes('Beginning'),
  x.name+': export time and date range shown'
 )
}

// Shipment register
const reg=rows(w,'Shipment Register')
as(reg[1][1]==='TEST-0001'&&reg[2][1]==='TEST-0002',
 'register lists every shipment, including cancelled')
as(
 reg[1][14]===50500&&reg[1][15]===30000.5&&reg[1][16]===20499.5,
 'register: due 50500, received 30000.5, balance 20499.5'
)
as(
 reg[1][18]===15000&&reg[1][19]===30000&&reg[1][20]===5000,
 'register: driver paid 15000, balance 30000, commission 5000'
)
as(
 reg[1][21]==='Partially Paid'&&reg[2][21]==='Unpaid',
 'register: payment status words'
)
const regTot=reg[reg.length-1]
as(regTot[1]==='TOTAL'&&num(regTot[14])===59500,
 'register total of amount due = 59500')

// Company receipts: preserve each transaction.
const cp=rows(w,'Company Payments Received')
as(
 cp.slice(1,5).length===4&&
 cp.slice(1,5).map(r=>r[5]).join()==='20000,10000.5,999,5',
 'every receipt has its own row'
)
as(
 cp[1][6]==='UPI'&&cp[1][7]==='UTR1'&&cp[1][2]==='TEST-0001',
 'receipt row has shipment, mode and UTR'
)
as(
 cp[3][9]==='Yes'&&cp[3][10]==='Typed wrong',
 'cancelled receipt retained with its reason'
)
as(cp[4][2]==='Unknown shipment',
 'payment with missing shipment is shown, not dropped')
as(
 num(cp[cp.length-1][5])===30005.5,
 'company receipt total excludes cancelled/voided payments'
)
as(
 cp[1][1] instanceof Date&&
 (cp[1][1] as Date).getUTCHours()===15&&
 (cp[1][1] as Date).getUTCMinutes()===30,
 'payment time is displayed in India time'
)
as(
 w.getWorksheet('Company Payments Received')!.getColumn(5).numFmt.includes('₹'),
 'company payments use INR currency formatting'
)
as(
 w.worksheets.every(x=>x.columns.every(c=>(c.width||0)>=9)),
 'all columns have readable widths'
)

const dp=rows(w,'Driver Payments Made')
as(dp[1][5]===15000&&num(dp[dp.length-1][5])===15000,
 'driver payment row and total')

// Commission sheet: earned and received use separate date bases.
const cm=rows(w,'Commission')
const eh=cm.findIndex(r=>r[1]==='Shipment ID'&&r[4]==='Commission Earned')
const rh=cm.findIndex(r=>r[1]==='Date and Time (India)'&&r[5]==='Commission Received')
const earnedRow=cm[eh+1]
const earnedTotal=cm.find(r=>r[1]==='TOTAL'&&r[4]&&typeof r[4]==='object')
const receivedRow=cm[rh+1]
const receivedTotal=cm.find(r=>r[1]==='TOTAL RECEIVED')

as(
 eh>=0&&earnedRow[1]==='TEST-0001'&&earnedRow[4]===5000&&
 num(earnedTotal?.[4])===5000,
 'commission earned uses non-cancelled shipments in dispatch-date range'
)
as(
 rh>=0&&receivedRow[2]==='TEST-0001'&&receivedRow[5]===2000&&
 receivedRow[6]==='CR1'&&num(receivedTotal?.[5])===2000,
 'commission received lists payment date, reference and total'
)

// A payment in the selected period must be included even if the shipment
// was dispatched earlier or was later cancelled.
const cdb:any=mk()
cdb.shipments[1].dispatch_date='2026-09-01'
cdb.payments.push({
 id:'p7',shipment_id:'s2',kind:'commission',amount:700,
 paid_at:'2026-10-03T10:00:00Z',mode:'UPI',
 reference:'CANCEL-CR',voided:false
})

const cw=await load(buildWorkbook(cdb,'2026-10-03','2026-10-03'))
const cr=rows(cw,'Commission')
const crh=cr.findIndex(
 r=>r[1]==='Date and Time (India)'&&r[5]==='Commission Received'
)
const crrow=cr[crh+1]
const crt=cr.find(r=>r[1]==='TOTAL RECEIVED')

as(
 !cr.some(r=>r[1]==='TEST-0002'&&r[4]===1000)&&
 crrow[2]==='TEST-0002'&&crrow[5]===700&&
 crrow[7]==='Yes'&&num(crt?.[5])===700,
 'received commission uses payment date and includes cancelled-shipment payments'
)

// Voided commission payments must not count in the received total.
const vdb:any=mk()
vdb.payments.push({
 id:'void-commission',shipment_id:'s1',kind:'commission',amount:999,
 paid_at:'2026-10-03T10:00:00Z',mode:'UPI',
 reference:'VOIDED',voided:true
})
const vw=await load(buildWorkbook(vdb))
const vr=rows(vw,'Commission')
const vrh=vr.findIndex(
 r=>r[1]==='Date and Time (India)'&&r[5]==='Commission Received'
)
const vtotal=vr.find(r=>r[1]==='TOTAL RECEIVED')
console.log('DEBUG commission rows:', vr);
console.log('DEBUG received total:', vtotal);
as(
 !vr.slice(vrh+1).some(r=>r[6]==='VOIDED')&&num(vtotal?.[5])===2000,
 'voided commission payments are excluded'
)

// Outstanding receivables and payables.
const mr=rows(w,'Money to Receive')
as(
 mr.length===3&&mr[1][6]===20499.5&&mr[1][7]==='Partially Paid',
 'outstanding receivable 20499.5; cancelled shipment excluded'
)
const mp=rows(w,'Money to Pay')
as(
 mp[1][6]===30000&&mp[1][7]==='Partially Paid',
 'outstanding driver payable 30000'
)

// Daily and monthly summary.
const sm=rows(w,'Daily and Monthly Summary')
const day=sm.find(r=>r[1]==='2026-10-03')
as(
 !!day&&day[2]==='Daily'&&day[7]===15000,
 'payment at India midnight is counted on the correct date'
)
const mon=sm.find(r=>r[1]==='2026-10'&&r[2]==='Monthly')
as(
 !!mon&&mon[6]===30005.5&&mon[8]===2000&&mon[5]===5000,
 'monthly summary separates money received and commission received'
)
const smt=sm[sm.length-1]
as(
 num(smt[6])===30005.5&&num(smt[7])===15000,
 'summary totals use daily rows without double counting'
)

const dir=rows(w,'Companies and Drivers')
as(
 dir.length===3&&
 String(dir[1][3]).includes('Accounts: Test A 0000000001')&&
 dir[2][2]==='TEST DRIVER',
 'directories list companies with contacts and drivers'
)

// Date filter.
const f=await load(buildWorkbook(mk() as any,'2026-10-03','2026-10-04'))
as(
 rows(f,'Shipment Register').filter(r=>r[1]&&String(r[1]).startsWith('TEST')).length===1,
 'date filter: only the shipment dispatched on 3 Oct'
)
as(
 rows(f,'Driver Payments Made')[1][5]===15000&&
 rows(f,'Company Payments Received').length===2&&
 num(rows(f,'Company Payments Received')[1][5])===0,
 'date filter works on payment dates'
)
as(
 String(f.getWorksheet('Money to Pay')!.getRow(2).getCell(2).value)
  .includes('2026-10-03 to 2026-10-04'),
 'selected date range is printed in the file'
)

// Empty database.
const e=await load(buildWorkbook({
 companies:[],drivers:[],shipments:[],payments:[]
}))
as(
 e.worksheets.length===8&&
 num(rows(e,'Shipment Register').pop()[14])===0,
 'empty database: 8 sheets and zero totals'
)

// New shipment and partial payment appear in the next export.
const db:any=mk()
const x1=await load(buildWorkbook(db))
const before=rows(x1,'Shipment Register').filter(r=>r[1]).length

db.shipments.push({
 id:'s3',code:'TEST-0003',dispatch_date:'2026-10-10',
 service:'FTL',truck_no:'TEST3',company_id:'c1',driver_id:'d1',
 origin:'E',destination:'F',status:'Booked',
 customer_freight:1000,driver_freight:900,commission:100,
 extra_charges:0,deductions:0
})
db.payments.push({
 id:'p8',shipment_id:'s3',kind:'receipt',amount:400,
 paid_at:'2026-10-11T10:00:00Z',mode:'Cash',voided:false
})

const buf=await makeXlsx(fake(db),undefined,undefined)
const x2=new ExcelJS.Workbook()
await x2.xlsx.load(buf as any)

as(
 rows(x2,'Shipment Register').filter(r=>r[1]).length===before+1&&
 rows(x2,'Company Payments Received').some(r=>r[2]==='TEST-0003'&&r[5]===400),
 'new shipment and partial payment appear in the next export'
)
as(
 rows(x2,'Money to Receive').some(r=>r[1]==='TEST-0003'&&r[6]===600),
 'new shipment outstanding balance is correct'
)
as(
 buf.byteLength>4000&&Buffer.from(buf as any).subarray(0,2).toString()==='PK',
 'output is a genuine XLSX file'
)

// Export errors: nothing should be produced if a table cannot be read.
for(const t of['companies','drivers','shipments','payments']){
 let msg=''
 try{await makeXlsx(fake(mk(),t))}catch(err:any){msg=err.message}
 as(msg.includes('boom '+t),'clear error when '+t+' cannot be read')
}

let m2=''
try{await makeXlsx(fake(mk(),undefined,'payments'))}catch(err:any){m2=err.message}
as(m2.includes('Could not read payments'),'export fails when database returns no data')

let m3=''
try{await makeXlsx(fake(mk()),'2026-10-05','2026-10-01')}catch(err:any){m3=err.message}
as(m3.includes('start date is after'),'export rejects an end date before start date')

let m4=''
try{await makeXlsx(null)}catch(err:any){m4=err.message}
as(m4.includes('not set up'),'export refuses when database is not configured')

// Ensure exports include records beyond the first 1000-row page.
const big:any=mk()
for(let i=0;i<2500;i++){
 big.shipments.push({...big.shipments[0],id:'b'+i,code:'BIG-'+i})
}
const bw=new ExcelJS.Workbook()
await bw.xlsx.load(await makeXlsx(fake(big)) as any)
as(
 rows(bw,'Shipment Register').filter(
  r=>r[1]&&String(r[1]).length>0&&r[1]!=='TOTAL'
 ).length===2503,
 'all shipments beyond the 1000-row page limit are included'
)

console.log(n+' Excel checks passed')
