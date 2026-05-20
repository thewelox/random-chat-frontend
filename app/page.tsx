"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { io } from "socket.io-client";

import {
  Send,
  SkipForward,
  Reply,
  X,
} from "lucide-react";

const socket = io(
  "https://YOUR-RAILWAY-URL.up.railway.app"
);

export default function Home() {
  const [nickname, setNickname] = useState("");

  const [joined, setJoined] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);

  const [input, setInput] = useState("");

  const [connected, setConnected] =
    useState(false);

  const [typing, setTyping] = useState(false);

  const [replyingTo, setReplyingTo] =
    useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("matched", () => {
      setConnected(true);
      setMessages([]);
    });

    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("stranger_left", () => {
      setConnected(false);
    });

    socket.on("typing", () => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);
      }, 1200);
    });

    return () => {
      socket.off("matched");
      socket.off("message");
      socket.off("stranger_left");
      socket.off("typing");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const joinChat = () => {
    if (!nickname.trim()) return;

    socket.emit("join", {
      nickname,
    });

    setJoined(true);
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("message", {
      text: input,
      replyTo: replyingTo?.text || null,
    });

    setInput("");

    setReplyingTo(null);
  };

  const nextStranger = () => {
    socket.emit("next");
  };

  const handleTyping = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInput(e.target.value);

    socket.emit("typing");
  };

  if (!joined) {
    return (
      <main className="h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
          <h1 className="text-4xl font-bold mb-3">
            VEIL
          </h1>

          <p className="text-white/60 mb-8">
            Anonymous conversations.
          </p>

          <input
            value={nickname}
            onChange={(e) =>
              setNickname(e.target.value)
            }
            placeholder="Choose nickname"
            className="w-full bg-white/10 rounded-2xl px-5 py-4 outline-none mb-5"
          />

          <button
            onClick={joinChat}
            className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-semibold"
          >
            Start Chatting
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold">
            {connected
              ? "Stranger Connected"
              : "Finding Stranger..."}
          </h1>

          {typing && (
            <p className="text-xs text-white/40 mt-1">
              typing...
            </p>
          )}
        </div>

        <button
          onClick={nextStranger}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl"
        >
          <SkipForward size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === socket.id
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                msg.sender === socket.id
                  ? "bg-purple-600"
                  : "bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between gap-4 mb-1">
                <p className="text-xs text-white/50">
                  {msg.nickname}
                </p>

                <button
                  onClick={() =>
                    setReplyingTo(msg)
                  }
                  className="text-white/40 hover:text-white"
                >
                  <Reply size={14} />
                </button>
              </div>

              {msg.replyTo && (
                <div className="bg-black/30 rounded-xl px-3 py-2 text-xs text-white/50 mb-2 border-l-2 border-purple-400">
                  {msg.replyTo}
                </div>
              )}

              <p className="break-words">
                {msg.text}
              </p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 bg-black/90 backdrop-blur-xl p-3">
        {replyingTo && (
          <div className="mb-3 bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40">
                Replying to
              </p>

              <p className="text-sm truncate max-w-[220px]">
                {replyingTo.text}
              </p>
            </div>

            <button
              onClick={() =>
                setReplyingTo(null)
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <input
            value={input}
            onChange={handleTyping}
            placeholder="Type message..."
            className="flex-1 bg-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-purple-600 hover:bg-purple-700 p-4 rounded-2xl shrink-0"
          >
            <Send size={18} />
          </button>
        </div>

        <div className="text-center text-white/20 text-xs mt-3">
          Built by WELOX & CO ✦
        </div>
      </div>
    </main>
  );
}