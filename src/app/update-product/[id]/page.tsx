"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  FiTrash2,
  FiPlus,
  FiCheck,
  FiStar,
  FiArrowLeft,
  FiSave,
  FiPackage,
  FiDollarSign,
  FiTag,
  FiLayers,
  FiShield,
  FiTruck,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiImage,
} from "react-icons/fi";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { IProduct } from "@/models/product.model";
import { setAllProductsData } from "@/redux/vendorSlice";
import Navbar from "@/component/nav";
import getAllProductsData from "@/hooks/getAllProductsData";

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

export default function UpdateProduct() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const productId = params.id as string;

  getAllProductsData();

  const { allProductsData } = useSelector((state: RootState) => state.vendor);
  const { userData } = useSelector((state: RootState) => state.user);

  const product: IProduct | undefined = allProductsData?.find(
    (p: any) => String(p._id) === String(productId)
  );

  // Basic Information
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // Wearable & Size Selection
  const [isWearable, setIsWearable] = useState(false);
  const [activeSizeTab, setActiveSizeTab] = useState<
    "apparel" | "waist" | "footwear" | "custom"
  >("apparel");
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

  // Existing & New Images
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(!product);

  // Fetch product fallback if page refreshed directly
  useEffect(() => {
    if (!product && productId) {
      axios
        .get("/api/product/all-products-data")
        .then((res) => {
          if (res.data?.products) {
            dispatch(setAllProductsData(res.data.products));
          }
        })
        .catch((err) => console.error("Error fetching products:", err))
        .finally(() => setFetchingProduct(false));
    } else {
      setFetchingProduct(false);
    }
  }, [product, productId, dispatch]);

  // Prefill from product
  useEffect(() => {
    if (!product) return;

    setTitle(product.title || "");
    setDescription(product.description || "");
    setPrice(String(product.price || ""));
    setStock(String(product.stock || ""));
    setCategory(product.category || "");

    setIsWearable(Boolean(product.isWearable));
    setSizes(product.sizes || []);

    setReplacementDays(
      product.replacementDays ? String(product.replacementDays) : ""
    );
    setFreeDelivery(Boolean(product.freeDelivery));
    setWarranty(product.warranty || "");
    setPayOnDelivery(Boolean(product.payOnDelivery));

    setDetailPoints(product.detailsPoints || []);

    const initialImgs = (
      product.images && product.images.length > 0
        ? product.images
        : [product.image1, product.image2, product.image3, product.image4]
    ).filter(Boolean);

    setExistingImages(initialImgs);
  }, [product]);

  // Size toggles
  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (!sizes.includes(trimmed)) {
      setSizes((prev) => [...prev, trimmed]);
    }
    setCustomSizeInput("");
  };

  const handleSelectAllInPreset = (
    presetKey: "apparel" | "waist" | "footwear"
  ) => {
    const preset = SIZE_PRESETS[presetKey];
    const allSelected = preset.every((s) => sizes.includes(s));
    if (allSelected) {
      setSizes((prev) => prev.filter((s) => !preset.includes(s)));
    } else {
      setSizes((prev) => Array.from(new Set([...prev, ...preset])));
    }
  };

  // Image actions
  const handleAddNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const added = Array.from(files);
    const combined = [...newFiles, ...added].slice(0, 8);
    setNewFiles(combined);

    const previews = combined.map((f) => URL.createObjectURL(f));
    setNewPreviews(previews);
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMakeCoverExisting = (index: number) => {
    if (index === 0) return;
    const item = existingImages[index];
    setExistingImages([item, ...existingImages.filter((_, i) => i !== index)]);
  };

  // Highlights
  const handleAddPoint = () => {
    if (!currentPoint.trim()) return;
    setDetailPoints((prev) => [...prev, currentPoint.trim()]);
    setCurrentPoint("");
  };

  const handleRemovePoint = (index: number) => {
    setDetailPoints((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit update
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price || !stock || !category) {
      alert("All core fields (Title, Description, Price, Stock, Category) must be filled.");
      return;
    }

    if (existingImages.length === 0 && newFiles.length === 0) {
      alert("The product must have at least 1 image.");
      return;
    }

    if (isWearable && sizes.length === 0) {
      alert("Please select at least one size for wearable product.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("productId", productId);
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

      // Append new files if any
      newFiles.forEach((file) => formData.append("images", file));

      // Fallbacks if individual image slots are expected
      if (newFiles[0]) formData.append("image1", newFiles[0]);
      if (newFiles[1]) formData.append("image2", newFiles[1]);
      if (newFiles[2]) formData.append("image3", newFiles[2]);
      if (newFiles[3]) formData.append("image4", newFiles[3]);

      await axios.put("/api/vendor/update-product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("✅ Product updated successfully!");
      router.push("/");
    } catch (error: any) {
      console.error("UPDATE PRODUCT ERROR:", error);
      alert(error?.response?.data?.message || "Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center space-y-3">
        <FiRefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-sm font-medium text-gray-400">Loading product editor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[#070a12] to-black text-gray-100">
      <Navbar user={userData as any} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-8">
        {/* ================= TOP BREADCRUMB & HEADER ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                Vendor Panel
              </button>
              <span>/</span>
              <span className="text-gray-300">Catalog</span>
              <span>/</span>
              <span className="text-blue-400 font-semibold truncate max-w-[200px]">
                {title || "Edit Product"}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="px-3 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Vendor Product Editor
              </span>
              {product?.verificationStatus && (
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    product.verificationStatus === "approved"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  ● {product.verificationStatus}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Update Product Information
            </h1>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================= MAIN FORM CONTAINER ================= */}
        <div className="bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-black/40 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl space-y-10">
          {/* ================= SECTION 1: BASIC DETAILS ================= */}
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>General Information & Pricing</span>
              </h2>
              <span className="text-xs text-gray-400">Core Attributes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* TITLE */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Product Title *
                </label>
                <div className="relative">
                  <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="e.g. Milano Italian Full-Grain Leather Chelsea Boots"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-500 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              {/* PRICE */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Listing Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="5299"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-500 text-sm outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* STOCK */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Available Stock Quantity *
                </label>
                <div className="relative">
                  <FiPackage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-500 text-sm outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {/* CATEGORY */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Primary Category *
                </label>
                <div className="relative">
                  <FiLayers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 rounded-xl bg-gray-900 border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white text-sm outline-none transition-all cursor-pointer"
                  >
                    <option value="" disabled>
                      Select an e-commerce category
                    </option>
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-gray-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {category === "Others" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Specify custom category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm outline-none"
                    />
                  </div>
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Product Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Detail the materials, manufacturing quality, craftsmanship, and specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-500 text-sm outline-none resize-y leading-relaxed transition-all"
                />
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: IMAGES GALLERY ================= */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>High-Resolution Photo Gallery</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Upload up to 8 images. The first image will be set as the storefront cover.
                </p>
              </div>

              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 w-fit">
                {existingImages.length + newFiles.length} of 8 Photos
              </span>
            </div>

            <input
              id="updateMultiImageInput"
              type="file"
              multiple
              accept="image/*"
              onChange={handleAddNewFiles}
              className="hidden"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Existing Images */}
              {existingImages.map((imgUrl, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-white/15 group bg-gray-900 shadow-lg"
                >
                  <Image
                    src={imgUrl}
                    alt={`Product photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {index === 0 ? (
                    <div className="absolute top-2.5 left-2.5 bg-emerald-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md shadow-lg border border-emerald-400/30">
                      <FiStar size={11} className="fill-white" /> Cover
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMakeCoverExisting(index)}
                      className="absolute bottom-2 left-2 right-2 py-1.5 rounded-lg bg-black/80 hover:bg-black text-[11px] font-bold text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer text-center"
                    >
                      Set as Cover
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(index)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer shadow-lg"
                    title="Remove photo"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}

              {/* Newly Added Previews */}
              {newPreviews.map((previewUrl, index) => (
                <div
                  key={`new-${index}`}
                  className="relative aspect-square rounded-2xl overflow-hidden border-2 border-blue-500/50 group bg-gray-900 shadow-lg"
                >
                  <Image
                    src={previewUrl}
                    alt={`New photo ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute top-2.5 left-2.5 bg-blue-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md shadow-lg border border-blue-400/30">
                    New Upload
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(index)}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer shadow-lg"
                    title="Remove new file"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))}

              {/* Add More Photos Upload Box */}
              {existingImages.length + newFiles.length < 8 && (
                <label
                  htmlFor="updateMultiImageInput"
                  className="aspect-square rounded-2xl border-2 border-dashed border-white/20 hover:border-blue-500 hover:bg-blue-500/[0.05] flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all group shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-white/[0.06] group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 transition-colors">
                    <FiPlus size={22} className="stroke-[2.5]" />
                  </div>
                  <span className="text-xs font-bold text-gray-200 group-hover:text-white">
                    Add Photos
                  </span>
                  <span className="text-[10px] text-gray-500 mt-1">
                    PNG, JPG, WebP
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* ================= SECTION 3: WEARABLE & SIZES ================= */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <span>Size Variants & Sizing System</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Enable customer selection for footwear, apparel, or waist measurements.
                </p>
              </div>

              {/* Wearable Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWearable}
                  onChange={(e) => setIsWearable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                <span className="ml-3 text-xs font-bold text-gray-300">
                  {isWearable ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>

            {isWearable && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-5">
                {/* PRESET TABS */}
                <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                  {[
                    { id: "apparel", label: "👕 Clothing (XS – 4XL)" },
                    { id: "waist", label: "👖 Waist / Jeans (28 – 42)" },
                    { id: "footwear", label: "👟 Footwear (UK 4 – 12)" },
                    { id: "custom", label: "✏️ Custom Size" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSizeTab(tab.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeSizeTab === tab.id
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : "bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.08]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* SIZES CHIPS */}
                {activeSizeTab !== "custom" && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400">
                        Select available inventory sizes:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInPreset(activeSizeTab)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
                      >
                        Toggle All in Preset
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS[activeSizeTab].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSize(s)}
                          className={`min-w-[52px] h-11 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                            sizes.includes(s)
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/30 scale-105"
                              : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border-white/10"
                          }`}
                        >
                          {sizes.includes(s) && <FiCheck size={13} className="stroke-[3]" />}
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CUSTOM SIZE INPUT */}
                {activeSizeTab === "custom" && (
                  <div className="space-y-2">
                    <span className="text-xs text-gray-400">
                      Add a custom measurement or size label:
                    </span>
                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        value={customSizeInput}
                        onChange={(e) => setCustomSizeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomSize()}
                        placeholder="e.g. Free Size, 44 Regular"
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomSize}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        + Add Size
                      </button>
                    </div>
                  </div>
                )}

                {/* ACTIVE SIZES SUMMARY */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-gray-300">
                      Configured Sizes for Shoppers ({sizes.length}):
                    </span>
                    {sizes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSizes([])}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {sizes.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">
                      No sizes selected yet. Choose from above presets.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sizes.map((s) => (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-blue-300"
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
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= SECTION 4: POLICIES & DELIVERY ================= */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                  4
                </span>
                <span>Shipping, Policies & Assurance</span>
              </h2>
              <span className="text-xs text-gray-400">Trust Badges</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Replacement / Return Window (Days)
                </label>
                <div className="relative">
                  <FiRefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="7"
                    value={replacementDays}
                    onChange={(e) => setReplacementDays(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Warranty Coverage
                </label>
                <div className="relative">
                  <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="e.g. 1 Year Brand Warranty"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* TOGGLE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  freeDelivery
                    ? "bg-blue-600/10 border-blue-500/40 text-white"
                    : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      freeDelivery
                        ? "bg-blue-600 text-white"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    <FiTruck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Free Express Shipping</h4>
                    <p className="text-[11px] text-gray-400">Zero shipping fee for buyer</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={freeDelivery}
                  onChange={(e) => setFreeDelivery(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-600 bg-white/10 border-white/20 cursor-pointer"
                />
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  payOnDelivery
                    ? "bg-emerald-600/10 border-emerald-500/40 text-white"
                    : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      payOnDelivery
                        ? "bg-emerald-600 text-white"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    <FiDollarSign size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Cash on Delivery (COD)</h4>
                    <p className="text-[11px] text-gray-400">Accept pay-on-arrival orders</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={payOnDelivery}
                  onChange={(e) => setPayOnDelivery(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-600 bg-white/10 border-white/20 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* ================= SECTION 5: HIGHLIGHTS ================= */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                  5
                </span>
                <span>Key Feature Highlights</span>
              </h2>
              <span className="text-xs text-gray-400">Product Highlights</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={currentPoint}
                onChange={(e) => setCurrentPoint(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPoint()}
                placeholder="e.g. Crafted with 100% Full-Grain Italian Leather"
                className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddPoint}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                + Add Point
              </button>
            </div>

            {detailPoints.length > 0 && (
              <ul className="space-y-2 pt-1">
                {detailPoints.map((point, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center bg-white/[0.03] border border-white/10 px-4 py-2.5 rounded-xl text-xs text-gray-200"
                  >
                    <span className="flex items-center gap-2.5">
                      <FiCheckCircle className="text-blue-400 w-3.5 h-3.5 flex-shrink-0" />
                      <span>{point}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePoint(i)}
                      className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer text-xs p-1"
                      title="Remove highlight"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ================= BOTTOM SUBMIT BAR ================= */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-2xl text-xs font-bold transition-all border border-white/10 cursor-pointer"
            >
              ← Discard & Return
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>Save & Publish Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
