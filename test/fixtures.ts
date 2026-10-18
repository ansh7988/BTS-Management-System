// TEST FIXTURES ONLY. Clearly fake. Never sent to the real database.
export const mk=()=>({
 companies:[{id:'c1',name:'TEST COMPANY',email:'t@example.test',contacts:[{role:'Accounts',name:'Test A',phone:'0000000001'},{role:'Owner',name:'Test B',phone:'0000000002'}],created_at:'2026-10-01T00:00:00Z',updated_at:'x'}],
 drivers:[{id:'d1',name:'TEST DRIVER',phone:'1111111111',truck_no:'TEST1',created_at:'2026-10-01T00:00:00Z',updated_at:'x'}],
 shipments:[{id:'s1',code:'TEST-0001',dispatch_date:'2026-10-01',service:'FTL',truck_no:'TEST1',company_id:'c1',driver_id:'d1',origin:'A',destination:'B',status:'Delivered',customer_freight:50000,driver_freight:45000,commission:5000,extra_charges:1000,deductions:500,created_at:'2026-10-01T00:00:00Z',updated_at:'x'},
  {id:'s2',code:'TEST-0002',dispatch_date:'2026-10-03',service:'PTL',truck_no:'TEST2',company_id:'c1',driver_id:'d1',origin:'C',destination:'D',status:'Cancelled',customer_freight:9000,driver_freight:8000,commission:1000,extra_charges:0,deductions:0,created_at:'2026-10-03T00:00:00Z',updated_at:'x'}],
 payments:[
  {id:'p1',shipment_id:'s1',kind:'receipt',amount:20000,paid_at:'2026-10-02T10:00:00Z',mode:'UPI',reference:'UTR1',voided:false},
  {id:'p2',shipment_id:'s1',kind:'receipt',amount:10000.5,paid_at:'2026-10-05T10:00:00Z',mode:'Cash',voided:false},
  {id:'p3',shipment_id:'s1',kind:'driver',amount:15000,paid_at:'2026-10-02T19:00:00Z',mode:'Cash',voided:false},   // 3 Oct 00:30 India time
  {id:'p4',shipment_id:'s1',kind:'receipt',amount:999,paid_at:'2026-10-06T10:00:00Z',mode:'Cash',voided:true,void_reason:'Typed wrong'},
  {id:'p5',shipment_id:'s1',kind:'commission',amount:2000,paid_at:'2026-10-07T10:00:00Z',mode:'UPI',reference:'CR1',voided:false},
  {id:'p6',shipment_id:'zzz',kind:'receipt',amount:5,paid_at:'2026-10-07T10:00:00Z',mode:'Cash',voided:false}]})
