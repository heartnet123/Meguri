import type {Metadata} from 'next';
import { Geist, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import './globals.css'; // Global styles
import ConvexClientProvider from './providers/ConvexClientProvider';
import { WorkspaceProvider } from './providers/WorkspaceProvider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-primary',
});

export const metadata: Metadata = {
  title: 'SmartStock | Inventory & Demand Forecasting',
  description: 'Smart Inventory + Demand Forecasting Platform for small businesses.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${spaceGrotesk.variable}`}>
      <head>
        <Script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js" strategy="beforeInteractive" />
      </head>
      <body className="font-sans bg-background text-foreground antialiased selection:bg-accent/20" suppressHydrationWarning>
        <ConvexClientProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
