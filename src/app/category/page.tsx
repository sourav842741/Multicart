"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import UserProductCard from "@/component/userProductCard";
import { motion } from "framer-motion";

const categoryList = [
  { label: "all", icon: "🗂️" },
  { label: "Fashion & Lifestyle", icon: "👗" },
  { label: "Electronics & Gadgets", icon: "📱" },
  { label: "Home & Living", icon: "🏠" },
  { label: "Beauty & Personal Care", icon: "💄" },
  { label: "Toys, Kids & Baby", icon: "🧸" },
  { label: "Food & Grocery", icon: "🛒" },
  { label: "Sports & Fitness", icon: "🏀" },
  { label: "Automotive Accessories", icon: "🚗" },
  { label: "Gifts & Handcrafts", icon: "🎁" },
  { label: "Books & Stationery", icon: "📚" },
];

import Navbar from "@/component/nav";
import { AiOutlineSearch, AiOutlineShop, AiOutlineReload } from "react-icons/ai";

export default function CategoriesPage() {
  const { allVendorData } = useSelector((state: RootState) => state.vendor);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedShop, setSelectedShop] = useState("all");
  const [search, setSearch] = useState("");
  const [shopSearch, setShopSearch] = useState("");

  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);


  // ✅ URL se category read (CLIENT ONLY)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    if (cat) setSelectedCategory(cat);
    setIsReady(true);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.append("query", search);
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();

      setApiProducts(data.products || []);
      setDisplayProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    fetchProducts();
  }, [selectedCategory, search, isReady]);

  useEffect(() => {
    if (selectedShop === "all") {
      setDisplayProducts(apiProducts);
    } else {
      setDisplayProducts(
        apiProducts.filter(
          (p: any) => String(p.vendor?._id) === String(selectedShop)
        )
      );
    }
  }, [selectedShop, apiProducts]);

  const filteredShops = useMemo(() => {
    if (!shopSearch) return [];
    return allVendorData.filter((v: any) =>
      v.shopName?.toLowerCase().includes(shopSearch.toLowerCase())
    );
  }, [shopSearch, allVendorData]);

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedShop("all");
    setSearch("");
    setShopSearch("");
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 tracking-wider uppercase mb-2">
              ✦ Catalog & Discovery
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Browse by Category
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Explore authentic products from certified sellers with direct shipping
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Showing <span className="text-white font-semibold">{displayProducts.length}</span> items
            </span>
            {(selectedCategory !== "all" || selectedShop !== "all" || search) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-gray-300 transition-colors cursor-pointer"
              >
                <AiOutlineReload size={13} />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left Filter Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-5 backdrop-blur-xl space-y-5">
              {/* Product Search Input */}
              <div>
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <AiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search keywords..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
                  Categories
                </label>
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {categoryList.map((cat) => {
                    const isSelected = selectedCategory === cat.label;
                    return (
                      <button
                        key={cat.label}
                        onClick={() => {
                          setSelectedCategory(cat.label);
                          setSelectedShop("all");
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 font-semibold"
                            : "bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-base">{cat.icon}</span>
                          <span className="capitalize">{cat.label}</span>
                        </span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shop Filter */}
              <div>
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
                  Filter by Shop
                </label>
                <div className="relative">
                  <AiOutlineShop className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    placeholder="Search store name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {shopSearch && (
                  <div className="mt-2 bg-black/90 border border-white/15 rounded-xl max-h-48 overflow-y-auto divide-y divide-white/10 shadow-xl">
                    {filteredShops.length === 0 ? (
                      <p className="p-3 text-xs text-gray-400 text-center">No matching shops</p>
                    ) : (
                      filteredShops.map((v: any) => (
                        <button
                          key={v._id}
                          onClick={() => {
                            setSelectedShop(v._id);
                            setShopSearch(v.shopName);
                          }}
                          className="block w-full px-3.5 py-2.5 text-left text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        >
                          🏪 {v.shopName}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Product Grid */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="min-h-[45vh] flex flex-col items-center justify-center bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-4">
                  🔍
                </div>
                <h3 className="text-lg font-bold text-white mb-1">No products found</h3>
                <p className="text-gray-400 text-xs max-w-sm mb-6">
                  We could not find any items matching your selected criteria. Try adjusting your filters or search keywords.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  View All Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayProducts.map((product: any) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <UserProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

