import { useEffect, useRef, useState } from "react";
import { Send, X, Mic, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/providers/trpc";
import { useStoreSettings } from "@/lib/settings";

type UiMessage = { id: string; role: "user" | "model"; content: string };

export function ChatWidget() {
  const { t, locale } = useI18n();
  const { settings } = useStoreSettings();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const chat = trpc.ai.chat.useMutation();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);
  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((tr) => tr.stop());
  }, []);

  if (!settings.aiEnabled) return null;

  const submitText = (text: string) => {
    const userMsg: UiMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setBusy(true);
    chat.mutate(
      {
        messages: next.map((m) => ({ role: m.role, content: m.content })),
        locale,
      },
      {
        onSuccess: (res) => {
          setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "model", content: res.reply }]);
        },
        onError: () => {
          setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "model", content: t("chat.error") }]);
        },
        onSettled: () => setBusy(false),
      },
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    submitText(text);
  };

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const startRecording = async () => {
    if (busy || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return;
    setRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        chunksRef.current = [];
        setRecording(false);
        if (blob.size > 0) {
          const dataUrl = await blobToDataUrl(blob);
          submitText(`[audio:${dataUrl}]`);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const micSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  return (
    <>
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("chat.toggle")}
      >
        {open ? <X size={20} /> : <span className="chat-fab-dot">✦</span>}
      </button>

      {open && mounted ? (
        <div className="chat-panel" role="dialog" aria-label={t("chat.title")}>
          <div className="chat-head">
            <div>
              <b>{t("chat.title")}</b>
              <span className="chat-status">{t("chat.subtitle")}</span>
            </div>
          </div>

          <div className="chat-body" ref={listRef}>
            {messages.length === 0 ? <div className="chat-empty">{t("chat.welcome")}</div> : null}
            {messages.map((m) => (
              <div key={m.id} className={`chat-msg ${m.role === "user" ? "chat-user" : "chat-bot"}`}>
                <div className="chat-bubble">{m.content}</div>
              </div>
            ))}
            {busy ? (
              <div className="chat-msg chat-bot">
                <div className="chat-bubble chat-typing">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </div>
              </div>
            ) : null}
          </div>

          <form className="chat-input-row" onSubmit={submit}>
            {micSupported ? (
              <button
                type="button"
                className={`chat-mic ${recording ? "chat-mic-on" : ""}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  startRecording();
                }}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                onPointerCancel={stopRecording}
                aria-label={recording ? t("chat.stop") : t("chat.record")}
                title={recording ? t("chat.stop") : t("chat.record")}
              >
                <Mic size={16} />
              </button>
            ) : null}
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={recording ? t("chat.recording") : t("chat.placeholder")}
              disabled={busy || recording}
            />
            <button className="chat-send" type="submit" disabled={busy || !input.trim() || recording} aria-label={t("chat.send")}>
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}