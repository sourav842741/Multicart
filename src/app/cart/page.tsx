"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import Navbar from "@/component/nav";
import Link from "next/link";

export default function UserCartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getCart = async () => {
    try {
      const res = await axios.get("/api/cart/get");
      setCart(res.data.cart || []);
    } catch (error) {
      console.log("Cart fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCart();
  }, []);

  const handleRemoveFromCart = async (productId: string, size?: string) => {
    setCart((prev) =>
      prev.filter(
        (i) => !(i.product._id === productId && (size ? i.size === size : true))
      )
    );
    await axios.post("/api/cart/remove", { productId, size });
  };

  const handleUpdateQuantity = async (
    productId: string,
    quantity: number,
    size?: string
  ) => {
    if (quantity < 1) return;
    await axios.post("/api/cart/update", {
      productId,
      quantity,
      size,
    });
    getCart();
  };

  const grandTotal = cart.reduce(
    (sum, item) => sum + (item.product?.price || 0) * (item.quantity || 1),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white">
        <Navbar />
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-4xl mb-4">
            🛒
          </div>
          <h2 className="text-2xl font-bold mb-2">Your Shopping Cart is Empty</h2>
          <p className="text-gray-400 max-w-sm mb-6 text-sm">
            Looks like you haven't added anything yet. Explore top categories and discover authentic products.
          </p>
          <Link
            href="/category"
            className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
          >
            Explore Categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Shopping Cart</h1>
            <p className="text-xs text-gray-400 mt-1">
              {cart.length} {cart.length === 1 ? "item" : "items"} in your cart
            </p>
          </div>
          <Link
            href="/category"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ITEMS LIST (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item, index) => {
              const itemTotal = (item.product?.price || 0) * item.quantity;
              const cartKey = `${item.product?._id || index}-${item.size || "default"}`;

              return (
                <div
                  key={cartKey}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-white/20 transition-all backdrop-blur-md"
                >
                  <div className="flex gap-4 items-center">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
                      <Image
                        src={item.product?.image1 || "/placeholder.png"}
                        alt={item.product?.title || "Product"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <Link
                        href={`/view-product/${item.product?._id}`}
                        className="font-bold text-white hover:text-blue-400 transition-colors line-clamp-1 text-sm sm:text-base"
                      >
                        {item.product?.title}
                      </Link>

                      <p className="text-sm font-semibold text-emerald-400">
                        ₹ {item.product?.price?.toLocaleString("en-IN")}
                      </p>

                      {/* SIZE BADGE */}
                      {item.size ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
                          <span>Size:</span>
                          <span className="font-bold">{item.size}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    {/* QUANTITY SELECTOR */}
                    <div className="flex items-center border border-white/20 rounded-xl bg-white/[0.04]">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product._id,
                            item.quantity - 1,
                            item.size
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item.product._id,
                            item.quantity + 1,
                            item.size
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* ITEM PRICE TOTAL */}
                    <div className="text-right">
                      <p className="font-bold text-base text-white">
                        ₹ {itemTotal.toLocaleString("en-IN")}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveFromCart(item.product._id, item.size)
                        }
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors mt-0.5 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5 sticky top-28">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">
                Order Summary
              </h2>

              <div className="space-y-2.5 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">₹ {grandTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Estimate</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-white">₹ 30</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between text-base font-bold text-white">
                  <span>Estimated Total</span>
                  <span className="text-emerald-400">₹ {(grandTotal + 30).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => router.push(`/checkout/${cart[0].product._id}`)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-sm shadow-xl shadow-blue-500/25 transition-all cursor-pointer text-center"
                >
                  Proceed to Checkout
                </button>
              )}

              <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
                🔒 Safe & Secure 256-Bit SSL Checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
