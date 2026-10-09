"use client";

import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import getAllVendorData from "@/hooks/getAllVendorData";
import getAllOrdersData from "@/hooks/getAllOrderData";
import {
  FiUsers,
  FiShoppingBag,
  FiBox,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiArrowUpRight,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";
import { FaStore } from "react-icons/fa";

export default function AdminDashboardPage() {
  getAllVendorData();
  getAllOrdersData();

  const { allVendorData, allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );
  const { allOrderData } = useSelector(
    (state: RootState) => state.order
  );

  // Deduplicate and sanitize vendors list
  const vendors = useMemo(() => {
    const list = allVendorData || [];
    const seen = new Set<string>();
    return list.filter((v: any) => {
      const key = (v.email || v.shopName || v._id).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allVendorData]);

  const pendingVendors = useMemo(
    () => vendors.filter((v: any) => v.verificationStatus === "pending"),
    [vendors]
  );

  const pendingProducts = useMemo(
    () =>
      (allProductsData || []).filter(
        (p: any) => p.verificationStatus === "pending"
      ),
    [allProductsData]
  );

  const deliveredOrders = useMemo(
    () => (allOrderData || []).filter((o: any) => o.orderStatus === "delivered"),
    [allOrderData]
  );
  const cancelledOrders = useMemo(
    () => (allOrderData || []).filter((o: any) => o.orderStatus === "cancelled"),
    [allOrderData]
  );
  const returnedOrders = useMemo(
    () => (allOrderData || []).filter((o: any) => o.orderStatus === "returned"),
    [allOrderData]
  );
  const activeProcessingOrders = useMemo(
    () =>
      (allOrderData || []).filter(
        (o: any) =>
          !["delivered", "cancelled", "returned"].includes(o.orderStatus)
      ),
    [allOrderData]
  );

  // Financial calculations
  const grossSalesVolume = useMemo(() => {
    return (allOrderData || [])
      .filter((o: any) => !["cancelled", "returned"].includes(o.orderStatus))
      .reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);
  }, [allOrderData]);

  const realizedDeliveredEarnings = useMemo(() => {
    return deliveredOrders
      .filter((o: any) => o.isPaid)
      .reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0);
  }, [deliveredOrders]);

  const estimatedPlatformCommission = useMemo(() => {
    return Math.round(grossSalesVolume * 0.1); // 10% Platform fee
  }, [grossSalesVolume]);

  // Vendor analytics mapping
  const vendorStats = useMemo(() => {
    return vendors.map((vendor: any) => {
      const vId = String(vendor._id || "");
      const vEmail = (vendor.email || "").toLowerCase();
      const vShop = (vendor.shopName || "").trim().toLowerCase();

      const isMatch = (itemRef: any) => {
        const id = String(itemRef?._id || itemRef || "");
        if (id && vId && id === vId) return true;
        if (itemRef?.email && vEmail && itemRef.email.toLowerCase() === vEmail)
          return true;
        if (
          itemRef?.shopName &&
          vShop &&
          itemRef.shopName.trim().toLowerCase() === vShop
        )
          return true;
        return false;
      };

      const vendorProducts = (allProductsData || []).filter((p: any) =>
        isMatch(p.vendor)
      );

      const vendorOrders = (allOrderData || []).filter((o: any) => {
        if (isMatch(o.productVendor)) return true;
        if (Array.isArray(o.products)) {
          return o.products.some((p: any) => isMatch(p.product?.vendor));
        }
        return false;
      });

      const cancelled = vendorOrders.filter(
        (o: any) => o.orderStatus === "cancelled"
      ).length;

      const returned = vendorOrders.filter(
        (o: any) => o.orderStatus === "returned"
      ).length;

      const grossVolume = vendorOrders
        .filter((o: any) => !["cancelled", "returned"].includes(o.orderStatus))
        .reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

      const deliveredVolume = vendorOrders
        .filter((o: any) => o.orderStatus === "delivered" && o.isPaid)
        .reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);

      return {
        ...vendor,
        productsCount: vendorProducts.length,
        ordersCount: vendorOrders.length,
        cancelled,
        returned,
        grossVolume,
        deliveredVolume,
      };
    });
  }, [vendors, allProductsData, allOrderData]);

  // Graph data: Merchant-wise order distribution
  const vendorOrderGraph = useMemo(() => {
    return vendorStats.map((v) => ({
      vendor:
        v.shopName && v.shopName.length > 15
          ? v.shopName.slice(0, 15) + "..."
          : v.shopName || "Unknown",
      orders: v.ordersCount,
      volume: v.grossVolume,
    }));
  }, [vendorStats]);

  // Pie chart: Status distribution
  const orderProgress = useMemo(
    () => [
      { name: "Delivered", value: deliveredOrders.length },
      { name: "In Progress", value: activeProcessingOrders.length },
      { name: "Cancelled", value: cancelledOrders.length },
      { name: "Returned", value: returnedOrders.length },
    ],
    [
      deliveredOrders.length,
      activeProcessingOrders.length,
      cancelledOrders.length,
      returnedOrders.length,
    ]
  );

  const PIE_COLORS = ["#10b981", "#3b82f6", "#ef4444", "#f59e0b"];

  return (
    <div className="min-h-screen w-full px-2 sm:px-6 py-6 text-gray-100 space-y-8">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-gray-900/90 via-black to-gray-900/90 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
              Super Admin Control
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Platform Healthy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            MultiCart Administration Hub
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Executive oversight of marketplace merchants, real-time transaction volume, and operational compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-300">
            Platform Fee: <b className="text-emerald-400 font-bold">10% Commission</b>
          </div>
        </div>
      </div>

      {/* ================= EXECUTIVE STATS GRID ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <ExecutiveStatCard
          title="Gross Platform Volume"
          value={`₹${grossSalesVolume.toLocaleString("en-IN")}`}
          subtext="Total order GMV"
          accentColor="text-emerald-400"
          icon={<FiTrendingUp className="text-emerald-400 w-4 h-4" />}
          bgGlow="from-emerald-500/10"
        />

        <ExecutiveStatCard
          title="Total Orders"
          value={(allOrderData || []).length}
          subtext={`${activeProcessingOrders.length} active in-flight`}
          accentColor="text-blue-400"
          icon={<FiShoppingBag className="text-blue-400 w-4 h-4" />}
          bgGlow="from-blue-500/10"
        />

        <ExecutiveStatCard
          title="Platform Earnings"
          value={`₹${estimatedPlatformCommission.toLocaleString("en-IN")}`}
          subtext="Est. 10% fee share"
          accentColor="text-purple-400"
          icon={<FiDollarSign className="text-purple-400 w-4 h-4" />}
          bgGlow="from-purple-500/10"
        />

        <ExecutiveStatCard
          title="Active Merchants"
          value={vendors.length}
          subtext={`${pendingVendors.length} pending review`}
          accentColor="text-indigo-400"
          icon={<FaStore className="text-indigo-400 w-4 h-4" />}
          bgGlow="from-indigo-500/10"
        />

        <ExecutiveStatCard
          title="Catalog Products"
          value={(allProductsData || []).length}
          subtext={`${pendingProducts.length} pending approval`}
          accentColor="text-cyan-400"
          icon={<FiBox className="text-cyan-400 w-4 h-4" />}
          bgGlow="from-cyan-500/10"
        />

        <ExecutiveStatCard
          title="Settled Revenue"
          value={`₹${realizedDeliveredEarnings.toLocaleString("en-IN")}`}
          subtext={`${deliveredOrders.length} delivered & paid`}
          accentColor="text-green-400"
          icon={<FiCheckCircle className="text-green-400 w-4 h-4" />}
          bgGlow="from-green-500/10"
        />
      </div>

      {/* ================= MERCHANTS PERFORMANCE CARDS ================= */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <FaStore className="text-blue-400 w-5 h-5" />
              <span>Merchant Ecosystem Overview</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Performance breakdown, active catalog volume, and sales by onboarded store.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            {vendors.length} Onboarded Vendors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vendorStats.map((vendor: any) => {
            const isApproved = vendor.verificationStatus === "approved";
            const initials = (vendor.shopName || "Vendor")
              .split(" ")
              .slice(0, 2)
              .map((n: string) => n[0])
              .join("")
              .toUpperCase();

            return (
              <motion.div
                key={vendor._id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4 group transition-all"
              >
                <div>
                  {/* STORE HEADER & LOGO */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600/30 to-purple-600/30 border border-blue-500/30 flex items-center justify-center font-extrabold text-blue-300 text-sm flex-shrink-0 shadow-inner group-hover:border-blue-400 transition-colors">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-300 transition-colors">
                          {vendor.shopName || "Store Name"}
                        </h3>
                        <p className="text-[11px] text-gray-400 truncate">
                          {vendor.name || vendor.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border flex items-center gap-1 ${
                        isApproved
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {isApproved ? "Approved" : "Pending"}
                    </span>
                  </div>

                  {/* 4-METRIC STATS GRID */}
                  <div className="grid grid-cols-2 gap-2 bg-black/40 border border-white/5 rounded-xl p-3">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        Products
                      </span>
                      <p className="text-sm font-bold text-white">
                        {vendor.productsCount} items
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        Orders
                      </span>
                      <p className="text-sm font-bold text-blue-400">
                        {vendor.ordersCount} orders
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        Gross Volume
                      </span>
                      <p className="text-sm font-bold text-emerald-400">
                        ₹{vendor.grossVolume.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        Returns
                      </span>
                      <p
                        className={`text-sm font-bold ${
                          vendor.cancelled + vendor.returned > 0
                            ? "text-rose-400"
                            : "text-gray-400"
                        }`}
                      >
                        {vendor.cancelled + vendor.returned} issues
                      </p>
                    </div>
                  </div>
                </div>

                {/* FOOTER: GST & SETTLED */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400 font-mono">
                    GST: {vendor.gstNumber ? vendor.gstNumber.slice(0, 8) + "..." : "Registered"}
                  </span>
                  <span className="text-green-400 font-bold">
                    Settled: ₹{vendor.deliveredVolume.toLocaleString("en-IN")}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ================= CHARTS SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BAR CHART: MERCHANT-WISE ORDERS (7 COLS) */}
        <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FiShoppingBag className="text-blue-400 w-4 h-4" />
                Storefront Sales & Orders by Merchant
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Comparison of order count across registered merchant stores.
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              Live Flow
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vendorOrderGraph}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis
                  dataKey="vendor"
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d131f",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                />
                <Bar
                  dataKey="orders"
                  name="Orders Count"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE CHART: ORDER STATUS DISTRIBUTION (5 COLS) */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FiCheckCircle className="text-emerald-400 w-4 h-4" />
                Order Pipeline & Status Breakdown
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Current platform fulfillment distribution.
              </p>
            </div>
          </div>

          {/* STATUS PILLS GRID */}
          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Delivered</span>
              <p className="text-base font-extrabold text-emerald-400">
                {deliveredOrders.length}
              </p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold">In Progress</span>
              <p className="text-base font-extrabold text-blue-400">
                {activeProcessingOrders.length}
              </p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Cancelled</span>
              <p className="text-base font-extrabold text-rose-400">
                {cancelledOrders.length}
              </p>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Returned</span>
              <p className="text-base font-extrabold text-amber-400">
                {returnedOrders.length}
              </p>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderProgress}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {orderProgress.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0d131f",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================= RECENT PLATFORM ORDERS FEED ================= */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FiShoppingBag className="text-purple-400 w-5 h-5" />
              Recent Marketplace Orders
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Live customer transactions flowing across all verified vendor shops.
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-400">
            Total {(allOrderData || []).length} orders logged
          </span>
        </div>

        {allOrderData && allOrderData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10 text-xs font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Merchant Store</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-center">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allOrderData.slice(0, 5).map((order: any) => (
                  <tr key={order._id} className="hover:bg-white/[0.02] text-xs transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-300">
                      #{order._id.slice(-8)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {order.address?.name || "Customer"}
                      <div className="text-[11px] text-gray-400 font-normal">
                        {order.address?.phone}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20 font-medium">
                        {order.productVendor?.shopName || "Official Store"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-gray-300">
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Card"}
                      </span>
                      <span className="text-gray-500 text-[10px] block">
                        {order.isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.orderStatus === "delivered"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : order.orderStatus === "pending"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-xs bg-black/20 rounded-xl">
            No customer orders placed on the platform yet.
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= EXECUTIVE STAT CARD COMPONENT ================= */
function ExecutiveStatCard({
  title,
  value,
  subtext,
  accentColor,
  icon,
  bgGlow,
}: {
  title: string;
  value: any;
  subtext: string;
  accentColor: string;
  icon: React.ReactNode;
  bgGlow: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${bgGlow} via-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col justify-between shadow-lg backdrop-blur-md space-y-2`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {title}
        </span>
        <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div>
        <p className={`text-xl sm:text-2xl font-black ${accentColor} tracking-tight`}>
          {value}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{subtext}</p>
      </div>
    </div>
  );
}
