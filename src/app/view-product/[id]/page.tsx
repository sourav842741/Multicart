"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { FaStar, FaRegStar } from "react-icons/fa";
import UserProductCard from "@/component/userProductCard";
import { IProduct } from "@/models/product.model";
import getAllProductsData from "@/hooks/getAllProductsData";
import { FaUserCircle } from "react-icons/fa";

import axios from "axios";
import Navbar from "@/component/nav";


export default function ProductViewPage() {

  const params = useParams();
  const id = params.id;
  getAllProductsData()
  const router = useRouter()
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [sizeError, setSizeError] = useState<boolean>(false);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [cartSuccess, setCartSuccess] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);

  const { allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );

  const [activeImage, setActiveImage] = useState(0);

  // ✅ DIRECT FIND (NO useMemo)
  const product: IProduct | undefined = allProductsData?.find(
    (p: IProduct) => String(p._id) === String(id)
  );

  // ✅ Loading
  if (!allProductsData || allProductsData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <h1 className="text-xl">Loading products...</h1>
      </div>
    );
  }

  // ✅ Not Found
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        <h1 className="text-xl">❌ Product Not Found</h1>
      </div>
    );
  }

  const images = (
    product.images && product.images.length > 0
      ? product.images
      : [product.image1, product.image2, product.image3, product.image4]
  ).filter(Boolean);

  const totalReviews = product.reviews?.length ?? 0;

  const avgRating =
    totalReviews > 0
      ? (
          product.reviews!.reduce(
            (sum: number, r: { rating: number }) => sum + r.rating,
            0
          ) / totalReviews
        ).toFixed(1)
      : "5.0";

  // ✅ RELATED PRODUCTS
  const relatedProducts =
    allProductsData?.filter(
      (p) => p?.category === product?.category && p?._id !== product?._id
    ) || [];

  const handleAddToCart = async () => {
    if (!product?._id) return;
    if (product.isWearable && Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    try {
      setCartLoading(true);
      const res = await axios.post("/api/cart/add", {
        productId: product._id,
        quantity,
        size: selectedSize || undefined,
      });

      if (res.status === 200) {
        setCartSuccess(true);
        setTimeout(() => setCartSuccess(false), 2500);
      }
    } catch (err: any) {
      console.log(err);
      alert(err?.response?.data?.message || "Add to cart failed ❌");
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product?._id) return;
    if (product.isWearable && Array.isArray(product.sizes) && product.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    await handleAddToCart();
    router.push("/cart");
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewComment) {
      alert("Rating and comment are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("productId", String(product._id));
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewComment);

      if (reviewImage) {
        formData.append("image", reviewImage);
      }

      await axios.post("/api/product/add-review", formData);

      alert("✅ Review added successfully");
      router.refresh();

      setReviewRating(0);
      setReviewComment("");
      setReviewImage(null);
      setPreview(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to add review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* ================== TOP SECTION (GALLERY + DETAILS) ================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT: IMAGE GALLERY (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* THUMBNAILS (VERTICAL ON DESKTOP) */}
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[540px] pb-2 sm:pb-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 sm:w-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 bg-white/[0.04] ${
                    activeImage === i
                      ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105"
                      : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.title} ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>

            {/* MAIN EXPANSIVE IMAGE BOX */}
            <div className="relative flex-1 aspect-[4/5] min-h-[420px] sm:min-h-[500px] lg:min-h-[540px] bg-neutral-950 rounded-3xl overflow-hidden border border-white/15 flex items-center justify-center p-0 group shadow-2xl cursor-zoom-in">
              <Image
                src={images[activeImage]}
                alt={product.title}
                fill
                onClick={() => setIsZoomOpen(true)}
                className={`w-full h-full ${
                  fitMode === "cover" ? "object-cover" : "object-contain"
                } transition-all duration-300`}
                priority
              />

              {/* Action Overlay Pills */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFitMode(fitMode === "cover" ? "contain" : "cover");
                  }}
                  className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-xs font-semibold text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  <span>{fitMode === "cover" ? "📐 Fit View" : "🖼️ Fill View"}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-xs font-semibold text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-lg flex items-center gap-1"
                >
                  <span>⛶ Zoom</span>
                </button>
              </div>

              {/* Prev / Next Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage((prev) => (prev - 1 + images.length) % images.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 backdrop-blur-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 text-xl font-bold"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage((prev) => (prev + 1) % images.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/20 backdrop-blur-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10 text-xl font-bold"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT: BUYING PANEL (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Verified Badge */}
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 tracking-wider uppercase">
                  {product.category}
                </span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  ✓ Verified Authentic
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2.5">
                <div className="flex text-amber-400 text-sm">
                  {[1, 2, 3, 4, 5].map((i) =>
                    i <= Math.round(Number(avgRating)) ? (
                      <FaStar key={i} />
                    ) : (
                      <FaRegStar key={i} />
                    )
                  )}
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {avgRating} ({totalReviews || 8} reviews)
                </span>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-3xl font-black text-emerald-400">
                  ₹ {product.price?.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ₹ {Math.round(product.price * 1.25)?.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  20% OFF
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-300 leading-relaxed font-light">
                {product.description}
              </p>

              {/* Stock Status */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Availability:</span>
                <span className={`font-semibold ${product.stock > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {product.stock > 0 ? `In Stock (${product.stock} units)` : "Out of Stock"}
                </span>
              </div>

              {/* ================= SIZE SELECTION (REAL E-COMMERCE) ================= */}
              {product.isWearable === true &&
                Array.isArray(product.sizes) &&
                product.sizes.length > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        Select Size
                        {selectedSize ? (
                          <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                            {selectedSize}
                          </span>
                        ) : (
                          <span className="text-xs text-rose-400 font-normal">
                            (Required)
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        📏 Size Chart
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {product.sizes.map((s: string) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSelectedSize(s);
                            setSizeError(false);
                          }}
                          className={`min-w-[50px] h-11 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center justify-center border ${
                            selectedSize === s
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-lg shadow-blue-500/30 scale-105"
                              : "bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 border-white/15 hover:border-white/30"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {sizeError && (
                      <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1.5 animate-pulse">
                        ⚠️ Please select a size to proceed
                      </p>
                    )}
                  </div>
                )}

              {/* Quantity Selector */}
              <div className="pt-2 flex items-center gap-4">
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center border border-white/20 rounded-xl bg-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3.5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-xl cursor-pointer flex items-center justify-center gap-2 ${
                    cartSuccess
                      ? "bg-emerald-600 text-white shadow-emerald-500/30"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30"
                  }`}
                >
                  {cartLoading ? "Adding..." : cartSuccess ? "Added to Cart ✓" : "Add to Cart"}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                >
                  Buy Now
                </button>
              </div>

              {/* Policy Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-gray-300">
                {product.freeDelivery && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                    <span>🚚</span>
                    <span>Free Express Delivery</span>
                  </div>
                )}
                {product.replacementDays ? (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                    <span>🔄</span>
                    <span>{product.replacementDays} Days Replacement</span>
                  </div>
                ) : null}
                {product.payOnDelivery && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                    <span>💵</span>
                    <span>Cash on Delivery</span>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2">
                  <span>🛡️</span>
                  <span>{product.warranty || "Brand Warranty"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================== BOTTOM SECTION (HIGHLIGHTS & REVIEWS) ================== */}
        {Array.isArray(product.detailsPoints) && product.detailsPoints.length > 0 && (
          <div className="mt-14 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 text-white">Product Highlights</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.detailsPoints.map((p: string, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-sm text-gray-200 font-light">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================== ✅ RELATED PRODUCTS ================== */}
        {/* ================== ✅ RELATED PRODUCTS ================== */}
        {Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-5 text-white">
              Related Products
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {relatedProducts.slice(0, 8).map((rp) => (
                <UserProductCard
                  key={rp._id?.toString()}
                  product={rp}
                />
              ))}

            </div>
          </div>
        )}


      </div>
      {/* ================== ✅ REVIEWS SECTION ================== */}
      <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Customer Reviews
        </h2>

        {/* ⭐ ADD REVIEW FORM */}
        <div className="mb-8">
          <p className="text-white font-semibold mb-2">Add Your Review</p>

          {/* ⭐ Rating */}
          <div className="flex gap-2 mb-3 text-yellow-400">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                onClick={() => setReviewRating(i)}
                className="cursor-pointer"
              >
                {i <= reviewRating ? <FaStar /> : <FaRegStar />}
              </span>
            ))}
          </div>

          {/* 💬 Comment */}
          <textarea
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Write your review..."
            className="w-full p-3 rounded bg-black text-white border border-white/20 mb-3"
          />

          {/* 🖼️ Image Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setReviewImage(file);
                setPreview(URL.createObjectURL(file));
              }
            }}
            className="mb-3 text-white"
          />

          {/* 🖼️ Preview */}
          {preview && (
            <Image
              src={preview}
              alt="Preview"
              width={100}
              height={100}
              className="rounded mb-3"
            />
          )}

          {/* 🚀 Submit */}
          <button
            onClick={submitReview}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>

        {/* 📄 EXISTING REVIEWS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  {product.reviews && product.reviews.length > 0 ? (
    product.reviews.map((r, i) => (
      <div
        key={i}
        className="bg-black/20 border border-white/10 rounded-xl p-5"
      >
        {/* 👤 USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-black">
  {typeof r.user === "object" && r.user.image ? (
    <Image
      src={r.user.image}
      alt={r.user.name || "User"}
      width={40}
      height={40}
      className="rounded-full object-cover"
    />
  ) : (
    <FaUserCircle className="text-gray-400 w-8 h-8" />
  )}
</div>


          <div>
            <p className="text-white font-semibold text-sm">
              {typeof r.user === "object" ? r.user.name : "User"}
            </p>

            {/* ⭐ RATING */}
            <div className="flex text-yellow-400 text-sm">
              {[1, 2, 3, 4, 5].map((i) =>
                i <= r.rating ? (
                  <FaStar key={i} />
                ) : (
                  <FaRegStar key={i} />
                )
              )}
            </div>
          </div>
        </div>

        {/* 💬 COMMENT */}
        <p className="text-gray-300 text-sm mb-3">
          {r.comment}
        </p>

        {/* 🖼️ REVIEW IMAGE (OPTIONAL) */}
       {r.image && (
  <div className="w-[180px] h-[180px] border border-white/10 rounded-lg overflow-hidden bg-black">
    <Image
      src={r.image}
      alt="Review Image"
      width={180}
      height={180}
      className="object-contain"
    />
  </div>
)}

      </div>
    ))
  ) : (
    <p className="text-gray-400">No reviews yet.</p>
  )}
</div>

      </div>

      {/* ================== FULLSCREEN LIGHTBOX / ZOOM MODAL ================== */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Header Controls */}
          <div className="absolute top-5 right-5 flex items-center gap-4 z-50">
            <span className="text-sm text-gray-300">
              {activeImage + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setIsZoomOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl cursor-pointer transition-colors border border-white/20"
            >
              ✕
            </button>
          </div>

          {/* Modal Main Image */}
          <div
            className="relative w-full max-w-4xl h-[75vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[activeImage]}
              alt={product.title}
              fill
              className="object-contain"
              priority
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImage((prev) => (prev - 1 + images.length) % images.length)
                  }
                  className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-2xl font-bold border border-white/20 cursor-pointer shadow-2xl"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImage((prev) => (prev + 1) % images.length)
                  }
                  className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-2xl font-bold border border-white/20 cursor-pointer shadow-2xl"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          <div
            className="mt-4 flex gap-2.5 overflow-x-auto max-w-xl pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                  activeImage === i
                    ? "border-blue-500 scale-105 shadow-lg shadow-blue-500/50"
                    : "border-white/20 opacity-60 hover:opacity-100"
                }`}
              >
                <Image src={img} alt="thumb" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================== SIZE CHART / GUIDE MODAL ================== */}
      {isSizeGuideOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsSizeGuideOpen(false)}
        >
          <div
            className="bg-neutral-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">📏 Standard Size Chart</h3>
                <p className="text-xs text-gray-400">All measurements in inches & cm</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="py-2.5 px-3 font-semibold">Size</th>
                    <th className="py-2.5 px-3 font-semibold">Chest (in)</th>
                    <th className="py-2.5 px-3 font-semibold">Length (in)</th>
                    <th className="py-2.5 px-3 font-semibold">Shoulder (in)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-200">
                  <tr><td className="py-2 px-3 font-bold text-blue-400">XS</td><td className="py-2 px-3">36</td><td className="py-2 px-3">26</td><td className="py-2 px-3">16.5</td></tr>
                  <tr><td className="py-2 px-3 font-bold text-blue-400">S</td><td className="py-2 px-3">38</td><td className="py-2 px-3">27</td><td className="py-2 px-3">17.5</td></tr>
                  <tr><td className="py-2 px-3 font-bold text-blue-400">M</td><td className="py-2 px-3">40</td><td className="py-2 px-3">28</td><td className="py-2 px-3">18.5</td></tr>
                  <tr><td className="py-2 px-3 font-bold text-blue-400">L</td><td className="py-2 px-3">42</td><td className="py-2 px-3">29</td><td className="py-2 px-3">19.5</td></tr>
                  <tr><td className="py-2 px-3 font-bold text-blue-400">XL</td><td className="py-2 px-3">44</td><td className="py-2 px-3">30</td><td className="py-2 px-3">20.5</td></tr>
                  <tr><td className="py-2 px-3 font-bold text-blue-400">XXL</td><td className="py-2 px-3">46</td><td className="py-2 px-3">31</td><td className="py-2 px-3">21.5</td></tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              💡 Tip: Measure around the fullest part of your chest. If you prefer a loose relaxed fit, we recommend ordering one size up.
            </div>

            <button
              type="button"
              onClick={() => setIsSizeGuideOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-sm cursor-pointer transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
