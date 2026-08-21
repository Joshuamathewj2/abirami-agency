import Link from 'next/link';
import { Metadata } from 'next';
import ProductCard from '@/components/ProductCard';
import ProductDetailClient from '@/components/ProductDetailClient';
import { getProductsFromDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProductsFromDB();
  const product = products.find(p => p.slug === slug);
  if (!product) return { title: 'Product Not Found - Abirami Agency' };
  
  const title = `${product.name} | Abirami Agency - Parryware Sanitaryware`;
  const description = product.shortDescription || `Buy ${product.name} at wholesale price from Abirami Agency in Chennai.`;
  const image = product.images?.[0] || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3EParryware Sanitaryware%3C/text%3E%3C/svg%3E';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getProductsFromDB();
  const product = products.find(p => p.slug === slug);
  const relatedProducts = products.length > 1 
    ? products.filter(p => p.category === product?.category && p.id !== product?.id && p.sizes && p.sizes.length > 0).slice(0, 4)
    : products.slice(0, 4);
  if (!product || !product.sizes || product.sizes.length === 0) {
    return (
      <div className="container-main py-20 text-center">
        <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist.</p>
        <Link href="/products" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.images || [],
            "description": product.shortDescription,
            "brand": {
              "@type": "Brand",
              "name": "Parryware"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://abiramiagency.in/product/${product.slug}`,
              "priceCurrency": "INR",
              "price": product.sizes?.[0]?.price || 0,
              "availability": "https://schema.org/InStock"
            }
          })
        }}
      />
      <div className="bg-white">
        <div className="container-main py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <ProductDetailClient product={product} />

      {relatedProducts.length > 0 && (
        <div className="container-main py-8 md:py-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
