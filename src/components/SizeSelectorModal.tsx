'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { type Product, type Size } from '@/types';
import { useCart } from '@/context/CartContext';
import { useUserStore } from '@/store/userStore';
import { getColorName } from '@/lib/colors';

interface SizeSelectorModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  selectedColorImage?: string;
  selectedColorIndex?: number;
}

// Sizes and heights are now generated dynamically based on the product variants

export default function SizeSelectorModal({ product, isOpen, onClose, selectedColorImage, selectedColorIndex }: SizeSelectorModalProps) {
  const { addItem } = useCart();
  const { user } = useUserStore();
  const router = useRouter();
  const discount = product.discount ?? 0;

  const variants = product.sizes || [];
  
  // Parse variants to extract dim and height
  const parsedVariants = variants.map(v => {
    // Expected format: "72x30 x 6" or "72x30"
    const parts = v.dimensions.split(' x ');
    let dim = parts[0];
    let h = parts.length > 1 ? parts[1].replace(/["inch ]/g, '') : '';
    
    // Also try to handle format "72 × 30 × 6"
    if (v.dimensions.includes('×')) {
      const xParts = v.dimensions.split('×').map(s => s.trim().replace(/"/g, ''));
      if (xParts.length >= 2) {
        dim = `${xParts[0]}x${xParts[1]}`;
        h = xParts[2] || '';
      }
    }

    return { ...v, dim, h };
  });

  const availableSizes = Array.from(new Set(parsedVariants.filter(v => v.inStock !== false).map(v => v.label)));
  const productSizes = Array.from(new Set(parsedVariants.map(v => v.label))).filter(Boolean);
  const productHeights = Array.from(new Set(parsedVariants.map(v => v.h))).filter(Boolean).sort((a, b) => Number(a) - Number(b));

  const [bedSize, setBedSize] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [dimension, setDimension] = useState<string>('');
  const [customLength, setCustomLength] = useState<string>('72');
  const [customWidth, setCustomWidth] = useState<string>('36');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen && variants.length > 0) {
      setIsAdded(false);
      const availableVariants = variants.filter(v => v.inStock !== false);
      const selected = availableVariants[0] || variants[0];
      if (selected) {
        setBedSize(selected.label);
        setDimension(selected.dimensions);
      }
      setQuantity(1);
    }
  }, [isOpen]);

  // Handle Size Selection Change
  useEffect(() => {
    if (bedSize) {
      const variantsForSize = parsedVariants.filter(v => v.label === bedSize && v.inStock !== false);
      if (variantsForSize.length > 0) {
        // Try to keep same height if available
        const hasSameHeight = variantsForSize.some(v => v.h === height);
        const newHeight = hasSameHeight ? height : variantsForSize[0].h;
        setHeight(newHeight);
        
        // Try to keep same dimension if available
        const variantsForHeight = variantsForSize.filter(v => v.h === newHeight);
        const hasSameDim = variantsForHeight.some(v => v.dim === dimension);
        if (!hasSameDim && variantsForHeight.length > 0) {
          setDimension(variantsForHeight[0].dim);
        }
      }
    }
  }, [bedSize]);

  // Handle Height Selection Change
  useEffect(() => {
    if (bedSize && height) {
      const variantsForHeight = parsedVariants.filter(v => v.label === bedSize && v.h === height && v.inStock !== false);
      if (variantsForHeight.length > 0) {
        const hasSameDim = variantsForHeight.some(v => v.dim === dimension);
        if (!hasSameDim) {
          setDimension(variantsForHeight[0].dim);
        }
      }
    }
  }, [height]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // Compute available heights for selected size
  const variantsForSize = parsedVariants.filter(v => v.label === bedSize && v.inStock !== false);
  const availableHeightsForSize = Array.from(new Set(variantsForSize.map(v => v.h))).filter(Boolean);
  
  // Compute available dimensions for selected size & height
  const variantsForSizeAndHeight = variantsForSize.filter(v => v.h === height);
  const availableDims = Array.from(new Set(variantsForSizeAndHeight.map(v => v.dim))).filter(Boolean);

  let selectedVariant = parsedVariants.find(v => v.label === bedSize && v.h === height && v.dim === dimension);

  if (bedSize === 'Custom Size' && height) {
    const cl = Number(customLength) || 72;
    const cw = Number(customWidth) || 36;
    const calculatedPrice = 0;
    const calculatedOriginal = 0;

    selectedVariant = {
      id: `custom_${cl}x${cw}x${height}`,
      label: 'Custom Size',
      dimensions: `${cl}x${cw} x ${height}`,
      price: calculatedPrice,
      mrp: calculatedOriginal,
      inStock: true,
      dim: `${cl}x${cw}`,
      h: height
    } as any;
  }

  const discountedPrice = selectedVariant ? selectedVariant.price * quantity : 0;
  let mrpPrice = 0;
  let dynamicDiscount = 0;
  if (selectedVariant) {
    if (selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price) {
      mrpPrice = selectedVariant.mrp * quantity;
      dynamicDiscount = Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100);
    } else {
      mrpPrice = selectedVariant.price * quantity;
    }
  }

  const handleAddToCart = () => {
    if (!selectedVariant || isAddingToCart || isBuyingNow) return;
    setIsAddingToCart(true);
    
    const productToAdd = selectedColorImage ? { ...product, thumbnail: selectedColorImage } : product;
    const variantToAdd = { ...selectedVariant };
    if (selectedColorIndex) {
      variantToAdd.id = `${variantToAdd.id}_color_${selectedColorIndex}`;
      variantToAdd.label = `${variantToAdd.label} (${getColorName(selectedColorIndex)})`;
    }

    setTimeout(() => {
      addItem(productToAdd, variantToAdd as Size, quantity);
      setIsAdded(true);
      setIsAddingToCart(false);
    }, 600);
  };

  const handleBuyNow = () => {
    if (!selectedVariant || isAddingToCart || isBuyingNow) return;
    setIsBuyingNow(true);
    
    const productToAdd = selectedColorImage ? { ...product, thumbnail: selectedColorImage } : product;
    const variantToAdd = { ...selectedVariant };
    if (selectedColorIndex) {
      variantToAdd.id = `${variantToAdd.id}_color_${selectedColorIndex}`;
      variantToAdd.label = `${variantToAdd.label} (${getColorName(selectedColorIndex)})`;
    }

    setTimeout(() => {
      addItem(productToAdd, variantToAdd as Size, quantity);
      router.push(user ? '/cart' : '/login?redirect=/cart');
    }, 600);
  };

  if (isAdded && selectedVariant) {
    return (
      <div
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={handleBackdropClick}
      >
        <div style={{ backgroundColor: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '32px', position: 'relative', textAlign: 'center' }} className="shadow-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">Added to Cart!</h3>
          <p className="text-gray-500 font-medium mb-6">
            <span className="font-bold text-gray-800">{quantity}x</span> {product.name} ({selectedVariant.label}, {selectedVariant.dimensions}) has been successfully added to your cart.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { router.push(user ? '/cart' : '/login?redirect=/cart'); }}
              className="w-full bg-primary hover:bg-primary-dark text-white shadow-lg shadow-sky-200 font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95"
            >
              View Cart &amp; Checkout
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 px-4 rounded-xl transition-all active:scale-95"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find which sizes and heights actually exist across the whole product
  const productHasSize = (s: string) => s === 'Custom Size' || parsedVariants.some(v => v.label === s && v.inStock !== false);
  const productHasHeightForSize = (h: string) => bedSize === 'Custom Size' ? true : variantsForSize.some(v => v.h === h);

  // Use dynamic arrays for the UI if we don't want to show literally everything, 
  // but user requested to list all options and dim unavailable ones.
  // We'll show all ALL_SIZES and ALL_HEIGHTS but dim the ones not available.

  return (
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={handleBackdropClick}
    >
      <div 
        style={{ backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '92vh', overflowY: 'auto', position: 'relative' }}
        className="shadow-2xl scrollbar-hide p-5 sm:p-6 mx-4"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="space-y-6 pt-2">
          
          {/* Size Section */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">Size</label>
            <div className="flex flex-wrap gap-2">
              {productSizes.map((s) => {
                const isAvailable = productHasSize(s);
                return (
                  <button
                    key={s}
                    disabled={!isAvailable}
                    onClick={() => setBedSize(s)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all flex-grow sm:flex-grow-0 text-center
                      ${bedSize === s 
                        ? 'border-primary text-primary bg-white' 
                        : isAvailable 
                          ? 'border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100' 
                          : 'border-transparent bg-gray-50 text-gray-300 opacity-60 cursor-not-allowed'
                      }
                    `}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Height Section */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-3">Height (inch)</label>
            <div className="flex flex-wrap gap-2">
              {productHeights.map((h) => {
                const isAvailable = productHasHeightForSize(h);
                return (
                  <button
                    key={h}
                    disabled={!isAvailable}
                    onClick={() => setHeight(h)}
                    className={`px-6 sm:px-8 py-2 text-sm font-medium rounded-lg border transition-all flex-grow sm:flex-grow-0 text-center
                      ${height === h 
                        ? 'border-primary text-primary bg-white' 
                        : isAvailable 
                          ? 'border-transparent bg-gray-50 text-gray-700 hover:bg-gray-100' 
                          : 'border-transparent bg-gray-50 text-gray-300 opacity-60 cursor-not-allowed'
                      }
                    `}
                  >
                    {h}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dimension and Quantity Section */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-800 mb-3">Dimension (inch)</label>
              {bedSize === 'Custom Size' ? (
                <div className="flex gap-2">
                  <div className="flex-1 relative bg-gray-50 rounded-lg border border-gray-200">
                    <span className="absolute text-[10px] text-gray-400 top-1.5 left-3 uppercase font-bold tracking-wider">Length</span>
                    <input type="number" value={customLength} onChange={e => setCustomLength(e.target.value)} className="w-full bg-transparent border-none px-3 pt-6 pb-2 text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-primary rounded-lg" />
                  </div>
                  <div className="flex items-center text-gray-400 font-bold text-lg">×</div>
                  <div className="flex-1 relative bg-gray-50 rounded-lg border border-gray-200">
                    <span className="absolute text-[10px] text-gray-400 top-1.5 left-3 uppercase font-bold tracking-wider">Width</span>
                    <input type="number" value={customWidth} onChange={e => setCustomWidth(e.target.value)} className="w-full bg-transparent border-none px-3 pt-6 pb-2 text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-primary rounded-lg" />
                  </div>
                </div>
              ) : (
              <div className="relative">
                <select
                  value={dimension}
                  onChange={(e) => setDimension(e.target.value)}
                  disabled={availableDims.length === 0}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                >
                  {availableDims.length > 0 ? (
                    availableDims.map(dim => (
                      <option key={dim} value={dim}>{dim}</option>
                    ))
                  ) : (
                    <option value="">Not Available</option>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              )}
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-sm font-bold text-gray-800 mb-3">Quantity</label>
              <div className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-2 border border-gray-100">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <span className="font-semibold text-gray-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(10, q + 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing and Action Buttons */}
          <div className="pt-4 border-t border-gray-100">
            <div className="mb-4">
              <div className="flex flex-wrap items-end gap-2">
                <span className="text-xl sm:text-2xl font-black text-gray-900">
                  {bedSize === 'Custom Size' ? (
                    "Custom Price Will be Discussed By Admin"
                  ) : (
                    `₹${discountedPrice.toLocaleString('en-IN')}.00`
                  )}
                </span>
                {dynamicDiscount > 0 && (
                  <div className="flex gap-2 items-center mb-0.5">
                    <span className="text-xs sm:text-sm font-semibold text-gray-400 line-through">MRP ₹{mrpPrice.toLocaleString('en-IN')}.00</span>
                    <span className="text-xs sm:text-sm font-semibold text-primary">({dynamicDiscount}% Off)</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">(Inclusive of all Taxes)</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || isAddingToCart || isBuyingNow}
                className="w-full sm:flex-1 bg-white border border-primary text-primary hover:bg-sky-50 font-bold py-3.5 px-4 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingToCart ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding...
                  </>
                ) : 'Add To Cart'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!selectedVariant || isAddingToCart || isBuyingNow}
                className="w-full sm:flex-1 bg-primary hover:bg-primary-dark text-white shadow-md shadow-sky-200 font-bold py-3.5 px-4 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isBuyingNow ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : 'Buy Now'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
