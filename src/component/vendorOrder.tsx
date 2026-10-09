"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { setAllOrderData } from "@/redux/orderSlice";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  FiSearch,
  FiCopy,
  FiCheck,
  FiPhone,
  FiMapPin,
  FiPackage,
  FiClock,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiDollarSign,
  FiShield,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

export default function VendorOrdersPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { allOrderData } = useSelector((state: RootState) => state.order);
  const { userData } = useSelector((state: RootState) => state.user);

  const [otpModal, setOtpModal] = useState<any>(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/order/allOrder");
      dispatch(setAllOrderData(res.data.orders || res.data || []));
    } catch (err) {
      console.error("Vendor orders fetch error:", err);
      dispatch(setAllOrderData([]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [dispatch]);

  // Robust Vendor Matcher
  const isVendorMatch = (vendorRef: any) => {
    if (!userData) return false;
    const vendorId = String(vendorRef?._id || vendorRef || "");
    const currentId = String(userData._id || "");
    if (vendorId && currentId && vendorId === currentId) return true;
    if (
      vendorRef?.email &&
      userData.email &&
      vendorRef.email.toLowerCase() === userData.email.toLowerCase()
    )
      return true;
    if (
      vendorRef?.shopName &&
      userData.shopName &&
      vendorRef.shopName.trim().toLowerCase() === userData.shopName.trim().toLowerCase()
    )
      return true;
    return false;
  };

  // Filter vendor orders
  const vendorOrders = useMemo(() => {
    if (!userData) return [];
    return (allOrderData || []).filter((o: any) => {
      if (isVendorMatch(o.productVendor)) return true;
      if (Array.isArray(o.products)) {
        return o.products.some((p: any) => isVendorMatch(p.product?.vendor));
      }
      return false;
    });
  }, [allOrderData, userData]);

  // Copy order ID helper
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Status Updater
  const updateStatus = async (orderId: string, status: string) => {
    try {
      setLoadingId(orderId);
      await axios.post("/api/order/update-status", { orderId, status });
      dispatch(
        setAllOrderData(
          allOrderData.map((o: any) =>
            o._id === orderId ? { ...o, orderStatus: status } : o
          )
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  // Initiate Delivery (Requests OTP)
  const handleInitiateDelivery = async (order: any) => {
    try {
      setLoadingId(order._id);
      setOtpError("");
      setOtpSuccess("");
      const res = await axios.post("/api/order/update-status", {
        orderId: order._id,
        status: "delivered",
      });
      setOtpModal({
        ...order,
        debugOtp: res.data?.debugOtp,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to send delivery OTP");
    } finally {
      setLoadingId(null);
    }
  };

  // Verify OTP and complete delivery
  const verifyAndDeliver = async () => {
    if (!otpInput.trim()) {
      setOtpError("Please enter the 4-digit OTP");
      return;
    }
    try {
      setLoadingId(otpModal._id);
      setOtpError("");
      const res = await axios.post("/api/order/verify-delivery-otp", {
        orderId: otpModal._id,
        otp: otpInput.trim(),
      });
      if (res.data.success) {
        dispatch(
          setAllOrderData(
            allOrderData.map((o: any) =>
              o._id === otpModal._id
                ? {
                    ...o,
                    orderStatus: "delivered",
                    isPaid: true,
                    deliveryDate: res.data.deliveryDate,
                  }
                : o
            )
          )
        );
        setOtpSuccess("Order successfully marked as delivered! 🎉");
        setTimeout(() => {
          setOtpModal(null);
          setOtpInput("");
          setOtpSuccess("");
        }, 1500);
      }
    } catch (err: any) {
      setOtpError(
        err.response?.data?.message || "Invalid or expired OTP. Please try again."
      );
    } finally {
      setLoadingId(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = vendorOrders.length;
    const pending = vendorOrders.filter(
      (o: any) => o.orderStatus === "pending"
    ).length;
    const inTransit = vendorOrders.filter((o: any) =>
      ["confirmed", "shipped"].includes(o.orderStatus)
    ).length;
    const delivered = vendorOrders.filter(
      (o: any) => o.orderStatus === "delivered"
    ).length;
    const cancelled = vendorOrders.filter((o: any) =>
      ["cancelled", "returned"].includes(o.orderStatus)
    ).length;
    const revenue = vendorOrders
      .filter((o: any) => !["cancelled", "returned"].includes(o.orderStatus))
      .reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);

    return { total, pending, inTransit, delivered, cancelled, revenue };
  }, [vendorOrders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return vendorOrders.filter((order: any) => {
      // Tab filter
      if (activeTab !== "all" && order.orderStatus !== activeTab) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const orderIdMatch = String(order._id || "").toLowerCase().includes(q);
      const buyerNameMatch = String(order.address?.name || "")
        .toLowerCase()
        .includes(q);
      const buyerPhoneMatch = String(order.address?.phone || "").includes(q);
      const productMatch = (order.products || []).some((p: any) =>
        String(p.product?.title || "").toLowerCase().includes(q)
      );

      return orderIdMatch || buyerNameMatch || buyerPhoneMatch || productMatch;
    });
  }, [vendorOrders, activeTab, searchQuery]);

  if (!userData || userData.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-2xl">
          <FiAlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 text-sm">
            You must be logged in as an approved vendor to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen text-gray-100 p-2 sm:p-6 space-y-6">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900/90 via-black to-gray-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              {userData.shopName || "Vendor Store"}
            </span>
            <span className="text-xs text-gray-400">
              Orders Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Incoming Orders
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review customer purchases, fulfill packages, and verify OTP on delivery.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-200 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ================= SUMMARY STATS PILLS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-2">
            <span>Total Orders</span>
            <FiPackage className="text-blue-400 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics.total}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-2">
            <span>Action Required</span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-amber-400">{metrics.pending}</p>
            <span className="text-xs text-amber-400/80">Pending</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-2">
            <span>In Transit</span>
            <FiTruck className="text-indigo-400 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-indigo-400">{metrics.inTransit}</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-2">
            <span>Delivered</span>
            <FiCheckCircle className="text-emerald-400 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{metrics.delivered}</p>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-300 text-xs font-medium mb-2">
            <span>Net Revenue</span>
            <FiDollarSign className="text-green-400 w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-green-400">
            ₹{metrics.revenue.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* ================= SEARCH & STATUS TABS ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All", count: metrics.total },
            { id: "pending", label: "Pending", count: metrics.pending },
            { id: "confirmed", label: "Confirmed", count: vendorOrders.filter((o: any) => o.orderStatus === "confirmed").length },
            { id: "shipped", label: "Shipped", count: vendorOrders.filter((o: any) => o.orderStatus === "shipped").length },
            { id: "delivered", label: "Delivered", count: metrics.delivered },
            { id: "cancelled", label: "Cancelled", count: metrics.cancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] sm:w-72">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search Order ID, Buyer, Item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* ================= ORDERS LIST ================= */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-gray-400 space-y-3">
          <FiRefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-sm font-medium">Fetching orders from server...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="min-h-[340px] flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-400 mb-4">
            <FiPackage className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Orders Found</h3>
          <p className="text-gray-400 text-sm max-w-sm mb-4">
            {searchQuery
              ? `No orders matching "${searchQuery}". Try clearing search filter.`
              : activeTab !== "all"
              ? `There are no orders with status "${activeTab}".`
              : "When customers order products from your store, they will appear here in real-time."}
          </p>
          {(searchQuery || activeTab !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setActiveTab("all");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: any) => {
            const isProcessing = order.orderStatus === "pending";
            const isConfirmed = order.orderStatus === "confirmed";
            const isShipped = order.orderStatus === "shipped";
            const isDelivered = order.orderStatus === "delivered";
            const isCancelled = order.orderStatus === "cancelled";
            const isReturned = order.orderStatus === "returned";

            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-5 sm:p-6 backdrop-blur-md transition-all shadow-xl"
              >
                {/* TOP BAR: ORDER ID, DATE, PAYMENT, STATUS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/10">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => handleCopyId(order._id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-semibold text-gray-300 hover:text-white transition-all group"
                      title="Click to copy Order ID"
                    >
                      <span>#{order._id.slice(-8)}</span>
                      {copiedId === order._id ? (
                        <FiCheck className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <FiCopy className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
                      )}
                    </button>

                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FiClock className="w-3.5 h-3.5 text-gray-500" />
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    {/* Payment Badge */}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                        order.paymentMethod === "cod"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Paid"}
                      {order.isPaid ? " • Paid" : " • Pending Payment"}
                    </span>
                  </div>

                  {/* Order Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                        isProcessing
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse"
                          : isConfirmed
                          ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                          : isShipped
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                          : isDelivered
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-red-500/10 text-red-300 border-red-500/30"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isProcessing
                            ? "bg-amber-400"
                            : isConfirmed
                            ? "bg-blue-400"
                            : isShipped
                            ? "bg-indigo-400"
                            : isDelivered
                            ? "bg-emerald-400"
                            : "bg-red-400"
                        }`}
                      ></span>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* MIDDLE SECTION: PRODUCTS & BUYER DETAILS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
                  {/* Left: Products List (7 cols) */}
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Ordered Products ({order.products?.length || 0})
                    </h4>
                    <div className="space-y-2.5">
                      {order.products?.map((item: any, idx: number) => {
                        const product = item.product || {};
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3.5 bg-black/40 border border-white/5 rounded-xl p-3"
                          >
                            <div className="w-14 h-14 relative rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                              {product.image1 ? (
                                <Image
                                  src={product.image1}
                                  alt={product.title || "Product"}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <FiPackage className="w-6 h-6" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-white truncate">
                                {product.title || "Product details"}
                              </h5>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {item.size && (
                                  <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded font-medium border border-white/10">
                                    Size: {item.size}
                                  </span>
                                )}
                                <span className="text-xs text-gray-400">
                                  Qty: <b className="text-white">{item.quantity}</b>
                                </span>
                                <span className="text-xs text-gray-400">
                                  @ ₹{(item.price || product.price || 0).toLocaleString("en-IN")} each
                                </span>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-sm font-bold text-white">
                                ₹{((item.price || product.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Customer Shipping & Address (5 cols) */}
                  <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FiMapPin className="text-blue-400 w-3.5 h-3.5" />
                        Shipping Destination
                      </h4>
                      <p className="text-sm font-bold text-white">
                        {order.address?.name || "Customer Name"}
                      </p>
                      <a
                        href={`tel:${order.address?.phone}`}
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-0.5 mb-2"
                      >
                        <FiPhone className="w-3 h-3" />
                        {order.address?.phone || "No phone provided"}
                      </a>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {order.address?.address}
                        {order.address?.city ? `, ${order.address.city}` : ""}
                        {order.address?.pincode ? ` - ${order.address.pincode}` : ""}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                      <span className="text-gray-400">Total Order Value</span>
                      <span className="text-base font-extrabold text-green-400">
                        ₹{(order.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION TOOLBAR */}
                <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <FiShield className="text-blue-400 w-3.5 h-3.5" />
                    <span>
                      Order is safely held in MultiCart escrow system.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Status Workflow Buttons */}
                    {isProcessing && (
                      <button
                        disabled={loadingId === order._id}
                        onClick={() => updateStatus(order._id, "confirmed")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                      >
                        {loadingId === order._id ? "Updating..." : "Accept & Confirm Order"}
                      </button>
                    )}

                    {isConfirmed && (
                      <button
                        disabled={loadingId === order._id}
                        onClick={() => updateStatus(order._id, "shipped")}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <FiTruck className="w-3.5 h-3.5" />
                        {loadingId === order._id ? "Updating..." : "Dispatch / Mark as Shipped"}
                      </button>
                    )}

                    {isShipped && (
                      <button
                        disabled={loadingId === order._id}
                        onClick={() => handleInitiateDelivery(order)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        {loadingId === order._id ? "Sending OTP..." : "Deliver with Customer OTP"}
                      </button>
                    )}

                    {isDelivered && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-400">
                        <FiCheckCircle className="w-4 h-4" />
                        Delivered Successfully
                        {order.deliveryDate && (
                          <span className="text-gray-400 font-normal">
                            ({new Date(order.deliveryDate).toLocaleDateString("en-IN")})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick status override selector for edge cases */}
                    {!isDelivered && !isCancelled && !isReturned && (
                      <div className="relative">
                        <select
                          disabled={loadingId === order._id}
                          value={order.orderStatus}
                          onChange={(e) => {
                            if (e.target.value === "delivered") {
                              handleInitiateDelivery(order);
                            } else {
                              updateStatus(order._id, e.target.value);
                            }
                          }}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                        >
                          <option value="pending" className="bg-gray-900 text-white">Pending</option>
                          <option value="confirmed" className="bg-gray-900 text-white">Confirmed</option>
                          <option value="shipped" className="bg-gray-900 text-white">Shipped</option>
                          <option value="delivered" className="bg-gray-900 text-white">Delivered (OTP)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ================= OTP VERIFICATION MODAL ================= */}
      <AnimatePresence>
        {otpModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-b from-[#0b1728] to-[#040914] border border-blue-500/30 p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                  <FiShield className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Verify Delivery OTP
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Ask the customer (<b>{otpModal.address?.name}</b>) for the 4-digit OTP sent to their email or phone.
                </p>
                {otpModal.debugOtp && (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                    Test Mode Delivery OTP: <b>{otpModal.debugOtp}</b>
                  </div>
                )}
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 4-Digit OTP"
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value);
                    setOtpError("");
                  }}
                  className="w-full text-center text-2xl tracking-[8px] font-bold py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
                {otpError && (
                  <p className="text-red-400 text-xs mt-1.5 text-center">
                    {otpError}
                  </p>
                )}
                {otpSuccess && (
                  <p className="text-emerald-400 text-xs mt-1.5 text-center font-semibold">
                    {otpSuccess}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOtpModal(null);
                    setOtpInput("");
                    setOtpError("");
                  }}
                  className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loadingId === otpModal._id}
                  onClick={verifyAndDeliver}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loadingId === otpModal._id ? (
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FiCheckCircle className="w-3.5 h-3.5" />
                  )}
                  Verify & Complete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
