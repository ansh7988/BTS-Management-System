# BTS Transport Desk

## Run
```
npm install
cp .env.example .env      # then fill in the two values
npm run dev               # open the Network address on your phone (same Wi-Fi)
npm test                  # 98 automatic checks, fake test data only
npm run build             # production files in dist/
```

## Set up Supabase (once)
1. Create a Supabase project. Copy **Project URL** and the **anon public key** into `.env` (never the service-role key).
2. SQL Editor: run `supabase/migrations/001_init.sql`, then `002_security_and_rules.sql`.
3. Authentication -> Providers -> Email: turn **off** "Allow new users to sign up". Authentication -> Users -> Add user (email + password) for the owner.
4. Approve the owner in the SQL Editor (without this the app shows "Your account is not approved yet"):
   `insert into staff(user_id) select id from auth.users where email='OWNER-EMAIL';`
5. Deploy: upload the project to Vercel, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.

## Backup and restore
- Weekly: Settings -> Download Backup (JSON), and Reports -> Download Excel. Save both to Google Drive.
- Also in Supabase: check Database -> Backups (daily backups depend on your plan; confirm yours).
- Restore into an empty project: run both migrations, add the user, then
  `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/restore.mjs BTS-backup-DATE.json`
  and finally, in the SQL Editor:
  `select setval('shipment_seq',(select coalesce(max(split_part(code,'-',3)::int),0)+1 from shipments),false);`

## Replace the intro
See `INTRO_REPLACE.md`.

## Rules built in
Payments are never deleted or edited; a wrong payment is cancelled with a reason and stays in history. The database refuses over-payments, refuses lowering an amount below what is already paid, and refuses changes made from an old screen.
Amount due from company = company freight + extra charges - deductions.
