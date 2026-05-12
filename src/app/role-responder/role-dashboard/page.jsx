"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit
} from "firebase/firestore";
import {
    ShieldAlert,
    MapPin,
    Navigation,
    Clock,
    CheckCircle2,
    MessageSquare
} from "lucide-react";

export default function RoleDashboard() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [latestAlert, setLatestAlert] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.role !== "responder") {
                        router.push("/dashboard");
                    } else {
                        setUserData({ id: user.uid, ...data });
                        setLoading(false);

                        const chatsQuery = query(
                            collection(db, "chats"),
                            where("participants", "array-contains", user.uid),
                            orderBy("updatedAt", "desc"),
                            limit(1)
                        );

                        const unsubscribeAlerts = onSnapshot(chatsQuery, (snapshot) => {
                            if (!snapshot.empty) {
                                const chatData = snapshot.docs[0].data();
                                setLatestAlert({
                                    id: snapshot.docs[0].id,
                                    userName: chatData.citizenName || "Unknown Citizen",
                                    message: chatData.lastMessage || "Sent an alert",
                                    time: chatData.updatedAt?.toDate() || new Date(),
                                    type: "Incoming Message / Alert"
                                });
                            }
                        }, (err) => {
                            console.error("Alert listener error:", err);
                        });

                        return () => unsubscribeAlerts();
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

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-blue-600 animate-pulse uppercase tracking-[0.2em]">
                        Securing Responder Portal...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 ml-[280px] p-8">
                <div className="flex justify-between items-center mb-8 bg-white p-3 px-8 rounded-[10px] shadow-sm border border-gray-100">
                    <h1 className="text-xl text-gray-800 tracking-tight font-normal">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-800">{userData?.name || "Responder Unit"}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500 flex items-center justify-between transition-transform hover:scale-[1.02]">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Emergencies</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">{latestAlert ? "1" : "0"}</h3>
                        </div>
                        <ShieldAlert size={28} className="text-red-500" />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500 flex items-center justify-between transition-transform hover:scale-[1.02]">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Responses</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">0</h3>
                        </div>
                        <Navigation size={28} className="text-blue-500" />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 flex items-center justify-between transition-transform hover:scale-[1.02]">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                            <h3 className="text-2xl font-black text-gray-800 mt-1">0</h3>
                        </div>
                        <CheckCircle2 size={28} className="text-green-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-5">
                        <div className="bg-[#1E1E2D] p-8 rounded-[20px] shadow-2xl text-white border border-white/5 relative overflow-hidden h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className={`w-2 h-2 ${latestAlert ? 'bg-red-500 animate-ping' : 'bg-gray-500'} rounded-full`}></div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${latestAlert ? 'text-red-400' : 'text-gray-500'}`}>
                                    {latestAlert ? "Incoming SMS / Alert" : "No Active Alerts"}
                                </p>
                            </div>

                            <div className="space-y-6 mb-10 relative z-10">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Citizen Name</p>
                                    <p className="font-bold text-lg text-gray-100">
                                        {latestAlert ? latestAlert.userName : "Waiting for alert..."}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Message Content</p>
                                    <p className="font-black text-sm text-blue-400 uppercase tracking-widest leading-relaxed">
                                        {latestAlert ? latestAlert.message : "--"}
                                    </p>
                                </div>
                                <div className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                                    <MessageSquare size={18} className="mt-1 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Received At</p>
                                        <p className="font-medium text-xs text-gray-300 leading-relaxed mt-1 italic">
                                            {latestAlert ? latestAlert.time.toLocaleTimeString() : "No data..."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/role-responder/role-messages')}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-blue-900/40 uppercase tracking-[0.2em]"
                            >
                                Open Conversation
                            </button>
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="bg-white p-8 rounded-[20px] shadow-sm border border-gray-100 h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Clock size={18} className="text-blue-600" />
                                    Recent Activity Logs
                                </h3>
                                <button className="text-[10px] font-bold text-blue-600 uppercase hover:underline">View All</button>
                            </div>

                            <div className="space-y-4">
                                {latestAlert ? (
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                <MessageSquare size={14} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">New message from {latestAlert.userName}</p>
                                                <p className="text-[10px] text-gray-500">{latestAlert.time.toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-1 rounded-full uppercase">New</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic text-center py-10">No recent activities found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}