"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { IUser } from "@/models/user.model";
import { motion } from "framer-motion";
import getAllVendorData from "@/hooks/getAllVendorData";
import Navbar from "@/component/nav";


export default function ShopsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isStandalone = pathname === "/shop";
 
  getAllVendorData();

  const allVendorData: IUser[] = useSelector(
    (state: RootState) => state.vendor.allVendorData
  );

  if (!allVendorData || allVendorData.length === 0) {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center text-white px-4 py-16 ${isStandalone ? "pt-32" : ""}`}>
        {isStandalone && <Navbar />}
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-4">
          🏪
        </div>
        <h3 className="text-xl font-bold mb-2">No Verified Shops Found</h3>
        <p className="text-gray-400 text-sm max-w-md text-center mb-6">
          Vendors are currently onboarding. In the meantime, explore all verified products across categories.
        </p>
        <button
          onClick={() => router.push("/category")}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg cursor-pointer"
        >
          Explore Categories →
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full ${isStandalone ? "min-h-screen bg-[#07090e] pt-24" : ""}`}>
      {isStandalone && <Navbar />}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12"
      >
      {/* Heading */}
      <div className="mb-12 text-center">
        <span className="inline-block px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-3">
          ✦ Verified Merchant Directory
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Explore Trusted Shops & Sellers
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto font-light">
          Shop directly from authentic stores, independent boutiques, and certified enterprise brands
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {allVendorData.map((vendor, i) => (
          <motion.div
            key={String(vendor._id)}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            viewport={{ once: true, amount: 0.15 }}
            whileHover={{ y: -6 }}
            onClick={() => router.push(`/shop-details/${vendor._id}`)}
            className="group relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-blue-500/40 rounded-2xl overflow-hidden cursor-pointer backdrop-blur-xl transition-all duration-300 hover:shadow-[0_12px_35px_rgba(37,99,235,0.2)] flex flex-col justify-between"
          >
            {/* Top Store Banner Image */}
            <div className="relative w-full h-44 overflow-hidden bg-gray-900">
              <Image
                src={vendor.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80"}
                alt={vendor.shopName || "Shop"}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`text-[11px] px-3 py-1 rounded-full font-semibold backdrop-blur-md border tracking-wide uppercase ${
                    vendor.verificationStatus === "approved"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : vendor.verificationStatus === "pending"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  }`}
                >
                  {vendor.verificationStatus === "approved" ? "✓ Verified" : vendor.verificationStatus}
                </span>
              </div>
            </div>

            {/* Shop Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h2 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                  {vendor.shopName || "Unnamed Shop"}
                </h2>

                <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                  📍 {vendor.businessAddress || "Pan-India Shipping"}
                </p>
              </div>

              {/* Stats & Action */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  {Array.isArray(vendor.vendorProducts) ? `${vendor.vendorProducts.length} Products` : "Verified Store"}
                </span>

                <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Visit Store <span>→</span>
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
    </div>
  );
}

