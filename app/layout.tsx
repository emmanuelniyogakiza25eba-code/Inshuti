import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'INSHUTI Apparel | Rwanda',
  description: 'Affordable T-shirts and high-quality local apparel for everyday creators across Rwanda.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
