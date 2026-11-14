import './globals.css';
import type { Metadata } from 'next';
import ActivityTracker from '@/src/hooks/useActivityTracker';

export const metadata: Metadata = {
  title: 'INSHUTI',
  description: 'Affordable T-shirts and high-quality local apparel for everyday creators across Rwanda.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        <ActivityTracker />
        {children}
      </body>
    </html>
  );
}
