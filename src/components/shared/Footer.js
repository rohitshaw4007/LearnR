"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// --- COMPONENTS ---

// 1. Social Icon Component (Shared)
const SocialIcon = ({ path, href, label }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    whileHover={{ scale: 1.1, y: -2 }}
    whileTap={{ scale: 0.95 }}
    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-yellow-400 hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-colors cursor-pointer"
  >
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  </motion.a>
);

// 2. Footer Link Component (Shared)
const FooterLink = ({ href, children }) => (
  <li>
    <Link href={href} className="group flex items-center text-sm text-gray-400 hover:text-yellow-400 transition-colors duration-300 cursor-pointer">
      <span className="w-0 overflow-hidden group-hover:w-2 transition-all duration-300 mr-0 group-hover:mr-2 text-yellow-500">•</span>
      <span className="group-hover:translate-x-1 transition-transform duration-300">{children}</span>
    </Link>
  </li>
);

// 3. Mobile Accordion Item
const MobileAccordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left text-white font-medium active:bg-white/5 transition-colors cursor-pointer"
      >
        <span>{title}</span>
        <motion.span 
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-gray-500"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ul className="pb-4 space-y-3 pl-2 border-l border-white/10 ml-1">
              {children}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 4. New Graphic Card (Replaces Newsletter)
const CommunityCard = ({ mobile }) => (
  <Link href="/contact" className={`group block ${mobile ? 'mb-8' : ''}`}>
    <motion.div 
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-6 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer"
    >
      {/* Decorative Background Blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all duration-500"></div>
      
      <div className="relative z-10 flex flex-col items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 group-hover:bg-yellow-500 group-hover:text-black transition-all duration-300">
           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
           </svg>
        </div>
        
        <div>
          <h4 className="text-white font-bold text-lg leading-tight group-hover:text-yellow-400 transition-colors">
            Need Help?
          </h4>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
            Join our community or chat with support for instant assistance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-yellow-500 text-sm font-bold mt-1 group-hover:translate-x-2 transition-transform duration-300">
          <span>Contact Us</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </motion.div>
  </Link>
);

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  // Safe logic for conditional rendering
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
     // Check pathname on client side to avoid Hydration Mismatch
     if (pathname === "/") {
         setShouldRender(true);
     } else {
         setShouldRender(false);
     }
  }, [pathname]);

  // Agar Homepage nahi hai, toh kuch return mat karo
  if (!shouldRender && pathname !== "/") {
    return null;
  }

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  return (
    <footer className="relative bg-black pt-12 md:pt-20 pb-10 overflow-hidden border-t border-white/10">
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* =========================================
            DESKTOP VIEW (Hidden on Mobile)
           ========================================= */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Brand Section */}
            <motion.div initial="hidden" whileInView="visible" variants={containerVariants} className="md:col-span-3 space-y-6">
              <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-xl shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)] group-hover:scale-105 transition-transform">L</div>
                <span className="text-2xl font-bold text-white tracking-tighter">Learn<span className="text-yellow-500">R</span></span>
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                Empowering students with smart, data-driven English education. Join the revolution.
              </p>
              <div className="flex gap-4 pt-2">
                <SocialIconsGroup />
              </div>
            </motion.div>

            {/* Links Section */}
            <motion.div initial="hidden" whileInView="visible" variants={containerVariants} className="md:col-span-2 space-y-4">
              <h3 className="text-white font-bold text-lg tracking-wide select-none">Platform</h3>
              <ul className="space-y-3">
                <FooterLinksList />
              </ul>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" variants={containerVariants} className="md:col-span-2 space-y-4">
              <h3 className="text-white font-bold text-lg tracking-wide select-none">Resources</h3>
              <ul className="space-y-3">
                <ResourceLinksList />
              </ul>
            </motion.div>

            {/* Legal Section */}
            <motion.div initial="hidden" whileInView="visible" variants={containerVariants} className="md:col-span-2 space-y-4">
              <h3 className="text-white font-bold text-lg tracking-wide select-none">Legal</h3>
              <ul className="space-y-3">
                <LegalLinksList />
              </ul>
            </motion.div>

            {/* Graphic / Support Section (Replaced Newsletter) */}
            <motion.div initial="hidden" whileInView="visible" variants={containerVariants} className="md:col-span-3 space-y-4">
               <h3 className="text-white font-bold text-lg tracking-wide select-none">Support</h3>
               <CommunityCard />
            </motion.div>
        </div>


        {/* =========================================
            MOBILE APP-LIKE VIEW (Hidden on Desktop)
           ========================================= */}
        <div className="block md:hidden mb-12">
            
            {/* 1. Compact Brand Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/" className="flex items-center gap-2 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black font-bold text-lg">L</div>
                    <span className="text-xl font-bold text-white">Learn<span className="text-yellow-500">R</span></span>
                </Link>
            </div>

            {/* 2. New Graphic Card (Replaces Newsletter) */}
            <CommunityCard mobile={true} />

            {/* 3. Collapsible Menus */}
            <div className="border-t border-white/10 mb-8">
                <MobileAccordion title="Platform">
                    <FooterLinksList />
                </MobileAccordion>
                <MobileAccordion title="Resources">
                    <ResourceLinksList />
                </MobileAccordion>
                <MobileAccordion title="Legal">
                     <LegalLinksList />
                </MobileAccordion>
            </div>

            {/* 4. Socials */}
            <div className="flex justify-center gap-4 mb-8">
                <SocialIconsGroup />
            </div>
        </div>


        {/* Divider & Copyright */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="w-full h-px bg-white/10 mb-8"
        ></motion.div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 text-center md:text-left">
          <p>© {currentYear} LearnR Education. All rights reserved.</p>
          <div className="hidden md:flex gap-6">
            <Link href="/privacy" className="hover:text-yellow-500 transition-colors cursor-pointer">Privacy</Link>
            <Link href="/terms" className="hover:text-yellow-500 transition-colors cursor-pointer">Terms</Link>
            <Link href="/contact" className="hover:text-yellow-500 transition-colors cursor-pointer">Contact</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

// --- HELPER SUB-COMPONENTS ---

function SocialIconsGroup() {
    return (
        <>
            <SocialIcon label="Twitter" href="https://x.com" path="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            <SocialIcon label="YouTube" href="https://youtube.com" path="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            <SocialIcon label="Instagram" href="https://instagram.com" path="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            <SocialIcon label="Freelancer" href="https://freelancer.com" path="M13.7,13.8L9,15.7L7.6,9.2l12.7-5L13.7,13.8z M12.8,17.2l-2.1,3.5l-0.7-3.9l-4.5-5.2l2.3,1.3l0.8,4.3L12.8,17.2z M24,5.4 c-0.8-1-2.1-1.5-3.4-1.2l-15.6,6c-1.3,0.5-2.1,1.9-1.8,3.2c0.2,1,0.9,1.8,1.9,2.1l5.4,1.8l2.9,7.6c0.6,1.4,2.3,2.1,3.7,1.4 c1-0.5,1.7-1.4,1.8-2.5l1.6-9.8l4.9-1.9C26.5,11.5,27,9.3,26,7.9C25.5,6.8,24.8,6,24,5.4z" />
        </>
    )
}

function FooterLinksList() {
    return (
        <>
            <FooterLink href="#hero">Home</FooterLink>
            <FooterLink href="#features">Features</FooterLink>
            <FooterLink href="#reviews">Reviews</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
        </>
    )
}

function ResourceLinksList() {
    return (
        <>
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/community">Community</FooterLink>
            <FooterLink href="/help">Help Center</FooterLink>
        </>
    )
}

function LegalLinksList() {
    return (
        <>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/refund">Refund Policy</FooterLink>
            <FooterLink href="/shipping">Shipping Policy</FooterLink>
            <FooterLink href="/contact">Contact Us</FooterLink>
        </>
    )
}