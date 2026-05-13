"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";

import {
    Clock,
    MapPin,
    AlertTriangle,
    Info,
    Calendar,
    Megaphone,
    UserCircle
} from "lucide-react";

export default function RoleAnnouncement() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data());
                setLoading(false);
            }
        });

        const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
        const unsubscribeAnn = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAnnouncements(list);
        });

        return () => {
            unsubscribe();
            unsubscribeAnn();
        };
    }, [router]);

    const filteredData = filter === "All"
        ? announcements
        : announcements.filter((a) => a.type === filter);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F3F9]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar />

            <main className="flex-1 ml-[280px] p-8">
                <div className="flex justify-between items-center mb-8 bg-white p-4 px-8 rounded-xl shadow-sm border border-gray-100">
                    <h1 className="text-xl font-bold text-gray-800">Public Safety Announcements</h1>
                    <div className="flex items-center gap-3 text-right">
                        <div>
                            <p className="text-sm font-bold text-gray-800 leading-none">
                                {userData?.name}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {["All", "Emergency", "Important", "General"].map((category) => (
                        <button
                            key={category}
                            onClick={() => setFilter(category)}
                            className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                filter === category
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredData.length > 0 ? filteredData.map((item) => (
                        <div key={item.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-300 group">

                            <div className="h-48 w-full relative overflow-hidden">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt="alert"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <Megaphone size={48} className="text-gray-300" />
                                    </div>
                                )}

                                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                                    item.type === 'Emergency' ? 'bg-red-600' : item.type === 'Important' ? 'bg-orange-500' : 'bg-blue-600'
                                }`}>
                                    <div className="flex items-center gap-1">
                                        {item.type === "Emergency" ? <AlertTriangle size={10} /> : <Info size={10} />}
                                        {item.type}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-800 mb-3 leading-tight line-clamp-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 line-clamp-3 leading-relaxed">
                                    {item.content}
                                </p>

                                <div className="mt-auto space-y-4">
                                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold border-t border-gray-50 pt-4">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-blue-500" />
                                                {item.date}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={13} className="text-blue-500" />
                                                {item.time}
                                            </span>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl text-xs font-bold transition-all duration-300 border border-gray-100 hover:border-blue-600 shadow-sm">
                                        View Full Advisory
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full py-24 text-center bg-white rounded-[30px] border border-dashed border-gray-200">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Megaphone size={32} className="text-gray-300" />
                            </div>
                            <h2 className="text-gray-800 font-bold">No Announcements Found</h2>
                            <p className="text-gray-400 text-sm">Check back later for updates from the Command Center.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}