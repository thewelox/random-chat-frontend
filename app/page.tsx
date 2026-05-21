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
  "https://vibe-backend-xexf.onrender.com"
);

export default function Home() {
  const [nickname, setNickname] =
    useState("");

  const [gender, setGender] =
    useState("male");

  const [joined, setJoined] =
    useState(false);

  const [messages, setMessages] =
    useState<any[]>([]);

  const [input, setInput] =
    useState("");

  const [connected, setConnected] =
    useState(false);

  const [typing, setTyping] =
    useState(false);

  const [onlineCount, setOnlineCount] =
    useState(0);

  const [replyingTo, setReplyingTo] =
    useState<any>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on("matched", () => {
      setConnected(true);

      setMessages([]);
    });

    socket.on("message", (data) => {
      setMessages((prev) => [
        ...prev,
        data,
      ]);
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

    socket.on(
      "online_count",
      (count) => {
        setOnlineCount(count);
      }
    );

    return () => {
      socket.off("matched");

      socket.off("message");

      socket.off("stranger_left");

      socket.off("typing");

      socket.off("online_count");
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
      gender,
    });

    setJoined(true);
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    socket.emit("message", {
      text: input,

      replyTo: replyingTo
        ? {
            text: replyingTo.text,
            nickname:
              replyingTo.nickname,
          }
        : null,
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
          <h1 className="text-5xl font-black mb-3 tracking-wide">
            VIBE
          </h1>

          <p className="text-white/60 mb-8">
            Real conversations with
            real people.
          </p>

          <input
            value={nickname}
            onChange={(e) =>
              setNickname(
                e.target.value
              )
            }
            placeholder="Choose nickname"
            className="w-full bg-white/10 rounded-2xl px-5 py-4 outline-none mb-4"
          />

          <div className="flex gap-3 mb-5">
            <button
              onClick={() =>
                setGender("male")
              }
              className={`flex-1 py-3 rounded-2xl transition-all ${
                gender === "male"
                  ? "bg-blue-600"
                  : "bg-white/10"
              }`}
            >
              Male
            </button>

            <button
              onClick={() =>
                setGender("female")
              }
              className={`flex-1 py-3 rounded-2xl transition-all ${
                gender === "female"
                  ? "bg-pink-600"
                  : "bg-white/10"
              }`}
            >
              Female
            </button>
          </div>

          <button
            onClick={joinChat}
            className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-semibold transition-all"
          >
            Start Chatting
          </button>

          <div className="text-center text-white/30 text-xs mt-6">
            PROUDLY MADE IN INDIA 🇮🇳
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0 backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-bold">
            {connected
              ? "Stranger Connected"
              : "Finding Stranger..."}
          </h1>

          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

            <p className="text-xs text-white/40">
              {onlineCount} online
            </p>

            {typing && (
              <p className="text-xs text-white/40">
                • typing...
              </p>
            )}
          </div>
        </div>

        <button
          onClick={nextStranger}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all"
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
              className={`flex gap-3 max-w-[90%] ${
                msg.sender === socket.id
                  ? "flex-row-reverse"
                  : ""
              }`}
            >
              <img
                src={
                  msg.gender ===
                  "female"
                    ? "/female.jpg"
                    : "/male.jpg"
                }
                className="w-10 h-10 rounded-full object-cover shrink-0 mt-1"
              />

              <div
                className={`rounded-3xl px-4 py-3 ${
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
                    className="text-white/40 hover:text-white transition-all"
                  >
                    <Reply size={14} />
                  </button>
                </div>

                {msg.replyTo && (
                  <div className="bg-black/30 rounded-2xl px-3 py-2 mb-2 border-l-2 border-purple-400">
                    <p className="text-xs text-purple-300 mb-1">
                      {
                        msg.replyTo
                          .nickname
                      }
                    </p>

                    <p className="text-xs text-white/50 line-clamp-2 break-words">
                      {
                        msg.replyTo
                          .text
                      }
                    </p>
                  </div>
                )}

                <p className="break-words whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
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

              <p className="text-xs text-purple-300">
                {
                  replyingTo.nickname
                }
              </p>

              <p className="text-sm truncate max-w-[220px]">
                {replyingTo.text}
              </p>
            </div>

            <button
              onClick={() =>
                setReplyingTo(null)
              }
              className="text-white/50 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex gap-3 items-end">
          <input
            value={input}
            onChange={handleTyping}
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                e.preventDefault();

                sendMessage();
              }
            }}
            placeholder="Type message..."
            className="flex-1 bg-white/10 rounded-2xl px-5 py-4 outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-purple-600 hover:bg-purple-700 p-4 rounded-2xl shrink-0 transition-all"
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