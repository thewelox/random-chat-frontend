"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { io, Socket } from "socket.io-client";

import { motion, AnimatePresence } from "framer-motion";

import {
  Send,
  SkipForward,
  Reply,
  X,
  Users,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react";

/*
  SOCKET
*/

const SOCKET_URL =
  "https://vibe-backend-xexf.onrender.com";

/*
  TYPES
*/

interface Message {
  id: number;
  text: string;
  nickname: string;
  gender?: string;
  sender?: string;
  timestamp?: string;
  replyTo?: {
    text: string;
    nickname: string;
  } | null;
}

interface ClubUser {
  id: string;
  nickname: string;
  bio: string;
  avatar: string;
}

export default function Home() {
  const socketRef =
    useRef<Socket | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const clubMessagesEndRef =
    useRef<HTMLDivElement>(null);

  /*
    USER
  */

  const [nickname, setNickname] =
    useState("");

  const [gender, setGender] =
    useState("male");

  const [joined, setJoined] =
    useState(false);

  /*
    CONNECTION
  */

  const [connected, setConnected] =
    useState(false);

  const [serverConnected, setServerConnected] =
    useState(false);

  const [onlineCount, setOnlineCount] =
    useState(0);

  /*
    RANDOM CHAT
  */

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [input, setInput] =
    useState("");

  const [typing, setTyping] =
    useState(false);

  const [replyingTo, setReplyingTo] =
    useState<Message | null>(null);

  /*
    CLUB
  */

  const [clubMessages, setClubMessages] =
    useState<Message[]>([]);

  const [clubUsers, setClubUsers] =
    useState<ClubUser[]>([]);

  const [clubInput, setClubInput] =
    useState("");

  const [clubTyping, setClubTyping] =
    useState("");

  /*
    UI
  */

  const [activeTab, setActiveTab] =
    useState("random");

  /*
    AUDIO
  */

  const matchSound =
    useRef<HTMLAudioElement | null>(
      null
    );

  const messageSound =
    useRef<HTMLAudioElement | null>(
      null
    );

  /*
    INIT SOCKET
  */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 999,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    matchSound.current =
      new Audio("/match.mp3");

    messageSound.current =
      new Audio("/message.mp3");

    /*
      CONNECTION
    */

    socket.on("connect", () => {
      setServerConnected(true);
    });

    socket.on("disconnect", () => {
      setServerConnected(false);
    });

    /*
      RANDOM EVENTS
    */

    socket.on("matched", () => {
      setConnected(true);

      setMessages([]);

      matchSound.current?.play();
    });

    socket.on(
      "message",
      (data: Message) => {
        setMessages((prev) => [
          ...prev,
          data,
        ]);

        messageSound.current?.play();
      }
    );

    socket.on(
      "stranger_left",
      () => {
        setConnected(false);
      }
    );

    socket.on("typing", () => {
      setTyping(true);

      setTimeout(() => {
        setTyping(false);
      }, 1200);
    });

    /*
      ONLINE
    */

    socket.on(
      "online_count",
      (count: number) => {
        setOnlineCount(count);
      }
    );

    /*
      CLUB
    */

    socket.on(
      "club_message",
      (data: Message) => {
        setClubMessages((prev) => [
          ...prev,
          data,
        ]);
      }
    );

    socket.on(
      "club_old_messages",
      (messages: Message[]) => {
        setClubMessages(messages);
      }
    );

    socket.on(
      "club_online_users",
      (users: ClubUser[]) => {
        setClubUsers(users);
      }
    );

    socket.on(
      "club_typing",
      (data) => {
        setClubTyping(
          `${data.nickname} typing...`
        );

        setTimeout(() => {
          setClubTyping("");
        }, 1500);
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  /*
    AUTOSCROLL
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  useEffect(() => {
    clubMessagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [clubMessages]);

  /*
    JOIN
  */

  const joinChat = () => {
    if (!nickname.trim()) return;

    socketRef.current?.emit("join", {
      nickname,
      gender,
    });

    socketRef.current?.emit(
      "join_club",
      {
        nickname,
        bio: "VIBE member 🌌",
        avatar:
          gender === "female"
            ? "/female.jpg"
            : "/male.jpg",
      }
    );

    setJoined(true);
  };

  /*
    RANDOM MESSAGE
  */

  const sendMessage = () => {
    if (!input.trim()) return;

    socketRef.current?.emit(
      "message",
      {
        text: input.trim(),
        replyTo: replyingTo
          ? {
              text:
                replyingTo.text,
              nickname:
                replyingTo.nickname,
            }
          : null,
      }
    );

    setInput("");

    setReplyingTo(null);
  };

  /*
    CLUB MESSAGE
  */

  const sendClubMessage = () => {
    if (!clubInput.trim()) return;

    socketRef.current?.emit(
      "club_message",
      {
        text: clubInput.trim(),
      }
    );

    setClubInput("");
  };

  /*
    NEXT
  */

  const nextStranger = () => {
    setMessages([]);

    setConnected(false);

    socketRef.current?.emit("next");
  };

  /*
    TYPING
  */

  const handleTyping = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setInput(e.target.value);

    socketRef.current?.emit(
      "typing"
    );
  };

  const handleClubTyping = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setClubInput(e.target.value);

    socketRef.current?.emit(
      "club_typing"
    );
  };

  /*
    JOIN SCREEN
  */

  if (!joined) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-purple-500/10 blur-3xl" />

        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          className="relative w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-2xl"
        >
          <h1 className="text-5xl font-black tracking-[0.3em] text-center">
            VIBE
          </h1>

          <p className="text-center text-white/50 mt-4 mb-8">
            Meet strangers across the digital galaxy ✦
          </p>

          <input
            value={nickname}
            onChange={(e) =>
              setNickname(
                e.target.value
              )
            }
            placeholder="Choose nickname"
            className="w-full bg-white/10 border border-white/10 rounded-2xl px-5 py-4 outline-none mb-4"
          />

          <div className="flex gap-3 mb-5">
            <button
              onClick={() =>
                setGender("male")
              }
              className={`flex-1 py-3 rounded-2xl ${
                gender === "male"
                  ? "bg-blue-600"
                  : "bg-white/10"
              }`}
            >
              Male
            </button>

            <button
              onClick={() =>
                setGender(
                  "female"
                )
              }
              className={`flex-1 py-3 rounded-2xl ${
                gender ===
                "female"
                  ? "bg-pink-600"
                  : "bg-white/10"
              }`}
            >
              Female
            </button>
          </div>

          <button
            onClick={joinChat}
            className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-semibold"
          >
            Enter VIBE
          </button>
        </motion.div>
      </main>
    );
  }

  /*
    MAIN
  */

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* TOPBAR */}

      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-black tracking-widest">
            VIBE
          </h1>

          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-white/50">
              {serverConnected ? (
                <Wifi
                  size={14}
                />
              ) : (
                <WifiOff
                  size={14}
                />
              )}

              {serverConnected
                ? "Connected"
                : "Offline"}
            </div>

            <div className="text-xs text-white/40">
              {onlineCount} online
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              setActiveTab(
                "random"
              )
            }
            className={`px-4 py-2 rounded-2xl ${
              activeTab ===
              "random"
                ? "bg-purple-600"
                : "bg-white/10"
            }`}
          >
            Random
          </button>

          <button
            onClick={() =>
              setActiveTab("club")
            }
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 ${
              activeTab ===
              "club"
                ? "bg-purple-600"
                : "bg-white/10"
            }`}
          >
            <Users size={15} />
            Club
          </button>
        </div>
      </div>

      {/* RANDOM */}

      {activeTab === "random" && (
        <>
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h1 className="font-semibold text-lg">
                {connected
                  ? "Stranger Connected"
                  : "Searching Stranger..."}
              </h1>

              <AnimatePresence>
                {typing && (
                  <motion.p
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    className="text-xs text-white/40 mt-1"
                  >
                    typing...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={
                nextStranger
              }
              className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl"
            >
              <SkipForward
                size={18}
              />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className={`flex ${
                  msg.sender ===
                  socketRef.current?.id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 ${
                    msg.sender ===
                    socketRef.current?.id
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
                        setReplyingTo(
                          msg
                        )
                      }
                    >
                      <Reply
                        size={14}
                      />
                    </button>
                  </div>

                  {msg.replyTo && (
                    <div className="bg-black/30 rounded-2xl px-3 py-2 mb-2 border-l-2 border-purple-400">
                      <p className="text-xs text-purple-300">
                        {
                          msg.replyTo
                            .nickname
                        }
                      </p>

                      <p className="text-xs text-white/50">
                        {
                          msg.replyTo
                            .text
                        }
                      </p>
                    </div>
                  )}

                  <p className="break-words">
                    {msg.text}
                  </p>
                </div>
              </motion.div>
            ))}

            <div
              ref={messagesEndRef}
            />
          </div>

          <div className="p-3 border-t border-white/10 bg-black/80">
            {replyingTo && (
              <div className="mb-3 bg-white/10 rounded-2xl px-4 py-3 flex justify-between">
                <div>
                  <p className="text-xs text-white/40">
                    Replying to
                  </p>

                  <p className="text-xs text-purple-300">
                    {
                      replyingTo.nickname
                    }
                  </p>
                </div>

                <button
                  onClick={() =>
                    setReplyingTo(
                      null
                    )
                  }
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <input
                value={input}
                onChange={
                  handleTyping
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                    "Enter"
                  ) {
                    sendMessage();
                  }
                }}
                placeholder="Type message..."
                className="flex-1 bg-white/10 rounded-2xl px-5 py-4 outline-none"
              />

              <button
                onClick={
                  sendMessage
                }
                className="bg-purple-600 hover:bg-purple-700 p-4 rounded-2xl"
              >
                <Send
                  size={18}
                />
              </button>
            </div>
          </div>
        </>
      )}

      {/* CLUB */}

      {activeTab === "club" && (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {clubMessages.map(
                (msg) => (
                  <div
                    key={msg.id}
                    className="bg-white/10 rounded-3xl px-4 py-3"
                  >
                    <p className="font-semibold text-sm">
                      {msg.nickname}
                    </p>

                    <p className="mt-1 text-sm whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>
                )
              )}

              <div
                ref={
                  clubMessagesEndRef
                }
              />
            </div>

            <div className="p-3 border-t border-white/10">
              <div className="flex gap-3">
                <input
                  value={clubInput}
                  onChange={
                    handleClubTyping
                  }
                  placeholder="Message club..."
                  className="flex-1 bg-white/10 rounded-2xl px-5 py-4 outline-none"
                />

                <button
                  onClick={
                    sendClubMessage
                  }
                  className="bg-purple-600 p-4 rounded-2xl"
                >
                  <Send
                    size={18}
                  />
                </button>
              </div>

              {clubTyping && (
                <p className="text-xs text-white/40 mt-2">
                  {clubTyping}
                </p>
              )}
            </div>
          </div>

          <div className="hidden md:block w-[260px] border-l border-white/10 bg-white/5 overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold">
                Members
              </h2>
            </div>

            <div className="p-4 space-y-4">
              {clubUsers.map(
                (user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={
                        user.avatar
                      }
                      className="w-12 h-12 rounded-full object-cover"
                    />

                    <div>
                      <p className="font-medium">
                        {
                          user.nickname
                        }
                      </p>

                      <p className="text-xs text-white/40">
                        {user.bio}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}