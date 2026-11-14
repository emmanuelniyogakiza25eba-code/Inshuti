'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type SyntheticEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Heart, LockKeyhole, Search, ShoppingBag, Star, UserRound, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { fetchCloudStoreItems, generateOrderReference, getStoreAnalytics, isSupabaseConfigured, logNewsletterSubscriber, logRegisteredUser, logStoreOrder, recordActivityFriction, recordActivityPage, updateActivityIdentity, type StoreProductRecord } from '@/src/utils/storeAnalytics';
import { defaultStoreProducts } from '@/src/utils/defaultStoreCatalog';
import InshutiLogo from '@/src/components/InshutiLogo';
import GoogleWelcomePrompt from '@/src/components/GoogleWelcomePrompt';

type Department = 'WOMEN' | 'MEN';
type ProductSection = 'The Latest Drops' | 'Kigali Everyday Essentials' | 'Limited Editions & Event Wear' | 'Footwear & Accessories';

type Product = {
  id: string;
  department: Department;
  section: ProductSection;
  name: string;
  type: string;
  color: string;
  price: number;
  oldPrice?: number;
  image: string;
  galleryImages: string[];
  savedCount: number;
  availableSizes?: string[];
  limitedOffer?: boolean;
  productKind?: 'Clothing' | 'Shoes';
};

type BagItem = { id: string; product: Product; size: string; backupSizes?: string[]; fitting?: boolean };
type PaymentConfirmation = { orderRef: string; totalRwf: number };
type Review = { id: string; name: string; rating: number; message: string; verified: boolean };
type ShopperProfile = { name: string; email: string; preference: Department };
type CustomerAuthMode = 'signin' | 'signup';

function shopperProfileFromAuthUser(user: User, fallbackPreference: Department): ShopperProfile {
  const metadata = user.user_metadata || {};
  const name = [metadata.full_name, metadata.name, metadata.fullName].find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  const preference = String(metadata.style_preference || metadata.preference || fallbackPreference).toUpperCase();
  return {
    name: name?.trim() || user.email?.split('@')[0] || 'INSHUTI Customer',
    email: user.email?.trim().toLowerCase() || '',
    preference: preference === 'MEN' ? 'MEN' : 'WOMEN',
  };
}

const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
const unsplash = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;
const FALLBACK_FASHION_IMAGE = '/Gemini_Generated_Image_jkm77kjkm77kjkm7.jpeg';

function handleShopImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.getAttribute('src') !== FALLBACK_FASHION_IMAGE) image.src = FALLBACK_FASHION_IMAGE;
}

const toShopProduct = (record: (typeof defaultStoreProducts)[number]): Product => ({
  id: record.id,
  department: record.department,
  section: record.section,
  name: record.name,
  type: record.type,
  color: record.color,
  price: record.price,
  ...(record.oldPrice ? { oldPrice: record.oldPrice } : {}),
  image: record.image,
  galleryImages: record.galleryImages,
  savedCount: record.savedCount,
  availableSizes: record.availableSizes,
  limitedOffer: record.limitedOffer,
  productKind: record.productKind,
});

function uploadedProduct(record: StoreProductRecord, department: Department): Product {
  return {
    id: `uploaded-${record.id}-${department.toLowerCase()}`,
    department,
    section: record.section as ProductSection,
    name: record.title,
    type: record.subtitle || 'INSHUTI Collection',
    color: record.color || 'Multi-colour',
    price: record.priceRwf,
    ...(record.oldPriceRwf ? { oldPrice: record.oldPriceRwf } : {}),
    image: record.imageDataUrl,
    galleryImages: [record.imageDataUrl, record.imageDataUrl, record.imageDataUrl, record.imageDataUrl],
    savedCount: 0,
    availableSizes: record.availableSizes,
    limitedOffer: record.limitedOffer,
    productKind: record.productType || (record.section === 'Footwear & Accessories' ? 'Shoes' : 'Clothing'),
  };
}

const sections: ProductSection[] = [
  'The Latest Drops',
  'Kigali Everyday Essentials',
  'Limited Editions & Event Wear',
  'Footwear & Accessories',
];

const shopCategories = ['New In', 'T-Shirts', 'Streetwear', 'Custom Tailored', 'Footwear', 'Sale'];
const formatPrice = (price: number) => `RWF ${price.toLocaleString('en-US')}`;
const initialReviews: Review[] = [
  { id: 'eric-m', name: 'Eric M.', rating: 5, message: "Inshuti T-shirts are the best quality I've bought in Kigali. Super affordable, premium cotton fabric, and the fit is perfect for daily wear!", verified: true },
  { id: 'jean-paul-k', name: 'Jean-Paul K.', rating: 5, message: 'Ordered two men’s shirts via WhatsApp and they delivered right to my place in Kimironko the same day. Great quality for RWF 12,000.', verified: true },
];

function PaymentBadges() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Accepted payment methods">
      <span aria-label="MTN MoMo">
        <svg viewBox="0 0 104 24" role="img" aria-label="MTN MoMo" className="h-[26px] w-[100px]">
          <rect x="1" y="1" width="102" height="22" rx="4" fill="#FFCC00" />
          <ellipse cx="20" cy="12" rx="16" ry="8" fill="none" stroke="#003B70" strokeWidth="2" />
          <text x="20" y="15" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="900" fill="#003B70">MTN</text>
          <text x="43" y="16" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700" fill="#111827">MoMo</text>
        </svg>
      </span>
      <span aria-label="Airtel Money">
        <svg viewBox="0 0 104 24" role="img" aria-label="Airtel Money" className="h-[26px] w-[100px]">
          <path d="M13 6c5 0 8 3 8 6s-3 6-8 6" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M17 8c3 0 5 2 5 4s-2 4-5 4" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <text x="31" y="12" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="white">airtel</text>
          <text x="31" y="20" fontFamily="Arial, sans-serif" fontSize="6" fontWeight="600" letterSpacing="1" fill="white">MONEY</text>
        </svg>
      </span>
      <span aria-label="Bank of Kigali">
        <svg viewBox="0 0 120 24" role="img" aria-label="Bank of Kigali" className="h-[26px] w-[108px]">
          <path d="M8 17V7h5.5c2.3 0 3.7 1 3.7 2.7 0 1.1-.6 1.8-1.6 2.2 1.4.3 2.2 1.2 2.2 2.5 0 1.8-1.5 2.7-4 2.7H8Zm3-6.1h2c.8 0 1.2-.3 1.2-.9s-.4-.9-1.2-.9h-2v1.8Zm0 3.9h2.4c.8 0 1.3-.3 1.3-1s-.5-1-1.3-1H11v2Z" fill="#9FE8FF" />
          <text x="21" y="17" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="900" fill="white">BK</text>
          <path d="M42 6v12M48 6v12M54 6v12" stroke="#9FE8FF" strokeWidth="1.5" />
          <text x="61" y="11" fontFamily="Arial, sans-serif" fontSize="5.7" fontWeight="700" fill="white">BANK OF</text>
          <text x="61" y="18" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="700" fill="white">KIGALI</text>
        </svg>
      </span>
      <span aria-label="Visa">
        <svg viewBox="0 0 54 24" role="img" aria-label="Visa" className="h-[26px] w-[52px]">
          <text x="27" y="18" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="17" fontStyle="italic" fontWeight="900" letterSpacing="-1" fill="white">VISA</text>
        </svg>
      </span>
      <span aria-label="Mastercard">
        <svg viewBox="0 0 54 24" role="img" aria-label="Mastercard" className="h-[26px] w-[52px]">
          <circle cx="23" cy="12" r="8" fill="#EB001B" />
          <circle cx="31" cy="12" r="8" fill="#F79E1B" fillOpacity="0.95" />
        </svg>
      </span>
    </div>
  );
}

function profileInitials(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  return (names[0] || '').slice(0, 2).toUpperCase();
}

function PaymentInstructions({ confirmation, copied, onCopy }: { confirmation: PaymentConfirmation | null; copied: boolean; onCopy: () => void }) {
  if (!confirmation) return null;
  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-slate-900" role="status" aria-live="polite">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">Payment Instructions</p>
      <p className="mt-2 text-sm leading-6">Send <strong>{formatPrice(confirmation.totalRwf)}</strong> to MTN MoMo <strong>0793683432</strong> using reference <strong className="font-mono">{confirmation.orderRef}</strong>.</p>
      <button type="button" onClick={onCopy} className="mt-3 rounded-lg bg-emerald-800 px-3 py-2 text-[10px] font-bold tracking-wide text-white transition hover:bg-emerald-900">{copied ? 'COPIED' : 'COPY PAYMENT DETAILS'}</button>
    </div>
  );
}

function ProductCarousel({ title, products, id, savedProductIds = [], onSelectProduct, onToggleSaved }: { title: ProductSection; products: Product[]; id: string; savedProductIds?: string[]; onSelectProduct: (product: Product) => void; onToggleSaved: (product: Product) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updatePagination = () => {
      const pages = Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth));
      setPageCount(pages);
      setActivePage(Math.min(pages - 1, Math.round(track.scrollLeft / track.clientWidth)));
    };
    const updateActivePage = () => {
      setActivePage(Math.min(pageCount - 1, Math.round(track.scrollLeft / track.clientWidth)));
    };

    updatePagination();
    track.addEventListener('scroll', updateActivePage, { passive: true });
    window.addEventListener('resize', updatePagination);
    return () => {
      track.removeEventListener('scroll', updateActivePage);
      window.removeEventListener('resize', updatePagination);
    };
  }, [pageCount, products.length]);

  const goToPage = (page: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: page * track.clientWidth, behavior: 'smooth' });
    setActivePage(page);
  };

  const move = (direction: -1 | 1) => {
    goToPage(Math.max(0, Math.min(pageCount - 1, activePage + direction)));
  };

  return (
    <section id={id} className="py-8 sm:py-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        <a href={`#${id}-carousel`} className="shrink-0 border border-slate-900 px-4 py-2 text-[10px] font-bold tracking-[0.16em] text-slate-900 transition hover:bg-slate-900 hover:text-white sm:px-6 sm:text-xs">
          SHOP NOW
        </a>
      </div>

      <div className="relative">
        <button type="button" onClick={() => move(-1)} disabled={activePage === 0} aria-label={`Scroll ${title} left`} className="absolute -left-3 top-[42%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-md transition hover:bg-slate-100 disabled:opacity-30 sm:-left-5 sm:flex sm:h-10 sm:w-10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div id={`${id}-carousel`} ref={trackRef} className="flex snap-x snap-mandatory touch-pan-x gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4">
          {products.map((product) => (
            <article
              key={`${product.id}-${product.name}`}
              data-product-card
              role="button"
              tabIndex={0}
              onClick={() => onSelectProduct(product)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectProduct(product);
                }
              }}
              className="w-[calc((100%-0.75rem)/2)] min-w-0 shrink-0 snap-start cursor-pointer sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            >
              <div className="group relative aspect-[3/4] overflow-hidden bg-slate-100">
                <img src={product.image} alt={`${product.name}, ${product.type}`} loading="lazy" onError={handleShopImageError} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]" />
                {(product.limitedOffer || product.oldPrice) && <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-900 sm:left-3 sm:top-3">Limited offer</span>}
                <button type="button" onClick={(event) => { event.stopPropagation(); onToggleSaved(product); }} aria-label={`${savedProductIds.includes(product.id) ? 'Remove' : 'Save'} ${product.name}`} aria-pressed={savedProductIds.includes(product.id)} className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-900 sm:right-3 sm:top-3">
                  <Heart className="h-4 w-4" fill={savedProductIds.includes(product.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <h3 className="mt-3 line-clamp-2 min-h-10 break-words text-[13px] font-medium leading-5 text-slate-900 sm:text-sm">{product.name}</h3>
              <p className="mt-1 break-words text-[11px] text-slate-500 sm:text-xs">{product.type} · {product.color}</p>
              <p className="mt-2 text-[13px] font-bold text-slate-900 sm:text-sm">
                {formatPrice(product.price)}
                {product.oldPrice && <span className="ml-2 text-xs font-normal text-slate-500 line-through">{formatPrice(product.oldPrice)}</span>}
              </p>
            </article>
          ))}
        </div>
        <button type="button" onClick={() => move(1)} disabled={activePage >= pageCount - 1} aria-label={`Scroll ${title} right`} className="absolute -right-3 top-[42%] z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-md transition hover:bg-slate-100 disabled:opacity-30 sm:-right-5 sm:flex sm:h-10 sm:w-10">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex justify-center gap-2" aria-label={`${title} pages`}>
        {Array.from({ length: pageCount }, (_, page) => (
          <button key={page} type="button" onClick={() => goToPage(page)} aria-label={`Go to ${title} page ${page + 1}`} aria-current={activePage === page ? 'true' : undefined} className={`h-2 rounded-full transition-all ${activePage === page ? 'w-6 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-500'}`} />
        ))}
      </div>
    </section>
  );
}

export default function ShopPage() {
  const [department, setDepartment] = useState<Department>('WOMEN');
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('New In');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [kigaliFitting, setKigaliFitting] = useState(false);
  const [selectedBackupSizes, setSelectedBackupSizes] = useState<string[]>([]);
  const [paymentConfirmation, setPaymentConfirmation] = useState<PaymentConfirmation | null>(null);
  const [paymentCopied, setPaymentCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [shopperProfile, setShopperProfile] = useState<ShopperProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileEmailDraft, setProfileEmailDraft] = useState('');
  const [profilePreferenceDraft, setProfilePreferenceDraft] = useState<Department>('WOMEN');
  const [profilePassword, setProfilePassword] = useState('');
  const [authMode, setAuthMode] = useState<CustomerAuthMode>('signin');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [bagDrawerOpen, setBagDrawerOpen] = useState(false);
  const [uploadedItems, setUploadedItems] = useState<StoreProductRecord[]>([]);
  const [catalogOverrides, setCatalogOverrides] = useState<{ hiddenProductIds: string[]; productOverrides: Record<string, Partial<(typeof defaultStoreProducts)[number]>> }>({ hiddenProductIds: [], productOverrides: {} });
  const [shopDataLoaded, setShopDataLoaded] = useState(false);
  const [cookieChoice, setCookieChoice] = useState<string | null>(null);
  const [cookieBannerClosing, setCookieBannerClosing] = useState(false);
  const [cookiePreferencesOpen, setCookiePreferencesOpen] = useState(false);
  const [analyticsCookies, setAnalyticsCookies] = useState(false);
  const [personalizationCookies, setPersonalizationCookies] = useState(true);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [reviewName, setReviewName] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const profileSubmittedRef = useRef(false);

  const bagCount = bagItems.length;
  const uploadedProducts = useMemo(() => uploadedItems
    .filter((record) => record.section !== 'Hero Banner')
    .flatMap((record) => record.department === 'Both'
      ? [uploadedProduct(record, 'WOMEN'), uploadedProduct(record, 'MEN')]
      : [uploadedProduct(record, record.department === 'Men' ? 'MEN' : 'WOMEN')]), [uploadedItems]);
  const visibleDefaultProducts = useMemo(() => defaultStoreProducts
    .filter((record) => !catalogOverrides.hiddenProductIds.includes(record.id))
    .map((record) => toShopProduct({ ...record, ...catalogOverrides.productOverrides[record.id] })), [catalogOverrides]);
  const savedProducts = useMemo(() => [...visibleDefaultProducts, ...uploadedProducts].filter((product) => savedProductIds.includes(product.id)), [savedProductIds, uploadedProducts, visibleDefaultProducts]);

  const applyAuthenticatedUser = (user: User | null, accessToken?: string) => {
    if (!user) {
      setShopperProfile(null);
      setProfileNameDraft('');
      setProfileEmailDraft('');
      setReviewName('');
      setCheckoutName('');
      setCheckoutEmail('');
      window.localStorage.removeItem('inshuti-shop-profile');
      return;
    }

    let fallbackPreference = profilePreferenceDraft;
    const pendingPreference = window.sessionStorage.getItem('inshuti-auth-preference-draft');
    if (pendingPreference === 'MEN' || pendingPreference === 'WOMEN') {
      fallbackPreference = pendingPreference;
      window.sessionStorage.removeItem('inshuti-auth-preference-draft');
    }
    const profile = shopperProfileFromAuthUser(user, fallbackPreference);
    setShopperProfile(profile);
    setProfileNameDraft(profile.name);
    setProfileEmailDraft(profile.email);
    setProfilePreferenceDraft(profile.preference);
    setDepartment(profile.preference);
    setReviewName(profile.name);
    setCheckoutName(profile.name);
    setCheckoutEmail(profile.email);
    window.localStorage.setItem('inshuti-shop-profile', JSON.stringify(profile));
    if (profile.email) logRegisteredUser({ fullName: profile.name, email: profile.email, stylePreference: profile.preference });
    if (accessToken) {
      const pendingOptIn = window.sessionStorage.getItem('inshuti-auth-marketing-opt-in');
      window.sessionStorage.removeItem('inshuti-auth-marketing-opt-in');
      void fetch('/api/customer/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fullName: profile.name, ...(pendingOptIn === 'true' || pendingOptIn === 'false' ? { marketingOptIn: pendingOptIn === 'true' } : {}) }),
      }).catch((error) => console.error('Customer email preferences could not be synced:', error));
    }
    updateActivityIdentity(profile.name, profile.email);
  };

  const openProfileModal = () => {
    profileSubmittedRef.current = false;
    setProfileNameDraft(shopperProfile?.name || '');
    setProfileEmailDraft(shopperProfile?.email || '');
    setProfilePreferenceDraft(shopperProfile?.preference || department);
    setAuthMode('signin');
    setAuthError('');
    setAuthMessage('');
    setProfilePassword('');
    setProfileModalOpen(true);
    recordActivityPage('Sign In', '/shop');
  };

  const closeProfileModal = () => {
    if (!shopperProfile && !profileSubmittedRef.current) recordActivityFriction('Sign In', 'Abandoned Sign-In without submitting profile');
    setProfileModalOpen(false);
    setProfilePassword('');
  };

  const submitCustomerAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    if (!supabase) {
      setAuthError('Customer authentication is not configured. Please try again later.');
      return;
    }
    setAuthBusy(true);
    try {
      const email = profileEmailDraft.trim().toLowerCase();
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: profilePassword,
          options: {
            data: { full_name: profileNameDraft.trim(), style_preference: profilePreferenceDraft, marketing_opt_in: marketingOptIn },
            emailRedirectTo: `${window.location.origin}/shop`,
          },
        });
        if (error) throw error;
        profileSubmittedRef.current = true;
        if (data.session && data.user) {
          applyAuthenticatedUser(data.user, data.session.access_token);
          setProfileModalOpen(false);
        } else {
          setAuthMessage('Account created. Check your email to confirm your address, then sign in.');
          setAuthMode('signin');
          setProfilePassword('');
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password: profilePassword });
      if (error) throw error;
      if (data.user) applyAuthenticatedUser(data.user, data.session?.access_token);
      profileSubmittedRef.current = true;
      setProfileModalOpen(false);
      setProfilePassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };

  const continueWithGoogle = async () => {
    setAuthError('');
    setAuthMessage('');
    if (!supabase) {
      setAuthError('Customer authentication is not configured. Please try again later.');
      return;
    }
    setAuthBusy(true);
    if (authMode === 'signup') {
      window.sessionStorage.setItem('inshuti-auth-preference-draft', profilePreferenceDraft);
      window.sessionStorage.setItem('inshuti-auth-marketing-opt-in', String(marketingOptIn));
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/shop` },
      });
      if (error) {
        window.sessionStorage.removeItem('inshuti-auth-preference-draft');
        window.sessionStorage.removeItem('inshuti-auth-marketing-opt-in');
        setAuthError(error.message);
      }
    } catch (error) {
      window.sessionStorage.removeItem('inshuti-auth-preference-draft');
      window.sessionStorage.removeItem('inshuti-auth-marketing-opt-in');
      setAuthError(error instanceof Error ? error.message : 'Google sign-in could not be started.');
    } finally {
      setAuthBusy(false);
    }
  };

  const saveCustomerPreference = async () => {
    setAuthError('');
    if (!supabase || !shopperProfile) return;
    setAuthBusy(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ data: { style_preference: profilePreferenceDraft } });
      if (error) setAuthError(error.message);
      else if (data.user) applyAuthenticatedUser(data.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not update your style preference.');
    } finally {
      setAuthBusy(false);
    }
  };

  const signOutCustomer = async () => {
    setAuthError('');
    if (!supabase) return;
    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setAuthError(error.message);
      else {
        profileSubmittedRef.current = true;
        setProfileModalOpen(false);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign out.');
    } finally {
      setAuthBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    const refreshUploadedItems = async () => {
      let data = getStoreAnalytics();
      if (isSupabaseConfigured) {
        const cloud = await fetchCloudStoreItems();
        if (cloud) data = { ...data, ...cloud };
      }
      if (!active) return;
      setUploadedItems(data.customStoreItems || []);
      setCatalogOverrides(data.catalogOverrides || { hiddenProductIds: [], productOverrides: {} });
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'inshuti-store-analytics' || event.key === 'inshuti-store-products') void refreshUploadedItems();
    };
    window.addEventListener('storage', handleStorage);
    const initializeShop = async () => {
      try {
      await refreshUploadedItems();
      const storedSaved = JSON.parse(window.localStorage.getItem('inshuti-shop-saved') || '[]');
      if (Array.isArray(storedSaved)) setSavedProductIds(storedSaved.filter((id): id is string => typeof id === 'string'));

      const storedBag = JSON.parse(window.localStorage.getItem('inshuti-shop-bag') || '[]');
      if (Array.isArray(storedBag)) setBagItems(storedBag as BagItem[]);

      const storedProfile = JSON.parse(window.localStorage.getItem('inshuti-shop-profile') || 'null') as ShopperProfile | null;
      if (storedProfile && typeof storedProfile.name === 'string' && (storedProfile.preference === 'WOMEN' || storedProfile.preference === 'MEN')) {
        const hydratedProfile = { ...storedProfile, email: typeof storedProfile.email === 'string' ? storedProfile.email : '' };
        setShopperProfile(hydratedProfile);
        setProfileNameDraft(storedProfile.name);
        setProfileEmailDraft(hydratedProfile.email);
        setProfilePreferenceDraft(storedProfile.preference);
        setDepartment(storedProfile.preference);
      }

      const params = new URLSearchParams(window.location.search);
      const requestedDepartment = params.get('department');
      if (requestedDepartment === 'WOMEN' || requestedDepartment === 'MEN') {
        setDepartment(requestedDepartment);
        setProfilePreferenceDraft(requestedDepartment);
        recordActivityPage(`Shop (${requestedDepartment === 'MEN' ? 'Men' : 'Women'})`, '/shop');
      }
      if (params.get('signin') === '1') {
        setProfileModalOpen(true);
        if (params.get('mode') === 'signup') setAuthMode('signup');
        recordActivityPage('Sign In', '/shop');
      }

      const storedReviews = JSON.parse(window.localStorage.getItem('inshuti-shop-reviews') || 'null');
      if (Array.isArray(storedReviews)) setReviews(storedReviews as Review[]);

      const storedCookieChoice = window.localStorage.getItem('inshuti-cookie-choice');
      if (storedCookieChoice) setCookieChoice(storedCookieChoice);
      const storedCookiePreferences = JSON.parse(window.localStorage.getItem('inshuti-cookie-preferences') || 'null');
      if (storedCookiePreferences) {
        setAnalyticsCookies(Boolean(storedCookiePreferences.analytics));
        setPersonalizationCookies(Boolean(storedCookiePreferences.personalization));
      }
      } catch {
        // Invalid local data should not prevent the shop page from opening.
      }
      if (active) setShopDataLoaded(true);
    };
    void initializeShop();
    return () => { active = false; window.removeEventListener('storage', handleStorage); };
  }, []);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) { applyAuthenticatedUser(data.session?.user || null, data.session?.access_token); setAuthLoading(false); }
    }).catch((error) => { console.error('Could not restore INSHUTI customer session:', error); if (active) setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { applyAuthenticatedUser(session?.user || null, session?.access_token); setAuthLoading(false); }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!shopDataLoaded) return;
    const requestedId = new URLSearchParams(window.location.search).get('product');
    if (!requestedId) return;
    const product = [...visibleDefaultProducts, ...uploadedProducts].find((item) => item.id === requestedId || item.id.startsWith(`uploaded-${requestedId}-`));
    if (!product) return;
    setDepartment(product.department);
    setSelectedProduct(product);
    setSelectedImage(product.image);
    setSelectedSize('');
    setSizeError(false);
    recordActivityPage(`Product: ${product.name}`, '/shop');
  }, [shopDataLoaded, uploadedProducts, visibleDefaultProducts]);

  useEffect(() => {
    if (!shopperProfile) return;
    setCheckoutName(shopperProfile.name);
    setCheckoutEmail(shopperProfile.email);
    setReviewName(shopperProfile.name);
  }, [shopperProfile]);

  useEffect(() => {
    if (!shopDataLoaded) return;
    window.localStorage.setItem('inshuti-shop-saved', JSON.stringify(savedProductIds));
    window.localStorage.setItem('inshuti-shop-bag', JSON.stringify(bagItems));
    window.localStorage.setItem('inshuti-shop-reviews', JSON.stringify(reviews));
    window.localStorage.setItem('inshuti-shop-cookie-preferences', JSON.stringify({ analytics: analyticsCookies, personalization: personalizationCookies }));
    if (shopperProfile) window.localStorage.setItem('inshuti-shop-profile', JSON.stringify(shopperProfile));
    else window.localStorage.removeItem('inshuti-shop-profile');
    if (cookieChoice) window.localStorage.setItem('inshuti-cookie-choice', cookieChoice);
  }, [analyticsCookies, bagItems, cookieChoice, personalizationCookies, reviews, savedProductIds, shopDataLoaded, shopperProfile]);

  const toggleSaved = (product: Product) => {
    setSavedProductIds((current) => current.includes(product.id)
      ? current.filter((id) => id !== product.id)
      : [...current, product.id]);
  };

  const addToBag = (product: Product, size: string, backupSizes: string[] = [], fitting = false) => {
    if (!size) return;
    const id = `${product.id}-${size}-${Date.now()}`;
    const fittingFeeRwf = fitting ? 2000 : 0;
    setBagItems((current) => [...current, { id, product, size, backupSizes, fitting }]);
    logStoreOrder({
      productName: product.name,
      category: product.department === 'MEN' ? 'Men' : 'Women',
      size,
      priceRwf: product.price,
      customerName: shopperProfile?.name || 'Guest',
      customerEmail: shopperProfile?.email || '',
      eventType: 'add_to_bag',
      paymentMethod: 'Not selected',
      backupSizes,
      fittingRequested: fitting,
      fittingFeeRwf,
      totalPriceRwf: product.price + fittingFeeRwf,
    });
    recordActivityPage('Bag', '/shop');
  };

  const submitWhatsAppOrder = (product: Product, size: string, backupSizes: string[] = [], fitting = false) => {
    if (!size) return;
    const fittingFeeRwf = fitting ? 2000 : 0;
    const totalRwf = product.price + fittingFeeRwf;
    const order = logStoreOrder({
      productName: product.name,
      category: product.department === 'MEN' ? 'Men' : 'Women',
      size,
      priceRwf: product.price,
      totalPriceRwf: totalRwf,
      customerName: shopperProfile?.name || 'Guest',
      customerEmail: shopperProfile?.email || '',
      eventType: 'whatsapp_order',
      paymentMethod: 'WhatsApp / MTN MoMo',
      status: 'Pending MoMo',
      backupSizes,
      fittingRequested: fitting,
      fittingFeeRwf,
    });
    setPaymentConfirmation({ orderRef: order.orderRef || '', totalRwf });
    setPaymentCopied(false);
    recordActivityPage('WhatsApp / MTN MoMo', '/shop');
    const backupText = backupSizes.length ? `, backup fitting sizes ${backupSizes.join(' and ')}` : '';
    const customerDetails = shopperProfile ? ` Customer: ${shopperProfile.name}${shopperProfile.email ? ` · ${shopperProfile.email}` : ''}.` : '';
    const message = `Hello INSHUTI, I would like to order ${product.name}. Order ID: ${order.orderRef}. Primary size: ${size}${backupText}. Total: ${formatPrice(totalRwf)}${fitting ? ' including RWF 2,000 Kigali Home Fitting rider wait fee' : ''}.${customerDetails} I would like to arrange MTN MoMo payment.`;
    window.open(`https://wa.me/250793683432?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const updateBagItem = (itemId: string, update: Partial<BagItem>) => {
    setBagItems((items) => items.map((item) => item.id === itemId ? { ...item, ...update } : item));
  };

  const copyPaymentInstructions = async () => {
    if (!paymentConfirmation) return;
    const instructions = `Send ${formatPrice(paymentConfirmation.totalRwf)} to MTN MoMo 0793683432 using reference ${paymentConfirmation.orderRef}`;
    try {
      await navigator.clipboard.writeText(instructions);
      setPaymentCopied(true);
      window.setTimeout(() => setPaymentCopied(false), 1800);
    } catch {
      setPaymentCopied(false);
    }
  };

  const checkoutBagViaWhatsApp = () => {
    if (!bagItems.length) return;
    const orderRef = generateOrderReference();
    const fittingRequested = bagItems.some((item) => item.fitting);
    const totalRwf = bagItems.reduce((sum, item) => sum + item.product.price, 0) + (fittingRequested ? 2000 : 0);
    let fittingFeeApplied = false;
    const messageLines = bagItems.map((item) => {
      const fittingFeeRwf = item.fitting && !fittingFeeApplied ? 2000 : 0;
      if (fittingFeeRwf) fittingFeeApplied = true;
      const backupSizes = item.backupSizes || [];
      const backupText = backupSizes.length ? ` · backup sizes ${backupSizes.join('/')}` : '';
      logStoreOrder({
        productName: item.product.name,
        category: item.product.department === 'MEN' ? 'Men' : 'Women',
        size: item.size,
        priceRwf: item.product.price,
        totalPriceRwf: item.product.price + fittingFeeRwf,
        customerName: checkoutName.trim() || shopperProfile?.name || 'Guest',
        customerEmail: checkoutEmail.trim().toLowerCase() || shopperProfile?.email || '',
        eventType: 'whatsapp_order',
        paymentMethod: 'WhatsApp / MTN MoMo',
        status: 'Pending MoMo',
        orderRef,
        backupSizes,
        fittingRequested: Boolean(item.fitting),
        fittingFeeRwf,
      });
      return `• ${item.product.name} — primary size ${item.size}${backupText}`;
    });
    setPaymentConfirmation({ orderRef, totalRwf });
    setPaymentCopied(false);
    setBagItems([]);
    recordActivityPage('WhatsApp / MTN MoMo', '/shop');
    const customerDetails = checkoutName.trim() || shopperProfile?.name
      ? `\nCustomer: ${checkoutName.trim() || shopperProfile?.name}${checkoutEmail.trim() || shopperProfile?.email ? ` · ${checkoutEmail.trim() || shopperProfile?.email}` : ''}`
      : '';
    const message = `Hello INSHUTI, I would like to place order ${orderRef}:\n${messageLines.join('\n')}\nTotal: ${formatPrice(totalRwf)}${fittingRequested ? ' (includes RWF 2,000 Kigali Home Fitting rider wait fee)' : ''}.${customerDetails} I would like to arrange MTN MoMo payment.`;
    window.open(`https://wa.me/250793683432?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const dismissCookieBanner = (choice: string) => {
    setCookieBannerClosing(true);
    window.setTimeout(() => {
      setCookieChoice(choice);
      setCookieBannerClosing(false);
    }, 250);
  };

  const submitReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reviewName.trim() || !reviewMessage.trim()) return;
    setReviews((current) => [{ id: `${Date.now()}`, name: reviewName.trim(), rating: reviewRating, message: reviewMessage.trim(), verified: false }, ...current]);
    setReviewName(shopperProfile?.name || '');
    setReviewRating(5);
    setReviewMessage('');
  };

  useEffect(() => {
    if (!selectedProduct && !savedDrawerOpen && !bagDrawerOpen && !profileModalOpen && !cookiePreferencesOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedProduct(null);
        setSavedDrawerOpen(false);
        setBagDrawerOpen(false);
        if (profileModalOpen) closeProfileModal();
        setCookiePreferencesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bagDrawerOpen, cookiePreferencesOpen, profileModalOpen, savedDrawerOpen, selectedProduct]);

  const collection = useMemo(() => [
    ...uploadedProducts.filter((product) => product.department === department),
    ...visibleDefaultProducts.filter((product) => product.department === department),
  ], [department, uploadedProducts, visibleDefaultProducts]);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return collection.filter((product) => {
      const matchesSearch = !normalizedQuery || `${product.name} ${product.type} ${product.section}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = activeCategory === 'New In'
        || (activeCategory === 'T-Shirts' && /tee|t-shirt|cotton/i.test(`${product.name} ${product.type}`))
        || (activeCategory === 'Streetwear' && /streetwear|hoodie|jacket|sneaker/i.test(`${product.type} ${product.name}`))
        || (activeCategory === 'Custom Tailored' && /limited|tailored|event|edition/i.test(`${product.section} ${product.type}`))
        || (activeCategory === 'Footwear' && product.productKind === 'Shoes')
        || (activeCategory === 'Sale' && (product.oldPrice !== undefined || product.limitedOffer === true));
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, collection, query]);

  const uploadedHero = uploadedItems.find((record) => record.section === 'Hero Banner' && (record.department === 'Both' || record.department === (department === 'MEN' ? 'Men' : 'Women')));
  const heroImage = uploadedHero?.imageDataUrl || (department === 'WOMEN' ? pexels(36282561) : pexels(17842463));

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-slate-900" style={{ fontFamily: "Futura, 'Plus Jakarta Sans', Inter, sans-serif" }}>
      <GoogleWelcomePrompt signedIn={Boolean(shopperProfile)} authLoading={authLoading} onEmailClick={openProfileModal} />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 px-3 py-3 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,520px)_minmax(0,1fr)] lg:gap-x-5 lg:py-5">
          <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-5">
            <Link href="/" aria-label="Return to INSHUTI home" className="inline-flex h-9 w-8 shrink-0 items-center justify-center text-slate-600 hover:text-slate-900 sm:w-auto sm:gap-2">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
            </Link>
            <Link href="/" aria-label="INSHUTI store home" className="shrink-0"><InshutiLogo variant="light" /></Link>
            <div className="hidden items-center gap-4 self-stretch lg:flex" aria-label="Shop department">
              {(['WOMEN', 'MEN'] as const).map((item) => (
                <button key={item} type="button" onClick={() => { setDepartment(item); recordActivityPage(`Shop (${item === 'MEN' ? 'Men' : 'Women'})`, '/shop'); }} aria-pressed={department === item} className={`self-stretch border-b-2 px-1 text-xs font-bold tracking-wide transition ${department === item ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 sm:gap-2 lg:col-start-3 lg:gap-4">
            <button type="button" onClick={() => { setSavedDrawerOpen(true); recordActivityPage('Saved Items', '/shop'); }} aria-label={`Saved items, ${savedProductIds.length} saved`} className="relative inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:text-slate-900">
              <Heart className="h-5 w-5" fill={savedProductIds.length ? 'currentColor' : 'none'} />
              {savedProductIds.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">{savedProductIds.length}</span>}
            </button>
            <button type="button" onClick={() => { setBagDrawerOpen(true); setPaymentConfirmation(null); recordActivityPage('Bag', '/shop'); }} aria-label={`Shopping bag, ${bagCount} items`} className="relative inline-flex h-10 w-10 items-center justify-center text-slate-700 hover:text-slate-900">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">{bagCount}</span>
            </button>
            <button type="button" onClick={openProfileModal} aria-label={shopperProfile ? `Personalized for ${shopperProfile.name}` : 'Sign in and personalize'} className="inline-flex h-10 min-w-10 items-center justify-center gap-2 text-slate-700 hover:text-slate-900">
              {shopperProfile ? <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold uppercase text-white sm:h-9 sm:w-9 sm:text-xs">{profileInitials(shopperProfile.name)}</span> : <UserRound className="h-5 w-5" />}
              <span className="hidden text-xs font-semibold xl:inline">{shopperProfile?.name || 'Sign In'}</span>
            </button>
          </div>

          <div className="col-span-2 row-start-2 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
            <div className="flex items-center gap-2 lg:hidden" aria-label="Shop department">
              {(['WOMEN', 'MEN'] as const).map((item) => (
                <button key={item} type="button" onClick={() => { setDepartment(item); recordActivityPage(`Shop (${item === 'MEN' ? 'Men' : 'Women'})`, '/shop'); }} aria-pressed={department === item} className={`min-h-10 rounded-md border-b-2 px-2 text-[10px] font-bold tracking-wide transition sm:px-3 ${department === item ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                  {item}
                </button>
              ))}
            </div>
            <label className="flex h-10 min-w-0 items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 text-slate-500 sm:h-11 sm:gap-3 sm:px-4">
              <Search className="h-4 w-4 shrink-0" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search styles..." aria-label="Search products" className="w-full min-w-0 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-500 sm:text-sm" />
            </label>
          </div>
        </div>
      </header>

      <nav aria-label="Shop categories" className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto overscroll-x-contain whitespace-nowrap px-3 py-3 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-6 sm:px-6 sm:text-sm">
          {shopCategories.map((category) => (
            <button key={category} type="button" onClick={() => { setActiveCategory(category); recordActivityPage(`Shop Category: ${category}`, '/shop'); }} aria-pressed={activeCategory === category} className={`shrink-0 border-b-2 pb-1 transition ${activeCategory === category ? 'border-white text-white' : 'border-transparent text-white/75 hover:text-white'}`}>
              {category}
            </button>
          ))}
        </div>
      </nav>

      <section className="relative isolate flex h-[320px] items-end overflow-hidden bg-slate-900 sm:h-[440px] lg:h-[520px]">
        <img src={heroImage} alt={`${department === 'WOMEN' ? 'Woman' : 'Man'} wearing modern African fashion`} onError={handleShopImageError} className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_20%]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/35 to-black/10" />
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-5 px-4 py-6 text-white md:flex-row md:items-end md:gap-8 sm:px-8 sm:py-14">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">INSHUTI · KIGALI</p>
            {shopperProfile && <p className="mb-3 text-sm font-semibold tracking-wide text-white sm:text-base">Hi, {shopperProfile.name} — Curated for You</p>}
            <h1 className="max-w-2xl text-[clamp(1.6rem,6vw,3rem)] font-black uppercase leading-[0.98] tracking-tight lg:text-7xl">NEW-SEASON EDIT</h1>
            <p className="mt-3 text-xs font-medium text-white/85 sm:mt-4 sm:text-base">{department === 'WOMEN' ? 'New silhouettes, made for your everyday.' : 'Fresh fits, made for your everyday.'}</p>
          </div>
          <a href="#latest-drops" className="inline-flex min-h-11 w-fit items-center justify-center border border-white px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-white transition hover:bg-white hover:text-slate-950 sm:px-7 sm:text-xs">SHOP NOW</a>
        </div>
      </section>

      <div className="mx-auto max-w-7xl divide-y divide-slate-200 px-4 pb-12 sm:px-6 sm:pb-16">
        {sections.map((section, index) => {
          const categoryProducts = filteredProducts.filter((product) => product.section === section);
          if (!categoryProducts.length) return null;
          const id = ['latest-drops', 'everyday-essentials', 'limited-editions', 'footwear-accessories'][index];
          return <ProductCarousel key={section} title={section} products={categoryProducts} id={id} savedProductIds={savedProductIds} onToggleSaved={toggleSaved} onSelectProduct={(product) => { setSelectedProduct(product); setSelectedImage(product.image); setSelectedSize(''); setSizeError(false); setKigaliFitting(false); setSelectedBackupSizes([]); setPaymentConfirmation(null); setDetailsOpen(false); setSizeGuideOpen(false); recordActivityPage(`Product: ${product.name}`, '/shop'); }} />;
        })}
        {!filteredProducts.length && <p className="py-20 text-center text-sm text-slate-500">No items match your search.</p>}
      </div>

      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">FROM KIGALI, WITH STYLE</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Customer Feedback &amp; Style Reviews</h2>
            </div>
            <p className="text-sm text-slate-500">Real voices from the INSHUTI community</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-4 w-4" fill={index < review.rating ? 'currentColor' : 'none'} />)}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-700">“{review.message}”</p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                    <span className="text-sm font-semibold text-slate-900">{review.name}</span>
                    {review.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-800"><Check className="h-3 w-3" /> Verified Buyer</span>}
                  </div>
                </article>
              ))}
            </div>

            <form onSubmit={submitReview} className="rounded-xl border border-slate-200 p-5 sm:p-6">
              <h3 className="text-sm font-bold tracking-wide text-slate-900">SHARE YOUR STYLE REVIEW</h3>
              <div className="mt-4 flex items-center gap-1" role="group" aria-label="Your rating">
                {Array.from({ length: 5 }, (_, index) => (
                  <button key={index} type="button" onClick={() => setReviewRating(index + 1)} aria-label={`Rate ${index + 1} out of 5`} aria-pressed={reviewRating === index + 1} className="p-1 text-amber-500">
                    <Star className="h-5 w-5" fill={index < reviewRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="review-name">Your name</label>
              <input id="review-name" value={reviewName} onChange={(event) => setReviewName(event.target.value)} required placeholder="Your name" className="mt-4 h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
              <label className="sr-only" htmlFor="review-message">Your feedback</label>
              <textarea id="review-message" value={reviewMessage} onChange={(event) => setReviewMessage(event.target.value)} required rows={3} placeholder="Tell us about your INSHUTI style..." className="mt-3 w-full resize-y border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
              <button type="submit" className="mt-3 min-h-11 w-full bg-slate-900 px-5 text-xs font-bold tracking-[0.12em] text-white transition hover:bg-slate-700">SUBMIT REVIEW</button>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 px-5 py-12 text-center sm:px-8 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">HEAR ABOUT THE BEST OFFERS AND THE LATEST DROPS FIRST</p>
          <form
            className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (newsletterEmail.trim()) {
                if (!marketingOptIn) return;
                logNewsletterSubscriber(newsletterEmail, shopperProfile?.name || '', true);
                setNewsletterSubmitted(true);
              }
            }}
          >
            <label className="sr-only" htmlFor="shop-newsletter-email">Email address</label>
            <input id="shop-newsletter-email" type="email" required value={newsletterEmail} onChange={(event) => { setNewsletterEmail(event.target.value); setNewsletterSubmitted(false); }} placeholder="Enter your email address" className="h-12 min-w-0 flex-1 border border-slate-400 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-slate-900" />
            <label className="flex items-center gap-2 text-left text-xs text-slate-700 sm:col-span-2"><input type="checkbox" required checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} className="h-4 w-4 accent-slate-900" />Email me about new arrivals &amp; exclusive drops</label>
            <button type="submit" className="h-12 bg-slate-900 px-7 text-xs font-bold tracking-[0.15em] text-white transition hover:bg-slate-700">SIGN UP</button>
          </form>
          {newsletterSubmitted && <p role="status" className="mt-3 text-sm text-slate-700">Thanks for your interest in INSHUTI updates.</p>}
        </div>
      </section>

      <footer className="bg-slate-950 px-5 py-12 text-white sm:px-8 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <Link href="/" aria-label="INSHUTI store home" className="mb-9 inline-flex"><InshutiLogo variant="dark" className="inshuti-logo--large" /></Link>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <section>
              <h2 className="text-xs font-bold tracking-[0.16em]">HELP &amp; INFORMATION</h2>
              <ul className="mt-5 space-y-3 text-sm text-white/70">
                <li><a href="mailto:support@inshuti.rw" className="hover:text-white">Customer Care</a></li>
                <li><a href="tel:+250793683432" className="hover:text-white">Contact Us</a></li>
                <li><a href="/#faq" className="hover:text-white">Delivery Information</a></li>
                <li><a href="/#faq" className="hover:text-white">Frequently Asked Questions</a></li>
              </ul>
            </section>
            <section>
              <h2 className="text-xs font-bold tracking-[0.16em]">ABOUT INSHUTI</h2>
              <ul className="mt-5 space-y-3 text-sm text-white/70">
                <li><a href="/#craft-story" className="hover:text-white">Our Story &amp; Craft</a></li>
                <li><a href="/#vision-mission" className="hover:text-white">Our Mission</a></li>
                <li><a href="/#team" className="hover:text-white">Meet Our Team</a></li>
              </ul>
            </section>
            <section>
              <h2 className="text-xs font-bold tracking-[0.16em]">MORE FROM INSHUTI</h2>
              <ul className="mt-5 space-y-3 text-sm text-white/70">
                <li><a href="/#use-cases" className="hover:text-white">Shop the Collection</a></li>
                <li><a href="/#reviews" className="hover:text-white">Customer Reviews</a></li>
                <li><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="hover:text-white">Instagram</a></li>
              </ul>
            </section>
          </div>

          <div className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold">SHOPPING FROM: Rwanda 🇷🇼</span>
            <PaymentBadges />
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/60 sm:flex-row">
            <p>© 2026 Inshuti / Ububiko</p>
            <a href="/admin" className="inline-flex items-center gap-1.5 text-[10px] text-white/45 transition hover:text-white/80"><LockKeyhole className="h-3 w-3" /> Owner Admin</a>
          </div>
        </div>
      </footer>

      {selectedProduct && (
        <div role="presentation" onClick={() => setSelectedProduct(null)} className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-6">
          <section role="dialog" aria-modal="true" aria-labelledby="quick-view-title" onClick={(event) => event.stopPropagation()} className="relative grid h-full max-h-[100svh] w-full max-w-none grid-cols-1 overflow-y-auto rounded-none bg-white text-slate-900 shadow-2xl md:h-auto md:max-h-[92svh] md:max-w-6xl md:rounded-2xl md:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <button type="button" onClick={() => setSelectedProduct(null)} aria-label="Close product details" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-sm"><X className="h-5 w-5" /></button>
            <div className="flex flex-col-reverse gap-3 p-3 md:grid md:grid-cols-[54px_minmax(0,1fr)] md:gap-4 md:p-6">
              <div className="flex max-w-full flex-row gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-col md:overflow-visible">
                {selectedProduct.galleryImages.map((image, index) => (
                  <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage(image)} aria-label={`View product image ${index + 1}`} aria-pressed={selectedImage === image} className={`h-14 w-12 shrink-0 overflow-hidden border-2 md:aspect-[3/4] md:h-auto md:w-auto ${selectedImage === image ? 'border-slate-900' : 'border-transparent'}`}>
                    <img src={image} alt="" onError={handleShopImageError} className="h-full w-full object-cover object-top" />
                  </button>
                ))}
              </div>
              <div className="relative h-[36svh] min-h-52 max-h-[340px] overflow-hidden bg-slate-100 md:aspect-[3/4] md:h-auto md:max-h-none">
                <img src={selectedImage || selectedProduct.image} alt={`${selectedProduct.name}, ${selectedProduct.type}`} onError={handleShopImageError} className="absolute inset-0 h-full w-full object-cover object-top" />
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white shadow-lg">
                  <span>{selectedProduct.savedCount + (savedProductIds.includes(selectedProduct.id) ? 1 : 0)}</span>
                  <Heart className="h-4 w-4" fill="currentColor" />
                </div>
              </div>
            </div>
            <div className="flex flex-col p-6 sm:justify-center sm:p-8 lg:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{selectedProduct.section}</p>
              <h2 id="quick-view-title" className="mt-3 text-2xl font-bold tracking-tight">{selectedProduct.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{selectedProduct.type}</p>
              <p className="mt-5 text-xl font-bold tracking-tight">{formatPrice(selectedProduct.price)}{selectedProduct.oldPrice && <span className="ml-3 text-sm font-normal text-slate-500 line-through">{formatPrice(selectedProduct.oldPrice)}</span>}</p>

              <p className="mt-6 text-[11px] font-bold tracking-[0.12em]">COLOUR: <span className="font-medium tracking-normal text-slate-600">{selectedProduct.color}</span></p>
              <label htmlFor="product-size" className="mt-6 flex items-center justify-between text-[11px] font-bold tracking-[0.12em]">SIZE: <button type="button" onClick={() => setSizeGuideOpen((open) => !open)} className="font-medium tracking-normal underline underline-offset-4">Size Guide</button></label>
              <select id="product-size" value={selectedSize} onChange={(event) => { const nextSize = event.target.value; setSelectedSize(nextSize); setSelectedBackupSizes((sizes) => sizes.filter((size) => size !== nextSize)); setSizeError(false); }} className="mt-2 h-12 w-full border border-slate-400 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-900">
                <option value="">Please select</option>
                {(selectedProduct.availableSizes?.length ? selectedProduct.availableSizes : ['S', 'M', 'L', 'XL', 'XXL']).map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-700">
                <input type="checkbox" checked={kigaliFitting} onChange={(event) => { setKigaliFitting(event.target.checked); if (!event.target.checked) setSelectedBackupSizes([]); setPaymentConfirmation(null); }} className="mt-1 h-4 w-4 accent-emerald-700" />
                <span><strong>Kigali Home Fitting:</strong> Bring extra sizes to try on (+RWF 2,000 rider wait fee)</span>
              </label>
              {kigaliFitting && selectedSize && (
                <fieldset className="mt-2 rounded-lg border border-slate-200 p-3">
                  <legend className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Choose up to 2 backup sizes</legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {(selectedProduct.availableSizes?.length ? selectedProduct.availableSizes : ['S', 'M', 'L', 'XL', 'XXL']).filter((size) => size !== selectedSize).map((size) => (
                      <label key={size} className="inline-flex items-center gap-1.5 text-xs text-slate-700">
                        <input type="checkbox" checked={selectedBackupSizes.includes(size)} disabled={!selectedBackupSizes.includes(size) && selectedBackupSizes.length >= 2} onChange={(event) => setSelectedBackupSizes((current) => event.target.checked ? [...current, size].slice(0, 2) : current.filter((item) => item !== size))} className="h-3.5 w-3.5 accent-emerald-700" />
                        {size}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              <p className="mt-3 text-xs text-slate-600">Order total: <strong className="text-slate-900">{formatPrice(selectedProduct.price + (kigaliFitting ? 2000 : 0))}</strong></p>
              {sizeGuideOpen && <p className="mt-2 rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-700">For the best fit, choose your usual size. Select one size up for a relaxed fit.</p>}

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <button type="button" data-activity-action="Add to Bag" onClick={() => { if (!selectedSize) { setSizeError(true); recordActivityFriction('Add to Bag', "Clicked 'Add to Bag' without selecting a size"); return; } addToBag(selectedProduct, selectedSize, selectedBackupSizes, kigaliFitting); setSelectedProduct(null); }} className="inline-flex min-h-12 w-full flex-1 items-center justify-center gap-2 rounded-sm bg-[#018849] px-5 text-xs font-bold tracking-[0.15em] text-white transition hover:bg-[#016d3b]">
                  <ShoppingBag className="h-4 w-4" /> ADD TO BAG
                </button>
                <button type="button" onClick={() => toggleSaved(selectedProduct)} aria-label={savedProductIds.includes(selectedProduct.id) ? 'Remove from saved items' : 'Save this item'} aria-pressed={savedProductIds.includes(selectedProduct.id)} className="flex h-12 w-12 shrink-0 self-end items-center justify-center rounded-full border border-slate-300 text-slate-900 transition hover:border-slate-900 md:self-auto">
                  <Heart className="h-5 w-5" fill={savedProductIds.includes(selectedProduct.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              {sizeError && <p role="alert" className="mt-2 text-xs font-medium text-rose-700">Please select a size before continuing.</p>}
              <button type="button" data-activity-action="Order via WhatsApp" onClick={() => {
                if (!selectedSize) {
                  setSizeError(true);
                  recordActivityFriction('Order via WhatsApp', "Clicked 'Order via WhatsApp' without selecting a size");
                  return;
                }
                submitWhatsAppOrder(selectedProduct, selectedSize, selectedBackupSizes, kigaliFitting);
              }} aria-disabled={!selectedSize} className={`mt-3 inline-flex min-h-11 w-full items-center justify-center border border-slate-300 px-4 text-center text-xs font-semibold transition hover:bg-slate-100 ${selectedSize ? '' : 'opacity-60'}`}>
                <Check className="mr-2 h-4 w-4" /> Order via WhatsApp / MTN MoMo
              </button>
              <PaymentInstructions confirmation={paymentConfirmation} copied={paymentCopied} onCopy={copyPaymentInstructions} />
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">Free delivery in Kigali on qualifying orders</div>
              <div className="mt-5 border-t border-slate-200">
                <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen} className="flex w-full items-center justify-between py-4 text-left text-xs font-bold tracking-[0.12em]">
                  Product Details <span className="text-lg font-normal">{detailsOpen ? '−' : '+'}</span>
                </button>
                {detailsOpen && <p className="pb-4 text-sm leading-6 text-slate-600">{selectedProduct.type} in {selectedProduct.color.toLowerCase()}. Designed for everyday style and made with INSHUTI’s local fashion focus.</p>}
              </div>
              <div className="mt-2 flex justify-center rounded-lg bg-slate-950 px-3 py-2">
                <PaymentBadges />
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-500">WhatsApp: +250 793 683 432</p>
            </div>
          </section>
        </div>
      )}

      {bagDrawerOpen && (
        <div role="presentation" onClick={() => setBagDrawerOpen(false)} className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm">
          <aside role="dialog" aria-modal="true" aria-labelledby="bag-title" onClick={(event) => event.stopPropagation()} className="absolute right-0 top-0 flex h-full w-full max-w-none flex-col bg-white text-slate-900 shadow-2xl md:max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <div><h2 id="bag-title" className="text-lg font-bold">Your Bag</h2><p className="mt-1 text-xs text-slate-500">{bagCount} {bagCount === 1 ? 'item' : 'items'}</p></div>
              <button type="button" onClick={() => setBagDrawerOpen(false)} aria-label="Close bag" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {bagItems.length ? bagItems.map((item) => {
                const backupSizes = item.backupSizes || [];
                return (
                  <article key={item.id} className="border-b border-slate-200 pb-5">
                    <div className="flex gap-4">
                      <img src={item.product.image} alt={item.product.name} onError={handleShopImageError} className="h-32 w-24 shrink-0 object-cover object-top" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">{item.product.name}</h3><p className="mt-1 text-xs text-slate-500">{item.product.color} · {formatPrice(item.product.price)}</p></div><button type="button" onClick={() => setBagItems((items) => items.filter((current) => current.id !== item.id))} className="text-xs text-slate-500 underline">Remove</button></div>
                        <label htmlFor={`bag-size-${item.id}`} className="mt-3 block text-[10px] font-bold uppercase tracking-wide">Main size</label>
                        <select id={`bag-size-${item.id}`} value={item.size} onChange={(event) => updateBagItem(item.id, { size: event.target.value, backupSizes: backupSizes.filter((size) => size !== event.target.value) })} className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm">
                          {(item.product.availableSizes?.length ? item.product.availableSizes : ['S', 'M', 'L', 'XL', 'XXL']).map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                      </div>
                    </div>
                    <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-700">
                      <input type="checkbox" checked={Boolean(item.fitting)} onChange={(event) => updateBagItem(item.id, { fitting: event.target.checked, backupSizes: event.target.checked ? backupSizes : [] })} className="mt-1 h-4 w-4 accent-emerald-700" />
                      <span><strong>Kigali Home Fitting:</strong> Bring extra sizes to try on (+RWF 2,000 rider wait fee)</span>
                    </label>
                    {item.fitting && <fieldset className="mt-2 rounded-lg border border-slate-200 p-3"><legend className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">Choose up to 2 backup sizes</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{(item.product.availableSizes?.length ? item.product.availableSizes : ['S', 'M', 'L', 'XL', 'XXL']).filter((size) => size !== item.size).map((size) => <label key={size} className="inline-flex items-center gap-1.5 text-xs text-slate-700"><input type="checkbox" checked={backupSizes.includes(size)} disabled={!backupSizes.includes(size) && backupSizes.length >= 2} onChange={(event) => updateBagItem(item.id, { backupSizes: event.target.checked ? [...backupSizes, size].slice(0, 2) : backupSizes.filter((backup) => backup !== size) })} className="h-3.5 w-3.5 accent-emerald-700" />{size}</label>)}</div></fieldset>}
                  </article>
                );
              }) : <p className="py-16 text-center text-sm text-slate-500">Your bag is empty. Explore the latest INSHUTI drops to add something.</p>}
            </div>
            {bagItems.length > 0 && <div className="border-t border-slate-200 p-5">
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] font-semibold text-slate-600">Full name<input value={checkoutName} onChange={(event) => setCheckoutName(event.target.value)} autoComplete="name" placeholder="Your name" className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-slate-900" /></label>
                <label className="text-[10px] font-semibold text-slate-600">Email<input type="email" value={checkoutEmail} onChange={(event) => setCheckoutEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-slate-900" /></label>
              </div>
              <div className="flex justify-between text-xs text-slate-600"><span>Subtotal</span><span>{formatPrice(bagItems.reduce((sum, item) => sum + item.product.price, 0))}</span></div>
              <div className="mt-2 flex justify-between text-xs text-slate-600"><span>Kigali Home Fitting</span><span>{bagItems.some((item) => item.fitting) ? formatPrice(2000) : formatPrice(0)}</span></div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-sm font-bold"><span>Order total</span><span>{formatPrice(bagItems.reduce((sum, item) => sum + item.product.price, 0) + (bagItems.some((item) => item.fitting) ? 2000 : 0))}</span></div>
              <button type="button" data-activity-action="Checkout Bag" onClick={() => { recordActivityPage('Checkout', '/shop'); checkoutBagViaWhatsApp(); }} className="mt-4 h-12 w-full bg-slate-900 text-xs font-bold tracking-[0.14em] text-white transition hover:bg-black">ORDER VIA WHATSAPP / MTN MOMO</button>
            </div>}
            <div className="px-5 pb-5"><PaymentInstructions confirmation={paymentConfirmation} copied={paymentCopied} onCopy={copyPaymentInstructions} /></div>
          </aside>
        </div>
      )}

      {savedDrawerOpen && (
        <div role="presentation" onClick={() => setSavedDrawerOpen(false)} className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm">
          <aside role="dialog" aria-modal="true" aria-labelledby="saved-items-title" onClick={(event) => event.stopPropagation()} className="absolute right-0 top-0 flex h-full w-full max-w-none flex-col bg-white text-slate-900 shadow-2xl md:max-w-md">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">
              <div>
                <h2 id="saved-items-title" className="text-lg font-bold">Saved Items</h2>
                <p className="mt-1 text-xs text-slate-500">{savedProducts.length} pieces you love</p>
              </div>
              <button type="button" onClick={() => setSavedDrawerOpen(false)} aria-label="Close saved items" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {savedProducts.length ? savedProducts.map((product) => (
                <article key={product.id} className="flex gap-4 border-b border-slate-200 pb-4">
                  <button type="button" onClick={() => { setSavedDrawerOpen(false); setSelectedProduct(product); setSelectedImage(product.image); setSelectedSize(''); setSizeError(false); setKigaliFitting(false); setSelectedBackupSizes([]); setPaymentConfirmation(null); recordActivityPage(`Product: ${product.name}`, '/shop'); }} className="h-28 w-20 shrink-0 overflow-hidden bg-slate-100">
                    <img src={product.image} alt={product.name} onError={handleShopImageError} className="h-full w-full object-cover object-top" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{product.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{product.color} · {formatPrice(product.price)}</p>
                    <p className="mt-2 text-[10px] text-slate-500">{product.savedCount + 1} people love this piece</p>
                    <div className="mt-3 flex gap-3 text-[10px] font-bold tracking-wide">
                      <button type="button" onClick={() => addToBag(product, product.availableSizes?.[0] || 'M')} className="underline underline-offset-4">MOVE TO BAG</button>
                      <button type="button" onClick={() => toggleSaved(product)} className="text-slate-500 underline underline-offset-4">REMOVE</button>
                    </div>
                  </div>
                </article>
              )) : <p className="py-12 text-center text-sm text-slate-500">Your saved items will appear here.</p>}
            </div>
            <div className="border-t border-slate-200 p-5">
              <button type="button" onClick={() => setSavedDrawerOpen(false)} className="h-12 w-full bg-slate-900 text-xs font-bold tracking-[0.14em] text-white">CONTINUE SHOPPING</button>
            </div>
          </aside>
        </div>
      )}

      {profileModalOpen && (
        <div role="presentation" onClick={closeProfileModal} className="fixed inset-0 z-[3100] flex items-center justify-center bg-black/60 p-0 backdrop-blur-sm sm:p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={(event) => event.stopPropagation()} className="relative min-h-full max-h-full w-full max-w-none overflow-y-auto rounded-none bg-white p-6 text-slate-900 shadow-2xl md:min-h-0 md:max-w-md md:rounded-2xl md:p-8">
            <button type="button" onClick={closeProfileModal} aria-label="Close sign in" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"><X className="h-4 w-4" /></button>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">INSHUTI ACCOUNT</p>
            <h2 id="profile-modal-title" className="mt-2 text-2xl font-bold">{shopperProfile ? 'Your INSHUTI Account' : authMode === 'signup' ? 'Create your account' : 'Sign in to INSHUTI'}</h2>
            {shopperProfile ? (
              <div className="mt-6">
                <p className="text-sm font-semibold">{shopperProfile.name}</p>
                <p className="mt-1 text-xs text-slate-500">{shopperProfile.email}</p>
                <label htmlFor="shopper-preference" className="mt-6 block text-xs font-semibold">Style preference</label>
                <select id="shopper-preference" value={profilePreferenceDraft} onChange={(event) => setProfilePreferenceDraft(event.target.value as Department)} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900">
                  <option value="WOMEN">Women</option>
                  <option value="MEN">Men</option>
                </select>
                <button type="button" disabled={authBusy} onClick={saveCustomerPreference} className="mt-4 h-11 w-full border border-slate-300 text-xs font-bold tracking-[0.12em] disabled:opacity-50">SAVE PREFERENCE</button>
                {authError && <p role="alert" className="mt-3 text-xs text-rose-700">{authError}</p>}
                <button type="button" disabled={authBusy} onClick={signOutCustomer} className="mt-3 h-11 w-full bg-slate-900 text-xs font-bold tracking-[0.14em] text-white disabled:opacity-50">{authBusy ? 'PLEASE WAIT…' : 'SIGN OUT'}</button>
              </div>
            ) : (
              <>
                <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Customer account access">
                  <button type="button" role="tab" aria-selected={authMode === 'signin'} onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthMessage(''); }} className={`h-10 rounded-md text-xs font-bold ${authMode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>SIGN IN</button>
                  <button type="button" role="tab" aria-selected={authMode === 'signup'} onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthMessage(''); }} className={`h-10 rounded-md text-xs font-bold ${authMode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>CREATE ACCOUNT</button>
                </div>
                <button type="button" disabled={authBusy} onClick={continueWithGoogle} className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50">
                  <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.75 7.18l7.73 6C44.43 37.98 46.98 31.8 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1-.76-4.59c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.54 2.56 10.78l7.97-6.19Z" transform="translate(0 0)"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
                  Continue with Google
                </button>
                <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" />Or continue with email<span className="h-px flex-1 bg-slate-200" /></div>
                <form onSubmit={submitCustomerAuth}>
                  {authMode === 'signup' && <>
                    <label htmlFor="shopper-name" className="block text-xs font-semibold">Full name</label>
                    <input id="shopper-name" value={profileNameDraft} onChange={(event) => setProfileNameDraft(event.target.value)} required autoComplete="name" placeholder="e.g. Ange Uwase" className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900" />
                  </>}
                  <label htmlFor="shopper-email" className={`${authMode === 'signup' ? 'mt-4' : ''} block text-xs font-semibold`}>Email address</label>
                  <input id="shopper-email" type="email" value={profileEmailDraft} onChange={(event) => setProfileEmailDraft(event.target.value)} required autoComplete="email" placeholder="you@example.com" className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900" />
                  <label htmlFor="shopper-password" className="mt-4 block text-xs font-semibold">Password</label>
                  <input id="shopper-password" type="password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} required minLength={6} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 6 characters" className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900" />
                  {authMode === 'signup' && <>
                    <label htmlFor="shopper-preference" className="mt-4 block text-xs font-semibold">Style preference</label>
                    <select id="shopper-preference" value={profilePreferenceDraft} onChange={(event) => setProfilePreferenceDraft(event.target.value as Department)} className="mt-2 h-11 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900"><option value="WOMEN">Women</option><option value="MEN">Men</option></select>
                    <label className="mt-4 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={marketingOptIn} onChange={(event) => setMarketingOptIn(event.target.checked)} className="h-4 w-4 accent-slate-900" />Email me about new arrivals &amp; exclusive drops</label>
                  </>}
                  {authError && <p role="alert" className="mt-3 text-xs text-rose-700">{authError}</p>}
                  {authMessage && <p role="status" className="mt-3 text-xs text-emerald-700">{authMessage}</p>}
                  <button type="submit" disabled={authBusy} className="mt-6 h-12 w-full bg-slate-900 text-xs font-bold tracking-[0.14em] text-white disabled:opacity-50">{authBusy ? 'PLEASE WAIT…' : authMode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {cookiePreferencesOpen && (
        <div role="presentation" onClick={() => setCookiePreferencesOpen(false)} className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title" onClick={(event) => event.stopPropagation()} className="max-h-[100svh] w-full max-w-none overflow-y-auto rounded-none bg-white p-6 text-slate-900 shadow-2xl md:max-w-md md:rounded-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">YOUR PRIVACY</p>
                <h2 id="cookie-preferences-title" className="mt-2 text-xl font-bold">Cookie Preferences</h2>
              </div>
              <button type="button" onClick={() => setCookiePreferencesOpen(false)} aria-label="Close cookie preferences" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">Choose which optional cookies and local preferences INSHUTI may remember on this device.</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm"><span>Essential preferences</span><span className="text-xs font-semibold text-emerald-700">Always on</span></div>
              <label className="flex items-center justify-between text-sm"><span>Analytics cookies</span><input type="checkbox" checked={analyticsCookies} onChange={(event) => setAnalyticsCookies(event.target.checked)} className="h-4 w-4 accent-slate-900" /></label>
              <label className="flex items-center justify-between text-sm"><span>Personalization cookies</span><input type="checkbox" checked={personalizationCookies} onChange={(event) => setPersonalizationCookies(event.target.checked)} className="h-4 w-4 accent-slate-900" /></label>
            </div>
            <button type="button" onClick={() => { dismissCookieBanner('managed'); setCookiePreferencesOpen(false); }} className="mt-7 h-12 w-full bg-slate-900 text-xs font-bold tracking-[0.14em] text-white">SAVE PREFERENCES</button>
          </section>
        </div>
      )}

      {shopDataLoaded && !cookieChoice && !cookiePreferencesOpen && (
        <aside aria-label="Cookie consent" className={`fixed inset-x-0 bottom-0 z-[1500] max-h-[60svh] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-[0_-12px_40px_rgba(0,0,0,0.16)] transition-all duration-300 sm:px-8 sm:py-4 ${cookieBannerClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-xs font-bold tracking-[0.12em]">COOKIES AT INSHUTI</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">We use cookies and local storage to remember your saved items, bag contents, and preferences, so your INSHUTI shopping experience feels personal.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 md:flex-row">
              <button type="button" onClick={() => setCookiePreferencesOpen(true)} className="min-h-10 border border-slate-400 px-4 text-[10px] font-bold tracking-[0.1em]">MANAGE PREFERENCES</button>
              <button type="button" onClick={() => dismissCookieBanner('accepted')} className="min-h-10 bg-slate-900 px-5 text-[10px] font-bold tracking-[0.1em] text-white">ACCEPT COOKIES</button>
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}
