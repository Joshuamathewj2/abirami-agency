import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import { getProductsFromDB } from "@/lib/db";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Shop Sanitaryware & Bath Fittings | Abirami Agency",
  description: "Browse our wide collection of WCs, wash basins, faucets, showers, and bathroom accessories. Wholesale prices with home delivery in Chennai.",
  openGraph: {
    title: "Shop Sanitaryware & Bath Fittings | Abirami Agency",
    description: "Browse our wide collection of WCs, wash basins, faucets, showers, and bathroom accessories.",
  },
};

interface CategoryGroup {
  id: string;
  name: string;
  categoryFilterKey: string;
  keywords: string[];
}

const FAUCET_KEYWORDS = ["faucet", "claret", "jade", "shower", "health", "trap", "hose", "coupling", "concealed", "angle", "valve"];

const SANITARYWARE_GROUPS: CategoryGroup[] = [
  { id: "one-piece-wc", name: "One Piece WC", categoryFilterKey: "One Piece WC", keywords: ["one piece wc"] },
  { id: "wall-hung-wc", name: "Wall Hung WC", categoryFilterKey: "Wall Hung WC", keywords: ["wall hung wc", "dual flush cistern"] },
  { id: "coupled-closets", name: "Coupled Closets", categoryFilterKey: "Floor Mounted Coupled Closet", keywords: ["coupled closet"] },
  { id: "ewc", name: "Floor Mounted EWC", categoryFilterKey: "Floor Mounted WC (EWC)", keywords: ["floor mounted wc", "ewc"] },
  { id: "squatting-pans", name: "Squatting Pan / EWC", categoryFilterKey: "Squatting Pan", keywords: ["squatting pan", "squatting", "ewc"] },
  { id: "washbasin", name: "Washbasin", categoryFilterKey: "Wall Hung Basin", keywords: ["basin", "washbasin", "counter", "pedestal"] },
  { id: "wall-hung-basins", name: "Wall Hung Basin", categoryFilterKey: "Wall Hung Basin", keywords: ["wall hung basin"] },
  { id: "counter-pedestal-basin", name: "Counter / Pedestal Basin", categoryFilterKey: "Wall Hung Basin", keywords: ["basin", "pedestal", "counter"] },
  { id: "polymer-cistern-dual-flush", name: "Polymer Cistern (Dual Flush)", categoryFilterKey: "Polymer Cistern Dual Flush", keywords: ["polymer cistern dual flush", "dual flush", "cistern"] },
  { id: "polymer-cistern-single-flush", name: "Polymer Cistern (Single Flush)", categoryFilterKey: "Polymer Cistern Single Flush", keywords: ["polymer cistern single flush", "single flush"] },
  { id: "flush-tanks", name: "Flush Tanks", categoryFilterKey: "Polymer Cistern Dual Flush", keywords: ["flush tank", "cistern", "flush"] },
  { id: "urinals", name: "Urinals", categoryFilterKey: "Urinals", keywords: ["urinal"] },
];

const FAUCETS_GROUPS: CategoryGroup[] = [
  { id: "claret-collection", name: "Claret Collection", categoryFilterKey: "Faucets — Claret Collection > Basin", keywords: ["claret"] },
  { id: "jade-collection", name: "Jade Collection", categoryFilterKey: "Faucets — Jade Collection > Basin", keywords: ["jade"] },
  { id: "angle-valve", name: "Angle Valve", categoryFilterKey: "Concealed Bodies", keywords: ["angle", "valve", "concealed"] },
  { id: "concealed-bodies", name: "Concealed Bodies", categoryFilterKey: "Concealed Bodies", keywords: ["concealed"] },
  { id: "hand-showers", name: "Hand Shower", categoryFilterKey: "Hand Showers Collection", keywords: ["hand shower", "shower"] },
  { id: "health-faucets", name: "Health Faucet", categoryFilterKey: "Health Faucet Collection", keywords: ["health faucet", "health"] },
  { id: "bottle-traps", name: "Bottle Traps", categoryFilterKey: "Bottle Traps", keywords: ["bottle trap"] },
  { id: "connection-hose", name: "Connection Hose", categoryFilterKey: "Connection Hose", keywords: ["connection hose"] },
  { id: "waste-coupling", name: "Waste Coupling", categoryFilterKey: "Waste Coupling", keywords: ["waste coupling"] },
];

function isFaucetCategory(categoryStr: string): boolean {
  const cat = categoryStr.toLowerCase();
  return FAUCET_KEYWORDS.some(k => cat.includes(k));
}

function matchesGroup(categoryStr: string, group: CategoryGroup): boolean {
  const cat = categoryStr.toLowerCase();
  return group.keywords.some(k => cat.includes(k));
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categoryFilter = typeof params.category === "string" ? params.category : null;
  const materialFilter = typeof params.material === "string" ? params.material : null;
  const sort = typeof params.sort === "string" ? params.sort : "featured";
  const searchQuery = typeof params.search === "string" ? params.search : null;

  const dbProducts = await getProductsFromDB();
  const allProducts = dbProducts.filter((p) => p.sizes && p.sizes.length > 0);

  // Context Mode: Sanitaryware vs Faucets & Fittings
  const isFaucetsMode = Boolean(categoryFilter && isFaucetCategory(categoryFilter));
  const activeGroups = isFaucetsMode ? FAUCETS_GROUPS : SANITARYWARE_GROUPS;

  // Contextual base products
  const contextProducts = allProducts.filter(p => isFaucetCategory(p.category) === isFaucetsMode);

  let filtered = [...contextProducts];

  if (searchQuery) {
    filtered = filtered.filter(
      (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (categoryFilter) {
    const matchedGroup = activeGroups.find(g => 
      categoryFilter.toLowerCase() === g.id.toLowerCase() ||
      categoryFilter.toLowerCase() === g.name.toLowerCase() ||
      categoryFilter.toLowerCase() === g.categoryFilterKey.toLowerCase()
    );

    if (matchedGroup) {
      filtered = filtered.filter(p => matchesGroup(p.category, matchedGroup));
    } else {
      filtered = filtered.filter(p => p.category.toLowerCase().includes(categoryFilter.toLowerCase()));
    }
  }

  if (materialFilter) {
    filtered = filtered.filter(
      (p) =>
        p.materials?.some(
          (m) => m.toLowerCase().includes(materialFilter.toLowerCase())
        ) || p.category.toLowerCase().includes(materialFilter.toLowerCase())
    );
  }

  switch (sort) {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      filtered.sort((a, b) => (b.id > a.id ? 1 : -1));
      break;
    default:
      break;
  }

  // Dynamic Catalog Header Title
  let catalogTitle = isFaucetsMode ? "Faucets & Fittings Catalog" : "Sanitaryware & Bath Catalog";
  if (categoryFilter) {
    const activeGroup = activeGroups.find(g => 
      categoryFilter.toLowerCase().includes(g.id) ||
      categoryFilter.toLowerCase().includes(g.name.toLowerCase()) ||
      g.keywords.some(k => categoryFilter.toLowerCase().includes(k))
    );
    if (activeGroup) {
      catalogTitle = `${activeGroup.name} Catalog`;
    } else {
      catalogTitle = `${categoryFilter} Catalog`;
    }
  } else if (searchQuery) {
    catalogTitle = `Search Results for "${searchQuery}"`;
  }

  // Calculate clean aggregated counts per group
  const groupCounts = activeGroups.map(group => ({
    ...group,
    count: contextProducts.filter(p => matchesGroup(p.category, group)).length,
  }));

  const allContextUrl = isFaucetsMode 
    ? "/products?category=Faucets%20%E2%80%94%20Claret%20Collection" 
    : "/products";

  return (
    <div>
      <div className="bg-[#fcfcfc] border-b border-gray-100 pt-8 pb-6 md:pt-10 md:pb-8">
        <div className="container-main">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{catalogTitle}</h1>
              <p className="text-gray-500 font-medium mt-2">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-sm font-semibold text-gray-700">
                Sort by:
              </label>
              <SortSelect currentSort={sort} />
            </div>
          </div>
        </div>
      </div>

      <div className="container-main py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-28 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm tracking-wide uppercase">
                  {isFaucetsMode ? "Faucets & Fittings" : "Sanitaryware"}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-primary">
                  {isFaucetsMode ? "Faucets Mode" : "Sanitaryware Mode"}
                </span>
              </div>

              <div className="mb-2 max-h-[520px] overflow-y-auto pr-1 space-y-1">
                <Link
                  href={allContextUrl}
                  className={`flex items-center justify-between text-xs font-bold py-2.5 px-3 rounded-lg transition-colors ${
                    !categoryFilter
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-sky-50 hover:text-primary"
                  }`}
                >
                  <span>{isFaucetsMode ? "All Faucets & Fittings" : "All Sanitaryware"}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${!categoryFilter ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {contextProducts.length}
                  </span>
                </Link>

                {groupCounts.map((group) => {
                  const isSelected = Boolean(
                    categoryFilter &&
                      (categoryFilter.toLowerCase() === group.id.toLowerCase() ||
                        categoryFilter.toLowerCase() === group.name.toLowerCase())
                  );

                  return (
                    <Link
                      key={group.id}
                      href={`/products?category=${encodeURIComponent(group.id)}`}
                      className={`flex items-center justify-between text-xs font-semibold py-2.5 px-3 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-700 hover:bg-sky-50 hover:text-primary"
                      }`}
                    >
                      <span className="truncate max-w-[170px]">{group.name}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {group.count}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Mode switch link at bottom */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Link
                  href={isFaucetsMode ? "/products" : "/products?category=Faucets%20%E2%80%94%20Claret%20Collection"}
                  className="block text-center text-xs font-bold text-sky-600 hover:text-primary py-2 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors"
                >
                  Switch to {isFaucetsMode ? "Sanitaryware Categories →" : "Faucets & Fittings →"}
                </Link>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try selecting another category</p>
                <Link
                  href={allContextUrl}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition-colors text-xs"
                >
                  Show All {isFaucetsMode ? "Faucets & Fittings" : "Sanitaryware"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
