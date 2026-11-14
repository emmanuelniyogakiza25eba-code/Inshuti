import { NextRequest, NextResponse } from 'next/server';
import { isValidAdminSession } from '@/src/lib/adminSession';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';

export const runtime = 'nodejs';
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'Inshuti-media';

function authorize(request: NextRequest) {
  if (!isValidAdminSession(request)) return NextResponse.json({ error: 'Owner session required.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' }, { status: 503 });
  return null;
}

export async function POST(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  let body: { id?: string; slotType?: string; payload?: Record<string, unknown>; imageDataUrl?: string | null; imageUrl?: string | null };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid item.' }, { status: 400 }); }
  if (!body.id || !['product', 'hero_banner', 'home_photo'].includes(body.slotType || '')) return NextResponse.json({ error: 'A valid item id and slot type are required.' }, { status: 400 });

  const { data: previous, error: readError } = await supabaseAdmin!.from('store_items').select('image_path,image_url').eq('id', body.id).maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 502 });
  let imagePath = null as string | null;
  let imageUrl = body.imageUrl || previous?.image_url || null;
  if (body.imageDataUrl?.startsWith('data:')) {
    const match = body.imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
    if (!match) return NextResponse.json({ error: 'The uploaded photo is invalid.' }, { status: 400 });
    const mime = match[1];
    const bytes = Buffer.from(match[2], 'base64');
    const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    imagePath = `${body.slotType}/${body.id.replace(/[^a-zA-Z0-9_-]/g, '-')}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin!.storage.from(BUCKET).upload(imagePath, bytes, { contentType: mime, cacheControl: '31536000', upsert: false });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 502 });
    imageUrl = supabaseAdmin!.storage.from(BUCKET).getPublicUrl(imagePath).data.publicUrl;
  }
  const payload = { ...(body.payload || {}) };
  delete payload.imageDataUrl;
  if (typeof payload.image === 'string' && payload.image.startsWith('data:')) delete payload.image;
  const isDeletedDefault = payload.source === 'default' && payload.deleted === true;
  const { data, error } = await supabaseAdmin!.from('store_items').upsert({
    id: body.id,
    slot_type: body.slotType,
    payload,
    image_path: isDeletedDefault ? null : imagePath || (body.imageDataUrl ? null : previous?.image_path || null),
    image_url: isDeletedDefault ? null : imageUrl,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' }).select().single();
  if (error) {
    if (imagePath) await supabaseAdmin!.storage.from(BUCKET).remove([imagePath]);
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  if (previous?.image_path && (isDeletedDefault || (previous.image_path !== imagePath && body.imageDataUrl))) {
    const { error: removeError } = await supabaseAdmin!.storage.from(BUCKET).remove([previous.image_path]);
    if (removeError) console.error('Could not remove replaced INSHUTI image:', removeError.message);
  }
  return NextResponse.json({ ...data, imageUrl });
}

export async function DELETE(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  let body: { id?: string; restoreDefaults?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (body.restoreDefaults) {
    const { data, error } = await supabaseAdmin!.from('store_items').select('id,image_path,payload').eq('slot_type', 'product');
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    const defaults = (data || []).filter((row) => row.payload?.source === 'default');
    if (defaults.length) {
      const { error: deleteError } = await supabaseAdmin!.from('store_items').delete().in('id', defaults.map((row) => row.id));
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 502 });
      const paths = defaults.map((row) => row.image_path).filter(Boolean);
      if (paths.length) await supabaseAdmin!.storage.from(BUCKET).remove(paths);
    }
    return NextResponse.json({ ok: true });
  }
  if (!body.id) return NextResponse.json({ error: 'An item id is required.' }, { status: 400 });
  const { data: existing, error: readError } = await supabaseAdmin!.from('store_items').select('image_path').eq('id', body.id).maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 502 });
  const { error } = await supabaseAdmin!.from('store_items').delete().eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (existing?.image_path) await supabaseAdmin!.storage.from(BUCKET).remove([existing.image_path]);
  return NextResponse.json({ ok: true });
}
