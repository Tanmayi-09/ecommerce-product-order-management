import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User as UserIcon, ShoppingCart, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { Product } from '../../shared/types.ts';
import { useCart } from '../context/CartContext.tsx';

interface AiShoppingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewProduct?: (productId: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  recommendedProducts?: Product[];
}

export const AiShoppingModal: React.FC<AiShoppingModalProps> = ({
  isOpen,
  onClose,
  onViewProduct,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello! I am your AI Shopping Assistant. Ask me for recommendations, compare specs, or find products within your budget from our real warehouse inventory!',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { addToCart } = useCart();

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map((m) => ({ role: m.role, content: m.content }));
      const res = await api.ai.askAssistant(textToSend, history);

      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.message,
            recommendedProducts: res.recommendedProducts,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an issue retrieving recommendations. Please try again.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach the assistant service right now. Please explore our product catalog directly.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'I need a laptop for programming',
    'Best noise cancelling headphones',
    'Accessories under ₹5,000',
    'Show fast chargers with GaN tech',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">AI Shopping Assistant</h3>
              <p className="text-xs text-indigo-100">
                Catalog-grounded intelligence powered by Gemini & live warehouse inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                {/* Grounded Recommended Products Grid */}
                {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Verified Catalog Matches:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.recommendedProducts.map((p) => (
                        <div
                          key={p.productId}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between hover:border-indigo-300 transition-all"
                        >
                          <div className="flex gap-2">
                            <img
                              src={p.image}
                              alt={p.productName}
                              className="w-12 h-12 object-cover rounded-lg bg-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-medium text-xs text-slate-900 truncate">
                                {p.productName}
                              </h4>
                              <p className="text-xs font-bold text-indigo-600">
                                ₹{p.price.toLocaleString('en-IN')}
                              </p>
                              <span className="text-[10px] text-emerald-600 font-medium">
                                In Stock: {p.stockQuantity} units
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                            {onViewProduct && (
                              <button
                                onClick={() => {
                                  onViewProduct(p.productId);
                                  onClose();
                                }}
                                className="flex-1 text-[11px] font-medium text-slate-600 hover:text-indigo-600 py-1"
                              >
                                View Details
                              </button>
                            )}
                            <button
                              onClick={() => addToCart(p.productId, 1)}
                              className="flex items-center justify-center gap-1 bg-indigo-600 text-white text-[11px] font-medium px-2 py-1 rounded-md hover:bg-indigo-700 transition-colors"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-500 text-xs italic">
              <Bot className="w-5 h-5 text-indigo-600 animate-spin" />
              <span>Analyzing live catalog and inventory...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-slate-500 font-medium py-1">Try:</span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] bg-white border border-slate-300 hover:border-indigo-400 hover:text-indigo-600 rounded-full px-2.5 py-1 text-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about products, pricing, or recommendations..."
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
