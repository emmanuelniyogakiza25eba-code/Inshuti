import { isSupabaseConfigured, supabase, supabaseBucket } from '@/src/lib/supabase';
export { isSupabaseConfigured };

const STORAGE_KEY = 'inshuti-store-analytics';
const CUSTOM_STORE_ITEMS_KEY = 'inshuti-store-products';
const HOME_PAGE_IMAGES_KEY = 'inshuti-home-page-images';
const ACTIVITY_SESSION_KEY = 'inshuti-activity-session-id';
const ACTIVITY_VISITOR_KEY = 'inshuti-activity-visitor-id';

export const HOME_PAGE_IMAGE_SLOTS = [
  { id: 'home-hero-showcase-1', label: 'Home Hero Showcase 1', description: 'INSHUTI garment 1 — main top showcase photo', defaultImage: '/Grey%20color%20polo.png' },
  { id: 'home-hero-showcase-2', label: 'Home Hero Showcase 2', description: 'INSHUTI garment 2 — second showcase photo', defaultImage: '/T-shirt%20together.png' },
  { id: 'home-hero-showcase-3', label: 'Home Hero Showcase 3', description: 'INSHUTI garment 3 — third showcase photo', defaultImage: '/white%20polo%20love.png' },
  { id: 'home-wardrobe-feature', label: 'Home Wardrobe Feature Photo', description: 'INSHUTI T-shirt — photo beside “Your whole wardrobe upgrade, right in your pocket”', defaultImage: '/Grey%20color%20polo.png' },
];
export const SUPABASE_MEDIA_BUCKET = supabaseBucket;

function throwSupabaseError(error) {
  if (error) throw new Error(error.message || 'Supabase request failed. Check the project key and row-level security policies.');
}

export async function upsertCloudStoreItem({ id, slotType, payload, imageDataUrl, imagePath: providedImagePath }) {
  if (!isSupabaseConfigured || !supabase) return null;
  const cloudPayload = { ...payload };
  delete cloudPayload.imageDataUrl;
  const response = await fetch('/api/admin/store-items', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id, slotType, payload: cloudPayload, imageDataUrl: imageDataUrl || null, imagePath: providedImagePath || null }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not sync this item to Supabase.');
  return result;
}

export async function deleteCloudStoreItem(id) {
  if (!isSupabaseConfigured || !supabase) return;
  const response = await fetch('/api/admin/store-items', { method: 'DELETE', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not remove this item from Supabase.');
}

export async function deleteCloudDefaultItems() {
  if (!isSupabaseConfigured || !supabase) return;
  const response = await fetch('/api/admin/store-items', { method: 'DELETE', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ restoreDefaults: true }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not restore the default catalogue in Supabase.');
}

export async function fetchCloudStoreItems() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from('store_items').select('id,slot_type,payload,image_path,image_url,updated_at').order('updated_at', { ascending: false });
  throwSupabaseError(error);
  const result = { customStoreItems: [], catalogOverrides: { hiddenProductIds: [], productOverrides: {} }, homePageImages: {} };
  for (const row of data || []) {
    const payload = row.payload || {};
    if (row.slot_type === 'home_photo') {
      if (row.image_url) result.homePageImages[row.id] = row.image_url;
      continue;
    }
    if (row.slot_type === 'product' && payload.source === 'default') {
      if (payload.deleted) result.catalogOverrides.hiddenProductIds.push(row.id);
      else if (payload.override) result.catalogOverrides.productOverrides[row.id] = { ...payload.override, ...(row.image_url ? { image: row.image_url } : {}) };
      continue;
    }
    result.customStoreItems.push({ ...payload, id: row.id, imageDataUrl: row.image_url || payload.imageDataUrl || '' });
  }
  return result;
}

export async function insertCloudOrder(order) {
  if (!isSupabaseConfigured || !supabase) return null;
  const response = await fetch('/api/store/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(order) });
  if (!response.ok) throw new Error('Could not sync order to Supabase.');
  return order;
}

export async function insertCloudSubscriber(subscriber) {
  if (!isSupabaseConfigured || !supabase) return null;
  const response = await fetch('/api/store/subscribers', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(subscriber) });
  if (!response.ok) throw new Error('Could not sync newsletter sign-up to Supabase.');
  return subscriber;
}

export async function fetchCloudAdminData() {
  if (!isSupabaseConfigured) return null;
  const response = await fetch('/api/admin/store-data', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load Supabase orders and newsletter sign-ups.');
  return response.json();
}

const seededAnalytics = {
  orders: [
    {
      id: 'sample-order-001',
      orderRef: '#INS-101',
      productName: 'Women’s Everyday Cotton Tee',
      category: 'Women',
      size: 'M',
      priceRwf: 12000,
      customerName: 'Ange Uwase',
      customerEmail: 'ange.uwase@example.com',
      eventType: 'whatsapp_order',
      paymentMethod: 'WhatsApp / MTN MoMo',
      status: 'Pending MoMo',
      timestamp: '2026-11-05T10:25:00.000Z',
    },
    {
      id: 'sample-order-002',
      orderRef: '#INS-102',
      productName: 'Men’s Kigali Graphic Tee',
      category: 'Men',
      size: 'L',
      priceRwf: 12000,
      customerName: 'Eric Murenzi',
      customerEmail: 'eric.murenzi@example.com',
      eventType: 'add_to_bag',
      paymentMethod: 'Not selected',
      status: 'Pending',
      timestamp: '2026-11-07T14:10:00.000Z',
    },
    {
      id: 'sample-order-003',
      orderRef: '#INS-103',
      productName: 'Women’s Imena Occasion Set',
      category: 'Women',
      size: 'S',
      priceRwf: 45000,
      customerName: 'Diane Mukamana',
      customerEmail: 'diane.mukamana@example.com',
      eventType: 'checkout',
      paymentMethod: 'MTN MoMo',
      status: 'Pending',
      timestamp: '2026-11-10T08:40:00.000Z',
    },
  ],
  registeredUsers: [
    { id: 'sample-user-001', fullName: 'Ange Uwase', email: 'ange.uwase@example.com', stylePreference: 'WOMEN', joinDate: '2026-10-18T09:00:00.000Z' },
    { id: 'sample-user-002', fullName: 'Eric Murenzi', email: 'eric.murenzi@example.com', stylePreference: 'MEN', joinDate: '2026-10-24T13:30:00.000Z' },
    { id: 'sample-user-003', fullName: 'Diane Mukamana', email: 'diane.mukamana@example.com', stylePreference: 'WOMEN', joinDate: '2026-11-02T11:15:00.000Z' },
  ],
  newsletterSubscribers: [
    { id: 'sample-subscriber-001', email: 'ange.uwase@example.com', timestamp: '2026-11-04T07:50:00.000Z' },
    { id: 'sample-subscriber-002', email: 'diane.mukamana@example.com', timestamp: '2026-11-08T16:20:00.000Z' },
  ],
  activitySessions: [
    {
      id: 'sample-session-001',
      visitorName: 'Ange Uwase',
      visitorEmail: 'ange.uwase@example.com',
      startedAt: '2026-11-11T09:00:00.000Z',
      lastSeenAt: '2026-11-11T09:04:20.000Z',
      activeSeconds: 260,
      pages: [
        { label: 'Home', path: '/', timestamp: '2026-11-11T09:00:00.000Z' },
        { label: 'Shop (Women)', path: '/shop', timestamp: '2026-11-11T09:01:10.000Z' },
        { label: 'Product Quick-View', path: '/shop', timestamp: '2026-11-11T09:02:05.000Z' },
        { label: 'Bag', path: '/shop', timestamp: '2026-11-11T09:03:10.000Z' },
      ],
      frictionEvents: [],
    },
    {
      id: 'sample-session-002',
      visitorName: 'Guest Visitor',
      visitorEmail: '',
      startedAt: '2026-11-12T13:20:00.000Z',
      lastSeenAt: '2026-11-12T13:22:40.000Z',
      activeSeconds: 160,
      pages: [
        { label: 'Home', path: '/', timestamp: '2026-11-12T13:20:00.000Z' },
        { label: 'Shop (Men)', path: '/shop', timestamp: '2026-11-12T13:21:00.000Z' },
      ],
      frictionEvents: [
        { label: 'Add to Bag', detail: "Clicked 'Add to Bag' without selecting a size", timestamp: '2026-11-12T13:22:15.000Z' },
      ],
    },
  ],
  customStoreItems: [],
  catalogOverrides: { hiddenProductIds: [], productOverrides: {} },
  homePageImages: {},
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneSeed() {
  const seed = JSON.parse(JSON.stringify(seededAnalytics));
  seed.activitySessions = seed.activitySessions.map(normalizeActivitySession);
  return seed;
}

function activityDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((entry) => entry.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getActivityDateKey(value) {
  return activityDateKey(value || new Date());
}

function normalizeActivitySession(session) {
  return {
    ...session,
    dateKey: session.dateKey || activityDateKey(session.lastSeenAt || session.startedAt),
    visitCount: Math.max(1, Number(session.visitCount) || 1),
  };
}

export function groupActivitySessionsByDay(sessions = []) {
  const groups = new Map();
  for (const rawSession of sessions) {
    const session = normalizeActivitySession(rawSession);
    const visitorKey = session.visitorEmail
      ? `email:${session.visitorEmail.trim().toLowerCase()}`
      : session.visitorId
        ? `visitor:${session.visitorId}`
        : session.visitorName !== 'Guest Visitor'
          ? `name:${session.visitorName.trim().toLowerCase()}`
          : `session:${session.id}`;
    const key = `${visitorKey}::${session.dateKey}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        ...session,
        id: `daily:${key}`,
        visitorKey,
        sessionIds: [],
        activeSeconds: 0,
        visitCount: 0,
        pages: [],
        frictionEvents: [],
      };
      groups.set(key, group);
    }

    group.sessionIds.push(session.id);
    group.activeSeconds += Number(session.activeSeconds) || 0;
    group.visitCount += Math.max(1, Number(session.visitCount) || 1);
    if (session.startedAt < group.startedAt) group.startedAt = session.startedAt;
    if (session.lastSeenAt > group.lastSeenAt) {
      group.lastSeenAt = session.lastSeenAt;
      group.visitorName = session.visitorName;
      group.visitorEmail = session.visitorEmail;
    }

    const pageMap = new Map(group.pages.map((page) => [`${page.label}::${page.path}`, page]));
    for (const page of session.pages || []) {
      if (isSectionAnchor(page.label)) continue;
      const label = cleanPageLabel(page.label);
      const pageKey = `${label}::${page.path}`;
      const previous = pageMap.get(pageKey);
      pageMap.set(pageKey, {
        label,
        path: page.path,
        timestamp: !previous || page.timestamp > previous.timestamp ? page.timestamp : previous.timestamp,
        visits: (previous?.visits || 0) + (page.visits || 1),
      });
    }
    group.pages = Array.from(pageMap.values());

    const frictionMap = new Map(group.frictionEvents.map((event) => [`${event.label}::${event.detail}`, event]));
    for (const event of session.frictionEvents || []) {
      const eventKey = `${event.label}::${event.detail}`;
      const previous = frictionMap.get(eventKey);
      frictionMap.set(eventKey, {
        ...event,
        timestamp: !previous || event.timestamp > previous.timestamp ? event.timestamp : previous.timestamp,
        count: (previous?.count || 0) + (event.count || 1),
      });
    }
    group.frictionEvents = Array.from(frictionMap.values());
  }

  return Array.from(groups.values()).sort((left, right) =>
    right.dateKey.localeCompare(left.dateKey) || right.lastSeenAt.localeCompare(left.lastSeenAt));
}

export function getStoreAnalytics() {
  if (typeof window === 'undefined') return cloneSeed();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const storedCustomItems = window.localStorage.getItem(CUSTOM_STORE_ITEMS_KEY);
      const customStoreItems = storedCustomItems
        ? JSON.parse(storedCustomItems)
        : (Array.isArray(parsed.customStoreItems) ? parsed.customStoreItems : []);
      const storedHomePageImages = window.localStorage.getItem(HOME_PAGE_IMAGES_KEY);
      const homePageImages = storedHomePageImages
        ? JSON.parse(storedHomePageImages)
        : (parsed.homePageImages && typeof parsed.homePageImages === 'object' ? parsed.homePageImages : {});
      if (!storedCustomItems && customStoreItems.length) window.localStorage.setItem(CUSTOM_STORE_ITEMS_KEY, JSON.stringify(customStoreItems));
      if (!storedHomePageImages && Object.keys(homePageImages).length) window.localStorage.setItem(HOME_PAGE_IMAGES_KEY, JSON.stringify(homePageImages));
      return {
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        registeredUsers: Array.isArray(parsed.registeredUsers) ? parsed.registeredUsers : [],
        newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers) ? parsed.newsletterSubscribers : [],
        activitySessions: (Array.isArray(parsed.activitySessions) ? parsed.activitySessions : cloneSeed().activitySessions).map(normalizeActivitySession),
        customStoreItems: Array.isArray(customStoreItems) ? customStoreItems : [],
        catalogOverrides: parsed.catalogOverrides && typeof parsed.catalogOverrides === 'object'
          ? { hiddenProductIds: Array.isArray(parsed.catalogOverrides.hiddenProductIds) ? parsed.catalogOverrides.hiddenProductIds : [], productOverrides: parsed.catalogOverrides.productOverrides && typeof parsed.catalogOverrides.productOverrides === 'object' ? parsed.catalogOverrides.productOverrides : {} }
          : { hiddenProductIds: [], productOverrides: {} },
        homePageImages,
      };
    }

    const initialData = cloneSeed();
    const { customStoreItems, homePageImages, ...coreData } = initialData;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coreData));
    window.localStorage.setItem(CUSTOM_STORE_ITEMS_KEY, JSON.stringify(customStoreItems));
    window.localStorage.setItem(HOME_PAGE_IMAGES_KEY, JSON.stringify(homePageImages));
    return initialData;
  } catch {
    return cloneSeed();
  }
}

function saveStoreAnalytics(data) {
  if (typeof window === 'undefined') return;
  try {
    const productData = JSON.stringify(data.customStoreItems || []);
    if (window.localStorage.getItem(CUSTOM_STORE_ITEMS_KEY) !== productData) {
      window.localStorage.setItem(CUSTOM_STORE_ITEMS_KEY, productData);
    }
    const homePageImageData = JSON.stringify(data.homePageImages || {});
    if (window.localStorage.getItem(HOME_PAGE_IMAGES_KEY) !== homePageImageData) {
      window.localStorage.setItem(HOME_PAGE_IMAGES_KEY, homePageImageData);
    }
    const { customStoreItems, homePageImages, ...coreData } = data;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coreData));
  } catch {
    // Keep the shopping flow working if browser storage is unavailable.
  }
}

export function logStoreOrder(order) {
  const analytics = getStoreAnalytics();
  const needsReference = order.eventType === 'whatsapp_order' || order.eventType === 'checkout';
  const entry = {
    ...order,
    id: createId('order'),
    ...(order.orderRef || needsReference ? { orderRef: order.orderRef || generateOrderReference() } : {}),
    paymentMethod: order.paymentMethod || (order.eventType === 'whatsapp_order' ? 'WhatsApp / MTN MoMo' : order.eventType === 'add_to_bag' ? 'Not selected' : 'Card'),
    status: order.status || (order.eventType === 'whatsapp_order' ? 'Pending MoMo' : 'Pending'),
    timestamp: new Date().toISOString(),
  };
  analytics.orders.unshift(entry);
  saveStoreAnalytics(analytics);
  if (isSupabaseConfigured) void insertCloudOrder(entry).catch((error) => console.error('Supabase order sync failed:', error));
  return entry;
}

export function generateOrderReference() {
  const analytics = getStoreAnalytics();
  const latestNumber = analytics.orders.reduce((latest, order) => {
    const match = order.orderRef?.match(/^#INS-(\d+)$/);
    return match ? Math.max(latest, Number(match[1])) : latest;
  }, 100);
  let reservedNumber = latestNumber;
  if (typeof window !== 'undefined') {
    try {
      reservedNumber = Math.max(latestNumber, Number(window.localStorage.getItem('inshuti-order-reference-counter')) || 100);
      window.localStorage.setItem('inshuti-order-reference-counter', String(reservedNumber + 1));
    } catch {
      // The order can still continue if local storage is unavailable.
    }
  }
  return `#INS-${reservedNumber + 1}`;
}

export function logCompletedCheckout(order) {
  return logStoreOrder({ ...order, eventType: 'checkout' });
}

export function updateStoreOrderStatus(orderId, status) {
  const analytics = getStoreAnalytics();
  const order = analytics.orders.find((entry) => entry.id === orderId);
  if (!order) return null;
  analytics.orders.forEach((entry) => {
    if (entry.id === orderId || (order.orderRef && entry.orderRef === order.orderRef)) entry.status = status;
  });
  saveStoreAnalytics(analytics);
  return order;
}

export function logRegisteredUser(user) {
  const analytics = getStoreAnalytics();
  const normalizedEmail = user.email.trim().toLowerCase();
  const existingIndex = analytics.registeredUsers.findIndex((entry) => entry.email.toLowerCase() === normalizedEmail);
  const timestamp = new Date().toISOString();

  if (existingIndex >= 0) {
    analytics.registeredUsers[existingIndex] = {
      ...analytics.registeredUsers[existingIndex],
      fullName: user.fullName.trim(),
      stylePreference: user.stylePreference,
      lastSignInAt: timestamp,
    };
    saveStoreAnalytics(analytics);
    return analytics.registeredUsers[existingIndex];
  }

  const entry = {
    id: createId('user'),
    fullName: user.fullName.trim(),
    email: normalizedEmail,
    stylePreference: user.stylePreference,
    joinDate: timestamp,
  };
  analytics.registeredUsers.unshift(entry);
  saveStoreAnalytics(analytics);
  return entry;
}

export function logNewsletterSubscriber(email) {
  const analytics = getStoreAnalytics();
  const normalizedEmail = email.trim().toLowerCase();
  const existing = analytics.newsletterSubscribers.find((entry) => entry.email.toLowerCase() === normalizedEmail);
  if (existing) return existing;

  const entry = { id: createId('subscriber'), email: normalizedEmail, timestamp: new Date().toISOString() };
  analytics.newsletterSubscribers.unshift(entry);
  saveStoreAnalytics(analytics);
  if (isSupabaseConfigured) void insertCloudSubscriber(entry).catch((error) => console.error('Supabase subscriber sync failed:', error));
  return entry;
}

function currentActivitySessionId() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACTIVITY_SESSION_KEY);
}

function storedActivityProfile() {
  if (typeof window === 'undefined') return null;
  try {
    const profile = JSON.parse(window.localStorage.getItem('inshuti-shop-profile') || 'null');
    return profile ? { name: profile.name, email: profile.email } : null;
  } catch {
    return null;
  }
}

function ensureActivitySession(profile) {
  if (typeof window === 'undefined') return null;
  const sessionId = currentActivitySessionId();
  const existing = sessionId && getStoreAnalytics().activitySessions.find((entry) => entry.id === sessionId);
  return existing && existing.dateKey === activityDateKey() ? existing : startActivitySession(profile || storedActivityProfile());
}

function isSectionAnchor(label) {
  return /^(Home|Shop(?:\s|\())/.test(label) && /\s\/\s/.test(label) && !label.startsWith('Product: ');
}

function cleanPageLabel(label) {
  return label.replace(/^Shop\s*\((Women|Men)\)$/i, 'Shop $1');
}

export function startActivitySession(profile) {
  if (typeof window === 'undefined') return null;
  const analytics = getStoreAnalytics();
  const savedId = currentActivitySessionId();
  const existing = savedId && analytics.activitySessions.find((session) => session.id === savedId);
  const visitorName = profile?.name?.trim() || 'Guest Visitor';
  const visitorEmail = profile?.email?.trim().toLowerCase() || '';
  const dateKey = activityDateKey();
  const visitorId = existing?.visitorId || getOrCreateActivityVisitorId();

  if (profile && (visitorName !== 'Guest Visitor' || visitorEmail)) {
    analytics.activitySessions.forEach((session) => {
      if (session.visitorId === visitorId) {
        session.visitorName = visitorName;
        session.visitorEmail = visitorEmail;
      }
    });
  }

  if (existing && existing.dateKey === dateKey) {
    existing.visitorName = visitorName;
    existing.visitorEmail = visitorEmail;
    existing.lastSeenAt = new Date().toISOString();
    saveStoreAnalytics(analytics);
    return existing;
  }

  const timestamp = new Date().toISOString();
  const session = {
    id: createId('session'),
    visitorId,
    visitorName,
    visitorEmail,
    startedAt: timestamp,
    lastSeenAt: timestamp,
    dateKey,
    visitCount: 1,
    activeSeconds: 0,
    pages: [],
    frictionEvents: [],
  };
  window.sessionStorage.setItem(ACTIVITY_SESSION_KEY, session.id);
  analytics.activitySessions.unshift(session);
  saveStoreAnalytics(analytics);
  return session;
}

function getOrCreateActivityVisitorId() {
  if (typeof window === 'undefined') return '';
  try {
    let visitorId = window.localStorage.getItem(ACTIVITY_VISITOR_KEY);
    if (!visitorId) {
      visitorId = createId('visitor');
      window.localStorage.setItem(ACTIVITY_VISITOR_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return createId('visitor');
  }
}

export function updateActivityIdentity(name, email) {
  if (typeof window === 'undefined') return;
  const session = ensureActivitySession({ name, email });
  if (!session) return;
  const analytics = getStoreAnalytics();
  const storedSession = analytics.activitySessions.find((entry) => entry.id === session.id);
  if (!storedSession) return;
  const visitorName = name.trim() || 'Guest Visitor';
  const visitorEmail = email.trim().toLowerCase();
  analytics.activitySessions.forEach((entry) => {
    if (storedSession.visitorId && entry.visitorId === storedSession.visitorId) {
      entry.visitorName = visitorName;
      entry.visitorEmail = visitorEmail;
    }
  });
  storedSession.lastSeenAt = new Date().toISOString();
  saveStoreAnalytics(analytics);
}

export function recordActivityPage(label, path) {
  if (typeof window === 'undefined' || isSectionAnchor(label)) return;
  label = cleanPageLabel(label);
  const activeSession = ensureActivitySession();
  if (!activeSession) return;
  const analytics = getStoreAnalytics();
  const session = analytics.activitySessions.find((entry) => entry.id === activeSession.id);
  if (!session) return;
  const timestamp = new Date().toISOString();
  const pageCounts = new Map();
  session.pages.forEach((page) => {
    if (isSectionAnchor(page.label)) return;
    const normalizedLabel = cleanPageLabel(page.label);
    const key = `${normalizedLabel}::${page.path}`;
    const existing = pageCounts.get(key);
    pageCounts.set(key, {
      label: normalizedLabel,
      path: page.path,
      visits: (existing?.visits || 0) + (page.visits || 1),
      timestamp: !existing || page.timestamp > existing.timestamp ? page.timestamp : existing.timestamp,
    });
  });
  const currentKey = `${label}::${path}`;
  const currentPage = pageCounts.get(currentKey);
  pageCounts.set(currentKey, {
    label,
    path,
    visits: (currentPage?.visits || 0) + 1,
    timestamp,
  });
  session.pages = Array.from(pageCounts.values());
  session.lastSeenAt = timestamp;
  saveStoreAnalytics(analytics);
}

export function recordActiveTime(seconds = 10) {
  if (typeof window === 'undefined') return;
  const activeSession = ensureActivitySession();
  if (!activeSession) return;
  const analytics = getStoreAnalytics();
  const session = analytics.activitySessions.find((entry) => entry.id === activeSession.id);
  if (!session) return;
  session.activeSeconds += seconds;
  session.lastSeenAt = new Date().toISOString();
  saveStoreAnalytics(analytics);
}

export function recordActivityFriction(label, detail) {
  if (typeof window === 'undefined') return;
  const activeSession = ensureActivitySession();
  if (!activeSession) return;
  const analytics = getStoreAnalytics();
  const session = analytics.activitySessions.find((entry) => entry.id === activeSession.id);
  if (!session) return;
  const timestamp = new Date().toISOString();
  const existing = session.frictionEvents.find((event) => event.label === label && event.detail === detail);
  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.timestamp = timestamp;
  } else {
    session.frictionEvents.push({ label, detail, timestamp, count: 1 });
  }
  session.lastSeenAt = timestamp;
  saveStoreAnalytics(analytics);
}

export function deleteActivitySession(sessionId) {
  deleteActivitySessions([sessionId]);
}

export function deleteActivitySessions(sessionIds) {
  if (typeof window === 'undefined') return;
  const deletedIds = new Set(sessionIds);
  const analytics = getStoreAnalytics();
  analytics.activitySessions = analytics.activitySessions.filter((session) => !deletedIds.has(session.id));
  if (deletedIds.has(currentActivitySessionId())) window.sessionStorage.removeItem(ACTIVITY_SESSION_KEY);
  saveStoreAnalytics(analytics);
}

export function clearActivitySessions() {
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.activitySessions = [];
  window.sessionStorage.removeItem(ACTIVITY_SESSION_KEY);
  saveStoreAnalytics(analytics);
}

export function saveStoreProduct(product) {
  if (typeof window === 'undefined') throw new Error('Products can only be published from the browser.');
  const analytics = getStoreAnalytics();
  const existing = analytics.customStoreItems.find((entry) => entry.id === product.id);
  const timestamp = new Date().toISOString();
  const savedProduct = {
    ...product,
    createdAt: product.createdAt || existing?.createdAt || timestamp,
    updatedAt: timestamp,
  };
  analytics.customStoreItems = existing
    ? analytics.customStoreItems.map((entry) => entry.id === product.id ? savedProduct : entry)
    : [savedProduct, ...analytics.customStoreItems];

  const serialized = JSON.stringify(analytics);
  if (serialized.length > 2000000) {
    throw new Error('Store image storage is nearly full. Delete an unused upload before publishing another image.');
  }
  try {
    window.localStorage.setItem(CUSTOM_STORE_ITEMS_KEY, JSON.stringify(analytics.customStoreItems));
  } catch {
    throw new Error('This upload exceeds the browser storage available. Try a smaller photo or delete unused uploads.');
  }
  return savedProduct;
}

export function deleteStoreProduct(productId) {
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.customStoreItems = analytics.customStoreItems.filter((entry) => entry.id !== productId);
  try {
    window.localStorage.setItem(CUSTOM_STORE_ITEMS_KEY, JSON.stringify(analytics.customStoreItems));
  } catch {
    // Deletion must not affect the store's other local analytics.
  }
}

export function saveDefaultProductOverride(productId, override) {
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.catalogOverrides = analytics.catalogOverrides || { hiddenProductIds: [], productOverrides: {} };
  analytics.catalogOverrides.hiddenProductIds = analytics.catalogOverrides.hiddenProductIds.filter((id) => id !== productId);
  analytics.catalogOverrides.productOverrides[productId] = { ...analytics.catalogOverrides.productOverrides[productId], ...override };
  saveStoreAnalytics(analytics);
}

export async function syncDefaultProductOverrideToCloud(productId, override) {
  if (!isSupabaseConfigured) return null;
  const payload = { source: 'default', override: { ...override } };
  const imageDataUrl = typeof payload.override.image === 'string' && payload.override.image.startsWith('data:') ? payload.override.image : null;
  if (imageDataUrl) delete payload.override.image;
  return upsertCloudStoreItem({ id: productId, slotType: 'product', payload, imageDataUrl });
}

export function deleteDefaultStoreProduct(productId) {
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.catalogOverrides = analytics.catalogOverrides || { hiddenProductIds: [], productOverrides: {} };
  if (!analytics.catalogOverrides.hiddenProductIds.includes(productId)) analytics.catalogOverrides.hiddenProductIds.push(productId);
  saveStoreAnalytics(analytics);
}

export async function deleteCloudDefaultStoreProduct(productId) {
  if (!isSupabaseConfigured || !supabase) return;
  await upsertCloudStoreItem({ id: productId, slotType: 'product', payload: { source: 'default', deleted: true } });
}

export function restoreDefaultStoreCatalog() {
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.catalogOverrides = { hiddenProductIds: [], productOverrides: {} };
  saveStoreAnalytics(analytics);
}

export async function restoreCloudDefaultStoreCatalog() {
  await deleteCloudDefaultItems();
}

function persistHomePageImages(analytics) {
  try {
    window.localStorage.setItem(HOME_PAGE_IMAGES_KEY, JSON.stringify(analytics.homePageImages || {}));
  } catch {
    throw new Error('There is not enough browser storage to save this home page photo. Try a smaller image.');
  }
}

export async function saveHomePageImage(slot, imageDataUrl) {
  if (typeof window === 'undefined') throw new Error('Home page photos can only be saved from the browser.');
  const analytics = getStoreAnalytics();
  const slotInfo = HOME_PAGE_IMAGE_SLOTS.find((entry) => entry.id === slot);
  const cloudRow = await upsertCloudStoreItem({
    id: slot,
    slotType: 'home_photo',
    payload: { label: slotInfo?.label || slot },
    imageDataUrl,
  });
  analytics.homePageImages = { ...(analytics.homePageImages || {}), [slot]: cloudRow?.image_url || imageDataUrl };
  persistHomePageImages(analytics);
}

export async function resetHomePageImage(slot) {
  if (typeof window === 'undefined') return;
  await deleteCloudStoreItem(slot);
  const analytics = getStoreAnalytics();
  const homePageImages = { ...(analytics.homePageImages || {}) };
  delete homePageImages[slot];
  analytics.homePageImages = homePageImages;
  persistHomePageImages(analytics);
}
