-- Atomically create or replace an expense and all child items/splits.
-- SECURITY INVOKER keeps the caller subject to the tables' existing RLS rules.
create or replace function public.save_expense(p_expense jsonb, p_allow_update boolean default true)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_expense_id uuid;
  v_group_id uuid;
  v_payer_id uuid;
  v_description text;
  v_tax_cents bigint;
  v_tip_cents bigint;
  v_created_at timestamptz;
  v_item jsonb;
  v_split jsonb;
  v_item_id uuid;
  v_item_name text;
  v_quantity integer;
  v_unit_price_cents bigint;
  v_sort_order integer := 0;
  v_split_total numeric;
  v_item_total numeric;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign-in is required to save an expense.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_expense) is distinct from 'object'
    or jsonb_typeof(p_expense -> 'items') is distinct from 'array'
    or jsonb_array_length(coalesce(p_expense -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'Expense payload must include at least one item.' using errcode = '22023';
  end if;

  v_expense_id := (p_expense ->> 'id')::uuid;
  v_group_id := (p_expense ->> 'group_id')::uuid;
  v_payer_id := (p_expense ->> 'paid_by_member_id')::uuid;
  v_description := btrim(p_expense ->> 'description');
  v_tax_cents := coalesce((p_expense ->> 'tax_cents')::bigint, 0);
  v_tip_cents := coalesce((p_expense ->> 'tip_cents')::bigint, 0);
  v_created_at := coalesce((p_expense ->> 'created_at')::timestamptz, now());

  if v_description is null or char_length(v_description) not between 1 and 80
    or v_tax_cents < 0 or v_tip_cents < 0 then
    raise exception 'Expense description, tax, or tip is invalid.' using errcode = '22023';
  end if;

  if coalesce(p_allow_update, false) then
    insert into public.expenses (id, group_id, paid_by_member_id, description, tax_cents, tip_cents, created_at)
    values (v_expense_id, v_group_id, v_payer_id, v_description, v_tax_cents, v_tip_cents, v_created_at)
    on conflict (id) do update set
      group_id = excluded.group_id,
      paid_by_member_id = excluded.paid_by_member_id,
      description = excluded.description,
      tax_cents = excluded.tax_cents,
      tip_cents = excluded.tip_cents;
  else
    -- Import mode is create-only: an existing cloud row is never overwritten.
    insert into public.expenses (id, group_id, paid_by_member_id, description, tax_cents, tip_cents, created_at)
    values (v_expense_id, v_group_id, v_payer_id, v_description, v_tax_cents, v_tip_cents, v_created_at);
  end if;

  delete from public.expense_items
  where expense_id = v_expense_id and group_id = v_group_id;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_expense -> 'items') as entries(value)
  loop
    v_item_id := (v_item ->> 'id')::uuid;
    v_item_name := btrim(v_item ->> 'name');
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_price_cents := (v_item ->> 'unit_price_cents')::bigint;
    v_split_total := 0;
    v_item_total := v_quantity::numeric * v_unit_price_cents::numeric;

    if v_item_name is null or char_length(v_item_name) not between 1 and 80
      or v_quantity not between 1 and 999 or v_unit_price_cents < 0
      or jsonb_typeof(v_item -> 'splits') is distinct from 'array'
      or jsonb_array_length(v_item -> 'splits') = 0 then
      raise exception 'Expense item or item splits are invalid.' using errcode = '22023';
    end if;

    insert into public.expense_items (id, expense_id, group_id, name, quantity, unit_price_cents, sort_order)
    values (v_item_id, v_expense_id, v_group_id, v_item_name, v_quantity, v_unit_price_cents,
      coalesce((v_item ->> 'sort_order')::integer, v_sort_order));

    for v_split in select value from pg_catalog.jsonb_array_elements(v_item -> 'splits') as entries(value)
    loop
      v_split_total := v_split_total + (v_split ->> 'amount_cents')::bigint;
      insert into public.item_splits (expense_item_id, group_id, member_id, amount_cents)
      values (v_item_id, v_group_id, (v_split ->> 'member_id')::uuid, (v_split ->> 'amount_cents')::bigint);
    end loop;

    if v_split_total <> v_item_total then
      raise exception 'Item split amounts must equal the item total.' using errcode = '22023';
    end if;
    v_sort_order := v_sort_order + 1;
  end loop;

  return v_expense_id;
end;
$function$;

revoke all on function public.save_expense(jsonb, boolean) from public, anon, authenticated;
grant execute on function public.save_expense(jsonb, boolean) to authenticated;
