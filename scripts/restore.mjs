// Restores a backup file made by Settings > Download Backup. Run on a computer, never in the app.
// Usage:  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/restore.mjs BTS-backup-2026-10-18.json
// The service-role key stays on your computer. It must never be put in the app or in a .env that is uploaded.
import {createClient} from '@supabase/supabase-js';import {readFileSync} from 'fs'
const {SUPABASE_URL:u,SUPABASE_SERVICE_ROLE_KEY:k}=process.env,f=process.argv[2]
if(!u||!k||!f){console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or backup file name.');process.exit(1)}
const b=JSON.parse(readFileSync(f,'utf8')),c=createClient(u,k)
for(const t of['companies','drivers','shipments','payments']){const rows=b[t]||[];
 for(let i=0;i<rows.length;i+=200){const{error}=await c.from(t).upsert(rows.slice(i,i+200),{onConflict:'id',ignoreDuplicates:true});if(error){console.error('Stopped at',t,error.message);process.exit(1)}}
 console.log(t,rows.length,'rows checked (existing rows are left unchanged)')}
console.log('Done. Now run the setval line from the README in the SQL editor.')
