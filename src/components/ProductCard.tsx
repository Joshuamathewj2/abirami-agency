'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { useWishlist } from '@/context/WishlistContext';

import { getProductImagePath } from '@/lib/image-utils';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

/* ── Branded placeholder for missing images ── */
function ImagePlaceholder() {
  return (
    <div className="w-full h-full skeleton-shimmer flex flex-col items-center justify-center gap-3 p-6">
      <svg
        className="w-12 h-12 text-slate-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight">
        Image<br />Coming Soon
      </span>
    </div>
  );
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const imageSrc = getProductImagePath(product);
  const [src, setSrc] = useState(imageSrc);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { toggleItem, isInWishlist } = useWishlist();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    setSrc(imageSrc);
    setImgError(false);
    setImgLoaded(false);
  }, [imageSrc]);

  const handleError = () => {
    if (src !== '/Assets1/faucet_01.png') {
      setSrc('/Assets1/faucet_01.png');
    } else {
      setImgError(true);
    }
  };

  const inWishlist = isClient ? isInWishlist(product.id) : false;

  const hasRealImage =
    !imgError &&
    src &&
    !src.startsWith('data:image/svg+xml');

  // Unique model code chips for variant preview — limit to 3
  const variantChips = Array.from(
    new Set(product.sizes?.map(s => s.label.split(' ')[0]) || [])
  ).slice(0, 4);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="product-card group relative flex flex-col bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={product.name}
    >
      {/* ── Image Zone ── */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[4/3] overflow-hidden bg-gray-50 shrink-0">
        {hasRealImage ? (
          <>
            {/* Skeleton shown while loading */}
            {!imgLoaded && (
              <div className="absolute inset-0 skeleton-shimmer" />
            )}
            <Image
              src={src}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-contain p-2 sm:p-3 group-hover:scale-[1.06] transition-transform duration-500 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={handleError}
            />
          </>
        ) : (
          <ImagePlaceholder />
        )}

        {/* Wishlist button — top right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isClient) toggleItem(product);
          }}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            inWishlist
              ? 'bg-red-50 text-red-500'
              : 'bg-white/80 text-gray-400 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          } hover:scale-110 active:scale-95`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Category label — bottom left pill */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-10">
          <span className="inline-block bg-white/90 backdrop-blur-sm text-primary text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-sm">
            {product.category.split(' ').slice(0, 3).join(' ')}
          </span>
        </div>
      </div>

      {/* ── Content Zone ── */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-1.5 sm:gap-2">

        {/* Product name — 2 line clamp, never clips mid-word */}
        <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200 min-h-[2rem] sm:min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Model code — show primary size label as identifier */}
        {product.sizes && product.sizes.length > 0 && product.sizes[0].label && (
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">
            {product.sizes[0].label.split('(')[0].trim()}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through font-medium">
              ₹{product.mrp.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Features — up to 2 lines, muted */}
        {product.features && product.features.length > 0 && (
          <p className="text-[9px] sm:text-[11px] text-gray-400 font-medium leading-relaxed line-clamp-2">
            {product.features.slice(0, 2).join(' · ')}
          </p>
        )}

        {/* Spacer pushes chips + CTA to bottom */}
        <div className="flex-1" />

        {/* Variant chips — hidden at rest, revealed on hover/focus */}
        {variantChips.length > 0 && (
          <div className="variant-reveal">
            <div className="flex flex-wrap gap-1 pt-1.5 border-t border-gray-50">
              {variantChips.map((chip, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-gray-500 bg-gray-100 rounded-md uppercase tracking-wide"
                >
                  {chip}
                </span>
              ))}
              {(product.sizes?.length || 0) > 4 && (
                <span className="px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-primary bg-sky-50 rounded-md">
                  +{(product.sizes?.length || 0) - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-0.5">
          <span className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            View Details
          </span>
          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/5 group-hover:bg-primary flex items-center justify-center transition-all duration-200">
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary group-hover:text-white transition-colors duration-200 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
