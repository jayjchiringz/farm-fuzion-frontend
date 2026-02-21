// farm-fuzion-frontend/src/components/Knowledge/KnowledgeModal.tsx
// Updated with Mkulima Halisi personality

import React, { useState, useEffect, useRef } from "react";
import { 
  X, Send, Bot, User, ThumbsUp, ThumbsDown, 
  BookOpen, Search, FileText, Volume2, Globe,
  Image as ImageIcon, Upload, Loader, Sun, Cloud,
  Sprout, Coffee, Wheat, Apple, Leaf
} from "lucide-react";
import { api } from "../../services/api";

// Mkulima Halisi - AI Farming Assistant
const MKULIMA_HALISI = {
  name: "Mkulima Halisi",
  title: "Mshauri wa Kilimo",
  greeting: "Habari yako!",
  personality: {
    friendly: true,
    knowledgeable: true,
    patient: true,
    encouraging: true,
    local: true // Knows local farming practices
  },
  avatar: "🌾", // Farmer's choice - wheat sheaf
  expertise: [
    "Crop farming", "Livestock", "Weather patterns", 
    "Market prices", "Soil health", "Pest control"
  ]
};

// Kenyan greetings based on time of day
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Habari za asubuhi"; // Good morning
  if (hour < 17) return "Habari za mchana"; // Good afternoon
  if (hour < 20) return "Habari za jioni"; // Good evening
  return "Habari za usiku"; // Good night
};

// Seasonal greetings
const getSeasonalGreeting = () => {
  const month = new Date().getMonth() + 1;
  // Long rains: March-May
  // Short rains: October-December
  if (month >= 3 && month <= 5) return "Karibu katika msimu wa mvua za masika!";
  if (month >= 10 && month <= 12) return "Karibu katika msimu wa mvua za vuli!";
  return "Hali ya hewa nzuri kwa shughuli za shambani!";
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
  timestamp: Date;
  suggestions?: string[]; // Follow-up questions
}

interface KnowledgeModalProps {
  farmerId: string;
  farmerName?: string;
  onClose: () => void;
}

export default function KnowledgeModal({ farmerId, farmerName, onClose }: KnowledgeModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `${getTimeBasedGreeting()} ${
        farmerName ? `ndugu ${farmerName.split(' ')[0]}` : 'mkulima'
      }! 🌾\n\n` +
        `Mimi ni **Mkulima Halisi** - mshauri wako wa kilimo. ` +
        `Niko hapa kukusaidia kwa maswali yoyote kuhusu:\n\n` +
        `• Kilimo cha mazao (Crop farming)\n` +
        `• Ufugaji (Livestock)\n` +
        `• Hali ya hewa (Weather)\n` +
        `• Bei za soko (Market prices)\n` +
        `• Udongo na mbolea (Soil & fertilizers)\n` +
        `• Wadudu na magonjwa (Pests & diseases)\n\n` +
        `${getSeasonalGreeting()}\n\n` +
        `Niulize chochote - niko tayari kukusaidia! 🤝`,
      timestamp: new Date(),
      suggestions: [
        "Bei ya mahindi leo?",
        "Nishauri mbolea ya nyanya",
        "Dalili za ugonjwa wa kuku",
        "Mwelekeo wa hali ya hewa wiki hii"
      ]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories with Swahili names
  const categories = [
    { id: 'all', name: 'Yote', icon: '📚', swahili: 'Yote' },
    { id: 'crops', name: 'Mazao', icon: '🌽', swahili: 'Mazao' },
    { id: 'livestock', name: 'Mifugo', icon: '🐄', swahili: 'Mifugo' },
    { id: 'weather', name: 'Hali ya hewa', icon: '☀️', swahili: 'Hali ya Hewa' },
    { id: 'market', name: 'Soko', icon: '💰', swahili: 'Soko' },
    { id: 'soil', name: 'Udongo', icon: '🌱', swahili: 'Udongo' },
    { id: 'pests', name: 'Wadudu', icon: '🐛', swahili: 'Wadudu' },
  ];

  // Kenyan farming proverbs
  const proverbs = [
    "Mtaka cha uvunguni huinama - He who seeks what is under the bed must bend down (Hard work pays)",
    "Asiyefunzwa na mamaye hufunzwa na ulimwengu - He who is not taught by his mother is taught by the world",
    "Heri kufa macho kuliko kufa moyo - Better to lose your eyes than your heart (Stay hopeful)",
    "Mtumai cha ndevu, hupata usiku - He who waits for a beard gets it at night (Patience)",
    "Jino la tembo haliumi tembo - An elephant's tusk doesn't hurt the elephant (You are your own enemy)"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate typing indicator
  useEffect(() => {
    if (loading) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response;
      
      // OPTION B IMPLEMENTATION: Use JSON for text, multipart for images
      if (uploadedImage) {
        // Use FormData for image uploads
        const formData = new FormData();
        formData.append('query', input);
        formData.append('category', selectedCategory);
        formData.append('farmer_id', farmerId);
        
        // Convert base64 to blob for cleaner upload
        const base64Response = await fetch(uploadedImage);
        const blob = await base64Response.blob();
        formData.append('image', blob, 'plant-image.jpg');
        
        response = await api.post('/knowledge/ask', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000
        });
      } else {
        // Use JSON for text-only queries (cleaner, faster)
        response = await api.post('/knowledge/ask', {
          query: input,
          category: selectedCategory,
          farmer_id: farmerId
        }, {
          timeout: 30000
        });
      }

      // Generate follow-up suggestions based on context
      const suggestions = generateSuggestions(input, response.data.answer);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
        suggestions: suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setUploadedImage(null);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback friendly response
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Samahani, kuna tatizo la mtandao. Tafadhali jaribu tena baadaye. 🙏\n\n" +
                "Kwa sasa, unaweza kuangalia:\n" +
                "• Bei za soko kwenye dashibodi\n" +
                "• Hali ya hewa kwa eneo lako\n" +
                "• Orodha ya mazao kwenye ghala",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = (query: string, response: string): string[] => {
    // Simple keyword-based suggestion generator
    const suggestions = [];
    
    if (query.toLowerCase().includes('mahindi') || query.toLowerCase().includes('maize')) {
      suggestions.push('Bei ya mahindi wiki ijayo?', 'Mbolea gani kwa mahindi?', 'Wadudu wanaoshambulia mahindi');
    } else if (query.toLowerCase().includes('nyanya') || query.toLowerCase().includes('tomato')) {
      suggestions.push('Kumwagilia nyanya mara ngapi?', 'Magonjwa ya nyanya', 'Bei ya nyanya leo');
    } else if (query.toLowerCase().includes('kuku') || query.toLowerCase().includes('chicken')) {
      suggestions.push('Chakula cha kuku', 'Chanjo za kuku', 'Magonjwa ya kuku');
    } else {
      suggestions.push(
        'Bei za soko',
        'Hali ya hewa wiki hii',
        'Mazao yanayofaa msimu huu',
        'Mbolea asilia'
      );
    }
    
    return suggestions.slice(0, 3);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh]">
        
        {/* Header with Mkulima Halisi branding */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-600 to-green-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl backdrop-blur-sm">
                  {MKULIMA_HALISI.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-bold">{MKULIMA_HALISI.name}</h2>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                    {MKULIMA_HALISI.title}
        </span>
                </div>
                <p className="text-white/90 text-sm mt-1 max-w-2xl">
                  Mkulima Halisi - Your genuine farming companion. Niko hapa kukusaidia na maswali yako yote ya kilimo.
                </p>
                <div className="flex gap-2 mt-2">
                  {MKULIMA_HALISI.expertise.slice(0, 3).map((exp, idx) => (
                    <span key={idx} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Category Pills */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white text-green-700 font-medium shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.swahili}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none shadow-md'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {msg.role === 'assistant' ? (
                    <>
                      <span className="text-2xl">{MKULIMA_HALISI.avatar}</span>
                      <span className="font-medium text-sm">{MKULIMA_HALISI.name}</span>
                    </>
                  ) : (
                    <>
                      <User size={16} />
                      <span className="text-xs font-medium">Wewe</span>
                    </>
                  )}
                  <span className="text-xs opacity-75 ml-auto">
                    {msg.timestamp.toLocaleTimeString('sw-KE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs font-medium mb-2 opacity-75">Vyanzo vya habari:</p>
                    <div className="space-y-1">
                      {msg.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 hover:underline opacity-90"
                        >
                          <FileText size={12} />
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions/Follow-up questions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium mb-2 opacity-75">Maswali mengine:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(suggestion);
                            handleSend();
                          }}
                          className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback buttons */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => api.post('/knowledge/feedback', { message_id: msg.id, feedback: 'positive' })}
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Jibu hili linasaidia"
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      onClick={() => api.post('/knowledge/feedback', { message_id: msg.id, feedback: 'negative' })}
                      className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Jibu hili halijasaidia"
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none p-4 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">{MKULIMA_HALISI.avatar}</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-xl">
          {/* Image preview */}
          {uploadedImage && (
            <div className="mb-3 relative inline-block">
              <img
                src={uploadedImage}
                alt="Picha"
                className="h-20 w-20 object-cover rounded-lg border-2 border-green-500"
              />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setUploadedImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Pakia picha ya mmea au ugonjwa"
            >
              <ImageIcon size={20} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Andika swali lako hapa..."
              className="flex-1 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !uploadedImage)}
              className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>

          {/* Kenyan proverb of the day */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Leaf size={14} className="text-green-600" />
            <span className="italic">{proverbs[Math.floor(Math.random() * proverbs.length)]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
