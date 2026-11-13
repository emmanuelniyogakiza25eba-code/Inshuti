const STORAGE_KEY = 'inshuti-store-analytics';
const CUSTOM_STORE_ITEMS_KEY = 'inshuti-store-products';
const ACTIVITY_SESSION_KEY = 'inshuti-activity-session-id';

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
};

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneSeed() {
  return JSON.parse(JSON.stringify(seededAnalytics));
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
      if (!storedCustomItems && customStoreItems.length) window.localStorage.setItem(CUSTOM_STORE_ITEMS_KEY, JSON.stringify(customStoreItems));
      return {
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        registeredUsers: Array.isArray(parsed.registeredUsers) ? parsed.registeredUsers : [],
        newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers) ? parsed.newsletterSubscribers : [],
        activitySessions: Array.isArray(parsed.activitySessions) ? parsed.activitySessions : cloneSeed().activitySessions,
        customStoreItems: Array.isArray(customStoreItems) ? customStoreItems : [],
        catalogOverrides: parsed.catalogOverrides && typeof parsed.catalogOverrides === 'object'
          ? { hiddenProductIds: Array.isArray(parsed.catalogOverrides.hiddenProductIds) ? parsed.catalogOverrides.hiddenProductIds : [], productOverrides: parsed.catalogOverrides.productOverrides && typeof parsed.catalogOverrides.productOverrides === 'object' ? parsed.catalogOverrides.productOverrides : {} }
          : { hiddenProductIds: [], productOverrides: {} },
      };
    }

    const initialData = cloneSeed();
    const { customStoreItems, ...coreData } = initialData;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(coreData));
    window.localStorage.setItem(CUSTOM_STORE_ITEMS_KEY, JSON.stringify(customStoreItems));
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
    const { customStoreItems, ...coreData } = data;
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
  return existing ? existing : startActivitySession(profile || storedActivityProfile());
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

  if (existing) {
    existing.visitorName = visitorName;
    existing.visitorEmail = visitorEmail;
    existing.lastSeenAt = new Date().toISOString();
    saveStoreAnalytics(analytics);
    return existing;
  }

  const timestamp = new Date().toISOString();
  const session = {
    id: createId('session'),
    visitorName,
    visitorEmail,
    startedAt: timestamp,
    lastSeenAt: timestamp,
    activeSeconds: 0,
    pages: [],
    frictionEvents: [],
  };
  window.sessionStorage.setItem(ACTIVITY_SESSION_KEY, session.id);
  analytics.activitySessions.unshift(session);
  saveStoreAnalytics(analytics);
  return session;
}

export function updateActivityIdentity(name, email) {
  if (typeof window === 'undefined') return;
  const session = ensureActivitySession({ name, email });
  if (!session) return;
  const analytics = getStoreAnalytics();
  const storedSession = analytics.activitySessions.find((entry) => entry.id === session.id);
  if (!storedSession) return;
  storedSession.visitorName = name.trim() || 'Guest Visitor';
  storedSession.visitorEmail = email.trim().toLowerCase();
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
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.activitySessions = analytics.activitySessions.filter((session) => session.id !== sessionId);
  if (currentActivitySessionId() === sessionId) window.sessionStorage.removeItem(ACTIVITY_SESSION_KEY);
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

export function deleteDefaultStoreProduct(productId) {
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.catalogOverrides = analytics.catalogOverrides || { hiddenProductIds: [], productOverrides: {} };
  if (!analytics.catalogOverrides.hiddenProductIds.includes(productId)) analytics.catalogOverrides.hiddenProductIds.push(productId);
  saveStoreAnalytics(analytics);
}

export function restoreDefaultStoreCatalog() {
  if (typeof window === 'undefined') return;
  const analytics = getStoreAnalytics();
  analytics.catalogOverrides = { hiddenProductIds: [], productOverrides: {} };
  saveStoreAnalytics(analytics);
}
