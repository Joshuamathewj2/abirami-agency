import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Abirami Agency | Parryware Sanitaryware & Bathroom Fittings Dealers in Chennai",
    template: "%s | Abirami Agency - Parryware Sanitaryware",
  },
  description:
    "Authorised Parryware wholesaler in Chennai. Premium WCs, wash basins, faucets, and showers at wholesale prices with fast delivery across Tamil Nadu.",
  keywords: [
    "Parryware dealers in Chennai",
    "Sanitaryware wholesale dealer Chennai",
    "Bathroom fittings in Madhavaram",
    "Wash basin dealers in Chennai",
    "Faucet and tap shop in Chennai",
    "Parryware showroom near me",
    "Best sanitaryware shop in Chennai",
  ],
  openGraph: {
    title: "Abirami Agency | Parryware Sanitaryware & Bathroom Fittings Dealers in Chennai",
    description: "Authorised Parryware wholesaler in Chennai. Premium WCs, wash basins, faucets, and showers at wholesale prices.",
    siteName: "Abirami Agency - Parryware Sanitaryware",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Abirami Agency | Parryware Sanitaryware & Bath Fittings Wholesaler",
    description: "Authorised Parryware wholesaler in Chennai. Premium sanitaryware and fittings at wholesale prices.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["Organization", "LocalBusiness"],
              "name": "Abirami Agency - Parryware Sanitaryware",
              "description": "Authorised Parryware wholesaler in Chennai offering premium sanitaryware and bathroom fittings at wholesale prices with immediate delivery.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Chennai",
                "addressRegion": "Tamil Nadu",
                "addressCountry": "IN"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Abirami Agency - Parryware Sanitaryware",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "/products?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
