'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { categories, navItems } from '@/lib/mock-data';

export default function Footer() {
  const pathname = usePathname();
  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }
  
  const isHomePage = pathname === '/';
  
  return (
    <footer className="bg-gray-950 text-white print:text-black">
      {isHomePage && (
        <div className="container-main py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex flex-col items-start justify-center">
                  <span className="font-playfair text-2xl font-black text-white leading-none tracking-tight">
                    Abirami Agency
                  </span>
                  <span className="text-xs font-bold text-sky-400 tracking-[0.15em] uppercase leading-none mt-1">
                    Parryware Sanitaryware
                  </span>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                Authorised Parryware wholesaler in Chennai. Premium sanitaryware &amp; bathroom fittings at wholesale prices with fast delivery across Tamil Nadu.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-gray-300 hover:text-primary-light text-sm transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Categories</h3>
              <ul className="space-y-2.5">
                {categories.slice(0, 8).map((cat) => (
                  <li key={cat.id}>
                    <Link href={cat.href} className="text-gray-300 hover:text-primary-light text-sm transition-colors">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-light mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-gray-300 text-sm">No. 15, Madhavaram High Road,<br />Chennai - 600 060</span>
                </li>
                <li className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-light shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <a href="tel:9841039045" className="text-gray-300 hover:text-primary-light text-sm transition-colors">98410 39045</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-light shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <a href="tel:9884167907" className="text-gray-300 hover:text-primary-light text-sm transition-colors">98841 67907</a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary-light shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href="mailto:abiramiagencytiles@gmail.com" className="text-gray-300 hover:text-primary-light text-sm transition-colors">abiramiagencytiles@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-white/10 print:border-gray-200">
        <div className="w-full px-6 md:px-12 py-5 print:py-2 grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 items-center justify-between gap-4 print:gap-2">
          <p className="text-gray-400 print:text-gray-500 text-[11px] font-bold tracking-wider text-center md:text-left print:text-left">
            &copy; 2026 ALL RIGHTS RESERVED. ABIRAMI AGENCY - PARRYWARE SANITARYWARE.
          </p>
          <p className="text-gray-400 print:text-gray-500 text-[11px] text-center font-bold tracking-wider uppercase">
            POWERED BY{' '}
            <a href="https://www.cenexasystems.com/" target="_blank" rel="noopener noreferrer" className="text-primary font-black hover:text-red-500 print:text-gray-700 transition-colors">
              CENEXA SYSTEMS
            </a>{' '}
            &copy;2026
          </p>
          <p className="text-primary print:text-gray-600 text-[11px] text-center md:text-right print:text-right font-black italic tracking-widest uppercase flex items-center justify-center md:justify-end print:justify-end gap-1">
            <span className="text-primary print:text-gray-600 font-black">•</span> PREMIUM BATH EXPERIENCES.
          </p>
        </div>
      </div>
    </footer>
  );
}
