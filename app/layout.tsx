import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'SmartStock | Inventory & Demand Forecasting',
  description: 'Smart Inventory + Demand Forecasting Platform for small businesses.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <Script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js" strategy="beforeInteractive" />
      </head>
      <body className="font-sans text-neutral-900 antialiased bg-neutral-50 selection:bg-neutral-200" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
