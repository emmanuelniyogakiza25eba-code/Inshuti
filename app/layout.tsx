import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inshuti | Business Records for Rwanda',
  description: 'Private, simple business record-keeping for merchants and micro-entrepreneurs in Rwanda.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
