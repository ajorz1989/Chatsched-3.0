import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import type { Message, SenderRole } from "../lib/types";

export default function MessageThread({ requestId, senderRole }: { requestId: string; senderRole: SenderRole }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as Message[]);
    setLoaded(true);
  }

  useEffect(() => {
    if (open && !loaded) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function send() {
    if (!body.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      request_id: requestId,
      sender_id: user.id,
      sender_role: senderRole,
      body: body.trim(),
    });
    setSending(false);
    if (!error) {
      setBody("");
      load();
      // Best-effort — a failed notification email shouldn't undo a message
      // that already sent successfully.
      supabase.functions.invoke("notify", { body: { kind: "new_message", request_id: requestId } }).catch(() => {});
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-xs font-semibold uppercase text-billboard-inkSoft underline"
      >
        {open ? "Hide messages" : `Messages${loaded && messages.length > 0 ? ` (${messages.length})` : ""}`}
      </button>

      {open && (
        <div className="mt-3 border-2 border-billboard-ink rounded p-3 bg-white">
          {!loaded ? (
            <p className="text-xs text-billboard-inkSoft">Loading…</p>
          ) : messages.length === 0 ? (
            <p className="text-xs text-billboard-inkSoft mb-2">No messages yet — say hello below.</p>
          ) : (
            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className={`text-sm p-2.5 rounded border-2 ${m.sender_role === senderRole ? "border-billboard-greenDeep bg-[#EAF3EC] ml-6" : "border-billboard-ink bg-billboard-paperDim mr-6"}`}>
                  <p className="font-mono text-[10px] uppercase text-billboard-inkSoft mb-1">
                    {m.sender_role === "admin" ? "Platform" : m.sender_role === "publisher" ? "Publisher" : "Business"} · {new Date(m.created_at).toLocaleString()}
                  </p>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Write a message…"
              className="flex-1 border-2 border-billboard-ink rounded px-3 py-2 text-sm"
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="border-2 border-billboard-ink font-bold px-4 rounded text-sm hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
