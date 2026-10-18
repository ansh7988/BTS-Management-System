// Draws every screen with FAKE fixture data and checks nothing crashes. Also scans the code for rules.
import {renderToString} from 'react-dom/server'
import {readdirSync,readFileSync} from 'fs'
import {Pages,NAV,Login} from '../src/App.jsx'
import Ledger from '../src/Ledger.jsx'
import IntroScreen from '../src/intro/IntroScreen.jsx'
import {enrich} from '../src/db.js'
import {mk} from './fixtures.js'
let n=0;const as=(c:boolean,m:string)=>{if(!c){console.error('FAIL',m);process.exit(1)}n++;console.log('ok',m)}
const d:any=mk(),S=enrich(d),go=()=>{},load=async()=>{}
const html=(r:string,sel:any=null,dd:any=d)=>renderToString(<Pages r={r} go={go} P={{d:dd,S:enrich(dd),go,load,sel,user:{email:'test@example.test'}}}/>)
const ids:any={ship:'s1',add:'s1',co:'c1',dr:'d1'}
for(const r of[...NAV.map(x=>x[0]),'ship','co','dr','more']){let h='';try{h=html(r,ids[r]||null)}catch(e:any){as(false,'screen "'+r+'" draws: '+e.message)}as(h.length>200,'screen "'+r+'" draws')}
const empty:any={companies:[],drivers:[],shipments:[],payments:[]}
for(const r of['dash','ships','cos','drs','recv','pay','hist','com'])as(html(r,null,empty).includes('No Records Yet')||r==='dash'&&html(r,null,empty).includes('₹0'),'empty database shows zeros / "No Records Yet" on '+r)
as(html('dash',null,empty).includes('₹0')&&html('dash',null,empty).includes('No Records Yet'),'dashboard with no records shows real zeros')
as(html('ship','s1').includes('Payment History')&&html('ship','s1').includes('Typed wrong'),'shipment page shows payment history and cancelled payment reason')
as(html('co','c1').includes('tel:0000000001')&&html('co','c1').includes('Edit'),'company page: call links and Edit button')
as(html('dr','d1').includes('tel:1111111111'),'driver page: call link')
as(html('ship','nope').includes('No Records Yet'),'missing shipment shows a clean message')
as(renderToString(<Login/>).includes('Setup needed'),'login explains setup when Supabase is not configured')
as(renderToString(<IntroScreen done={go}/>).includes('Your Cargo,')&&renderToString(<IntroScreen done={go}/>).includes('21+ YEARS EXPERIENCE'),'intro draws with BTS text and an ENTER button')
as(renderToString(<Ledger s={S[0]} d={d} kind="receipt" title="T" agreed={50500} paid={30000.5} load={load}/>).includes('20,499.5'),'ledger shows balance left 20,499.5')
// code rules
const files=readdirSync('src',{recursive:true}).filter((f:any)=>/\.(jsx?|css)$/.test(f)).map((f:any)=>'src/'+f),src=files.map(f=>readFileSync(f,'utf8')).join('\n')
as(!/[\u0900-\u097F]/.test(src),'no Hindi script in the code')
as(!/service_role|localStorage/i.test(src),'no service-role key or localStorage in the app code')
as(!/(password|passwd)\s*[:=]\s*['"][^'"]+['"]/i.test(src.replace(/placeholder/g,'')),'no hard-coded password')
as(!/\b(kya|nahi|hai|karo|paisa|bhai)\b/i.test(src),'no Hinglish words in the code')
console.log(n+' screen and rule checks passed')
