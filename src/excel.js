
import ExcelJS from 'exceljs'
import {enrich,r2,ist,snapshot} from './db.js'

const M='"₹"#,##0.00',D='dd-mmm-yyyy',DT='dd-mmm-yyyy hh:mm'
const dd=s=>s?new Date(s):null
const dt=s=>s?new Date(Date.parse(s)+19800000):null
const colL=n=>String.fromCharCode(64+n)

// Create a worksheet with a styled header, filters, optional totals and date-range metadata.
function sheet(wb,name,cols,rows,top,totals=[],label='TOTAL'){
 const w=wb.addWorksheet(name)
 top.forEach(t=>w.addRow(t))
 const h=w.addRow(cols.map(c=>c[0]))
 h.font={bold:true,color:{argb:'FFFFFFFF'}}
 h.alignment={wrapText:true,vertical:'middle'}
 h.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF12372A'}})
 cols.forEach((c,i)=>{
  w.getColumn(i+1).width=c[1]
  if(c[2])w.getColumn(i+1).numFmt=c[2]
 })
 rows.forEach(r=>w.addRow(r))
 const hr=top.length+1,a=hr+1,z=hr+rows.length
 w.views=[{state:'frozen',ySplit:hr}]
 w.autoFilter={from:{row:hr,column:1},to:{row:hr,column:cols.length}}
 top.forEach((_,i)=>w.getRow(i+1).eachCell(c=>c.numFmt='@'))
 if(totals.length){
  w.addRow([])
  const t=w.addRow([])
  t.getCell(1).value=label
  t.font={bold:true}
  for(const x of totals){
   const L=colL(x.col)
   let v=0
   rows.forEach(r=>{
    if(!x.ifCol||r[x.ifCol-1]===x.ifVal)v+=+r[x.col-1]||0
   })
   v=r2(v)
   t.getCell(x.col).value=!rows.length?0:x.ifCol
    ?{formula:`SUMIF(${colL(x.ifCol)}${a}:${colL(x.ifCol)}${z},"${x.ifVal}",${L}${a}:${L}${z})`,result:v}
    :{formula:`SUM(${L}${a}:${L}${z})`,result:v}
   t.getCell(x.col).numFmt=M
  }
 }
 return w
}

export function buildWorkbook(d,from,to,now=new Date()){
 const ins=x=>(!from||x>=from)&&(!to||x<=to)
 const all=enrich(d)
 const byId=Object.fromEntries(all.map(s=>[s.id,s]))
 const S=all.filter(s=>ins(s.dispatch_date))
 const live=S.filter(s=>s.status!=='Cancelled')
 const P=k=>d.payments
  .filter(p=>p.kind===k&&ins(ist(p.paid_at)))
  .sort((a,b)=>a.paid_at.localeCompare(b.paid_at))
 const top=[
  ['Exported on',now.toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' (India time)'],
  ['Date range',(from||'Beginning')+' to '+(to||'Today')],
  []
 ]
 const wb=new ExcelJS.Workbook()
 wb.creator='BTS Transport Desk'
 const status=(p,x)=>p<=0?'Unpaid':p+0.004>=x?'Paid':'Partially Paid'

 sheet(wb,'Shipment Register',[
  ['Shipment ID',16],['Dispatch Date',13,D],['Type',16],['Truck',14],
  ['Driver',18],['Company',22],['From',16],['To',16],['Goods',20],
  ['Status',12],['Company Freight',16,M],['Extra Charges',14,M],
  ['Deductions',14,M],['Amount Due from Company',18,M],['Received',14,M],
  ['Balance to Receive',16,M],['Driver Freight',15,M],['Paid to Driver',14,M],
  ['Balance to Pay',14,M],['Commission',14,M],['Company Payment',15],
  ['Driver Payment',15]
 ],
 S.map(s=>[
  s.code,dd(s.dispatch_date),s.service,s.truck_no,s.dr?.name,s.co?.name,
  s.origin,s.destination,s.goods,s.status,+s.customer_freight,
  +s.extra_charges,+s.deductions,s.due,s.rec,s.recBal,
  +s.driver_freight,s.paid,s.payBal,+s.commission,
  status(s.rec,s.due),status(s.paid,+s.driver_freight)
 ]),top,[11,12,13,14,15,16,17,18,19,20].map(col=>({col})))

 const pay=(name,k,who)=>sheet(wb,name,[
  ['Date and Time (India)',20,DT],['Shipment ID',16],['Truck',14],
  [who,22],['Amount',14,M],['Mode',14],['Reference / UTR',20],
  ['Notes',24],['Cancelled',10],['Cancel Reason',24]
 ],
 P(k).map(p=>{
  const s=byId[p.shipment_id]
  return[
   dt(p.paid_at),s?s.code:'Unknown shipment',s?.truck_no,
   k==='driver'?s?.dr?.name:s?.co?.name,+p.amount,p.mode,p.reference,
   p.notes,p.voided?'Yes':'No',p.void_reason
  ]
 }),top,[{col:5,ifCol:9,ifVal:'No'}],'TOTAL (cancelled payments not counted)')

 pay('Company Payments Received','receipt','Company')
 pay('Driver Payments Made','driver','Driver')

 // Commission worksheet: earned uses dispatch date; received uses payment date.
 // These are separate totals and must not be combined.
 {
  const w=wb.addWorksheet('Commission')
  top.forEach(t=>w.addRow(t))

  const section=label=>{
   const r=w.addRow([label])
   r.font={bold:true,size:12,color:{argb:'FF12372A'}}
   return r.number
  }
  const header=labels=>{
   const h=w.addRow(labels)
   h.font={bold:true,color:{argb:'FFFFFFFF'}}
   h.alignment={wrapText:true,vertical:'middle'}
   h.eachCell(c=>c.fill={
    type:'pattern',pattern:'solid',fgColor:{argb:'FF12372A'}
   })
   return h.number
  }
  const total=(rowStart,rowEnd,col,amount,label='TOTAL')=>{
   const r=w.addRow([])
   r.getCell(1).value=label
   r.font={bold:true}
   const L=colL(col),v=r2(amount)
   r.getCell(col).value=rowEnd>=rowStart
    ?{formula:`SUM(${L}${rowStart}:${L}${rowEnd})`,result:v}
    :0
   r.getCell(col).numFmt=M
   return r.number
  }

  // Section 1: Commission earned by shipment dispatch date.
  section('COMMISSION EARNED — DISPATCH DATE')
  header(['Shipment ID','Truck','Company','Commission Earned','Earned Date'])
  ;[16,14,22,19,16].forEach((width,i)=>w.getColumn(i+1).width=width)
  w.getColumn(4).numFmt=M
  w.getColumn(5).numFmt=D

  const earned=live.map(s=>[
   s.code,s.truck_no,s.co?.name||'',+s.commission,dd(s.dispatch_date)
  ])
  const earnedStart=w.rowCount+1
  earned.forEach(r=>w.addRow(r))
  const earnedEnd=w.rowCount
  total(earnedStart,earnedEnd,4,earned.reduce((a,r)=>a+(+r[3]||0),0))

  w.addRow([])

  // Section 2: Actual commission payments by payment date.
  // Include payments attached to cancelled shipments, but mark them clearly.
  section('COMMISSION RECEIVED — PAYMENT DATE')
  const receivedHeader=header([
   'Date and Time (India)','Shipment ID','Truck','Company',
   'Commission Received','Reference / UTR','Cancelled Shipment','Notes'
  ])
  ;[20,16,14,24,19,22,20,28].forEach((width,i)=>w.getColumn(i+1).width=width)
  w.getColumn(1).numFmt=DT
  w.getColumn(5).numFmt=M

  const received=P('commission').filter(p=>!p.voided).map(p=>{
   const s=byId[p.shipment_id]
   return[
    dt(p.paid_at),s?.code||'Unknown shipment',s?.truck_no||'',
    s?.co?.name||'',+p.amount,p.reference||'',
    s?.status==='Cancelled'?'Yes':'No',p.notes||''
   ]
  })
  const receivedStart=w.rowCount+1
  received.forEach(r=>w.addRow(r))
  const receivedEnd=w.rowCount
  total(
   receivedStart,receivedEnd,5,
   received.reduce((a,r)=>a+(+r[4]||0),0),'TOTAL RECEIVED'
  )

  // Freeze the sheet and make the payment transaction section filterable.
  w.views=[{state:'frozen',ySplit:5}]
  w.autoFilter={
   from:{row:receivedHeader,column:1},
   to:{row:receivedHeader+received.length,column:8}
  }
 }

 const out=(name,who,agreed,paid,bal,rows)=>sheet(wb,name,[
  ['Shipment ID',16],[who,22],['Truck',14],['Agreed',14,M],
  ['Received / Paid',15,M],['Balance Left',14,M],['Status',14]
 ],
 rows.map(s=>[
  s.code,who==='Company'?s.co?.name:s.dr?.name,s.truck_no,
  agreed(s),paid(s),bal(s),paid(s)>0?'Partially Paid':'Unpaid'
 ]),top,[{col:4},{col:5},{col:6}])

 out('Money to Receive','Company',s=>s.due,s=>s.rec,s=>s.recBal,live.filter(s=>s.recBal>0.004))
 out('Money to Pay','Driver',s=>+s.driver_freight,s=>s.paid,s=>s.payBal,live.filter(s=>s.payBal>0.004))

 const g={}
 const add=(k,f,v)=>{
  (g[k]??={})[f]=r2((g[k][f]||0)+v)
 }
 live.forEach(s=>{
  for(const k of[s.dispatch_date,s.dispatch_date.slice(0,7)]){
   add(k,'n',1);add(k,'cf',s.due);add(k,'cm',+s.commission)
  }
 })
 for(const[kind,f]of[['receipt','r'],['driver','p'],['commission','c']]){
  P(kind).filter(p=>!p.voided).forEach(p=>{
   const day=ist(p.paid_at)
   for(const k of[day,day.slice(0,7)])add(k,f,+p.amount)
  })
 }
 sheet(wb,'Daily and Monthly Summary',[
  ['Period',14],['Kind',10],['Shipments',11],
  ['Amount Due from Companies',20,M],['Commission Earned',17,M],
  ['Money Received',15,M],['Paid to Drivers',15,M],
  ['Commission Received',18,M]
 ],
 Object.keys(g).sort().reverse().map(k=>{
  const v=g[k]
  return[k,k.length===7?'Monthly':'Daily',v.n||0,v.cf||0,v.cm||0,v.r||0,v.p||0,v.c||0]
 }),top,[4,5,6,7,8].map(col=>({col,ifCol:2,ifVal:'Daily'})),'TOTAL (all days)')

 sheet(wb,'Companies and Drivers',[
  ['Type',10],['Name',24],['Phone / Contacts',44],['Truck',14],
  ['Email',24],['Address',30],['Notes',30]
 ],
 [
  ...d.companies.map(c=>[
   'Company',c.name,
   (c.contacts||[]).map(x=>`${x.role||'Contact'}: ${x.name||''} ${x.phone||''}`.trim()).join('; '),
   '',c.email,c.address,c.notes
  ]),
  ...d.drivers.map(c=>[
   'Driver',c.name,c.phone,c.truck_no,'',c.address,c.notes
  ])
 ],top)

 return wb
}

// Fetch the latest saved records, then build the workbook.
export async function makeXlsx(client,from,to){
 if(from&&to&&from>to)throw new Error('The start date is after the end date.')
 const d=await snapshot(client)
 const wb=buildWorkbook(d,from,to)
 return wb.xlsx.writeBuffer()
}

export async function downloadXlsx(client,from,to){
 const buf=await makeXlsx(client,from,to)
 const a=document.createElement('a')
 a.href=URL.createObjectURL(new Blob([buf],{
  type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
 }))
 a.download='BTS-Transport-Desk-'+ist(new Date())+'.xlsx'
 document.body.appendChild(a)
 a.click()
 a.remove()
 setTimeout(()=>URL.revokeObjectURL(a.href),60000)
}
