import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminSession } from '@/src/lib/adminSession';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

function requireOwner(request: NextRequest) {
  if (!isValidAdminSession(request)) return NextResponse.json({ error: 'Owner session required.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' }, { status: 503 });
  return null;
}

export async function GET(request: NextRequest) {
  const denied = requireOwner(request);
  if (denied) return denied;
  const [ordersResult, subscribersResult] = await Promise.all([
    supabaseAdmin!.from('store_orders').select('*').order('timestamp', { ascending: false }),
    supabaseAdmin!.from('store_subscribers').select('*').order('created_at', { ascending: false }),
  ]);
  if (ordersResult.error || subscribersResult.error) {
    return NextResponse.json({ error: ordersResult.error?.message || subscribersResult.error?.message }, { status: 502 });
  }
  const orders = (ordersResult.data || []).map((row) => ({
    id: row.id,
    orderRef: row.order_ref,
    productName: row.product_name,
    category: row.category,
    size: row.size,
    priceRwf: row.price_rwf,
    totalPriceRwf: row.total_price_rwf,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    eventType: row.event_type,
    paymentMethod: row.payment_method,
    status: row.status,
    backupSizes: row.backup_sizes,
    fittingRequested: row.fitting_requested,
    fittingFeeRwf: row.fitting_fee_rwf,
    timestamp: row.timestamp,
  }));
  const newsletterSubscribers = (subscribersResult.data || []).map((row) => ({
    id: row.id,
    email: row.email,
    timestamp: row.created_at,
  }));
  return NextResponse.json({ orders, newsletterSubscribers });
}

export async function PATCH(request: NextRequest) {
  const denied = requireOwner(request);
  if (denied) return denied;
  let body: { id?: string; status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  if (!body.id || !['Pending', 'Pending MoMo', 'Paid / Sold', 'Delivered'].includes(body.status || '')) {
    return NextResponse.json({ error: 'A valid order id and status are required.' }, { status: 400 });
  }
  const { error } = await supabaseAdmin!.from('store_orders').update({ status: body.status }).or(`id.eq.${body.id},order_ref.eq.${body.id}`);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}
