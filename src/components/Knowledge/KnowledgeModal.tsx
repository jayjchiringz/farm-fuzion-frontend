// farm-fuzion-frontend/src/components/Knowledge/KnowledgeModal.tsx
// Mkulima Halisi — redesigned to match the marketplace theme,
// with bilingual (SW/EN) support and contextual conversion nudges.

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X, Send, Bot, FileText, Image as ImageIcon, Loader,
  Globe, Sparkles, Leaf, ArrowUpRight, MessageCircle,
  ShoppingCart, UserPlus, TrendingUp,
} from "lucide-react";
import { api } from "../../services/api";

// =========================================================================
// 🌍 i18n — all UI strings in one place
// =========================================================================
type Lang = "sw" | "en";

interface Strings {
  title: string;
  subtitle: string;
  welcomeTitle: string;
  welcomeBody: string;
  welcomeGuest: string;
  welcomeUser: string;
  placeholder: string;
  send: string;
  thinking: string;
  sources: string;
  tryAsking: string;
  errorGeneric: string;
  ctaJoinTitle: string;
  ctaJoinBody: string;
  ctaJoinBtn: string;
  ctaShopTitle: string;
  ctaShopBody: string;
  ctaShopBtn: string;
  ctaSellTitle: string;
  ctaSellBody: string;
  ctaSellBtn: string;
  ctaExploreTitle: string;
  ctaExploreBody: string;
  ctaExploreBtn: string;
  quickPrices: string;
  quickTomato: string;
  quickKuku: string;
  quickWeather: string;
  quickSell: string;
  quickJoin: string;
}

const STRINGS: Record<Lang, Strings> = {
  sw: {
    title: "Mkulima Halisi",
    subtitle: "Mshauri wa kilimo · AI",
    welcomeTitle: "Karibu!",
    welcomeBody: "Niko hapa kukusaidia na kilimo, bei za soko, hali ya hewa, na zaidi.",
    welcomeGuest: "Uliza chochote bure. Unaweza kujiunga baadaye kupata huduma kamili.",
    welcomeUser: "Niulize chochote kuhusu shamba lako au soko.",
    placeholder: "Uliza swali lako…",
    send: "Tuma",
    thinking: "Mkulima Halisi anafikiri…",
    sources: "Vyanzo",
    tryAsking: "Jaribu kuuliza:",
    errorGeneric: "Samahani, kuna tatizo la mtandao. Tafadhali jaribu tena.",
    ctaJoinTitle: "Jiunge na FarmFuzion bure",
    ctaJoinBody: "Pata bei za soko papo hapo, unganisha na wanunuzi, na ufuatilie mazao yako.",
    ctaJoinBtn: "Jiunge",
    ctaShopTitle: "Nunua moja kwa moja",
    ctaShopBody: "Vinjari mazao kutoka vyama vya ushirika vilivyothibitishwa — bila akaunti.",
    ctaShopBtn: "Vinjari",
    ctaSellTitle: "Uza kwa wingi",
    ctaSellBody: "Unganisha na wanunuzi wa kimataifa kupitia chama chako cha ushirika.",
    ctaSellBtn: "Jifunze",
    ctaExploreTitle: "Soko la kimataifa",
    ctaExploreBody: "Angalia mahitaji ya sasa kutoka nchi mbalimbali.",
    ctaExploreBtn: "Angalia",
    quickPrices: "Bei ya mahindi leo?",
    quickTomato: "Mbolea ya nyanya?",
    quickKuku: "Magonjwa ya kuku?",
    quickWeather: "Hali ya hewa wiki hii?",
    quickSell: "Naweza kuuza vipi?",
    quickJoin: "Jinsi ya kujiunga?",
  },
  en: {
    title: "Mkulima Halisi",
    subtitle: "Farming advisor · AI",
    welcomeTitle: "Karibu!",
    welcomeBody: "I'm here to help with farming, market prices, weather, and more.",
    welcomeGuest: "Ask anything for free. You can sign up later for the full experience.",
    welcomeUser: "Ask me anything about your farm or the market.",
    placeholder: "Type your question…",
    send: "Send",
    thinking: "Mkulima Halisi is thinking…",
    sources: "Sources",
    tryAsking: "Try asking:",
    errorGeneric: "Sorry, there's a network issue. Please try again.",
    ctaJoinTitle: "Join FarmFuzion for free",
    ctaJoinBody: "Get live market prices, connect with buyers, and track your produce.",
    ctaJoinBtn: "Sign up",
    ctaShopTitle: "Buy directly",
    ctaShopBody: "Browse produce from verified cooperatives — no account needed.",
    ctaShopBtn: "Browse",
    ctaSellTitle: "Sell in bulk",
    ctaSellBody: "Connect with international buyers through your cooperative.",
    ctaSellBtn: "Learn",
    ctaExploreTitle: "Global marketplace",
    ctaExploreBody: "See current demand from buyers worldwide.",
    ctaExploreBtn: "Explore",
    quickPrices: "Maize price today?",
    quickTomato: "Tomato fertilizer?",
    quickKuku: "Chicken diseases?",
    quickWeather: "This week's weather?",
    quickSell: "How do I sell?",
    quickJoin: "How do I join?",
  },
};

// =========================================================================
// Rotating contextual CTAs for guests
// =========================================================================
const GUEST_CTAS = [
  { key: "join",    titleKey: "ctaJoinTitle",    bodyKey: "ctaJoinBody",    btnKey: "ctaJoinBtn",    icon: UserPlus,     href: "/login" },
  { key: "shop",    titleKey: "ctaShopTitle",    bodyKey: "ctaShopBody",    btnKey: "ctaShopBtn",    icon: ShoppingCart, href: "/marketplace" },
  { key: "sell",    titleKey: "ctaSellTitle",    bodyKey: "ctaSellBody",    btnKey: "ctaSellBtn",    icon: TrendingUp,   href: "/login" },
  { key: "explore", titleKey: "ctaExploreTitle", bodyKey: "ctaExploreBody", btnKey: "ctaExploreBtn", icon: Globe,        href: "/marketplace" },
];

// =========================================================================
// Types & helpers
// =========================================================================
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; source?: string; url?: string }>;
  timestamp: Date;
}

interface KnowledgeModalProps {
  farmerId: string;
  farmerName?: string;
  onClose: () => void;
}

const getTimeGreeting = (lang: Lang) => {
  const h = new Date().getHours();
  if (lang === "sw") {
    if (h < 12) return "Habari za asubuhi";
    if (h < 17) return "Habari za mchana";
    if (h < 20) return "Habari za jioni";
    return "Habari za usiku";
  }
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 20) return "Good evening";
  return "Good night";
};

const buildSuggestions = (query: string, lang: Lang, isGuest: boolean): string[] => {
  const q = query.toLowerCase();
  const S = STRINGS[lang];
  const out: string[] = [];

  if (/mahindi|maize|corn/.test(q)) {
    out.push(
      lang === "sw" ? "Mbolea ya mahindi?" : "Maize fertilizer?",
      lang === "sw" ? "Wadudu wa mahindi" : "Maize pests"
    );
  } else if (/nyanya|tomato/.test(q)) {
    out.push(
      lang === "sw" ? "Kumwagilia nyanya?" : "Watering tomatoes?",
      lang === "sw" ? "Magonjwa ya nyanya" : "Tomato diseases"
    );
  } else if (/kuku|chicken|poultry/.test(q)) {
    out.push(
      lang === "sw" ? "Chanjo za kuku?" : "Chicken vaccines?",
      lang === "sw" ? "Chakula cha kuku" : "Chicken feed"
    );
  } else if (/bei|price|soko|market/.test(q)) {
    out.push(S.quickPrices, S.quickSell);
  } else if (/hali ya hewa|weather|mvua|rain/.test(q)) {
    out.push(lang === "sw" ? "Msimu wa kupanda?" : "Planting season?");
  }

  if (isGuest && out.length < 3) out.push(S.quickJoin);
  return out.slice(0, 3);
};

// =========================================================================
// Component
// =========================================================================
export default function KnowledgeModal({ farmerId, farmerName, onClose }: KnowledgeModalProps) {
  const isGuest = farmerId === "guest" || farmerId === "anonymous";

  // Persisted language — defaults SW, but guest can switch freely
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "sw";
    return (localStorage.getItem("mkulima_lang") as Lang) || "sw";
  });
  const S = STRINGS[lang];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `${getTimeGreeting(lang)} 🌾\n\n**${S.welcomeTitle}** ${S.welcomeBody}\n\n${
        isGuest ? S.welcomeGuest : S.welcomeUser
      }`,
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [guestCtaIndex, setGuestCtaIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist language choice
  useEffect(() => {
    try { localStorage.setItem("mkulima_lang", lang); } catch { /* ignore */ }
  }, [lang]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Rotate guest CTA every 20s
  useEffect(() => {
    if (!isGuest) return;
    const t = setInterval(() => setGuestCtaIndex((i) => (i + 1) % GUEST_CTAS.length), 20000);
    return () => clearInterval(t);
  }, [isGuest]);

  const hasUserMessaged = useMemo(
    () => messages.some((m) => m.role === "user"),
    [messages]
  );

  const quickSuggestions: string[] = isGuest
    ? [S.quickPrices, S.quickTomato, S.quickSell, S.quickJoin]
    : [S.quickPrices, S.quickWeather, S.quickTomato, S.quickKuku];

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text && !uploadedImage) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || "📷 (image)",
      timestamp: new Date(),
    };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let res;
      if (uploadedImage) {
        const fd = new FormData();
        fd.append("query", text);
        fd.append("farmer_id", farmerId);
        fd.append("is_guest", String(isGuest));
        fd.append("language", lang);
        const blob = await (await fetch(uploadedImage)).blob();
        fd.append("image", blob, "plant.jpg");
        res = await api.post("/knowledge/ask", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        });
      } else {
        res = await api.post(
          "/knowledge/ask",
          {
            query: text,
            farmer_id: farmerId,
            is_guest: isGuest,
            language: lang,
          },
          { timeout: 30000 }
        );
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.data.answer,
        sources: res.data.sources || [],
        timestamp: new Date(),
      };
      setMessages((p) => [...p, assistantMsg]);
      setUploadedImage(null);
    } catch (err) {
      console.error("Knowledge error:", err);
      setMessages((p) => [
        ...p,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: S.errorGeneric,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Follow-up suggestions for the latest exchange
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const latestUser = [...messages].reverse().find((m) => m.role === "user");
  const followUps =
    latestUser && lastAssistant && lastAssistant.id !== "welcome"
      ? buildSuggestions(latestUser.content, lang, isGuest)
      : [];

  const currentCta = GUEST_CTAS[guestCtaIndex];
  const CtaIcon = currentCta.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 animate-fade-in">
      <div className="w-full max-w-2xl h-[88vh] md:h-[85vh] flex flex-col bg-white dark:bg-gray-950 rounded-3xl shadow-2xl overflow-hidden border border-emerald-900/20">

        {/* ─────────────── HEADER ─────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#062b22] via-[#0d4a3d] to-[#0a3d32] text-white">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-lime-300/10 rounded-full blur-3xl" />

          <div className="relative px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🌾</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-lime-400 border-2 border-[#062b22] animate-pulse" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold leading-tight truncate">{S.title}</h2>
                <p className="text-[11px] text-emerald-200/70 truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                  {S.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Language toggle */}
              <div className="flex items-center bg-white/10 backdrop-blur rounded-full p-0.5 border border-white/15">
                {(["sw", "en"] as Lang[]).map((L) => (
                  <button
                    key={L}
                    onClick={() => setLang(L)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider transition-all ${
                      lang === L
                        ? "bg-gradient-to-r from-emerald-400 to-lime-400 text-[#062b22] shadow"
                        : "text-white/60 hover:text-white"
                    }`}
                    title={L === "sw" ? "Kiswahili" : "English"}
                  >
                    {L.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        </div>

        {/* ─────────────── MESSAGES ─────────────── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2.5 max-w-[82%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot size={14} className="text-white" />
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-tr-sm shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-700"
                  }`}
                >
                  {msg.content}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-gray-200 dark:border-gray-700 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">
                        {S.sources}
                      </p>
                      {msg.sources.slice(0, 3).map((s, i) => (
                        <a
                          key={i}
                          href={s.url || s.source || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          <FileText size={11} />
                          <span className="truncate">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 italic">{S.thinking}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick-start chips (first message only) */}
          {!hasUserMessaged && !loading && (
            <div className="pt-2">
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
                <MessageCircle size={11} /> {S.tryAsking}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-emerald-100 dark:border-gray-700 text-[12px] text-emerald-700 dark:text-emerald-300 font-medium hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up suggestions */}
          {hasUserMessaged && followUps.length > 0 && !loading && (
            <div className="pt-1">
              <div className="flex flex-wrap gap-2">
                {followUps.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-emerald-100 dark:border-gray-700 text-[12px] text-emerald-700 dark:text-emerald-300 font-medium hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─────────────── GUEST CTA (rotating) ─────────────── */}
        {isGuest && (
          <div className="px-4 md:px-6 pt-3 pb-1 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-lime-50 dark:from-emerald-900/20 dark:to-gray-900 border border-emerald-100 dark:border-emerald-900/30 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-lime-400 flex items-center justify-center flex-shrink-0">
                <CtaIcon size={16} className="text-[#062b22]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-gray-900 dark:text-white truncate">
                  {(S as any)[currentCta.titleKey]}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {(S as any)[currentCta.bodyKey]}
                </p>
              </div>
              <button
                onClick={() => (window.location.href = currentCta.href)}
                className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-lime-500 text-white text-[11px] font-bold shadow hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all"
              >
                {(S as any)[currentCta.btnKey]}
                <ArrowUpRight size={11} />
              </button>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                {GUEST_CTAS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-0.5 rounded-full transition-all ${
                      i === guestCtaIndex ? "w-4 bg-emerald-400" : "w-1 bg-gray-300 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─────────────── INPUT ─────────────── */}
        <div className="px-4 md:px-6 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          {uploadedImage && (
            <div className="mb-2.5 relative inline-block">
              <img
                src={uploadedImage}
                alt="preview"
                className="h-14 w-14 object-cover rounded-xl border-2 border-emerald-400"
              />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow"
              >
                <X size={11} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => setUploadedImage(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-500 hover:text-emerald-600 transition-colors"
              title={lang === "sw" ? "Pakia picha ya mmea" : "Upload plant photo"}
            >
              <ImageIcon size={18} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={S.placeholder}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-[14px] text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all"
            />

            <button
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !uploadedImage)}
              className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white hover:shadow-emerald-500/40 hover:scale-[1.03] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              title={S.send}
            >
              {loading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[10px] text-gray-400">
            <span className="flex items-center gap-1.5">
              <Leaf size={10} className="text-emerald-500" />
              <span className="italic truncate max-w-[340px]">
                {lang === "sw"
                  ? "Mtaka cha uvunguni huinama — bidii hulipa"
                  : "Hard work pays — stay consistent"}
              </span>
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <Sparkles size={10} className="text-amber-500" />
              Powered by FreeFlow
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
