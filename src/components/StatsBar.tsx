'use client';
import { useEffect, useRef, useState } from 'react';

const stats = [
  { value: 5000, suffix: '+', label: 'Happy Customers' },
  { value: 20, suffix: ' Yrs', label: 'Warranty Backed' },
  { value: 100, suffix: '%', label: 'Genuine Products' },
  { value: 1, suffix: ' Day', label: 'Delivery Time' },
];

function useCountUp(end: number, duration = 1800, started: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, started]);
  return count;
}

function StatItem({ value, suffix, label, delay, started }: { value: number; suffix: string; label: string; delay: number; started: boolean }) {
  const count = useCountUp(value, 1600, started);
  return (
    <div
      className="flex flex-col items-center reveal"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <span className="stat-number text-4xl md:text-5xl font-black text-primary tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-sm md:text-base font-semibold text-gray-500 mt-1">{label}</span>
    </div>
  );
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          // also add reveal class to children
          el.querySelectorAll('.reveal').forEach(child => child.classList.add('visible'));
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
      {stats.map((s, i) => (
        <StatItem key={s.label} {...s} delay={i * 120} started={started} />
      ))}
    </div>
  );
}
