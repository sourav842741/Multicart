"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineUser } from "react-icons/ai";
import {
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiHome,
  FiBriefcase,
  FiStar,
} from "react-icons/fi";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { setUserData } from "@/redux/userSlice";
import getCurrentUser from "@/hooks/getCurrentUser";
import Navbar from "@/component/nav";

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

export default function ProfilePage() {
  const router = useRouter();
  getCurrentUser();
  const user = useSelector((state: RootState) => state.user.userData);

  const [activeTab, setActiveTab] = useState<"details" | "addresses">("details");

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditShop, setShowEditShop] = useState(false);

  // Edit Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(
    user?.image || "/default-user.png"
  );

  // Shop Details Form State
  const [shopName, setShopName] = useState(user?.shopName || "");
  const [businessAddress, setBusinessAddress] = useState(user?.businessAddress || "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || "");

  // Saved Addresses State
  const [addresses, setAddresses] = useState<ISavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // New Address Form State
  const [newAddrName, setNewAddrName] = useState("");
  const [newAddrPhone, setNewAddrPhone] = useState("");
  const [newAddrAddress, setNewAddrAddress] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("");
  const [newAddrState, setNewAddrState] = useState("");
  const [newAddrPincode, setNewAddrPincode] = useState("");
  const [newAddrType, setNewAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [newAddrIsDefault, setNewAddrIsDefault] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Fetch Saved Addresses
  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await axios.get("/api/user/address");
      setAddresses(res.data.addresses || []);
    } catch (err) {
      console.log("Error loading addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setPreviewImage(user.image || "/default-user.png");
      setShopName(user.shopName || "");
      setBusinessAddress(user.businessAddress || "");
      setGstNumber(user.gstNumber || "");
      fetchAddresses();
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);

    if (profileImage) {
      formData.append("image", profileImage);
    }

    setLoading(true);
    try {
      const result = await axios.post("/api/user/edit-user-profile", formData);
      dispatch(setUserData(result.data));
      setShowEditProfile(false);
      setProfileImage(null);
      alert("Profile updated successfully ✅");
    } catch (error) {
      console.log(error);
      alert("Profile update failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleEditShopDetails = async () => {
    if (!shopName || !businessAddress || !gstNumber) {
      alert("All fields are required");
      return;
    }
    setLoading1(true);
    try {
      await axios.post("/api/vendor/verify-again", {
        shopName,
        businessAddress,
        gstNumber,
      });

      alert("Verification request sent again ✅");
      router.push("/");
    } catch (error) {
      console.log(error);
      alert("Failed to send verification ❌");
    } finally {
      setLoading1(false);
    }
  };

  // Add Address Handler
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrName.trim() || !newAddrPhone.trim() || !newAddrAddress.trim() || !newAddrCity.trim() || !newAddrPincode.trim()) {
      alert("Please fill all mandatory address fields");
      return;
    }

    try {
      setSavingAddress(true);
      const res = await axios.post("/api/user/address", {
        name: newAddrName,
        phone: newAddrPhone,
        address: newAddrAddress,
        city: newAddrCity,
        state: newAddrState,
        pincode: newAddrPincode,
        type: newAddrType,
        isDefault: newAddrIsDefault,
      });

      setAddresses(res.data.addresses || []);
      setShowAddAddressForm(false);
      setNewAddrName("");
      setNewAddrPhone("");
      setNewAddrAddress("");
      setNewAddrCity("");
      setNewAddrState("");
      setNewAddrPincode("");
      setNewAddrType("Home");
      setNewAddrIsDefault(false);
      alert("Delivery address saved successfully ✅");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete Address Handler
  const handleDeleteAddress = async (addressId?: string) => {
    if (!addressId) return;
    if (!confirm("Are you sure you want to delete this delivery address?")) return;

    try {
      const res = await axios.delete(`/api/user/address?addressId=${addressId}`);
      setAddresses(res.data.addresses || []);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete address");
    }
  };

  // Set Default Address Handler
  const handleSetDefaultAddress = async (addressId?: string) => {
    if (!addressId) return;
    try {
      const res = await axios.put("/api/user/address", { addressId });
      setAddresses(res.data.addresses || []);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update default address");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white">
        <Navbar />
        <div className="flex items-center justify-center pt-48">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <div className="bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 sm:p-10 rounded-3xl shadow-2xl">
          {/* PROFILE HEADER */}
          <div className="flex flex-col items-center text-center border-b border-white/10 pb-6 mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-blue-500/40 p-1 bg-white/[0.04] shadow-xl">
              {user?.image ? (
                <Image
                  src={previewImage}
                  alt="profile"
                  width={120}
                  height={120}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-full">
                  <AiOutlineUser size={48} className="text-gray-400" />
                </div>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold mt-4 text-white">
              {user.name}
            </h2>

            <p className="text-gray-300 text-sm mt-0.5">{user.email}</p>
            <div className="mt-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider bg-blue-500/15 border border-blue-500/30 text-blue-400">
                {user.role}
              </span>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex gap-2 border-b border-white/10 pb-4 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "details"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-white/[0.04] text-gray-300 hover:text-white"
              }`}
            >
              Account Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "addresses"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-white/[0.04] text-gray-300 hover:text-white"
              }`}
            >
              <FiMapPin size={14} />
              <span>Saved Addresses ({addresses.length})</span>
            </button>
          </div>

          {/* TAB 1: ACCOUNT DETAILS */}
          {activeTab === "details" && (
            <div>
              <div className="space-y-3.5 text-sm sm:text-base bg-white/[0.03] p-5 rounded-2xl border border-white/10">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="font-semibold">{user.phone || "Not set"}</span>
                </div>

                {user.role === "vendor" && (
                  <>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">Shop Name:</span>
                      <span className="font-semibold text-blue-400">{user.shopName}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">Business Address:</span>
                      <span className="font-semibold text-right max-w-xs">{user.businessAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">GST Registration:</span>
                      <span className="font-semibold">{user.gstNumber}</span>
                    </div>
                  </>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
                {user.role === "user" && (
                  <button
                    type="button"
                    onClick={() => router.push("/orders")}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    📦 View My Orders
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowEditProfile(!showEditProfile);
                    setShowEditShop(false);
                  }}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 font-semibold text-sm transition-all cursor-pointer"
                >
                  {showEditProfile ? "Close Edit" : "✏️ Edit Profile"}
                </button>

                {user.role === "vendor" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditShop(!showEditShop);
                      setShowEditProfile(false);
                    }}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-purple-500/20"
                  >
                    🏪 Edit Shop Details
                  </button>
                )}
              </div>

              {/* EDIT PROFILE FORM */}
              <AnimatePresence>
                {showEditProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-6 bg-white/[0.04] p-5 sm:p-6 rounded-2xl border border-white/15 space-y-4"
                  >
                    <h3 className="text-lg font-bold text-white">Edit Profile Details</h3>

                    <div className="flex flex-col items-center mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden border border-white/30 mb-2.5">
                        <Image
                          src={previewImage}
                          alt="preview"
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Full Name
                        </label>
                        <input
                          className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone Number"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleUpdateProfile}
                        disabled={loading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-sm transition-colors cursor-pointer mt-2"
                      >
                        {loading ? <ClipLoader size={18} color="white" /> : "Save Profile Changes"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* EDIT SHOP FORM */}
              <AnimatePresence>
                {showEditShop && user.role === "vendor" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-6 bg-white/[0.04] p-5 sm:p-6 rounded-2xl border border-white/15 space-y-4"
                  >
                    <h3 className="text-lg font-bold text-white">Edit Shop & Verification Details</h3>
                    <p className="text-amber-400 text-xs">
                      ⚠️ Note: Updating shop details submits them for admin verification.
                    </p>

                    <div className="space-y-3">
                      <input
                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="Shop Name"
                      />
                      <input
                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="Shop Address"
                      />
                      <input
                        className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-white text-sm outline-none focus:border-blue-500"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        placeholder="GST Number"
                      />

                      <button
                        type="button"
                        onClick={handleEditShopDetails}
                        disabled={loading1}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm transition-colors cursor-pointer mt-2"
                      >
                        {loading1 ? <ClipLoader size={18} color="white" /> : "Submit for Verification"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* TAB 2: SAVED DELIVERY ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FiMapPin className="text-blue-400" />
                    Delivery Addresses
                  </h3>
                  <p className="text-xs text-gray-400">
                    Addresses saved here will auto-fill instantly during checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <FiPlus />
                  <span>{showAddAddressForm ? "Cancel" : "Add Address"}</span>
                </button>
              </div>

              {/* ADD NEW ADDRESS FORM */}
              <AnimatePresence>
                {showAddAddressForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddNewAddress}
                    className="p-5 sm:p-6 rounded-2xl bg-white/[0.04] border border-blue-500/30 space-y-4 shadow-xl"
                  >
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <FiPlus className="text-blue-400" />
                      Add New Delivery Address
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddrName}
                          onChange={(e) => setNewAddrName(e.target.value)}
                          placeholder="Recipient Name"
                          className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/15 text-white text-xs outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-1">
                          10-Digit Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={newAddrPhone}
                          onChange={(e) => setNewAddrPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/15 text-white text-xs outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-300 font-semibold mb-1">
                          Street / Flat / Locality *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={newAddrAddress}
                          onChange={(e) => setNewAddrAddress(e.target.value)}
                          placeholder="Flat no, building, street, area..."
                          className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/15 text-white text-xs outline-none focus:border-blue-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddrCity}
                          onChange={(e) => setNewAddrCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/15 text-white text-xs outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          value={newAddrPincode}
                          onChange={(e) => setNewAddrPincode(e.target.value)}
                          placeholder="Pincode"
                          className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/15 text-white text-xs outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Type:</span>
                          {(["Home", "Work", "Other"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setNewAddrType(t)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                newAddrType === t
                                  ? "bg-blue-600 text-white border-blue-500"
                                  : "bg-white/[0.04] text-gray-300 border-white/10"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={newAddrIsDefault}
                            onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                            className="w-4 h-4 rounded text-blue-600 bg-white/10 border-white/20"
                          />
                          <span>Make this my default address</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingAddress}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer mt-2"
                    >
                      {savingAddress ? "Saving..." : "Save Address"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* SAVED ADDRESSES LIST */}
              {loadingAddresses ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Loading saved addresses...
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                  <FiMapPin size={32} className="mx-auto text-gray-500 mb-2" />
                  <p className="text-sm font-semibold text-gray-300">No saved addresses yet</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Add your home or office address to enable instant 1-click checkout.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all shadow-md relative"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-gray-200 border border-white/15">
                            {addr.type === "Work" ? (
                              <FiBriefcase size={11} />
                            ) : (
                              <FiHome size={11} />
                            )}
                            <span>{addr.type || "Home"}</span>
                          </span>

                          {addr.isDefault && (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                              <FiStar size={10} /> Default
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-white text-sm">{addr.name}</h4>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                          {addr.address}, {addr.city} {addr.state ? `, ${addr.state}` : ""} -{" "}
                          <span className="font-semibold text-white">{addr.pincode}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">📞 {addr.phone}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs">
                        {!addr.isDefault ? (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr._id)}
                            className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer text-xs"
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Primary Address</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer transition-colors"
                          title="Delete address"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
