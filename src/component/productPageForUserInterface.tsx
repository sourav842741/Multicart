"use client";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

import { motion } from "framer-motion";
import UserProductCard from "./userProductCard";


export default function ProductsPageForUserInterface() {
 
  const { allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );

  // ✅ ONLY ACTIVE + APPROVED PRODUCTS
  const visibleProducts = useMemo(() => {
    if (!Array.isArray(allProductsData)) return [];
    return allProductsData.filter(
      (p: any) =>
        p.isActive === true && p.verificationStatus === "approved"
    );
  }, [allProductsData]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12"
    >
      {/* Page Heading */}
      <div className="mb-12 text-center">
        <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-3">
          ✦ Handpicked & Trending
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Featured Marketplace Products
        </h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto font-light">
          Shop certified products from approved sellers with guaranteed quality, fast shipping, and easy returns
        </p>
      </div>

      {/* Product Grid */}
      <div>
        {visibleProducts.length === 0 ? (
          <div className="min-h-[30vh] flex flex-col items-center justify-center bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
            <span className="text-4xl mb-3">📦</span>
            <p className="text-gray-300 font-semibold mb-1">No products available right now</p>
            <p className="text-gray-500 text-xs">New catalog items are being updated by vendors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleProducts.map((product: any) => (
              <UserProductCard
                key={product._id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
