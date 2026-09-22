// farm-fuzion-frontend/src/components/Markets/PublicCartDrawer.tsx
import React from "react";
import {
  X, ShoppingCart, Trash2, Plus, Minus, Building2,
  Package, ArrowRight, MapPin, Shield,
} from "lucide-react";
import { usePublicCart } from "../../contexts/PublicCartContext";
import { useCurrency } from "../../contexts/CurrencyContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿", Rwanda: "🇷🇼",
  Ethiopia: "🇪🇹", Nigeria: "🇳🇬", Ghana: "🇬🇭", "South Africa": "🇿🇦",
  UAE: "🇦🇪", Netherlands: "🇳🇱", Germany: "🇩🇪", "United Kingdom": "🇬🇧",
  "United States": "🇺🇸", China: "🇨🇳", India: "🇮🇳", Singapore: "🇸🇬",
};

export default function PublicCartDrawer({ open, onClose, onCheckout }: Props) {
  const {
    items, updateQuantity, removeItem, clearCart,
    groupedByCooperative, getUnitPrice, getLineTotal, subtotal, itemCount,
  } = usePublicCart();
  const { formatKES } = useCurrency();

  const grouped = groupedByCooperative();
  const cooperativeCount = Object.keys(grouped).length;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-md z-[90]
          bg-white dark:bg-gray-900 shadow-2xl
          flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-r from-[#062b22] to-[#0d4a3d]" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-emerald-400/40 rounded-full blur-3xl" />
          </div>
          <div className="relative px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 font-semibold">
                  Bulk Order Cart
                </p>
                <h2 className="text-lg font-bold leading-tight">
                  {items.length} {items.length === 1 ? "Lot" : "Lots"}
                  {cooperativeCount > 0 && (
                    <span className="text-emerald-300/70 text-sm font-normal ml-2">
                      · {cooperativeCount} {cooperativeCount === 1 ? "cooperative" : "cooperatives"}
                    </span>
                  )}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                <ShoppingCart size={36} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Your cart is empty
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Browse verified cooperatives and add lots to build your bulk order.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {Object.entries(grouped).map(([coopName, coopItems]) => {
                const flag = COUNTRY_FLAGS[coopItems[0]?.country || "Kenya"] || "🌍";
                const coopTotal = coopItems.reduce((sum, i) => sum + getLineTotal(i), 0);
                return (
                  <div key={coopName} className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Cooperative header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-lime-50 dark:from-emerald-900/15 dark:to-gray-800/50 border-b border-emerald-100/50 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{flag}</span>
                        <Building2 size={14} className="text-emerald-600" />
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-[180px]">
                          {coopName}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {formatKES(coopTotal)}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {coopItems.map((item) => {
                        const unitPrice = getUnitPrice(item);
                        const lineTotal = getLineTotal(item);
                        return (
                          <div key={item.productId} className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-lime-100 dark:from-emerald-900/30 dark:to-gray-800 flex items-center justify-center flex-shrink-0">
                                <Package size={20} className="text-emerald-700/50" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                      {item.productName}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                      MOQ {item.moq} · Stock {item.availableStock}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeItem(item.productId)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                                    aria-label="Remove item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                {/* Price + qty row */}
                                <div className="flex items-center justify-between mt-3">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          item.productId,
                                          Math.max(item.moq, item.quantity - 100)
                                        )
                                      }
                                      disabled={item.quantity <= item.moq}
                                      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <input
                                      type="number"
                                      min={item.moq}
                                      max={item.availableStock}
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateQuantity(
                                          item.productId,
                                          parseInt(e.target.value) || item.moq
                                        )
                                      }
                                      className="w-20 px-2 py-1 text-center text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                                    />
                                    <button
                                      onClick={() =>
                                        updateQuantity(
                                          item.productId,
                                          Math.min(item.availableStock, item.quantity + 100)
                                        )
                                      }
                                      disabled={item.quantity >= item.availableStock}
                                      className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                      {formatKES(lineTotal)}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {formatKES(unitPrice)}/{item.unit}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Clear cart */}
              <button
                onClick={clearCart}
                className="w-full text-xs text-gray-500 hover:text-red-500 py-2 transition-colors"
              >
                Clear entire cart
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-5 py-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatKES(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Logistics</span>
                <span className="text-gray-400 text-xs self-center">Quoted at confirmation</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white">Est. Total</span>
                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {formatKES(subtotal)}
                </span>
              </div>
            </div>

            <button
              onClick={onCheckout}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl
                bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold
                shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.01] transition-all"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Shield size={10} /> Escrow-protected
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={10} /> {itemCount} units
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
