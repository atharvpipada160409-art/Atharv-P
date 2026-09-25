import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, CornerDownLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { AdvisorChatMessage } from '../../types';
import { api } from '../../services/api';

interface AIChatContainerProps {
  onSuggestedClick?: (prompt: string) => void;
}

export const AIChatContainer: React.FC<AIChatContainerProps> = () => {
  const [messages, setMessages] = useState<AdvisorChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello, I am CashFlowIQ AI — your virtual CFO and financial strategist. I have analyzed your live ledger, active accounts, recurring commitments, and current burn rate. What strategic inquiry or scenario would you like to examine today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionSuggestions: [
        "How can I extend our runway by 60 days?",
        "What are our largest recurring SaaS leaks?",
        "Can I afford to hire a full-time engineer at $6,500/mo?"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: AdvisorChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        content: m.content
      }));

      const res = await api.chatAdvisor({
        message: messageText.trim(),
        history
      });

      const assistantMsg: AdvisorChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionSuggestions: res.actionSuggestions,
        metricsCited: res.metricsCited
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AdvisorChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error consulting AI Advisor: ${err.message || 'Network error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[600px] border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              Live AI Financial Advisor
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                gemini-2.5-flash
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Contextual CFO advisory grounded strictly on your ledger</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-indigo-400 border border-slate-700'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>

              <div className="space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Metrics Cited */}
                  {msg.metricsCited && msg.metricsCited.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                      {msg.metricsCited.map((m, i) => (
                        <div key={i} className="p-1.5 rounded bg-slate-950/60 border border-slate-800/80">
                          <span className="text-slate-400 block text-[10px]">{m.label}</span>
                          <span className="font-mono font-semibold text-indigo-300">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action suggestions */}
                {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.actionSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer text-left"
                      >
                        ⚡ {sug}
                      </button>
                    ))}
                  </div>
                )}

                <span className={`block text-[10px] text-slate-500 ${isUser ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 mr-auto max-w-[80%]">
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">Synthesizing CFO recommendation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask CFO advisor (e.g., 'How can we extend runway past 90 days?')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!input.trim() || isLoading}
            isLoading={isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
