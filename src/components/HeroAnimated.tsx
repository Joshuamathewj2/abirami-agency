"use client";
import { motion, type Variants, useInView, animate } from "framer-motion";
import { useRef, useEffect } from "react";
import Link from "next/link";

/* ── Text Animation Variants ── */
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

/* ═══════════════════════════════
   HERO SECTION
═══════════════════════════════ */
export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5;
    }
  }, []);

  return (
    <section
      ref={ref}
      className="relative w-full min-h-[90vh] lg:min-h-screen bg-slate-950 text-white grid grid-cols-1 lg:grid-cols-2 items-stretch mt-0 pt-0"
    >
      {/* Left Column (Text & CTAs) */}
      <div className="relative z-20 bg-slate-950 flex flex-col justify-center min-h-[90vh] lg:min-h-screen py-24 lg:py-32 pl-4 md:pl-8 lg:pl-16 xl:pl-[calc((100vw-1280px)/2+4rem)] pr-4 md:pr-8 lg:pr-16">
        <div className="w-full max-w-xl">
          <motion.div
            className="flex flex-col items-start"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge / Tag */}
            <motion.div
              variants={fadeUpVariants}
              className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full px-4 py-1.5 mb-6 text-[10px] md:text-xs font-bold shadow-lg"
            >
              <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Authorised Parryware Wholesaler
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={fadeUpVariants}
              className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-4 drop-shadow-md"
            >
              Elevate your <br />
              <span className="relative inline-block mt-1">
                <span className="relative z-10 text-[#3B82F6] bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 drop-shadow-lg">
                  bathroom.
                </span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-500/20 rounded-full -z-10 -rotate-2" />
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUpVariants}
              className="text-sm md:text-base text-slate-300 max-w-md mb-6 font-medium leading-relaxed"
            >
              Premium sanitaryware &amp; bathroom fittings at wholesale prices,
              delivered straight to your site.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUpVariants}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <motion.div
                whileHover="hover"
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/products"
                  className="relative overflow-hidden w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full z-0"
                    variants={{
                      hover: {
                        translateX: ["-100%", "200%"],
                        transition: { duration: 1, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }
                      }
                    }}
                  />
                  <span className="relative z-10 text-white transition-colors">Shop Collection</span>
                  <svg className="w-4 h-4 relative z-10 text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust Metrics */}
            <motion.div
              variants={fadeUpVariants}
              className="flex items-center gap-6 mt-8 pt-6 border-t border-white/10 w-full max-w-sm"
            >
              <div>
                <p className="text-2xl font-black text-white">
                  200<span className="text-[#3B82F6]">+</span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Premium Products
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div>
                <p className="text-2xl font-black text-white">
                  24<span className="text-[#3B82F6]">h</span>
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Fast Delivery
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right Column (Video Container) */}
      <div className="relative w-full h-full min-h-full overflow-hidden flex items-stretch p-0 m-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-[-20%] left-0 w-full h-[130%] object-cover object-top scale-105 transition-transform duration-300"
        >
          <source src="/freelance1.mp4" type="video/mp4" />
        </video>

        {/* Circular logo sticker pinned to the bottom-right corner of this video frame (absolute bottom-3 right-3 z-30) */}
        <div className="absolute bottom-3 right-3 z-30">
          <div className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full overflow-hidden border border-white/20 shadow-2xl bg-slate-950 flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95">
            <img
              src="/logo.webp"
              alt="Parryware Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 text-white/50"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-[10px] font-bold tracking-widest uppercase">
          Scroll
        </span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </motion.div>
    </section>
  );
}

/* ─── Animated Card ─── */
export function FadeCard({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section Heading ─── */
export function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <motion.div
      className="text-center mb-12"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
    >
      <span className="text-xs font-black text-primary uppercase tracking-widest">
        {eyebrow}
      </span>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mt-2">
        {title}
      </h2>
      {sub && (
        <p className="text-gray-500 mt-3 text-base md:text-lg font-medium max-w-xl mx-auto">
          {sub}
        </p>
      )}
    </motion.div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ from = 0, to, duration = 2, suffix = "" }: { from?: number, to: number, duration?: number, suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView) {
      const node = nodeRef.current;
      if (node) {
        const controls = animate(from, to, {
          duration,
          ease: "easeOut",
          onUpdate(value) {
            node.textContent = Math.round(value).toLocaleString() + suffix;
          }
        });
        return () => controls.stop();
      }
    }
  }, [from, to, duration, suffix, inView]);

  return <span ref={nodeRef}>{from}{suffix}</span>;
}

/* ─── Stats Strip ─── */
const stats = [
  { value: 5000, suffix: "+", label: "Happy Customers" },
  { value: 200, suffix: "+", label: "Premium Products" },
  { value: 1, suffix: " Day", label: "Delivery" },
  { value: 100, suffix: "%", label: "Genuine Products" },
];

export function StatsStrip() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: i * 0.1,
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
          }}
        >
          <div className="text-4xl md:text-5xl font-black text-primary mb-1">
            <AnimatedCounter to={s.value} suffix={s.suffix} />
          </div>
          <div className="text-sm md:text-base font-semibold text-gray-500">
            {s.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
