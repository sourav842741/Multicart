"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaShoppingCart,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { IProduct } from "@/models/product.model";
import axios from "axios";

export default function UserProductCard({ product }: { product: IProduct }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const images = [
    product.image1,
    product.image2,
    product.image3,
    product.image4,
  ].filter(Boolean);

  const [current, setCurrent] = useState(0);

  const openProduct = () => {
    router.push(`/view-product/${product._id}`);
  };

  const next = () => setCurrent((prev) => (prev + 1) % images.length);
  const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (adding) return;

    try {
      setAdding(true);
      const res = await axios.post("/api/cart/add", {
        productId: product._id,
        quantity: 1,
      });

      if (res.status === 200) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);
      }
    } catch (err: any) {
      console.log(err);
    } finally {
      setAdding(false);
    }
  };

  const reviews = product.reviews ?? [];
  const totalReviews = reviews.length;

  const avgRating =
    totalReviews > 0
      ? (
          reviews.reduce(
            (sum: number, r: { rating: number }) => sum + r.rating,
            0
          ) / totalReviews
        ).toFixed(1)
      : "5.0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -6 }}
      className="group relative bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-blue-500/50 rounded-2xl overflow-hidden cursor-pointer backdrop-blur-xl transition-all duration-300 hover:shadow-[0_12px_35px_rgba(59,130,246,0.18)] flex flex-col justify-between"
      onClick={openProduct}
    >
      {/* ================= IMAGE BOX ================= */}
      <div className="relative w-full h-[210px] bg-gradient-to-b from-white/[0.04] to-black/40 overflow-hidden flex items-center justify-center p-3">
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            Verified
          </span>
        </div>

        {/* Product Image */}
        <div className="relative w-[85%] h-[85%] transition-transform duration-500 group-hover:scale-105">
          <Image
            src={images[current] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"}
            alt={product.title}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>

        {/* Carousel controls if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
            >
              <FaChevronLeft size={10} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/10"
            >
              <FaChevronRight size={10} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`transition-all duration-200 rounded-full ${
                    current === i ? "w-3 h-1 bg-white" : "w-1 h-1 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ================= PRODUCT INFO ================= */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase">
            {product.category}
          </p>

          <h3 className="font-semibold text-sm text-gray-100 group-hover:text-blue-300 transition-colors line-clamp-1">
            {product.title}
          </h3>

          {/* Pricing & Rating Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-extrabold text-base text-emerald-400">
              ₹ {product.price?.toLocaleString("en-IN")}
            </span>

            <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
              <FaStar size={11} />
              <span>{avgRating}</span>
              <span className="text-gray-500 text-[10px]">({totalReviews || 12})</span>
            </div>
          </div>

          {/* Vendor Name */}
          <p className="text-xs text-gray-400 pt-1 line-clamp-1">
            By <span className="text-gray-300 font-medium">{product.vendor?.shopName || "Verified Seller"}</span>
          </p>
        </div>

        {/* Add to Cart CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={adding}
          className={`w-full py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-md cursor-pointer ${
            added
              ? "bg-emerald-600 text-white"
              : "bg-white/10 hover:bg-blue-600 text-white border border-white/15 hover:border-blue-500"
          }`}
        >
          <FaShoppingCart size={12} />
          {adding ? "Adding..." : added ? "Added to Cart ✓" : "Add to Cart"}
        </motion.button>
      </div>
    </motion.div>
  );
}
