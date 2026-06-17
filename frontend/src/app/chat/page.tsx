'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Send, ArrowLeft, AlertTriangle } from 'lucide-react';

const MODE_STYLES: Record<string, { color: string; label: string; icon: string }> = {
  STANDARD:       { color: 'text-vm-fuchsia',       label: 'STANDARD',       icon: '' },
  ACCOUNTABILITY: { color: 'text-vm-red',     label: 'ACCOUNTABILITY', icon: '' },
  PHILOSOPHICAL:  { color: 'text-purple-400', label: 'PHILOSOPHICAL',  icon: '' },
  TACTICAL:       { color: 'text-vm-blue',    label: 'TACTICAL',       icon: '' },
  SPIRITUAL:      { color: 'text-gold-bright',label: 'SPIRITUAL',      icon: '' },
};

function detectMode(text: string): string {
  const match = text.match(/\[(\w+) MODE\]/);
  return match ? match[1] : '';
}

function cleanText(text: string): string {
  return text.replace(/^[]\s*\[\w+ MODE\]\s*/u, '');
}

// Very lightweight markdown renderer (no external dep)
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-vm-fuchsia font-bold text-sm mt-2">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-vm-fuchsia font-bold text-base mt-2">{line.slice(2)}</h1>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-gray-200">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-3 list-disc text-gray-300">{line.slice(2)}</li>;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        // Inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed text-gray-300">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-gray-100">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

interface Message {
  role: 'user' | 'vm' | 'system';
  text: string;
  mode?: string;
  isStreaming?: boolean;
}

export default function ChatTerminal() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', text: 'VIRTUAL MIND 2.0 TERMINAL INITIALIZED.' },
    { role: 'system', text: 'NAFS FILTER ACTIVE. GEMINI BRAIN CONNECTED.' },
    { role: 'system', text: 'AWAITING OPERATOR INPUT.' },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fromCommand, setFromCommand] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') === 'command') {
        setFromCommand(true);
      }
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);

    setMessages(prev => [
      ...prev,
      { role: 'user', text: userMessage },
      { role: 'vm', text: '', isStreaming: true },
    ]);

    try {
      const getApiBase = () => {
        return typeof window !== 'undefined' 
          ? `${window.location.protocol}//${window.location.hostname}:8001`
          : 'http://127.0.0.1:8001';
      };
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/chat/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        setMessages(prev => {
          const a = [...prev];
          a[a.length - 1] = { role: 'system', text: `ERROR: API returned ${response.status}. Check backend.` };
          return a;
        });
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let aiText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  aiText += `\n[ERROR: ${data.error}]`;
                } else if (data.text) {
                  aiText += data.text;
                }
                setMessages(prev => {
                  const a = [...prev];
                  a[a.length - 1] = { role: 'vm', text: aiText, isStreaming: true, mode: detectMode(aiText) };
                  return a;
                });
              } catch { /* ignore partial JSON */ }
            }
          }
        }
        // Finalize — remove streaming flag
        setMessages(prev => {
          const a = [...prev];
          const finalText = aiText;
          a[a.length - 1] = { role: 'vm', text: finalText, isStreaming: false, mode: detectMode(finalText) };
          return a;
        });
      }
    } catch (e) {
      setMessages(prev => {
        const a = [...prev];
        a[a.length - 1] = { role: 'system', text: 'ERROR: NETWORK FAILURE. BRAIN OFFLINE.' };
        return a;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, isStreaming]);

  return (
    <div className="fixed inset-0 flex flex-col bg-obsidian text-gray-300 font-mono overflow-hidden">
      <div className="scanline-overlay pointer-events-none z-0" />

      {/* Header */}
      <header className="shrink-0 border-b border-surface2 px-6 pb-3 pt-safe flex justify-between items-center bg-obsidian/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button id="chat-back-btn" onClick={() => router.push(fromCommand ? '/command' : '/home')} className="text-text-dim hover:text-vm-fuchsia transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading text-vm-fuchsia tracking-widest flex items-center gap-2">
            <Terminal className="w-4 h-4" /> VIRTUAL MIND TERMINAL
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-[10px] tracking-widest ${isStreaming ? 'text-gold animate-pulse' : 'text-vm-fuchsia'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-gold' : 'bg-vm-fuchsia'}`} />
            {isStreaming ? 'PROCESSING' : 'READY'}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 relative z-0">
        {messages.map((msg, idx) => {
          if (msg.role === 'system') {
            return (
              <div key={idx} className="text-text-dim/60 text-[10px] tracking-widest uppercase">
                {'>'} {msg.text}
              </div>
            );
          }
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex gap-3">
                <span className="text-vm-fuchsia/40 shrink-0 mt-0.5">{'>'}</span>
                <p className="text-gray-400 text-sm leading-relaxed">{msg.text}</p>
              </div>
            );
          }
          // VM response
          const mode = msg.mode;
          const modeStyle = mode ? MODE_STYLES[mode] : null;
          const displayText = cleanText(msg.text);
          return (
            <div key={idx} className="space-y-2">
              {modeStyle && (
                <div className={`text-[10px] tracking-[0.3em] flex items-center gap-2 ${modeStyle.color}`}>
                  <span>{modeStyle.icon}</span>
                  <span>{modeStyle.label} MODE</span>
                  {mode === 'ACCOUNTABILITY' && <AlertTriangle className="w-3 h-3" />}
                </div>
              )}
              <div className={`border-l-2 pl-4 text-sm ${
                mode === 'ACCOUNTABILITY' ? 'border-vm-red/60 text-vm-red/90' :
                mode === 'SPIRITUAL' ? 'border-vm-fuchsia/60 text-vm-fuchsia/90' :
                mode === 'TACTICAL' ? 'border-vm-blue/60' :
                mode === 'PHILOSOPHICAL' ? 'border-purple-500/60 text-purple-300' :
                'border-vm-fuchsia/30'
              }`}>
                {msg.isStreaming && displayText === ''
                  ? <span className="animate-pulse text-text-dim">...</span>
                  : <MarkdownText text={displayText} />
                }
                {msg.isStreaming && displayText !== '' && (
                  <span className="animate-cursor" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-surface2 p-3 bg-obsidian/95 backdrop-blur z-10">
        <div className="flex items-center bg-surface border border-surface2 focus-within:border-vm-fuchsia/40 transition-colors">
          <span className="text-vm-fuchsia px-4 font-bold text-lg select-none">{'>'}</span>
          <input
            ref={inputRef}
            id="terminal-input"
            type="text"
            className="flex-1 bg-transparent py-3 border-none outline-none text-gray-200 placeholder-text-dim/40 text-sm"
            placeholder={isStreaming ? 'PROCESSING...' : 'ENTER COMMAND...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isStreaming}
          />
          <button
            id="send-btn"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-3 text-vm-fuchsia hover:text-vm-fuchsia/70 disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-text-dim/30 tracking-widest mt-2 text-center">
          NAFS FILTER ACTIVE — DRIFT WILL BE CALLED OUT
        </p>
      </div>
    </div>
  );
}
