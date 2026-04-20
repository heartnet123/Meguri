import type {Metadata} from 'next';
import { Geist, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ConvexClientProvider } from './providers/ConvexClientProvider';
import { WorkspaceProvider } from './providers/WorkspaceProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { getToken } from '@/lib/auth-server';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-primary',
});

export const metadata: Metadata = {
  title: 'SmartStock | ระบบจัดการสต็อกและคาดการณ์ความต้องการ',
  description: 'แพลตฟอร์มจัดการสินค้าคงคลังและคาดการณ์ความต้องการสำหรับธุรกิจขนาดเล็ก',
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  const token = await getToken();
  return (
    <html lang="th" className={`${geistSans.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <Script src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js" strategy="beforeInteractive" />
        <Script id="theme-init" strategy="beforeInteractive">{`(function(){try{var t=localStorage.getItem('ss_theme');var theme=t==='light'||t==='dark'?t:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.dataset.theme='light';}})();`}</Script>
      </head>
      <body className="font-sans bg-background text-foreground antialiased selection:bg-accent/20" suppressHydrationWarning>
        <ThemeProvider>
          <ConvexClientProvider initialToken={token}>
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
