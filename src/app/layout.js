import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { ToastProvider } from "@/components/shared/Toast";
import { AuthProvider } from "@/components/shared/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

// Font Optimization
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', 
  variable: '--font-inter', 
});

// 1. PWA Viewport Settings (Mobile App Feel)
export const viewport = {
  themeColor: "#0a0a0a", // Mobile header ka color (Dark theme match kiya hai)
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // User zoom na kar sake (App jaisa feel)
};

// 2. Complete SEO + PWA Metadata
export const metadata = {
  metadataBase: new URL('https://learn-r-five.vercel.app'), // Apni Domain yahan update karein
  title: {
    default: 'LearnR - Best Online Coaching & E-Learning Platform',
    template: '%s | LearnR'
  },
  description: 'Join LearnR to access top-quality courses, live classes, and study materials. The best platform for students and teachers to connect and grow.',
  keywords: ['LearnR', 'Online Coaching', 'E-learning', 'Education Platform', 'Live Classes', 'Student Portal', 'English Learning'],
  authors: [{ name: 'LearnR Team', url: 'https://learn-r-five.vercel.app' }],
  creator: 'LearnR',
  publisher: 'LearnR',
  
  // PWA Specific
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LearnR",
  },

  // Social Media Sharing (OpenGraph)
  openGraph: {
    title: 'LearnR - Transform Your Learning Experience',
    description: 'Experience the future of education with LearnR. Live classes, tests, and comprehensive study materials.',
    url: 'https://learn-r-five.vercel.app',
    siteName: 'LearnR',
    images: [
      {
        url: '/opengraph-image.png', // Public folder me image honi chahiye
        width: 1200,
        height: 630,
        alt: 'LearnR Platform Preview',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  
  // Search Engine Bots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            
            {/* Main content wrapper */}
            <main className="min-h-screen">
              {children}
            </main>
            
            {/* Vercel Analytics Tools */}
            <Analytics />
            <SpeedInsights />
            <Footer />
            
            {/* Payment Gateway Script */}
            <Script 
              src="https://checkout.razorpay.com/v1/checkout.js" 
              strategy="lazyOnload" 
            />
            
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}