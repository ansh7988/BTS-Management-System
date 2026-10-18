-- BTS Transport Desk schema. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table companies(id uuid primary key default gen_random_uuid(),name text not null,address text,email text,contacts jsonb not null default '[]',notes text,created_at timestamptz not null default now());
create unique index companies_name_uq on companies(lower(name));
create table drivers(id uuid primary key default gen_random_uuid(),name text not null,phone text,truck_no text,address text,notes text,created_at timestamptz not null default now());
create sequence shipment_seq;
create table shipments(id uuid primary key default gen_random_uuid(),
 code text unique not null default 'BTS-'||to_char(now(),'YYMM')||'-'||lpad(nextval('shipment_seq')::text,4,'0'),
 dispatch_date date not null default current_date,
 service text not null default 'FTL' check(service in('FTL','PTL','Industrial Goods Transport')),
 truck_no text not null,truck_type text,
 driver_id uuid references drivers(id),company_id uuid references companies(id),
 contact_name text,contact_phone text,origin text not null,destination text not null,goods text,
 weight numeric,unit text,expected_date date,
 status text not null default 'Booked' check(status in('Booked','Dispatched','In Transit','Delivered','Cancelled')),
 customer_freight numeric(12,2) not null default 0 check(customer_freight>=0),
 driver_freight numeric(12,2) not null default 0 check(driver_freight>=0),
 commission numeric(12,2) not null default 0 check(commission>=0),
 extra_charges numeric(12,2) not null default 0,deductions numeric(12,2) not null default 0,notes text,
 created_at timestamptz not null default now());
-- Every payment is its own row. Rows are never deleted; mistakes are cancelled (voided) with a reason.
create table payments(id uuid primary key default gen_random_uuid(),
 shipment_id uuid not null references shipments(id) on delete restrict,
 kind text not null check(kind in('receipt','driver','commission')),
 amount numeric(12,2) not null check(amount>0),
 paid_at timestamptz not null default now(),
 mode text not null default 'Cash' check(mode in('Cash','UPI','Bank Transfer','Cheque','Other')),
 reference text,notes text,voided boolean not null default false,void_reason text,
 created_by uuid default auth.uid(),created_at timestamptz not null default now());
create table audit_log(id bigserial primary key,at timestamptz default now(),by uuid default auth.uid(),tbl text,op text,old_row jsonb,new_row jsonb);
create function audit() returns trigger language plpgsql security definer as $$
begin insert into audit_log(tbl,op,old_row,new_row) values(tg_table_name,tg_op,case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);return null;end $$;
create trigger a1 after insert or update or delete on shipments for each row execute function audit();
create trigger a2 after insert or update or delete on payments for each row execute function audit();
create trigger a3 after update or delete on companies for each row execute function audit();
create trigger a4 after update or delete on drivers for each row execute function audit();
-- Security: only signed-in users. No public access. Payments cannot be deleted.
alter table companies enable row level security;alter table drivers enable row level security;
alter table shipments enable row level security;alter table payments enable row level security;alter table audit_log enable row level security;
create policy p on companies for all to authenticated using(true) with check(true);
create policy p on drivers for all to authenticated using(true) with check(true);
create policy p on shipments for all to authenticated using(true) with check(true);
create policy ps on payments for select to authenticated using(true);
create policy pi on payments for insert to authenticated with check(true);
create policy pu on payments for update to authenticated using(true) with check(true);
create policy al on audit_log for select to authenticated using(true);
