'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Send, ArrowLeft, AlertTriangle, Copy, Check } from 'lucide-react';

const MODE_STYLES: Record<string, { color: string; label: string; icon: string }> = {
  STANDARD:       { color: 'text-vm-fuchsia',       label: 'STANDARD',       icon: '💬' },
  ACCOUNTABILITY: { color: 'text-vm-red',           label: 'ACCOUNTABILITY', icon: '⚠️' },
  PHILOSOPHICAL:  { color: 'text-purple-400',       label: 'PHILOSOPHICAL',  icon: '🧠' },
  TACTICAL:       { color: 'text-vm-blue',          label: 'TACTICAL',       icon: '🧊' },
  SPIRITUAL:      { color: 'text-gold-bright',      label: 'SPIRITUAL',      icon: '🌿' },
};

function detectMode(text: string): string {
  const match = text.match(/\[(\w+) MODE\]/);
  return match ? match[1] : '';
}

function cleanText(text: string): string {
  return text.replace(/^[💬⚠️🧠🎯🌿🧊]\s*\[\w+ MODE\]\s*/u, '');
}

// ─── CodeBlock Component with Copy Button ──────────────────────────────────────
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-2 mb-4 group rounded bg-[#030914] border border-cyan-900/30 overflow-hidden font-mono text-xs">
      <div className="flex justify-between items-center bg-[#050c18] px-3 py-1.5 border-b border-cyan-900/30">
        <span className="text-cyan-600 tracking-widest uppercase text-[9px]">{language || 'CODE'}</span>
        <button
          onClick={handleCopy}
          className="text-cyan-600 hover:text-cyan-400 transition-colors flex items-center gap-1 text-[9px] tracking-widest uppercase"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-gray-300 whitespace-pre-wrap word-break">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Advanced Lightweight Markdown Renderer ────────────────────────────────────
function MarkdownText({ text }: { text: string }) {
  // Tokenize the text into blocks: code, text
  const blocks = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let currentCode = '';
  let codeLang = '';
  let currentText = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({ type: 'code', content: currentCode.trimEnd(), lang: codeLang });
        inCodeBlock = false;
        currentCode = '';
      } else {
        if (currentText) {
          blocks.push({ type: 'text', content: currentText });
          currentText = '';
        }
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
    } else {
      if (inCodeBlock) {
        currentCode += line + '\n';
      } else {
        currentText += line + '\n';
      }
    }
  }
  if (currentText) blocks.push({ type: 'text', content: currentText });
  if (inCodeBlock) blocks.push({ type: 'code', content: currentCode.trimEnd(), lang: codeLang }); // unclosed block

  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={idx} code={block.content} language={block.lang} />;
        }
        
        // Render text block line by line
        return (
          <div key={idx} className="space-y-1">
            {block.content.split('\n').map((line, i) => {
              if (line.trim() === '') return <div key={i} className="h-1" />;
              if (line.startsWith('## ')) return <h2 key={i} className="text-vm-fuchsia font-bold text-sm mt-2">{line.slice(3)}</h2>;
              if (line.startsWith('# ')) return <h1 key={i} className="text-vm-fuchsia font-bold text-base mt-2">{line.slice(2)}</h1>;
              if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-3 list-disc text-gray-300">{line.slice(2)}</li>;
              
              // Handle inline code `foo` and bold **foo**
              // Regex trick to split by `code` or **bold** while capturing them
              const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
              return (
                <p key={i} className="leading-relaxed text-gray-300">
                  {parts.map((part, j) => {
                    if (part.startsWith('`') && part.endsWith('`')) {
                      return <code key={j} className="bg-white/10 px-1 py-0.5 rounded text-cyan-200 text-[11px]">{part.slice(1, -1)}</code>;
                    }
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={j} className="text-gray-100">{part.slice(2, -2)}</strong>;
                    }
                    return <span key={j}>{part}</span>;
                  })}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'vm' | 'system';
  text: string;
  mode?: string;
  isStreaming?: boolean;
}

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8001`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
};
const API_BASE = getApiBase();

export default function ChatTerminal() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', text: 'VIRTUAL MIND 2.0 TERMINAL INITIALIZED.' },
    { role: 'system', text: 'NAFS FILTER ACTIVE. GEMINI BRAIN CONNECTED.' },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fromCommand, setFromCommand] = useState(false);
  
  // Smart Scrolling
  const endRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Input
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mobile Keyboard dvh fix
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        document.documentElement.style.setProperty('--viewport-height', `${window.visualViewport.height}px`);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize();
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and Fetch History
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('from') === 'command') {
        setFromCommand(true);
      }
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat/history?limit=20`);
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            const histMessages: Message[] = [];
            history.forEach((h: any) => {
              histMessages.push({ role: 'user', text: h.user });
              histMessages.push({ role: 'vm', text: h.assistant, mode: detectMode(h.assistant) });
            });
            setMessages(prev => [...prev, { role: 'system', text: 'RESTORING LOCAL STATE...' }, ...histMessages, { role: 'system', text: 'AWAITING OPERATOR INPUT.' }]);
            setTimeout(scrollToBottom, 100);
          } else {
             setMessages(prev => [...prev, { role: 'system', text: 'AWAITING OPERATOR INPUT.' }]);
          }
        }
      } catch (e) {
        console.error('Failed to fetch history', e);
        setMessages(prev => [...prev, { role: 'system', text: 'AWAITING OPERATOR INPUT.' }]);
      }
    };
    fetchHistory();
  }, []);

  // Concurrent Tab Polling
  useEffect(() => {
    let interval: any;
    if (!isStreaming) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/chat/history?limit=20`);
          if (res.ok) {
            const history = await res.json();
            if (history.length > 0) {
              const histMessages: Message[] = [];
              history.forEach((h: any) => {
                histMessages.push({ role: 'user', text: h.user });
                histMessages.push({ role: 'vm', text: h.assistant, mode: detectMode(h.assistant) });
              });
              
              setMessages(prev => {
                const prevChatMessages = prev.filter(m => m.role === 'user' || m.role === 'vm');
                if (prevChatMessages.length !== histMessages.length) {
                  setTimeout(scrollToBottom, 100);
                  return [{ role: 'system', text: 'SYNCING EXTERNAL STATE...' }, ...histMessages, { role: 'system', text: 'AWAITING OPERATOR INPUT.' }];
                }
                return prev;
              });
            }
          }
        } catch (e) {}
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Handle Scroll tracking for Smart Auto-Scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // User is at bottom if they are within 40px of the bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 40;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto' });
    setIsAtBottom(true);
  }, []);

  // Auto-scroll while streaming only if we are at the bottom
  useEffect(() => {
    if (isStreaming && isAtBottom) {
      endRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isStreaming, isAtBottom]);

  // Focus textarea on load
  useEffect(() => { textareaRef.current?.focus(); }, []);

  // Textarea auto-resize
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = input.trim();
    
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    setIsStreaming(true);

    setMessages(prev => [
      ...prev,
      { role: 'user', text: userMessage },
      { role: 'vm', text: '', isStreaming: true },
    ]);

    setTimeout(scrollToBottom, 50);

    const controller = new AbortController();
    const connectTimeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${API_BASE}/api/chat/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      });
      clearTimeout(connectTimeoutId);

      if (!response.ok) {
        setMessages(prev => {
          const a = [...prev];
          a[a.length - 1] = { role: 'system', text: `ERROR: API returned ${response.status}. Check backend.` };
          return a;
        });
        setInput(userMessage); // Restore input on failure
        setIsStreaming(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let aiText = '';
        let buffer = '';

        while (true) {
          // 15s streaming timeout for mid-stream hanging
          const chunkPromise = reader.read();
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('STREAM_TIMEOUT')), 15000));
          
          const { done, value } = await Promise.race([chunkPromise, timeoutPromise]) as any;
          
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || ''; // Keep the last incomplete part in the buffer

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
              } catch (err) { 
                // Ignore partial JSON, it will be caught in the next chunk if we did buffering correctly
                // But since we split by \n\n it should usually be a full valid JSON chunk.
              }
            }
          }
        }
        
        // Finalize
        setMessages(prev => {
          const a = [...prev];
          a[a.length - 1] = { role: 'vm', text: aiText, isStreaming: false, mode: detectMode(aiText) };
          return a;
        });
      }
    } catch (e: any) {
      setMessages(prev => {
        const a = [...prev];
        const errorMsg = e.message === 'STREAM_TIMEOUT' || e.name === 'AbortError' 
          ? 'ERROR: STREAM TIMEOUT. CONNECTION ABORTED.' 
          : 'ERROR: NETWORK FAILURE. BRAIN OFFLINE.';
        a[a.length - 1] = { role: 'system', text: errorMsg };
        return a;
      });
      setInput(userMessage); // Restore input
    } finally {
      setIsStreaming(false);
      textareaRef.current?.focus();
    }
  }, [input, isStreaming, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      className="fixed inset-0 w-full bg-obsidian text-gray-300 font-mono flex flex-col overflow-hidden"
      style={{ height: 'var(--viewport-height, 100dvh)' }}
    >
      <div className="scanline-overlay pointer-events-none z-50" />

      {/* Header */}
      <header className="shrink-0 border-b border-surface2 px-6 pb-3 pt-safe flex justify-between items-center bg-obsidian/95 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <button id="chat-back-btn" onClick={() => router.push(fromCommand ? '/command' : '/home')} className="text-text-dim hover:text-vm-fuchsia transition-colors p-2 -ml-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading text-vm-fuchsia tracking-widest flex items-center gap-2">
            <Terminal className="w-4 h-4" /> VIRTUAL MIND TERMINAL
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-[10px] tracking-widest ${isStreaming ? 'text-gold animate-pulse' : 'text-vm-fuchsia'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-gold' : 'bg-vm-fuchsia shadow-[0_0_8px_rgba(232,121,249,0.8)]'}`} />
            {isStreaming ? 'PROCESSING' : 'READY'}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-5 relative z-0 scroll-smooth"
      >
        {/* Watermark to remind the user where they are */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] z-[-1]">
          <span className="text-[12vw] font-heading font-bold text-vm-fuchsia whitespace-nowrap -rotate-12 tracking-widest">
            VIRTUAL MIND
          </span>
        </div>
        {messages.map((msg, idx) => {
          if (msg.role === 'system') {
            return (
              <div key={idx} className="text-text-dim/60 text-[10px] tracking-widest uppercase py-1">
                {'>'} {msg.text}
              </div>
            );
          }
          if (msg.role === 'user') {
            return (
              <div key={idx} className="flex gap-3 justify-end group">
                <div className="bg-surface2/30 border border-surface2 rounded-lg px-4 py-3 max-w-[85%] text-gray-300 text-sm whitespace-pre-wrap word-break leading-relaxed">
                  {msg.text}
                </div>
              </div>
            );
          }
          
          // VM Response
          const mode = msg.mode;
          const modeStyle = mode ? MODE_STYLES[mode] : null;
          const displayText = cleanText(msg.text);
          return (
            <div key={idx} className="space-y-2 max-w-[95%]">
              {modeStyle && (
                <div className={`text-[10px] tracking-[0.3em] flex items-center gap-2 ${modeStyle.color}`}>
                  <span>{modeStyle.icon}</span>
                  <span>{modeStyle.label} MODE</span>
                  {mode === 'ACCOUNTABILITY' && <AlertTriangle className="w-3 h-3" />}
                </div>
              )}
              <div className={`border-l-2 pl-4 md:pl-5 py-1 text-sm ${
                mode === 'ACCOUNTABILITY' ? 'border-vm-red/60 text-vm-red/90' :
                mode === 'SPIRITUAL' ? 'border-vm-fuchsia/60 text-vm-fuchsia/90' :
                mode === 'TACTICAL' ? 'border-vm-blue/60' :
                mode === 'PHILOSOPHICAL' ? 'border-purple-500/60 text-purple-300' :
                'border-vm-fuchsia/30'
              }`}>
                {msg.isStreaming && displayText === ''
                  ? <span className="animate-pulse text-text-dim tracking-widest">AWAITING NEURAL LINK...</span>
                  : <MarkdownText text={displayText} />
                }
                {msg.isStreaming && displayText !== '' && (
                  <span className="animate-cursor ml-1 inline-block w-2 h-4 bg-vm-fuchsia align-middle" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} className="h-4" />
      </div>

      {/* "Scroll to bottom" floater */}
      {!isAtBottom && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <button 
            onClick={scrollToBottom}
            className="bg-surface border border-surface2 text-text-dim text-[10px] tracking-widest px-4 py-1.5 rounded-full shadow-lg hover:text-white transition-colors"
          >
            ↓ NEW MESSAGES BELOW
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="shrink-0 border-t border-surface2 p-3 bg-obsidian/95 backdrop-blur z-10">
        <div className="flex items-end bg-surface border border-surface2 focus-within:border-vm-fuchsia/40 transition-colors rounded-lg overflow-hidden pr-2">
          <span className="text-vm-fuchsia px-4 py-3.5 font-bold text-lg select-none">{'>'}</span>
          <textarea
            ref={textareaRef}
            id="terminal-input"
            className="flex-1 bg-transparent py-3.5 border-none outline-none text-gray-200 placeholder-text-dim/40 text-sm resize-none"
            placeholder={isStreaming ? 'PROCESSING...' : 'ENTER COMMAND... (Shift+Enter for new line)'}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            style={{ minHeight: '52px', maxHeight: '150px' }}
          />
          <button
            id="send-btn"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="px-3 py-3 my-1 ml-2 text-vm-fuchsia hover:bg-vm-fuchsia/10 rounded-md disabled:opacity-30 transition-colors flex shrink-0 items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
