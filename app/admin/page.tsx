'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ImagePlus, LockKeyhole, LogOut, Pencil, Search, Trash2, TrendingUp, Users, Wallet, Shirt } from 'lucide-react';
import { HOME_PAGE_IMAGE_SLOTS, clearActivitySessions, deleteActivitySession, deleteCloudDefaultStoreProduct, deleteCloudStoreItem, deleteDefaultStoreProduct, deleteStoreProduct, fetchCloudAdminData, fetchCloudStoreItems, getStoreAnalytics, isSupabaseConfigured, resetHomePageImage, restoreCloudDefaultStoreCatalog, restoreDefaultStoreCatalog, saveDefaultProductOverride, saveHomePageImage, saveStoreProduct, syncDefaultProductOverrideToCloud, updateStoreOrderStatus, upsertCloudStoreItem, type ActivitySession, type DefaultStoreProductOverride, type HomePageImageSlot, type OrderStatus, type StoreAnalytics, type StoreOrder, type StoreProductDepartment, type StoreProductSection } from '@/src/utils/storeAnalytics';
import { defaultStoreProducts } from '@/src/utils/defaultStoreCatalog';
import InshutiLogo from '@/src/components/InshutiLogo';

const OWNER_ADMIN_PASSWORD = 'INSHUTI2026';
const ADMIN_SESSION_KEY = 'inshuti-admin-session';
const emptyAnalytics: StoreAnalytics = { orders: [], registeredUsers: [], newsletterSubscribers: [], activitySessions: [], customStoreItems: [], catalogOverrides: { hiddenProductIds: [], productOverrides: {} }, homePageImages: {} };
const clothingSizes = ['S', 'M', 'L', 'XL', 'XXL'];
const shoeSizes = ['38', '39', '40', '41', '42', '43', '44', '45'];
type AdminCatalogItem = {
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
  imageDataUrl: string;
  productType: 'Clothing' | 'Shoes';
  source: 'uploaded' | 'default';
};
const storePlacementOptions: { value: StoreProductSection; label: string }[] = [
  { value: 'Hero Banner', label: 'Hero Banner (Top Featured Banner)' },
  { value: 'The Latest Drops', label: 'The Latest Drops' },
  { value: 'Kigali Everyday Essentials', label: 'Kigali Everyday Essentials' },
  { value: 'Limited Editions & Event Wear', label: 'Limited Editions & Event Wear' },
  { value: 'Footwear & Accessories', label: 'Footwear & Accessories' },
];

function compressStoreImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 900 / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not prepare this image. Please choose another photo.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.82);
      URL.revokeObjectURL(objectUrl);
      if (compressed.length > 1100000) {
        reject(new Error('This photo is still too large after compression. Choose a simpler or smaller image.'));
        return;
      }
      resolve(compressed);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('This photo could not be opened. Please choose another image.'));
    };
    image.src = objectUrl;
  });
}

function formatRwf(value: number) {
  return `RWF ${value.toLocaleString('en-US')}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-RW', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}m ${wholeSeconds % 60}s`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : (parts[0] || '').slice(0, 2).toUpperCase();
}

function activityPageBadges(session: ActivitySession) {
  const counts = new Map<string, number>();
  session.pages.forEach((page) => {
    if (/^(Home|Shop(?:\s|\())/.test(page.label) && /\s\/\s/.test(page.label) && !page.label.startsWith('Product: ')) return;
    const label = page.label.replace(/^Shop\s*\((Women|Men)\)$/i, 'Shop $1');
    counts.set(label, (counts.get(label) || 0) + (page.visits || 1));
  });
  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [analytics, setAnalytics] = useState<StoreAnalytics>(emptyAnalytics);
  const [adminTab, setAdminTab] = useState<'overview' | 'media' | 'activity' | 'customers'>('overview');
  const [activeMediaFolder, setActiveMediaFolder] = useState<string | null>(null);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaSearch, setMediaSearch] = useState('');
  const [modifyItem, setModifyItem] = useState<AdminCatalogItem | null>(null);
  const [modifyTitle, setModifyTitle] = useState('');
  const [modifyPrice, setModifyPrice] = useState('');
  const [modifySection, setModifySection] = useState<StoreProductSection>('The Latest Drops');
  const [modifyDepartment, setModifyDepartment] = useState<StoreProductDepartment>('Women');
  const [modifySizes, setModifySizes] = useState<string[]>([]);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const homePhotoInputRef = useRef<HTMLInputElement>(null);
  const homePhotoTargetRef = useRef<HomePageImageSlot | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<AdminCatalogItem | null>(null);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'friction'>('all');
  const [activityPage, setActivityPage] = useState(1);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductSource, setEditingProductSource] = useState<'uploaded' | 'default' | null>(null);
  const [productType, setProductType] = useState<'Clothing' | 'Shoes'>('Clothing');
  const [productTitle, setProductTitle] = useState('');
  const [productSubtitle, setProductSubtitle] = useState('');
  const [productDepartment, setProductDepartment] = useState<StoreProductDepartment>('Women');
  const [productSection, setProductSection] = useState<StoreProductSection>('The Latest Drops');
  const [productColor, setProductColor] = useState('Black');
  const [productPrice, setProductPrice] = useState('');
  const [productOldPrice, setProductOldPrice] = useState('');
  const [productSizes, setProductSizes] = useState<string[]>(clothingSizes);
  const [productLimitedOffer, setProductLimitedOffer] = useState(false);
  const [productImage, setProductImage] = useState('');
  const [productImageName, setProductImageName] = useState('');
  const [productFormError, setProductFormError] = useState('');
  const [productFormSuccess, setProductFormSuccess] = useState('');
  const [compressingImage, setCompressingImage] = useState(false);
  const [cloudSyncActive, setCloudSyncActive] = useState(false);

  useEffect(() => {
    let active = true;
    setAnalytics(getStoreAnalytics());
    if (isSupabaseConfigured) {
      fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' }).then((response) => response.json()).then((result) => {
        if (active) setIsUnlocked(Boolean(result.authenticated));
      }).catch(() => { if (active) setIsUnlocked(false); });
    } else {
      setIsUnlocked(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'unlocked');
    }
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) { setCloudSyncActive(false); return; }
    let active = true;
    fetch('/api/supabase/status', { cache: 'no-store' }).then((response) => response.json()).then((result) => {
      if (active) setCloudSyncActive(Boolean(result.active));
    }).catch(() => { if (active) setCloudSyncActive(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;
    void refreshAnalytics();
    const interval = window.setInterval(() => { void refreshAnalytics(); }, 10000);
    return () => window.clearInterval(interval);
  }, [isUnlocked]);

  const refreshAnalytics = async () => {
    const local = getStoreAnalytics();
    if (!isSupabaseConfigured) { setAnalytics(local); return; }
    try {
      const [catalogue, remoteAdmin] = await Promise.all([fetchCloudStoreItems(), isUnlocked ? fetchCloudAdminData() : Promise.resolve(null)]);
      setAnalytics({ ...local, ...(catalogue || {}), ...(remoteAdmin || {}) });
    } catch (error) {
      console.error('Supabase dashboard refresh failed:', error);
      if (!isSupabaseConfigured) setAnalytics(local);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSupabaseConfigured) {
      try {
        const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ password }) });
        const result = await response.json();
        if (!response.ok) { setLoginError(result.error || 'Could not unlock the dashboard.'); return; }
        setIsUnlocked(true);
        setPassword('');
        setLoginError('');
        return;
      } catch { setLoginError('Could not connect to the owner sign-in service.'); return; }
    }
    if (password !== OWNER_ADMIN_PASSWORD) {
      setLoginError('That password did not match. Try again.');
      return;
    }
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'unlocked');
    setIsUnlocked(true);
    setPassword('');
    setLoginError('');
  };

  const lockDashboard = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsUnlocked(false);
    setPassword('');
    if (isSupabaseConfigured) void fetch('/api/admin/session', { method: 'DELETE', credentials: 'same-origin' });
  };

  const confirmedSales = analytics.orders.filter((order) => order.eventType === 'checkout' || (order.eventType === 'whatsapp_order' && (order.status === 'Paid / Sold' || order.status === 'Delivered')));
  const catalogueItems = useMemo<AdminCatalogItem[]>(() => {
    const overrides = analytics.catalogOverrides || { hiddenProductIds: [], productOverrides: {} };
    const defaults: AdminCatalogItem[] = defaultStoreProducts
      .filter((product) => !overrides.hiddenProductIds.includes(product.id))
      .map((product) => {
        const changed = overrides.productOverrides[product.id] || {};
        const current = { ...product, ...changed };
        return {
          id: product.id,
          title: current.name,
          subtitle: current.type,
          department: current.department === 'MEN' ? 'Men' : 'Women',
          section: current.section,
          color: current.color,
          priceRwf: current.price,
          oldPriceRwf: current.oldPrice,
          availableSizes: current.availableSizes,
          limitedOffer: current.limitedOffer,
          imageDataUrl: current.image,
          productType: current.productKind,
          source: 'default',
        };
      });
    const uploads: AdminCatalogItem[] = analytics.customStoreItems.map((product) => ({
      ...product,
      productType: product.productType || (product.section === 'Footwear & Accessories' ? 'Shoes' : 'Clothing'),
      source: 'uploaded',
    }));
    return [...uploads, ...defaults];
  }, [analytics.catalogOverrides, analytics.customStoreItems]);
  const mediaItems = useMemo(() => catalogueItems.flatMap((item) => item.department === 'Both' && item.section !== 'Hero Banner'
    ? [{ ...item, folderDepartment: 'Women' as const }, { ...item, folderDepartment: 'Men' as const }]
    : [{ ...item, folderDepartment: item.department === 'Both' ? 'Women' as const : item.department }]), [catalogueItems]);
  const mediaFolderLabel = (item: (typeof mediaItems)[number]) => {
    if (item.section === 'Hero Banner') return 'Hero Banners';
    const sectionNames: Record<string, string> = {
      'The Latest Drops': 'The Latest Drops',
      'Kigali Everyday Essentials': 'Everyday Essentials',
      'Limited Editions & Event Wear': 'Event Wear',
      'Footwear & Accessories': 'Shoes',
    };
    return `${item.folderDepartment} · ${sectionNames[item.section] || item.section}`;
  };
  const mediaFolders = useMemo(() => {
    const labels = ['Hero Banners', 'Home Page Photos', 'Women · The Latest Drops', 'Women · Everyday Essentials', 'Women · Event Wear', 'Women · Shoes', 'Men · The Latest Drops', 'Men · Everyday Essentials', 'Men · Event Wear', 'Men · Shoes'];
    return [...labels.map((label) => ({ label, count: label === 'Home Page Photos' ? HOME_PAGE_IMAGE_SLOTS.length : mediaItems.filter((item) => mediaFolderLabel(item) === label).length })), { label: 'All Images', count: mediaItems.length }];
  }, [mediaItems]);
  const filteredMediaItems = useMemo(() => {
    const search = mediaSearch.trim().toLowerCase();
    return mediaItems.filter((item) => {
      const inFolder = !activeMediaFolder || activeMediaFolder === 'All Images' || mediaFolderLabel(item) === activeMediaFolder;
      const matchesSearch = !search || `${item.title} ${item.subtitle} ${item.color} ${item.section}`.toLowerCase().includes(search);
      return inFolder && matchesSearch;
    });
  }, [activeMediaFolder, mediaItems, mediaSearch]);
  const mediaPageCount = Math.max(1, Math.ceil(filteredMediaItems.length / 12));
  const pagedMediaItems = filteredMediaItems.slice((mediaPage - 1) * 12, mediaPage * 12);
  useEffect(() => setMediaPage(1), [activeMediaFolder, mediaSearch]);
  useEffect(() => setMediaPage((current) => Math.min(current, mediaPageCount)), [mediaPageCount]);
  const availableStoreSizes = productType === 'Shoes' ? shoeSizes : clothingSizes;
  const orderedItems = confirmedSales;
  const totalRevenue = confirmedSales.reduce((sum, order) => sum + (order.totalPriceRwf ?? order.priceRwf), 0);
  const totalItemsSold = confirmedSales.length;
  const customerAndSubscriberCount = analytics.registeredUsers.length + analytics.newsletterSubscribers.length;

  const productRanking = useMemo(() => {
    const products = new Map<string, { productName: string; size: string; units: number; revenueRwf: number }>();
    confirmedSales.forEach((order) => {
      const key = `${order.productName}::${order.size}`;
      const current = products.get(key) || { productName: order.productName, size: order.size, units: 0, revenueRwf: 0 };
      current.units += 1;
      current.revenueRwf += order.totalPriceRwf ?? order.priceRwf;
      products.set(key, current);
    });
    return Array.from(products.values()).sort((a, b) => b.units - a.units || b.revenueRwf - a.revenueRwf);
  }, [confirmedSales]);

  const bestSeller = useMemo(() => {
    const counts = new Map<string, number>();
    orderedItems.forEach((order) => counts.set(order.productName, (counts.get(order.productName) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No orders yet';
  }, [orderedItems]);

  const recentOrders = useMemo(() => analytics.orders
    .filter((order) => order.eventType !== 'add_to_bag')
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12), [analytics.orders]);

  const recentActivity = useMemo(() => analytics.activitySessions
    .slice()
    .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()), [analytics.activitySessions]);

  const filteredActivity = useMemo(() => {
    const search = activitySearch.trim().toLowerCase();
    return recentActivity.filter((session) => {
      const matchesSearch = !search || `${session.visitorName} ${session.visitorEmail}`.toLowerCase().includes(search);
      return matchesSearch && (activityFilter === 'all' || session.frictionEvents.length > 0);
    });
  }, [activityFilter, activitySearch, recentActivity]);
  const activityPageCount = Math.max(1, Math.ceil(filteredActivity.length / 10));
  const visibleActivity = filteredActivity.slice((activityPage - 1) * 10, activityPage * 10);
  const firstActivityResult = filteredActivity.length ? (activityPage - 1) * 10 + 1 : 0;
  const lastActivityResult = Math.min(activityPage * 10, filteredActivity.length);

  useEffect(() => setActivityPage((current) => Math.min(current, activityPageCount)), [activityPageCount]);

  const exportEmails = () => {
    const rows = [
      ['Email', 'Source', 'Date'],
      ...analytics.registeredUsers.map((user) => [user.email, 'Registered customer', user.joinDate]),
      ...analytics.newsletterSubscribers.map((subscriber) => [subscriber.email, 'Newsletter', subscriber.timestamp]),
    ];
    const uniqueRows = rows.slice(1).filter((row, index, allRows) => allRows.findIndex((other) => other[0].toLowerCase() === row[0].toLowerCase()) === index);
    const csv = [rows[0], ...uniqueRows].map((row) => row.map((cell) => csvCell(cell)).join(',')).join('\r\n');
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = 'inshuti-customer-emails.csv';
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  };

  const changeOrderStatus = async (order: StoreOrder) => {
    const nextStatus: OrderStatus = order.status === 'Pending MoMo' || order.status === 'Pending'
      ? 'Paid / Sold'
      : order.status === 'Paid / Sold' ? 'Delivered' : 'Pending MoMo';
    if (isSupabaseConfigured) {
      try {
        const response = await fetch('/api/admin/store-data', { method: 'PATCH', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ id: order.orderRef || order.id, status: nextStatus }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not update the order.');
      } catch (error) { setProductFormError(error instanceof Error ? error.message : 'Could not update the order status.'); return; }
    }
    updateStoreOrderStatus(order.id, nextStatus);
    refreshAnalytics();
  };

  const clearAllActivity = () => {
    if (!window.confirm('Clear all customer activity logs? This cannot be undone.')) return;
    clearActivitySessions();
    setActivityPage(1);
    refreshAnalytics();
  };

  const deleteActivity = (sessionId: string) => {
    deleteActivitySession(sessionId);
    refreshAnalytics();
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setEditingProductSource(null);
    setProductType('Clothing');
    setProductTitle('');
    setProductSubtitle('');
    setProductDepartment('Women');
    setProductSection('The Latest Drops');
    setProductColor('Black');
    setProductPrice('');
    setProductOldPrice('');
    setProductSizes(clothingSizes);
    setProductLimitedOffer(false);
    setProductImage('');
    setProductImageName('');
    setProductFormError('');
    setProductFormSuccess('');
  };

  const handleProductImage = async (file?: File) => {
    if (!file) return;
    setProductFormError('');
    setProductFormSuccess('');
    setCompressingImage(true);
    try {
      setProductImage(await compressStoreImage(file));
      setProductImageName(file.name);
    } catch (error) {
      setProductFormError(error instanceof Error ? error.message : 'Image compression failed.');
    } finally {
      setCompressingImage(false);
    }
  };

  const publishProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductFormError('');
    setProductFormSuccess('');
    const isHero = productSection === 'Hero Banner';
    const priceRwf = Number(productPrice) || 0;
    const oldPriceRwf = Number(productOldPrice) || undefined;
    if (!productTitle.trim()) return setProductFormError('Enter an item or banner title.');
    if (!productImage) return setProductFormError('Choose a photo before publishing.');
    if (!isHero && (!productSubtitle.trim() || !productColor.trim() || priceRwf <= 0 || !productSizes.length)) {
      return setProductFormError('Add the product category, color, a valid price, and at least one available size.');
    }

    const currentProduct = analytics.customStoreItems.find((product) => product.id === editingProductId);
    const id = editingProductId || `store-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      if (editingProductSource === 'default' && !isHero) {
        const override: DefaultStoreProductOverride = {
          name: productTitle.trim(), type: productSubtitle.trim(), color: productColor.trim(), price: priceRwf,
          oldPrice: oldPriceRwf,
          department: productDepartment === 'Men' ? 'MEN' : 'WOMEN',
          section: productSection as Exclude<StoreProductSection, 'Hero Banner'>,
          availableSizes: productSizes, limitedOffer: productLimitedOffer, image: productImage, productKind: productType,
        };
        await syncDefaultProductOverrideToCloud(id, override);
        saveDefaultProductOverride(id, override);
      } else {
        const item = {
          id,
          title: productTitle.trim(),
          subtitle: productSubtitle.trim(),
          department: productDepartment,
          section: productSection,
          color: productColor.trim(),
          priceRwf: isHero ? 0 : priceRwf,
          ...(oldPriceRwf ? { oldPriceRwf } : {}),
          availableSizes: isHero ? [] : productSizes,
          limitedOffer: isHero ? false : productLimitedOffer,
          productType,
          imageDataUrl: productImage,
          ...(currentProduct ? { createdAt: currentProduct.createdAt } : {}),
        };
        await upsertCloudStoreItem({ id, slotType: isHero ? 'hero_banner' : 'product', payload: item, imageDataUrl: productImage });
        saveStoreProduct(item);
      }
      refreshAnalytics();
      resetProductForm();
      setProductFormSuccess(isHero ? 'Hero banner published to the store.' : 'Product published to the top of its store section.');
    } catch (error) {
      setProductFormError(error instanceof Error ? error.message : 'The item could not be saved.');
    }
  };

  const removeProduct = async (product: AdminCatalogItem) => {
    if (!window.confirm(`Delete “${product.title}” from the store?`)) return;
    try {
      if (product.source === 'default') {
        await deleteCloudDefaultStoreProduct(product.id);
        deleteDefaultStoreProduct(product.id);
      } else {
        await deleteCloudStoreItem(product.id);
        deleteStoreProduct(product.id);
      }
    } catch (error) { setProductFormError(error instanceof Error ? error.message : 'The item could not be deleted.'); return; }
    if (editingProductId === product.id) resetProductForm();
    refreshAnalytics();
  };

  const restoreCatalogue = async () => {
    if (!window.confirm('Restore all original built-in clothes and shoes? This will undo default item edits and restore removed items. Uploaded items will remain.')) return;
    try { await restoreCloudDefaultStoreCatalog(); } catch (error) { setProductFormError(error instanceof Error ? error.message : 'The default catalogue could not be restored.'); return; }
    restoreDefaultStoreCatalog();
    if (editingProductSource === 'default') resetProductForm();
    refreshAnalytics();
  };

  const chooseProductType = (nextType: 'Clothing' | 'Shoes') => {
    setProductType(nextType);
    setProductSizes(nextType === 'Shoes' ? shoeSizes : clothingSizes);
    if (nextType === 'Shoes') setProductSection('Footwear & Accessories');
    else if (productSection === 'Footwear & Accessories') setProductSection('The Latest Drops');
  };

  const openModifyItem = (item: AdminCatalogItem) => {
    setModifyItem(item);
    setModifyTitle(item.title);
    setModifyPrice(String(item.priceRwf || ''));
    setModifySection(item.section);
    setModifyDepartment(item.department);
    setModifySizes(item.availableSizes || []);
  };

  const saveModifiedItem = async () => {
    if (!modifyItem || !modifyTitle.trim()) return;
    const price = Number(modifyPrice) || 0;
    try {
      if (modifyItem.source === 'default') {
        const override: DefaultStoreProductOverride = {
          name: modifyTitle.trim(), price, availableSizes: modifySizes,
          section: modifySection === 'Hero Banner' ? 'The Latest Drops' : modifySection,
          department: modifyDepartment === 'Men' ? 'MEN' : 'WOMEN',
        };
        await syncDefaultProductOverrideToCloud(modifyItem.id, override);
        saveDefaultProductOverride(modifyItem.id, override);
      } else {
        const original = analytics.customStoreItems.find((item) => item.id === modifyItem.id);
        if (!original) return;
        const updated = { ...original, title: modifyTitle.trim(), priceRwf: price, availableSizes: modifySizes, section: modifySection, department: modifyDepartment };
        await upsertCloudStoreItem({ id: updated.id, slotType: updated.section === 'Hero Banner' ? 'hero_banner' : 'product', payload: updated, imageDataUrl: updated.imageDataUrl });
        saveStoreProduct(updated);
      }
      refreshAnalytics();
      setModifyItem(null);
    } catch (error) {
      setProductFormError(error instanceof Error ? error.message : 'The item could not be updated.');
    }
  };

  const replacePhoto = async (file?: File) => {
    const target = replaceTarget;
    if (!file || !target) return;
    try {
      const imageDataUrl = await compressStoreImage(file);
      if (target.source === 'default') {
        await syncDefaultProductOverrideToCloud(target.id, { image: imageDataUrl });
        saveDefaultProductOverride(target.id, { image: imageDataUrl });
      }
      else {
        const original = analytics.customStoreItems.find((item) => item.id === target.id);
        if (original) {
          const updated = { ...original, imageDataUrl };
          await upsertCloudStoreItem({ id: target.id, slotType: updated.section === 'Hero Banner' ? 'hero_banner' : 'product', payload: updated, imageDataUrl });
          saveStoreProduct(updated);
        }
      }
      refreshAnalytics();
    } catch (error) {
      setProductFormError(error instanceof Error ? error.message : 'The replacement photo could not be saved.');
    } finally {
      setReplaceTarget(null);
    }
  };

  const replaceHomePagePhoto = async (file?: File) => {
    const target = homePhotoTargetRef.current;
    if (!file || !target) return;
    try {
      await saveHomePageImage(target, await compressStoreImage(file));
      refreshAnalytics();
    } catch (error) {
      setProductFormError(error instanceof Error ? error.message : 'The home page photo could not be saved.');
    } finally {
      homePhotoTargetRef.current = null;
    }
  };

  const resetHomePagePhoto = async (slot: HomePageImageSlot) => {
    try {
      await resetHomePageImage(slot);
      refreshAnalytics();
    } catch (error) {
      setProductFormError(error instanceof Error ? error.message : 'The default home page photo could not be restored.');
    }
  };

  useEffect(() => setActivityPage(1), [activityFilter, activitySearch]);

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-5 py-12 text-white">
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111111] p-7 shadow-2xl sm:p-9">
          <InshutiLogo variant="dark" className="mb-7" />
          <Link href="/shop" className="mb-8 inline-flex items-center gap-2 text-xs text-white/60 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to shop</Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white"><LockKeyhole className="h-5 w-5" /></div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">INSHUTI · OWNER ACCESS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">Enter the owner password to view store activity, orders, and customer sign-ups.</p>
          <form onSubmit={handleLogin} className="mt-7">
            <label htmlFor="owner-password" className="text-xs font-semibold text-white/80">Owner PIN / Password</label>
            <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setLoginError(''); }} className="mt-2 h-12 w-full rounded-lg border border-white/15 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-blue-400" placeholder="Enter password" />
            {loginError && <p role="alert" className="mt-2 text-xs text-rose-300">{loginError}</p>}
            <button type="submit" className="mt-5 h-12 w-full rounded-lg bg-blue-500 text-sm font-bold text-white transition hover:bg-blue-400">Unlock Dashboard</button>
          </form>
          <p className="mt-5 text-[10px] leading-5 text-white/35">The owner session stays active in this browser tab until you lock or close it.</p>
        </section>
      </main>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: formatRwf(totalRevenue), sub: 'Completed checkouts + delivered WhatsApp orders', icon: Wallet },
    { label: 'Total Items Sold', value: totalItemsSold.toLocaleString(), sub: 'Paid / sold orders and completed checkouts', icon: Shirt },
    { label: 'Best-Selling Item', value: bestSeller, sub: `${orderedItems.length} placed order${orderedItems.length === 1 ? '' : 's'} tracked`, icon: TrendingUp },
    { label: 'Customers & Subscribers', value: customerAndSubscriberCount.toLocaleString(), sub: `${analytics.registeredUsers.length} customers · ${analytics.newsletterSubscribers.length} email sign-ups`, icon: Users },
  ];
  const maxUnits = Math.max(1, ...productRanking.map((product) => product.units));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-3 py-5 text-white sm:px-7 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
          <div>
            <Link href="/shop" aria-label="Back to INSHUTI shop" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft className="h-4 w-4" /><InshutiLogo variant="dark" /><span>SHOP</span></Link>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300">PRIVATE OWNER AREA</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Store Dashboard</h1>
            <p className="mt-2 text-sm text-white/50">Sales, orders, and customer activity at a glance.</p>
          </div>
          <button type="button" onClick={lockDashboard} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-white/15 px-4 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white sm:self-auto"><LogOut className="h-4 w-4" /> Lock / Log Out</button>
        </header>

        <section aria-label="Store key metrics" className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:gap-4 xl:grid-cols-4">
          {kpis.map(({ label, value, sub, icon: Icon }) => (
            <article key={label} className="min-h-36 min-w-0 rounded-xl border border-white/10 bg-[#111111] p-3 sm:p-5">
              <div className="flex items-center justify-between gap-2 text-[10px] font-medium leading-4 text-white/55 sm:gap-3 sm:text-xs"><span className="min-w-0">{label}</span><Icon className="h-4 w-4 shrink-0 text-blue-300" /></div>
              <p className={`mt-4 break-words font-bold tracking-tight sm:mt-5 ${label === 'Best-Selling Item' ? 'text-sm sm:text-lg' : 'text-base sm:text-2xl'}`}>{value}</p>
              <p className="mt-2 text-[9px] leading-4 text-white/40 sm:text-[10px]">{sub}</p>
            </article>
          ))}
        </section>

        <nav aria-label="Admin dashboard sections" className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-[#111111] p-2 lg:grid-cols-4">
          {([
            ['overview', 'Overview & Orders'],
            ['media', 'Media & Store Folders'],
            ['activity', 'Customer Activity'],
            ['customers', 'Customers & Emails'],
          ] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={adminTab === key} onClick={() => setAdminTab(key)} className={`min-h-10 rounded-lg px-3 py-2 text-left text-[10px] font-bold transition sm:text-xs ${adminTab === key ? 'bg-blue-400/15 text-blue-200' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>{label}</button>)}
        </nav>

        {adminTab === 'media' && <>
        <section id="manage-products-form" className="mt-7 rounded-xl border border-white/10 bg-[#111111] p-4 sm:p-6">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">STORE CATALOGUE</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">Manage Products &amp; Upload Photos</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45">Upload a photo from your PC, choose its department and placement, then publish it straight to ShopPage. Photos are resized to at most 900px wide and saved as compressed JPEGs.</p>
          </div>

          <form onSubmit={publishProduct} className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="store-product-image" className="mb-2 block text-xs font-semibold text-white/80">Product or banner photo</label>
                <label htmlFor="store-product-image" className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-3 text-center text-xs font-semibold text-white/75 transition hover:border-blue-300/50 hover:text-white"><ImagePlus className="h-4 w-4 shrink-0" />{compressingImage ? 'Compressing photo…' : productImageName || 'Choose a photo from your PC'}</label>
                <input id="store-product-image" type="file" accept="image/*" disabled={compressingImage} onChange={(event) => { void handleProductImage(event.target.files?.[0]); event.currentTarget.value = ''; }} className="sr-only" />
                <p className="mt-1.5 text-[10px] text-white/40">JPEG output · max 900px wide · image quality 0.82</p>
              </div>

              <fieldset>
                <legend className="text-xs font-semibold text-white/80">Product Type</legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(['Clothing', 'Shoes'] as const).map((kind) => <button key={kind} type="button" onClick={() => chooseProductType(kind)} aria-pressed={productType === kind} className={`min-h-11 rounded-lg border px-3 text-xs font-bold transition ${productType === kind ? 'border-blue-300 bg-blue-400/15 text-blue-100' : 'border-white/15 text-white/55 hover:border-white/30'}`}>{kind === 'Clothing' ? 'Clothing (S – XXL)' : 'Shoes (EU 38 – 45)'}</button>)}
                </div>
              </fieldset>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-white/80">Department<select value={productDepartment} onChange={(event) => setProductDepartment(event.target.value as StoreProductDepartment)} className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-blue-300"><option value="Women">Women</option><option value="Men">Men</option>{editingProductSource !== 'default' && <option value="Both">Both</option>}</select></label>
                <label className="text-xs font-semibold text-white/80">Where to put it on the website<select value={productSection} onChange={(event) => setProductSection(event.target.value as StoreProductSection)} className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-blue-300">{storePlacementOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              </div>

              <label className="block text-xs font-semibold text-white/80">Item or banner title<input value={productTitle} onChange={(event) => setProductTitle(event.target.value)} required placeholder="e.g. Kigali Everyday Cotton Tee" className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-300" /></label>

              {productSection !== 'Hero Banner' && <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-white/80">Category / Subtitle<input value={productSubtitle} onChange={(event) => setProductSubtitle(event.target.value)} required placeholder="100% Cotton T-Shirt" className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-300" /></label>
                  <label className="text-xs font-semibold text-white/80">Color<input value={productColor} onChange={(event) => setProductColor(event.target.value)} required placeholder="Black" className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-300" /></label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-white/80">Price in RWF<input type="number" min="1" step="1" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} required placeholder="12000" className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-300" /></label>
                  <label className="text-xs font-semibold text-white/80">Optional sale / original price<input type="number" min="1" step="1" value={productOldPrice} onChange={(event) => setProductOldPrice(event.target.value)} placeholder="25000" className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-300" /></label>
                </div>
                <fieldset>
                  <legend className="text-xs font-semibold text-white/80">Available sizes</legend>
                  <div className="mt-2 flex flex-wrap gap-2">{availableStoreSizes.map((size) => <label key={size} className={`inline-flex h-9 min-w-10 cursor-pointer items-center justify-center rounded-md border px-3 text-xs font-semibold ${productSizes.includes(size) ? 'border-blue-300/60 bg-blue-400/15 text-blue-100' : 'border-white/15 text-white/55'}`}><input type="checkbox" checked={productSizes.includes(size)} onChange={(event) => setProductSizes((current) => event.target.checked ? [...current, size] : current.filter((item) => item !== size))} className="sr-only" />{size}</label>)}</div>
                </fieldset>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-white/75"><input type="checkbox" checked={productLimitedOffer} onChange={(event) => setProductLimitedOffer(event.target.checked)} className="h-4 w-4 accent-blue-500" />Show Limited Offer badge</label>
              </>}

              {productFormError && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">{productFormError}</p>}
              {productFormSuccess && <p role="status" className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">{productFormSuccess}</p>}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="submit" disabled={compressingImage} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 text-xs font-bold text-white transition hover:bg-blue-400 disabled:cursor-wait disabled:opacity-50">{editingProductId ? <Pencil className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}{editingProductId ? 'Update Store Listing' : 'Publish to Store'}</button>
                {editingProductId && <button type="button" onClick={resetProductForm} className="min-h-11 rounded-lg border border-white/15 px-5 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white">Cancel edit</button>}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-white/45">Live photo preview</p>
              {productImage ? <img src={productImage} alt="Preview of selected store upload" className="max-h-[420px] w-full rounded-lg bg-black/30 object-contain" /> : <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-white/35">Choose an image to preview it here</div>}
              {productTitle && <p className="mt-3 truncate text-sm font-semibold">{productTitle}</p>}
              <p className="mt-1 text-[10px] text-white/45">{productDepartment} · {storePlacementOptions.find((option) => option.value === productSection)?.label}</p>
              {productSection !== 'Hero Banner' && productPrice && <p className="mt-2 text-xs font-bold text-white">{formatRwf(Number(productPrice) || 0)}</p>}
            </div>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div><h3 className="text-base font-bold">Media &amp; Store Folders</h3><p className="mt-1 text-[10px] text-white/45">Browse {mediaItems.length.toLocaleString()} catalogue photos by folder. The folder grid loads 12 items at a time.</p></div>
              <button type="button" onClick={restoreCatalogue} className="min-h-9 self-start rounded-lg border border-white/15 px-3 text-[10px] font-semibold text-white/70 transition hover:border-white/30 hover:text-white">Restore Default Catalogue</button>
            </div>
            {!activeMediaFolder ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {mediaFolders.map((folder) => <button key={folder.label} type="button" onClick={() => { setActiveMediaFolder(folder.label); setMediaSearch(''); }} className="flex min-h-24 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-left transition hover:border-blue-300/40 hover:bg-blue-400/5"><span className="text-xs font-semibold">{folder.label}</span><span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70">{folder.count.toLocaleString()}</span></button>)}
            </div> : <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={() => { setActiveMediaFolder(null); setMediaSearch(''); }} className="min-h-9 self-start rounded-lg border border-white/10 px-3 text-[10px] font-semibold text-white/65 hover:text-white">← All folders</button>
                <h4 className="text-sm font-bold">{activeMediaFolder}</h4>
                <span className="text-[10px] text-white/45">{activeMediaFolder === 'Home Page Photos' ? HOME_PAGE_IMAGE_SLOTS.length : filteredMediaItems.length.toLocaleString()} images</span>
                {activeMediaFolder !== 'Home Page Photos' && <input type="search" value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} placeholder="Search this folder..." className="h-9 min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 text-xs text-white outline-none placeholder:text-white/35 focus:border-blue-300" />}
              </div>
              {activeMediaFolder === 'Home Page Photos' ? <>
                <input ref={homePhotoInputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { void replaceHomePagePhoto(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
                  {HOME_PAGE_IMAGE_SLOTS.map((slot) => {
                    const customPhoto = analytics.homePageImages?.[slot.id];
                    return <article key={slot.id} className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <div className="relative aspect-[3/4] bg-black/30"><img src={customPhoto || slot.defaultImage} alt={slot.label} loading="lazy" className="h-full w-full object-cover object-top" />{customPhoto && <span className="absolute left-2 top-2 rounded bg-emerald-300 px-2 py-1 text-[8px] font-bold uppercase text-emerald-950">Custom</span>}</div>
                      <div className="p-2.5"><h5 className="text-[11px] font-semibold leading-4">{slot.label}</h5><p className="mt-1 min-h-8 text-[9px] leading-4 text-white/45">{slot.description}</p><div className="mt-2 grid gap-1.5"><button type="button" onClick={() => { homePhotoTargetRef.current = slot.id; homePhotoInputRef.current?.click(); }} className="min-h-8 rounded border border-white/10 px-1.5 text-[9px] font-semibold text-white/70 hover:border-blue-300/40 hover:text-white">Replace Photo</button><button type="button" disabled={!customPhoto} onClick={() => resetHomePagePhoto(slot.id)} className="min-h-8 rounded border border-white/10 px-1.5 text-[9px] font-semibold text-white/65 hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">Reset to Default</button></div></div>
                    </article>;
                  })}
                </div>
              </> : <>
                <input ref={replaceInputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { void replacePhoto(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />
                {pagedMediaItems.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
                  {pagedMediaItems.map((item, index) => <article key={`${item.source}-${item.id}-${index}`} className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
                    <div className="relative aspect-[3/4] bg-black/30"><img src={item.imageDataUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover object-top" />{item.limitedOffer && <span className="absolute left-2 top-2 rounded bg-white px-2 py-1 text-[8px] font-bold uppercase text-slate-900">Limited Offer</span>}</div>
                    <div className="p-2.5"><h5 className="truncate text-[11px] font-semibold" title={item.title}>{item.title}</h5><p className="mt-1 truncate text-[9px] text-white/45">{mediaFolderLabel(item)} · {formatRwf(item.priceRwf)}</p><div className="mt-2 grid grid-cols-2 gap-1.5"><button type="button" onClick={() => { setReplaceTarget(item); replaceInputRef.current?.click(); }} className="min-h-8 rounded border border-white/10 px-1.5 text-[9px] font-semibold text-white/70 hover:border-blue-300/40 hover:text-white">Replace Photo</button><button type="button" onClick={() => openModifyItem(item)} className="min-h-8 rounded border border-white/10 px-1.5 text-[9px] font-semibold text-white/70 hover:border-blue-300/40 hover:text-white">Modify</button><button type="button" onClick={() => removeProduct(item)} className="col-span-2 min-h-8 rounded border border-rose-300/15 px-1.5 text-[9px] font-semibold text-rose-200/80 hover:border-rose-300/35">Delete</button></div></div>
                  </article>)}
                </div> : <p className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center text-xs text-white/40">No images found in this folder.</p>}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4"><button type="button" disabled={mediaPage <= 1} onClick={() => setMediaPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/70 disabled:opacity-30">Previous</button><span className="text-[10px] text-white/45">Page {mediaPage} of {mediaPageCount}</span><button type="button" disabled={mediaPage >= mediaPageCount} onClick={() => setMediaPage((page) => Math.min(mediaPageCount, page + 1))} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/70 disabled:opacity-30">Next</button></div>
              </>}
            </>}
          </div>
        </section>
        </>}

        {adminTab === 'overview' && <>
        <section className="mt-7 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-lg font-bold">Top-Selling Clothes Ranking</h2>
              <p className="mt-1 text-xs text-white/45">Completed checkout sales, split by style and size.</p>
            </div>
            <span className="text-[10px] text-white/40">Bars show units sold</span>
          </div>
          {productRanking.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45"><tr><th className="pb-3 pr-4">Style / Size</th><th className="pb-3 pr-4">Units Sold</th><th className="pb-3 pr-4">Sales Volume</th><th className="pb-3 text-right">Revenue (RWF)</th></tr></thead>
                <tbody>
                  {productRanking.map((product) => (
                    <tr key={`${product.productName}-${product.size}`} className="border-b border-white/5 last:border-0">
                      <td className="py-4 pr-4 font-semibold">{product.productName} <span className="ml-1 font-normal text-white/45">· {product.size}</span></td>
                      <td className="py-4 pr-4 text-white/70">{product.units}</td>
                      <td className="w-1/3 py-4 pr-4"><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: `${(product.units / maxUnits) * 100}%` }} /></div></td>
                      <td className="py-4 text-right font-semibold">{formatRwf(product.revenueRwf)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="py-8 text-center text-sm text-white/45">No completed checkout sales yet.</p>}
        </section>

        <section className="mt-7 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <p className="mt-1 text-xs text-white/45">Add-to-Bag activity is tracked separately from placed orders.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-xs">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45"><tr><th className="pb-3 pr-4">Order ID</th><th className="pb-3 pr-4">Customer</th><th className="pb-3 pr-4">Item</th><th className="pb-3 pr-4">Size / Fitting</th><th className="pb-3 pr-4">Amount</th><th className="pb-3 pr-4">Payment</th><th className="pb-3 pr-4">Date</th><th className="pb-3">Payment Status</th></tr></thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0">
                    <td className="py-4 pr-4"><span className="inline-flex whitespace-nowrap rounded-full border border-blue-300/20 bg-blue-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-blue-200">{order.orderRef || order.id}</span></td>
                    <td className="py-4 pr-4">{order.customerName || 'Guest'}</td>
                    <td className="py-4 pr-4">{order.productName}</td>
                    <td className="py-4 pr-4 text-white/65"><span>{order.size}</span>{order.backupSizes?.length ? <span className="mt-1 block text-[10px] text-amber-200">Backup: {order.backupSizes.join(', ')}</span> : null}{order.fittingRequested && <span className="mt-1 block text-[9px] text-white/40">Kigali fitting</span>}</td>
                    <td className="py-4 pr-4 font-semibold">{formatRwf(order.totalPriceRwf ?? order.priceRwf)}</td>
                    <td className="py-4 pr-4 text-white/65">{order.paymentMethod || (order.eventType === 'whatsapp_order' ? 'WhatsApp / MTN MoMo' : 'Card')}</td>
                    <td className="py-4 pr-4 text-white/55">{formatDate(order.timestamp)}</td>
                    <td className="py-4"><button type="button" onClick={() => changeOrderStatus(order)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-bold ${order.status === 'Delivered' || order.status === 'Paid / Sold' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-200'}`}>{order.status === 'Pending MoMo' || order.status === 'Pending' ? 'Confirm MoMo Paid' : order.status || 'Pending MoMo'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!recentOrders.length && <p className="py-8 text-center text-sm text-white/45">No placed orders yet.</p>}
          </div>
        </section>
        </>}

        {adminTab === 'activity' && <>
        <section className="mt-7 rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div><h2 className="text-lg font-bold">Customer Activity &amp; Button Struggles</h2><p className="mt-1 text-xs text-white/45">Visitor time, frequently viewed pages and products, and friction alerts. Updates every 10 seconds.</p></div>
            <button type="button" onClick={clearAllActivity} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-white/15 px-3 text-[10px] font-semibold text-white/60 transition hover:border-rose-300/40 hover:text-rose-200"><Trash2 className="h-3.5 w-3.5" /> Clear All Activity Logs</button>
          </div>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-white/40"><Search className="h-4 w-4 shrink-0" /><input type="search" value={activitySearch} onChange={(event) => setActivitySearch(event.target.value)} placeholder="Search customer name or email..." className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/35" /></label>
            <div className="flex rounded-lg border border-white/10 bg-black/20 p-1" aria-label="Filter visitors">
              <button type="button" aria-pressed={activityFilter === 'all'} onClick={() => setActivityFilter('all')} className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${activityFilter === 'all' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}>All Visitors</button>
              <button type="button" aria-pressed={activityFilter === 'friction'} onClick={() => setActivityFilter('friction')} className={`rounded-md px-3 py-2 text-[10px] font-semibold transition ${activityFilter === 'friction' ? 'bg-rose-400/15 text-rose-200' : 'text-white/50 hover:text-white'}`}>Has Friction Alerts Only</button>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/45"><span>Showing {firstActivityResult}–{lastActivityResult} of {filteredActivity.length} visitors</span><span>{analytics.activitySessions.length.toLocaleString()} total visitor logs</span></div>
          {visibleActivity.length ? (
            <div className="space-y-3">
              {visibleActivity.map((session) => {
                const isGuest = session.visitorName === 'Guest Visitor';
                const pageBadges = activityPageBadges(session);
                return (
                  <article key={session.id} className="relative grid gap-4 rounded-lg border border-white/10 bg-black/20 p-4 pr-12 lg:grid-cols-[190px_90px_minmax(180px,1fr)_minmax(210px,0.9fr)] lg:items-start">
                    <button type="button" onClick={() => deleteActivity(session.id)} aria-label={`Delete activity log for ${session.visitorName}`} title="Delete activity log" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-white/35 transition hover:bg-rose-400/10 hover:text-rose-200"><Trash2 className="h-4 w-4" /></button>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isGuest ? 'bg-white/10 text-white/65' : 'bg-blue-400/20 text-blue-200'}`}>{isGuest ? 'GV' : initials(session.visitorName)}</span>
                      <div className="min-w-0"><p className="truncate text-xs font-semibold">{session.visitorName}</p><p className="truncate text-[10px] text-white/40">{session.visitorEmail || 'Guest session'}</p></div>
                    </div>
                    <div><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Time Spent</p><p className="mt-1 text-xs font-semibold">{formatDuration(session.activeSeconds)}</p></div>
                    <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Pages &amp; Products Viewed</p><div className="mt-2 flex flex-wrap gap-1.5">{pageBadges.length ? pageBadges.map(([label, count]) => <span key={label} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] leading-4 text-white/75">{label} ({count}x)</span>) : <span className="text-xs text-white/40">No main pages recorded</span>}</div></div>
                    <div><p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Button Struggles / Friction Alerts</p><div className="mt-2 flex flex-wrap gap-1.5">{session.frictionEvents.length ? session.frictionEvents.map((event, index) => <span key={`${event.label}-${event.detail}-${index}`} title={formatDate(event.timestamp)} className="rounded-full bg-rose-400/15 px-2.5 py-1 text-[10px] leading-4 text-rose-200">{event.detail}{(event.count || 1) > 1 ? ` (${event.count}x)` : ''}</span>) : <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-200">Smooth Journey</span>}</div></div>
                  </article>
                );
              })}
            </div>
          ) : <p className="py-8 text-center text-sm text-white/45">No visitors match this search and filter.</p>}
          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
            <button type="button" disabled={activityPage <= 1} onClick={() => setActivityPage((page) => Math.max(1, page - 1))} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/70 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30">Previous</button>
            <span className="text-[10px] text-white/45">Page {activityPage} of {activityPageCount}</span>
            <button type="button" disabled={activityPage >= activityPageCount} onClick={() => setActivityPage((page) => Math.min(activityPageCount, page + 1))} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-semibold text-white/70 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30">Next</button>
          </div>
        </section>
        </>}

        {adminTab === 'customers' && <>
        <section className="mt-7 grid gap-7 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold">Registered Customers</h2>
              <p className="mt-1 text-xs text-white/45">People who personalized their INSHUTI shopping profile.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-left text-xs">
                <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45"><tr><th className="pb-3 pr-4">Customer</th><th className="pb-3 pr-4">Email</th><th className="pb-3 pr-4">Preference</th><th className="pb-3">Joined</th></tr></thead>
                <tbody>
                  {analytics.registeredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 pr-4"><span className="inline-flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">{initials(user.fullName)}</span>{user.fullName}</span></td>
                      <td className="py-3 pr-4 text-white/65">{user.email}</td>
                      <td className="py-3 pr-4 text-white/65">{user.stylePreference}</td>
                      <td className="py-3 text-white/55">{formatDate(user.joinDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!analytics.registeredUsers.length && <p className="py-8 text-center text-sm text-white/45">No registered customers yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-bold">Newsletter Sign-Ups</h2><p className="mt-1 text-xs text-white/45">Emails collected from the shop newsletter.</p></div>
              <button type="button" onClick={exportEmails} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-[10px] font-bold transition hover:border-white/30"><Download className="h-3.5 w-3.5" /> Export Emails (CSV)</button>
            </div>
            <div className="max-h-[360px] max-w-full overflow-auto">
              <table className="w-full min-w-[380px] text-left text-xs">
                <thead className="sticky top-0 bg-[#111111] text-[10px] uppercase tracking-wider text-white/45"><tr><th className="border-b border-white/10 pb-3 pr-3">Email</th><th className="border-b border-white/10 pb-3 text-right">Signed Up</th></tr></thead>
                <tbody>
                  {analytics.newsletterSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="border-b border-white/5 last:border-0"><td className="py-3 pr-3 text-white/80">{subscriber.email}</td><td className="py-3 text-right text-white/50">{formatDate(subscriber.timestamp)}</td></tr>
                  ))}
                </tbody>
              </table>
              {!analytics.newsletterSubscribers.length && <p className="py-8 text-center text-sm text-white/45">No newsletter sign-ups yet.</p>}
            </div>
          </div>
        </section>
        </>}

        {modifyItem && <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/75 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModifyItem(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="modify-media-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111111] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-300">Modify Store Item</p><h2 id="modify-media-title" className="mt-1 text-xl font-bold">{modifyItem.title}</h2></div><button type="button" onClick={() => setModifyItem(null)} aria-label="Close edit dialog" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white">×</button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-white/70 sm:col-span-2">Item title<input value={modifyTitle} onChange={(event) => setModifyTitle(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-blue-300" /></label>
              {modifyItem.section !== 'Hero Banner' && <>
                <label className="text-xs font-semibold text-white/70">Price (RWF)<input type="number" min="0" value={modifyPrice} onChange={(event) => setModifyPrice(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-blue-300" /></label>
                <label className="text-xs font-semibold text-white/70">Department<select value={modifyDepartment} onChange={(event) => setModifyDepartment(event.target.value as StoreProductDepartment)} className="mt-2 h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-blue-300"><option value="Women">Women</option><option value="Men">Men</option>{modifyItem.source === 'uploaded' && <option value="Both">Both</option>}</select></label>
                <label className="text-xs font-semibold text-white/70 sm:col-span-2">Folder / Section<select value={modifySection} onChange={(event) => setModifySection(event.target.value as StoreProductSection)} className="mt-2 h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm text-white outline-none focus:border-blue-300">{storePlacementOptions.filter((option) => modifyItem.source === 'uploaded' || option.value !== 'Hero Banner').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <fieldset className="sm:col-span-2"><legend className="text-xs font-semibold text-white/70">Available sizes</legend><div className="mt-2 flex flex-wrap gap-2">{(modifyItem.productType === 'Shoes' ? shoeSizes : clothingSizes).map((size) => <label key={size} className={`inline-flex h-9 min-w-10 cursor-pointer items-center justify-center rounded-md border px-3 text-xs font-semibold ${modifySizes.includes(size) ? 'border-blue-300/60 bg-blue-400/15 text-blue-100' : 'border-white/15 text-white/55'}`}><input type="checkbox" checked={modifySizes.includes(size)} onChange={(event) => setModifySizes((current) => event.target.checked ? [...current, size] : current.filter((entry) => entry !== size))} className="sr-only" />{size}</label>)}</div></fieldset>
              </>}
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModifyItem(null)} className="min-h-10 rounded-lg border border-white/15 px-4 text-xs font-semibold text-white/65">Cancel</button><button type="button" onClick={saveModifiedItem} className="min-h-10 rounded-lg bg-blue-500 px-4 text-xs font-bold text-white hover:bg-blue-400">Save Changes</button></div>
          </section>
        </div>}

        <footer className="flex flex-col items-center justify-center gap-3 py-8 text-[10px] text-white/35 sm:flex-row"><InshutiLogo variant="dark" /><span>OWNER DASHBOARD · {cloudSyncActive ? 'Cloud Sync Active · Supabase' : 'Local browser analytics'}</span></footer>
      </div>
    </main>
  );
}
