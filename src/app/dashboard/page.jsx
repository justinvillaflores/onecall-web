"use client";

import { useEffect, useState } from "react";
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
    onSnapshot
} from "firebase/firestore";
import { UserCircle, Users, ShieldAlert, MessageSquare, Star } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // REALTIME STATES
    const [totalCitizens, setTotalCitizens] = useState(0);
    const [totalResponders, setTotalResponders] = useState(0);
    const [totalReports, setTotalReports] = useState(0);
    const [totalFeedback, setTotalFeedback] = useState(0);

    useEffect(() => {
        // I-initialize ang variables para sa cleanup
        let unsubscribeCitizens;
        let unsubscribeResponders;
        let unsubscribeReports;
        let unsubscribeFeedback;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && userDoc.data().role !== "admin") {
                    router.push("/role-responder/role-dashboard");
                    return;
                }

                // DITO LANG MAGSISIMULA ANG MGA LISTENERS PAGKATAPOS NG AUTH CHECK
                setLoading(false);

                // 1. Listen for Citizens
                const qCitizens = query(collection(db, "users"), where("role", "==", "citizen"));
                unsubscribeCitizens = onSnapshot(qCitizens, (snapshot) => {
                    setTotalCitizens(snapshot.size);
                });

                // 2. Listen for Responders
                const qResponders = query(collection(db, "users"), where("role", "==", "responder"));
                unsubscribeResponders = onSnapshot(qResponders, (snapshot) => {
                    setTotalResponders(snapshot.size);
                });

                // 3. Listen for Total Reports
                unsubscribeReports = onSnapshot(collection(db, "reports"), (snapshot) => {
                    setTotalReports(snapshot.size);
                });

                // 4. Listen for Feedback
                unsubscribeFeedback = onSnapshot(collection(db, "feedback"), (snapshot) => {
                    setTotalFeedback(snapshot.size);
                });

            } catch (error) {
                console.error("Auth check error:", error);
                router.push("/login");
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeCitizens) unsubscribeCitizens();
            if (unsubscribeResponders) unsubscribeResponders();
            if (unsubscribeReports) unsubscribeReports();
            if (unsubscribeFeedback) unsubscribeFeedback();
        };
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const chartData = [
        { name: "Police Station 1", value: 11.8, color: "#E91E63" },
        { name: "BFP", value: 25.6, color: "#3F51B5" },
        { name: "OEDC", value: 10.9, color: "#8BC34A" },
        { name: "CDRRMO", value: 18.9, color: "#CDDC39" },
        { name: "Police Station 2", value: 20.5, color: "#FF9800" },
        { name: "Traffic Management", value: 12.3, color: "#607D8B" },
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F0F2F5]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verifying Admin Access...</p>
                </div>
            </div>
        );
    }

    const cards = [
        { label: "Total Citizens", count: totalCitizens, icon: <Users size={24} className="text-blue-500" /> },
        { label: "Total Responders", count: totalResponders, icon: <ShieldAlert size={24} className="text-red-500" /> },
        { label: "Total Reports", count: totalReports, icon: <MessageSquare size={24} className="text-green-500" /> },
        { label: "User Feedback", count: totalFeedback, icon: <Star size={24} className="text-yellow-500" /> }
    ];

    return (
        <div className="flex min-h-screen bg-[#F0F2F5]">
            <Sidebar handleLogout={handleLogout} />
            <main className="flex-1 ml-[280px] p-8 overflow-hidden">
                <div className="flex justify-between items-center mb-8 bg-white p-3 px-6 rounded-[10px] shadow-sm">
                    <h1 className="text-xl text-gray-800 tracking-tight font-bold">Admin Dashboard</h1>
                    <UserCircle size={40} strokeWidth={1} className="text-gray-300 cursor-pointer" />
                </div>

                <div className="flex flex-row justify-between gap-6 mb-8 w-full">
                    {cards.map((card, i) => (
                        <div key={i} className="bg-white flex-1 h-[160px] rounded-[10px] shadow-sm flex flex-col items-center justify-center p-4 transition-all hover:shadow-md">
                            <div className="mb-2">{card.icon}</div>
                            <span className="text-5xl font-bold text-gray-800 tracking-tighter tabular-nums">
                                {card.count}
                            </span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 text-center">
                                {card.label}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-row items-stretch gap-6 w-full">
                    <div className="flex-1 flex flex-col gap-6 min-h-[550px]">
                        <div className="bg-white flex-1 w-full rounded-[10px] shadow-sm p-8 flex flex-col">
                            <h3 className="text-xl font-normal text-gray-800 mb-6">Reports Overview</h3>
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-light border-2 border-dashed border-gray-100 rounded-[10px] p-6 text-center">
                                {totalReports > 0 ? `Tracking ${totalReports} incident reports...` : "No reports available yet"}
                            </div>
                        </div>
                        <div className="bg-white flex-1 w-full rounded-[10px] shadow-sm p-8 flex flex-col">
                            <h3 className="text-xl font-normal text-gray-800 mb-6">User Feedback</h3>
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-light border-2 border-dashed border-gray-100 rounded-[10px] p-6 text-center">
                                {totalFeedback > 0 ? `Received ${totalFeedback} user reviews...` : "No feedback available yet"}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white flex-1 min-h-[550px] rounded-[10px] shadow-sm p-8 flex flex-col">
                        <h3 className="text-xl font-normal text-gray-800 mb-6">Hotline Performance</h3>
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} dataKey="value" cx="50%" cy="50%" outerRadius={110} label={({ percent }) => `${(percent * 100).toFixed(1)}%`} labelLine={false} stroke="none">
                                            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-8 w-full max-w-[300px]">
                                <p className="text-[10px] font-normal text-gray-400 mb-4 uppercase tracking-[0.2em]">Departmental Distribution:</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {chartData.map((item, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.color }} />
                                            <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}