"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMapPin,
  FiPhone,
  FiUser,
  FiCheckCircle,
  FiPlus,
  FiHome,
  FiBriefcase,
  FiShield,
  FiTruck,
  FiRotateCcw,
  FiLock,
  FiZap,
  FiNavigation,
  FiRefreshCw,
  FiAlertCircle,
  FiEdit3,
} from "react-icons/fi";
import { FaStripe, FaMoneyBillWave } from "react-icons/fa";
import Navbar from "@/component/nav";
import Link from "next/link";

interface ISavedAddress {
  _id?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  type?: "Home" | "Work" | "Other";
  isDefault?: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();

  const productId = useMemo(() => {
    if (!params?.productId) return null;
    return Array.isArray(params.productId)
      ? params.productId[0]
      : params.productId;
  }, [params]);

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<ISavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("");
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [showAddressEditor, setShowAddressEditor] = useState(false);

  // Geolocation & Auto-Detection States (Flipkart style)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [locationSuccessMsg, setLocationSuccessMsg] = useState("");
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState("");
  const [localitySuggestions, setLocalitySuggestions] = useState<string[]>([]);

  // Address Form Inputs
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressType, setAddressType] = useState<"Home" | "Work" | "Other">("Home");
  const [saveToProfile, setSaveToProfile] = useState(true);

  // Payment Method
  const [paymentMode, setPaymentMode] = useState<"cod" | "stripe">("cod");

  // Load product from cart
  useEffect(() => {
    if (!productId) return;

    const loadProduct = async () => {
      try {
        const res = await axios.get("/api/cart/get");
        const found = res.data.cart?.find(
          (i: any) => i.product._id === productId
        );

        if (!found) {
          router.replace("/cart");
          return;
        }

        setItem(found);
        if (!found.product.payOnDelivery) {
          setPaymentMode("stripe");
        }
      } catch (err) {
        console.error("Cart fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, router]);

  // Load Saved Addresses from Profile / Previous Orders (Automatic on Load)
  const fetchSavedAddresses = async (isManualTrigger = false) => {
    try {
      if (isManualTrigger) setIsFetchingProfile(true);
      const res = await axios.get("/api/user/address");
      const list: ISavedAddress[] = res.data.addresses || [];
      setSavedAddresses(list);

      // If user has saved addresses, preselect the default or first one
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.isDefault) || list[0];
        setSelectedAddressId(defaultAddr._id || "0");
        populateAddressFields(defaultAddr);
        if (isManualTrigger) {
          setAutoFillSuccess(true);
          setTimeout(() => setAutoFillSuccess(false), 3000);
        }
      } else if (res.data.userProfile) {
        // Auto-fill available user name/phone
        if (res.data.userProfile.name) setName(res.data.userProfile.name);
        if (res.data.userProfile.phone) setPhone(res.data.userProfile.phone);
        setSelectedAddressId("new");
        setShowAddressEditor(true);
      }
    } catch (err) {
      console.log("Fetch saved addresses error:", err);
    } finally {
      if (isManualTrigger) setIsFetchingProfile(false);
    }
  };

  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const populateAddressFields = (addr: ISavedAddress) => {
    setName(addr.name || "");
    setPhone(addr.phone || "");
    setAddress(addr.address || "");
    setCity(addr.city || "");
    setStateName(addr.state || "");
    setPincode(addr.pincode || "");
    setAddressType(addr.type || "Home");
  };

  const handleSelectSavedAddress = (addr: ISavedAddress) => {
    setSelectedAddressId(addr._id || "");
    populateAddressFields(addr);
    setShowAddressEditor(false);
  };

  const handleSwitchToNewAddress = () => {
    setSelectedAddressId("new");
    setShowAddressEditor(true);
    setName(name || "");
    setPhone(phone || "");
    setAddress("");
    setCity("");
    setStateName("");
    setPincode("");
    setAddressType("Home");
  };

  // =========================================================================
  // 📍 REAL GEOLOCATION GPS AUTO-FETCH (FLIPKART / SWIGGY STYLE)
  // =========================================================================
  const handleDetectCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus("Accessing GPS device coordinates...");
    setLocationSuccessMsg("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocationStatus("Detecting real street, city & pincode...");

          const res = await axios.post("/api/location/reverse-geocode", {
            lat,
            lon,
          });

          if (res.data?.success) {
            const { street, city: detectedCity, state: detectedState, pincode: detectedPincode } =
              res.data;

            if (street) setAddress(street);
            if (detectedCity) setCity(detectedCity);
            if (detectedState) setStateName(detectedState);
            if (detectedPincode) setPincode(detectedPincode);

            setShowAddressEditor(true);
            setSelectedAddressId("new");

            const label = [street, detectedCity, detectedState, detectedPincode]
              .filter(Boolean)
              .join(", ");
            setLocationSuccessMsg(`📍 Live GPS detected: ${label}`);
            setAutoFillSuccess(true);
            setTimeout(() => {
              setLocationSuccessMsg("");
              setAutoFillSuccess(false);
            }, 6000);
          } else {
            setLocationStatus("⚠️ Could not resolve physical address from coordinates.");
            setTimeout(() => setLocationStatus(""), 4000);
          }
        } catch (err: any) {
          console.error("Reverse geocoding error:", err);
          setLocationStatus("⚠️ Network error fetching live location.");
          setTimeout(() => setLocationStatus(""), 4000);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.warn("Geolocation permission error:", error);
        setIsDetectingLocation(false);
        let errorMsg = "GPS location access denied or unavailable.";
        if (error.code === 1) {
          errorMsg = "Please allow location permission in your browser to auto-detect address.";
        }
        setLocationStatus(errorMsg);
        setTimeout(() => setLocationStatus(""), 5000);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // =========================================================================
  // ⚡ SMART PINCODE AUTO-LOOKUP (INDIAN POSTAL DIRECTORY API)
  // =========================================================================
  const handlePincodeChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);

    if (cleaned.length === 6) {
      setIsCheckingPincode(true);
      setPincodeStatus("Verifying postal circle...");
      try {
        const res = await axios.get(`/api/location/pincode?pincode=${cleaned}`);
        if (res.data?.success) {
          const { city: detectedCity, state: detectedState, localities } = res.data;
          if (detectedCity) setCity(detectedCity);
          if (detectedState) setStateName(detectedState);
          setPincodeStatus(`✓ ${detectedCity}, ${detectedState}`);
          if (localities && localities.length > 0) {
            setLocalitySuggestions(localities);
          }
        } else {
          setPincodeStatus("⚠️ Invalid pincode");
        }
      } catch {
        setPincodeStatus("");
      } finally {
        setIsCheckingPincode(false);
      }
    } else {
      setPincodeStatus("");
      setLocalitySuggestions([]);
    }
  };

  // Order Calculations
  const productsTotal = (item?.product?.price || 0) * (item?.quantity || 1);
  const deliveryCharge = item?.product?.freeDelivery ? 0 : 50;
  const serviceCharge = 30;
  const finalTotal = productsTotal + deliveryCharge + serviceCharge;
  const codDisabled = !item?.product?.payOnDelivery;

  // Handle Place Order
  const handlePlaceOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      alert("Please fill all mandatory delivery address fields (Name, Phone, Address, City, Pincode).");
      return;
    }

    // Save to profile if checkbox is checked
    if (saveToProfile && (selectedAddressId === "new" || savedAddresses.length === 0)) {
      try {
        await axios.post("/api/user/address", {
          name,
          phone,
          address,
          city,
          state: stateName,
          pincode,
          type: addressType,
          isDefault: savedAddresses.length === 0,
        });
      } catch (e) {
        console.log("Could not auto-save address to profile:", e);
      }
    }

    const payload = {
      productId,
      quantity: item.quantity,
      size: item.size || undefined,
      address: {
        name,
        phone,
        address,
        city,
        state: stateName,
        pincode,
        type: addressType,
      },
      amount: finalTotal,
      deliveryCharge,
      serviceCharge,
    };

    try {
      setOrderLoading(true);
      if (paymentMode === "cod") {
        await axios.post("/api/order/create-cod", payload);
        router.replace("/orders");
      } else {
        const res = await axios.post("/api/order/online-pay", payload);
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Order placement failed. Please try again.");
    } finally {
      setOrderLoading(false);
    }
  };

  if (!productId || loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-48 gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const hasPopulatedAddress = Boolean(name && phone && address && city && pincode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[#070a13] to-black text-gray-100">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-8">
        {/* ================= TOP BREADCRUMB & HEADER ================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Link href="/cart" className="hover:text-white transition-colors">
                Cart
              </Link>
              <span>/</span>
              <span className="text-blue-400 font-semibold">Checkout</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Secure Checkout
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400 w-fit">
            <FiLock />
            <span>256-Bit SSL Encrypted & Protected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* ================= LEFT COLUMN: DELIVERY ADDRESS (7 cols) ================= */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-500/30">
                    <FiMapPin size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Delivery Address</h2>
                    <p className="text-xs text-gray-400">Where should we deliver your order?</p>
                  </div>
                </div>

                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  Step 1 of 2
                </span>
              </div>

              {/* ================= FLIPKART STYLE AUTO-DETECT ACTIONS BAR ================= */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 📍 REAL GPS GEOLOCATION DETECT BUTTON */}
                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={isDetectingLocation}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/40"
                >
                  <FiNavigation
                    className={`w-4 h-4 ${
                      isDetectingLocation ? "animate-spin text-white" : "animate-pulse"
                    }`}
                  />
                  <span>
                    {isDetectingLocation
                      ? "Detecting Real GPS..."
                      : "Use My Current Location"}
                  </span>
                </button>

                {/* ⚡ AUTO-FILL FROM SAVED PROFILE */}
                <button
                  type="button"
                  onClick={() => fetchSavedAddresses(true)}
                  disabled={isFetchingProfile}
                  className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                >
                  <FiZap className="text-amber-400 w-4 h-4" />
                  <span>
                    {isFetchingProfile ? "Syncing..." : "Auto-Fill Saved Address"}
                  </span>
                </button>
              </div>

              {/* GPS DETECTION LIVE STATUS FEEDBACK */}
              {locationStatus && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
                  <FiRefreshCw className="animate-spin text-blue-400 w-3.5 h-3.5 flex-shrink-0" />
                  <span>{locationStatus}</span>
                </div>
              )}

              {locationSuccessMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5 shadow-md"
                >
                  <FiCheckCircle className="text-emerald-400 w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">{locationSuccessMsg}</span>
                </motion.div>
              )}

              {/* ================= FLIPKART STYLE ACTIVE "DELIVER TO" CARD ================= */}
              {hasPopulatedAddress && !showAddressEditor && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-blue-900/15 border-2 border-blue-500/40 rounded-2xl p-5 shadow-xl space-y-3 relative group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Deliver To: <b className="text-blue-300">{name}</b>
                      </span>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40">
                        {addressType}
                      </span>
                      <span className="text-xs font-mono text-gray-300 font-bold">
                        {pincode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddressEditor(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                      <span>Change</span>
                    </button>
                  </div>

                  <p className="text-xs text-gray-200 leading-relaxed">
                    {address}, {city}
                    {stateName ? `, ${stateName}` : ""} - <b className="text-white">{pincode}</b>
                  </p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                    <span className="flex items-center gap-1.5">
                      <FiPhone className="text-blue-400" />
                      <b>{phone}</b>
                    </span>
                    <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                      <FiCheckCircle size={12} />
                      Verified Destination
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ================= OPTION 1: SAVED ADDRESSES SELECTOR ================= */}
              {savedAddresses.length > 0 && showAddressEditor && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Select From Saved Addresses ({savedAddresses.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleSwitchToNewAddress}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FiPlus /> New Address Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr._id;

                      return (
                        <div
                          key={addr._id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20"
                              : "bg-white/[0.03] border-white/10 hover:border-white/25 hover:bg-white/[0.05]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-200 border border-white/15">
                                {addr.type === "Work" ? (
                                  <FiBriefcase size={11} />
                                ) : (
                                  <FiHome size={11} />
                                )}
                                <span>{addr.type || "Home"}</span>
                              </span>

                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? "border-blue-400 bg-blue-500"
                                    : "border-gray-500"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </div>
                            </div>

                            <p className="font-bold text-white text-sm">{addr.name}</p>
                            <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                              {addr.address}, {addr.city} - {addr.pincode}
                            </p>
                          </div>

                          <div className="pt-2.5 mt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                            <span>📞 {addr.phone}</span>
                            {isSelected && (
                              <span className="text-emerald-400 font-bold">
                                Selected
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= OPTION 2: ADDRESS INPUT FORM ================= */}
              {(showAddressEditor || !hasPopulatedAddress) && (
                <div className="space-y-4 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      {selectedAddressId === "new"
                        ? "Enter Address Details"
                        : "Edit Delivery Details"}
                    </span>

                    {hasPopulatedAddress && (
                      <button
                        type="button"
                        onClick={() => setShowAddressEditor(false)}
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Minimize
                      </button>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="e.g. Sourav Kumar"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        10-Digit Mobile Number *
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* PINCODE FIELD (WITH LIVE POSTAL AUTO-DETECTION) */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-300">
                          Pincode / Postal Code *
                        </label>
                        {isCheckingPincode && (
                          <span className="text-[10px] text-blue-400 animate-pulse">
                            Checking circle...
                          </span>
                        )}
                        {pincodeStatus && !isCheckingPincode && (
                          <span
                            className={`text-[10px] font-semibold ${
                              pincodeStatus.startsWith("✓")
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            {pincodeStatus}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 141401"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all font-semibold"
                      />
                    </div>

                    {/* CITY FIELD */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        City / Town / District *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Khanna"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all font-semibold"
                      />
                    </div>

                    {/* LOCALITY SUGGESTIONS (FLIPKART STYLE) */}
                    {localitySuggestions.length > 0 && (
                      <div className="sm:col-span-2 space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/10">
                        <span className="text-[11px] text-gray-400 font-semibold block">
                          Suggested Post Office Localities (Click to add):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {localitySuggestions.map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => {
                                setAddress(address ? `${loc}, ${address}` : loc);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              + {loc}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STREET ADDRESS */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-300 mb-1">
                        House No. / Building / Street / Locality *
                      </label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3.5 top-3.5 text-gray-400" />
                        <textarea
                          rows={2}
                          placeholder="e.g. Flat 402, Imperial Heights, Grand Trunk Road Libra"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      {/* Address Type Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Type:</span>
                        {(["Home", "Work", "Other"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setAddressType(t)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              addressType === t
                                ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                                : "bg-white/[0.04] text-gray-300 border-white/10 hover:text-white"
                            }`}
                          >
                            {t === "Home" && "🏠 "}
                            {t === "Work" && "🏢 "}
                            {t}
                          </button>
                        ))}
                      </div>

                      {/* Save to Profile Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={saveToProfile}
                          onChange={(e) => setSaveToProfile(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 bg-white/10 border-white/20"
                        />
                        <span>Save to profile for future orders</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT COLUMN: ORDER SUMMARY & PAYMENT (5 cols) ================= */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6 sticky top-28">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-gray-400">
                  {item.quantity} {item.quantity === 1 ? "item" : "items"}
                </span>
              </h2>

              {/* Product Preview Card */}
              <div className="flex items-center gap-3.5 bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
                  <Image
                    src={item.product.image1}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm line-clamp-1">
                    {item.product.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                    {item.size && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-semibold">
                        Size: {item.size}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ₹ {item.product.price?.toLocaleString("en-IN")} each
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-sm text-emerald-400">
                    ₹ {productsTotal.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs text-gray-300 pt-1">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-white">
                    ₹ {productsTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Express Delivery</span>
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-400 font-bold uppercase tracking-wider">
                      FREE
                    </span>
                  ) : (
                    <span className="font-semibold text-white">₹ {deliveryCharge}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Platform & Processing Fee</span>
                  <span className="font-semibold text-white">₹ {serviceCharge}</span>
                </div>

                <div className="border-t border-white/15 pt-3.5 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-white block">Total Payable</span>
                    <span className="text-[11px] text-gray-400 font-normal">
                      Inclusive of all taxes
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹ {finalTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* COD Button */}
                  <button
                    type="button"
                    disabled={codDisabled}
                    onClick={() => setPaymentMode("cod")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center ${
                      paymentMode === "cod"
                        ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-300 hover:border-white/20"
                    } ${codDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <FaMoneyBillWave
                      className={paymentMode === "cod" ? "text-emerald-400" : "text-gray-400"}
                      size={20}
                    />
                    <span className="text-xs font-bold">Cash on Delivery</span>
                    <span className="text-[10px] text-gray-400">
                      {codDisabled ? "Not Available" : "Pay at Doorstep"}
                    </span>
                  </button>

                  {/* Stripe Button */}
                  <button
                    type="button"
                    onClick={() => setPaymentMode("stripe")}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 text-center ${
                      paymentMode === "stripe"
                        ? "bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/20 text-white"
                        : "bg-white/[0.03] border-white/10 text-gray-300 hover:border-white/20"
                    }`}
                  >
                    <FaStripe
                      className={paymentMode === "stripe" ? "text-blue-400" : "text-gray-400"}
                      size={28}
                    />
                    <span className="text-xs font-bold">Card / Online</span>
                    <span className="text-[10px] text-gray-400">Instant & Secure</span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-extrabold text-base shadow-xl shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {orderLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <FiLock size={16} />
                    <span>
                      {paymentMode === "cod" ? "Confirm & Place Order" : "Proceed to Pay Securely"}
                    </span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[10px] text-gray-400 text-center">
                <div className="flex flex-col items-center gap-1">
                  <FiTruck size={14} className="text-blue-400" />
                  <span>Express Dispatch</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <FiRotateCcw size={14} className="text-emerald-400" />
                  <span>Easy Returns</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <FiShield size={14} className="text-purple-400" />
                  <span>100% Genuine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
