"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiUpload, FiTrash2, FiPlus, FiCheck, FiStar } from "react-icons/fi";
import axios from "axios";
import Navbar from "@/component/nav";

const categories = [
  "Fashion & Lifestyle",
  "Electronics & Gadgets",
  "Home & Living",
  "Beauty & Personal Care",
  "Toys, Kids & Baby",
  "Food & Grocery",
  "Sports & Fitness",
  "Automotive Accessories",
  "Gifts & Handcrafts",
  "Books & Stationery",
  "Others",
];

const SIZE_PRESETS = {
  apparel: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "Free Size"],
  waist: ["28", "30", "32", "34", "36", "38", "40", "42"],
  footwear: ["UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
};

export default function AddProduct() {
  const router = useRouter();

  // Basic Information
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // Wearable & Size Selection
  const [isWearable, setIsWearable] = useState(false);
  const [activeSizeTab, setActiveSizeTab] = useState<"apparel" | "waist" | "footwear" | "custom">("apparel");
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState("");

  // Policies
  const [replacementDays, setReplacementDays] = useState("");
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [warranty, setWarranty] = useState("");
  const [payOnDelivery, setPayOnDelivery] = useState(false);

  // Highlights / Details Points
  const [detailPoints, setDetailPoints] = useState<string[]>([]);
  const [currentPoint, setCurrentPoint] = useState("");

  // Multi-Image Upload (Real E-Commerce Style)
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  // Toggle Size
  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Add Custom Size
  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
    }
    setCustomSizeInput("");
  };

  // Select all sizes in current preset
  const handleSelectAllInPreset = (presetKey: "apparel" | "waist" | "footwear") => {
    const preset = SIZE_PRESETS[presetKey];
    const allSelected = preset.every((s) => sizes.includes(s));
    if (allSelected) {
      setSizes((prev) => prev.filter((s) => !preset.includes(s)));
    } else {
      setSizes((prev) => Array.from(new Set([...prev, ...preset])));
    }
  };

  // Image Upload Handler (Multiple Selection)
  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const combinedFiles = [...images, ...newFiles].slice(0, 8); // Allow up to 8 images
    setImages(combinedFiles);

    const newPreviews = combinedFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  // Delete an image from list
  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
  };

  // Move image to cover (index 0)
  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    const item = images[index];
    const prev = previews[index];

    const updatedImages = [item, ...images.filter((_, i) => i !== index)];
    const updatedPreviews = [prev, ...previews.filter((_, i) => i !== index)];

    setImages(updatedImages);
    setPreviews(updatedPreviews);
  };

  // Add Detail Point
  const handleAddPoint = () => {
    if (!currentPoint.trim()) return;
    setDetailPoints((prev) => [...prev, currentPoint.trim()]);
    setCurrentPoint("");
  };

  // Remove Detail Point
  const handleRemovePoint = (index: number) => {
    setDetailPoints((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price || !stock || !category) {
      alert("Please fill in all mandatory product information (title, price, stock, category).");
      return;
    }

    if (images.length === 0) {
      alert("Please upload at least 1 product image.");
      return;
    }

    if (isWearable && sizes.length === 0) {
      alert("Please select at least one available size for this wearable product.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("stock", stock);
      formData.append(
        "category",
        category === "Others" ? customCategory : category
      );

      formData.append("isWearable", String(isWearable));
      sizes.forEach((s) => formData.append("sizes", s));

      formData.append("replacementDays", replacementDays || "0");
      formData.append("freeDelivery", String(freeDelivery));
      formData.append("warranty", warranty || "No Warranty");
      formData.append("payOnDelivery", String(payOnDelivery));

      detailPoints.forEach((point) => formData.append("detailsPoints", point));

      // Append all images
      images.forEach((img) => formData.append("images", img));

      // Fallbacks for legacy fields
      if (images[0]) formData.append("image1", images[0]);
      if (images[1]) formData.append("image2", images[1]);
      else if (images[0]) formData.append("image2", images[0]);

      if (images[2]) formData.append("image3", images[2]);
      else if (images[0]) formData.append("image3", images[0]);

      if (images[3]) formData.append("image4", images[3]);
      else if (images[0]) formData.append("image4", images[0]);

      await axios.post("/api/vendor/add-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("🎉 Product uploaded successfully! It is now submitted for admin approval.");
      router.push("/");
    } catch (error: any) {
      console.error("ADD PRODUCT ERROR:", error);
      alert(error?.response?.data?.message || "Product upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="border-b border-white/10 pb-6 mb-8">
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              Vendor Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
              Add New Product Listing
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Provide authentic product information, select multiple high-res photos, and configure real sizing options.
            </p>
          </div>

          <div className="space-y-8">
            {/* ================= SECTION 1: BASIC DETAILS ================= */}
            <div>
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">1</span>
                Basic Product Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Classic Heavyweight Streetwear Hoodie"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 1999"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Inventory Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Product Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-white/15 focus:border-blue-500 text-white text-sm outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-neutral-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {category === "Others" && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      Specify Custom Category *
                    </label>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Vintage Collectibles"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the fabric, features, origin, styling advice..."
                    className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ================= SECTION 2: MULTI-IMAGE UPLOADER ================= */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">2</span>
                    Product Photos (Multiple Image Upload)
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Upload 1 to 8 high-resolution photos. The first image will be used as the main cover photo.
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 mt-2 sm:mt-0 w-fit">
                  {images.length} / 8 photos selected
                </span>
              </div>

              {/* Multi-File Hidden Input */}
              <input
                id="multiImageInput"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImagesChange}
                className="hidden"
              />

              {/* Preview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {previews.map((previewUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 group bg-neutral-900 shadow-md"
                  >
                    <Image
                      src={previewUrl}
                      alt={`Upload ${index + 1}`}
                      fill
                      className="object-cover"
                    />

                    {/* Cover Photo Badge */}
                    {index === 0 ? (
                      <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md shadow-md">
                        <FiStar size={11} /> Cover
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(index)}
                        className="absolute bottom-2 left-2 right-2 py-1 rounded-lg bg-black/75 hover:bg-black text-[10px] font-semibold text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer text-center"
                      >
                        Set as Cover
                      </button>
                    )}

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600/80 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer shadow-lg"
                      title="Remove image"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                ))}

                {/* Add More Photos Card */}
                {images.length < 8 && (
                  <label
                    htmlFor="multiImageInput"
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-blue-500 hover:bg-blue-500/[0.05] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 transition-colors">
                      <FiPlus size={20} />
                    </div>
                    <span className="text-xs font-semibold text-gray-200 group-hover:text-white">
                      {images.length === 0 ? "Select Photos" : "Add More"}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1">
                      PNG, JPG, WebP
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* ================= SECTION 3: WEARABLE & REAL SIZES ================= */}
            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">3</span>
                  Product Sizing (Apparel / Shoes / Waist)
                </h2>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWearable}
                    onChange={(e) => setIsWearable(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  <span className="ml-3 text-xs font-semibold text-gray-300">
                    Has Sizes
                  </span>
                </label>
              </div>

              {isWearable && (
                <div className="mt-5 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
                    <button
                      type="button"
                      onClick={() => setActiveSizeTab("apparel")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSizeTab === "apparel"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-white/[0.04] text-gray-300 hover:text-white"
                      }`}
                    >
                      👕 Clothing (XS – 4XL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSizeTab("waist")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSizeTab === "waist"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-white/[0.04] text-gray-300 hover:text-white"
                      }`}
                    >
                      👖 Waist / Jeans (28 – 42)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSizeTab("footwear")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSizeTab === "footwear"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-white/[0.04] text-gray-300 hover:text-white"
                      }`}
                    >
                      👟 Footwear (UK 4 – 12)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSizeTab("custom")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeSizeTab === "custom"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-white/[0.04] text-gray-300 hover:text-white"
                      }`}
                    >
                      ✏️ Custom Size
                    </button>
                  </div>

                  {/* Preset Pills */}
                  {activeSizeTab !== "custom" && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs text-gray-400">
                          Click to toggle available sizes:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectAllInPreset(activeSizeTab)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                        >
                          Toggle All in Group
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {SIZE_PRESETS[activeSizeTab].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSize(s)}
                            className={`min-w-[48px] h-10 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                              sizes.includes(s)
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/30 scale-105"
                                : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border-white/10"
                            }`}
                          >
                            {sizes.includes(s) && <FiCheck size={12} />}
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Size Adder */}
                  {activeSizeTab === "custom" && (
                    <div className="space-y-2">
                      <span className="text-xs text-gray-400">
                        Type any custom sizing (e.g. 0-6M, 32B, XL-Long, One Size):
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSizeInput}
                          onChange={(e) => setCustomSizeInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddCustomSize()}
                          placeholder="e.g. ONE SIZE"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomSize}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                        >
                          + Add Size
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selected Sizes Summary */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-300">
                        Selected Sizes ({sizes.length}):
                      </span>
                      {sizes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSizes([])}
                          className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                        >
                          Clear All Sizes
                        </button>
                      )}
                    </div>

                    {sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {sizes.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400"
                          >
                            {s}
                            <button
                              type="button"
                              onClick={() => toggleSize(s)}
                              className="hover:text-rose-400 cursor-pointer text-xs"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-rose-400">
                        ⚠️ Please select at least one size for buyers to choose from.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ================= SECTION 4: POLICIES & WARRANTIES ================= */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">4</span>
                Policies & Warranty
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Replacement Policy (Days)
                  </label>
                  <input
                    type="number"
                    value={replacementDays}
                    onChange={(e) => setReplacementDays(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Warranty Details
                  </label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g. 1 Year Manufacturer Warranty"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mt-4">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeDelivery}
                    onChange={(e) => setFreeDelivery(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-white/10 border-white/20"
                  />
                  <span className="text-xs font-medium text-gray-200">
                    🚚 Free Express Delivery
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payOnDelivery}
                    onChange={(e) => setPayOnDelivery(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-white/10 border-white/20"
                  />
                  <span className="text-xs font-medium text-gray-200">
                    💵 Cash on Delivery Available
                  </span>
                </label>
              </div>
            </div>

            {/* ================= SECTION 5: HIGHLIGHT POINTS ================= */}
            <div className="pt-6 border-t border-white/10">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-xs flex items-center justify-center font-bold">5</span>
                Key Product Highlights
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Bullet points shown prominently on the product page (e.g. 100% Cotton, Water Resistant).
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentPoint}
                  onChange={(e) => setCurrentPoint(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPoint()}
                  placeholder="e.g. 450 GSM Heavy French Terry Cotton"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  + Add Point
                </button>
              </div>

              {detailPoints.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {detailPoints.map((point, i) => (
                    <li
                      key={i}
                      className="flex justify-between items-center bg-white/[0.03] border border-white/10 px-3.5 py-2 rounded-xl text-xs text-gray-200"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        {point}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePoint(i)}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-extrabold text-base shadow-xl shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading Product & Photos...</span>
                  </>
                ) : (
                  <span>🚀 Publish Product Listing</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
