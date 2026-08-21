import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Abirami Agency',
  description: 'Read the terms and conditions for purchasing from Abirami Agency. Covers products, pricing, delivery, and warranty.',
  alternates: {
    canonical: 'https://abiramiagency.in/terms',
  },
  openGraph: {
    title: 'Terms of Service | Abirami Agency',
    description: 'Read the terms and conditions for purchasing from Abirami Agency.',
    url: 'https://abiramiagency.in/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="container-main py-8 md:py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
      <div className="prose max-w-none text-gray-600 space-y-4">
        <p>By using the Abirami Agency website and purchasing our products, you agree to the following terms and conditions.</p>
        <h2 className="text-xl font-semibold text-gray-900">Products & Pricing</h2>
        <p>All prices are subject to change without notice. We reserve the right to modify or discontinue products at any time. Images are for illustration purposes; actual products may vary.</p>
        <h2 className="text-xl font-semibold text-gray-900">Orders & Payment</h2>
        <p>Orders are confirmed upon payment receipt. We accept cash on delivery and online payments. Full payment is required before dispatch for online orders.</p>
        <h2 className="text-xl font-semibold text-gray-900">Delivery</h2>
        <p>We deliver across Tamil Nadu. Delivery times are estimates and not guaranteed. We are not responsible for delays beyond our control.</p>
        <h2 className="text-xl font-semibold text-gray-900">Warranty</h2>
        <p>All products come with manufacturer warranty as specified on the product page. Warranty claims must be made through the manufacturer.</p>
        <h2 className="text-xl font-semibold text-gray-900">Returns</h2>
        <p>Please inspect your order upon delivery. Any damages or defects must be reported within 48 hours of delivery.</p>
        <Link href="/" className="text-primary hover:text-primary-dark font-semibold inline-block mt-4">Back to Home</Link>
      </div>
    </div>
  );
}
