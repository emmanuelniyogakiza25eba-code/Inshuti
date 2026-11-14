import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Cloud orders are not configured.' }, { status: 503 });
  let order: Record<string, unknown>;
  try { order = await request.json(); } catch { return NextResponse.json({ error: 'Invalid order.' }, { status: 400 }); }
  if (typeof order.id !== 'string' || typeof order.productName !== 'string' || !['Men', 'Women'].includes(String(order.category)) || typeof order.size !== 'string' || !['add_to_bag', 'whatsapp_order', 'checkout'].includes(String(order.eventType))) {
    return NextResponse.json({ error: 'Order data is incomplete.' }, { status: 400 });
  }
  const row = {
    id: order.id,
    order_ref: order.orderRef || null,
    product_name: order.productName,
    category: order.category,
    size: order.size,
    price_rwf: Number(order.priceRwf) || 0,
    total_price_rwf: Number(order.totalPriceRwf ?? order.priceRwf) || 0,
    customer_name: typeof order.customerName === 'string' ? order.customerName : 'Guest',
    customer_email: typeof order.customerEmail === 'string' ? order.customerEmail : '',
    event_type: order.eventType,
    payment_method: order.paymentMethod || null,
    status: order.status || null,
    backup_sizes: Array.isArray(order.backupSizes) ? order.backupSizes : [],
    fitting_requested: Boolean(order.fittingRequested),
    fitting_fee_rwf: Number(order.fittingFeeRwf) || 0,
    timestamp: typeof order.timestamp === 'string' ? order.timestamp : new Date().toISOString(),
  };
  const { error } = await supabaseAdmin.from('store_orders').upsert(row, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ ok: true });
}
