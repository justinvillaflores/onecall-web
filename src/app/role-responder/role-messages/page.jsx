"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Search, Send, User, MessageSquare, Image as ImageIcon, X, MapPin, ArrowLeft } from "lucide-react";

function RoleMessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetChatId = searchParams.get("chatId");

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [chatList, setChatList] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [search, setSearch] = useState("");
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
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

            if (targetChatId) {
                const targetChat = sortedList.find(chat => chat.id === targetChatId);
                if (targetChat) {
                    setSelectedChat(targetChat);
                }
            }
        }, (error) => {
            console.error("Error listening to chats:", error);
        });

        return () => unsubscribe();
    }, [userData, targetChatId]);

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
                type: 'text'
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

    const handleSeeLocation = () => {
        if (!selectedChat) return;

        const citizenId = selectedChat.citizenId || selectedChat.participants?.find((id) => id !== userData?.id);

        const params = new URLSearchParams();
        if (citizenId) params.set("citizenId", citizenId);

        if (selectedChat.lastKnownLat && selectedChat.lastKnownLon) {
            params.set("lat", selectedChat.lastKnownLat);
            params.set("lon", selectedChat.lastKnownLon);
        }

        router.push(`/role-responder/role-map?${params.toString()}`);
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

            <main className="flex-1 ml-0 lg:ml-[270px] p-4 sm:p-6 lg:p-8 flex flex-col h-screen pt-20 lg:pt-8 transition-all duration-300">
                <div className="flex justify-between items-center mb-4 sm:mb-6 bg-white p-3.5 sm:p-4 px-4 sm:px-8 rounded-xl shadow-sm border border-gray-100">
                    <h1 className="text-base sm:text-lg text-gray-800 font-semibold truncate">Terminal Messages</h1>
                    <p className="text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ml-2">
                        Unit: {userData?.username || userData?.name || "Responder"}
                    </p>
                </div>

                <div className="flex-1 flex gap-4 lg:gap-6 overflow-hidden h-[calc(100vh-140px)] pb-2 sm:pb-4 relative">
                    <div className={`w-full lg:w-[360px] xl:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col shrink-0 overflow-hidden ${selectedChat ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-3 sm:p-4 border-b border-gray-50 shrink-0">
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search citizen reports..."
                                    className="w-full h-11 sm:h-12 pl-12 pr-4 text-xs sm:text-sm bg-gray-50 rounded-xl outline-none border border-gray-200 focus:border-blue-300 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2">
                            {filteredChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all border ${
                                        selectedChat?.id === chat.id
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'hover:bg-gray-50 border-transparent'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs sm:text-sm font-bold ${selectedChat?.id === chat.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {chat.citizenName || "Emergency Contact"}
                                        </span>
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 truncate mt-1">{chat.lastMessage || "N/A"}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`w-full lg:flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden ${!selectedChat ? 'hidden lg:flex' : 'flex'}`}>
                        {selectedChat ? (
                            <>
                                <div className="p-3 sm:p-4 px-4 sm:px-6 border-b border-gray-50 flex items-center justify-between bg-white shrink-0 min-h-[64px] sm:min-h-[73px]">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <button
                                            onClick={() => setSelectedChat(null)}
                                            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 mr-1 transition-colors"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shrink-0">
                                            <User size={18} className="text-blue-500 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                                            <h2 className="text-xs sm:text-sm font-bold text-gray-800 leading-none truncate">{selectedChat.citizenName}</h2>
                                            <p className="text-[9px] sm:text-[10px] text-green-500 uppercase font-bold tracking-widest mt-1">Responder-Citizen Link</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSeeLocation}
                                        className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
                                    >
                                        <MapPin size={15} />
                                        <span className="hidden xs:inline">See Location</span>
                                        <span className="xs:hidden">Map</span>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 bg-[#FBFBFE]">
                                    {messages.map((msg) => {
                                        const isMe = msg.senderId === userData.id;
                                        const imageSrc = msg.imageUrl || msg.image || (msg.type === 'image' ? msg.text : null);

                                        return (
                                            <div key={msg.id} className={`flex items-start gap-3 w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                                                <div className={`max-w-[85%] xs:max-w-[75%] sm:max-w-[70%] p-3 sm:p-3.5 rounded-2xl ${
                                                    isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none shadow-sm'
                                                }`}>
                                                    {imageSrc ? (
                                                        <div className="space-y-2">
                                                            <div
                                                                className="relative rounded-xl overflow-hidden cursor-pointer group border border-gray-100/20 max-w-[240px] sm:max-w-[320px]"
                                                                onClick={() => setPreviewImageUrl(imageSrc)}
                                                            >
                                                                <img
                                                                    src={imageSrc}
                                                                    alt="Emergency Proof Attachment"
                                                                    className="w-full h-auto max-h-48 sm:max-h-60 object-cover rounded-lg transition-transform duration-200 group-hover:scale-105"
                                                                    loading="lazy"
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                                                        <ImageIcon size={12} /> View Image
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {msg.text && msg.text !== imageSrc && (
                                                                <p className="text-xs sm:text-sm font-medium pt-1">{msg.text}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs sm:text-sm font-medium break-words">{msg.text}</p>
                                                    )}

                                                    <span className={`text-[8px] sm:text-[9px] mt-1 block opacity-60 uppercase font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                                                        {msg.createdAt?.toDate ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 bg-white border-t border-gray-100">
                                    <div className="flex gap-2 sm:gap-3">
                                        <input
                                            type="text"
                                            placeholder="Type message..."
                                            className="flex-1 bg-gray-50 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm outline-none border border-gray-200 focus:border-blue-300"
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                        />
                                        <button type="submit" className="bg-blue-600 text-white p-2.5 sm:p-3 px-4 sm:px-6 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shrink-0">
                                            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-4">
                                    <MessageSquare size={28} className="text-slate-200 sm:w-[32px] sm:h-[32px]" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-xs sm:text-sm">System Terminal Standby</h3>
                                <p className="text-slate-400 text-[11px] sm:text-xs mt-1 max-w-[200px]">Select a conversation to begin response protocol.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-transparent flex flex-col items-center">
                        <button
                            onClick={() => setPreviewImageUrl(null)}
                            className="absolute -top-10 right-0 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={previewImageUrl}
                            alt="Attachment Preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RoleMessages() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <RoleMessagesContent />
        </Suspense>
    );
}