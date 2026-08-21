'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { type Product, type Size } from '@/types';
import SizeSelectorModal from './SizeSelectorModal';
import { getProductImagePath } from '@/lib/image-utils';

const SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="%2394a3b8" dominant-baseline="middle" text-anchor="middle">Parryware Sanitaryware</text></svg>`;

export default function ProductDetailClient({ product }: { product: Product }) {
  const mainImage = getProductImagePath(product);

  // Extract images safely
  const productImages = product.images && product.images.length > 0 && !product.images[0].includes('placehold.co') && !product.images[0].includes('data:image/svg+xml')
    ? product.images.map(img => img.startsWith('/Assets/') || img.startsWith('http') ? img : mainImage)
    : [mainImage];

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const { addItem } = useCart();
  const { isInWishlist } = useWishlist();
  
  const [isClient, setIsClient] = useState(false);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => setIsClient(true), []);

  const getImageSrc = (originalSrc: string) => {
    return imageMap[originalSrc] || originalSrc;
  };

  const handleImageError = (originalSrc: string) => {
    if (originalSrc && !imageMap[originalSrc]) {
      setImageMap(prev => ({
        ...prev,
        [originalSrc]: '/Assets/placeholder.png'
      }));
    }
  };

  const sizes = product.sizes || [];
  const [selectedVariant, setSelectedVariant] = useState<Size | null>(sizes[0] || null);

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayMrp = selectedVariant ? (selectedVariant.mrp || 0) : (product.mrp || 0);

  // If selected variant has a specific image URL or model code image, use it
  const activeImage = productImages[selectedImageIndex] || mainImage;
  const activeImageSrc = getImageSrc(activeImage);

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
                onError={() => handleImageError(activeImage)}
              />
            </div>

            {/* Thumbnails Gallery Strip */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border transition-all duration-200 ${
                      selectedImageIndex === i 
                        ? 'border-primary ring-2 ring-primary/20 opacity-100' 
                        : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={getImageSrc(img)}
                      alt={`${product.name} view ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                      onError={() => handleImageError(img)}
                    />
                  </button>
                ))}
              </div>
            )}
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
              dangerouslySetInnerHTML={{ __html: product.description }}
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

            {/* Variants / Model Codes Selector */}
            {sizes.length > 0 && (
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">
                  Select Model Code / Variant
                </label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const isSelected = selectedVariant?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedVariant(s)}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${
                          isSelected
                            ? 'border-primary bg-primary text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {s.label} ({s.dimensions})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="mb-8 p-5 bg-white rounded-2xl border border-gray-200 space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Specifications</h4>
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-none">
                    <span className="font-semibold text-gray-500">{key}</span>
                    <span className="font-bold text-gray-900">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-sky-200 text-base flex items-center justify-center gap-2 active:scale-95"
              >
                Buy Now / Add to Cart
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Size / Variant Selector Modal */}
      {modalOpen && (
        <SizeSelectorModal
          product={product}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
