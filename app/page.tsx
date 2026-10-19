'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

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

export default function LandingPage() {
  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      title: isKinyarwanda ? 'Ibanga n’Umutekano 100%' : '100% Private & Encrypted',
      text: isKinyarwanda
        ? 'Amakuru y’ubucuruzi ni ayanyu. Nta muntu utabiherewe ubasha kubona imibare yanyu.'
        : 'Your numbers belong only to you. Not even system admins see your revenue.',
    },
    {
      icon: Cloud,
      title: isKinyarwanda ? 'Ububiko bwo mu Igicu' : 'Disaster-Proof Cloud Backups',
      text: isKinyarwanda
        ? 'Subirana amakuru yawe kuri telefoni iyo ari yo yose iyo iyawe yatakaye cyangwa yangiritse.'
        : 'Recover 100% of your records from any phone if yours is lost or damaged.',
    },
    {
      icon: Smartphone,
      title: isKinyarwanda ? 'Ikora Nta Murandasi' : 'Works Offline & Kinyarwanda UI',
      text: isKinyarwanda
        ? 'Andika ibyo wagurishije vuba, n’iyo internet idahari. Ntibisaba ubumenyi bwihariye.'
        : 'Fast, offline-first record entry with zero tech experience needed.',
    },
    {
      icon: FileText,
      title: isKinyarwanda ? 'Raporo za SACCO ako kanya' : 'Instant SACCO Statements',
      text: isKinyarwanda
        ? 'Kuramo raporo za PDF zigaragaza amateka y’imari y’ubucuruzi bwawe.'
        : 'Download automated PDF reports for clear financial proof.',
    },
  ];

  const useCases = [
    {
      title: "Iduka N'Isoko",
      label: isKinyarwanda ? 'AMADUKA N’AMASOKO' : 'MARKET & RETAIL',
      text: isKinyarwanda ? 'Andika ibyo wagurishije buri munsi mu masegonda.' : 'Record daily sales in seconds.',
      image: 'https://images.pexels.com/photos/7947847/pexels-photo-7947847.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      title: 'Ubucuruzi Bwo Muri Quarter',
      label: isKinyarwanda ? 'UBUCURUZI BUGENDANWA' : 'MOBILE & REMOTE SALES',
      text: isKinyarwanda ? 'Kurikirana ibirarane by’abakiriya aho uri hose.' : 'Manage customer debts on the go.',
      image: 'https://images.pexels.com/photos/7821548/pexels-photo-7821548.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
    {
      title: 'Inguzanyo Muri SACCO',
      label: isKinyarwanda ? 'SACCO N’AMABANKI' : 'SACCO & BANK LOANS',
      text: isKinyarwanda ? 'Ohereza amateka asukuye ya PDF usaba inguzanyo.' : 'Export clean PDF history for micro-loans.',
      image: 'https://images.pexels.com/photos/7821462/pexels-photo-7821462.jpeg?auto=compress&cs=tinysrgb&w=1200',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="text-sm font-black tracking-[0.28em] text-slate-900 sm:text-base">
            INSHUTI
          </a>

          <nav className="hidden items-center gap-8 text-xs font-medium text-slate-600 md:flex">
            <a href="#use-cases" className="transition hover:text-black">{isKinyarwanda ? 'Ubucuruzi' : 'Use cases'}</a>
            <a href="#features" className="transition hover:text-black">{isKinyarwanda ? 'Ibyiza' : 'Features'}</a>
            <a href="#pricing" className="transition hover:text-black">{isKinyarwanda ? 'Ibiciro' : 'Pricing'}</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setLang(isKinyarwanda ? 'en' : 'rw')}
              aria-label={isKinyarwanda ? 'Switch to English' : 'Hindura mu Kinyarwanda'}
              className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold text-slate-600 transition hover:bg-gray-100 hover:text-black"
            >
              <Globe className="h-4 w-4" />
              <span>{isKinyarwanda ? 'English' : 'Kinyarwanda'}</span>
            </button>
            <a href="/signup" className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-xs font-bold text-white transition hover:bg-black">
              {isKinyarwanda ? 'Tangira' : 'Get Started'}
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-slate-700 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="grid gap-1 border-t border-gray-200 bg-white px-5 py-4 text-sm text-slate-700 md:hidden">
            <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">{isKinyarwanda ? 'Ubucuruzi' : 'Use cases'}</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">{isKinyarwanda ? 'Ibyiza' : 'Features'}</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">{isKinyarwanda ? 'Abakiriya' : 'Reviews'}</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 hover:bg-gray-100">{isKinyarwanda ? 'Ibiciro' : 'Pricing'}</a>
          </nav>
        )}
      </header>

      <main className="pt-[72px]">
        <section id="top" className="relative flex min-h-[calc(100svh-72px)] items-center justify-center overflow-hidden bg-gray-100">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-fixed bg-cover"
            style={{
              backgroundImage: "url('/watermarked_img_17470589643741036743.jpg')",
              backgroundPosition: 'center 72px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/60" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.13]" aria-hidden="true">
            <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
              <path d="M-80 260C180 90 330 420 590 250S980 100 1220 250s300 210 430 60M-100 330C160 160 340 490 600 320s390-150 630 0 300 210 430 60M-120 400C140 230 350 560 610 390s390-150 630 0 300 210 430 60M-140 470C120 300 360 630 620 460s390-150 630 0 300 210 430 60M-160 540C100 370 370 700 630 530s390-150 630 0 300 210 430 60" stroke="#0f172a" strokeOpacity=".18" />
            </svg>
          </div>

          <div className="relative mx-auto w-full max-w-6xl px-5 py-20 text-center sm:px-8 sm:py-28">
            <div className="mx-auto max-w-4xl">
              <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-600 sm:text-xs">
                {isKinyarwanda ? 'UBUCURUZI BWAWE, BUHORA BUTONZE' : 'BUSINESS RECORDS, MADE SIMPLE'}
              </p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                {isKinyarwanda ? 'Ibitabo by’ubucuruzi bwanyu mu mutekano' : 'Secure, Simple Business Records for Rwandan Merchants'}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg font-medium text-slate-700 sm:text-2xl">
                {isKinyarwanda ? 'Secure, simple records for Rwandan merchants' : "Ibitabo by'ubucuruzi bwanyu mu mutekano"}
              </p>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                {isKinyarwanda
                  ? "Inshuti ibika amateka y'ibyo wagurishije, ibirarane n'amakuru y'abakiriya mu mutekano."
                  : 'Never lose your sales history, debts, or customer bookings again. Inshuti keeps your business safe and ready for growth.'}
              </p>

              <div className="mx-auto mt-9 flex max-w-md flex-col justify-center gap-3 sm:flex-row">
                <a href="/signup" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-slate-900 px-7 text-sm font-bold text-white transition hover:bg-black">
                  {isKinyarwanda ? 'Tangira ku Buntu' : 'Get Started Free'}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#phone-preview" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-7 text-sm font-semibold text-slate-800 backdrop-blur transition hover:bg-gray-100">
                  <Play className="h-4 w-4 fill-current" />
                  {isKinyarwanda ? 'Reba uko bikora' : 'Watch 1-Min Demo'}
                </a>
              </div>
            </div>

            <div className="mx-auto mt-14 max-w-md rounded-2xl border border-gray-200 bg-white/90 p-6 text-left shadow-[0_24px_100px_rgba(15,23,42,0.12)] backdrop-blur-md sm:mt-16 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                {isKinyarwanda ? 'SERIVISI ITANGIRA KURI' : 'SERVICE STARTING AT'}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">RWF 1,000 <span className="text-base font-normal text-slate-500">/ mo</span></p>
              <p className="mt-2 text-sm text-slate-600">
                {isKinyarwanda ? 'Igerageze ku buntu mu minsi 30.' : 'Free 30-day trial for all new Rwandan vendors.'}
              </p>
              <a href="/signup" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white transition hover:bg-black">
                {isKinyarwanda ? 'Tangira' : 'Get Started'}
              </a>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-white" />
        </section>

        <section id="phone-preview" className="relative overflow-hidden bg-white py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-[0.1]" aria-hidden="true">
            <svg className="h-full w-full" viewBox="0 0 1440 700" preserveAspectRatio="xMidYMid slice" fill="none">
              <path d="M-100 180C160 20 330 320 590 160s390-120 630 20 300 180 430 40M-120 250C140 90 340 390 600 230s390-120 630 20 300 180 430 40M-140 320C120 160 350 460 610 300s390-120 630 20 300 180 430 40M-160 390C100 230 360 530 620 370s390-120 630 20 300 180 430 40" stroke="#0f172a" strokeOpacity=".22" />
            </svg>
          </div>
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
            <div className="max-w-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'YOROSHYE GUKORESHA' : 'BUILT FOR EVERYDAY BUSINESS'}</p>
              <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                {isKinyarwanda ? 'Andika buri munsi. Menya aho uhagaze.' : 'Your whole business day, in your pocket.'}
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                {isKinyarwanda ? 'Injiza amafaranga winjije n’ibirarane mu buryo bworoshye, mu rurimi wumva.' : 'A clear daily record, designed for busy shops, market stalls, and independent sellers.'}
              </p>
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50"><Lock className="h-4 w-4" /></span>
                {isKinyarwanda ? 'Amakuru yawe arinzwe kandi ni ayawe' : 'Private records. Yours to keep.'}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="relative mx-auto w-full max-w-[300px] sm:max-w-[330px]"
            >
              <div className="absolute -inset-8 rounded-[60px] bg-slate-200/60 blur-3xl" />
              <div className="relative rounded-[42px] border border-white bg-gradient-to-br from-gray-200 via-gray-400 to-gray-600 p-[7px] shadow-[0_35px_100px_rgba(15,23,42,0.22)]">
                <div className="relative overflow-hidden rounded-[36px] border border-gray-300 bg-[#f7f8f6] text-neutral-900">
                  <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
                  <div className="flex items-center justify-between px-5 pb-3 pt-10 text-[10px] font-semibold text-neutral-500">
                    <span>9:41</span><span>INSHUTI</span><span>● ● ●</span>
                  </div>
                  <div className="bg-white px-5 pb-6 pt-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">{isKinyarwanda ? 'IGIHEMBWE' : 'TUESDAY, OCT 14'}</p>
                        <h3 className="mt-1 text-lg font-bold">{isKinyarwanda ? 'Amasahani y’Uyu Munsi' : "Today's Records"}</h3>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-4 w-4" /></div>
                    </div>
                    <div className="mt-5 rounded-2xl bg-gray-100 p-4 text-slate-900">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{isKinyarwanda ? 'AYO WINJIZEMO' : 'TODAY\'S SALES'}</p>
                      <p className="mt-2 text-2xl font-semibold">RWF 84,500</p>
                      <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {isKinyarwanda ? 'Kuzamuka uyu munsi' : 'Updated just now'}</div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-neutral-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{isKinyarwanda ? 'AMAFARANGA WINJIJE' : 'DAILY SALES'}</p>
                        <p className="mt-1 text-sm font-semibold">RWF 84,500</p>
                      </div>
                      <div className="rounded-xl border border-neutral-200 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{isKinyarwanda ? 'IBIRARANE' : 'CUSTOMER DEBTS'}</p>
                        <p className="mt-1 text-sm font-semibold">RWF 12,000 <span className="ml-1 text-xs font-normal text-neutral-400">· 3 {isKinyarwanda ? 'abakiriya' : 'customers'}</span></p>
                      </div>
                    </div>
                    <button className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white transition hover:bg-black">
                      + {isKinyarwanda ? 'Bika Muri Sisitemu' : 'Save Record'}
                    </button>
                    <div className="mt-5 flex justify-around border-t border-neutral-100 pt-4 text-[9px] font-medium text-neutral-400">
                      <span>⌂ {isKinyarwanda ? 'Ahabanza' : 'Home'}</span><span>＋ {isKinyarwanda ? 'Andika' : 'Record'}</span><span>▤ {isKinyarwanda ? 'Raporo' : 'Reports'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="use-cases" className="bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-12 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'KU BUCURUZI BWAWE' : 'MADE FOR YOUR KIND OF BUSINESS'}</p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'Buri munsi w’ubucuruzi uroroshye.' : 'Small business. Serious records.'}</h2>
              </div>
              <p className="max-w-sm text-sm leading-6 text-slate-600">{isKinyarwanda ? 'Inshuti ikorana n’uburyo bwinshi bwo gucuruza.' : 'From the market stall to a growing neighborhood shop, keep every detail together.'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {useCases.map((item) => (
                <article key={item.title} className="group relative min-h-[390px] overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:min-h-[440px]">
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

        <section id="features" className="relative border-y border-gray-200 bg-white py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-[0.09]" aria-hidden="true">
            <svg className="h-full w-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
              <path d="M-100 200C150 20 360 360 610 190s380-110 620 20 300 180 430 30M-120 270C130 90 370 430 620 260s380-110 620 20 300 180 430 30M-140 340C110 160 380 500 630 330s380-110 620 20 300 180 430 30M-160 410C90 230 390 570 640 400s380-110 620 20 300 180 430 30" stroke="#0f172a" strokeOpacity=".18" />
            </svg>
          </div>
          <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'BYAKOREWE ABACURUZI' : 'WHY INSHUTI'}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'Umutekano uhereye ku nyandiko ya mbere.' : 'The details that keep business moving.'}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">{isKinyarwanda ? 'Ibikoresho byoroshye bifasha ubucuruzi bwawe gukura.' : 'Everything you need to stay organized, protected, and ready for what comes next.'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {featureCards.map(({ icon: Icon, title, text }, index) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-gray-50 p-6 transition hover:border-slate-400 hover:shadow-md sm:p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800"><Icon className="h-5 w-5" /></div>
                  <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">0{index + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-slate-900">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="vision-mission" className="border-y border-gray-200 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto mb-10 max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Our Vision &amp; Mission</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-gray-50 p-7 shadow-sm sm:p-9">
                <h3 className="text-xl font-semibold text-slate-900">Our Mission</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">To accelerate business transformation across Rwanda by equipping merchants and micro-entrepreneurs with intuitive, digital record-keeping tools. Aligned with national economic development policies, we aim to bridge the financial literacy gap and ensure every Rwandan seller can build a verifiable, sustainable financial record.</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-gray-50 p-7 shadow-sm sm:p-9">
                <h3 className="text-xl font-semibold text-slate-900">Our Vision</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">To drive Rwanda’s vision of a cashless, financially inclusive economy where local businesses thrive through digital innovation, stronger financial literacy, and seamless access to institutional capital.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="team" className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Meet Our Team</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-slate-200">
                  <TeamAvatar variant="emmanuel" name="Emmanuel Niyogakiza" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">Emmanuel Niyogakiza</h3>
                <p className="mt-2 text-sm text-slate-600">Co-Founder &amp; CEO</p>
              </article>
              <article className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-slate-200">
                  <TeamAvatar variant="mugisha" name="Mugisha Manzi" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-900">Mugisha Manzi</h3>
                <p className="mt-2 text-sm text-slate-600">Co-Founder &amp; CTO</p>
              </article>
            </div>
          </div>
        </section>

        <section id="reviews" className="bg-gray-50 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mb-10 max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">{isKinyarwanda ? 'INKURU Z’ABACURUZI' : 'FROM THE PEOPLE WHO USE IT'}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'Ubucuruzi bwiza butangirana no kumenya neza.' : 'Confidence, built one record at a time.'}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <figure className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                <div className="mb-7 flex gap-1 text-slate-900" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, i) => <span key={i}>★</span>)}</div>
                <blockquote className="text-xl font-medium leading-relaxed text-slate-900 sm:text-2xl">“Inshuti helped me keep track of 150,000 RWF in ibirarane that I usually forgot to collect!”</blockquote>
                <figcaption className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500"><span className="font-semibold text-slate-900">Chantal M.</span><span className="mx-2 text-slate-300">/</span>Nyabugogo Market</figcaption>
              </figure>
              <figure className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
                <div className="mb-7 flex gap-1 text-slate-900" aria-label="5 out of 5 stars">{Array.from({ length: 5 }, (_, i) => <span key={i}>★</span>)}</div>
                <blockquote className="text-xl font-medium leading-relaxed text-slate-900 sm:text-2xl">“I applied for a SACCO loan using the PDF statements generated directly from my phone.”</blockquote>
                <figcaption className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500"><span className="font-semibold text-slate-900">Jean-Paul K.</span><span className="mx-2 text-slate-300">/</span>Kimironko</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="pricing" className="relative overflow-hidden border-t border-gray-200 bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.06),transparent_55%)]" />
          <div className="relative mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-gray-50 p-7 text-center shadow-[0_30px_100px_rgba(15,23,42,0.08)] sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white"><CheckCircle2 className="h-5 w-5 text-slate-900" /></div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{isKinyarwanda ? 'IGERAGEZA RY’IMINSI 30' : '30-DAY RISK-FREE TRIAL'}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{isKinyarwanda ? 'Tangira kubika neza uyu munsi.' : 'Start with clarity. Grow with confidence.'}</h2>
            <p className="mt-5 text-lg text-slate-700">1,000 RWF <span className="text-sm text-slate-500">/ month after trial</span></p>
            <a href="/signup" className="mt-8 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-slate-900 px-7 text-sm font-bold text-white transition hover:bg-black">
              {isKinyarwanda ? 'Fungura Konti Yawe' : 'Create Your Account Now'} <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-4 text-xs text-slate-500">{isKinyarwanda ? 'Nta karita ya banki isabwa' : 'No bank card required to start'}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-9 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto_auto] md:items-center">
          <div>
            <a href="#top" className="text-sm font-black tracking-[0.28em] text-slate-900">INSHUTI</a>
            <p className="mt-3 max-w-sm text-xs leading-5 text-slate-500">{isKinyarwanda ? 'Ibitabo by’ubucuruzi byoroshye kandi bitekanye ku bacuruzi bo mu Rwanda.' : 'Simple, secure business records for Rwanda’s merchants and micro-entrepreneurs.'}</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-600">
            <a href="#features" className="hover:text-black">{isKinyarwanda ? 'Ibanga' : 'Privacy Policy'}</a>
            <a href="#pricing" className="hover:text-black">{isKinyarwanda ? 'Amategeko' : 'Terms of Service'}</a>
            <a href="mailto:support@inshuti.rw" className="hover:text-black">{isKinyarwanda ? 'Ubufasha' : 'Support'}</a>
          </nav>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <a href="tel:+250781662020" className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 transition hover:text-black"><PhoneCall className="h-4 w-4" /> +250781662020 <span className="text-slate-500">/ MTN MoMo</span></a>
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
        <div className="border-t border-gray-200 px-5 py-5 text-center text-[10px] text-slate-500 sm:px-8">© 2026 Inshuti / Ubiko. All rights reserved.</div>
      </footer>
    </div>
  );
}
