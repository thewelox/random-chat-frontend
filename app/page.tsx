"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Send,
  SkipForward,
} from "lucide-react";

const socket = io(
  "https://random-chat-backend-production-a6fe.up.railway.app"
);

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [joined, setJoined] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  const [connected, setConnected] = useState(false);

  const [typing, setTyping] = useState(false);

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
      }, 1500);
    });

    return () => {
      socket.off("matched");
      socket.off("message");
      socket.off("stranger_left");
      socket.off("typing");
    };
  }, []);

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
      nickname,
    });

    setInput("");
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
            Anonymous conversations with strangers.
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
            className="w-full bg-purple-600 hover:bg-purple-700 transition-all py-4 rounded-2xl font-semibold"
          >
            Start Chatting
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-black text-white flex flex-col">
      <div className="p-5 border-b border-white/10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {connected
              ? "Stranger Connected"
              : "Finding Stranger..."}
          </h1>

          {typing && (
            <p className="text-sm text-white/50 mt-1">
              Stranger typing...
            </p>
          )}
        </div>

        <button
          onClick={nextStranger}
          className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl"
        >
          <SkipForward />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-xs p-4 rounded-2xl ${
              msg.sender === socket.id
                ? "ml-auto bg-purple-600"
                : "bg-white/10"
            }`}
          >
            <p className="text-xs text-white/50 mb-1">
              {msg.nickname}
            </p>

            <p>{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="p-5 flex gap-3 border-t border-white/10">
        <input
          value={input}
          onChange={handleTyping}
          placeholder="Type message..."
          className="flex-1 bg-white/10 rounded-2xl px-5 py-4 outline-none"
        />

        <button
          onClick={sendMessage}
          className="bg-purple-600 hover:bg-purple-700 p-4 rounded-2xl"
        >
          <Send />
        </button>
      </div>
      <div className="text-center py-4 border-t border-white/10">
  <h2 className="text-lg font-semibold tracking-[0.3em] text-white/70">
    WELOX & CO
  </h2>

  <p className="text-xs text-white/30 mt-1">
    Building digital experiences for the next era.
  </p>
</div>
    </main>
  );
}