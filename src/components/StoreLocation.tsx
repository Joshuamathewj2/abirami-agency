"use client";

import { motion } from "framer-motion";

export default function StoreLocation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="space-y-8 mt-12"
    >
      {/* Map Card Wrapper with Gradient Border & Hover Shadows */}
      <div className="group/map relative bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 p-[2px] rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 ease-out">
        <div className="relative w-full h-[400px] md:h-[500px] rounded-[22px] overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-transform duration-500 ease-out group-hover/map:scale-[1.01]">
          {/* Live Status indicator pill */}
          <div className="absolute top-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-[10px] md:text-xs font-semibold shadow-lg flex items-center gap-2 select-none">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-gray-100 tracking-wide">
              Open Today • 9:00 AM – 8:00 PM
            </span>
          </div>

          <iframe
            src="https://maps.google.com/maps?q=Madavaram%20Red%20Hills%20Rd,%20Kilburn%20Nagar,%20Madhavaram,%20Chennai+(Abirami%20Agency%20Parryware)&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 pointer-events-none grayscale-[30%] opacity-90"
          ></iframe>

          {/* Shine shimmer effect */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[22px]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/map:translate-x-full transition-transform duration-1000 ease-out" />
          </div>

          <a
            href="https://maps.google.com/?cid=4112521425107411362"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/5 hover:bg-black/15 transition-colors duration-500 flex items-center justify-center z-10"
          >
            {/* Magnetic CTA button with concentric pulsing rings */}
            <div className="relative group/btn">
              <span className="animate-ping absolute -inset-1.5 rounded-full bg-blue-500/30 opacity-75 duration-1000 pointer-events-none" />
              <span className="animate-ping absolute -inset-3.5 rounded-full bg-indigo-500/15 opacity-50 duration-[1500ms] pointer-events-none" />
              <div className="relative bg-white px-8 py-4 rounded-full font-bold text-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/50 flex items-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(59,130,246,0.25)] hover:scale-105 hover:text-blue-600">
                <svg className="w-5 h-5 text-blue-500 transition-transform duration-300 group-hover/btn:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open in Maps
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Address Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4"
        >
          <div className="w-12 h-12 bg-sky-50 dark:bg-sky-950/40 rounded-xl flex items-center justify-center shrink-0 text-primary border border-sky-100 dark:border-sky-900/50">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 dark:text-white mb-1 text-base tracking-tight">Address</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              Abirami Agency Parryware, Madavaram Red Hills Rd, Kilburn Nagar, Madhavaram, Chennai - 600060
            </p>
          </div>
        </motion.div>

        {/* Business Hours Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4"
        >
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center shrink-0 text-amber-600 border border-amber-100 dark:border-amber-900/50">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 dark:text-white mb-1 text-base tracking-tight">Business Hours</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              Monday – Sunday<br />10:00 AM – 9:00 PM
            </p>
          </div>
        </motion.div>

        {/* Phone Card */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4"
        >
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-100 dark:border-emerald-900/50">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 dark:text-white mb-1 text-base tracking-tight">Phone</h4>
            <a href="tel:8610710434" className="text-sm text-primary font-bold hover:underline block hover:text-primary-dark">
              086107 10434
            </a>
            <a href="tel:7200377455" className="text-sm text-primary font-bold hover:underline block mt-1 hover:text-primary-dark">
              072003 77455
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
