'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import {
  ShieldCheck,
  Cloud,
  Smartphone,
  FileText,
  Globe,
  Menu,
  X,
  CheckCircle2,
  Play,
  Lock,
  ArrowRight,
  PhoneCall,
  LockKeyhole,
  Sun,
  Moon,
} from 'lucide-react';
import { HOME_PAGE_IMAGE_SLOTS, fetchCloudStoreItems, getStoreAnalytics, isSupabaseConfigured, recordActivityFriction, recordActivityPage, type HomePageImageSlot } from '@/src/utils/storeAnalytics';
import { supabase } from '@/src/lib/supabase';
import InshutiLogo from '@/src/components/InshutiLogo';
import GoogleWelcomePrompt from '@/src/components/GoogleWelcomePrompt';

function authUserName(user: User) {
  const metadata = user.user_metadata || {};
  const name = [metadata.full_name, metadata.name, metadata.fullName].find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  return name?.trim() || user.email?.split('@')[0] || 'INSHUTI Customer';
}

function TeamAvatar({
  variant,
  name,
}: {
  variant: 'emmanuel' | 'mugisha';
  name: string;
}) {
  const isEmmanuel = variant === 'emmanuel';

  return (
    <svg viewBox="0 0 160 160" role="img" aria-label={`Illustrated avatar of ${name}`} className="h-full w-full">
      <rect width="160" height="160" fill={isEmmanuel ? '#e3eee9' : '#e8edf5'} />
      <circle cx="133" cy="31" r="19" fill={isEmmanuel ? '#c8ded4' : '#d4deed'} />
      <path d="M24 160c3-30 19-47 45-55h22c26 8 42 25 45 55H24Z" fill={isEmmanuel ? '#182b45' : '#243147'} />
      <path d="m63 105 17 15 17-15 13 55H50l13-55Z" fill="#f8f7f3" />
      <path d="m76 118 4 5 4-5 8 42H72l8-42Z" fill={isEmmanuel ? '#267667' : '#b35a45'} />
      <path d="M68 96h24v20c-7 8-17 8-24 0V96Z" fill={isEmmanuel ? '#7a4a33' : '#68402f'} />
      <ellipse cx="51" cy="75" rx="6" ry="10" fill={isEmmanuel ? '#7a4a33' : '#68402f'} />
      <ellipse cx="109" cy="75" rx="6" ry="10" fill={isEmmanuel ? '#7a4a33' : '#68402f'} />
      <ellipse cx="80" cy="72" rx="29" ry="36" fill={isEmmanuel ? '#8a563b' : '#76503a'} />
      {isEmmanuel ? (
        <path d="M51 68c-2-16 5-28 18-33 14-6 31-2 39 9 5 6 7 15 4 25l-8-9c-14 4-29 3-45-3l-8 11Z" fill="#211b19" />
      ) : (
        <g fill="#211b19">
          <path d="M50 70c-3-17 4-30 17-36 14-7 33-3 41 9 5 7 6 17 2 27l-8-8c-13 5-29 4-44-2l-8 10Z" />
          <circle cx="59" cy="45" r="8" />
          <circle cx="72" cy="38" r="8" />
          <circle cx="88" cy="38" r="8" />
          <circle cx="101" cy="46" r="8" />
        </g>
      )}
      <path d="M65 70h9m12 0h9" stroke="#211b19" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="69" cy="76" r="2" fill="#211b19" />
      <circle cx="91" cy="76" r="2" fill="#211b19" />
      <path d="m78 78-2 9h6" fill="none" stroke="#603b2c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M72 94c5 4 11 4 16 0" fill="none" stroke="#512f25" strokeWidth="2" strokeLinecap="round" />
      <path d="m63 106 17 15-12 10-11-22m40-3-17 15 12 10 11-22" fill={isEmmanuel ? '#233a59' : '#34445d'} />
    </svg>
  );
}

const heroBackgrounds = [
  '/tshirt.png',
  '/Tshirt_img_5248750936257456493.jpg',
];

const heroProductImages = [
  '/Grey%20color%20polo.png',
  '/T-shirt%20together.png',
  '/white%20polo%20love.png',
];

export default function LandingPage() {
  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [homePageImages, setHomePageImages] = useState<Partial<Record<HomePageImageSlot, string>>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroBackgroundIndex, setHeroBackgroundIndex] = useState(0);
  const [heroProductIndex, setHeroProductIndex] = useState(0);
  const [heroProductExiting, setHeroProductExiting] = useState(false);
  const [heroParallaxOffset, setHeroParallaxOffset] = useState(0);
  const [heroCenterScale, setHeroCenterScale] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [momoInstructionsOpen, setMomoInstructionsOpen] = useState(false);
  const orderSubmittedRef = useRef(false);
  const [shopperName, setShopperName] = useState('');
  const [shopperEmail, setShopperEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const displayedHeroProductImages = heroProductImages.map((image, index) => homePageImages[HOME_PAGE_IMAGE_SLOTS[index].id] || image);
  const wardrobeFeatureImage = homePageImages['home-wardrobe-feature'] || heroProductImages[heroProductIndex];

  useEffect(() => {
    const refreshHomePageImages = async () => {
      const localImages = getStoreAnalytics().homePageImages || {};
      if (!isSupabaseConfigured) { setHomePageImages(localImages); return; }
      try {
        const cloud = await fetchCloudStoreItems();
        setHomePageImages(cloud?.homePageImages || {});
      } catch (error) { console.error('Supabase home page photo sync failed:', error); }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'inshuti-home-page-images' || event.key === 'inshuti-store-analytics') refreshHomePageImages();
    };
    void refreshHomePageImages();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const applyHomeAuthUser = (user: User | null) => {
      if (!user) {
        setShopperName('');
        setShopperEmail('');
        window.localStorage.removeItem('inshuti-shop-profile');
        return;
      }
      const name = authUserName(user);
      const email = user.email?.trim().toLowerCase() || '';
      setShopperName(name);
      setShopperEmail(email);
      let previousPreference: 'MEN' | 'WOMEN' = 'WOMEN';
      try {
        const oldProfile = JSON.parse(window.localStorage.getItem('inshuti-shop-profile') || 'null');
        if (oldProfile?.preference === 'MEN' || oldProfile?.preference === 'WOMEN') previousPreference = oldProfile.preference;
      } catch { /* Ignore malformed local profile data. */ }
      const metadataPreference = String(user.user_metadata?.style_preference || '').toUpperCase();
      const preference = metadataPreference === 'MEN' || metadataPreference === 'WOMEN' ? metadataPreference : previousPreference;
      window.localStorage.setItem('inshuti-shop-profile', JSON.stringify({ name, email, preference }));
    };

    if (!supabase) {
      try {
        const profile = JSON.parse(window.localStorage.getItem('inshuti-shop-profile') || 'null');
        if (profile && typeof profile.name === 'string') {
          setShopperName(profile.name.trim());
          setShopperEmail(typeof profile.email === 'string' ? profile.email : '');
        }
      } catch {
        setShopperName('');
        setShopperEmail('');
      }
      setAuthLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) { applyHomeAuthUser(data.session?.user || null); setAuthLoading(false); }
    }).catch((error) => { console.error('Could not restore INSHUTI customer session:', error); if (active) setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { applyHomeAuthUser(session?.user || null); setAuthLoading(false); }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const shopperInitials = shopperName.split(/\s+/).filter(Boolean).length > 1
    ? `${shopperName.trim().split(/\s+/)[0][0]}${shopperName.trim().split(/\s+/).slice(-1)[0]?.[0] || ''}`.toUpperCase()
    : shopperName.trim().slice(0, 2).toUpperCase();
  const whatsappOrderUrl = `https://wa.me/250793683432?text=${encodeURIComponent(`Hello INSHUTI, I would like to order the Everyday T-Shirt (RWF 12,000).${shopperName ? ` Customer: ${shopperName}${shopperEmail ? ` · ${shopperEmail}` : ''}.` : ''}`)}`;

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('inshuti-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('inshuti-theme', theme);
  }, [theme]);

  const openOrderModal = () => {
    orderSubmittedRef.current = false;
    setMomoInstructionsOpen(false);
    setOrderModalOpen(true);
    recordActivityPage('Checkout', '/');
  };

  const closeOrderModal = () => {
    if (orderModalOpen && !orderSubmittedRef.current) recordActivityFriction('Checkout', 'Abandoned Checkout');
    setMomoInstructionsOpen(false);
    setOrderModalOpen(false);
  };

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setHeroBackgroundIndex((currentIndex) => (currentIndex + 1) % heroBackgrounds.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let exitTimeoutId: number | undefined;
    const intervalId = window.setInterval(() => {
      setHeroProductExiting(true);
      exitTimeoutId = window.setTimeout(() => {
        setHeroProductIndex((currentIndex) => (currentIndex + 1) % heroProductImages.length);
        setHeroProductExiting(false);
      }, 700);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      if (exitTimeoutId !== undefined) window.clearTimeout(exitTimeoutId);
    };
  }, []);

  useEffect(() => {
    if (!orderModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOrderModalOpen(false);
        setMomoInstructionsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [orderModalOpen]);

  useEffect(() => {
    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

    revealElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frameId = 0;
    const updateParallax = () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const offset = Math.max(-18, Math.min(18, window.scrollY * -0.025));
        const heroHeight = document.getElementById('top')?.offsetHeight ?? window.innerHeight;
        const scrollProgress = Math.min(1, Math.max(0, window.scrollY / heroHeight));
        setHeroParallaxOffset(offset);
          setHeroCenterScale(1 + scrollProgress * 0.35);
      });
    };

    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateParallax);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, []);

  const content = {
    en: {
      nav: {
        signIn: 'Sign In',
        signUp: 'Start Free Trial',
        about: 'About Us',
        features: 'Features',
        pricing: 'Pricing',
        security: 'Security',
      },
      hero: {
        badge: 'Built for Rwandan Merchants & Micro-Entrepreneurs',
        title: 'Secure, Simple Business Records for Rwandan Merchants',
        subtitle:
          'Never lose your sales history, debts, or customer bookings again. Inshuti keeps your business safe, organized, and ready for growth.',
        ctaPrimary: 'Get Started Free',
        ctaSecondary: 'Watch 1-Min Demo',
        priceLabel: 'SERVICE STARTING AT',
        price: 'RWF 19,000 / mo',
        trust: 'No Bank Card Needed',
        trust2: 'MTN MoMo Integrated',
      },
      features: { 
        title: 'Why Rwandan Vendors Choose Inshuti',
        subtitle:
          'Built for quick daily sales entry, dependable backup, and peace of mind as your business grows.',
        f1Title: '100% Private & Encrypted',
        f1Desc:
          'Your revenue data belongs only to you. Not even admins can view your exact numbers without your password.',
        f2Title: 'Disaster-Proof Backups',
        f2Desc:
          'If your phone is lost, damaged, or stolen, you can recover everything from another device in minutes.',
        f3Title: 'Works Offline & Kinyarwanda UI',
        f3Desc:
          'Record sales in seconds without needing fast internet or technical experience.',
        f4Title: 'Instant Statements for Loans & SACCOs',
        f4Desc:
          'Generate clean PDF reports to support loan applications, supplier records, and financial reviews.',
      },
      security: {
        title: 'Complete Privacy & Data Ownership',
        badge: 'Bank-Grade Encryption',
        desc:
          'Your business records are protected by your own password. We never share revenue data with third parties or tax authorities.',
        points: [
          'Zero access by unauthorized third parties',
          'Encrypted automatic cloud sync',
          'Instant PIN & password protection for every record',
        ],
      },
      pricing: {
        title: 'Simple, Transparent Pricing',
        subtitle: 'Start organizing your store finances today with zero risk.',
        badge: 'BETA OFFER',
        planName: 'Merchant Pro',
        price: 'Free for Beta Users',
        period: 'Then 1,000 RWF / month',
        features: [
          'Unlimited daily sales & expense entries',
          'Debt tracking and SMS reminders',
          'Automated PDF financial statements',
          'Dedicated WhatsApp & MTN MoMo support',
        ],
        cta: 'Create Your Account Now',
      },
      footer: {
        desc:
          'Simple, private business record-keeping tailored for vendors and small businesses across Rwanda.',
        quickLinks: 'Quick Links',
        aboutUs: 'About Us',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        support: 'Contact Support',
        supportSub: 'Need help? Chat with us on WhatsApp or MoMo.',
      },
    },
    rw: {
      nav: {
        signIn: 'Kwinjira',
        signUp: 'Tangira Kubigerageza ku Buntu',
        about: 'Ibitwerekeye',
        features: 'Ibyo Tukorera',
        pricing: 'Ibiciro',
        security: 'Umutekano',
      },
      hero: {
        badge: 'Yakozwe ku bw’abacuruzi n’abikorera bo mu Rwanda',
        title: 'Ibitabo by’ubucuruzi bwanyu mu mutekano',
        subtitle: "Inshuti ibika amakuru n'ibicuruzwa byanyu mu mutekano no mu buryo bworoshye.",
        ctaPrimary: 'Tangira Ku Buntu',
        ctaSecondary: 'Reba Video',
        priceLabel: 'GITANGWA KU BUNDU',
        price: 'RWF 1,000 / kwezi',
        trust: 'NTA KARITA YA BANKI IRIHO',
        trust2: 'MTN MOMO YASHYIZWEHO',
      },
      features: {
        title: 'Kuki Abacuruzi Bazitondera Inshuti?',
        subtitle:
          'Yakozwe kugira ngo wandike ibicuruzwa bya buri munsi vuba, vuba, kandi ukomeze kugira amahoro.',
        f1Title: 'Ibibitswe mu Ibanga 100%',
        f1Desc:
          'Amakuru y’inyungu yawe ni ayanyu gusa. Nta na bimwe na nyir’aho wundi ubasha kubibona utaribombye.',
        f2Title: 'Ibackup z’ibihe byose',
        f2Desc:
          'Niba telefoni yawe yabuze, yacitse, cyangwa yibwa, uba ushobora kubyibuka akanya gato uriya yindi.',
        f3Title: 'Ikora n’iyo Intaneti itariho',
        f3Desc:
          'Andika ibicuruzwa byawe mu masegonda, nta internet nyinshi cyangwa ubumenyi bwihariye bukeneye.',
        f4Title: 'Raporo z’Inguzanyo & SACCO',
        f4Desc:
          'Kora raporo za PDF zitanga amakuru meza y’ubucuruzi bwawe kugira ngo ubone inguzanyo or SACCO.',
      },
      security: {
        title: 'Ibibitswe mu Ibanga no Kubifata By’umwihariko',
        badge: 'Umutekano wa Banki',
        desc:
          'Amakuru y’ubucuruzi bwawe afungiye ku ijambo ry’ibanga ryawe. Ntidushare amakuru y’ibyinjira n’abandi.',
        points: [
          'Nta muntu utabiherewe ubasha kubona amakuru',
          'Gukoresha backup mu mutekano wihariye',
          'PIN na password byihutirwa ku buri kibaho',
        ],
      },
      pricing: {
        title: 'Ibiciro Byoroshye n’byeruye',
        subtitle: 'Tangira gupanga imari y’inyungu zawe uyu munsi nta byago.',
        badge: 'IGIHE CY’ABATANGIRA',
        planName: 'Merchant Pro',
        price: 'Kuri Beta ku buntu',
        period: 'Nyuma 1,000 RWF / kwezi',
        features: [
          'Kwandika ibicuruzwa n’inyungu zose ku munsi',
          'Gukurikirana ibirarane no kohereza ubutumwa',
          'Gukora raporo za PDF z’imari',
          'Ubufasha bwa WhatsApp & MTN MoMo',
        ],
        cta: 'Kora Konti Yanyu None',
      },
      footer: {
        desc: 'Kwandika no kubika amakuru y’ubucuruzi mu mutekano, bwagenewe abacuruzi muri Rwanda.',
        quickLinks: 'Ibyihutirwa',
        aboutUs: 'Ibitwerekeye',
        privacy: 'Ibanga',
        terms: 'Amategeko',
        support: 'Ubufasha',
        supportSub: 'Ufite ikibazo? Wandikire ku WhatsApp cyangwa MoMo.',
      },
    },
  };

  const t = content[lang];
  const isKinyarwanda = lang === 'rw';
  const featureCards = [
    {
      icon: ShieldCheck,
      title: isKinyarwanda ? '100% Local Handcrafted Quality' : '100% Local Handcrafted Quality',
      text: isKinyarwanda
        ? 'Sourced and stitched right here in Rwanda with tailored precision.'
        : 'Sourced and stitched right here in Rwanda with tailored precision.',
    },
    {
      icon: Cloud,
      title: isKinyarwanda ? 'Affordable Student Pricing' : 'Affordable Student Pricing',
      text: isKinyarwanda
        ? 'Direct-to-consumer prices without middlemen or expensive store markups.'
        : 'Direct-to-consumer prices without middlemen or expensive store markups.',
    },
    {
      icon: Smartphone,
      title: isKinyarwanda ? 'Easy Ordering via WhatsApp & MoMo' : 'Easy Ordering via WhatsApp & MoMo',
      text: isKinyarwanda
        ? 'Order in seconds using local digital payments and quick chat support.'
        : 'Order in seconds using local digital payments and quick chat support.',
    },
    {
      icon: FileText,
      title: isKinyarwanda ? 'Exclusive 1-of-1 Collections' : 'Exclusive 1-of-1 Collections',
      text: isKinyarwanda
        ? 'Unique garments designed so you stand out wherever you go.'
        : 'Unique garments designed so you stand out wherever you go.',
    },
  ];

  const useCases = [
    {
      title: 'EVERYDAY ESSENTIALS',
      label: isKinyarwanda ? 'EVERYDAY WEAR' : 'EVERYDAY WEAR',
      text: isKinyarwanda ? 'Premium 100% cotton T-shirts tailored for effortless daily style and all-day comfort.' : 'Premium 100% cotton T-shirts tailored for effortless daily style and all-day comfort.',
      image: '/Gemini_Generated_Image_jkm77kjkm77kjkm7.jpeg',
    },
    {
      title: 'LIMITED EDITIONS',
      label: isKinyarwanda ? 'LIMITED DROPS' : 'LIMITED DROPS',
      text: isKinyarwanda ? 'Exclusive, custom-tailored drops featuring unique modern cuts and sharp fits.' : 'Exclusive, custom-tailored drops featuring unique modern cuts and sharp fits.',
      image: '/Gemini_Generated_Image_4f10by4f10by4f10.jpeg',
    },
    {
      title: 'EXPRESS DELIVERY',
      label: isKinyarwanda ? 'DIRECT LOCAL COURIER' : 'DIRECT LOCAL COURIER',
      text: isKinyarwanda ? 'Fast, seamless local door-to-door delivery ordered directly via MoMo.' : 'Fast, seamless local door-to-door delivery ordered directly via MoMo.',
      image: '/image to use ff59e8d8-fa63-4c0d-bd0e-495a12cd04b6.jpeg',
    },
  ];

  const faqItems = [
    {
      question: 'How do I order an INSHUTI T-shirt?',
      answer: 'Choose Explore Drops or Order Your First Drop Now to see WhatsApp and MTN MoMo checkout options.',
    },
    {
      question: 'How can I pay with MTN MoMo?',
      answer: 'Dial *182# on your MTN line, choose Pay merchant, and ask our WhatsApp team for the current INSHUTI merchant code before confirming your payment.',
    },
    {
      question: 'What sizes are available?',
      answer: 'The current Everyday T-Shirt drop lists S, M, and L. Availability may vary by collection.',
    },
    {
      question: 'Where do you deliver?',
      answer: 'We offer local door-to-door delivery. Message us on WhatsApp to confirm delivery availability for your area.',
    },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-white text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      <header className="sticky top-0 z-[1000] border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" aria-label="INSHUTI store home" className="inline-flex items-center">
            <InshutiLogo variant="light" stacked />
          </a>

          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 text-xs font-medium text-slate-600 lg:flex">
            <a href="/shop" className="font-semibold transition hover:text-black">Explore Store →</a>
            <a href="#features" className="transition hover:text-black">{isKinyarwanda ? 'Quality' : 'Quality'}</a>
            <a href="#faq" className="transition hover:text-black">FAQ</a>
            <a href="#pricing" className="transition hover:text-black">{isKinyarwanda ? 'Ibiciro' : 'Pricing'}</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLang(isKinyarwanda ? 'en' : 'rw')}
              aria-label={isKinyarwanda ? 'Switch to English' : 'Hindura mu Kinyarwanda'}
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold text-slate-600 transition hover:bg-gray-100 hover:text-black"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{isKinyarwanda ? 'English' : 'Kinyarwanda'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-gray-100 hover:text-black"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {shopperName ? (
              <a href="/shop?signin=1" aria-label={`Open account for ${shopperName}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-2.5 text-xs font-semibold text-slate-800 transition hover:bg-gray-100">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">{shopperInitials}</span>
                <span className="hidden max-w-24 truncate sm:inline">{shopperName.split(/\s+/)[0]}</span>
              </a>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <a href="/shop?signin=1" className="inline-flex h-10 items-center rounded-full px-3 text-xs font-semibold text-slate-700 transition hover:bg-gray-100">Sign In</a>
                <a href="/shop?signin=1&mode=signup" className="inline-flex h-10 items-center rounded-full bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-black">Sign Up</a>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-700 lg:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="grid gap-1 border-t border-gray-200 bg-white px-5 py-4 text-sm text-slate-700 lg:hidden">
            <a href="/shop" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 font-semibold hover:bg-gray-100">Explore Store →</a>
            {!shopperName && <a href="/shop?signin=1" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">Sign In / Sign Up</a>}
            {!shopperName && <a href="/shop?signin=1&mode=signup" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">Create Account</a>}
            {shopperName && <a href="/shop?signin=1" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">Account · {shopperName}</a>}
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">{isKinyarwanda ? 'Quality' : 'Quality'}</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">FAQ</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">{isKinyarwanda ? 'Abakiriya' : 'Reviews'}</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">{isKinyarwanda ? 'Ibiciro' : 'Pricing'}</a>
          </nav>
        )}
      </header>

      <GoogleWelcomePrompt signedIn={Boolean(shopperName)} authLoading={authLoading} onEmailClick={() => { window.location.href = '/shop?signin=1'; }} />

      <main>
        <section id="top" className="relative flex min-h-[calc(100svh-72px)] flex-col items-center justify-start overflow-hidden border-b border-gray-200 bg-gray-100">
          <div aria-hidden="true" className="absolute inset-0">
            {heroBackgrounds.map((image, index) => (
              <div
                key={image}
                className={`absolute inset-0 bg-[length:auto_58%] bg-top bg-no-repeat transition-opacity duration-1000 ease-in-out lg:bg-[length:auto_100%] lg:bg-right ${index === heroBackgroundIndex ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  backgroundImage: `url('${image}')`,
                }}
              />
            ))}
          </div>
          <div aria-label="INSHUTI brand highlights" className="relative z-20 w-full overflow-hidden border-b border-white/10 bg-slate-900 px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white sm:text-[10px]">
            <div className="brand-ticker-track">
              <div className="brand-ticker-content" aria-label="INSHUTI, Made in Rwanda, 100% Cotton, Local Craft">
                {Array.from({ length: 8 }, (_, index) => (
                  <React.Fragment key={index}>
                    <span>INSHUTI</span><span aria-hidden="true">✳</span>
                    <span>Made in Rwanda</span><span aria-hidden="true">✳</span>
                    <span>100% Cotton</span><span aria-hidden="true">✳</span>
                    <span>Local Craft</span><span aria-hidden="true">✳</span>
                  </React.Fragment>
                ))}
              </div>
              <div className="brand-ticker-content" aria-hidden="true">
                {Array.from({ length: 8 }, (_, index) => (
                  <React.Fragment key={index}>
                    <span>INSHUTI</span><span>✳</span>
                    <span>Made in Rwanda</span><span>✳</span>
                    <span>100% Cotton</span><span>✳</span>
                    <span>Local Craft</span><span>✳</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true">
            <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
              <path d="M-80 260C180 90 330 420 590 250S980 100 1220 250s300 210 430 60M-100 330C160 160 340 490 600 320s390-150 630 0 300 210 430 60M-120 400C140 230 350 560 610 390s390-150 630 0 300 210 430 60M-140 470C120 300 360 630 620 460s390-150 630 0 300 210 430 60M-160 540C100 370 370 700 630 530s390-150 630 0 300 210 430 60" stroke="#0f172a" strokeOpacity=".18" />
            </svg>
          </div>
          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-5 pb-10 pt-10 text-center sm:px-8 sm:pt-12">
            <div data-reveal className="mx-auto max-w-4xl">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-700 sm:mb-4 sm:text-xs">
                {isKinyarwanda ? 'INSHUTI' : 'INSHUTI'}
              </p>
            </div>

            <div aria-label="INSHUTI apparel collection" className="relative mx-auto mt-12 h-[15rem] w-full max-w-5xl sm:mt-16 sm:h-[19rem] lg:mt-20 lg:h-[22rem]" style={{ perspective: '1400px' }}>
              {displayedHeroProductImages.map((image, index) => {
                const cardPlacement = index === 1
                    ? 'left-1/2 top-1/2 z-20 w-[46%] max-w-[300px] -translate-x-1/2 -translate-y-1/2 scale-[1.08]'
                  : index === 0
                    ? 'left-[7%] top-1/2 z-10 w-[36%] max-w-[260px] -translate-y-1/2 -rotate-6 sm:left-1/2 sm:w-[34%] sm:-translate-x-[132%]'
                    : 'right-[7%] top-1/2 z-10 w-[36%] max-w-[260px] -translate-y-1/2 rotate-6 sm:left-1/2 sm:right-auto sm:w-[34%] sm:translate-x-[32%]';
                const parallaxFactor = index === 1 ? 1 : index === 0 ? -0.5 : 0.5;

                return (
                  <figure
                    key={image}
                    className={`absolute aspect-[4/5] overflow-hidden rounded-2xl border border-white/80 bg-white p-2 shadow-xl transition-[scale,box-shadow] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] sm:p-3 ${index === 1 ? 'will-change-transform' : ''} ${cardPlacement}`}
                    style={index === 1 ? {
                      scale: heroCenterScale,
                      willChange: 'transform, scale',
                      transformStyle: 'preserve-3d',
                      boxShadow: `0 18px ${40 + (heroCenterScale - 1) * 80}px rgba(15, 23, 42, ${0.18 + (heroCenterScale - 1) * 0.25})`,
                    } : undefined}
                  >
                    <div className={`h-full w-full transition-transform duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${index === 1 ? 'will-change-transform' : ''}`} style={{ transform: `translateY(${heroParallaxOffset * parallaxFactor}px) rotateX(${index === 1 ? (1.35 - heroCenterScale) * 3 : 0}deg)` }}>
                      <img src={image} alt={`INSHUTI garment ${index + 1}`} className={`h-full w-full ${homePageImages[HOME_PAGE_IMAGE_SLOTS[index].id] ? 'object-cover object-center' : 'object-contain'}`} />
                    </div>
                  </figure>
                );
              })}
            </div>
            <div className="relative z-30 mt-7 flex flex-col items-center gap-4">
              <a href="/shop" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-900 px-7 text-sm font-bold text-white shadow-lg transition hover:bg-black">
                Explore the Store <ArrowRight className="h-4 w-4" />
              </a>
              <div className="flex items-center gap-5 text-xs font-semibold text-slate-800">
                <a href="/shop?department=WOMEN" className="underline decoration-slate-400 underline-offset-4 transition hover:text-black">Shop Women →</a>
                <a href="/shop?department=MEN" className="underline decoration-slate-400 underline-offset-4 transition hover:text-black">Shop Men →</a>
              </div>
            </div>
          </div>
        </section>

        <section id="craft-story" data-reveal className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">INSHUTI</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Our Story &amp; Craft</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">Every INSHUTI garment is designed and stitched right here in Rwanda by skilled local tailors. We combine modern urban fits with affordable pricing so everyone can wear Rwandan pride every day.</p>
            </div>
            <div
              role="img"
              aria-label="A tailor guiding fabric through a sewing machine"
              className="aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 bg-cover bg-center"
              style={{ backgroundImage: "url('/tailor%20at%20work.png')" }}
            />
          </div>
        </section>

        <section id="phone-preview" data-reveal className="relative overflow-hidden bg-white py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-[0.16]" aria-hidden="true">
            <svg className="h-full w-full" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" fill="none">
              <path d="M-100 180C160 20 330 320 590 160s390-120 630 20 300 180 430 40M-120 250C140 90 340 390 600 230s390-120 630 20 300 180 430 40M-140 320C120 160 350 460 610 300s390-120 630 20 300 180 430 40M-160 390C100 230 360 530 620 370s390-120 630 20 300 180 430 40" stroke="#0f172a" strokeOpacity=".22" />
            </svg>
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'MADE FOR EVERYDAY STYLE' : 'MADE FOR EVERYDAY STYLE'}</p>
              <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                {isKinyarwanda ? 'Your whole wardrobe upgrade, right in your pocket.' : 'Your whole wardrobe upgrade, right in your pocket.'}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                {isKinyarwanda ? 'Designed for students, creators, and everyday trendsetters.' : 'Designed for students, creators, and everyday trendsetters.'}
              </p>
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50"><Lock className="h-4 w-4" /></span>
                {isKinyarwanda ? 'Locally crafted. Ready for everyday wear.' : 'Locally crafted. Ready for everyday wear.'}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-[300px] sm:max-w-[330px]"
            >
              <div className={`transition-all duration-700 ease-in-out ${heroProductExiting ? 'translate-x-16 opacity-0' : 'translate-x-0 opacity-100'}`}>
                <img src={wardrobeFeatureImage} alt="INSHUTI T-shirt" className={`animate-float-shirt w-full drop-shadow-2xl ${homePageImages['home-wardrobe-feature'] ? 'aspect-[4/5] object-cover object-center' : 'h-auto object-contain'}`} />
              </div>
            </motion.div>
          </div>
        </section>

        <section id="use-cases" data-reveal className="bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'EVERYDAY STYLE' : 'EVERYDAY STYLE'}</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'Explore the collection.' : 'Explore the collection.'}</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-slate-600">{isKinyarwanda ? 'Everyday essentials and standout limited drops, delivered locally.' : 'Everyday essentials and standout limited drops, delivered locally.'}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              {useCases.map((item) => (
                <article key={item.title} data-reveal className="group relative min-h-[390px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:min-h-[440px]">
                  <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${item.image}')` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/5" />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-neutral-300">{item.label}</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-300">{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" data-reveal className="relative border-y border-gray-200 bg-white py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-[0.16]" aria-hidden="true">
            <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
              <path d="M-100 200C150 20 360 360 610 190s380-110 620 20 300 180 430 30M-120 270C130 90 370 430 620 260s380-110 620 20 300 180 430 30M-140 340C110 160 380 500 630 330s380-110 620 20 300 180 430 30M-160 410C90 230 390 570 640 400s380-110 620 20 300 180 430 30" stroke="#0f172a" strokeOpacity=".18" />
            </svg>
          </div>
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'WHY INSHUTI' : 'WHY INSHUTI'}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'The details that make INSHUTI special.' : 'The details that make INSHUTI special.'}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">{isKinyarwanda ? 'Thoughtful fabrics, fair pricing, and unique local designs for everyday wear.' : 'Thoughtful fabrics, fair pricing, and unique local designs for everyday wear.'}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
              {featureCards.map(({ icon: Icon, title, text }, index) => (
                <article key={title} data-reveal className="rounded-2xl border border-slate-200 bg-gray-50 p-6 transition hover:border-slate-400 hover:shadow-md sm:p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800"><Icon className="h-5 w-5" /></div>
                  <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">0{index + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="vision-mission" data-reveal className="border-y border-gray-200 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Our Vision &amp; Mission</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <article data-reveal className="rounded-2xl border border-slate-200 bg-gray-50 p-7 shadow-sm sm:p-9">
                <h3 className="text-xl font-semibold text-slate-900">Our Mission</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">To make high-quality apparel affordable and accessible by connecting Rwanda’s buyers and local makers through trusted, transparent technology. We empower local craftsmanship with simplicity, fairness, and confidence.</p>
              </article>
              <article data-reveal className="rounded-2xl border border-slate-200 bg-gray-50 p-7 shadow-sm sm:p-9">
                <h3 className="text-xl font-semibold text-slate-900">Our Vision</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">To build a Rwanda where local apparel and craftsmanship are accessible to everyone. We envision a future where locally made fashion helps people express themselves with confidence and pride.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="team" data-reveal className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Meet Our Team</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article data-reveal className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-slate-200">
                  <TeamAvatar variant="emmanuel" name="Emmanuel Niyogakiza" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">Emmanuel Niyogakiza</h3>
                <p className="mt-2 text-sm text-slate-600">Co-Founder &amp; CEO</p>
              </article>
              <article data-reveal className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-slate-200">
                  <img src="/cartoon_woman_avatar.svg" alt="Illustrated avatar of Nduwamariya Therese" className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">Nduwamariya Therese</h3>
                <p className="mt-2 text-sm text-slate-600">Co-Founder &amp; CTO</p>
              </article>
            </div>
          </div>
        </section>

        <section id="reviews" data-reveal className="bg-gray-50 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'FROM THE PEOPLE WHO WEAR IT' : 'FROM THE PEOPLE WHO WEAR IT'}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'Confidence, worn every day.' : 'Confidence, worn every day.'}</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              <figure data-reveal className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                <div className="mb-7 flex gap-1 text-slate-900" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, i) => <span key={i}>★</span>)}</div>
                <blockquote className="text-xs font-medium italic leading-relaxed text-slate-900">“Inshuti T-shirts are the best quality I've bought in Kigali. Super affordable, premium cotton fabric, and the fit is perfect for daily wear!”</blockquote>
                <figcaption className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500"><span className="font-semibold text-slate-900">Eric M.</span><span className="mx-2 text-slate-300">/</span>UR Gikondo</figcaption>
              </figure>
              <figure data-reveal className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                <div className="mb-7 flex gap-1 text-slate-900" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, i) => <span key={i}>★</span>)}</div>
                <blockquote className="text-xs font-medium italic leading-relaxed text-slate-900">“Ordered two men's shirts via WhatsApp and they delivered right to my place in Kimironko the same day. Great quality for RWF 12,000.”</blockquote>
                <figcaption className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500"><span className="font-semibold text-slate-900">Jean-Paul K.</span><span className="mx-2 text-slate-300">/</span>Kigali</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="faq" data-reveal className="bg-gray-50 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">INSHUTI</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Frequently Asked Questions</h2>
            </div>
            <div className="grid gap-3">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;
                const answerId = `faq-answer-${index}`;

                return (
                  <article key={item.question} data-reveal className="rounded-2xl border border-slate-200 bg-white px-5 sm:px-7">
                    <h3>
                      <button
                        type="button"
                        id={`faq-question-${index}`}
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="flex min-h-16 w-full items-center justify-between gap-5 py-4 text-left text-base font-semibold text-slate-900"
                      >
                        <span>{item.question}</span>
                        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg font-normal text-slate-600">{isOpen ? '−' : '+'}</span>
                      </button>
                    </h3>
                    <div id={answerId} role="region" aria-labelledby={`faq-question-${index}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="pb-5 pr-12 text-sm leading-6 text-slate-600">{item.answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" data-reveal className="relative overflow-hidden border-t border-gray-200 bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.06),transparent_55%)]" />
          <div className="relative mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-gray-50 p-7 shadow-[0_30px_100px_rgba(15,23,42,0.08)] sm:p-12">
            <div className="grid gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] md:items-center">
              <div className="text-center md:text-left">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white md:mx-0"><CheckCircle2 className="h-5 w-5 text-slate-900" /></div>
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{isKinyarwanda ? 'LOCAL QUALITY, EVERYDAY STYLE' : 'LOCAL QUALITY, EVERYDAY STYLE'}</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'Wear confidence. Support local craftsmanship.' : 'Wear confidence. Support local craftsmanship.'}</h2>
                <p className="mt-4 text-xs text-slate-500">{isKinyarwanda ? 'Locally made apparel for everyday confidence.' : 'Locally made apparel for everyday confidence.'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
                <p className="text-lg text-slate-700">T-SHIRTS FROM RWF 12,000 <span className="text-sm text-slate-500">/ piece</span></p>
                <button type="button" onClick={openOrderModal} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-7 text-sm font-bold text-white transition hover:bg-black">
                  {isKinyarwanda ? 'Order Your First Drop Now' : 'Order Your First Drop Now'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Explore all apparel" className="bg-slate-900 px-5 py-12 text-white sm:px-8 sm:py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">Made in Rwanda · Made for everyday</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Find your next INSHUTI favourite.</h2>
            </div>
            <a href="/shop" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-slate-900 transition hover:bg-gray-100">Explore All Apparel <ArrowRight className="h-4 w-4" /></a>
          </div>
        </section>
      </main>

      <footer data-reveal className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-9 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <a href="#top" aria-label="INSHUTI store home" className="inline-flex items-center"><InshutiLogo variant="light" stacked className="inshuti-logo--large" /></a>
            <p className="mt-3 max-w-sm text-xs leading-5 text-slate-500">{isKinyarwanda ? 'Simple, affordable, high-quality fashion for Rwanda’s youth and everyday creators.' : 'Simple, affordable, high-quality fashion for Rwanda’s youth and everyday creators.'}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-600">
            <a href="#features" className="hover:text-black">{isKinyarwanda ? 'Ibanga' : 'Privacy Policy'}</a>
            <a href="#pricing" className="hover:text-black">{isKinyarwanda ? 'Amategeko' : 'Terms of Service'}</a>
            <a href="mailto:support@inshuti.rw" className="hover:text-black">{isKinyarwanda ? 'Ubufasha' : 'Support'}</a>
          </nav>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <a href="tel:+250793683432" className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 transition hover:text-black"><PhoneCall className="h-4 w-4" /> Emmanuel Niyogakiza · +250793683432 <span className="text-slate-500">/ MTN MoMo</span></a>
            <nav aria-label="Social media links" className="flex items-center gap-2">
              <a href="https://www.linkedin.com/in/emmanuel-niyogakiza-41208a389/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-400 hover:text-slate-900">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 .001-4.125 2.062 2.062 0 0 1-.001 4.125zM7.114 20.452H3.56V9h3.554v11.452z" /></svg>
              </a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X" title="X" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-400 hover:text-slate-900">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584h-3.68l8.6-9.83L0 1.153h7.594l5.243 6.932 6.064-6.932zm-1.291 19.49h2.039L6.48 3.24H4.292l13.318 17.403z" /></svg>
              </a>
              <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-400 hover:text-slate-900">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55A3.016 3.016 0 0 0 .502 6.186 31.301 31.301 0 0 0 0 12s0 3.11.502 5.814a3.016 3.016 0 0 0 2.121 2.136C4.495 20.5 12 20.5 12 20.5s7.505 0 9.376-.55a3.016 3.016 0 0 0 2.122-2.136A31.301 31.301 0 0 0 24 12s0-3.11-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
              <a href="https://github.com/emmanuelniyogakiza25eba-code" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-400 hover:text-slate-900">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M12 .297a12 12 0 0 0-3.79 23.4c.6.113.82-.258.82-.577v-2.234c-3.338.726-4.043-1.416-4.043-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 6.006 0c2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .322.216.694.825.576A12.002 12.002 0 0 0 12 .297z" /></svg>
              </a>
            </nav>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-5 text-[10px] text-slate-500 sm:flex-row sm:px-8">
          <span>© 2026 Inshuti / Ubiko. All rights reserved.</span>
          <a href="/admin" className="inline-flex items-center gap-1.5 text-slate-400 transition hover:text-slate-700"><LockKeyhole className="h-3 w-3" /> Owner Admin</a>
        </div>
      </footer>

      {orderModalOpen && (
        <div
          role="presentation"
          onClick={closeOrderModal}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><InshutiLogo variant="light" sizeClassName="h-4 w-6" /><h2 id="order-modal-title" className="text-xl font-semibold text-slate-900">Choose how to order</h2></div>
                <p className="mt-2 text-sm text-slate-600">Everyday T-Shirt · RWF 12,000</p>
              </div>
              <button type="button" onClick={closeOrderModal} aria-label="Close order options" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-gray-100 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-3">
              <a href={whatsappOrderUrl} onClick={() => { orderSubmittedRef.current = true; recordActivityPage('WhatsApp / MTN MoMo', '/'); }} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-5 text-center text-sm font-bold text-white transition hover:bg-black">
                Order via WhatsApp (+250793683432)
              </a>
              <button type="button" onClick={() => setMomoInstructionsOpen((open) => !open)} aria-expanded={momoInstructionsOpen} aria-controls="momo-instructions" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-gray-100">
                Pay via MTN MoMo
              </button>
            </div>
            {momoInstructionsOpen && (
              <div id="momo-instructions" className="mt-4 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-slate-600">
                Dial <strong className="text-slate-900">*182#</strong> on your MTN line, choose <strong className="text-slate-900">Pay merchant</strong>, enter the INSHUTI merchant code, and confirm <strong className="text-slate-900">RWF 12,000</strong>. Ask our team on WhatsApp for the current merchant code before confirming.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
