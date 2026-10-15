"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const STORE_LAT = 13.1534;
const STORE_LNG = 80.2179;
const STORE_NAME = "Abirami Agency Parryware";
const STORE_ADDRESS =
  "B.O:931/2, Madavaram Red Hills Rd, opposite Beast Mode gym, Kilburn Nagar, Madavaram, Chennai, Tamil Nadu 600060";
const STORE_SHORT_ADDRESS = "Kilburn Nagar, Madavaram, Chennai - 600060";
const STORE_RATING = "4.9";
const STORE_REVIEW_COUNT = 8; // Verified Google review count

// Shared Google Maps navigation URL for all map buttons and overlays
export const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Abirami+Agency+Parryware+Madavaram+Red+Hills+Rd+Chennai";

// Builds a clean coordinates-only Google Maps embed URL
// This eliminates Google's built-in place card and its broken internal link
function buildMapSrc(): string {
  return `https://maps.google.com/maps?q=${STORE_LAT},${STORE_LNG}&z=16&output=embed`;
}

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
      className="mt-8 md:mt-12"
    >
      {/* Two-panel split layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">

        {/* ─── LEFT: Dark Info Card ─────────────────────────────────────── */}
        <div
          className="flex flex-col justify-between rounded-3xl p-6 sm:p-8 lg:p-10 lg:w-[380px] xl:w-[420px] shrink-0"
          style={{ background: "#0a0e14" }}
        >
          {/* Top: Label + Heading */}
          <div>
            <p className="text-sky-400 text-xs sm:text-sm font-medium italic tracking-wide mb-3 sm:mb-4">
              visit us
            </p>
            <h3 className="text-white font-extrabold text-2xl sm:text-3xl xl:text-4xl leading-tight mb-6 sm:mb-8">
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
            <div className="space-y-4 sm:space-y-6">
              {/* Address */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">
                  ADDRESS
                </p>
                <p className="text-gray-200 text-xs sm:text-sm leading-relaxed font-medium">
                  {STORE_ADDRESS}
                </p>
              </div>

              {/* Business Hours */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">
                  BUSINESS HOURS
                </p>
                <p className="text-gray-200 text-xs sm:text-sm font-medium">
                  Mon – Sat &nbsp;·&nbsp; 9:00 AM – 8:00 PM
                </p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 mb-1">
                  PHONE
                </p>
                <a
                  href="tel:8610710434"
                  className="text-sky-400 text-xs sm:text-sm font-bold hover:text-sky-300 transition-colors block"
                >
                  +91 86107 10434
                </a>
                <a
                  href="tel:7200377455"
                  className="text-sky-400 text-xs sm:text-sm font-bold hover:text-sky-300 transition-colors block mt-0.5"
                >
                  +91 72003 77455
                </a>
              </div>
            </div>
          </div>

          {/* Bottom: CTA Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2.5 sm:gap-3 mt-8 sm:mt-10">
            {/* Primary: Call / WhatsApp */}
            <a
              href="https://wa.me/918610710434?text=Hi%2C%20I%27d%20like%20to%20enquire%20about%20Parryware%20products"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-900 font-bold text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-3 rounded-full hover:bg-gray-100 transition-colors shadow-md"
            >
              <svg className="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.131.558 4.131 1.532 5.87L.054 23.61a.5.5 0 00.612.612l5.74-1.478A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.032-1.387l-.361-.214-3.736.961.978-3.647-.235-.376A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
              </svg>
              WhatsApp Us
            </a>

            {/* Secondary: Directions */}
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 border border-white/15 text-gray-200 font-bold text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-3 rounded-full hover:bg-white/8 hover:border-white/30 hover:text-white transition-all"
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
        <div className="flex-1 flex flex-col min-w-0">
          {/* Card wrapper: normal-flow layout prevents any overlap */}
          <div className="w-full rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl flex flex-col border border-gray-100 bg-white flex-1 min-w-0">

            {/* A. MAP AREA (relative, height ~240px on mobile, 320-420px on md+) */}
            <div className="relative w-full h-[240px] md:h-[340px] lg:flex-1 lg:min-h-[320px] overflow-hidden bg-gray-100">
              {/* Google Maps iFrame */}
              <iframe
                src={buildMapSrc()}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 w-full h-full pointer-events-none grayscale-[15%]"
                title="Abirami Agency Parryware Location"
              />

              {/* OVERLAY 1: "Shop Here" badge anchored directly below the centered red pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-3.5 z-10 pointer-events-none">
                <div className="bg-gray-950/90 text-white backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-xl flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-400 animate-pulse" />
                  Shop Here
                </div>
              </div>

              {/* OVERLAY 2: Distance pill at TOP-RIGHT (top-3 right-3) — clear of Google controls & satellite thumbnail */}
              <div className="absolute top-3 right-3 z-10 pointer-events-auto shrink-0">
                {locationStatus === "granted" && distanceKm && (
                  <div className="flex items-center gap-1.5 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-ping" />
                    <span>📍 You are {distanceKm} km away</span>
                  </div>
                )}

                {locationStatus === "loading" && (
                  <div className="flex items-center gap-1.5 bg-gray-900/85 text-gray-300 text-[10px] sm:text-xs font-semibold px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Detecting…</span>
                  </div>
                )}
              </div>
            </div>

            {/* B. ADDRESS INFO CARD (normal flow directly below map, NOT absolute) */}
            <div className="bg-white p-3 sm:p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pointer-events-auto">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <h4 className="font-semibold text-gray-900 text-sm leading-snug">
                    {STORE_NAME}
                  </h4>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-amber-500 mb-1.5">
                  <span className="font-semibold text-gray-900">{STORE_RATING}</span>
                  <span className="text-amber-400 tracking-tight">★★★★★</span>
                  {STORE_REVIEW_COUNT ? (
                    <span className="text-gray-500 font-normal">({STORE_REVIEW_COUNT} reviews)</span>
                  ) : null}
                </div>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {STORE_ADDRESS}
                </p>
              </div>

              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 min-h-[36px] w-full sm:w-auto px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <span>Open in Maps</span>
                <span className="text-xs">&rarr;</span>
              </a>
            </div>

            {/* C. BOTTOM BAR (normal flow, LAST child of the card, NOT absolute) */}
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-12 min-h-[48px] w-full bg-gray-950 hover:bg-gray-900 active:bg-black text-white border-t border-white/10 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 pointer-events-auto"
            >
              <svg
                className="w-4 h-4 text-sky-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span className="text-xs sm:text-sm font-semibold tracking-wide">
                Open in Google Maps App
              </span>
              <span className="text-sky-400 text-xs sm:text-sm font-bold">↗</span>
            </a>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
