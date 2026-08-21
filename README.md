# Abirami Agency — Parryware

Abirami Agency is a modern e-commerce storefront and inventory management platform built to showcase and distribute premium **Parryware** sanitaryware and bathroom fittings across Tamil Nadu.

---

## 🧠 Database & Product Architecture

The platform manages an extensive product catalog ranging from WCs and wash basins to faucets and cisterns, powered by a relational PostgreSQL database on **Supabase**.

### Core Schema Design

The inventory schema categorizes products effectively to support seamless filtering, search, and variant management:

1. **Categories** (`categories`)
   - Defines primary product groups (e.g., *One Piece WC*, *Wall Hung WC*, *Wall Hung Basins*, *Faucets*, *Urinals*, *Polymer Cisterns*).
2. **Products** (`products`)
   - Core sanitaryware models across Parryware lines.
   - Contains metadata: name, model code, description, specifications, warranty, and active status.
3. **Variants** (`variants`)
   - Manages specific product variations (finishes, colors, trap types like S-Trap/P-Trap, dimensions).
   - Tracks `price`, `stock`, `sku`, `dimensions`, and `finish`.
4. **Product Images** (`product_images`)
   - Associated with `products` for high-resolution galleries and primary image thumbnails.

### Order, Inquiry & User Management
- **Profiles**: Authenticated customer metadata, delivery addresses, and user roles.
- **Cart & Inquiries**: Allows users to add products to a cart and submit purchase inquiries or orders directly.
- **Inquiry Items**: Maps directly to selected `variant_id`s, locking in unit pricing and quantity at the time of inquiry.

---

## 🔒 Security (Row Level Security)

Database security is managed using PostgreSQL Row Level Security (RLS) policies directly within Supabase:
- **Public Read Access**: Active products, categories, variants, and product images are publicly viewable by all site visitors.
- **Private User Data**: Customers can strictly view and manage only their own `profiles`, active `cart`, and `inquiries`.

---

## 🚀 Key Features

* **Interactive Category Showcase:** Clean, modern homepage grid featuring custom hover animations.
* **Inline Product Search:** Real-time search bar integrated into the header for fast product lookups.
* **Responsive Navigation:** Streamlined navbar with quick access to cart, account settings, and contact options.
* **Fast Delivery & Trust Badging:** Built-in announcement banner showcasing regional delivery and brand authenticity.

---

## 💻 Tech Stack

* **Framework:** [Next.js](https://nextjs.org) (App Router)
* **Styling:** Tailwind CSS
* **Database & Auth:** [Supabase](https://supabase.com) (PostgreSQL + Auth + Row Level Security)
* **Icons:** Lucide Icons / Heroicons

---

## 🛠️ Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
