"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { placeInquiryAction } from "@/app/actions/orderActions";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } =
    useCart();
  const { user, profile, isLoading } = useUserStore();

  const hasCustomItems = items.some((item) => item.selectedSize.label === "Custom Size");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [loadingCoupon, setLoadingCoupon] = useState(false);

  // Form errors
  const [formError, setFormError] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
    } else if (user) {
      setName(user.email?.split("@")[0] || "");
    }
  }, [profile, user]);

  useEffect(() => {
    if (hasCustomItems && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponCode("");
    }
  }, [hasCustomItems, appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setLoadingCoupon(true);
    setCouponError("");
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setCouponError("Invalid coupon code");
        setAppliedCoupon(null);
        return;
      }

      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        setCouponError("Coupon has expired");
        return;
      }

      if (data.min_order_value && totalPrice < Number(data.min_order_value)) {
        setCouponError(
          `Minimum order value of ₹${Number(data.min_order_value).toLocaleString("en-IN")} required`,
        );
        return;
      }

      if (
        data.usage_limit &&
        data.usage_count !== null &&
        data.usage_count >= data.usage_limit
      ) {
        setCouponError("Coupon limit reached");
        return;
      }

      let discountAmount = 0;
      if (data.percentage) {
        discountAmount = Math.round(
          totalPrice * (Number(data.percentage) / 100),
        );
        if (data.max_discount && discountAmount > Number(data.max_discount)) {
          discountAmount = Number(data.max_discount);
        }
      } else if (data.flat_discount) {
        discountAmount = Number(data.flat_discount);
      }

      discountAmount = Math.min(discountAmount, totalPrice);

      setAppliedCoupon({
        id: data.id,
        code: data.code,
        discountAmount,
      });
      setCouponError("");
    } catch (e) {
      console.error(e);
      setCouponError("Error applying coupon");
    } finally {
      setLoadingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  if (items.length === 0) {
    return (
      <div className="container-main py-10 md:py-16 text-center">
        <svg
          className="w-20 h-20 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 mb-6">
          Browse our collection and add items to your cart.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  const finalTotalPrice =
    totalPrice - (appliedCoupon ? appliedCoupon.discountAmount : 0);

  const handleCheckout = async () => {
    // Check if user is logged in
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((c) => c.trim().startsWith("auth_user="));
    const userNameCookie = authCookie
      ? decodeURIComponent(authCookie.split("=")[1])
      : "";

    if (!user && !userNameCookie) {
      window.location.href = `/login?redirect=/cart`;
      return;
    }

    // Validate inputs
    if (!name.trim()) {
      setFormError("Please enter your full name");
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) {
      setFormError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!address.trim()) {
      setFormError("Please enter your delivery address");
      return;
    }

    setFormError("");
    setIsPlacingOrder(true);

    const phoneNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "918610710434";

    // Use BMP-range or well-supported supplementary emoji only
    const e = {
      star: String.fromCodePoint(0x2b50), // star
      bell: String.fromCodePoint(0x1f514), // bell
      person: String.fromCodePoint(0x1f464), // person
      phone: String.fromCodePoint(0x1f4de), // phone
      mobile: String.fromCodePoint(0x1f4f1), // mobile
      pin: String.fromCodePoint(0x1f4cd), // pin
      cart: String.fromCodePoint(0x1f6d2), // cart
      package: String.fromCodePoint(0x1f4e6), // package
      tag: String.fromCodePoint(0x1f516), // tag
      ruler: String.fromCodePoint(0x1f4cf), // ruler
      hash: String.fromCodePoint(0x0023, 0xfe0f, 0x20e3), // hash
      check: String.fromCodePoint(0x2705), // check
      dollar: String.fromCodePoint(0x1f4b5), // dollar
      ticket: String.fromCodePoint(0x1f3ab), // ticket
      money: String.fromCodePoint(0x1f4b0), // money
      truck: String.fromCodePoint(0x1f69a), // truck
      sparkle: String.fromCodePoint(0x2728), // sparkle
    };

    let message = hasCustomItems
      ? `*Abirami Agency — New Order Inquiry* (Custom)\n\n`
      : `*Abirami Agency — New Order Inquiry*\n\n`;
    message += `${e.person} *Customer Details:*\n`;
    message += `\u2022 ${e.phone} Name: ${name}\n`;
    message += `\u2022 ${e.mobile} Phone: ${phone}\n`;
    message += `\u2022 ${e.pin} Delivery Address: ${address}\n\n`;
    message += `${e.cart} *Items:*\n\n`;

    const orderItems = items.map((item, index) => {
      const parts = item.selectedSize.dimensions.split(" x ");
      const dims = parts[0];
      const height = parts[1] || "";
      const firmness =
        item.product.specifications?.Firmness ||
        item.product.specifications?.["Comfort Level"];

      message += `${e.package} *${index + 1}. ${item.product.name}*\n`;
      message += `\u2022 ${e.tag} Category: ${item.product.category}\n`;
      message += `\u2022 ${e.ruler} Size: ${item.selectedSize.label}\n`;
      message += `\u2022 ${e.check} Dimensions: ${dims}\n`;
      if (height) message += `\u2022 Height: ${height} inch\n`;
      if (firmness) message += `\u2022 Firmness: ${firmness}\n`;
      message += `\u2022 Qty: ${item.quantity}\n`;
      
      if (item.selectedSize.label === "Custom Size") {
        message += `\u2022 ${e.dollar} *Subtotal:* Custom (Rate will be discussed by Admin)\n\n`;
      } else {
        message += `\u2022 ${e.dollar} *Subtotal:* \u20B9${(item.selectedSize.price * item.quantity).toLocaleString("en-IN")}\n\n`;
      }

      return {
        productId: item.selectedSize.id,
        productName: item.product.name,
        sizeLabel: item.selectedSize.label,
        dimensions: item.selectedSize.dimensions,
        quantity: item.quantity,
        price: item.selectedSize.price,
      };
    });

    message += `*Billing Summary:*\n`;
    message += `${e.dollar} *Subtotal:* \u20B9${totalPrice.toLocaleString("en-IN")}\n`;
    
    if (appliedCoupon) {
      message += `${e.ticket} *Coupon Applied (${appliedCoupon.code}):* -\u20B9${appliedCoupon.discountAmount.toLocaleString("en-IN")}\n`;
    }
    
    if (hasCustomItems) {
      const finalCatalogTotal = totalPrice - (appliedCoupon ? appliedCoupon.discountAmount : 0);
      if (finalCatalogTotal > 0) {
        message += `${e.money} *Total Amount:* \u20B9${finalCatalogTotal.toLocaleString("en-IN")} + Custom (Rate will be discussed by Admin)\n\n`;
      } else {
        message += `${e.money} *Total Amount:* Custom (Rate will be discussed by Admin)\n\n`;
      }
      message += `${e.truck} *Delivery Details:* Delivery charges may apply based on location.\n`;
      message += `${e.phone} *GPay Number:* 8610710434\n\n`;
      message += `Please let me know the pricing and next steps for my custom order! ${e.sparkle}`;
    } else {
      message += `${e.money} *Total Amount:* \u20B9${finalTotalPrice.toLocaleString("en-IN")}\n\n`;
      message += `${e.truck} *Delivery Details:* Delivery charges may apply based on location.\n`;
      message += `${e.phone} *GPay Number:* 8610710434\n\n`;
      message += `Please let me know the delivery details and next steps! ${e.sparkle}`;
    }

    const orderData = {
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      couponId: appliedCoupon?.id || null,
      discountAmount: appliedCoupon?.discountAmount || 0,
      items: orderItems,
      totalAmount: finalTotalPrice,
      method: "WhatsApp",
      userId: user?.id || null,
    };

    try {
      const res = await placeInquiryAction(orderData);
      if (res.success) {
        clearCart();
        setIsPlacingOrder(false);
        
        const displayId = res.ordId || (res.id ? res.id.substring(0, 8).toUpperCase() : 'PENDING');
        const finalMessage = message
          .replace('*Abirami Agency — New Order Inquiry*', `*Abirami Agency — New Order Inquiry (${displayId})*`)
          .replace('*Abirami Agency — New Order Inquiry* (Custom)', `*Abirami Agency — New Order Inquiry (${displayId})* (Custom)`);
          
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(finalMessage)}`;
        window.open(whatsappUrl, "_blank");
      } else if ((res as any).allowWhatsAppFallback) {
        // DB save failed but we still open WhatsApp so the sale is not lost
        clearCart();
        setIsPlacingOrder(false);
        setFormError(`Note: ${res.error}`);
        const finalMessage = message;
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(finalMessage)}`;
        window.open(whatsappUrl, "_blank");
      } else {
        setFormError(res.error || "Failed to place order in database");
        setIsPlacingOrder(false);
      }
    } catch (err) {
      console.error(err);
      setIsPlacingOrder(false);
      setFormError("Failed to place order in database");
    }
  };

  return (
    <div className="container-main py-8 md:py-10">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Shopping Cart
        </h1>
        <p className="text-gray-500 font-medium mt-1">
          {items.length} item{items.length !== 1 ? "s" : ""} in your cart
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          {/* Delivery Details Form */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-64 flex items-center justify-center text-gray-400 font-medium">
              Checking authentication...
            </div>
          ) : user ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Delivery Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) {
                          setPhone(val);
                        }
                      }}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Accepts 10 digits
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your complete address with landmark"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium resize-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 shadow-sm text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Login to Checkout</h3>
              <p className="text-gray-500 mb-6 max-w-md">Please sign in to your account to enter delivery details and complete your order.</p>
              <Link href="/login?redirect=/cart" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md">
                Sign In / Register
              </Link>
            </div>
          )}

          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedSize.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 flex flex-col sm:flex-row gap-4"
            >
              <div className="relative w-full sm:w-28 h-28 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                <Image
                  src={item.product.thumbnail}
                  alt={item.product.name}
                  fill
                  sizes="112px"
                  className="object-contain p-2"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/product/${item.product.slug}`}
                  className="font-semibold text-gray-900 hover:text-primary transition-colors"
                >
                  {item.product.name}
                </Link>
                <div className="mt-3 grid grid-cols-2 gap-y-1 gap-x-4">
                  <div className="text-sm">
                    <span className="text-gray-500">Category:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {item.product.category}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Size:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {item.selectedSize.label}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Dimensions:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {item.selectedSize.dimensions}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Firmness:</span>{" "}
                    <span className="font-medium text-gray-900">
                      Medium Firm
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedSize.id,
                          item.quantity - 1,
                        )
                      }
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <span className="font-semibold w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedSize.id,
                          item.quantity + 1,
                        )
                      }
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {item.selectedSize.label === "Custom Size" ? (
                        "Custom"
                      ) : (
                        `₹${(item.selectedSize.price * item.quantity).toLocaleString("en-IN")}`
                      )}
                    </p>
                    <button
                      onClick={() =>
                        removeItem(item.product.id, item.selectedSize.id)
                      }
                      className="text-sm text-red-500 hover:text-red-700 mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
            <Link
              href="/products"
              className="text-sm text-primary hover:text-primary-dark font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="lg:w-96">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-28 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>
                  {hasCustomItems && totalPrice === 0 ? (
                    "Custom"
                  ) : (
                    `₹${totalPrice.toLocaleString("en-IN")}`
                  )}
                </span>
              </div>
              {hasCustomItems && (
                <div className="text-xs text-primary font-bold bg-sky-50 p-2.5 rounded-lg border border-sky-100/50 leading-normal">
                  Custom: The rate will be discussed by the admin
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>
                    -₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery</span>
                <span className="text-gray-500 font-medium italic">
                  Varies by location
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                <span>Total</span>
                <span className="text-primary">
                  {hasCustomItems && finalTotalPrice === 0 ? (
                    "Custom"
                  ) : hasCustomItems ? (
                    `₹${finalTotalPrice.toLocaleString("en-IN")} + Custom`
                  ) : (
                    `₹${finalTotalPrice.toLocaleString("en-IN")}`
                  )}
                </span>
              </div>
            </div>

            {/* Coupon Section */}
            {!hasCustomItems && (
              <div className="border-t border-b py-4 my-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Apply Coupon
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={!!appliedCoupon}
                    placeholder="Enter code"
                    className="flex-1 min-w-0 h-10 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm uppercase font-semibold"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold px-4 rounded-lg text-sm transition-colors flex items-center justify-center shrink-0"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={loadingCoupon || !couponCode}
                      className="h-10 bg-primary hover:bg-primary-dark text-white font-semibold px-4 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                    >
                      {loadingCoupon ? "..." : "Apply"}
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 mt-1">{couponError}</p>
                )}
                {appliedCoupon && (
                  <p className="text-xs text-green-600 mt-1 font-semibold">
                    ✓ Coupon applied! Saved ₹
                    {appliedCoupon.discountAmount.toLocaleString("en-IN")}.
                  </p>
                )}
              </div>
            )}

            {formError && (
              <div className="bg-sky-50 text-primary text-xs rounded-lg p-3 mb-4 font-medium border border-sky-100">
                {formError}
              </div>
            )}

            {isLoading ? (
              <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-3.5 px-6 rounded-xl cursor-not-allowed">
                Loading...
              </button>
            ) : user ? (
              <button
                onClick={handleCheckout}
                disabled={isPlacingOrder}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.128.552 4.195 1.6 6.02L.031 24l6.108-1.597c1.764.954 3.754 1.458 5.892 1.458 6.646 0 12.031-5.385 12.031-12.031C24 5.385 18.677 0 12.031 0zm0 21.854c-1.802 0-3.568-.485-5.114-1.403l-.367-.217-3.794.994.994-3.794-.217-.367C2.569 15.539 2.083 13.785 2.083 12.031c0-5.498 4.475-9.972 9.948-9.972 5.497 0 9.947 4.474 9.947 9.972s-4.45 9.823-9.947 9.823zm5.45-7.447c-.299-.15-1.765-.87-2.036-.97-.272-.1-.47-.15-.668.15-.2.299-.77 1-.944 1.2-.175.2-.349.225-.648.075-.299-.15-1.26-.464-2.4-1.485-.888-.795-1.487-1.776-1.663-2.075-.175-.3 0-.462.15-.61.135-.135.299-.35.45-.525.15-.174.2-.299.299-.499.1-.2.05-.375-.025-.525-.075-.15-.668-1.611-.914-2.204-.239-.58-.484-.502-.668-.511-.174-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.074 2.898 1.224 3.098c.15.2 2.112 3.22 5.114 4.516.715.309 1.272.493 1.706.63.722.228 1.38.196 1.897.119.58-.087 1.765-.722 2.014-1.42.249-.698.249-1.298.174-1.42-.075-.123-.274-.198-.574-.348z" />
                </svg>
                {isPlacingOrder ? "Processing..." : "Order via WhatsApp"}
              </button>
            ) : (
              <Link
                href="/login?redirect=/cart"
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-sky-200"
              >
                Login to Order
              </Link>
            )}
            <p className="text-xs font-bold text-gray-700 text-center mt-3">
              Delivery charges may vary according to the location. Pay on
              delivery available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
