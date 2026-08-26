'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { type Product, type Size } from '@/types';
import { useUserStore } from '@/store/userStore';
import { getProductImagePath } from '@/lib/image-utils';

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const mainImage = getProductImagePath(product);
  const { addItem } = useCart();
  const { user } = useUserStore();

  const [isClient, setIsClient] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => setIsClient(true), []);

  const sizes = product.sizes || [];
  const primaryVariant = sizes[0] || null;

  const displayPrice = primaryVariant ? primaryVariant.price : product.price;
  const displayMrp = primaryVariant ? (primaryVariant.mrp || 0) : (product.mrp || 0);

  const activeImageSrc = imgError ? '/Assets1/faucet_01.png' : mainImage;

  const cleanDescription = product.description
    ? product.description
        .replace(/available in Chrome, Gold\/Emerald, Gold\/Jade/gi, '')
        .replace(/Chrome, Gold\/Emerald, Gold\/Jade/gi, '')
        .replace(/with multiple finish variants/gi, '')
        .replace(/available in multiple finishes/gi, '')
        .trim()
    : '';

  const handleAddToCart = () => {
    if (justAdded) return;
    
    const defaultVariant = primaryVariant || {
      id: 'default',
      label: 'Standard',
      dimensions: 'Standard',
      price: product.price,
      mrp: product.mrp || product.price,
      inStock: true
    };

    addItem(product, defaultVariant as Size, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3000);
  };

  const handleBuyNow = () => {
    const defaultVariant = primaryVariant || {
      id: 'default',
      label: 'Standard',
      dimensions: 'Standard',
      price: product.price,
      mrp: product.mrp || product.price,
      inStock: true
    };

    addItem(product, defaultVariant as Size, 1);
    router.push(user ? '/cart' : '/login?redirect=/cart');
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container-main pt-4 pb-10 md:pt-6 md:pb-24">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
          
          {/* Left: Product Image Gallery */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-24 space-y-4">
            <div className="relative w-full h-[320px] sm:h-[450px] md:h-[550px] max-h-[80vh] bg-white rounded-3xl overflow-hidden group border border-gray-100 shadow-sm flex items-center justify-center p-6">
              <Image
                src={activeImageSrc}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                onError={() => setImgError(true)}
              />
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="w-full lg:w-1/2 flex flex-col justify-start max-w-2xl">
            
            {/* Category Breadcrumb */}
            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-sky-600 uppercase tracking-widest">
              <span>{product.category}</span>
              {product.subCategory && (
                <>
                  <span>/</span>
                  <span>{product.subCategory}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
              {product.name}
            </h1>

            <div 
              className="text-base md:text-lg text-gray-600 leading-relaxed mb-6 font-medium"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />

            {/* Stock Status */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`w-2.5 h-2.5 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={`text-xs font-bold uppercase tracking-wider ${product.inStock ? 'text-green-700' : 'text-red-600'}`}>
                {product.inStock ? 'In Stock — Ready for Immediate Delivery' : 'Out of Stock'}
              </span>
            </div>

            {/* Real Catalog Price */}
            <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-3xl md:text-4xl font-black text-gray-900">
                  ₹{displayPrice.toLocaleString('en-IN')}.00
                </span>
                {displayMrp > displayPrice && (
                  <span className="text-lg text-gray-400 font-semibold line-through">
                    ₹{displayMrp.toLocaleString('en-IN')}.00
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">Wholesale price in Chennai. Inclusive of all taxes.</p>
            </div>

            {/* Specifications */}
            {(() => {
              const specs = { ...(product.specifications || {}) };
              if (!specs['Model / SKU Number'] && primaryVariant?.label) {
                specs['Model / SKU Number'] = primaryVariant.label.split('(')[0].trim();
              }
              if (Object.keys(specs).length === 0) return null;
              return (
                <div className="mb-8 p-5 bg-white rounded-2xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Specifications</h4>
                  {Object.entries(specs).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-none">
                      <span className="font-semibold text-gray-500">{key}</span>
                      <span className="font-bold text-gray-900">{val}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Success Feedback banner */}
            {justAdded && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 animate-fade-in">
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Product successfully added to cart!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleAddToCart}
                className="w-full bg-white border border-primary text-primary hover:bg-sky-50 font-bold py-4 px-8 rounded-2xl transition-all shadow-md text-base flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-sky-200 text-base flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                Buy Now
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
