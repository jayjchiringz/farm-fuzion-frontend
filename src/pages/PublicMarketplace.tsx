// farm-fuzion-frontend/src/pages/PublicMarketplace.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Filter, Package, MapPin, DollarSign, TrendingUp,
  Globe, Leaf, Award, Shield, Truck, CreditCard, Users,
  ChevronLeft, ChevronRight, X, Loader2, AlertCircle,
  Star, Calendar, ArrowUpRight, ShoppingCart, Building2,
  Menu, LogOut, BarChart3, Sparkles, Sun, Moon, Bot,
  ArrowUp, ArrowDown, Activity, CheckCircle2, Clock,
  FileText, Quote, BadgeCheck, Ship, Phone, Mail, Send,
  ChevronDown, Zap, Target
} from "lucide-react";
import { useCurrency } from "../contexts/CurrencyContext";
import ThemeToggle from "../components/ThemeToggle";
import MainLayout from "../layouts/MainLayout";
import KnowledgeModal from "../components/Knowledge/KnowledgeModal";
import IntelligenceDashboard from "../components/Markets/IntelligenceDashboard";
import { useAuth } from "../contexts/AuthContext";
import { usePublicCart } from "../contexts/PublicCartContext";
import PublicCartDrawer from "../components/Markets/PublicCartDrawer";
import PublicCheckoutModal from "../components/Markets/PublicCheckoutModal";

const PUBLIC_API_URL = import.meta.env.VITE_PUBLIC_API_URL;
const FF_API_URL = import.meta.env.VITE_API_BASE_URL;

// ----------------------------- Types -----------------------------
interface PublicProduct {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  currency: string;
  total_price: number;
  available: boolean;
  certification?: string;
  description?: string;
  created_at: string;
  cooperative_name?: string;
  cooperative_country?: string;
  source_farmer_name?: string;
  // Enhanced bulk fields (fallbacks if backend doesn't send them)
  moq?: number;
  tier_pricing?: { min_qty: number; price: number }[];
  verified?: boolean;
  response_time_hours?: number;
  rating?: number;
  orders_fulfilled?: number;
}

interface MarketplaceStats {
  total_products: number;
  total_cooperatives: number;
  total_orders: number;
  total_farmers: number;
  active_farmers?: number;
  counties_reached: number;
  categories: Array<{ name: string; count: number }>;
}

interface CountyStat {
  county: string;
  group_count: number;
  active_wallets: number;
  group_type_count: number;
}

interface GroupTypeStat {
  id: string;
  group_type: string;
  type_active: boolean;
  group_count: number;
  active_wallets: number;
  percentage: number;
}

interface MarketPrice {
  product_name: string;
  retail_price: number;
  unit: string;
  region?: string;
  trend?: "UP" | "DOWN" | "STABLE";
  weekly_change?: number;
}

interface QuoteRequest {
  product: PublicProduct | null;
  quantity: number;
  destination: string;
  incoterm: "FOB" | "CIF" | "EXW" | "DAP";
  payment_terms: string;
  notes: string;
}

interface Insight {
  type: "weather" | "market" | "advisory" | "opportunity" | "alert";
  severity: "info" | "warning" | "critical";
  text: string;
}

interface InsightsResponse {
  insights: Insight[];
  source: string;
  generated_at: string;
  cached?: boolean;
  cache_age_seconds?: number;
  fallback_reason?: string;
}

// ----------------------------- Country Data -----------------------------
const COUNTRY_FLAGS: Record<string, string> = {
  Kenya: "🇰🇪", Uganda: "🇺🇬", Tanzania: "🇹🇿", Rwanda: "🇷🇼",
  Ethiopia: "🇪🇹", Nigeria: "🇳🇬", Ghana: "🇬🇭", "South Africa": "🇿🇦",
  UAE: "🇦🇪", "United Arab Emirates": "🇦🇪", Netherlands: "🇳🇱",
  Germany: "🇩🇪", "United Kingdom": "🇬🇧", UK: "🇬🇧", "United States": "🇺🇸",
  USA: "🇺🇸", China: "🇨🇳", India: "🇮🇳", Singapore: "🇸🇬",
  "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦", Canada: "🇨🇦", France: "🇫🇷",
};

const SHIPPING_DESTINATIONS = [
  "Kenya", "Uganda", "Tanzania", "Rwanda", "Ethiopia", "Nigeria", "Ghana",
  "South Africa", "UAE", "Saudi Arabia", "Qatar", "Netherlands", "Germany",
  "United Kingdom", "United States", "China", "India", "Singapore",
];

// Fallback tiered pricing generator — used if backend doesn't provide `tier_pricing`
const buildTierPricing = (base: number) => [
  { min_qty: 100, price: base },
  { min_qty: 500, price: base * 0.94 },
  { min_qty: 2000, price: base * 0.88 },
  { min_qty: 10000, price: base * 0.8 },
];

const INSIGHT_STYLES: Record<string, { bg: string; text: string; dot: string; icon: string }> = {
  weather:     { bg: "bg-sky-500/15 border-sky-400/30",          text: "text-sky-100",     dot: "bg-sky-400",     icon: "🌦️" },
  market:      { bg: "bg-emerald-500/15 border-emerald-400/30",  text: "text-emerald-100", dot: "bg-emerald-400", icon: "📈" },
  advisory:    { bg: "bg-lime-500/15 border-lime-400/30",        text: "text-lime-100",    dot: "bg-lime-400",    icon: "🌱" },
  opportunity: { bg: "bg-amber-500/15 border-amber-400/30",      text: "text-amber-100",   dot: "bg-amber-400",   icon: "💡" },
  alert:       { bg: "bg-red-500/15 border-red-400/30",          text: "text-red-100",     dot: "bg-red-400",     icon: "⚠️" },
};

const SEVERITY_GLOW: Record<string, string> = {
  info: "",
  warning: "shadow-[0_0_0_1px_rgba(251,191,36,0.4)]",
  critical: "shadow-[0_0_0_1px_rgba(239,68,68,0.5)] animate-pulse",
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export default function PublicMarketplace() {
  const { user } = useAuth();
  const { formatKES } = useCurrency();

  // UI state
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"marketplace" | "intelligence" | "analytics">("marketplace");
  const [isMobile, setIsMobile] = useState(false);

  const { addItem, itemCount, subtotal } = usePublicCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);
  
  const [counties, setCounties] = useState<CountyStat[]>([]);
  const [groupTypes, setGroupTypes] = useState<GroupTypeStat[]>([]);

  // Data
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [shipTo, setShipTo] = useState("Kenya");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "moq_asc">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // Order form
  const [orderForm, setOrderForm] = useState({
    buyer_name: "",
    buyer_company: "",
    buyer_email: "",
    buyer_phone: "",
    buyer_country: shipTo,
    quantity: 100,
    shipping_address: "",
    notes: "",
  });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Quote request
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest>({
    product: null,
    quantity: 100,
    destination: shipTo,
    incoterm: "FOB",
    payment_terms: "30% deposit, 70% on delivery",
    notes: "",
  });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState<string | null>(null);

  // ----------------------------- Effects -----------------------------
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setOrderForm((f) => ({ ...f, buyer_country: shipTo }));
    setQuoteRequest((q) => ({ ...q, destination: shipTo }));
  }, [shipTo]);

  useEffect(() => {
    if (insights.length <= 1) return;
    const interval = setInterval(() => {
      setInsightIndex((i) => (i + 1) % insights.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [insights.length]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) setSidebarOpen((s) => !s);
    else setIsSidebarOpen((s) => !s);
  };
  const closeSidebar = () => window.innerWidth < 1024 && setSidebarOpen(false);

  // ----------------------------- Data Fetching -----------------------------
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append("category", selectedCategory);
      if (search) params.append("search", search);
      if (selectedCertifications.length) params.append("certifications", selectedCertifications.join(","));
      params.append("sort", sortBy);
      params.append("limit", itemsPerPage.toString());
      params.append("offset", ((currentPage - 1) * itemsPerPage).toString());

      const res = await fetch(`${PUBLIC_API_URL}/api/v1/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();

      // Enrich with fallback bulk fields
      const enriched = (data.data || []).map((p: PublicProduct) => ({
        ...p,
        moq: p.moq ?? 100,
        tier_pricing: p.tier_pricing ?? buildTierPricing(p.price_per_unit),
        verified: p.verified ?? true,
        response_time_hours: p.response_time_hours ?? 24,
        rating: p.rating ?? 4.6 + Math.random() * 0.3,
        orders_fulfilled: p.orders_fulfilled ?? 12 + Math.floor(Math.random() * 80),
        cooperative_country: p.cooperative_country ?? "Kenya",
      }));
      setProducts(enriched);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Unable to load products. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, selectedCertifications, sortBy, currentPage]);

  const fetchMarketPrices = async () => {
    try {
      const res = await fetch(`${FF_API_URL}/market-prices/summary?currency=KES`);
      if (res.ok) {
        const data = await res.json();
        setMarketPrices(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching market prices:", err);
    }
  };

  const fetchStatsAndCategories = async () => {
    try {
      const [statsRes, categoriesRes, countiesRes, groupTypesRes] = await Promise.all([
        fetch(`${PUBLIC_API_URL}/api/v1/stats`),
        fetch(`${PUBLIC_API_URL}/api/v1/categories`),
        fetch(`${PUBLIC_API_URL}/api/v1/counties`),
        fetch(`${PUBLIC_API_URL}/api/v1/group-types`),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        const asNumber = (v: unknown): number => {
          const n = typeof v === "string" ? Number(v) : (v as number);
          return Number.isFinite(n) ? n : 0;
        };
        setStats({
          total_products: asNumber(s.total_products),
          total_cooperatives: asNumber(s.total_cooperatives),
          total_orders: asNumber(s.total_orders),
          total_farmers: asNumber(s.total_farmers),
          active_farmers: asNumber(s.active_farmers),
          counties_reached: asNumber(s.counties_reached),
          categories: s.categories || [],
        });
      }

      if (categoriesRes.ok) {
        const c = await categoriesRes.json();
        setCategories(c.categories || []);
      }

      if (countiesRes.ok) {
        const c = await countiesRes.json();
        setCounties(c.data || []);
      }

      if (groupTypesRes.ok) {
        const g = await groupTypesRes.json();
        setGroupTypes(g.data || []);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      setStats({
        total_products: 0,
        total_cooperatives: 0,
        total_orders: 0,
        total_farmers: 0,
        active_farmers: 0,
        counties_reached: 0,
        categories: [],
      });
    }
  };

  const fetchInsights = async () => {
    try {
      // Mkulima Halisi lives in the Express backend, not the FastAPI public API
      const res = await fetch(`${FF_API_URL}/knowledge/insights`);   // 👈 was `${PUBLIC_API_URL}/api/v1/insights`
      if (res.ok) {
        const data: InsightsResponse = await res.json();
        setInsights(Array.isArray(data.insights) ? data.insights : []);
      }
    } catch (err) {
      console.error("Error fetching insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMarketPrices();
    fetchStatsAndCategories();
    fetchInsights();                 // 👈 ADD
  }, [fetchProducts]);

  // ----------------------------- Handlers -----------------------------
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setOrderSubmitting(true);
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          buyer_name: orderForm.buyer_name,
          buyer_company: orderForm.buyer_company || undefined,
          buyer_email: orderForm.buyer_email,
          buyer_phone: orderForm.buyer_phone || undefined,
          buyer_country: orderForm.buyer_country,
          quantity: orderForm.quantity,
          shipping_address: orderForm.shipping_address || undefined,
          notes: orderForm.notes || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Order failed");
      }
      const result = await res.json();
      setOrderSuccess(`Order #${result.id.slice(0, 12)} created · Total: ${formatKES(result.total_amount)}`);
      setOrderForm({
        buyer_name: "", buyer_company: "", buyer_email: "", buyer_phone: "",
        buyer_country: shipTo, quantity: 100, shipping_address: "", notes: "",
      });
      setTimeout(() => setOrderSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteRequest.product) return;
    setQuoteSubmitting(true);
    try {
      // Reuse order endpoint with a "quote" note — backend can add a dedicated RFQ later
      const res = await fetch(`${PUBLIC_API_URL}/api/v1/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: quoteRequest.product.id,
          buyer_name: user?.first_name || "Corporate Buyer",
          buyer_company: orderForm.buyer_company || "Corporate",
          buyer_email: user?.email || orderForm.buyer_email,
          buyer_phone: orderForm.buyer_phone || undefined,
          buyer_country: quoteRequest.destination,
          quantity: quoteRequest.quantity,
          notes: `[RFQ] Incoterm: ${quoteRequest.incoterm} | Payment: ${quoteRequest.payment_terms} | ${quoteRequest.notes}`,
        }),
      });
      if (!res.ok) throw new Error("Quote submission failed");
      setQuoteSuccess(`Quote request sent! Reference #${Date.now().toString().slice(-8)}`);
      setTimeout(() => {
        setQuoteSuccess(null);
        setShowQuoteModal(false);
      }, 4000);
    } catch (err: any) {
      alert(err.message || "Failed to submit quote request");
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedCertifications([]);
    setSortBy("newest");
    setCurrentPage(1);
  };

  const toggleCertification = (cert: string) => {
    setSelectedCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  // ----------------------------- Derived -----------------------------
  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const trustStats = useMemo(() => ({
    counties: stats?.counties_reached ?? 0,
    cooperatives: stats?.total_cooperatives ?? 0,
    farmers: stats?.total_farmers ?? 0,
    activeFarmers: stats?.active_farmers ?? 0,
    orders: stats?.total_orders ?? 0,
  }), [stats]);

  // ----------------------------- Render helpers -----------------------------
  const CertificationBadge = ({ cert }: { cert?: string }) => {
    if (!cert) return null;
    const map: Record<string, { bg: string; icon: React.ReactNode; label: string }> = {
      organic: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <Leaf size={11} />, label: "Organic" },
      "fair-trade": { bg: "bg-blue-100 text-blue-700 border-blue-200", icon: <Award size={11} />, label: "Fair Trade" },
      "rainforest-alliance": { bg: "bg-green-100 text-green-700 border-green-200", icon: <Shield size={11} />, label: "Rainforest" },
      "globalgap": { bg: "bg-amber-100 text-amber-700 border-amber-200", icon: <BadgeCheck size={11} />, label: "GlobalG.A.P." },
    };
    const b = map[cert.toLowerCase()];
    if (!b) return null;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${b.bg}`}>
        {b.icon}{b.label}
      </span>
    );
  };

  const StatTile = ({
    label, value, icon, accent,
  }: { label: string; value: string; icon: React.ReactNode; accent: string }) => (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 group hover:bg-white/10 transition-all duration-300">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${accent} opacity-20 group-hover:opacity-30 transition-opacity blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/60 font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-xl ${accent} text-white`}>{icon}</div>
      </div>
    </div>
  );

  const HeroInsightStrip = () => {
    const current = insights[insightIndex];
    const style = current ? INSIGHT_STYLES[current.type] || INSIGHT_STYLES.advisory : INSIGHT_STYLES.advisory;

    return (
      <div
        className={`mt-6 rounded-2xl border backdrop-blur-md px-4 py-3.5 transition-all duration-500
          ${current ? style.bg : "bg-white/5 border-white/10"}
          ${current && current.severity !== "info" ? SEVERITY_GLOW[current.severity] : ""}`}
      >
        <div className="flex items-start gap-3">
          {/* AI Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Bot size={18} className="text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-lime-400 border-2 border-[#062b22] animate-pulse" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-semibold">
                Mkulima Halisi · Live Insight
              </p>
              {current && (
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${style.bg} ${style.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {current.type}
                </span>
              )}
            </div>

            {insightsLoading ? (
              <p className="text-sm text-white/60 italic">Analysing markets, weather and demand…</p>
            ) : current ? (
              <p
                key={insightIndex}
                className="text-sm md:text-[15px] text-white leading-relaxed animate-fade-in"
              >
                <span className="mr-1.5">{style.icon}</span>
                {current.text}
              </p>
            ) : (
              <p className="text-sm text-white/70 italic">
                No insights available right now — check back soon.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {insights.length > 1 && (
              <div className="hidden sm:flex items-center gap-1 mr-2">
                {insights.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setInsightIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === insightIndex ? "w-4 bg-lime-400" : "w-1.5 bg-white/30 hover:bg-white/60"
                    }`}
                    aria-label={`Insight ${i + 1}`}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => setShowKnowledgeModal(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors"
              title="Ask Mkulima Halisi for details"
            >
              Ask AI
              <ArrowUpRight size={11} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SIDEBAR
  // =========================================================================
  const Sidebar = () => (
    <aside
      className={`${
        isSidebarOpen ? "w-72" : "w-20"
      } transition-all duration-500 ease-in-out
        fixed lg:relative z-50 h-full
        bg-gradient-to-b from-[#0a3d32] via-[#0d4a3d] to-[#062b22]
        text-white flex flex-col justify-between py-6 px-3 shadow-2xl
        border-r border-white/10
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-lime-300/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/30 blur-lg rounded-2xl" />
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center shadow-lg">
                <Globe size={22} className="text-[#062b22]" />
              </div>
            </div>
            {isSidebarOpen && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/70 font-semibold">FarmFuzion</p>
                <h1 className="text-lg font-bold leading-tight">Global Trade</h1>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
          >
            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="space-y-1.5">
          <SidebarItem
            icon={<Globe size={20} />}
            label="Marketplace"
            sub="Browse cooperatives"
            active={activeTab === "marketplace"}
            onClick={() => { setActiveTab("marketplace"); closeSidebar(); }}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem
            icon={<Sparkles size={20} />}
            label="Intelligence"
            sub="AI market insights"
            active={activeTab === "intelligence"}
            onClick={() => { setActiveTab("intelligence"); closeSidebar(); }}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem
            icon={<BarChart3 size={20} />}
            label="Analytics"
            sub="Prices & trends"
            active={activeTab === "analytics"}
            onClick={() => { setActiveTab("analytics"); closeSidebar(); }}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem
            icon={<Bot size={20} />}
            label="Mkulima Halisi"
            sub="AI agronomist"
            active={showKnowledgeModal}
            onClick={() => { setShowKnowledgeModal(true); closeSidebar(); }}
            collapsed={!isSidebarOpen}
            highlight
          />
        </nav>

        {/* Verified cooperative card */}
        {stats && isSidebarOpen && (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 to-lime-400/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck size={16} className="text-emerald-300" />
              <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Network</p>
            </div>
            <div className="space-y-2 text-xs">
              <SidebarStat label="Cooperatives" value={trustStats.cooperatives} />
              <SidebarStat label="Farmers" value={trustStats.farmers} />
              <SidebarStat label="Counties" value={trustStats.counties} />
              <SidebarStat label="Fulfilled" value={trustStats.orders} />
            </div>
          </div>
        )}

        {/* Sign-in / dashboard CTA */}
        <div className="mt-auto pt-6">
          <button
            onClick={() => (window.location.href = user ? "/group-dashboard" : "/login")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300
              bg-gradient-to-r from-emerald-400 to-lime-400 text-[#062b22] font-semibold shadow-lg hover:shadow-emerald-400/30 hover:scale-[1.02]
              ${!isSidebarOpen ? "justify-center" : ""}`}
            title={user ? "Dashboard" : "Sign In"}
          >
            <LogOut size={18} />
            {isSidebarOpen && <span>{user ? "My Dashboard" : "Sign In"}</span>}
          </button>
        </div>
      </div>
    </aside>
  );

  const SidebarItem = ({
    icon, label, sub, active, onClick, collapsed, highlight,
  }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative
        ${active ? "bg-white/10 text-white shadow-inner" : "text-white/70 hover:bg-white/5 hover:text-white"}
        ${collapsed ? "justify-center" : ""}`}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-lime-400 rounded-r" />}
      <span className={`${active ? "text-emerald-300" : "text-white/70 group-hover:text-emerald-300"} transition-colors`}>
        {icon}
      </span>
      {!collapsed && (
        <div className="text-left flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{label}</p>
            {highlight && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lime-400/20 text-lime-300 font-bold">AI</span>}
          </div>
          <p className="text-[11px] text-white/40">{sub}</p>
        </div>
      )}
    </button>
  );

  const SidebarStat = ({ label, value }: { label: string; value: number }) => (
    <div className="flex justify-between">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-emerald-200">{value.toLocaleString()}</span>
    </div>
  );

  // =========================================================================
  // HERO
  // =========================================================================
  const Hero = () => (
    <div className="relative overflow-hidden rounded-3xl mb-8 border border-emerald-900/10">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#062b22] via-[#0d4a3d] to-[#0a3d32]" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-lime-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 p-6 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-100 tracking-wide">
                {statsLoaded
                  ? `LIVE · ${trustStats.counties} counties · ${trustStats.cooperatives} verified cooperatives`
                  : "LIVE · connecting Kenyan cooperatives to the world"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-3">
              Source Kenyan produce at{" "}
              <span className="bg-gradient-to-r from-emerald-300 to-lime-300 bg-clip-text text-transparent">
                global scale
              </span>
            </h1>
            <p className="text-emerald-100/80 text-base md:text-lg mb-6 leading-relaxed">
              Direct bulk sourcing from certified Kenyan cooperatives. Transparent pricing, verified suppliers, and export-ready logistics.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("marketplace")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-lime-400 text-[#062b22] font-semibold shadow-lg hover:shadow-emerald-400/40 hover:scale-[1.02] transition-all"
              >
                <Package size={18} /> Browse Marketplace
              </button>
              <button
                onClick={() => setShowKnowledgeModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                <Bot size={18} /> Ask Mkulima Halisi
              </button>
            </div>

            {/* AI-powered live insight (rotates) */}
            <HeroInsightStrip />

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-8 text-emerald-100/70 text-xs">
              <span className="inline-flex items-center gap-1.5"><Shield size={14} /> Escrow payments</span>
              <span className="inline-flex items-center gap-1.5"><Ship size={14} /> Export logistics</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} /> Verified suppliers</span>
              <span className="inline-flex items-center gap-1.5"><FileText size={14} /> Phytosanitary docs</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 lg:w-[420px]">
            <StatTile
              label="Counties"
              value={trustStats.counties.toLocaleString()}
              icon={<MapPin size={20} />}
              accent="bg-emerald-500"
            />
            <StatTile
              label="Cooperatives"
              value={trustStats.cooperatives.toLocaleString()}
              icon={<Building2 size={20} />}
              accent="bg-lime-500"
            />
            <StatTile
              label="Farmers"
              value={trustStats.farmers.toLocaleString()}
              icon={<Users size={20} />}
              accent="bg-amber-500"
            />
            <StatTile
              label="Active Farmers"
              value={trustStats.activeFarmers.toLocaleString()}
              icon={<BadgeCheck size={20} />}
              accent="bg-teal-500"
            />
          </div>
        </div>

        {/* Group types distribution */}
        {groupTypes.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80 font-semibold mr-2">
              By group type
            </span>
            {groupTypes.slice(0, 6).map((gt) => (
              <span
                key={gt.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[11px] text-emerald-100/90"
                title={`${gt.group_count} groups · ${gt.active_wallets} active wallets`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                <span className="font-medium">{gt.group_type}</span>
                <span className="text-emerald-300/70">{gt.group_count}</span>
              </span>
            ))}
            {groupTypes.length > 6 && (
              <span className="text-[11px] text-emerald-300/60">
                +{groupTypes.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Ship-to bar */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
            <MapPin size={16} className="text-emerald-300" />
            <span>Shipping to</span>
          </div>
          <div className="relative flex-1 max-w-xs">
            <select
              value={shipTo}
              onChange={(e) => setShipTo(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              {SHIPPING_DESTINATIONS.map((c) => (
                <option key={c} value={c} className="text-gray-900">
                  {c}
                </option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
              {COUNTRY_FLAGS[shipTo] || "🌍"}
            </span>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-200/80">
            <Clock size={14} />
            <span>Est. delivery 7–21 days · DDP available</span>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // FEATURED STRIP
  // =========================================================================
  const FeaturedStrip = () =>
    featuredProducts.length === 0 ? null : (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Featured Lots</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">HOT</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} featured />
          ))}
        </div>
      </div>
    );

  // =========================================================================
  // PRODUCT CARD
  // =========================================================================
  const ProductCard = ({ product, featured = false }: { product: PublicProduct; featured?: boolean }) => {
    const moq = product.moq ?? 100;
    const flag = COUNTRY_FLAGS[product.cooperative_country || "Kenya"] || "🇰🇪";

    return (
      <div
        onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }}
        className={`group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1
          ${featured ? "ring-2 ring-amber-400/40" : ""}`}
      >
        {/* Image / gradient banner */}
        <div className="relative h-36 bg-gradient-to-br from-emerald-100 via-lime-50 to-emerald-50 dark:from-emerald-900/30 dark:via-gray-800 dark:to-emerald-900/20 overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: "radial-gradient(circle at 30% 40%, rgba(16,185,129,0.3), transparent 50%), radial-gradient(circle at 70% 60%, rgba(132,204,22,0.25), transparent 50%)"
          }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={44} className="text-emerald-700/30 dark:text-emerald-300/20" />
          </div>
          {/* Top-left badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.verified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-[10px] font-bold text-emerald-700 shadow-sm">
                <BadgeCheck size={10} /> VERIFIED
              </span>
            )}
            {featured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-[10px] font-bold text-amber-900 shadow-sm">
                <Star size={10} /> FEATURED
              </span>
            )}
          </div>
          {/* Top-right rating */}
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 backdrop-blur text-white text-[11px] font-semibold">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {product.rating?.toFixed(1)}
          </div>
          {/* Certification bottom */}
          <div className="absolute bottom-3 left-3">
            <CertificationBadge cert={product.certification} />
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight line-clamp-1 group-hover:text-emerald-600 transition-colors">
              {product.product_name}
            </h3>
          </div>

          {/* Cooperative */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <span className="text-base leading-none">{flag}</span>
            <Building2 size={11} />
            <span className="truncate">{product.cooperative_name || "Kenyan Cooperative"}</span>
          </div>

          {/* Price + MOQ */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">From</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatKES(product.price_per_unit)}
                <span className="text-xs font-normal text-gray-400 ml-1">/{product.unit}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">MOQ</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {moq} {product.unit}
              </p>
            </div>
          </div>

          {/* Stock bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
              <span>Available</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{product.quantity.toLocaleString()} {product.unit}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-lime-400"
                style={{ width: `${Math.min(100, (product.quantity / 5000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Clock size={11} />~{product.response_time_hours}h response
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(
                    {
                      productId: product.id,
                      productName: product.product_name,
                      cooperativeName: product.cooperative_name || "Kenyan Cooperative",
                      country: product.cooperative_country,
                      certification: product.certification,
                      unit: product.unit,
                      currency: product.currency || "KES",
                      basePrice: product.price_per_unit,
                      tierPricing: product.tier_pricing ?? buildTierPricing(product.price_per_unit),
                      moq: product.moq ?? 100,
                      availableStock: product.quantity,
                    },
                    product.moq ?? 100
                  );
                  setCartToast(`${product.product_name} added`);
                  setTimeout(() => setCartToast(null), 2200);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <ShoppingCart size={12} /> Add
              </button>
              <button className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-semibold group-hover:gap-2 transition-all">
                View <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // FILTER BAR
  // =========================================================================
  const FilterBar = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by product, cooperative, or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
        {/* Category */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="moq_asc">Lowest MOQ</option>
        </select>
        {/* Advanced toggle */}
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Filter size={16} /> Filters
          {selectedCertifications.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              {selectedCertifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Certifications</p>
          <div className="flex flex-wrap gap-2">
            {["Organic", "Fair-Trade", "Rainforest-Alliance", "GlobalG.A.P."].map((c) => {
              const active = selectedCertifications.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCertification(c)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${active
                      ? "bg-emerald-500 text-white border-emerald-500 shadow"
                      : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400"}`}
                >
                  {active && <CheckCircle2 size={12} />}
                  {c}
                </button>
              );
            })}
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-gray-500 hover:text-emerald-600 underline"
            >
              Reset all
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // =========================================================================
  // PRODUCT DETAIL MODAL (bulk-focused)
  // =========================================================================
  const ProductDetailModal = () => {
    if (!selectedProduct) return null;
    const p = selectedProduct;
    const moq = p.moq ?? 100;
    const tiers = p.tier_pricing ?? buildTierPricing(p.price_per_unit);
    const currentTier = [...tiers].reverse().find((t) => orderForm.quantity >= t.min_qty) ?? tiers[0];
    const estTotal = currentTier.price * orderForm.quantity;
    const flag = COUNTRY_FLAGS[p.cooperative_country || "Kenya"] || "🇰🇪";

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-5xl max-h-[94vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center">
                <Package size={20} className="text-[#062b22]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">{p.product_name}</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{flag}</span>
                  <span>{p.cooperative_name || "Kenyan Cooperative"}</span>
                  {p.verified && <BadgeCheck size={12} className="text-emerald-500" />}
                </div>
              </div>
            </div>
            <button
              onClick={() => { setShowDetailModal(false); setSelectedProduct(null); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT: Product info */}
              <div className="space-y-4">
                {/* Visual */}
                <div className="relative h-56 rounded-2xl bg-gradient-to-br from-emerald-100 via-lime-50 to-emerald-50 dark:from-emerald-900/30 dark:via-gray-800 dark:to-emerald-900/20 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package size={80} className="text-emerald-700/20" />
                  </div>
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <CertificationBadge cert={p.certification} />
                    {p.verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-[10px] font-bold text-emerald-700">
                        <BadgeCheck size={10} /> VERIFIED
                      </span>
                    )}
                  </div>
                </div>

                {/* Key facts */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] uppercase text-gray-400 font-semibold">Available</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{p.quantity.toLocaleString()} {p.unit}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] uppercase text-gray-400 font-semibold">MOQ</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{moq} {p.unit}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] uppercase text-gray-400 font-semibold">Response</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">~{p.response_time_hours}h</p>
                  </div>
                </div>

                {/* Description */}
                {p.description && (
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">About this lot</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{p.description}</p>
                  </div>
                )}

                {/* Tiered pricing */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-lime-50 dark:from-emerald-900/20 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                      <DollarSign size={14} /> Bulk Tier Pricing ({p.currency || "KES"})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {tiers.map((t, i) => {
                      const active = orderForm.quantity >= t.min_qty &&
                        (i === tiers.length - 1 || orderForm.quantity < tiers[i + 1].min_qty);
                      return (
                        <div
                          key={i}
                          className={`flex justify-between items-center px-4 py-2.5 text-sm transition-colors ${
                            active ? "bg-emerald-50 dark:bg-emerald-900/20 font-semibold" : ""
                          }`}
                        >
                          <span className="text-gray-600 dark:text-gray-300">
                            ≥ {t.min_qty.toLocaleString()} {p.unit}
                          </span>
                          <span className={active ? "text-emerald-700 dark:text-emerald-300 font-bold" : "text-gray-900 dark:text-white"}>
                            {formatKES(t.price)} <span className="text-xs font-normal text-gray-400">/{p.unit}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cooperative trust */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-lime-50 dark:from-emerald-900/20 dark:to-gray-800 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center text-[#062b22] font-bold">
                    {(p.cooperative_name || "K")[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.cooperative_name || "Kenyan Cooperative"}</p>
                      {p.verified && <BadgeCheck size={13} className="text-emerald-500" />}
                    </div>
                    <p className="text-xs text-gray-500">
                      ★ {p.rating?.toFixed(1)} · {p.orders_fulfilled} orders fulfilled · {flag}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: Order form */}
              <div className="space-y-4">
                {/* Success banner */}
                {orderSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} /> {orderSuccess}
                  </div>
                )}

                <form onSubmit={handleOrderSubmit} className="space-y-4 p-4 md:p-5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShoppingCart size={16} /> Place Bulk Order
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => { setQuoteRequest((q) => ({ ...q, product: p })); setShowQuoteModal(true); }}
                        className="text-xs inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        <Quote size={12} /> Request Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          addItem(
                            {
                              productId: p.id,
                              productName: p.product_name,
                              cooperativeName: p.cooperative_name || "Kenyan Cooperative",
                              country: p.cooperative_country,
                              certification: p.certification,
                              unit: p.unit,
                              currency: p.currency || "KES",
                              basePrice: p.price_per_unit,
                              tierPricing: p.tier_pricing ?? buildTierPricing(p.price_per_unit),
                              moq: p.moq ?? 100,
                              availableStock: p.quantity,
                            },
                            orderForm.quantity
                          );
                          setShowDetailModal(false);
                          setCartOpen(true);
                        }}
                        className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        <ShoppingCart size={11} /> Add to Cart
                      </button>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Quantity ({p.unit}) — MOQ {moq}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, quantity: Math.max(moq, orderForm.quantity - 100) })}
                        className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      >−</button>
                      <input
                        type="number"
                        min={moq}
                        max={p.quantity}
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: Math.max(moq, parseInt(e.target.value) || moq) })}
                        className="flex-1 px-3 py-2 text-center text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setOrderForm({ ...orderForm, quantity: Math.min(p.quantity, orderForm.quantity + 100) })}
                        className="w-9 h-9 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                      >+</button>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[moq, moq * 5, moq * 20, moq * 100].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setOrderForm({ ...orderForm, quantity: Math.min(q, p.quantity) })}
                          className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-emerald-400"
                        >
                          {q.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buyer info */}
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text" required placeholder="Full name *"
                      value={orderForm.buyer_name}
                      onChange={(e) => setOrderForm({ ...orderForm, buyer_name: e.target.value })}
                      className="col-span-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    />
                    <input
                      type="text" placeholder="Company"
                      value={orderForm.buyer_company}
                      onChange={(e) => setOrderForm({ ...orderForm, buyer_company: e.target.value })}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    />
                    <input
                      type="text" placeholder="Phone"
                      value={orderForm.buyer_phone}
                      onChange={(e) => setOrderForm({ ...orderForm, buyer_phone: e.target.value })}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    />
                    <input
                      type="email" required placeholder="Email *"
                      value={orderForm.buyer_email}
                      onChange={(e) => setOrderForm({ ...orderForm, buyer_email: e.target.value })}
                      className="col-span-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                    />
                    <div className="col-span-2 relative">
                      <select
                        value={orderForm.buyer_country}
                        onChange={(e) => setOrderForm({ ...orderForm, buyer_country: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 appearance-none"
                      >
                        {SHIPPING_DESTINATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <span className="absolute left-3 top-1/2 -translate-y-1/2">{COUNTRY_FLAGS[orderForm.buyer_country] || "🌍"}</span>
                    </div>
                    <textarea
                      rows={2} placeholder="Shipping address"
                      value={orderForm.shipping_address}
                      onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                      className="col-span-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-none"
                    />
                    <textarea
                      rows={2} placeholder="Notes for supplier…"
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      className="col-span-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-none"
                    />
                  </div>

                  {/* Summary */}
                  <div className="p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Unit price</span>
                      <span>{formatKES(currentTier.price)} / {p.unit}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Quantity</span>
                      <span>{orderForm.quantity.toLocaleString()} {p.unit}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Shipping</span>
                      <span className="text-xs">Quoted on confirmation</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                      <span>Est. total</span>
                      <span className="text-emerald-600">{formatKES(estTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={orderSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {orderSubmitting ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><Send size={16} /> Place Order</>}
                  </button>
                  <p className="text-[11px] text-center text-gray-400">
                    Escrow-protected · Payment options sent via email · Export docs provided
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // QUOTE MODAL (RFQ)
  // =========================================================================
  const QuoteModal = () => {
    if (!quoteRequest.product) return null;
    const p = quoteRequest.product;
    const tiers = p.tier_pricing ?? buildTierPricing(p.price_per_unit);
    const currentTier = [...tiers].reverse().find((t) => quoteRequest.quantity >= t.min_qty) ?? tiers[0];

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Quote size={18} className="text-emerald-500" />
              <h2 className="font-bold text-gray-900 dark:text-white">Request Bulk Quote (RFQ)</h2>
            </div>
            <button onClick={() => setShowQuoteModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleQuoteSubmit} className="p-6 space-y-4">
            {quoteSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> {quoteSuccess}
              </div>
            )}

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500">Product</p>
              <p className="font-semibold text-sm">{p.product_name}</p>
              <p className="text-xs text-gray-500">{p.cooperative_name}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Quantity ({p.unit})</label>
              <input
                type="number"
                min={p.moq ?? 100}
                value={quoteRequest.quantity}
                onChange={(e) => setQuoteRequest({ ...quoteRequest, quantity: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Current tier: {formatKES(currentTier.price)}/{p.unit}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Destination</label>
                <select
                  value={quoteRequest.destination}
                  onChange={(e) => setQuoteRequest({ ...quoteRequest, destination: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                >
                  {SHIPPING_DESTINATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Incoterm</label>
                <select
                  value={quoteRequest.incoterm}
                  onChange={(e) => setQuoteRequest({ ...quoteRequest, incoterm: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                >
                  <option value="FOB">FOB</option>
                  <option value="CIF">CIF</option>
                  <option value="EXW">EXW</option>
                  <option value="DAP">DAP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Payment terms</label>
              <select
                value={quoteRequest.payment_terms}
                onChange={(e) => setQuoteRequest({ ...quoteRequest, payment_terms: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
              >
                <option>30% deposit, 70% on delivery</option>
                <option>50% deposit, 50% on delivery</option>
                <option>Letter of Credit (L/C)</option>
                <option>100% on delivery</option>
              </select>
            </div>

            <textarea
              rows={3}
              placeholder="Additional requirements (packaging, labeling, certifications…)"
              value={quoteRequest.notes}
              onChange={(e) => setQuoteRequest({ ...quoteRequest, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-none"
            />

            <button
              type="submit"
              disabled={quoteSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              {quoteSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><Send size={16} /> Submit RFQ</>}
            </button>
            <p className="text-[11px] text-center text-gray-400">
              Our trade desk responds within 24 hours with a formal quote
            </p>
          </form>
        </div>
      </div>
    );
  };

  // =========================================================================
  // TABS
  // =========================================================================
  const MarketplaceTab = () => (
    <>
      <FilterBar />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p className="text-gray-500 mt-3 text-sm">Loading global lots…</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-red-600">{error}</p>
          <button onClick={fetchProducts} className="mt-4 px-5 py-2 bg-emerald-500 text-white rounded-xl font-semibold">Try Again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No lots match your filters</h3>
          <p className="text-gray-500 mt-2 text-sm">Try widening your search or clearing filters</p>
          <button onClick={resetFilters} className="mt-4 px-5 py-2 bg-emerald-500 text-white rounded-xl font-semibold">Reset Filters</button>
        </div>
      ) : (
        <>
          <FeaturedStrip />

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Lots ({products.length})</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-xl disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm px-3">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-xl disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Market Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400">Real-time benchmark prices from Kenyan wholesale markets</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Products" value={stats.total_products} icon={<Package size={18} />} color="from-blue-500 to-blue-600" />
          <MiniStat label="Cooperatives" value={stats.total_cooperatives} icon={<Building2 size={18} />} color="from-purple-500 to-purple-600" />
          <MiniStat label="Orders" value={stats.total_orders} icon={<Truck size={18} />} color="from-orange-500 to-orange-600" />
          <MiniStat label="Categories" value={categories.length} icon={<TrendingUp size={18} />} color="from-emerald-500 to-emerald-600" />
        </div>
      )}

      {/* Counties distribution */}
      {counties.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-lime-50 dark:from-emerald-900/15 dark:to-gray-800/50 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <MapPin size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                Cooperative Network by County
              </h3>
              <p className="text-xs text-gray-500">
                {counties.length} counties · {counties.reduce((s, c) => s + c.group_count, 0)} active groups
              </p>
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {counties.slice(0, 12).map((c) => (
              <div
                key={c.county}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center text-[#062b22] text-xs font-bold flex-shrink-0">
                    {c.county.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {c.county}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {c.active_wallets} wallet{c.active_wallets !== 1 ? "s" : ""} active
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-600 ml-2">
                  {c.group_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Current Market Prices</h3>
            <p className="text-xs text-gray-500">Benchmark retail prices per unit</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {marketPrices.slice(0, 10).map((price, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-3 font-medium">{price.product_name}</td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-emerald-600">{formatKES(price.retail_price)}</span>
                    <span className="text-xs text-gray-500 ml-1">/{price.unit || "kg"}</span>
                  </td>
                  <td className="px-6 py-3">
                    {price.trend === "UP" && <span className="flex items-center gap-1 text-green-600 text-sm"><ArrowUp size={12} />+{price.weekly_change?.toFixed(1)}%</span>}
                    {price.trend === "DOWN" && <span className="flex items-center gap-1 text-red-600 text-sm"><ArrowDown size={12} />{price.weekly_change?.toFixed(1)}%</span>}
                    {(!price.trend || price.trend === "STABLE") && <span className="text-gray-500 text-sm">Stable</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-sm">{price.region || "National"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard title="Best Time to Sell" icon={<TrendingUp size={18} />}
          description="Prices typically peak during harvest season (July–September). Consider holding for premium returns."
          color="green" />
        <InsightCard title="Buyer's Market" icon={<TrendingUp size={18} />}
          description="Peak harvest (Jan–Mar) offers 15–20% lower prices for bulk buyers stockpiling."
          color="orange" />
        <InsightCard title="Market Outlook" icon={<Activity size={18} />}
          description="Stable demand. International buyers showing increased interest in Kenyan organic produce."
          color="blue" />
      </div>
    </div>
  );

  const MiniStat = ({ label, value, icon, color }: any) => (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider opacity-90">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-2 bg-white/20 rounded-xl">{icon}</div>
      </div>
    </div>
  );

  const InsightCard = ({ title, icon, description, color }: any) => {
    const map: Record<string, string> = {
      green: "from-emerald-50 to-lime-50 dark:from-gray-800 dark:to-gray-900 border-emerald-100 dark:border-gray-700 text-emerald-800 dark:text-emerald-300",
      orange: "from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-amber-100 dark:border-gray-700 text-amber-800 dark:text-amber-300",
      blue: "from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-gray-700 text-blue-800 dark:text-blue-300",
    };
    return (
      <div className={`bg-gradient-to-br ${map[color]} p-4 rounded-2xl border`}>
        <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">{icon} {title}</h3>
        <p className="text-xs leading-relaxed">{description}</p>
      </div>
    );
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <MainLayout>
      <ThemeToggle />
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <Sidebar />

        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-[60] lg:hidden text-white bg-emerald-600 rounded-xl p-2.5 shadow-lg hover:bg-emerald-700"
        >
          <Menu size={20} />
        </button>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden" />
        )}

        {/* Main */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 ml-14 lg:ml-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center shadow">
                  <Globe size={20} className="text-[#062b22]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600 font-bold">FarmFuzion</p>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Global Trade Desk</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKnowledgeModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow hover:shadow-amber-500/30 transition-all"
                >
                  <Bot size={16} /> <span className="text-sm">Ask AI</span>
                  <span className="w-1.5 h-1.5 bg-lime-300 rounded-full animate-pulse" />
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Hero */}
            <Hero />

            {/* Tab content */}
            {activeTab === "marketplace" && <MarketplaceTab />}
            {activeTab === "intelligence" && (
              <IntelligenceDashboard
                farmerData={{
                  location: user?.group_id ? "Cooperative HQ" : "Kenya",
                  inventory: products.slice(0, 5).map((p) => ({
                    product: p.product_name,
                    quantity: p.quantity,
                    harvestDate: new Date(p.created_at),
                  })),
                }}
              />
            )}
            {activeTab === "analytics" && <AnalyticsTab />}

            {/* Trust footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { icon: <Shield size={18} />, label: "Escrow Protection" },
                  { icon: <CreditCard size={18} />, label: "Multi-currency" },
                  { icon: <Ship size={18} />, label: "Global Logistics" },
                  { icon: <BadgeCheck size={18} />, label: "Verified Co-ops" },
                ].map((t, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">{t.icon}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-gray-400 mt-6">
                © FarmFuzion Global Trade · Connecting Kenyan cooperatives to the world
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showDetailModal && <ProductDetailModal />}
      {showQuoteModal && <QuoteModal />}
      {showKnowledgeModal && (
        <KnowledgeModal
          farmerId={user?.id || "guest"}
          farmerName={user?.first_name || "Guest Buyer"}
          onClose={() => setShowKnowledgeModal(false)}
        />
      )}

      {/* Floating Cart Pill */}
      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-2xl
            bg-gradient-to-r from-[#062b22] to-[#0d4a3d] text-white shadow-2xl
            hover:shadow-emerald-500/30 hover:scale-[1.03] transition-all group"
        >
          <div className="relative">
            <ShoppingCart size={20} className="text-emerald-300" />
            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-lime-400 text-[#062b22] text-[10px] font-bold flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-semibold">
              Bulk Cart
            </p>
            <p className="text-sm font-bold leading-tight">{formatKES(subtotal)}</p>
          </div>
          <ArrowUpRight size={16} className="text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Cart drawer + checkout */}
      <PublicCartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <PublicCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        shipTo={shipTo}
      />

      {/* Toast */}
      {cartToast && (
        <div className="fixed bottom-24 right-6 z-[80] px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium shadow-lg animate-fade-in">
          ✅ {cartToast}
        </div>
      )}

    </MainLayout>
  );
}