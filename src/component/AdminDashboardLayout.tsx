"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

// Icons
import { MdDashboard } from "react-icons/md";
import {
  FaStore,
  FaShoppingBag,
  FaCheckCircle,
  FaBox,
  FaShieldAlt,
} from "react-icons/fa";
import { AiOutlineMenu, AiOutlineClose } from "react-icons/ai";
import { FiActivity, FiLayers } from "react-icons/fi";

import VendorRequest from "./vendorRequest";
import VendorDetails from "./VendorDetails";
import ProductRequest from "./ProductRequest";
import AllOrdersPage from "./allOrderAdmin";
import AdminDashboardPage from "./adminDashbordComponent";

export default function AdminDashbordLayout() {
  const [activePage, setActivePage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const { allVendorData, allProductsData } = useSelector(
    (state: RootState) => state.vendor
  );
  const { allOrderData } = useSelector((state: RootState) => state.order);

  const pendingVendorsCount = (allVendorData || []).filter(
    (v: any) => v.verificationStatus === "pending"
  ).length;

  const pendingProductsCount = (allProductsData || []).filter(
    (p: any) => p.verificationStatus === "pending"
  ).length;

  const totalOrdersCount = (allOrderData || []).length;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <AdminDashboardPage />;
      case "vendors":
        return <VendorDetails />;
      case "orders":
        return <AllOrdersPage />;
      case "vendor-approval":
        return <VendorRequest />;
      case "product-approval":
        return <ProductRequest />;
      default:
        return <AdminDashboardPage />;
    }
  };

  const menu = [
    {
      id: "dashboard",
      label: "Overview Dashboard",
      icon: <MdDashboard size={20} />,
      badge: null,
    },
    {
      id: "vendors",
      label: "Approved Merchants",
      icon: <FaStore size={18} />,
      badge: (allVendorData || []).length ? `${(allVendorData || []).length}` : null,
    },
    {
      id: "orders",
      label: "Customer Orders",
      icon: <FaShoppingBag size={18} />,
      badge: totalOrdersCount ? `${totalOrdersCount}` : null,
    },
    {
      id: "vendor-approval",
      label: "Vendor Verification",
      icon: <FaCheckCircle size={18} />,
      badge: pendingVendorsCount > 0 ? `${pendingVendorsCount}` : null,
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    },
    {
      id: "product-approval",
      label: "Product Catalog Requests",
      icon: <FaBox size={18} />,
      badge: pendingProductsCount > 0 ? `${pendingProductsCount}` : null,
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    },
  ];

  return (
    <div className="w-full flex min-h-screen bg-gradient-to-br from-gray-950 via-[#070a13] to-black text-gray-100">
      {/* ---------------- MOBILE TOP BAR ---------------- */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-black/90 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/10 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            MC
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Admin Console</h1>
            <p className="text-[10px] text-gray-400">Super Administrator</p>
          </div>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white"
        >
          {menuOpen ? <AiOutlineClose size={22} /> : <AiOutlineMenu size={22} />}
        </button>
      </div>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex flex-col justify-between w-72 bg-gradient-to-b from-white/[0.04] via-black/40 to-white/[0.02] border-r border-white/10 p-6 backdrop-blur-xl shadow-2xl flex-shrink-0"
      >
        <div>
          {/* SIDEBAR BRAND HEADER */}
          <div className="pb-6 border-b border-white/10 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center font-extrabold text-white text-sm shadow-lg shadow-blue-500/30">
              MC
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-extrabold text-white tracking-wide">
                  Admin Portal
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium">
                MultiCart Operations
              </p>
            </div>
          </div>

          {/* MENU ITEMS */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2 block">
              Platform Controls
            </span>
            {menu.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-xs font-bold cursor-pointer group ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30"
                      : "bg-white/[0.02] hover:bg-white/[0.06] text-gray-300 hover:text-white border border-transparent hover:border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-blue-400"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        item.badgeColor ||
                        (isActive
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-white/5 text-gray-400 border-white/10")
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <div className="text-[11px]">
              <span className="font-semibold text-white block">Escrow & Payments</span>
              <span className="text-gray-400">All systems online</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 text-center">
            MultiCart Platform v2.4 • Enterprise Security
          </p>
        </div>
      </motion.aside>

      {/* ---------------- MOBILE SIDEBAR DRAWER ---------------- */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden fixed top-0 left-0 w-72 h-full bg-[#0a0f1c]/95 backdrop-blur-2xl p-6 z-50 border-r border-white/10 flex flex-col justify-between shadow-2xl"
          >
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    MC
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Admin Console</h2>
                    <p className="text-[10px] text-gray-400">Super Admin</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg bg-white/5"
                >
                  <AiOutlineClose size={20} />
                </button>
              </div>

              <div className="space-y-2">
                {menu.map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                          : "bg-white/5 text-gray-300 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[10px] text-gray-500 text-center pt-4 border-t border-white/10">
              MultiCart Super Admin Platform
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- MAIN VIEWPORT ---------------- */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 mt-16 lg:mt-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
