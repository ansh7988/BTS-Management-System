-- Run AFTER 001_init.sql. Adds: approved-staff list, safe money rules, edit-conflict timestamps.

-- 1. Only approved staff can use the data (even if sign-up is ever switched on by mistake).
create table staff(user_id uuid primary key references auth.users(id) on delete cascade, added_at timestamptz default now());
alter table staff enable row level security;
create function is_staff() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from staff where user_id=auth.uid()) $$;
revoke all on function is_staff() from public,anon; grant execute on function is_staff() to authenticated;
create policy own_row on staff for select to authenticated using(user_id=auth.uid());

drop policy p on companies;drop policy p on drivers;drop policy p on shipments;
drop policy ps on payments;drop policy pi on payments;drop policy pu on payments;drop policy al on audit_log;
create policy p on companies for all to authenticated using(is_staff()) with check(is_staff());
create policy p on drivers for all to authenticated using(is_staff()) with check(is_staff());
create policy p on shipments for all to authenticated using(is_staff()) with check(is_staff());
create policy ps on payments for select to authenticated using(is_staff());
create policy pi on payments for insert to authenticated with check(is_staff());
create policy pu on payments for update to authenticated using(is_staff()) with check(is_staff());
create policy al on audit_log for select to authenticated using(is_staff());
-- No delete policy exists for payments or audit_log, so they can never be deleted from the app.
revoke delete on payments,audit_log from authenticated;
revoke update,delete on audit_log from authenticated;

-- 2. Edit-conflict timestamps.
alter table companies add column updated_at timestamptz not null default now();
alter table drivers add column updated_at timestamptz not null default now();
alter table shipments add column updated_at timestamptz not null default now();
create function touch() returns trigger language plpgsql as $$ begin new.updated_at:=now();return new;end $$;
create trigger t1 before update on companies for each row execute function touch();
create trigger t2 before update on drivers for each row execute function touch();
create trigger t3 before update on shipments for each row execute function touch();

-- 3. Money rules enforced in the database (the app cannot bypass them).
create function agreed_amount(s shipments,k text) returns numeric language sql immutable as
$$ select case k when 'receipt' then s.customer_freight+s.extra_charges-s.deductions when 'driver' then s.driver_freight else s.commission end $$;

create function check_payment_insert() returns trigger language plpgsql as $$
declare s shipments;done numeric;
begin
 if new.voided then   -- only used when restoring a backup: a cancelled row is never counted
  if coalesce(trim(new.void_reason),'')='' then raise exception 'BTS: a cancelled payment needs a reason.'; end if; return new; end if;
 select * into s from shipments where id=new.shipment_id for update;   -- lock: two phones cannot overpay together
 select coalesce(sum(amount),0) into done from payments where shipment_id=new.shipment_id and kind=new.kind and not voided;
 if done+new.amount>agreed_amount(s,new.kind)+0.004 then
  raise exception 'BTS: this is more than the balance left (%).',round(agreed_amount(s,new.kind)-done,2);end if;
 return new;end $$;
create trigger pay_ins before insert on payments for each row execute function check_payment_insert();

create function check_payment_update() returns trigger language plpgsql as $$
begin
 if (new.shipment_id,new.kind,new.amount,new.paid_at,new.mode,new.reference,new.notes,new.created_by,new.created_at)
    is distinct from (old.shipment_id,old.kind,old.amount,old.paid_at,old.mode,old.reference,old.notes,old.created_by,old.created_at)
 then raise exception 'BTS: a saved payment cannot be changed. Cancel it and add a new one.'; end if;
 if old.voided and not new.voided then raise exception 'BTS: a cancelled payment cannot be brought back. Add a new payment.'; end if;
 if new.voided and coalesce(trim(new.void_reason),'')='' then raise exception 'BTS: please give a reason for cancelling.'; end if;
 return new;end $$;
create trigger pay_upd before update on payments for each row execute function check_payment_update();

create function check_shipment_update() returns trigger language plpgsql as $$
declare k text;done numeric;
begin
 foreach k in array array['receipt','driver','commission'] loop
  select coalesce(sum(amount),0) into done from payments where shipment_id=new.id and kind=k and not voided;
  if agreed_amount(new,k)+0.004<done then
   raise exception 'BTS: the new % amount is lower than the % already saved. Cancel the wrong payment first.',
    case k when 'receipt' then 'company' when 'driver' then 'driver' else 'commission' end,round(done,2);end if;
 end loop;
 return new;end $$;
create trigger ship_upd before update on shipments for each row execute function check_shipment_update();
