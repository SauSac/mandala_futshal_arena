-- BOOKIN | Complete Supabase PostgreSQL schema
-- Phase 1: run the compatibility preflight section by itself, then wait for success.
-- Phase 2: run the complete schema section after Phase 1 has committed.
-- Intended for the BookIN Supabase project. It does not drop tables or user data.
-- Existing tables with unrelated/incompatible columns may still need a tailored migration.
-- Supabase Auth owns passwords, phone/email identities and OTP delivery.
-- Configure Phone provider/SMS, email SMTP and OTP expiry in Auth settings.
-- Do not expose service_role keys in client-side code.

-- BOOKIN | Existing-database compatibility preflight
-- IMPORTANT:
-- 1) Run ONLY this section first in Supabase SQL Editor.
-- 2) Wait for success (this commits any new enum labels).
-- 3) Then run the entire Phase 2 section below.
-- This repairs enum labels left behind by older BookIN schema attempts.
-- It does not delete user data.

do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('user_role','player'),
      ('user_role','arena_manager'),
      ('user_role','tournament_manager'),
      ('user_role','referee'),
      ('user_role','developer'),
      ('registration_status','pending'),
      ('registration_status','active'),
      ('registration_status','rejected'),
      ('registration_status','expired'),
      ('registration_status','cancelled'),
      ('payment_status','pending'),
      ('payment_status','paid'),
      ('payment_status','failed'),
      ('payment_status','refunded'),
      ('payment_status','cancelled'),
      ('payment_method','online'),
      ('payment_method','offline'),
      ('payment_method','cash'),
      ('payment_method','esewa'),
      ('payment_method','khalti'),
      ('payment_method','bank_transfer'),
      ('payment_method','other'),
      ('venue_status','draft'),
      ('venue_status','pending_approval'),
      ('venue_status','approved'),
      ('venue_status','rejected'),
      ('venue_status','suspended'),
      ('venue_status','archived'),
      ('booking_status','pending_payment'),
      ('booking_status','pending_confirmation'),
      ('booking_status','confirmed'),
      ('booking_status','completed'),
      ('booking_status','cancelled'),
      ('booking_status','rejected'),
      ('booking_status','no_show'),
      ('booking_status','expired'),
      ('tournament_status','draft'),
      ('tournament_status','pending_approval'),
      ('tournament_status','published'),
      ('tournament_status','registration_open'),
      ('tournament_status','registration_closed'),
      ('tournament_status','in_progress'),
      ('tournament_status','completed'),
      ('tournament_status','cancelled'),
      ('tournament_status','archived'),
      ('entry_status','pending'),
      ('entry_status','approved'),
      ('entry_status','rejected'),
      ('entry_status','withdrawn'),
      ('entry_status','eliminated'),
      ('entry_status','completed'),
      ('match_status','scheduled'),
      ('match_status','live'),
      ('match_status','awaiting_result'),
      ('match_status','completed'),
      ('match_status','postponed'),
      ('match_status','cancelled'),
      ('result_status','submitted'),
      ('result_status','approved'),
      ('result_status','rejected'),
      ('result_status','edited'),
      ('application_status','pending'),
      ('application_status','approved'),
      ('application_status','rejected'),
      ('application_status','withdrawn'),
      ('invoice_status','unpaid'),
      ('invoice_status','partially_paid'),
      ('invoice_status','paid'),
      ('invoice_status','overdue'),
      ('invoice_status','waived'),
      ('invoice_status','cancelled')
    ) as v(type_name, enum_value)
  loop
    if exists (
      select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = item.type_name
        and t.typtype = 'e'
    ) and not exists (
      select 1
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      join pg_enum e on e.enumtypid = t.oid
      where n.nspname = 'public'
        and t.typname = item.type_name
        and e.enumlabel = item.enum_value
    ) then
      execute format(
        'alter type public.%I add value %L',
        item.type_name,
        item.enum_value
      );
    end if;
  end loop;
end
$$;

-- ========================= PHASE 2 =========================
-- Run everything from this line onward only after Phase 1 succeeds.

begin;
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin create type public.user_role as enum
 ('player','arena_manager','tournament_manager','referee','developer');
exception when duplicate_object then null; end $$;
do $$ begin create type public.registration_status as enum
 ('pending','active','rejected','expired','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum
 ('pending','paid','failed','refunded','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_method as enum
 ('online','offline','cash','esewa','khalti','bank_transfer','other');
exception when duplicate_object then null; end $$;
do $$ begin create type public.venue_status as enum
 ('draft','pending_approval','approved','rejected','suspended','archived');
exception when duplicate_object then null; end $$;
do $$ begin create type public.booking_status as enum
 ('pending_payment','pending_confirmation','confirmed','completed','cancelled','rejected','no_show','expired');
exception when duplicate_object then null; end $$;
do $$ begin create type public.tournament_status as enum
 ('draft','pending_approval','published','registration_open','registration_closed','in_progress','completed','cancelled','archived');
exception when duplicate_object then null; end $$;
do $$ begin create type public.entry_status as enum
 ('pending','approved','rejected','withdrawn','eliminated','completed');
exception when duplicate_object then null; end $$;
do $$ begin create type public.match_status as enum
 ('scheduled','live','awaiting_result','completed','postponed','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type public.result_status as enum
 ('submitted','approved','rejected','edited');
exception when duplicate_object then null; end $$;
do $$ begin create type public.application_status as enum
 ('pending','approved','rejected','withdrawn');
exception when duplicate_object then null; end $$;
do $$ begin create type public.invoice_status as enum
 ('unpaid','partially_paid','paid','overdue','waived','cancelled');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- USER IDENTITY: auth.users remains the source of credentials and verified contacts.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 username text unique,
 avatar_url text,
 bio text,
 role public.user_role not null default 'player',
 is_suspended boolean not null default false,
 suspension_reason text,
 suspended_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (username is null or username ~ '^[A-Za-z0-9_]{3,24}$')
);

-- Compatibility for the earlier minimal BookIN profiles table.
alter table public.profiles
  add column if not exists username text,
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz;

-- Convert an older text/legacy-enum role column to the current BookIN enum.
do $$
declare role_type text;
begin
  select c.udt_name into role_type
  from information_schema.columns c
  where c.table_schema='public'
    and c.table_name='profiles'
    and c.column_name='role';

  -- Remove the legacy text CHECK constraint before converting its role column.
  alter table public.profiles drop constraint if exists profiles_role_check;

  if role_type is not null and role_type <> 'user_role' then
    alter table public.profiles
      alter column role type public.user_role
      using (
        case role::text
          when 'manager' then 'arena_manager'
          else role::text
        end
      )::public.user_role;
  end if;

  -- Map the old three-role name to BookIN's current role name.
  update public.profiles
  set role = 'arena_manager'
  where role::text = 'manager';
end
$$;

create unique index if not exists profiles_username_unique_idx
  on public.profiles(username) where username is not null;

create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,role)
 values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),''),'player')
 on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists on_auth_user_created_bookin on auth.users;
create trigger on_auth_user_created_bookin after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- CENTRAL SETTINGS: player fee defaults to Rs.40 for 30 days; Developer can change it.
create table if not exists public.platform_settings (
 id integer primary key default 1 check (id = 1),
 platform_name text not null default 'BookIN',
 currency_code char(3) not null default 'NPR',
 player_registration_fee numeric(12,2) not null default 40 check(player_registration_fee>=0),
 player_registration_days int not null default 30 check(player_registration_days>0),
 booking_min_minutes int not null default 60 check(booking_min_minutes>0),
 booking_max_advance_days int not null default 90 check(booking_max_advance_days>0),
 cancellation_cutoff_hours int not null default 12 check(cancellation_cutoff_hours>=0),
 default_manager_fee numeric(12,2) not null default 0 check(default_manager_fee>=0),
 support_email text, support_phone text,
 maintenance_mode boolean not null default false,
 updated_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Compatibility for an earlier platform_settings table using integer id.
alter table public.platform_settings
  add column if not exists platform_name text not null default 'BookIN',
  add column if not exists currency_code char(3) not null default 'NPR',
  add column if not exists player_registration_fee numeric(12,2) not null default 40,
  add column if not exists player_registration_days integer not null default 30,
  add column if not exists booking_min_minutes integer not null default 60,
  add column if not exists booking_max_advance_days integer not null default 90,
  add column if not exists cancellation_cutoff_hours integer not null default 12,
  add column if not exists default_manager_fee numeric(12,2) not null default 0,
  add column if not exists support_email text,
  add column if not exists support_phone text,
  add column if not exists maintenance_mode boolean not null default false,
  add column if not exists updated_by uuid,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

insert into public.platform_settings(id) values(1) on conflict do nothing;

-- PLAYER REGISTRATION / MEMBERSHIP
create table if not exists public.player_registrations (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.profiles(id) on delete restrict,
 amount numeric(12,2) not null check(amount>=0),
 currency_code char(3) not null default 'NPR',
 duration_days int not null check(duration_days>0),
 status public.registration_status not null default 'pending',
 payment_method public.payment_method,
 payment_reference text,
 starts_at timestamptz, expires_at timestamptz,
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz, rejection_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(expires_at is null or starts_at is null or expires_at>starts_at)
);
create index if not exists player_regs_player_idx on public.player_registrations(player_id,created_at desc);
create index if not exists player_regs_status_idx on public.player_registrations(status,expires_at);

-- ARENAS / VENUES, PITCHES AND FACILITIES
create table if not exists public.venues (
 id uuid primary key default gen_random_uuid(),
 manager_id uuid references public.profiles(id) on delete set null,
 created_by uuid references public.profiles(id) on delete set null,
 name text not null, slug text not null unique, description text,
 address_line text not null, area text, city text not null, district text, province text,
 country text not null default 'Nepal', postal_code text,
 latitude numeric(10,7), longitude numeric(10,7),
 contact_phone text, contact_email text, website_url text, cover_image_url text,
 status public.venue_status not null default 'draft',
 rejection_reason text, approved_by uuid references public.profiles(id) on delete set null,
 approved_at timestamptz,
 average_rating numeric(3,2) not null default 0 check(average_rating between 0 and 5),
 review_count int not null default 0 check(review_count>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((latitude is null and longitude is null) or
       (latitude between -90 and 90 and longitude between -180 and 180))
);
create index if not exists venues_manager_idx on public.venues(manager_id);
create index if not exists venues_city_status_idx on public.venues(city,status);

create table if not exists public.pitches (
 id uuid primary key default gen_random_uuid(),
 venue_id uuid not null references public.venues(id) on delete cascade,
 name text not null, description text, pitch_type text not null default 'futsal',
 surface_type text, length_m numeric(6,2), width_m numeric(6,2),
 player_capacity int not null default 10 check(player_capacity>0),
 is_indoor boolean not null default false, has_lighting boolean not null default true,
 hourly_rate numeric(12,2) not null check(hourly_rate>=0),
 currency_code char(3) not null default 'NPR', is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(venue_id,name)
);
create index if not exists pitches_venue_idx on public.pitches(venue_id,is_active);

create table if not exists public.amenities (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 icon text, created_at timestamptz not null default now()
);
create table if not exists public.venue_amenities (
 venue_id uuid not null references public.venues(id) on delete cascade,
 amenity_id uuid not null references public.amenities(id) on delete cascade,
 primary key(venue_id,amenity_id)
);
create table if not exists public.venue_opening_hours (
 id uuid primary key default gen_random_uuid(),
 venue_id uuid not null references public.venues(id) on delete cascade,
 day_of_week smallint not null check(day_of_week between 0 and 6),
 opens_at time, closes_at time, is_closed boolean not null default false,
 unique(venue_id,day_of_week),
 check((is_closed and opens_at is null and closes_at is null) or
       (not is_closed and opens_at is not null and closes_at is not null and opens_at<closes_at))
);
create table if not exists public.pitch_unavailability (
 id uuid primary key default gen_random_uuid(),
 pitch_id uuid not null references public.pitches(id) on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null, reason text,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(),
 check(ends_at>starts_at),
 exclude using gist(pitch_id with =,tstzrange(starts_at,ends_at,'[)') with &&)
);

-- BOOKINGS: exclusion constraint prevents overlapping active bookings for one pitch.
create table if not exists public.bookings (
 id uuid primary key default gen_random_uuid(), booking_code text not null unique,
 player_id uuid not null references public.profiles(id) on delete restrict,
 pitch_id uuid not null references public.pitches(id) on delete restrict,
 starts_at timestamptz not null, ends_at timestamptz not null,
 hourly_rate numeric(12,2) not null check(hourly_rate>=0),
 total_amount numeric(12,2) not null check(total_amount>=0),
 currency_code char(3) not null default 'NPR',
 status public.booking_status not null default 'pending_payment',
 payment_status public.payment_status not null default 'pending',
 special_request text, cancellation_reason text,
 cancelled_by uuid references public.profiles(id) on delete set null,
 cancelled_at timestamptz,
 confirmed_by uuid references public.profiles(id) on delete set null,
 confirmed_at timestamptz, completed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(ends_at>starts_at),
 exclude using gist(pitch_id with =,tstzrange(starts_at,ends_at,'[)') with &&)
 where(status in ('pending_payment','pending_confirmation','confirmed'))
);
create index if not exists bookings_player_idx on public.bookings(player_id,starts_at desc);
create index if not exists bookings_pitch_time_idx on public.bookings(pitch_id,starts_at);

-- TEAMS / SQUADS
create table if not exists public.teams (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 logo_url text, description text,
 captain_id uuid not null references public.profiles(id) on delete restrict,
 home_city text, is_public boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.team_members (
 id uuid primary key default gen_random_uuid(),
 team_id uuid not null references public.teams(id) on delete cascade,
 player_id uuid not null references public.profiles(id) on delete cascade,
 member_role text not null default 'member'
 check(member_role in ('captain','vice_captain','member')),
 joined_at timestamptz not null default now(), unique(team_id,player_id)
);
create index if not exists team_members_player_idx on public.team_members(player_id);

-- TOURNAMENTS / ENTRIES / FIXTURES / REFEREES / RESULTS
create table if not exists public.tournaments (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
 description text,
 organizer_id uuid not null references public.profiles(id) on delete restrict,
 venue_id uuid references public.venues(id) on delete set null,
 start_at timestamptz, end_at timestamptz,
 registration_opens_at timestamptz, registration_closes_at timestamptz,
 entry_fee numeric(12,2) not null default 0 check(entry_fee>=0),
 prize_description text, max_teams int check(max_teams is null or max_teams>1),
 format text, rules text, banner_image_url text,
 status public.tournament_status not null default 'draft',
 approved_by uuid references public.profiles(id) on delete set null,
 approved_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(end_at is null or start_at is null or end_at>start_at),
 check(registration_closes_at is null or registration_opens_at is null or
       registration_closes_at>registration_opens_at)
);
create index if not exists tournaments_status_start_idx on public.tournaments(status,start_at);
create table if not exists public.tournament_entries (
 id uuid primary key default gen_random_uuid(),
 tournament_id uuid not null references public.tournaments(id) on delete cascade,
 team_id uuid not null references public.teams(id) on delete restrict,
 submitted_by uuid not null references public.profiles(id) on delete restrict,
 status public.entry_status not null default 'pending',
 amount_due numeric(12,2) not null default 0 check(amount_due>=0),
 payment_status public.payment_status not null default 'pending',
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tournament_id,team_id)
);
create table if not exists public.matches (
 id uuid primary key default gen_random_uuid(),
 tournament_id uuid references public.tournaments(id) on delete cascade,
 venue_id uuid references public.venues(id) on delete set null,
 pitch_id uuid references public.pitches(id) on delete set null,
 home_team_id uuid references public.teams(id) on delete restrict,
 away_team_id uuid references public.teams(id) on delete restrict,
 round_name text, match_number int, scheduled_at timestamptz,
 status public.match_status not null default 'scheduled',
 home_score int check(home_score is null or home_score>=0),
 away_score int check(away_score is null or away_score>=0),
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(home_team_id is null or away_team_id is null or home_team_id<>away_team_id)
);
create index if not exists matches_tournament_schedule_idx on public.matches(tournament_id,scheduled_at);
create table if not exists public.match_officials (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.matches(id) on delete cascade,
 referee_id uuid not null references public.profiles(id) on delete restrict,
 assigned_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), unique(match_id,referee_id)
);
create table if not exists public.match_result_submissions (
 id uuid primary key default gen_random_uuid(),
 match_id uuid not null references public.matches(id) on delete cascade,
 submitted_by uuid not null references public.profiles(id) on delete restrict,
 home_score int not null check(home_score>=0),
 away_score int not null check(away_score>=0),
 notes text, evidence_urls text[] not null default '{}',
 status public.result_status not null default 'submitted',
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz, review_note text,
 created_at timestamptz not null default now()
);
create index if not exists match_results_match_idx on public.match_result_submissions(match_id,created_at desc);

-- MANAGER FEES AND GENERIC PAYMENTS
create table if not exists public.manager_fee_invoices (
 id uuid primary key default gen_random_uuid(),
 manager_id uuid not null references public.profiles(id) on delete restrict,
 venue_id uuid references public.venues(id) on delete set null,
 amount numeric(12,2) not null check(amount>=0), currency_code char(3) not null default 'NPR',
 period_start date, period_end date, due_at timestamptz not null,
 status public.invoice_status not null default 'unpaid',
 paid_amount numeric(12,2) not null default 0 check(paid_amount>=0),
 notes text, created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(period_end is null or period_start is null or period_end>=period_start),
 check(paid_amount<=amount)
);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(),
 payer_id uuid not null references public.profiles(id) on delete restrict,
 player_registration_id uuid references public.player_registrations(id) on delete restrict,
 booking_id uuid references public.bookings(id) on delete restrict,
 tournament_entry_id uuid references public.tournament_entries(id) on delete restrict,
 manager_fee_invoice_id uuid references public.manager_fee_invoices(id) on delete restrict,
 amount numeric(12,2) not null check(amount>=0), currency_code char(3) not null default 'NPR',
 method public.payment_method not null, status public.payment_status not null default 'pending',
 provider text, provider_transaction_id text, provider_reference text, receipt_url text,
 paid_at timestamptz, verified_by uuid references public.profiles(id) on delete set null,
 verified_at timestamptz, failure_reason text, metadata jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(num_nonnulls(player_registration_id,booking_id,tournament_entry_id,manager_fee_invoice_id)=1)
);
create unique index if not exists payment_gateway_tx_unique
 on public.payments(provider,provider_transaction_id) where provider_transaction_id is not null;
create index if not exists payments_payer_idx on public.payments(payer_id,created_at desc);

-- APPLICATIONS: Arena Managers are Developer-appointed; players may apply to
-- become Tournament Managers or Referees, subject to Developer approval.
create table if not exists public.role_applications (
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null references public.profiles(id) on delete cascade,
 requested_role public.user_role not null
 check(requested_role in ('tournament_manager','referee')),
 experience text, reason text, supporting_links text[] not null default '{}',
 status public.application_status not null default 'pending',
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz, review_note text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists one_pending_role_application
 on public.role_applications(applicant_id,requested_role) where status='pending';

-- VENUE RATINGS / REVIEWS
create table if not exists public.venue_reviews (
 id uuid primary key default gen_random_uuid(),
 venue_id uuid not null references public.venues(id) on delete cascade,
 player_id uuid not null references public.profiles(id) on delete cascade,
 booking_id uuid references public.bookings(id) on delete set null,
 rating smallint not null check(rating between 1 and 5),
 review_text text, is_visible boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(venue_id,player_id,booking_id)
);
create index if not exists venue_reviews_venue_idx on public.venue_reviews(venue_id,created_at desc);

-- NOTIFICATIONS / ADMIN AUDIT
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 type text not null default 'system', title text not null, body text not null,
 action_url text, data jsonb not null default '{}', read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists notifications_unread_idx on public.notifications(user_id,created_at desc) where read_at is null;
create table if not exists public.audit_logs (
 id bigint generated always as identity primary key,
 actor_id uuid references public.profiles(id) on delete set null,
 action text not null, entity_table text not null, entity_id text,
 old_data jsonb, new_data jsonb, created_at timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id,created_at desc);

-- SECURITY HELPERS
create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
 select role from public.profiles where id=(select auth.uid()) $$;
create or replace function public.is_developer()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid())
 and role='developer' and not is_suspended) $$;
create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and not is_suspended) $$;
create or replace function public.manages_venue(v_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.venues where id=v_id and manager_id=(select auth.uid())) $$;
create or replace function public.can_manage_match(m_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select public.is_developer() or exists(
  select 1 from public.matches m join public.venues v on v.id=m.venue_id
  where m.id=m_id and v.manager_id=(select auth.uid())) $$;

-- Privileged role assignment: only an active Developer can call this.
create or replace function public.admin_set_user_role(target_user uuid,new_role public.user_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_developer() then raise exception 'Developer permission required'; end if;
 update public.profiles set role=new_role,updated_at=now() where id=target_user;
 if not found then raise exception 'Profile not found'; end if;
 insert into public.audit_logs(actor_id,action,entity_table,entity_id,new_data)
 values((select auth.uid()),'role_changed','profiles',target_user::text,jsonb_build_object('role',new_role));
end $$;

create or replace function public.admin_set_user_suspension(target_user uuid,suspend boolean,reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_developer() then raise exception 'Developer permission required'; end if;
 update public.profiles set is_suspended=suspend,
 suspension_reason=case when suspend then reason else null end,
 suspended_at=case when suspend then now() else null end,updated_at=now()
 where id=target_user;
 if not found then raise exception 'Profile not found'; end if;
 insert into public.audit_logs(actor_id,action,entity_table,entity_id,new_data)
 values((select auth.uid()),case when suspend then 'user_suspended' else 'user_reactivated' end,
 'profiles',target_user::text,jsonb_build_object('reason',reason));
end $$;

create or replace function public.review_role_application(app_id uuid,approve boolean,note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.role_applications%rowtype;
begin
 if not public.is_developer() then raise exception 'Developer permission required'; end if;
 select * into a from public.role_applications where id=app_id for update;
 if not found or a.status<>'pending' then raise exception 'Pending application not found'; end if;
 update public.role_applications set status=case when approve then 'approved'::public.application_status else 'rejected'::public.application_status end,
 reviewed_by=(select auth.uid()),reviewed_at=now(),review_note=note,updated_at=now() where id=app_id;
 if approve then update public.profiles set role=a.requested_role,updated_at=now() where id=a.applicant_id; end if;
 insert into public.audit_logs(actor_id,action,entity_table,entity_id,new_data)
 values((select auth.uid()),'role_application_reviewed','role_applications',app_id::text,
 jsonb_build_object('approved',approve,'role',a.requested_role));
end $$;

create or replace function public.review_match_result(submission_id uuid,approve boolean,note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.match_result_submissions%rowtype;
begin
 select * into r from public.match_result_submissions where id=submission_id for update;
 if not found then raise exception 'Result submission not found'; end if;
 if not (public.is_developer() or public.can_manage_match(r.match_id)) then
  raise exception 'Arena Manager for this match or Developer permission required';
 end if;
 if r.status<>'submitted' then raise exception 'Result already reviewed'; end if;
 update public.match_result_submissions set status=case when approve then 'approved'::public.result_status else 'rejected'::public.result_status end,
 reviewed_by=(select auth.uid()),reviewed_at=now(),review_note=note where id=submission_id;
 if approve then update public.matches set home_score=r.home_score,away_score=r.away_score,status='completed',updated_at=now() where id=r.match_id; end if;
 insert into public.audit_logs(actor_id,action,entity_table,entity_id,new_data)
 values((select auth.uid()),'match_result_reviewed','match_result_submissions',submission_id::text,
 jsonb_build_object('approved',approve,'home_score',r.home_score,'away_score',r.away_score));
end $$;

create or replace function public.developer_edit_match_score(match_id uuid,home int,away int,note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare old public.matches%rowtype;
begin
 if not public.is_developer() then raise exception 'Developer permission required'; end if;
 if home<0 or away<0 then raise exception 'Scores cannot be negative'; end if;
 select * into old from public.matches where id=match_id for update;
 if not found then raise exception 'Match not found'; end if;
 update public.matches set home_score=home,away_score=away,status='completed',updated_at=now() where id=match_id;
 insert into public.audit_logs(actor_id,action,entity_table,entity_id,old_data,new_data)
 values((select auth.uid()),'developer_edited_match_score','matches',match_id::text,
 jsonb_build_object('home',old.home_score,'away',old.away_score),
 jsonb_build_object('home',home,'away',away,'note',note));
end $$;

-- Stop users changing their own role/suspension fields through profile updates.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql set search_path = '' as $$
begin
 if auth.uid() is not null and not public.is_developer() and
 (new.role is distinct from old.role or new.is_suspended is distinct from old.is_suspended
  or new.suspension_reason is distinct from old.suspension_reason
  or new.suspended_at is distinct from old.suspended_at) then
  raise exception 'Role and suspension fields are managed by BookIN Developers';
 end if;
 return new;
end $$;
drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges before update on public.profiles
for each row execute function public.protect_profile_privileges();

-- updated_at triggers
do $$ declare t text; begin
 foreach t in array array['profiles','platform_settings','player_registrations','venues','pitches',
 'bookings','teams','tournaments','tournament_entries','matches','manager_fee_invoices',
 'payments','role_applications','venue_reviews'] loop
 execute format('drop trigger if exists touch_updated_at on public.%I',t);
 execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
 end loop;
end $$;

-- Server-side defaults for player-created registrations and bookings.
-- Clients cannot grant themselves an active membership or set a booking as paid.
create or replace function public.prepare_player_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare cfg public.platform_settings%rowtype;
begin
 if new.player_id <> (select auth.uid()) then
  raise exception 'Registration must belong to the signed-in player';
 end if;
 select * into cfg from public.platform_settings where id=1;
 new.amount := cfg.player_registration_fee;
 new.currency_code := cfg.currency_code;
 new.duration_days := cfg.player_registration_days;
 new.status := 'pending';
 new.starts_at := null;
 new.expires_at := null;
 new.reviewed_by := null;
 new.reviewed_at := null;
 return new;
end $$;
drop trigger if exists prepare_player_registration_trigger on public.player_registrations;
create trigger prepare_player_registration_trigger before insert on public.player_registrations
for each row execute function public.prepare_player_registration();

create or replace function public.prepare_player_booking()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pitch_row public.pitches%rowtype;
declare venue_row public.venues%rowtype;
begin
 if new.player_id <> (select auth.uid()) then
  raise exception 'Booking must belong to the signed-in player';
 end if;
 select * into pitch_row from public.pitches where id=new.pitch_id and is_active=true;
 if not found then raise exception 'Pitch is not available for booking'; end if;
 select * into venue_row from public.venues where id=pitch_row.venue_id and status='approved';
 if not found then raise exception 'Venue is not approved for bookings'; end if;
 if new.ends_at <= new.starts_at then raise exception 'Invalid booking time range'; end if;
 new.hourly_rate := pitch_row.hourly_rate;
 new.currency_code := pitch_row.currency_code;
 new.total_amount := round(pitch_row.hourly_rate *
   (extract(epoch from (new.ends_at-new.starts_at))/3600.0),2);
 new.status := 'pending_payment';
 new.payment_status := 'pending';
 new.confirmed_by := null;
 new.confirmed_at := null;
 new.completed_at := null;
 new.cancelled_by := null;
 new.cancelled_at := null;
 return new;
end $$;
drop trigger if exists prepare_player_booking_trigger on public.bookings;
create trigger prepare_player_booking_trigger before insert on public.bookings
for each row execute function public.prepare_player_booking();

-- ENABLE RLS
do $$ declare t text; begin
 foreach t in array array['profiles','platform_settings','player_registrations','venues','pitches',
 'amenities','venue_amenities','venue_opening_hours','pitch_unavailability','bookings',
 'teams','team_members','tournaments','tournament_entries','matches','match_officials',
 'match_result_submissions','manager_fee_invoices','payments','role_applications',
 'venue_reviews','notifications','audit_logs'] loop
 execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;

-- PROFILES: only the owner and Developer can read profile rows.
drop policy if exists profiles_read_self_or_dev on public.profiles;
create policy profiles_read_self_or_dev on public.profiles for select to authenticated
using(id=(select auth.uid()) or public.is_developer());

-- Owners may edit their own public-facing profile fields only.
-- Column-level UPDATE grants below prevent clients from changing role,
-- is_suspended, suspension_reason, suspended_at, or other protected fields.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using(id=(select auth.uid()))
with check(id=(select auth.uid()));

grant select on public.profiles to authenticated;
grant update(full_name,username,avatar_url,bio) on public.profiles to authenticated;

-- Settings visible to signed-in users; Developer only can change.
drop policy if exists settings_read on public.platform_settings;
create policy settings_read on public.platform_settings for select to authenticated using(true);
drop policy if exists settings_dev_all on public.platform_settings;
create policy settings_dev_all on public.platform_settings for all to authenticated
using(public.is_developer()) with check(public.is_developer());

-- Player registrations
drop policy if exists regs_read on public.player_registrations;
create policy regs_read on public.player_registrations for select to authenticated
using(player_id=(select auth.uid()) or public.is_developer());
drop policy if exists regs_insert_self on public.player_registrations;
create policy regs_insert_self on public.player_registrations for insert to authenticated
with check(player_id=(select auth.uid()) and public.is_active_user());
drop policy if exists regs_dev_all on public.player_registrations;
create policy regs_dev_all on public.player_registrations for all to authenticated
using(public.is_developer()) with check(public.is_developer());

-- Venues
drop policy if exists venues_read on public.venues;
create policy venues_read on public.venues for select to anon,authenticated
using(status='approved' or manager_id=(select auth.uid()) or public.is_developer());
drop policy if exists venues_insert on public.venues;
create policy venues_insert on public.venues for insert to authenticated
with check(public.current_user_role() in ('arena_manager','developer')
 and (manager_id=(select auth.uid()) or public.is_developer()));
drop policy if exists venues_update on public.venues;
create policy venues_update on public.venues for update to authenticated
using(manager_id=(select auth.uid()) or public.is_developer())
with check(manager_id=(select auth.uid()) or public.is_developer());
drop policy if exists venues_delete on public.venues;
create policy venues_delete on public.venues for delete to authenticated using(public.is_developer());

-- Pitch and venue detail access
drop policy if exists pitches_read on public.pitches;
create policy pitches_read on public.pitches for select to anon,authenticated
using(exists(select 1 from public.venues v where v.id=venue_id and v.status='approved')
 or public.manages_venue(venue_id) or public.is_developer());
drop policy if exists pitches_manage on public.pitches;
create policy pitches_manage on public.pitches for all to authenticated
using(public.manages_venue(venue_id) or public.is_developer())
with check(public.manages_venue(venue_id) or public.is_developer());
drop policy if exists amenities_read on public.amenities;
create policy amenities_read on public.amenities for select to anon,authenticated using(true);
drop policy if exists amenities_dev on public.amenities;
create policy amenities_dev on public.amenities for all to authenticated
using(public.is_developer()) with check(public.is_developer());
drop policy if exists venue_amenities_read on public.venue_amenities;
create policy venue_amenities_read on public.venue_amenities for select to anon,authenticated
using(exists(select 1 from public.venues v where v.id=venue_id and v.status='approved')
 or public.manages_venue(venue_id) or public.is_developer());
drop policy if exists venue_amenities_manage on public.venue_amenities;
create policy venue_amenities_manage on public.venue_amenities for all to authenticated
using(public.manages_venue(venue_id) or public.is_developer())
with check(public.manages_venue(venue_id) or public.is_developer());
drop policy if exists opening_hours_read on public.venue_opening_hours;
create policy opening_hours_read on public.venue_opening_hours for select to anon,authenticated
using(exists(select 1 from public.venues v where v.id=venue_id and v.status='approved')
 or public.manages_venue(venue_id) or public.is_developer());
drop policy if exists opening_hours_manage on public.venue_opening_hours;
create policy opening_hours_manage on public.venue_opening_hours for all to authenticated
using(public.manages_venue(venue_id) or public.is_developer())
with check(public.manages_venue(venue_id) or public.is_developer());
drop policy if exists pitch_closures_read on public.pitch_unavailability;
create policy pitch_closures_read on public.pitch_unavailability for select to authenticated
using(public.is_developer() or exists(select 1 from public.pitches p where p.id=pitch_id and public.manages_venue(p.venue_id)));
drop policy if exists pitch_closures_manage on public.pitch_unavailability;
create policy pitch_closures_manage on public.pitch_unavailability for all to authenticated
using(public.is_developer() or exists(select 1 from public.pitches p where p.id=pitch_id and public.manages_venue(p.venue_id)))
with check(public.is_developer() or exists(select 1 from public.pitches p where p.id=pitch_id and public.manages_venue(p.venue_id)));

-- Bookings
drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings for select to authenticated
using(player_id=(select auth.uid()) or public.is_developer() or
 exists(select 1 from public.pitches p where p.id=pitch_id and public.manages_venue(p.venue_id)));
drop policy if exists bookings_create on public.bookings;
create policy bookings_create on public.bookings for insert to authenticated
with check(player_id=(select auth.uid()) and public.is_active_user() and public.current_user_role()='player');
drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings for update to authenticated
using(player_id=(select auth.uid()) or public.is_developer() or
 exists(select 1 from public.pitches p where p.id=pitch_id and public.manages_venue(p.venue_id)))
with check(player_id=(select auth.uid()) or public.is_developer() or
 exists(select 1 from public.pitches p where p.id=pitch_id and public.manages_venue(p.venue_id)));

-- Teams and membership
drop policy if exists teams_read_auth on public.teams;
create policy teams_read_auth on public.teams for select to authenticated
using(is_public or captain_id=(select auth.uid()) or public.is_developer() or
 exists(select 1 from public.team_members tm where tm.team_id=id and tm.player_id=(select auth.uid())));
drop policy if exists teams_read_anon on public.teams;
create policy teams_read_anon on public.teams for select to anon using(is_public);
drop policy if exists teams_insert on public.teams;
create policy teams_insert on public.teams for insert to authenticated
with check(captain_id=(select auth.uid()) and public.is_active_user());
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
using(captain_id=(select auth.uid()) or public.is_developer())
with check(captain_id=(select auth.uid()) or public.is_developer());
drop policy if exists teams_delete on public.teams;
create policy teams_delete on public.teams for delete to authenticated
using(captain_id=(select auth.uid()) or public.is_developer());
drop policy if exists team_members_read on public.team_members;
create policy team_members_read on public.team_members for select to authenticated
using(player_id=(select auth.uid()) or public.is_developer() or exists(
 select 1 from public.teams t where t.id=team_id and (t.is_public or t.captain_id=(select auth.uid()))));
drop policy if exists team_members_manage on public.team_members;
create policy team_members_manage on public.team_members for all to authenticated
using(public.is_developer() or exists(select 1 from public.teams t where t.id=team_id and t.captain_id=(select auth.uid())))
with check(public.is_developer() or exists(select 1 from public.teams t where t.id=team_id and t.captain_id=(select auth.uid())));

-- Tournaments and entries
drop policy if exists tournaments_read on public.tournaments;
create policy tournaments_read on public.tournaments for select to anon,authenticated
using(status in ('published','registration_open','registration_closed','in_progress','completed')
 or organizer_id=(select auth.uid()) or public.is_developer());
drop policy if exists tournaments_insert on public.tournaments;
create policy tournaments_insert on public.tournaments for insert to authenticated
with check(organizer_id=(select auth.uid()) and public.current_user_role() in ('tournament_manager','developer'));
drop policy if exists tournaments_update on public.tournaments;
create policy tournaments_update on public.tournaments for update to authenticated
using(organizer_id=(select auth.uid()) or public.is_developer())
with check(organizer_id=(select auth.uid()) or public.is_developer());
drop policy if exists tournaments_delete on public.tournaments;
create policy tournaments_delete on public.tournaments for delete to authenticated using(public.is_developer());
drop policy if exists entries_read on public.tournament_entries;
create policy entries_read on public.tournament_entries for select to authenticated
using(submitted_by=(select auth.uid()) or public.is_developer() or exists(
 select 1 from public.tournaments t where t.id=tournament_id and t.organizer_id=(select auth.uid())));
drop policy if exists entries_insert on public.tournament_entries;
create policy entries_insert on public.tournament_entries for insert to authenticated
with check(submitted_by=(select auth.uid()) and public.is_active_user());
drop policy if exists entries_update on public.tournament_entries;
create policy entries_update on public.tournament_entries for update to authenticated
using(public.is_developer() or exists(select 1 from public.tournaments t where t.id=tournament_id and t.organizer_id=(select auth.uid())))
with check(public.is_developer() or exists(select 1 from public.tournaments t where t.id=tournament_id and t.organizer_id=(select auth.uid())));

-- Matches / referees / results
drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches for select to anon,authenticated
using(tournament_id is null or exists(select 1 from public.tournaments t where t.id=tournament_id
 and t.status in ('published','registration_open','registration_closed','in_progress','completed'))
 or public.is_developer() or (venue_id is not null and public.manages_venue(venue_id)));
drop policy if exists matches_manage on public.matches;
create policy matches_manage on public.matches for all to authenticated
using(public.is_developer() or (venue_id is not null and public.manages_venue(venue_id)) or
 exists(select 1 from public.tournaments t where t.id=tournament_id and t.organizer_id=(select auth.uid())))
with check(public.is_developer() or (venue_id is not null and public.manages_venue(venue_id)) or
 exists(select 1 from public.tournaments t where t.id=tournament_id and t.organizer_id=(select auth.uid())));
drop policy if exists officials_read on public.match_officials;
create policy officials_read on public.match_officials for select to authenticated
using(referee_id=(select auth.uid()) or public.is_developer() or public.can_manage_match(match_id));
drop policy if exists officials_manage on public.match_officials;
create policy officials_manage on public.match_officials for all to authenticated
using(public.is_developer() or public.can_manage_match(match_id))
with check(public.is_developer() or public.can_manage_match(match_id));
drop policy if exists results_read on public.match_result_submissions;
create policy results_read on public.match_result_submissions for select to authenticated
using(submitted_by=(select auth.uid()) or public.is_developer() or public.can_manage_match(match_id)
 or exists(select 1 from public.match_officials mo where mo.match_id=match_id and mo.referee_id=(select auth.uid())));
drop policy if exists referee_result_insert on public.match_result_submissions;
create policy referee_result_insert on public.match_result_submissions for insert to authenticated
with check(submitted_by=(select auth.uid()) and public.current_user_role()='referee'
 and exists(select 1 from public.match_officials mo where mo.match_id=match_id and mo.referee_id=(select auth.uid())));

-- Manager invoices and payments: payment status changes via trusted backend/webhook or Developer.
drop policy if exists invoices_read on public.manager_fee_invoices;
create policy invoices_read on public.manager_fee_invoices for select to authenticated
using(manager_id=(select auth.uid()) or public.is_developer());
drop policy if exists invoices_dev_manage on public.manager_fee_invoices;
create policy invoices_dev_manage on public.manager_fee_invoices for all to authenticated
using(public.is_developer()) with check(public.is_developer());
drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select to authenticated
using(payer_id=(select auth.uid()) or public.is_developer());
drop policy if exists payments_dev_manage on public.payments;
create policy payments_dev_manage on public.payments for all to authenticated
using(public.is_developer()) with check(public.is_developer());

-- Role applications
drop policy if exists applications_read on public.role_applications;
create policy applications_read on public.role_applications for select to authenticated
using(applicant_id=(select auth.uid()) or public.is_developer());
drop policy if exists applications_submit on public.role_applications;
create policy applications_submit on public.role_applications for insert to authenticated
with check(applicant_id=(select auth.uid()) and public.current_user_role()='player'
 and requested_role in ('tournament_manager','referee'));
drop policy if exists applications_withdraw on public.role_applications;
create policy applications_withdraw on public.role_applications for update to authenticated
using(applicant_id=(select auth.uid()) and status='pending')
with check(applicant_id=(select auth.uid()) and status in ('pending','withdrawn'));

-- Reviews, notifications, audit
drop policy if exists reviews_read on public.venue_reviews;
create policy reviews_read on public.venue_reviews for select to anon,authenticated
using(is_visible or player_id=(select auth.uid()) or public.is_developer());
drop policy if exists reviews_insert on public.venue_reviews;
create policy reviews_insert on public.venue_reviews for insert to authenticated
with check(player_id=(select auth.uid()) and public.is_active_user());
drop policy if exists reviews_update on public.venue_reviews;
create policy reviews_update on public.venue_reviews for update to authenticated
using(player_id=(select auth.uid()) or public.is_developer())
with check(player_id=(select auth.uid()) or public.is_developer());
drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated
using(user_id=(select auth.uid()) or public.is_developer());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists audit_read on public.audit_logs;
create policy audit_read on public.audit_logs for select to authenticated using(public.is_developer());

-- Grants: RLS is still enforced. Service-role backend may perform trusted writes.
grant usage on schema public to anon,authenticated;
grant select on public.venues,public.pitches,public.amenities,public.venue_amenities,
 public.venue_opening_hours,public.tournaments,public.matches,public.venue_reviews to anon,authenticated;
grant select,insert,update,delete on public.player_registrations,public.venues,public.pitches,
 public.venue_amenities,public.venue_opening_hours,public.pitch_unavailability,public.bookings,
 public.teams,public.team_members,public.tournaments,public.tournament_entries,public.matches,
 public.match_officials,public.match_result_submissions,public.role_applications,
 public.venue_reviews,public.notifications to authenticated;
grant select on public.platform_settings,public.manager_fee_invoices,public.payments,public.audit_logs to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_developer() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.manages_venue(uuid) to authenticated;
grant execute on function public.can_manage_match(uuid) to authenticated;
grant execute on function public.admin_set_user_role(uuid,public.user_role) to authenticated;
grant execute on function public.admin_set_user_suspension(uuid,boolean,text) to authenticated;
grant execute on function public.review_role_application(uuid,boolean,text) to authenticated;
grant execute on function public.review_match_result(uuid,boolean,text) to authenticated;
grant execute on function public.developer_edit_match_score(uuid,integer,integer,text) to authenticated;

-- Basic amenity catalogue (not fictional arena data)
insert into public.amenities(name,icon) values
 ('Changing Rooms','shirt'),('Showers','droplets'),('Parking','car'),
 ('Drinking Water','glass-water'),('Cafeteria','coffee'),('First Aid','heart-pulse'),
 ('Spectator Seating','armchair'),('Floodlights','lightbulb'),('Washrooms','bath'),
 ('Equipment Rental','football')
on conflict(name) do nothing;

commit;

-- FIRST DEVELOPER: create and verify the account through Supabase Auth first.
-- Find its UUID in Authentication > Users, then run this separately:
-- update public.profiles set role='developer',updated_at=now()
-- where id='YOUR_AUTH_USER_UUID';
--
-- Notes:
-- * Configure Supabase Phone Auth + SMS provider and email SMTP separately.
-- * OTPs are handled by Supabase Auth; never create your own OTP table.
-- * Keep service_role secret on the server only.
-- * Payment gateways need server-side verification/webhooks before setting paid.