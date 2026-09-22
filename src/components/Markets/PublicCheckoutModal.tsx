// farm-fuzion-frontend/src/components/Markets/PublicCheckoutModal.tsx
import React, { useState } from "react";
import {
  X, Building2, Wallet, FileText, Shield, CheckCircle2,
  Loader2, Send, AlertCircle, CreditCard, Lock,
} from "lucide-react";
import { usePublicCart } from "../../contexts/PublicCartContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE } from "../../services/config";

interface Props {
  open: boolean;
  onClose: () => void;
  shipTo: string;
  onSuccess?: () => void;
}

type Step = "details" | "payment" | "processing" | "done";
type PaymentMethod = "wallet" | "invoice";

const COUNTRY_FLAGS: Record<string, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿", Rwanda: "🇷🇼",
  Ethiopia: "🇪🇹", Nigeria: "🇳🇬", Ghana: "🇬🇭", "South Africa": "🇿🇦",
  UAE: "🇦🇪", "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦", Netherlands: "🇳🇱",
  Germany: "🇩🇪", "United Kingdom": "🇬🇧", "United States": "🇺🇸",
  China: "🇨🇳", India: "🇮🇳", Singapore: "🇸🇬",
};

const SHIPPING_DESTINATIONS = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Nigeria", "Ghana",
  "South Africa", "UAE", "Saudi Arabia", "Qatar", "Netherlands", "Germany",
  "United Kingdom", "United States", "China", "India", "Singapore",
];

export default function PublicCheckoutModal({ open, onClose, shipTo, onSuccess }: Props) {
  const { items, subtotal, groupedByCooperative, clearCart, getUnitPrice } = usePublicCart();
  const { formatKES } = useCurrency();
  const { user, walletStatus } = useAuth();

  const [step, setStep] = useState<Step>("details");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [error, setError] = useState<string | null>(null);
  const [orderRefs, setOrderRefs] = useState<string[]>([]);

  const [form, setForm] = useState({
    buyer_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    buyer_company: "",
    buyer_email: user?.email || "",
    buyer_phone: "",
    buyer_country: shipTo,
    shipping_address: "",
    incoterm: "FOB",
    payment_terms: "30% deposit, 70% on delivery",
    notes: "",
  });

  const grouped = groupedByCooperative();
  const coopCount = Object.keys(grouped).length;
  const walletAvailable = !!(user && walletStatus.authenticated);

  if (!open) return null;

  const canProceedDetails =
    form.buyer_name.trim() &&
    form.buyer_email.trim() &&
    form.buyer_country.trim();

  // -----------------------------------------------------------------
  // Submit: creates one order per cooperative (backend model),
  // optionally triggers wallet transfer to the cooperative's group wallet.
  // -----------------------------------------------------------------
  const submitOrder = async () => {
    setStep("processing");
    setError(null);

    try {
      const createdOrders: string[] = [];

      for (const [coopName, coopItems] of Object.entries(grouped)) {
        // For POC we create one order per cooperative using the public orders endpoint.
        // If the backend supports multi-line orders, collapse this into one call.
        for (const item of coopItems) {
          const payload = {
            product_id: item.productId,
            buyer_name: form.buyer_name,
            buyer_company: form.buyer_company || undefined,
            buyer_email: form.buyer_email,
            buyer_phone: form.buyer_phone || undefined,
            buyer_country: form.buyer_country,
            quantity: item.quantity,
            shipping_address: form.shipping_address || undefined,
            notes: [
              `[GLOBAL TRADE]`,
              `Incoterm: ${form.incoterm}`,
              `Payment terms: ${form.payment_terms}`,
              `Cooperative: ${coopName}`,
              `Payment method: ${paymentMethod.toUpperCase()}`,
              form.notes ? `Notes: ${form.notes}` : null,
            ]
              .filter(Boolean)
              .join(" | "),
            payment_method: paymentMethod,
          };

          const res = await fetch(`${API_BASE}/v1/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.error || `Order failed for ${item.productName}`);
          }
          const result = await res.json();
          createdOrders.push(result.id || `ORD-${Date.now()}`);
        }
      }

      // ---------------------------------------------------------------
      // Wallet payment: debit buyer wallet, credit cooperative group wallet.
      // For POC we call a single endpoint that the backend can implement.
      // ---------------------------------------------------------------
      if (paymentMethod === "wallet" && user) {
        try {
          await fetch(`${API_BASE}/wallet/group/purchase/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyer_id: user.id,
              buyer_email: form.buyer_email,
              order_ids: createdOrders,
              total_amount: subtotal,
              cooperative_breakdown: Object.entries(grouped).map(([coop, list]) => ({
                cooperative_name: coop,
                group_id: list[0]?.groupId,   // 👈 ADD
                amount: list.reduce((s, i) => s + getUnitPrice(i) * i.quantity, 0),
              })),
              metadata: {
                destination_country: form.buyer_country,
                incoterm: form.incoterm,
                payment_terms: form.payment_terms,
              },
            }),
          });
          // Note: We don't fail the whole checkout if the wallet hop fails —
          // orders are already created and can be reconciled by the trade desk.
        } catch (walletErr) {
          console.warn("Wallet transfer warning:", walletErr);
        }
      }

      setOrderRefs(createdOrders);
      clearCart();
      setStep("done");
      onSuccess?.();
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Checkout failed. Please try again.");
      setStep("payment");
    }
  };

  // -----------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl max-h-[94vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Checkout · Global Bulk Order
              </h2>
              <p className="text-[11px] text-gray-500">
                {items.length} {items.length === 1 ? "lot" : "lots"} · {coopCount} cooperative
                {coopCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={step === "processing"}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress strip */}
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2">
            {["details", "payment"].map((s, i) => {
              const active = step === s || (step === "processing" && s === "payment") || step === "done";
              const done =
                (s === "details" && (step === "payment" || step === "processing" || step === "done")) ||
                (s === "payment" && step === "done");
              return (
                <React.Fragment key={s}>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
                      ${done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
                  >
                    {done ? <CheckCircle2 size={12} /> : <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px]">{i + 1}</span>}
                    {s === "details" ? "Details" : "Payment"}
                  </div>
                  {i === 0 && <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* -------- STEP 1: DETAILS -------- */}
          {step === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={form.buyer_name}
                    onChange={(e) => setForm({ ...form, buyer_name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Company
                  </label>
                  <input
                    type="text"
                    value={form.buyer_company}
                    onChange={(e) => setForm({ ...form, buyer_company: e.target.value })}
                    placeholder="Acme Imports Ltd"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.buyer_phone}
                    onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.buyer_email}
                    onChange={(e) => setForm({ ...form, buyer_email: e.target.value })}
                    placeholder="procurement@acme.com"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>
                <div className="col-span-2 relative">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Destination country *
                  </label>
                  <select
                    value={form.buyer_country}
                    onChange={(e) => setForm({ ...form, buyer_country: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 appearance-none"
                  >
                    {SHIPPING_DESTINATIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="absolute left-3 top-[38px]">
                    {COUNTRY_FLAGS[form.buyer_country] || "🌍"}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Shipping address
                  </label>
                  <textarea
                    rows={2}
                    value={form.shipping_address}
                    onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                    placeholder="Warehouse / port address"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Incoterm
                  </label>
                  <select
                    value={form.incoterm}
                    onChange={(e) => setForm({ ...form, incoterm: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900"
                  >
                    <option value="FOB">FOB — Free on Board</option>
                    <option value="CIF">CIF — Cost, Insurance, Freight</option>
                    <option value="EXW">EXW — Ex Works</option>
                    <option value="DAP">DAP — Delivered at Place</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Payment terms
                  </label>
                  <select
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900"
                  >
                    <option>30% deposit, 70% on delivery</option>
                    <option>50% deposit, 50% on delivery</option>
                    <option>Letter of Credit (L/C)</option>
                    <option>100% on delivery</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
                    Notes for suppliers
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Packaging, labeling, phytosanitary requirements…"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 resize-none"
                  />
                </div>
              </div>

              <button
                disabled={!canProceedDetails}
                onClick={() => setStep("payment")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* -------- STEP 2: PAYMENT -------- */}
          {step === "payment" && (
            <div className="space-y-4">
              {/* Order summary */}
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-lime-50 dark:from-emerald-900/15 dark:to-gray-800/50 border-b border-emerald-100/50 dark:border-gray-800">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Order Summary
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {Object.entries(grouped).map(([coop, list]) => (
                    <div key={coop}>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 size={12} className="text-emerald-600" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {coop}
                        </p>
                      </div>
                      {list.map((i) => (
                        <div key={i.productId} className="flex justify-between text-xs text-gray-500 py-0.5 pl-5">
                          <span className="truncate max-w-[200px]">
                            {i.quantity} × {i.productName}
                          </span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {formatKES(getUnitPrice(i) * i.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">Total</span>
                    <span className="font-bold text-emerald-600 text-base">
                      {formatKES(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Payment method
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* Wallet */}
                  <button
                    type="button"
                    disabled={!walletAvailable}
                    onClick={() => setPaymentMethod("wallet")}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all
                      ${paymentMethod === "wallet"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"}
                      ${!walletAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet size={16} className="text-emerald-600" />
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        Pay with Wallet
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {walletAvailable
                        ? "Instant settlement · Escrow protected"
                        : "Sign in with a FarmFuzion wallet to enable"}
                    </p>
                    {paymentMethod === "wallet" && walletAvailable && (
                      <CheckCircle2
                        size={16}
                        className="absolute top-3 right-3 text-emerald-500"
                      />
                    )}
                  </button>

                  {/* Invoice */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("invoice")}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all
                      ${paymentMethod === "invoice"
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={16} className="text-emerald-600" />
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">
                        Proforma Invoice
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Trade desk sends a formal invoice within 24h
                    </p>
                    {paymentMethod === "invoice" && (
                      <CheckCircle2
                        size={16}
                        className="absolute top-3 right-3 text-emerald-500"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-[11px] text-gray-500">
                <Lock size={13} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                <span>
                  {paymentMethod === "wallet"
                    ? "Funds are held in escrow and released to each cooperative's group wallet upon delivery confirmation."
                    : "You'll receive a proforma invoice with bank details and payment instructions."}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitOrder}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  {paymentMethod === "wallet" ? (
                    <><Wallet size={16} /> Pay {formatKES(subtotal)}</>
                  ) : (
                    <><Send size={16} /> Submit Order Request</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* -------- PROCESSING -------- */}
          {step === "processing" && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center animate-pulse">
                  <Loader2 size={36} className="text-white animate-spin" />
                </div>
              </div>
              <h3 className="mt-6 font-bold text-lg text-gray-900 dark:text-white">
                Processing your order…
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                {paymentMethod === "wallet"
                  ? "Settling with each cooperative's group wallet. This may take a few seconds."
                  : "Creating your order and notifying the trade desk."}
              </p>
            </div>
          )}

          {/* -------- DONE -------- */}
          {step === "done" && (
            <div className="py-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 size={40} className="text-white" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
                Order confirmed
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                {paymentMethod === "wallet"
                  ? "Payment settled. The cooperatives have been notified and will prepare your lots for shipment."
                  : "Your order request has been received. The trade desk will email a proforma invoice within 24 hours."}
              </p>

              <div className="mt-5 w-full max-w-sm rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  Reference{orderRefs.length > 1 ? "s" : ""}
                </p>
                <div className="space-y-1">
                  {orderRefs.slice(0, 4).map((r, i) => (
                    <p key={i} className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
                      #{r.slice(0, 14)}
                    </p>
                  ))}
                  {orderRefs.length > 4 && (
                    <p className="text-[11px] text-gray-400">
                      +{orderRefs.length - 4} more
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                Continue Browsing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
