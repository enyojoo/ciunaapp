-- Unpaid checkout cancel returns the shopper's cart (items intact).
-- Orders keep timeline history; cart_id is cleared so a fresh checkout can reuse the cart.

create or replace function marketplace_restore_cart_after_cancel()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.fulfillment_state = 'cancelled'
     and old.fulfillment_state = 'awaiting_payment'
     and old.cart_id is not null
     and old.payment_state in ('awaiting_payment', 'processing')
  then
    -- Free the cart for another marketplace_orders row (unique cart_id).
    update marketplace_orders
    set cart_id = null
    where id = new.id
      and cart_id = old.cart_id;

    -- Unique active cart per vendor: abandon any newer active cart for the same pair.
    update hub_carts c
    set status = 'abandoned', updated_at = now()
    from hub_carts src
    where src.id = old.cart_id
      and c.user_id = src.user_id
      and c.vendor_id = src.vendor_id
      and c.status = 'active'
      and c.id <> src.id;

    update hub_carts
    set status = 'active', updated_at = now()
    where id = old.cart_id
      and status = 'converted';
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_orders_restore_cart_after_cancel on marketplace_orders;
create trigger marketplace_orders_restore_cart_after_cancel
  after update of fulfillment_state on marketplace_orders
  for each row
  execute function marketplace_restore_cart_after_cancel();
