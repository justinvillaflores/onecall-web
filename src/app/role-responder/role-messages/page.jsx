"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    setDoc,
    serverTimestamp,
    where
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Search, Send, User, MessageSquare } from "lucide-react";

export default function RoleMessages() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [chatList, setChatList] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [search, setSearch] = useState("");
    const scrollRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.role !== "responder") {
                        router.push("/dashboard");
                    } else {
                        setUserData({ id: user.uid, ...data });
                        setLoading(false);
                    }
                } else {
                    router.push("/login");
                }
            } catch (error) {
                console.error("Security check error:", error);
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!userData?.id) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", userData.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const sortedList = list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
            setChatList(sortedList);
        }, (error) => {
            console.error("Error listening to chats:", error);
        });

        return () => unsubscribe();
    }, [userData]);

    useEffect(() => {
        if (!selectedChat) return;

        const q = query(
            collection(db, "chats", selectedChat.id, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgList);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }, (err) => {
            console.error("Messages fetch error:", err);
        });

        return () => unsubscribe();
    }, [selectedChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !selectedChat || !userData) return;

        try {
            const chatRef = doc(db, "chats", selectedChat.id);
            const msgData = {
                text: inputText,
                senderId: userData.id,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "chats", selectedChat.id, "messages"), msgData);

            await setDoc(chatRef, {
                lastMessage: inputText,
                updatedAt: serverTimestamp(),
            }, { merge: true });

            setInputText("");
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredChats = chatList.filter(chat =>
        (chat.citizenName || "Unknown").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 ml-[280px] p-8 flex flex-col h-screen">
                <div className="flex justify-between items-center mb-6 bg-white p-4 px-8 rounded-xl shadow-sm border border-gray-100">
                    <h1 className="text-lg text-gray-800 font-semibold">Terminal Messages</h1>
                    <p className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">
                        Active Unit: {userData?.username || userData?.name || "Responder"}
                    </p>
                </div>

                <div className="flex-1 flex gap-6 overflow-hidden h-[calc(100vh-140px)] pb-4">
                    <div className="w-[380px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col shrink-0 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 shrink-0">
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search citizen reports..."
                                    className="w-full h-12 pl-12 pr-4 text-sm bg-gray-50 rounded-xl outline-none border border-gray-200 focus:border-blue-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                        selectedChat?.id === chat.id
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'hover:bg-gray-50 border-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-bold ${selectedChat?.id === chat.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {chat.citizenName || "Emergency Contact"}
                                        </span>
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 truncate mt-1">{chat.lastMessage || "N/A"}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        {selectedChat ? (
                            <>
                                <div className="p-4 px-6 border-b border-gray-50 flex items-center justify-between bg-white shrink-0 h-[73px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                                            <User size={20} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-gray-800 leading-none">{selectedChat.citizenName}</h2>
                                            <p className="text-[10px] text-green-500 uppercase font-bold tracking-widest mt-1">Responder-Citizen Link</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-[#FBFBFE]">
                                    {messages.map((msg) => {
                                        const isMe = msg.senderId === userData.id;
                                        return (
                                            <div key={msg.id} className={`flex items-start gap-3 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <div className={`max-w-[70%] p-4 rounded-2xl ${
                                                    isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-sm'
                                                }`}>
                                                    <p className="text-sm font-medium">{msg.text}</p>
                                                    <span className={`text-[9px] mt-2 block opacity-60 uppercase font-bold`}>
                                                        {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString() : '...'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Type message..."
                                            className="flex-1 bg-gray-50 px-6 py-3 rounded-xl text-sm outline-none border border-gray-200"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                        />
                                        <button type="submit" className="bg-blue-600 text-white p-3 px-6 rounded-xl hover:bg-blue-700 transition-all">
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                                    <MessageSquare size={32} className="text-slate-200" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-sm">System Terminal Standby</h3>
                                <p className="text-slate-400 text-xs mt-1 max-w-[200px]">Select a conversation to begin response protocol.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}