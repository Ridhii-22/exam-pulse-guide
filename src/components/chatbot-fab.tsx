import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai"; text: string };

export function ChatbotFab() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: "Hi! I'm your NEET doubt assistant. Ask me anything — concepts, problems, or NCERT lines.",
    },
  ]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMsgs((m) => [
      ...m,
      { role: "user", text: q },
      {
        role: "ai",
        text: "Here's a clean explanation — (connect Lovable Cloud + AI Gateway to enable live answers).",
      },
    ]);
    setInput("");
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed z-40 right-5 bottom-20 lg:bottom-6 size-14 rounded-full bg-primary text-primary-foreground grid place-items-center shadow-elevated hover:scale-105 transition-transform",
        )}
        aria-label="Open chatbot"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      {open && (
        <div className="fixed z-40 right-4 bottom-40 lg:bottom-24 w-[min(380px,calc(100vw-2rem))] h-[520px] card-soft flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/15 text-primary grid place-items-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Doubt Assistant</div>
              <div className="text-[11px] text-muted-foreground">AI-powered • beta</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] text-sm px-3 py-2 rounded-xl",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-surface-2 text-foreground rounded-bl-sm",
                )}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a doubt…"
              className="flex-1 bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm focus-ring"
            />
            <button
              onClick={send}
              className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center hover:opacity-90 transition"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
