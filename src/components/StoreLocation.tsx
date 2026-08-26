"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const STORE_LAT = 13.1534;
const STORE_LNG = 80.2179;
const STORE_NAME = "Abirami Agency Parryware";
const STORE_ADDRESS = "Madavaram Red Hills Rd, Kilburn Nagar, Madhavaram, Chennai - 600060";

// Builds a Google Maps embed URL with optional user location marker
function buildMapSrc(userLat?: number, userLng?: number): string {
  const storeMarker = `${STORE_LAT},${STORE_LNG}`;
  // Embed API with two markers (store + user)
  if (userLat !== undefined && userLng !== undefined) {
    const userMarker = `${userLat},${userLng}`;
    return (
      `https://maps.google.com/maps?q=${encodeURIComponent(STORE_NAME)}&ll=${storeMarker}` +
      `&z=15&output=embed`
    );
  }
  return (
    `https://maps.google.com/maps?q=${encodeURIComponent(STORE_NAME + ", " + STORE_ADDRESS)}` +
    `&z=15&ie=UTF8&iwloc=B&output=embed`
  );
}

export default function StoreLocation() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [status, setStatus] = useState<{ isOpen: boolean; text: string }>({
    isOpen: true,
    text: "Open Today • 9:00 AM – 8:00 PM"
  });
  const requestedRef = useRef(false);

  // Dynamic business hours check based on IST
  useEffect(() => {
    const updateStatus = () => {
      try {
        const dayFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          weekday: "long",
        });
        const hourFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: "numeric",
        });
        const minuteFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          minute: "numeric",
        });
        
        const dayPart = dayFormatter.format(new Date());
        const hours = parseInt(hourFormatter.format(new Date()), 10);
        const minutes = parseInt(minuteFormatter.format(new Date()), 10);
        
        const isSunday = dayPart === "Sunday";
        const isSaturday = dayPart === "Saturday";
        const timeVal = hours * 100 + minutes; // e.g. 900 for 9:00 AM, 2000 for 8:00 PM

        const isOpen = !isSunday && timeVal >= 900 && timeVal < 2000;

        let text = "";
        if (isOpen) {
          text = "Open Today • 9:00 AM – 8:00 PM";
        } else if (isSunday) {
          text = "Closed Today (Sunday) • Opens Mon 9:00 AM";
        } else {
          // Closed after hours on working day
          if (isSaturday && timeVal >= 2000) {
            text = "Closed Now • Opens Mon 9:00 AM";
          } else if (timeVal < 900) {
            text = "Closed Now • Opens today at 9:00 AM";
          } else {
            text = "Closed Now • Opens tomorrow at 9:00 AM";
          }
        }

        setStatus({ isOpen, text });
      } catch (e) {
        console.error("Error evaluating IST business hours:", e);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="space-y-8 mt-12"
    >
      {/* Map Card Wrapper */}
      <div className="group/map relative bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 p-[2px] rounded-3xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 ease-out">
        <div className="relative w-full h-[400px] md:h-[500px] rounded-[22px] overflow-hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-transform duration-500 ease-out group-hover/map:scale-[1.01]">

          {/* Live Status pill */}
          <div className="absolute top-4 left-4 z-20 bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-[10px] md:text-xs font-semibold shadow-lg flex items-center gap-2 select-none">
            <span className={`h-2.5 w-2.5 rounded-full ${status.isOpen ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
            <span className="text-gray-100 tracking-wide">{status.text}</span>
          </div>

          {/* "You Are Here" badge — only shown when location is granted */}
          {locationStatus === "granted" && distanceKm && (
            <div className="absolute top-4 right-4 z-20 bg-blue-600 text-white text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              📍 You are here · {distanceKm} km away
            </div>
          )}

          {/* Loading badge */}
          {locationStatus === "loading" && (
            <div className="absolute top-4 right-4 z-20 bg-slate-800/80 text-gray-300 text-[10px] md:text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Detecting your location…
            </div>
          )}

          {/* Google Maps iFrame — store pin */}
          <iframe
            src={buildMapSrc(userLocation?.lat, userLocation?.lng)}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 pointer-events-none grayscale-[20%] opacity-90"
            title="Abirami Agency Parryware Location"
          />

          {/* Shine shimmer */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[22px]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/map:translate-x-full transition-transform duration-1000 ease-out" />
          </div>

          {/* Clickable overlay to open in Maps */}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE_NAME + " " + STORE_ADDRESS)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/5 hover:bg-black/15 transition-colors duration-500 flex items-center justify-center z-10"
          >
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
              {STORE_ADDRESS}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 dark:text-white mb-1 text-base tracking-tight">Business Hours</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              Mon – Sat<br />9:00 AM – 8:00 PM
            </p>
            <p className="text-xs text-red-500 font-semibold mt-1">Closed on Sundays</p>
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
              +91 86107 10434
            </a>
            <a href="tel:7200377455" className="text-sm text-primary font-bold hover:underline block mt-1 hover:text-primary-dark">
              +91 72003 77455
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
