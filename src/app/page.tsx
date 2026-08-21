import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  HeroSection,
  FadeCard,
  SectionHeading,
  StatsStrip,
} from "@/components/HeroAnimated";
import { testimonials, categories } from "@/lib/mock-data";
import { getProductsFromDB } from "@/lib/db";
import HomeReviewButton from "@/components/HomeReviewButton";
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
  const dbProducts = await getProductsFromDB();
  const products = dbProducts.filter((p) => p.sizes && p.sizes.length > 0);
  const bestsellers = products.filter((p) => p.badge === "Bestseller");

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8">
            {trustBadges.map((b, i) => (
              <FadeCard key={b.title} delay={i * 0.1}>
                <div className="group relative bg-[#0c1a2e] p-8 md:p-10 h-full flex flex-col hover:bg-white/5 transition-colors duration-300 overflow-hidden">
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
      <section className="py-20 md:py-32 bg-gray-50 overflow-hidden">
        <div className="container-main">
          <SectionHeading
            eyebrow="Browse by Category"
            title="Shop by Category"
            sub="Explore our full range of premium sanitaryware and bathroom fittings"
          />
          <div className="mt-12 w-full flex justify-center">
            <CategoryCarousel slides={carouselSlides} />
          </div>
        </div>
      </section>

      {/* ────────────────── BESTSELLERS (3D MARQUEE) ────────────────── */}
      {bestsellers.length > 0 && (
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 mt-8">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) }

      {/* ────────────────── TESTIMONIALS ────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-16 md:py-24 overflow-hidden">
          <div className="container-main mb-12">
            <div className="relative flex flex-col items-center text-center">
              <SectionHeading
                eyebrow="Social Proof"
                title="What Our Customers Say"
                sub="Trusted by hundreds of customers across Tamil Nadu"
              />
              <div className="md:absolute md:right-0 md:bottom-0 mt-4 md:mt-0">
                <HomeReviewButton />
              </div>
            </div>
          </div>
          <div className="relative w-full before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 md:before:w-32 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 md:after:w-32 after:bg-gradient-to-l after:from-white after:to-transparent">
            <div className="flex gap-6 w-max animate-marquee pause-marquee py-4">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div
                  key={`${t.id}-${i}`}
                  className="w-[320px] md:w-[400px] shrink-0 bg-white rounded-2xl p-6 md:p-8 border border-gray-200 hover:border-primary/20 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${star <= t.rating ? "text-yellow-400" : "text-gray-200"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium">
                    &ldquo;{t.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.name}</p>
                      <p className="text-sm text-gray-500 font-medium">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
      <section className="py-16 md:py-28 bg-[#0c1a2e] text-white relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="aurora-blob-1 absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[100px]" />
          <div className="aurora-blob-2 absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-sky-900/20 blur-[100px]" />
          <div
            className="dot-pattern absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>
        <div className="container-main text-center relative z-10">
          <FadeCard>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
              Ready to Transform Your Bathroom?
            </h2>
            <p className="text-white/60 max-w-xl mx-auto mb-12 text-lg md:text-xl font-medium">
              Contact us today for wholesale prices and fast delivery across Tamil Nadu.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <a
                href="tel:8601710434"
                className="inline-flex items-center justify-center gap-3 bg-primary text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-primary-dark transition-all hover:scale-105 shadow-[0_0_40px_rgba(14,165,233,0.4)] hover:shadow-[0_0_60px_rgba(14,165,233,0.6)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call 86107 10434
              </a>
              <a
                href="tel:7200377455"
                className="inline-flex items-center justify-center gap-3 bg-primary text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-primary-dark transition-all hover:scale-105 shadow-[0_0_40px_rgba(14,165,233,0.4)] hover:shadow-[0_0_60px_rgba(14,165,233,0.6)]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call 72003 77455
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 px-10 py-5 rounded-full font-bold text-lg transition-all"
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
