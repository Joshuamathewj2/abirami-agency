export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  subCategory: string;
  price: number;
  mrp?: number;
  discount?: number;
  images: string[];
  thumbnail: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  sizes: Size[];
  materials: string[];
  features: string[];
  specifications: Record<string, string>;
  badge?: 'Hot Deal' | 'New' | 'Bestseller' | null;
  badgeColor?: 'red' | 'green' | 'blue' | 'yellow';
}

export interface Size {
  id: string;
  label: string;
  dimensions: string;
  price: number;
  mrp?: number;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  selectedSize: Size;
  quantity: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Order[];
  topProducts: Product[];
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  shippingAddress: string;
}