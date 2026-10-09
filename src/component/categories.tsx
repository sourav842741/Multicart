"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const categories = [
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

export default function CategoriesSlider() {
  const [startIndex, setStartIndex] = useState(0);
  const router = useRouter();

  const nextSlide = () => {
    setStartIndex((prev) => (prev + 5) % categories.length);
  };

  const prevSlide = () => {
    setStartIndex((prev) =>
      prev - 5 < 0 ? categories.length - 5 : prev - 5
    );
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      viewport={{ once: true }}
      className="w-full max-w-7xl mx-auto px-6 py-16 text-center relative"
    >
      {/* Header */}
      <div className="mb-10 text-center">
        <span className="inline-block px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 tracking-wider uppercase mb-3">
          Curated Collections
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Shop by Categories
        </h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto font-light">
          Browse verified products and specialty merchandise curated across top categories
        </p>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={startIndex}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5"
          >
            {categories.slice(startIndex, startIndex + 5).map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-blue-500/40 p-6 rounded-2xl cursor-pointer text-white backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_30px_rgba(37,99,235,0.2)] flex flex-col items-center justify-between min-h-[160px]"
                onClick={() =>
                  router.push(
                    `/category?category=${encodeURIComponent(item.label)}`
                  )
                }
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/0 via-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Icon Container */}
                <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-3xl mb-3 shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>

                {/* Label */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {item.label}
                  </p>
                  <span className="text-[11px] text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-block mt-1">
                    Explore →
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Previous Button */}
        <button
          onClick={prevSlide}
          aria-label="Previous categories"
          className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-blue-600 text-white border border-white/15 flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer z-10 hover:scale-110"
        >
          ‹
        </button>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          aria-label="Next categories"
          className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-blue-600 text-white border border-white/15 flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer z-10 hover:scale-110"
        >
          ›
        </button>
      </div>
    </motion.section>
  );
}
