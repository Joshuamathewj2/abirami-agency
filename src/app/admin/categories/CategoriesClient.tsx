'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { createCategoryAction, deleteCategoryAction, seedCategoriesAction } from '@/app/actions/categoryActions';

export default function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const refreshCategories = async () => {
    const { data, error } = await supabase.from('materials').select('*').order('name', { ascending: true });
    if (error) {
      setErrorMsg(error.message);
    } else if (data) {
      setCategories(data);
    }
  };

  // Sync on mount
  useEffect(() => {
    refreshCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Category name is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await createCategoryAction(name);

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to create category');
        return;
      }

      setName('');
      setSuccessMsg(`✓ Category "${name.trim()}" created successfully!`);
      await refreshCategories();
    } catch (error: any) {
      setErrorMsg('Error creating category: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (confirm(`Are you sure you want to delete the category "${catName}"?`)) {
      setSuccessMsg('');
      setErrorMsg('');
      try {
        const res = await deleteCategoryAction(id);
        if (res && !res.success) {
          setErrorMsg(res.error || 'Failed to delete category');
          return;
        }
        setSuccessMsg(`✓ Category "${catName}" deleted successfully!`);
        await refreshCategories();
      } catch (err: any) {
        setErrorMsg('Error deleting: ' + err.message);
      }
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await seedCategoriesAction();
      if (res.success) {
        setSuccessMsg('✓ Successfully synced default categories into database!');
        await refreshCategories();
      } else {
        setErrorMsg(res.error || 'Failed to sync categories.');
      }
    } catch (err: any) {
      setErrorMsg('Sync error: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 -mt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
            Category Management
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Manage your product categories. Changes sync instantly to storefront search, dropdowns, and POS tools.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.length === 0 && (
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {isSeeding ? 'Syncing...' : 'Sync Default Categories'}
            </button>
          )}
          <button
            onClick={refreshCategories}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm font-semibold text-blue-700 flex justify-between items-center flex-wrap gap-2">
        <span>
          Changes to categories immediately reflect on the customer storefront mega-menu, search filters, and catalog sidebar.
        </span>
        {categories.length > 0 && (
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="text-xs bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            Sync / Seed Defaults
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            + Add New Category
          </h2>

          {/* Success/Error Banners */}
          {successMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Category Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none"
                placeholder="e.g. Health Faucet, Table Top Basin"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Creating Category...' : '+ Save & Create Category'}
            </button>
          </form>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm flex flex-col max-h-[800px]">
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center justify-between">
              All Categories ({filteredCategories.length})
            </h2>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search categories by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {filteredCategories.length > 0 ? filteredCategories.map(category => (
              <div key={category.id} className="bg-[#FAF9F6] border border-[#F2EFE9] rounded-2xl p-4 flex justify-between items-center hover:border-sky-100 transition-colors">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm">{category.name}</h3>
                  <p className="text-[10px] font-semibold text-gray-400 mt-1">
                    ID: {category.id}
                  </p>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="text-[10px] font-extrabold text-red-500 hover:text-red-700 uppercase focus:outline-none"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm font-bold mb-4">No categories found in database.</p>
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                >
                  {isSeeding ? 'Syncing...' : 'Sync / Seed Default Categories'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
