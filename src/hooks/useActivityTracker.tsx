'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordActiveTime, recordActivityFriction, recordActivityPage, startActivitySession } from '@/src/utils/storeAnalytics';

function currentProfile() {
  try {
    const saved = window.localStorage.getItem('inshuti-shop-profile');
    if (!saved) return null;
    const profile = JSON.parse(saved);
    return { name: profile.name, email: profile.email, preference: profile.preference };
  } catch {
    return null;
  }
}

function routeLabel(pathname: string, profile: { preference?: string } | null) {
  if (pathname === '/') return 'Home';
  if (pathname === '/shop') return `Shop (${profile?.preference === 'MEN' ? 'Men' : 'Women'})`;
  if (pathname === '/admin') return 'Admin';
  return pathname;
}

export function useActivityTracker() {
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (pathname === '/admin') return;
    startActivitySession(currentProfile());
    recordActivityPage(routeLabel(pathname, currentProfile()), pathname);

    const seenSections = new Set<string>();
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
    if (!('IntersectionObserver' in window)) {
      sections.forEach((section) => recordActivityPage(`${routeLabel(pathname, currentProfile())} / ${section.id}`, pathname));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
        const sectionId = entry.target.id;
        if (seenSections.has(sectionId)) return;
        seenSections.add(sectionId);
        recordActivityPage(`${routeLabel(pathname, currentProfile())} / ${sectionId}`, pathname);
      });
    }, { threshold: 0.4 });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (window.location.pathname !== '/admin' && document.visibilityState === 'visible') recordActiveTime(10);
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const clickTimes = new Map<string, number[]>();
    const lastReported = new Map<string, number>();

    const getAction = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      return target.closest<HTMLElement>('[data-activity-action], button, a, [role="button"], input[type="submit"]');
    };

    const labelAction = (element: HTMLElement) => {
      const text = element.dataset.activityAction || element.getAttribute('aria-label') || element.getAttribute('title') || element.textContent?.trim().replace(/\s+/g, ' ');
      return (text || element.tagName.toLowerCase()).slice(0, 64);
    };

    const handleInteraction = (event: Event) => {
      if (window.location.pathname === '/admin') return;
      const element = getAction(event.target);
      if (!element) return;
      const disabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true';
      if (event.type === 'pointerdown' ? !disabled : disabled) return;

      const label = labelAction(element);
      const now = Date.now();
      const recentClicks = (clickTimes.get(label) || []).filter((time) => now - time <= 2000);
      recentClicks.push(now);
      clickTimes.set(label, recentClicks);

      const reportedAt = lastReported.get(label) || 0;
      if (recentClicks.length >= 3 && now - reportedAt > 2000) {
        recordActivityFriction(label, `Clicked '${label}' ${recentClicks.length}x within 2 seconds`);
        lastReported.set(label, now);
      }
    };

    document.addEventListener('click', handleInteraction, true);
    document.addEventListener('pointerdown', handleInteraction, true);
    return () => {
      document.removeEventListener('click', handleInteraction, true);
      document.removeEventListener('pointerdown', handleInteraction, true);
    };
  }, []);
}

export default function ActivityTracker() {
  useActivityTracker();
  return null;
}
