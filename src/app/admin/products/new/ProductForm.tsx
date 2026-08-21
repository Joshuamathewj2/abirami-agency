'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createProductAction, updateProductAction } from '@/app/actions/productActions';
import { Product } from '@/types';

const COLORS = [
  'Silky Off White',
  'Alpine Blue',
  'Moon Ivory',
  'Magenta',
  'Chrome',
  'Gold/Emerald'
];

const CATEGORIES = [
  'Water Closet',
  'Bathroom Basin',
  'Pedestals',
  'Urinals',
  'Taps',
  'Showers',
  'Allied Products'
];

export default function ProductForm({ initialProduct }: { initialProduct?: Product }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract initial values for edit mode
  const initialSku = initialProduct?.specifications?.['Model / SKU Number'] || '';
  const initialSubCategory = initialProduct?.subCategory || '';
  const initialCapacity = initialProduct?.specifications?.['Capacity'] || '';
  const initialDimensions = initialProduct?.specifications?.['Dimensions'] || '';
  const initialCatalogPage = initialProduct?.specifications?.['Catalog Page Reference'] || '';
  
  const baseVariant = initialProduct?.sizes?.find(s => s.label === 'Standard White');
  const initialBasePrice = baseVariant ? baseVariant.price : (initialProduct?.price || '');
  
  const colorVariantsList = initialProduct?.sizes?.filter(s => s.label !== 'Standard White') || [];
  const initialColorPrice = colorVariantsList.length > 0 ? colorVariantsList[0].price : '';
  const initialSelectedColors = colorVariantsList.map(s => s.label);

  // Form State
  const [selectedColors, setSelectedColors] = useState<string[]>(initialSelectedColors);
  const [existingImages, setExistingImages] = useState<string[]>(initialProduct?.images || []);
  const [images, setImages] = useState<File[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const pastedFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
        if (pastedFiles.length > 0) {
          e.preventDefault();
          setImages(prev => [...prev, ...pastedFiles]);
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);
  
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(prev => prev - 1);
    }
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    const totalIndex = existingImages.length + index;
    if (primaryImageIndex === totalIndex) {
      setPrimaryImageIndex(0);
    } else if (primaryImageIndex > totalIndex) {
      setPrimaryImageIndex(prev => prev - 1);
    }
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      images.forEach(img => formData.append('images', img));
      formData.append('primaryImageIndex', primaryImageIndex.toString());
      formData.append('existingImages', JSON.stringify(existingImages.map((url, idx) => ({ url, isPrimary: idx === primaryImageIndex }))));
      formData.append('selectedColors', JSON.stringify(selectedColors));
      
      if (initialProduct) {
        await updateProductAction(initialProduct.id, formData);
      } else {
        await createProductAction(formData);
      }
      
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Basic Info Section */}
      <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-50 text-primary flex items-center justify-center text-sm">1</span>
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Product Name</label>
            <input 
              required 
              type="text" 
              name="name"
              defaultValue={initialProduct?.name}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="e.g. Virtic, Economy, Single Lever Basin Mixer" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Model / SKU Number</label>
            <input 
              required 
              type="text" 
              name="sku"
              defaultValue={initialSku}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="e.g. E8320, E8090, T4665A1" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
            <select 
              name="category" 
              defaultValue={initialProduct?.category || 'Water Closet & Sanitaryware'} 
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Subcategory</label>
            <input 
              required
              type="text" 
              name="subCategory"
              defaultValue={initialSubCategory}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="e.g. One Piece WC, Wall Hung Basin, Pillar Cock" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
            <textarea 
              rows={3} 
              name="description"
              defaultValue={initialProduct?.description}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none" 
              placeholder="Brief description of the product and its features..."
            ></textarea>
          </div>
        </div>
      </section>

      {/* 2. Pricing & Color Variants Section */}
      <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-50 text-primary flex items-center justify-center text-sm">2</span>
          Pricing & Colors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Base Price (Standard White) (₹)</label>
            <input 
              required
              type="number" 
              name="base_price"
              defaultValue={initialBasePrice}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="0.00" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Color Finish Price (Optional) (₹)</label>
            <input 
              type="number" 
              name="color_price"
              defaultValue={initialColorPrice}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="Defaults to Base Price if empty" 
            />
          </div>
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Available Color Finishes</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {COLORS.map(color => {
                const isSelected = selectedColors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorToggle(color)}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                      isSelected 
                        ? 'border-primary bg-sky-50 text-primary shadow-sm' 
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Specifications Section */}
      <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-50 text-primary flex items-center justify-center text-sm">3</span>
          Product Specifications
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Capacity</label>
            <input 
              type="text" 
              name="capacity"
              defaultValue={initialCapacity}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="e.g. 6L/3L, 10L, N/A" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Dimensions</label>
            <input 
              required
              type="text" 
              name="dimensions"
              defaultValue={initialDimensions}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="e.g. 690x380x750 mm" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Catalog Page Reference</label>
            <input 
              type="text" 
              name="catalog_page"
              defaultValue={initialCatalogPage}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition" 
              placeholder="e.g. Page 45" 
            />
          </div>
        </div>
      </section>

      {/* 4. Images Upload Section */}
      <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-sky-50 text-primary flex items-center justify-center text-sm">4</span>
          Product Images & Gallery
        </h3>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Product Images</label>
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <p className="text-gray-600 font-bold text-sm">Click to upload or drag & drop</p>
            <p className="text-gray-400 text-xs mt-1">PNG, JPG, WEBP accepted</p>
            <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
          </div>

          {(existingImages.length > 0 || images.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
              {existingImages.map((url, idx) => (
                <div key={`existing-${idx}`} className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all group bg-white flex items-center justify-center p-1 ${primaryImageIndex === idx ? 'border-primary shadow-md' : 'border-gray-200'}`}>
                  <img src={url} alt="Preview" className="w-full h-full object-contain" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingImage(idx); }} className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors backdrop-blur-sm shadow-sm z-10 font-bold">✕</button>
                  {primaryImageIndex === idx ? (
                    <div className="absolute bottom-0 inset-x-0 bg-primary text-white text-[9px] font-black text-center py-1 tracking-wider">PRIMARY</div>
                  ) : (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setPrimaryImageIndex(idx); }} className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] font-black text-center py-1 hover:bg-black/70 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100 lg:opacity-100 tracking-wider">SET PRIMARY</button>
                  )}
                </div>
              ))}
              {images.map((file, idx) => {
                const globalIdx = existingImages.length + idx;
                return (
                  <div key={`new-${idx}`} className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all group bg-white flex items-center justify-center p-1 ${primaryImageIndex === globalIdx ? 'border-primary shadow-md' : 'border-gray-200'}`}>
                    <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-contain" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeNewImage(idx); }} className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-red-500 hover:text-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors backdrop-blur-sm shadow-sm z-10 font-bold">✕</button>
                    {primaryImageIndex === globalIdx ? (
                      <div className="absolute bottom-0 inset-x-0 bg-primary text-white text-[9px] font-black text-center py-1 tracking-wider">PRIMARY</div>
                    ) : (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setPrimaryImageIndex(globalIdx); }} className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] font-black text-center py-1 hover:bg-black/70 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100 lg:opacity-100 tracking-wider">SET PRIMARY</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3">
        <button 
          type="button" 
          onClick={() => router.push('/admin/products')} 
          className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-sky-200 hover:shadow-sky-300 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
             <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
          )}
          {isSubmitting ? 'Saving...' : (initialProduct ? 'Update Product' : 'Save Product')}
        </button>
      </div>
    </form>
  );
}
