"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { RootState } from "@/redux/store";
import { setAllProductsData } from "@/redux/vendorSlice";
import getAllProductsData from "@/hooks/getAllProductsData";
import getCurrentUser from "@/hooks/getCurrentUser";
import {
  FiPlus,
  FiEdit3,
  FiSearch,
  FiEye,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiXCircle,
  FiLayers,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiTrendingUp,
} from "react-icons/fi";

export default function VendorProducts() {
  const router = useRouter();
  const dispatch = useDispatch();

  getAllProductsData();
  getCurrentUser();

  const currentUser = useSelector((state: RootState) => state.user.userData);
  const { allProductsData } = useSelector((state: RootState) => state.vendor);

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Robust Vendor Matching
  const myProducts = useMemo(() => {
    if (!currentUser || !allProductsData?.length) return [];
    const currentId = String(currentUser._id || "");
    return allProductsData.filter((product: any) => {
      const vId = String(product.vendor?._id || product.vendor || "");
      if (vId && currentId && vId === currentId) return true;
      if (
        product.vendor?.email &&
        currentUser.email &&
        product.vendor.email.toLowerCase() === currentUser.email.toLowerCase()
      )
        return true;
      if (
        product.vendor?.shopName &&
        currentUser.shopName &&
        product.vendor.shopName.trim().toLowerCase() ===
          currentUser.shopName.trim().toLowerCase()
      )
        return true;
      return false;
    });
  }, [currentUser, allProductsData]);

  // Inventory Metrics
  const metrics = useMemo(() => {
    const total = myProducts.length;
    const active = myProducts.filter((p: any) => p.isActive).length;
    const approved = myProducts.filter(
      (p: any) => p.verificationStatus === "approved"
    ).length;
    const pending = myProducts.filter(
      (p: any) => p.verificationStatus === "pending"
    ).length;
    const lowStock = myProducts.filter(
      (p: any) => (p.stock || 0) <= 5
    ).length;
    const totalStock = myProducts.reduce(
      (acc: number, p: any) => acc + (p.stock || 0),
      0
    );

    return { total, active, approved, pending, lowStock, totalStock };
  }, [myProducts]);

  // Unique categories for filter dropdown
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    myProducts.forEach((p: any) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [myProducts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return myProducts.filter((product: any) => {
      // Status Filter
      if (selectedStatus === "active" && !product.isActive) return false;
      if (selectedStatus === "inactive" && product.isActive) return false;
      if (
        selectedStatus === "approved" &&
        product.verificationStatus !== "approved"
      )
        return false;
      if (
        selectedStatus === "pending" &&
        product.verificationStatus !== "pending"
      )
        return false;

      // Category Filter
      if (
        selectedCategory !== "all" &&
        product.category !== selectedCategory
      )
        return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = String(product.title || "")
        .toLowerCase()
        .includes(q);
      const catMatch = String(product.category || "")
        .toLowerCase()
        .includes(q);
      const priceMatch = String(product.price || "").includes(q);

      return titleMatch || catMatch || priceMatch;
    });
  }, [myProducts, selectedStatus, selectedCategory, searchQuery]);

  // Toggle Active/Inactive
  const toggleProductStatus = async (
    productId: string,
    currentStatus: boolean
  ) => {
    try {
      setLoadingId(productId);
      const res = await axios.post("/api/vendor/active-product", {
        productId,
        isActive: !currentStatus,
      });

      const updatedProducts = allProductsData.map((p: any) =>
        p._id === productId ? res.data.product : p
      );
      dispatch(setAllProductsData(updatedProducts));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Status update failed ❌");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full min-h-screen text-gray-100 p-2 sm:p-6 space-y-6">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900/90 via-black to-gray-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              {currentUser?.shopName || "Vendor Catalog"}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FiCheckCircle className="text-emerald-400 w-3.5 h-3.5" />
              Verified Merchant
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Product Inventory
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your store catalog, pricing, variants, and real-time storefront visibility.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push("/add-vendor-product")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <FiPlus className="w-4 h-4 stroke-[3]" />
          <span>Add New Product</span>
        </motion.button>
      </div>

      {/* ================= INVENTORY METRICS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>Total Catalog</span>
            <FiLayers className="text-blue-400 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics.total}</p>
          <span className="text-[11px] text-gray-400 mt-1">
            Across {categoriesList.length || 1} categories
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>Live in Store</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{metrics.active}</p>
          <span className="text-[11px] text-emerald-400/80 mt-1">
            Visible to shoppers
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>Verified Status</span>
            <FiCheckCircle className="text-green-400 w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{metrics.approved}</p>
            <span className="text-xs text-green-400">Approved</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1">
            {metrics.pending > 0 ? `${metrics.pending} pending review` : "All approved"}
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
            <span>Total Stock Units</span>
            <FiTrendingUp className="text-purple-400 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {metrics.totalStock.toLocaleString("en-IN")}
          </p>
          <span className="text-[11px] text-gray-400 mt-1">
            {metrics.lowStock > 0 ? (
              <span className="text-amber-400 font-medium">⚠️ {metrics.lowStock} low stock items</span>
            ) : (
              "Healthy inventory levels"
            )}
          </span>
        </div>
      </div>

      {/* ================= CONTROLS: SEARCH, FILTERS, VIEW SWITCHER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Items", count: metrics.total },
            { id: "active", label: "Active", count: metrics.active },
            { id: "inactive", label: "Inactive", count: metrics.total - metrics.active },
            { id: "approved", label: "Approved", count: metrics.approved },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedStatus === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Category & View Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Dropdown */}
          {categoriesList.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all" className="bg-gray-900 text-white">All Categories</option>
              {categoriesList.map((c) => (
                <option key={c} value={c} className="bg-gray-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative flex-1 sm:w-60">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by title, price..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "table" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <FiList size={15} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Grid cards view"
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <FiGrid size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= PRODUCTS CONTENT ================= */}
      {filteredProducts.length === 0 ? (
        <div className="min-h-[340px] flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 mb-4">
            <FiPackage className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Products Found</h3>
          <p className="text-gray-400 text-sm max-w-sm mb-4">
            {searchQuery
              ? `No products match "${searchQuery}".`
              : selectedStatus !== "all"
              ? `No products currently match "${selectedStatus}".`
              : "You haven't listed any products yet. Click 'Add New Product' to begin selling!"}
          </p>
          {(searchQuery || selectedStatus !== "all" || selectedCategory !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("all");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product: any) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-all shadow-xl group flex flex-col justify-between"
            >
              <div>
                {/* Image & Floating Badges */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-900 border-b border-white/10">
                  <Image
                    src={product.image1}
                    alt={product.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                        product.verificationStatus === "approved"
                          ? "bg-emerald-500/80 text-white"
                          : product.verificationStatus === "pending"
                          ? "bg-amber-500/80 text-white"
                          : "bg-rose-500/80 text-white"
                      }`}
                    >
                      {product.verificationStatus}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                        product.isActive
                          ? "bg-green-600/90 text-white"
                          : "bg-red-600/90 text-white"
                      }`}
                    >
                      {product.isActive ? "Live" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    {product.category || "General"}
                  </span>
                  <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                    {product.title}
                  </h3>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xl font-extrabold text-white">
                      ₹{product.price?.toLocaleString("en-IN")}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        (product.stock || 0) <= 5
                          ? "text-amber-400"
                          : "text-gray-400"
                      }`}
                    >
                      {product.stock || 0} in stock
                    </span>
                  </div>

                  {product.sizes && product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {product.sizes.slice(0, 5).map((s: string) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300 font-medium"
                        >
                          {s}
                        </span>
                      ))}
                      {product.sizes.length > 5 && (
                        <span className="text-[10px] text-gray-400 self-center">
                          +{product.sizes.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 border-t border-white/10 flex items-center gap-2 mt-3">
                <button
                  onClick={() => router.push(`/update-product/${product._id}`)}
                  className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-xl text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiEdit3 className="w-3.5 h-3.5 text-blue-400" />
                  Edit Product
                </button>

                <button
                  onClick={() => toggleProductStatus(product._id, product.isActive)}
                  disabled={
                    product.verificationStatus !== "approved" ||
                    loadingId === product._id
                  }
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 ${
                    product.isActive
                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {loadingId === product._id ? (
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : product.isActive ? (
                    "Disable"
                  ) : (
                    "Enable"
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* ================= LUXURY DESKTOP TABLE VIEW ================= */
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-5">Product</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-4">Inventory</th>
                  <th className="py-4 px-4">Verification</th>
                  <th className="py-4 px-4 text-center">Store Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product: any) => (
                  <tr
                    key={product._id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* PRODUCT IMAGE & TITLE */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5 min-w-[240px]">
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-900 border border-white/10 flex-shrink-0 group-hover:border-blue-500/40 transition-colors">
                          <Image
                            src={product.image1}
                            alt={product.title}
                            fill
                            sizes="56px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate max-w-[280px]">
                            {product.title}
                          </h4>
                          <span className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                            ID: <span className="font-mono text-gray-500">#{product._id.slice(-6)}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY & VARIANTS */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-gray-300">
                        {product.category || "General"}
                      </span>
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          {product.sizes.length} sizes configured
                        </div>
                      )}
                    </td>

                    {/* PRICE */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-sm font-extrabold text-white">
                        ₹{product.price?.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* INVENTORY / STOCK */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            (product.stock || 0) <= 5
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {product.stock || 0} units
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {(product.stock || 0) <= 5 ? "⚠️ Low stock" : "In stock"}
                      </span>
                    </td>

                    {/* VERIFICATION STATUS */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          product.verificationStatus === "approved"
                            ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                            : product.verificationStatus === "pending"
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-rose-500/10 text-red-300 border-rose-500/30"
                        }`}
                      >
                        {product.verificationStatus === "approved" && (
                          <FiCheckCircle className="w-3.5 h-3.5" />
                        )}
                        {product.verificationStatus === "pending" && (
                          <FiClock className="w-3.5 h-3.5" />
                        )}
                        {product.verificationStatus === "rejected" && (
                          <FiXCircle className="w-3.5 h-3.5" />
                        )}
                        {product.verificationStatus}
                      </span>

                      {product.verificationStatus === "rejected" && (
                        <div className="text-[10px] text-rose-400 mt-1 max-w-[160px] truncate">
                          Reason: {product.rejectedReason || "Compliance issue"}
                        </div>
                      )}
                    </td>

                    {/* ACTIVE STORE TOGGLE */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() =>
                          toggleProductStatus(product._id, product.isActive)
                        }
                        disabled={
                          product.verificationStatus !== "approved" ||
                          loadingId === product._id
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          product.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-white/5 text-gray-400 border-white/10 hover:text-white"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            product.isActive ? "bg-emerald-400 animate-pulse" : "bg-gray-500"
                          }`}
                        />
                        {loadingId === product._id
                          ? "Updating..."
                          : product.isActive
                          ? "Live Active"
                          : "Hidden"}
                      </button>
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            router.push(`/update-product/${product._id}`)
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 hover:border-blue-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                        >
                          <FiEdit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MOBILE CARDS LIST ================= */}
      <div className="sm:hidden space-y-4">
        {filteredProducts.map((product: any) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-lg space-y-3"
          >
            <div className="flex gap-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-900 border border-white/10 flex-shrink-0">
                <Image
                  src={product.image1}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {product.category || "General"}
                </span>
                <h4 className="text-sm font-bold text-white truncate mt-1">
                  {product.title}
                </h4>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-extrabold text-white">
                    ₹{product.price?.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-gray-400">
                    {product.stock || 0} in stock
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    product.verificationStatus === "approved"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {product.verificationStatus}
                </span>

                <span
                  className={`text-[11px] font-semibold ${
                    product.isActive ? "text-emerald-400" : "text-gray-400"
                  }`}
                >
                  {product.isActive ? "● Live" : "○ Hidden"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    router.push(`/update-product/${product._id}`)
                  }
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    toggleProductStatus(product._id, product.isActive)
                  }
                  disabled={
                    product.verificationStatus !== "approved" ||
                    loadingId === product._id
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    product.isActive
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {product.isActive ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
