import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ScrollToTopButton from '@/components/ScrollToTopButton';  // Import here
import Navbar from '@/components/navbar';
import TopBar from '@/components/top-bar';
import Footer from '@/components/footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Orizen Inc - Start your LLC',
  icons: '/faviconorizen.png',
  description: 'Start your LLC with confidence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TopBar />          {/* Topbar at the top */}
        <Navbar />          {/* Navbar below the Topbar */}
        <main>{children}</main>  {/* Main content */}
        <Footer />          {/* Footer at the bottom */}
        <ScrollToTopButton />  {/* Scroll to top button */}
      </body>
    </html>
  );
}
