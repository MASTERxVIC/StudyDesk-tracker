import { Righteous, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Sidebar, MobileBar } from './components/Sidebar';
import SwipeNav from './components/SwipeNav';

const righteous = Righteous({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-righteous',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'Study Desk — Bank Exam Prep Tracker',
  description: 'Sky-blue, Apple-minimal study tracker for IBPS / SBI / RRB bank exams.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Paint se pehle dark class lagao — light-mode flash khatm */}
      <Script
        id="theme-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var s=localStorage.getItem('bank-tracker-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
        }}
      />
      <body
        className={`${righteous.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <div id="swipe-root" className="min-h-screen lg:flex">
          <SwipeNav />
          <Sidebar />
          <div className="min-w-0 flex-1 lg:pl-64">
            <MobileBar />
            <main id="swipe-page" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6">
              {children}
            </main>
            <footer className="border-t border-blush-200/70 py-6 text-center text-xs text-neutral-400 dark:border-white/10 lg:hidden">
              Made for your 100% — IBPS • SBI • RRB
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
