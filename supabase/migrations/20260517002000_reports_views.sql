-- Phase 10 — reporting views. Queried by the admin reports endpoints using the
-- service client (the routes are already gated to admins).

create or replace view public.v_admin_dashboard_stats as
select
  (select count(*) from public.profiles where role = 'player')  as players,
  (select count(*) from public.profiles where role = 'officer') as officers,
  (select count(*) from public.rounds where round_date = current_date) as rounds_today,
  (select count(*) from public.guesses where status = 'pending') as pending_guesses,
  (select coalesce(sum(points_balance), 0) from public.profiles where role = 'player')
    as player_points,
  (select coalesce(sum(points_used), 0) from public.guesses
     where created_at::date = current_date) as stakes_today,
  (select coalesce(sum(amount), 0) from public.point_transactions
     where transaction_type = 'win_payout' and created_at::date = current_date)
    as payouts_today;

create or replace view public.v_number_exposure as
select g.round_id, r.game_type, r.round_name, g.guess_number,
       count(*) as guess_count,
       sum(g.points_used) as total_points,
       sum(g.possible_win_amount) as total_exposure
from public.guesses g
join public.rounds r on r.id = g.round_id
where g.status in ('pending', 'won', 'lost')
group by g.round_id, r.game_type, r.round_name, g.guess_number;

create or replace view public.v_officer_distribution as
select p.id as officer_id, p.username,
       coalesce(sum(t.amount) filter (where t.created_at::date = current_date), 0)
         as given_today,
       coalesce(sum(t.amount), 0) as given_total
from public.profiles p
left join public.point_transactions t
  on t.user_id = p.id
  and t.transaction_type = 'officer_give_points' and t.direction = 'debit'
where p.role = 'officer'
group by p.id, p.username;

create or replace view public.v_winning_rate_history as
select ps.*, pr.username as changed_by_username
from public.payout_settings ps
left join public.profiles pr on pr.id = ps.created_by;

create or replace view public.v_daily_pnl as
select d::date as day,
       coalesce((select sum(points_used) from public.guesses
                 where created_at::date = d::date), 0) as stakes,
       coalesce((select sum(amount) from public.point_transactions
                 where transaction_type = 'win_payout' and created_at::date = d::date), 0)
         as payouts
from generate_series(current_date - interval '13 days', current_date, interval '1 day') d;
