import { getAdminOverviewStats } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const stats = await getAdminOverviewStats();

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Abirami Agency — Parryware Admin
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Enterprise overview, catalogs, category banner management, and wholesale inquiries.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            + Add Product
          </Link>
          <Link
            href="/admin/categories"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            Manage Categories
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Active Products */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Total Active Products
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {stats.totalActiveProducts}
            </span>
            <span className="block text-xs text-gray-500 font-medium mt-1">
              Active in catalog
            </span>
          </div>
        </div>

        {/* Wholesale Inquiries */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Wholesale Inquiries
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {stats.wholesaleInquiries}
            </span>
            <span className="block text-xs text-gray-500 font-medium mt-1">
              Total requests submitted
            </span>
          </div>
        </div>

        {/* Categories Count */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Categories Count
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-gray-900 tracking-tight">
              {stats.categoryCount}
            </span>
            <span className="block text-xs text-gray-500 font-medium mt-1">
              Mega menu sections
            </span>
          </div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Pending Quotes
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-primary group-hover:bg-primary group-hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-gray-900 tracking-tight text-red-600">
              {stats.pendingQuotes}
            </span>
            <span className="block text-xs text-gray-500 font-medium mt-1">
              Quotes awaiting action
            </span>
          </div>
        </div>
      </div>

      {/* Quick Access panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Admin Control Center</h2>
          <p className="text-xs text-gray-500">
            Welcome to the new Parryware Admin Panel. From here you can manage your catalogs, respond to customer inquiries, and update category details instantly. Use the sidebar to navigate the different modules.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-sky-50 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-800">Quotes & Inquiries</span>
                <span className="block text-[10px] text-gray-400 font-medium">Respond to wholesale buyers</span>
              </div>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-sky-50 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                </svg>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-800">Inventory Catalog</span>
                <span className="block text-[10px] text-gray-400 font-medium">Manage pricing and variants</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-gray-900">POS & WhatsApp Integration</h2>
            <p className="text-xs text-gray-500">
              Integrate with walk-in POS billing and check incoming WhatsApp inquiry chats instantly.
            </p>
          </div>
          <div className="space-y-2 pt-4">
            <Link
              href="/admin/billing"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              Open POS Billing
            </Link>
            <Link
              href="/admin/whatsapp"
              className="w-full py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              Open WhatsApp Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
