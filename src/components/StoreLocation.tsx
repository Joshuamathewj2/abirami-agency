"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const STORE_LAT = 13.1534;
const STORE_LNG = 80.2179;
const STORE_NAME = "Abirami Agency Parryware";
const STORE_ADDRESS = "Madavaram Red Hills Rd, Kilburn Nagar, Madavaram, Chennai - 600060";

// Builds a Google Maps embed URL pinned to the store's location search query
function buildMapSrc(): string {
  return (
    `https://maps.google.com/maps?q=Abirami+Agency+Parryware+Madavaram+Red+Hills+Rd+Chennai` +
    `&z=16&output=embed`
  );
}

// Direct navigation link (opens Google Maps search for Abirami Agency Parryware)
const MAPS_NAV_URL =
  "https://www.google.com/maps/search/?api=1&query=Abirami+Agency+Parryware+Madavaram+Red+Hills+Rd+Chennai";

export default function StoreLocation() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const requestedRef = useRef(false);

  // Auto-request geolocation on mount (once)
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => {
        setLocationStatus("denied");
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  // Distance calculation (Haversine) for display
  const distanceKm =
    userLocation !== null
      ? (() => {
          const R = 6371;
          const dLat = ((STORE_LAT - userLocation.lat) * Math.PI) / 180;
          const dLng = ((STORE_LNG - userLocation.lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((userLocation.lat * Math.PI) / 180) *
              Math.cos((STORE_LAT * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
        })()
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="mt-12"
    >
      {/* Two-panel split layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">

        {/* ─── LEFT: Dark Info Card ─────────────────────────────────────── */}
        <div
          className="flex flex-col justify-between rounded-3xl p-8 lg:p-10 lg:w-[380px] xl:w-[420px] shrink-0"
          style={{ background: "#0a0e14" }}
        >
          {/* Top: Label + Heading */}
          <div>
            <p className="text-sky-400 text-sm font-medium italic tracking-wide mb-4">
              visit us
            </p>
            <h3 className="text-white font-extrabold text-3xl xl:text-4xl leading-tight mb-8">
              Your{" "}
              <span className="text-white">Premium</span>
              {" "}Bathroom{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(90deg, #38bdf8, #0ea5e9, #6366f1)",
                }}
              >
                Destination.
              </span>
            </h3>

            {/* Detail rows */}
            <div className="space-y-6">
              {/* Address */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                  ADDRESS
                </p>
                <p className="text-gray-200 text-sm leading-relaxed font-medium">
                  {STORE_ADDRESS}
                </p>
              </div>

              {/* Business Hours */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                  BUSINESS HOURS
                </p>
                <p className="text-gray-200 text-sm font-medium">
                  Mon – Sat &nbsp;·&nbsp; 9:00 AM – 8:00 PM
                </p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1.5">
                  PHONE
                </p>
                <a
                  href="tel:8610710434"
                  className="text-sky-400 text-sm font-bold hover:text-sky-300 transition-colors block"
                >
                  +91 86107 10434
                </a>
                <a
                  href="tel:7200377455"
                  className="text-sky-400 text-sm font-bold hover:text-sky-300 transition-colors block mt-0.5"
                >
                  +91 72003 77455
                </a>
              </div>
            </div>
          </div>

          {/* Bottom: CTA Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 mt-10">
            {/* Primary: Call / WhatsApp */}
            <a
              href="https://wa.me/918610710434?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20Parryware%20products"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-900 font-bold text-sm px-5 py-3 rounded-full hover:bg-gray-100 transition-colors shadow-md"
            >
              <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.131.558 4.131 1.532 5.87L.054 23.61a.5.5 0 00.612.612l5.74-1.478A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.387l-.361-.214-3.736.961.978-3.647-.235-.376A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
              </svg>
              WhatsApp Us
            </a>

            {/* Secondary: Directions */}
            <a
              href={MAPS_NAV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-white/15 text-gray-200 font-bold text-sm px-5 py-3 rounded-full hover:bg-white/8 hover:border-white/30 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </a>
          </div>
        </div>

        {/* ─── RIGHT: Map Panel ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 min-h-[400px] lg:min-h-0 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">

            {/* Google Maps iFrame — store pin always centred; functional behavior untouched */}
            <iframe
              src={buildMapSrc()}
              width="100%"
              height="100%"
              style={{ border: 0, position: "absolute", inset: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-none grayscale-[15%]"
              title="Abirami Agency Parryware Location"
            />

            {/* TOP OVERLAYS */}
            <div className="relative z-20 p-3 sm:p-4 flex items-start justify-between gap-2 pointer-events-none">
              {/* Top-Left: Light Live Location Info Card (Desktop/Tablet Overlay) */}
              <div className="hidden sm:block bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl border border-gray-100/90 max-w-[230px] sm:max-w-[280px] pointer-events-auto">
                <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  LIVE LOCATION
                </div>
                <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug mb-1">
                  Abirami Agency (Parryware)
                </h4>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed font-medium">
                  {STORE_ADDRESS}
                </p>
              </div>

              {/* Top-Right: "You Are Here" badge / Geolocation status */}
              <div className="pointer-events-auto shrink-0 ml-auto">
                {locationStatus === "granted" && distanceKm && (
                  <div className="flex items-center gap-1.5 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    📍 You are here · {distanceKm} km away
                  </div>
                )}

                {locationStatus === "loading" && (
                  <div className="flex items-center gap-1.5 bg-gray-900/85 text-gray-300 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Detecting location…
                  </div>
                )}
              </div>
            </div>

            {/* CENTER OVERLAY: "Shop Here" floating badge pointing down to pin */}
            <div className="relative z-20 flex justify-center items-center pointer-events-none my-auto">
              <div className="bg-gray-950/90 text-white backdrop-blur-md border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-1.5 transform -translate-y-4 animate-bounce">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Shop Here
              </div>
            </div>

            {/* BOTTOM OVERLAY: Slim horizontal "Open in Google Maps App" bar */}
            <a
              href={MAPS_NAV_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-20 w-full bg-gray-950/85 backdrop-blur-md text-white border-t border-white/10 px-4 py-3 flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors duration-300 cursor-pointer"
            >
              <svg className="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                Open in Google Maps App
              </span>
              <span className="text-sky-400 text-xs sm:text-sm font-bold">↗</span>
            </a>

          </div>

          {/* Mobile-only Address Info Card (rendered below map on small screens) */}
          <div className="sm:hidden mt-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-gray-100/90">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-wider uppercase mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              LIVE LOCATION
            </div>
            <h4 className="font-bold text-gray-900 text-xs leading-snug mb-1">
              Abirami Agency (Parryware)
            </h4>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
              {STORE_ADDRESS}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
