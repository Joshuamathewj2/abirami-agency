import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Abirami Agency',
  description: 'Read the privacy policy of Abirami Agency. Learn how we collect, use, and protect your personal information.',
  alternates: {
    canonical: 'https://abiramiagency.in/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Abirami Agency',
    description: 'Read the privacy policy of Abirami Agency.',
    url: 'https://abiramiagency.in/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="container-main py-8 md:py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose max-w-none text-gray-600 space-y-4">
        <p>At Abirami Agency, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p>
        <h2 className="text-xl font-semibold text-gray-900">Information We Collect</h2>
        <p>We collect information you provide when filling forms on our website, including name, email address, phone number, and delivery address.</p>
        <h2 className="text-xl font-semibold text-gray-900">How We Use Your Information</h2>
        <p>We use your information to process orders, provide customer support, and send updates about your orders. We do not share your information with third parties except as necessary to fulfill your orders.</p>
        <h2 className="text-xl font-semibold text-gray-900">Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.</p>
        <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
        <p>For questions about this privacy policy, please contact us at karthickkarthik@gmail.com or call 86107 10434.</p>
        <Link href="/" className="text-primary hover:text-primary-dark font-semibold inline-block mt-4">Back to Home</Link>
      </div>
    </div>
  );
}
