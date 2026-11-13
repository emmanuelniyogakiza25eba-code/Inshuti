export type StoreOrderEvent = 'add_to_bag' | 'whatsapp_order' | 'checkout';
export type OrderStatus = 'Pending' | 'Pending MoMo' | 'Paid / Sold' | 'Delivered';

export type StoreOrder = {
  id: string;
  productName: string;
  category: 'Men' | 'Women';
  size: string;
  priceRwf: number;
  customerName: string;
  customerEmail: string;
  eventType: StoreOrderEvent;
  paymentMethod?: string;
  status?: OrderStatus;
  orderRef?: string;
  backupSizes?: string[];
  fittingRequested?: boolean;
  fittingFeeRwf?: number;
  totalPriceRwf?: number;
  timestamp: string;
};

export type StoreProductSection = 'Hero Banner' | 'The Latest Drops' | 'Kigali Everyday Essentials' | 'Limited Editions & Event Wear' | 'Footwear & Accessories';
export type StoreProductDepartment = 'Men' | 'Women' | 'Both';
export type StoreProductRecord = {
  id: string;
  title: string;
  subtitle: string;
  department: StoreProductDepartment;
  section: StoreProductSection;
  color: string;
  priceRwf: number;
  oldPriceRwf?: number;
  availableSizes: string[];
  limitedOffer: boolean;
  productType?: 'Clothing' | 'Shoes';
  imageDataUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type DefaultStoreProductOverride = {
  name?: string;
  type?: string;
  color?: string;
  price?: number;
  oldPrice?: number;
  department?: 'WOMEN' | 'MEN';
  section?: Exclude<StoreProductSection, 'Hero Banner'>;
  availableSizes?: string[];
  limitedOffer?: boolean;
  image?: string;
  productKind?: 'Clothing' | 'Shoes';
};
export type StoreCatalogOverrides = {
  hiddenProductIds: string[];
  productOverrides: Record<string, DefaultStoreProductOverride>;
};

export type RegisteredStoreUser = {
  id: string;
  fullName: string;
  email: string;
  stylePreference: 'MEN' | 'WOMEN';
  joinDate: string;
  lastSignInAt?: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  timestamp: string;
};

export type ActivityPage = { label: string; path: string; timestamp: string; visits?: number };
export type ActivityFrictionEvent = { label: string; detail: string; timestamp: string; count?: number };
export type ActivitySession = {
  id: string;
  visitorName: string;
  visitorEmail: string;
  startedAt: string;
  lastSeenAt: string;
  activeSeconds: number;
  pages: ActivityPage[];
  frictionEvents: ActivityFrictionEvent[];
};

export type StoreAnalytics = {
  orders: StoreOrder[];
  registeredUsers: RegisteredStoreUser[];
  newsletterSubscribers: NewsletterSubscriber[];
  activitySessions: ActivitySession[];
  customStoreItems: StoreProductRecord[];
  catalogOverrides: StoreCatalogOverrides;
};

export function getStoreAnalytics(): StoreAnalytics;
export function logStoreOrder(order: Omit<StoreOrder, 'id' | 'timestamp'>): StoreOrder;
export function logCompletedCheckout(order: Omit<StoreOrder, 'id' | 'timestamp' | 'eventType'>): StoreOrder;
export function generateOrderReference(): string;
export function updateStoreOrderStatus(orderId: string, status: OrderStatus): StoreOrder | null;
export function logRegisteredUser(user: Omit<RegisteredStoreUser, 'id' | 'joinDate' | 'lastSignInAt'>): RegisteredStoreUser;
export function logNewsletterSubscriber(email: string): NewsletterSubscriber;
export function startActivitySession(profile?: { name?: string; email?: string } | null): ActivitySession | null;
export function updateActivityIdentity(name: string, email: string): void;
export function recordActivityPage(label: string, path: string): void;
export function recordActiveTime(seconds?: number): void;
export function recordActivityFriction(label: string, detail: string): void;
export function deleteActivitySession(sessionId: string): void;
export function clearActivitySessions(): void;
export function saveStoreProduct(product: Omit<StoreProductRecord, 'createdAt' | 'updatedAt'> & { createdAt?: string }): StoreProductRecord;
export function deleteStoreProduct(productId: string): void;
export function saveDefaultProductOverride(productId: string, override: DefaultStoreProductOverride): void;
export function deleteDefaultStoreProduct(productId: string): void;
export function restoreDefaultStoreCatalog(): void;
