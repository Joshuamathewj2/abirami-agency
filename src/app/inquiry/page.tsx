'use client';

import Link from 'next/link';

export default function InquiryPage() {
  return (
    <div>
      <div className="bg-[#fcfcfc] border-b border-gray-100 py-10 md:py-14">
        <div className="container-main">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Send Inquiry</h1>
          <p className="text-gray-500 font-medium mt-2">Get wholesale pricing and bulk order quotes</p>
        </div>
      </div>

      <div className="container-main py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bulk & Wholesale Inquiries</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Looking to buy in bulk? As an authorised Parryware wholesaler, we offer the best prices for bulk sanitaryware and fitting orders. Whether you need products for apartments, commercial projects, hotels, or retail, we have you covered.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-sky-50 rounded-xl">
                <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Wholesale Pricing</h3>
                  <p className="text-sm text-gray-600">Get the best wholesale rates as an authorised dealer</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-sky-50 rounded-xl">
                <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Quick Delivery</h3>
                  <p className="text-sm text-gray-600">Immediate delivery across Tamil Nadu for all orders</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-sky-50 rounded-xl">
                <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <div>
                  <h3 className="font-semibold text-gray-900">Genuine Products</h3>
                  <p className="text-sm text-gray-600">100% genuine Parryware products with manufacturer warranty</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-primary-dark rounded-xl text-white">
              <h3 className="font-semibold text-lg mb-2">Prefer to call?</h3>
              <p className="text-gray-300 text-sm mb-3">Speak directly with Karthick for instant pricing and availability.</p>
              <a href="tel:8601710434" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                Call 86107 10434
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Inquiry Form</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" id="name" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company / Organization</label>
                  <input type="text" id="company" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Company name" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" id="email" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Your email" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" id="phone" required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Your phone" />
                </div>
              </div>
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">Product Interested In</label>
                <select id="product" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option>One Piece WC</option>
                  <option>Wall Hung WC</option>
                  <option>Coupled Closets</option>
                  <option>Wall Hung Basins</option>
                  <option>Faucets &amp; Fittings</option>
                  <option>Showers &amp; Diverters</option>
                  <option>Multiple Products / Bulk Order</option>
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity Required</label>
                <input type="number" id="quantity" min={1} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Approximate quantity" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea id="message" rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" placeholder="Tell us about your requirements" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors">
                Submit Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
