// farm-fuzion-frontend/src/components/Knowledge/KnowledgeModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { 
  X, Send, Bot, User, ThumbsUp, ThumbsDown, 
  BookOpen, Search, FileText, Volume2, Globe,
  Image as ImageIcon, Upload, Loader
} from "lucide-react";
import { api } from "../../services/api";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
  timestamp: Date;
}

interface KnowledgeModalProps {
  farmerId: string;
  onClose: () => void;
}

export default function KnowledgeModal({ farmerId, onClose }: KnowledgeModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "🌾 Hello! I'm your AI farming assistant. Ask me anything about crops, livestock, weather, markets, or farming practices. You can also upload images of plants for disease identification!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories for knowledge filtering
  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'crops', name: 'Crops', icon: '🌽' },
    { id: 'livestock', name: 'Livestock', icon: '🐄' },
    { id: 'weather', name: 'Weather', icon: '☀️' },
    { id: 'market', name: 'Market Prices', icon: '💰' },
    { id: 'soil', name: 'Soil Health', icon: '🌱' },
    { id: 'pests', name: 'Pest Control', icon: '🐛' },
    { id: 'irrigation', name: 'Irrigation', icon: '💧' },
  ];

  // Suggested questions
  const suggestedQuestions = [
    "When should I plant maize in Nakuru?",
    "How to control fall armyworm?",
    "Best fertilizers for tomatoes",
    "Dairy cow feeding schedule",
    "Weather forecast for next week",
    "Current market prices for beans"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Prepare request with image if available
      const formData = new FormData();
      formData.append('query', input);
      formData.append('category', selectedCategory);
      formData.append('farmer_id', farmerId);
      if (uploadedImage) {
        formData.append('image', uploadedImage);
      }

      const response = await api.post('/knowledge/ask', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 second timeout for AI processing
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setUploadedImage(null); // Clear image after sending
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to my knowledge base. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    api.post('/knowledge/feedback', {
      message_id: messageId,
      feedback: isPositive ? 'positive' : 'negative'
    }).catch(console.error);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-brand-dark rounded-xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <BookOpen size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Knowledge Hub</h2>
                <p className="text-white/80 text-sm">AI-powered farming assistant & knowledge base</p>
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
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-white text-purple-600 font-medium'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.role === 'assistant' ? (
                    <Bot size={16} className="text-purple-600" />
                  ) : (
                    <User size={16} className="text-white" />
                  )}
                  <span className="text-xs opacity-75">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="prose dark:prose-invert max-w-none">
                  {msg.content}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-xs font-medium mb-1">Sources:</p>
                    <div className="space-y-1">
                      {msg.sources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs flex items-center gap-1 hover:underline"
                        >
                          <FileText size={12} />
                          {source.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback buttons (for assistant messages) */}
                {msg.role === 'assistant' && msg.id !== 'welcome' && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleFeedback(msg.id, true)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Helpful"
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, false)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Not helpful"
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <Loader size={20} className="animate-spin text-purple-600" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(q);
                    handleSend();
                  }}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {/* Image preview */}
          {uploadedImage && (
            <div className="mb-2 relative inline-block">
              <img
                src={uploadedImage}
                alt="Upload preview"
                className="h-16 w-16 object-cover rounded-lg"
              />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Upload image for plant disease detection"
            >
              <ImageIcon size={20} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask your farming question..."
              className="flex-1 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !uploadedImage)}
              className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>

          <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Globe size={12} />
              <span>Responses in English & Swahili</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 size={12} />
              <span>Text-to-speech available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
