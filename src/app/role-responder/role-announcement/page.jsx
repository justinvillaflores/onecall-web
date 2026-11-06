"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";

import {
    Clock,
    AlertTriangle,
    Info,
    Calendar,
    Megaphone,
    X,
    Maximize2
} from "lucide-react";

export default function RoleAnnouncement() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [announcements, setAnnouncements] = useState([]);

    const [selectedAdvisory, setSelectedAdvisory] = useState(null);

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
        : announcements.filter((a) => (a.type || a.category) === filter);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F3F9]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar />

            <main className="flex-1 w-full lg:ml-[280px] p-4 sm:p-6 lg:p-8 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 bg-white p-4 sm:px-8 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-gray-800">Public Safety Announcements</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Stay updated with official bulletins and emergency alerts</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-800 leading-none">
                                {userData?.name || "Responder Unit"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {["All", "Emergency", "Important", "General"].map((category) => (
                        <button
                            key={category}
                            onClick={() => setFilter(category)}
                            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                                filter === category
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "bg-white text-gray-400 hover:bg-gray-50 border border-gray-100"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredData.length > 0 ? filteredData.map((item) => {
                        const itemType = item.type || item.category || "General";
                        return (
                            <div key={item.id} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all duration-300 group">
                                <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                                    {item.imageUrl ? (
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title || "Announcement Image"}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <Megaphone size={48} className="text-gray-300" />
                                        </div>
                                    )}

                                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-md ${
                                        itemType === 'Emergency' ? 'bg-red-600' : itemType === 'Important' ? 'bg-orange-500' : 'bg-blue-600'
                                    }`}>
                                        <div className="flex items-center gap-1">
                                            {itemType === "Emergency" ? <AlertTriangle size={12} /> : <Info size={12} />}
                                            {itemType}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 leading-tight line-clamp-2">
                                        {item.title || item.headline}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-500 mb-6 line-clamp-3 leading-relaxed whitespace-pre-line">
                                        {item.content || item.messageDetail}
                                    </p>

                                    <div className="mt-auto space-y-4">
                                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold border-t border-gray-50 pt-4">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="text-blue-500" />
                                                    {item.date || "Today"}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock size={13} className="text-blue-500" />
                                                    {item.time || "Recent"}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedAdvisory(item)}
                                            className="w-full py-3 bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl text-xs font-bold transition-all duration-300 border border-gray-100 hover:border-blue-600 shadow-sm flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white"
                                        >
                                            <Maximize2 size={14} />
                                            View Full Advisory
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-20 text-center bg-white rounded-[30px] border border-dashed border-gray-200 p-6">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Megaphone size={32} className="text-gray-300" />
                            </div>
                            <h2 className="text-gray-800 font-bold">No Announcements Found</h2>
                            <p className="text-gray-400 text-xs sm:text-sm mt-1">Check back later for updates from the Command Center.</p>
                        </div>
                    )}
                </div>

                {selectedAdvisory && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col transform transition-all">
                            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
                                        (selectedAdvisory.type || selectedAdvisory.category) === 'Emergency' ? 'bg-red-600' : (selectedAdvisory.type || selectedAdvisory.category) === 'Important' ? 'bg-orange-500' : 'bg-blue-600'
                                    }`}>
                                        {selectedAdvisory.type || selectedAdvisory.category || "General"}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Official Bulletin</span>
                                </div>
                                <button
                                    onClick={() => setSelectedAdvisory(null)}
                                    className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-5 sm:p-8 space-y-6">
                                {selectedAdvisory.imageUrl && (
                                    <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 shadow-inner border border-slate-100">
                                        <img
                                            src={selectedAdvisory.imageUrl}
                                            alt="Advisory Attachment"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                                    {selectedAdvisory.title || selectedAdvisory.headline}
                                </h2>

                                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pb-4 border-b border-slate-100">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <Calendar size={14} className="text-blue-600" />
                                        {selectedAdvisory.date || "Today"}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                        <Clock size={14} className="text-blue-600" />
                                        {selectedAdvisory.time || "Recent"}
                                    </span>
                                </div>

                                <div className="text-sm sm:text-base text-slate-700 leading-relaxed space-y-3 whitespace-pre-line font-normal">
                                    {selectedAdvisory.content || selectedAdvisory.messageDetail}
                                </div>
                            </div>

                            <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setSelectedAdvisory(null)}
                                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shadow-md uppercase tracking-wider"
                                >
                                    Close Advisory
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}