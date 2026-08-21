import ProductForm from '../../new/ProductForm';
import Link from 'next/link';
import { getProductsFromDB } from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const products = await getProductsFromDB();
  const product = products.find(p => p.id === resolvedParams.id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="mb-3 flex justify-between items-end">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 font-medium mb-1 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Back
          </Link>
          <h2 className="text-xl font-bold text-gray-900">Edit Product: {product.name}</h2>
        </div>
      </div>

      <ProductForm initialProduct={product} />
    </div>
  );
}
