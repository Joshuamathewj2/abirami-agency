'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { deleteProductAction, toggleVariantStockAction, updateVariantPriceAction, addVariantAction, deleteVariantAction } from '@/app/actions/productActions';

export default function ProductRow({ product, onDelete }: { product: Product; onDelete?: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editMrp, setEditMrp] = useState<string>('');
  
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDimension, setNewDimension] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newMrp, setNewMrp] = useState('');

  const [localVariants, setLocalVariants] = useState(product.sizes || []);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setLocalVariants(product.sizes || []);
  }, [product.sizes]);

  const handleToggleActive = async (variantId: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setLocalVariants(prev => prev.map(v => v.id === variantId ? { ...v, inStock: newActive } : v));
    try {
      await toggleVariantStockAction(product.id, variantId, currentActive);
    } catch (err) {
      setLocalVariants(prev => prev.map(v => v.id === variantId ? { ...v, inStock: currentActive } : v));
      console.error('Failed to toggle variant status:', err);
    }
  };

  const handleEditClick = (variant: any) => {
    setEditingVariantId(variant.id);
    setEditPrice(variant.price.toString());
    setEditMrp(variant.mrp ? variant.mrp.toString() : variant.price.toString());
  };

  const handleSavePrice = async (variantId: string) => {
    if (editPrice) {
      await updateVariantPriceAction(product.id, variantId, Number(editPrice), Number(editMrp) || undefined);
    }
    setEditingVariantId(null);
  };

  const handleAddVariant = async () => {
    if (!newLabel || !newDimension || !newPrice) return alert("Please fill all fields");
    const sellingPrice = Number(newPrice);
    const mrp = newMrp ? Number(newMrp) : (sellingPrice + 12);

    await addVariantAction(product.id, {
      label: newLabel,
      dimension: newDimension,
      price: sellingPrice,
      mrp: mrp
    });
    setIsAddingVariant(false);
    setNewLabel('');
    setNewDimension('');
    setNewPrice('');
    setNewMrp('');
  };

  const activeVariantsCount = localVariants.filter(s => s.inStock !== false).length || 0;

  return (
    <>
      <tr className="hover:bg-gray-50/50 transition-colors group">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="mr-3 text-gray-400 group-hover:text-primary transition-colors">
              <svg className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-lg bg-sky-100 flex items-center justify-center font-bold text-primary">
              {product.name.charAt(0)}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{product.name}</div>
              <div className="text-sm text-gray-500">Starts at ₹{product.price}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {product.category}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span className="font-medium text-gray-900">{activeVariantsCount}</span> / {localVariants.length} Active
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {activeVariantsCount > 0 ? (
            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
              Disabled
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end items-center gap-2">
            <Link 
              href={`/admin/products/${product.id}/edit`}
              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
              title="Edit Product"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Link>
            <button 
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                if (!window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;
                setIsDeleting(true);
                try {
                  await deleteProductAction(product.id);
                  onDelete?.(product.id);
                } catch (err) {
                  console.error('Delete failed:', err);
                  alert('Failed to delete product. Please try again.');
                  setIsDeleting(false);
                }
              }}
              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Product"
            >
              {isDeleting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Variants Sub-table */}
      {isExpanded && (
        <tr>
          <td colSpan={5} className="bg-gray-50/50 p-0 border-b border-gray-100">
            <div className="px-2 sm:px-14 py-4 overflow-x-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-w-[600px]">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center rounded-t-xl">
                  <h4 className="text-sm font-semibold text-gray-700">Product Variants</h4>
                  {!isAddingVariant && (
                    <button 
                      onClick={() => setIsAddingVariant(true)}
                      className="text-primary hover:text-primary-dark font-semibold text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Variant
                    </button>
                  )}
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dimension</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Selling Price (₹)</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">MRP (₹)</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isAddingVariant && (
                      <tr className="bg-sky-50/50 border-b border-sky-100">
                        <td className="px-4 py-3">
                          <input type="text" placeholder="Standard White, Chrome, etc." value={newLabel} onChange={e => setNewLabel(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" placeholder="690x380x750 mm" value={newDimension} onChange={e => setNewDimension(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" placeholder="Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" placeholder="MRP" value={newMrp} onChange={e => setNewMrp(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                        </td>
                        <td className="px-4 py-3 text-center">-</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={handleAddVariant} className="text-green-600 font-semibold text-sm hover:text-green-800">Save</button>
                            <button onClick={() => setIsAddingVariant(false)} className="text-gray-500 font-semibold text-sm hover:text-gray-700">Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {localVariants.map((variant) => (
                      <tr key={variant.id} className={variant.inStock === false ? 'opacity-50 bg-gray-50' : 'hover:bg-sky-50/30'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {variant.label}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {variant.dimensions}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {editingVariantId === variant.id ? (
                            <input 
                              type="number" 
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary focus:border-primary"
                              autoFocus
                            />
                          ) : (
                            <span className="font-semibold text-green-600">₹{variant.price}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {editingVariantId === variant.id ? (
                            <input 
                              type="number" 
                              value={editMrp}
                              onChange={(e) => setEditMrp(e.target.value)}
                              className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary focus:border-primary"
                            />
                          ) : (
                            <span className="text-gray-500 line-through">₹{variant.mrp || variant.price}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleToggleActive(variant.id, variant.inStock !== false)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${variant.inStock !== false ? 'bg-green-500' : 'bg-gray-300'}`}
                            role="switch"
                            aria-checked={variant.inStock !== false}
                          >
                            <span className="sr-only">Use setting</span>
                            <span aria-hidden="true" className="pointer-events-none absolute h-full w-full rounded-md bg-white opacity-0"></span>
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${variant.inStock !== false ? 'translate-x-2' : '-translate-x-2'}`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          {editingVariantId === variant.id ? (
                            <button 
                              onClick={() => handleSavePrice(variant.id)}
                              className="text-green-600 hover:text-green-900 font-semibold"
                            >
                              Save
                            </button>
                          ) : (
                            <div className="flex justify-end gap-3 items-center">
                              <button 
                                onClick={() => handleEditClick(variant)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit Prices
                              </button>
                              <form action={async () => {
                                if (!window.confirm(`Delete the "${variant.label}" variant? This cannot be undone.`)) return;
                                await deleteVariantAction(variant.id);
                              }}>
                                <button className="text-red-500 hover:text-red-700 p-1" title="Delete Variant">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                              </form>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
