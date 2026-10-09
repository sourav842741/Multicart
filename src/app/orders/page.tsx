"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { setAllOrderData } from "@/redux/orderSlice";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  FiTruck,
  FiPackage,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiRotateCcw,
  FiSearch,
  FiCopy,
  FiCheck,
  FiShield,
  FiFileText,
  FiMapPin,
  FiPhone,
  FiShoppingBag,
} from "react-icons/fi";
import Navbar from "@/component/nav";

export default function OrdersPage() {
  const dispatch = useDispatch<AppDispatch>();

  const { userData } = useSelector((state: RootState) => state.user);
  const { allOrderData } = useSelector((state: RootState) => state.order);

  const [loading, setLoading] = useState(true);
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackOrderModal, setTrackOrderModal] = useState<any | null>(null);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await axios.get("/api/order/allOrder");
        const orders = Array.isArray(result.data)
          ? result.data
          : result.data.orders || [];

        dispatch(setAllOrderData(orders));
      } catch (err) {
        console.log("Order Fetch Error:", err);
        dispatch(setAllOrderData([]));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dispatch]);

  useEffect(() => {
    setLocalOrders(allOrderData || []);
  }, [allOrderData]);

  // Filter Orders for logged-in user
  const userOrders = useMemo(() => {
    if (!userData) return [];
    return localOrders.filter((o) => {
      const buyerId = o?.buyer?._id ?? o.buyer;
      return String(buyerId) === String(userData._id);
    });
  }, [localOrders, userData]);

  // Filter by Status and Search
  const filteredOrders = useMemo(() => {
    return userOrders.filter((order) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "returned_or_cancelled") {
          if (order.orderStatus !== "returned" && order.orderStatus !== "cancelled") {
            return false;
          }
        } else if (order.orderStatus !== statusFilter) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const orderId = String(order._id).toLowerCase();
        const vendor = (order.productVendor?.shopName || "").toLowerCase();
        const hasProductMatch = order.products?.some((p: any) =>
          (p.product?.title || "").toLowerCase().includes(query)
        );

        if (!orderId.includes(query) && !vendor.includes(query) && !hasProductMatch) {
          return false;
        }
      }

      return true;
    });
  }, [userOrders, statusFilter, searchQuery]);

  // Format date helper
  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Return Eligibility
  const isReturnEligible = (deliveryDate: string, replacementDays: number) => {
    if (!deliveryDate || !replacementDays) return false;
    const deliveredAt = new Date(deliveryDate).getTime();
    const expiry = deliveredAt + replacementDays * 24 * 60 * 60 * 1000;
    return Date.now() <= expiry;
  };

  const getRemainingReturnDays = (deliveryDate: string, replacementDays: number) => {
    if (!deliveryDate || !replacementDays) return 0;
    const deliveredAt = new Date(deliveryDate).getTime();
    const expiry = deliveredAt + replacementDays * 24 * 60 * 60 * 1000;
    const diff = expiry - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  const getReturnEndDate = (deliveryDate: string, replacementDays: number) => {
    if (!deliveryDate || !replacementDays) return null;
    const deliveredAt = new Date(deliveryDate);
    deliveredAt.setDate(deliveredAt.getDate() + replacementDays);
    return deliveredAt;
  };

  const handleReturnOrder = async (orderId: string) => {
    try {
      const res = await axios.post("/api/order/return", { orderId });
      const returnedOrder = res.data.order;

      const updatedOrders = localOrders.map((o: any) =>
        o._id === orderId
          ? {
              ...o,
              orderStatus: "returned",
              returnedAmount: returnedOrder.returnedAmount,
            }
          : o
      );

      alert(`✅ Order returned successfully. Refund initiated: ₹${returnedOrder.returnedAmount}`);
      setSelectedOrder(null);
      setLocalOrders(updatedOrders);
      dispatch(setAllOrderData(updatedOrders));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Return failed");
    }
  };

  const isCancelDisabled = (order: any) =>
    order.isPaid === true && order.paymentMethod === "stripe";

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await axios.post("/api/order/cancel", { orderId });
      const updatedOrders = localOrders.map((o: any) =>
        o._id === orderId ? { ...o, orderStatus: "cancelled" } : o
      );
      alert("✅ Order cancelled successfully");
      setSelectedOrder(null);
      setLocalOrders(updatedOrders);
      dispatch(setAllOrderData(updatedOrders));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Cancel failed");
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FiCheckCircle size={13} /> Delivered
          </span>
        );
      case "shipped":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FiTruck size={13} /> On the Way
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <FiPackage size={13} /> Confirmed
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <FiClock size={13} /> Processing Order
          </span>
        );
      case "returned":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <FiRotateCcw size={13} /> Returned
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <FiXCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-300">
            {status}
          </span>
        );
    }
  };

  // Tracking Stepper Component
  const trackSteps = [
    { key: "pending", label: "Order Placed", desc: "We have received your order" },
    { key: "confirmed", label: "Confirmed by Vendor", desc: "Vendor accepted and verified" },
    { key: "shipped", label: "Shipped & In Transit", desc: "Courier partner picked up package" },
    { key: "delivered", label: "Delivered", desc: "Package delivered to your doorstep" },
  ];

  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const orderIndex = trackSteps.findIndex((s) => s.key === currentStatus);
    const stepIndex = trackSteps.findIndex((s) => s.key === stepKey);

    if (currentStatus === "cancelled") return "cancelled";
    if (currentStatus === "returned") return "returned";

    if (stepIndex < orderIndex) return "completed";
    if (stepIndex === orderIndex) return "current";
    return "upcoming";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-48 gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                My Orders
              </h1>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                {userOrders.length} {userOrders.length === 1 ? "order" : "orders"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Track shipments, download invoices, and manage returns & cancellations.
            </p>
          </div>

          <Link
            href="/category"
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all w-fit flex items-center gap-1.5"
          >
            <FiShoppingBag />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* ================= SEARCH & STATUS TABS ================= */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Box */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, Product name, or Store..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/[0.04] border border-white/15 focus:border-blue-500 text-white placeholder-gray-500 text-sm outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Processing" },
              { key: "confirmed", label: "Confirmed" },
              { key: "shipped", label: "Shipped" },
              { key: "delivered", label: "Delivered" },
              { key: "returned_or_cancelled", label: "Returned / Cancelled" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-3 rounded-2xl font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  statusFilter === tab.key
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25"
                    : "bg-white/[0.04] text-gray-300 border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= ORDERS LIST ================= */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4 bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-3xl backdrop-blur-xl">
            <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-3xl mx-auto mb-4">
              📦
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {searchQuery || statusFilter !== "all"
                ? "No matching orders found"
                : "You haven't placed any orders yet"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search terms or filter to see more orders."
                : "Browse our trending collections and experience effortless shopping with fast delivery."}
            </p>
            <Link
              href="/category"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-sm shadow-lg shadow-blue-500/25 transition-all inline-block"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order: any) => {
              const orderIdString = String(order._id);
              const shortId = orderIdString.slice(-8);
              const vendorName = order.productVendor?.shopName || "MultiCart Official Store";

              return (
                <div
                  key={order._id}
                  className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-5 sm:p-7 backdrop-blur-xl hover:border-white/20 transition-all shadow-xl space-y-5"
                >
                  {/* Card Header Strip */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Order ID Pill with Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyId(orderIdString)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-xs font-mono font-bold text-white transition-colors cursor-pointer group"
                        title="Click to copy full order ID"
                      >
                        <span>#{shortId}</span>
                        {copiedId === orderIdString ? (
                          <FiCheck className="text-emerald-400" size={12} />
                        ) : (
                          <FiCopy className="text-gray-400 group-hover:text-white" size={12} />
                        )}
                      </button>

                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <FiCalendar size={13} />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>

                      {/* Vendor Store Tag */}
                      <span className="text-xs text-gray-300 bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5">
                        🏪 {vendorName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3">
                      {/* Payment Method Badge */}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-gray-300">
                        {order.paymentMethod === "stripe" ? "💳 Card (Paid)" : "💵 COD"}
                      </span>

                      {/* Status Badge */}
                      {renderStatusBadge(order.orderStatus)}
                    </div>
                  </div>

                  {/* Products Grid Inside Card */}
                  <div className="space-y-3">
                    {order.products.map((p: any, idx: number) => {
                      const productTitle = p.product?.title || "Product";
                      const productImage =
                        p.product?.image1 || "/placeholder.png";

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {/* Product Thumbnail */}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
                              <Image
                                src={productImage}
                                alt={productTitle}
                                fill
                                className="object-cover"
                              />
                            </div>

                            <div className="min-w-0">
                              {p.product?._id ? (
                                <Link
                                  href={`/view-product/${p.product._id}`}
                                  className="font-bold text-sm sm:text-base text-white hover:text-blue-400 transition-colors line-clamp-1 block"
                                >
                                  {productTitle}
                                </Link>
                              ) : (
                                <h4 className="font-bold text-sm sm:text-base text-white line-clamp-1">
                                  {productTitle}
                                </h4>
                              )}

                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">
                                  Qty: <strong className="text-white">{p.quantity}</strong>
                                </span>

                                {/* SIZE BADGE */}
                                {p.size && (
                                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-bold">
                                    Size: {p.size}
                                  </span>
                                )}

                                <span className="text-xs text-gray-400">
                                  ₹ {p.price?.toLocaleString("en-IN")} each
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-extrabold text-sm sm:text-base text-white">
                              ₹ {(p.price * p.quantity).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Bottom Summary & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-gray-400">Total Order Amount:</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400">
                        ₹ {order.totalAmount?.toLocaleString("en-IN")}
                      </span>
                      {order.returnedAmount > 0 && (
                        <span className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
                          Refunded: ₹{order.returnedAmount}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <FiFileText size={14} />
                        <span>View Details</span>
                      </button>

                      {order.orderStatus !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => setTrackOrderModal(order)}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <FiTruck size={14} />
                          <span>Track Shipment</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= CHECK DETAILS / INVOICE MODAL ================= */}
        <AnimatePresence>
          {selectedOrder && (
            <div
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-2xl bg-neutral-900 border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl my-8 space-y-6"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      Order Invoice & Breakdown
                    </span>
                    <h3 className="text-xl font-extrabold text-white">
                      Order #{String(selectedOrder._id).slice(-10)}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Placed on {formatDate(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Items Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Ordered Items
                  </h4>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {selectedOrder.products.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white/[0.03] p-3 rounded-2xl border border-white/5 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800 border border-white/10 flex-shrink-0">
                            <Image
                              src={p.product?.image1 || "/placeholder.png"}
                              alt="thumb"
                              fill
                              className="object-cover"
                            />
                          </div>

                          <div>
                            <p className="font-bold text-white line-clamp-1">
                              {p.product?.title || "Item"}
                            </p>
                            <p className="text-gray-400 text-[11px] mt-0.5">
                              Qty: {p.quantity} • ₹ {p.price?.toLocaleString("en-IN")} each
                              {p.size && (
                                <span className="ml-2 font-bold text-blue-400">
                                  Size: {p.size}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <span className="font-extrabold text-white text-sm">
                          ₹ {(p.price * p.quantity).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address Card */}
                {selectedOrder.address && (
                  <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 space-y-1.5 text-xs">
                    <span className="font-bold text-gray-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FiMapPin className="text-blue-400" /> Delivery Address
                    </span>
                    <p className="font-bold text-white text-sm">{selectedOrder.address.name}</p>
                    <p className="text-gray-300">
                      {selectedOrder.address.address}, {selectedOrder.address.city} -{" "}
                      {selectedOrder.address.pincode}
                    </p>
                    <p className="text-gray-400">📞 Phone: {selectedOrder.address.phone}</p>
                  </div>
                )}

                {/* Billing Summary */}
                <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 space-y-2 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Products Subtotal</span>
                    <span className="font-semibold text-white">
                      ₹ {selectedOrder.productsTotal?.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-white">
                      ₹ {selectedOrder.deliveryCharge}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service & Handling Fee</span>
                    <span className="font-semibold text-white">
                      ₹ {selectedOrder.serviceCharge}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-2 flex justify-between text-base font-bold text-white">
                    <span>Total Amount Paid</span>
                    <span className="text-emerald-400">
                      ₹ {selectedOrder.totalAmount?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Return / Cancel Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-400">
                    Payment Method:{" "}
                    <strong className="text-white uppercase">
                      {selectedOrder.paymentMethod}
                    </strong>
                  </div>

                  <div className="flex gap-2">
                    {/* Return Action If Delivered */}
                    {selectedOrder.orderStatus === "delivered" && (
                      <button
                        type="button"
                        onClick={() => handleReturnOrder(selectedOrder._id)}
                        className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white transition-colors cursor-pointer"
                      >
                        Request Return
                      </button>
                    )}

                    {/* Cancel Action If Pending */}
                    {selectedOrder.orderStatus === "pending" && (
                      <button
                        type="button"
                        disabled={isCancelDisabled(selectedOrder)}
                        onClick={() => handleCancelOrder(selectedOrder._id)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white transition-colors cursor-pointer ${
                          isCancelDisabled(selectedOrder)
                            ? "bg-white/10 text-gray-500 cursor-not-allowed"
                            : "bg-rose-600 hover:bg-rose-500"
                        }`}
                      >
                        Cancel Order
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-xs text-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= TRACK SHIPMENT MODAL ================= */}
        <AnimatePresence>
          {trackOrderModal && (
            <div
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
              onClick={() => setTrackOrderModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      Shipment Tracking
                    </span>
                    <h3 className="text-xl font-extrabold text-white">
                      Track Order #{String(trackOrderModal._id).slice(-8)}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTrackOrderModal(null)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Delivery Address Pill */}
                {trackOrderModal.address && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-300 space-y-1">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <FiMapPin className="text-blue-400" /> Delivering To:
                    </span>
                    <p className="font-bold text-white">{trackOrderModal.address.name}</p>
                    <p className="text-gray-400">
                      {trackOrderModal.address.address}, {trackOrderModal.address.city} -{" "}
                      {trackOrderModal.address.pincode}
                    </p>
                  </div>
                )}

                {/* Vertical Stepper Timeline */}
                <div className="py-2 pl-2 space-y-6">
                  {trackSteps.map((step, idx) => {
                    const statusType = getStepStatus(step.key, trackOrderModal.orderStatus);

                    return (
                      <div key={step.key} className="relative flex items-start gap-4">
                        {/* Connecting Line */}
                        {idx < trackSteps.length - 1 && (
                          <div
                            className={`absolute left-4 top-8 w-0.5 h-10 -ml-px ${
                              statusType === "completed"
                                ? "bg-emerald-500"
                                : "bg-white/15"
                            }`}
                          />
                        )}

                        {/* Icon Node */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all flex-shrink-0 z-10 ${
                            statusType === "completed"
                              ? "bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-500/40"
                              : statusType === "current"
                              ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50 animate-pulse"
                              : "bg-neutral-800 border-white/20 text-gray-500"
                          }`}
                        >
                          {statusType === "completed" ? (
                            <FiCheck size={14} />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Label & Description */}
                        <div>
                          <p
                            className={`text-sm font-bold ${
                              statusType === "completed"
                                ? "text-emerald-400"
                                : statusType === "current"
                                ? "text-blue-400"
                                : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setTrackOrderModal(null)}
                  className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 font-bold text-xs text-white transition-colors cursor-pointer"
                >
                  Close Tracking
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
