import { getProductsFromDB } from '@/lib/db';
import ProductsClient from './ProductsClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await getProductsFromDB();

  return <ProductsClient initialProducts={products} />;
}
