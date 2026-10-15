export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import {
  HeroSection,
  FadeCard,
  SectionHeading,
  StatsStrip,
} from "@/components/HeroAnimated";
import { categories } from "@/lib/mock-data";
import { getProductsFromDB } from "@/lib/db";
import { getApprovedTestimonialsAction, getReviewAuthContext } from "@/app/actions/reviewActions";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import StardustButton from "@/components/StardustButton";
import StoreLocation from "@/components/StoreLocation";
import CategoryCarousel from "@/components/CategoryCarousel";

const trustBadges = [
  {
    num: "01",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Fast Dispatch",
    desc: "Same-day dispatch across Chennai & Tamil Nadu for all sanitaryware and fitting orders.",
  },
  {
    num: "02",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Authorised Wholesaler",
    desc: "Official Parryware partner. Every product is genuine and backed by manufacturer warranty.",
  },
  {
    num: "03",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "Warranty Backed",
    desc: "Up to 10 years warranty on fittings & sanitaryware. Buy with complete confidence.",
  },
  {
    num: "04",
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Wholesale Prices",
    desc: "Direct from dealer. Best prices in Chennai — always, no negotiations needed.",
  },
];

export default async function Home() {
  const [testimonials, auth] = await Promise.all([
    getApprovedTestimonialsAction(),
    getReviewAuthContext(),
  ]);

  const allowedCategoryNames = [
    "One Piece WC (S-Trap)",
    "Wall Hung Basin",
    "Squatting Pan",
    "Hand Showers Collection",
    "Health Faucet Collection",
  ];

  const carouselSlides = categories
    .filter((cat) => allowedCategoryNames.includes(cat.name))
    .map((cat) => ({
      src: `/frames/${cat.name}.jpeg`,
      alt: cat.name,
      title: cat.name,
      subtitle: cat.description,
      href: cat.href,
    }));

  return (
    <div className="bg-white">
      {/* ────────────────── FULL-SCREEN ANIMATED HERO ────────────────── */}
      <HeroSection />

      {/* ────────────────── STATS STRIP ────────────────── */}
      <section className="relative py-14 md:py-20 border-b border-gray-100 bg-[#f8fbff] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="container-main relative z-10">
          <StatsStrip />
        </div>
      </section>

      {/* ────────────────── TRUST BADGES ────────────────── */}
      <section className="py-20 md:py-28 bg-[#0c1a2e] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container-main relative z-10">
          <FadeCard>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-16">
              <div>
                <span className="text-xs font-black text-primary uppercase tracking-widest">
                  Why Choose Us
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mt-2">
                  Built on Trust.
                </h2>
              </div>
              <p className="text-white/40 font-medium max-w-xs text-sm leading-relaxed">
                Chennai&apos;s most reliable sanitaryware wholesale partner since day one.
              </p>
            </div>
          </FadeCard>

          <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-px sm:bg-white/8 sm:pb-0 scrollbar-hide">
            {trustBadges.map((b, i) => (
              <FadeCard key={b.title} delay={i * 0.1} className="w-[85%] sm:w-auto shrink-0 snap-center h-full">
                <div className="group relative bg-[#0c1a2e] p-8 md:p-10 h-full flex flex-col hover:bg-white/5 transition-colors duration-300 overflow-hidden rounded-2xl sm:rounded-none">
                  <span className="absolute top-4 right-4 text-7xl font-black text-white/[0.04] select-none leading-none">
                    {b.num}
                  </span>
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 group-hover:bg-primary transition-colors duration-300" />
                  <div className="text-primary mb-6 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    {b.icon}
                  </div>
                  <h3 className="font-extrabold text-white text-xl mb-3">{b.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed font-medium">{b.desc}</p>
                  <div className="mt-auto pt-8">
                    <svg className="w-5 h-5 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </FadeCard>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────── SHOP BY CATEGORY (3D CARD STACK CAROUSEL) ────────────────── */}
      <section className="pt-10 pb-6 md:pt-14 md:pb-8 bg-gray-50 overflow-hidden">
        <div className="container-main">
          <SectionHeading
            eyebrow="Browse by Category"
            title="Shop by Category"
            sub="Explore our full range of premium sanitaryware and bathroom fittings"
          />
          <div className="mt-8 md:mt-12 w-full flex justify-center">
            <CategoryCarousel slides={carouselSlides} />
          </div>
        </div>
      </section>

      {/* ────────────────── BESTSELLERS (3D MARQUEE) ────────────────── */}
      <Suspense fallback={<BestsellersSkeleton />}>
        <BestsellersSection />
      </Suspense>

      {/* ────────────────── TESTIMONIALS ────────────────── */}
      <section className="pt-6 pb-12 md:pt-10 md:pb-18 overflow-hidden">
        <div className="container-main mb-2 md:mb-4">
          <div className="relative flex flex-col items-center text-center">
            <SectionHeading
              eyebrow="Social Proof"
              title="What Our Customers Say"
              sub="Trusted by hundreds of customers across Tamil Nadu"
            />
          </div>
        </div>

        <TestimonialCarousel
          initialReviews={testimonials}
          initialIsAdmin={auth.isAdmin}
          serverUserId={auth.user?.id}
          serverUserEmail={auth.user?.email}
        />
      </section>

      {/* ────────────────── LOCATION MAP ────────────────── */}
      <section className="py-16 md:py-24 bg-gray-50 border-t border-gray-100 relative overflow-hidden">
        <div className="container-main relative z-10">
          <div className="relative">
            <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-blue-500/5 blur-[80px]" />
            <SectionHeading
              eyebrow="Visit Us"
              title="Our Store Location"
              sub="Visit our showroom to see our full sanitaryware and fittings collection in person"
            />
          </div>
          <StoreLocation />
        </div>
      </section>

      {/* ────────────────── CTA ────────────────── */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="container-main text-center">
          <FadeCard>
            <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-5 tracking-tight text-slate-900">
              Ready to Transform Your Bathroom?
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto mb-8 md:mb-10 text-base md:text-lg font-medium">
              Contact us today for wholesale prices and fast delivery across Tamil Nadu.
            </p>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center max-w-md mx-auto md:max-w-none">
              <div className="grid grid-cols-2 gap-3 md:flex md:flex-row md:gap-4 w-full md:w-auto">
                <a
                  href="tel:8610710434"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-2.5 sm:px-4 text-xs sm:text-sm md:px-8 md:py-4 md:text-base rounded-xl font-bold transition-all shadow-sm whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call 86107 10434
                </a>
                <a
                  href="tel:7200377455"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-2.5 sm:px-4 text-xs sm:text-sm md:px-8 md:py-4 md:text-base rounded-xl font-bold transition-all shadow-sm whitespace-nowrap"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call 72003 77455
                </a>
              </div>
              <Link
                href="/contact"
                className="w-full md:w-auto inline-flex items-center justify-center bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 py-3 px-4 text-sm md:px-8 md:py-4 md:text-base rounded-xl font-bold transition-all"
              >
                Send Inquiry
              </Link>
            </div>
          </FadeCard>
        </div>
      </section>
    </div>
  );
}

function BestsellersSkeleton() {
  return (
    <section className="py-16 md:py-24">
      <div className="container-main">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded-md" />
            <div className="h-8 w-48 bg-gray-300 rounded-lg" />
            <div className="h-4 w-36 bg-gray-100 rounded-md" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-[380px]">
              <div className="w-full h-48 bg-gray-100 animate-pulse" />
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

async function BestsellersSection() {
  try {
    const dbProducts = await getProductsFromDB();
    const products = (dbProducts || []).filter((p) => p && p.sizes && p.sizes.length > 0);
    const bestsellers = products.filter((p) => p.badge === "Bestseller");

    if (bestsellers.length === 0) return null;

    return (
      <section className="py-16 md:py-24">
        <div className="container-main">
          <div className="flex items-end justify-between mb-12">
            <FadeCard>
              <div>
                <span className="text-xs font-black text-primary uppercase tracking-widest">
                  🔥 Most Ordered
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mt-2">
                  Bestsellers
                </h2>
                <p className="text-gray-500 mt-1 font-medium">
                  Our most popular products
                </p>
              </div>
            </FadeCard>
            <FadeCard>
              <Link href="/products" className="text-primary hover:text-primary-dark font-bold text-sm flex items-center gap-1 group">
                View All
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </FadeCard>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 mt-8">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error("Failed to load bestsellers on Home page:", error);
    return null;
  }
}
