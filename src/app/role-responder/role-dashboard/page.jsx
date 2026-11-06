"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    doc,
    onSnapshot,
    collection,
    query,
    where,
    orderBy,
    updateDoc,
    increment,
} from "firebase/firestore";
import {
    ShieldAlert,
    Navigation,
    Clock,
    CheckCircle2,
    MessageSquare,
    Check,
    X,
    History,
    Calendar,
    ChevronDown,
    Filter,
    TrendingUp
} from "lucide-react";

export default function RoleDashboard() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [dismissedAlerts, setDismissedAlerts] = useState([]);
    const [filterPeriod, setFilterPeriod] = useState("This Week");
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setFilterDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        let unsubscribeUser = null;
        let unsubscribeAlerts = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            const userDocRef = doc(db, "users", user.uid);

            unsubscribeUser = onSnapshot(
                userDocRef,
                (docSnap) => {
                    if (!docSnap.exists()) {
                        setLoading(false);
                        router.push("/login");
                        return;
                    }

                    const data = docSnap.data();

                    if (data.role !== "responder") {
                        router.push("/dashboard");
                        return;
                    }

                    setUserData({ id: user.uid, ...data });
                    setLoading(false);
                },
                (error) => {
                    console.error("Responder profile error:", error);
                    setLoading(false);
                }
            );

            const chatsQuery = query(
                collection(db, "chats"),
                where("participants", "array-contains", user.uid),
                orderBy("updatedAt", "desc")
            );

            unsubscribeAlerts = onSnapshot(
                chatsQuery,
                (snapshot) => {
                    const allDocs = snapshot.docs.map((chatDoc) => {
                        const data = chatDoc.data();

                        return {
                            id: chatDoc.id,
                            ...data,
                            incidentType: data.incidentType || "Uncategorized",
                            time: data.updatedAt?.toDate
                                ? data.updatedAt.toDate()
                                : new Date()
                        };
                    });

                    setHistoryLogs(allDocs);

                    const pendingList = allDocs
                        .filter((chat) => {
                            const lastUpdatedSeconds =
                                chat.updatedAt?.seconds || Date.now();

                            const currentAlertValue =
                                `${chat.id}_${chat.lastMessage || ""}_${lastUpdatedSeconds}`;

                            const alertStorageKey =
                                `accepted_alert_${user.uid}_${chat.id}`;

                            const alreadyAccepted =
                                typeof window !== "undefined"
                                    ? localStorage.getItem(alertStorageKey)
                                    : null;

                            const isDismissedInSession =
                                dismissedAlerts.includes(currentAlertValue);

                            return (
                                alreadyAccepted !== currentAlertValue &&
                                !isDismissedInSession
                            );
                        })
                        .map((chat) => {
                            const lastUpdatedSeconds =
                                chat.updatedAt?.seconds || Date.now();

                            return {
                                ...chat,
                                storageValue:
                                    `${chat.id}_${chat.lastMessage || ""}_${lastUpdatedSeconds}`
                            };
                        });

                    setActiveAlerts(pendingList);
                },
                (error) => {
                    console.error("Incoming alerts error:", error);
                }
            );
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUser) unsubscribeUser();
            if (unsubscribeAlerts) unsubscribeAlerts();
        };
    }, [router, dismissedAlerts]);

    const handleAccept = async (alertToAccept) => {
        if (!userData || !alertToAccept) return;

        const targetAlertValue = alertToAccept.storageValue;

        try {
            setDismissedAlerts((prev) =>
                prev.includes(targetAlertValue)
                    ? prev
                    : [...prev, targetAlertValue]
            );

            setActiveAlerts((prev) =>
                prev.filter((alert) => alert.id !== alertToAccept.id)
            );

            if (typeof window !== "undefined") {
                localStorage.setItem(
                    `accepted_alert_${userData.id}_${alertToAccept.id}`,
                    targetAlertValue
                );
            }

            await updateDoc(doc(db, "users", userData.id), {
                completedResponses: increment(1)
            });
        } catch (error) {
            console.error("Accept error:", error);
        }
    };

    const handleOpenTerminal = (chatId) => {
        if (chatId) {
            router.push(`/role-responder/role-messages?chatId=${chatId}`);
        } else {
            router.push("/role-responder/role-messages");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const filterLogsByTimeframe = (logs, period) => {
        const now = new Date();

        return logs.filter((log) => {
            const logDate = new Date(log.time);

            if (period === "Today") {
                return logDate.toDateString() === now.toDateString();
            }

            if (period === "This Week") {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return logDate >= oneWeekAgo;
            }

            if (period === "This Month") {
                return (
                    logDate.getMonth() === now.getMonth() &&
                    logDate.getFullYear() === now.getFullYear()
                );
            }

            return true;
        });
    };

    const filteredLogs = filterLogsByTimeframe(historyLogs, filterPeriod);

    const completedCountInFilter = filteredLogs.filter((log) => {
        const isStillActive = activeAlerts.some(
            (alert) => alert.id === log.id
        );

        return !isStillActive;
    }).length;

    const filterOptions = [
        "Today",
        "This Week",
        "This Month",
        "All Time"
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9] p-4">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs sm:text-sm font-bold text-blue-600 animate-pulse uppercase tracking-[0.2em] text-center">
                        Securing Responder Portal...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F8F9FD] overflow-x-hidden">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 w-full md:ml-[280px] p-4 sm:p-6 lg:p-8 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Dashboard
                        </h1>
                        <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">
                            Overview of your emergency response operations
                        </p>
                    </div>

                    <div className="w-full sm:w-auto relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                            className="w-full sm:w-auto bg-white border border-slate-200/80 hover:border-blue-500/50 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Calendar size={16} />
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block leading-tight">
                                        Timeframe
                                    </span>
                                    <span className="text-xs font-bold text-slate-800">
                                        {filterPeriod}
                                    </span>
                                </div>
                            </div>

                            <ChevronDown
                                size={15}
                                className={`text-slate-400 transition-transform duration-200 ${
                                filterDropdownOpen ? "rotate-180 text-blue-600" : ""
                            }`}
                            />
                        </button>

                        {filterDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-1.5 z-[90] animate-in fade-in slide-in-from-top-2 duration-150">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => {
                                            setFilterPeriod(option);
                                            setFilterDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            filterPeriod === option
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                                        }`}
                                    >
                                        <span>{option}</span>
                                        {filterPeriod === option && (
                                            <Check size={14} className="text-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Active Emergencies
                                </p>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1 sm:mt-2">
                                    {activeAlerts.length}
                                </h3>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldAlert size={22} className="sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-red-500 bg-red-50/50 w-fit px-2.5 py-1 rounded-full"> Live Status
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Total Responses
                                </p>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1 sm:mt-2">
                                    {filteredLogs.length}
                                </h3>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                                <Navigation size={22} className="sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50/50 w-fit px-2.5 py-1 rounded-full">
                            {filterPeriod}
                        </div>
                    </div>

                    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Completed
                                </p>
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1 sm:mt-2">
                                    {completedCountInFilter}
                                </h3>
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                <CheckCircle2 size={22} className="sm:w-6 sm:h-6" />
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50/50 w-fit px-2.5 py-1 rounded-full">
                            Resolved ({filterPeriod})
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="bg-[#1E1E2D] p-5 sm:p-7 rounded-[24px] shadow-2xl text-white border border-white/5 relative overflow-hidden flex flex-col justify-between h-full min-h-[360px]">
                            <div className="flex flex-col flex-1 min-h-0">
                                <div className="flex items-center justify-between mb-4 shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-2.5 h-2.5 ${
                                            activeAlerts.length > 0
                                                ? "bg-red-500 animate-ping"
                                                : "bg-gray-500"
                                        } rounded-full`}></div>
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                                            activeAlerts.length > 0
                                                ? "text-red-400"
                                                : "text-gray-400"
                                        }`}>
                                            {activeAlerts.length > 0
                                                ? `Incoming Alerts (${activeAlerts.length})`
                                                : "No Active Alerts"}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-full text-gray-300">
                                        Terminal
                                    </span>
                                </div>

                                <div className="max-h-[310px] overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-0">
                                    {activeAlerts.length > 0 ? (
                                        activeAlerts.map((alert) => (
                                            <div
                                                key={alert.id}
                                                className="bg-white/5 p-3.5 sm:p-4 rounded-xl border border-white/10 space-y-3 hover:bg-white/[0.07] transition-all"
                                            >
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                                            Citizen Name
                                                        </p>
                                                        <p className="font-bold text-xs sm:text-sm text-white break-words leading-tight">
                                                            {alert.citizenName || "Unknown Citizen"}
                                                        </p>
                                                        <div className="mt-2">
                                                            <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
                                                                Incident Category
                                                            </p>
                                                            <span className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold">
                                                <ShieldAlert size={12} />
                                                                {alert.incidentType || "Uncategorized"}
                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400 shrink-0">
                                                        <Clock size={11} />
                                                        <span>
                                            {alert.time.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">
                                                        Message Content
                                                    </p>
                                                    <p className="font-semibold text-xs text-blue-300 line-clamp-1 break-words">
                                                        {alert.lastMessage || "Emergency notification received"}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                                    <button
                                                        onClick={() => handleOpenTerminal(alert.id)}
                                                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-[10px] transition-all active:scale-95 uppercase tracking-wider text-center"
                                                    >
                                                        Open Terminal
                                                    </button>
                                                    <button
                                                        onClick={() => handleAccept(alert)}
                                                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-[10px] transition-all active:scale-95 shadow-md uppercase tracking-wider flex items-center justify-center gap-1 text-center text-white"
                                                    >
                                                        <Check size={14} /> Accept & Complete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-12 text-center text-gray-400 space-y-2">
                                            <ShieldAlert size={36} className="mx-auto text-gray-600" />
                                            <p className="font-bold text-sm text-white">System is idle</p>
                                            <p className="text-xs">
                                                All emergency reports clear. Waiting for new reports...
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {activeAlerts.length === 0 && (
                                <div className="pt-4 shrink-0">
                                    <button
                                        onClick={() => handleOpenTerminal(null)}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all uppercase tracking-wider text-gray-300"
                                    >
                                        Open Terminal Standby
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col">
                        <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between h-full">
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                                <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                                    <History size={18} className="text-blue-600" />
                                    Recent Emergency Reports
                                </h3>
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 sm:py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-100 transition-all ml-auto sm:ml-0"
                                >
                                    <Filter size={13} /> Filter & View All
                                </button>
                            </div>

                            <div className="overflow-x-auto flex-1 min-w-full">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="p-3 sm:p-4 pl-4 sm:pl-6">Report ID</th>
                                        <th className="p-3 sm:p-4">Citizen Name</th>
                                        <th className="p-3 sm:p-4">Message Summary</th>
                                        <th className="p-3 sm:p-4">Status</th>
                                        <th className="p-3 sm:p-4 pr-4 sm:pr-6">Date & Time</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredLogs.slice(0, 4).map((log) => {
                                        const isStillActive = activeAlerts.some(
                                            (alert) => alert.id === log.id
                                        );

                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3 sm:p-4 pl-4 sm:pl-6 font-bold text-blue-600">
                                                    #{log.id.substring(0, 6).toUpperCase()}
                                                </td>
                                                <td className="p-3 sm:p-4 font-bold text-slate-800">
                                                    {log.citizenName || "Citizen Report"}
                                                </td>
                                                <td className="p-3 sm:p-4 text-slate-500 max-w-[140px] sm:max-w-[180px] truncate">
                                                    {log.lastMessage || "N/A"}
                                                </td>
                                                <td className="p-3 sm:p-4">
                                                    {isStillActive ? (
                                                        <span className="bg-emerald-50 text-emerald-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Received
                                        </span>
                                                    ) : (
                                                        <span className="bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            Completed
                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 sm:p-4 pr-4 sm:pr-6 text-slate-400 font-medium">
                                                    {log.time.toLocaleDateString([], {
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                    <span className="block text-[10px] text-slate-400">
                                        {log.time.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-6 text-center text-slate-400 italic">
                                                No emergency logs found for {filterPeriod}.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-3 sm:p-4 px-4 sm:px-6 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center flex-wrap gap-2">
                                <span className="text-[11px]">
                                    Showing {filteredLogs.slice(0, 4).length} of {filteredLogs.length} entries
                                </span>
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="text-blue-600 font-bold hover:underline text-[11px] sm:text-xs ml-auto"
                                >
                                    View Full Logs →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {showHistory && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-3xl rounded-[24px] shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <div className="flex items-center gap-2">
                                    <History className="text-blue-600" size={20} />
                                    <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-tight">
                                        Full Emergency History Logs
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="p-1.5 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-4 sm:p-6 space-y-3 flex-1">
                                {filteredLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-3.5 sm:p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50/50 transition-colors gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                                <MessageSquare size={16} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                                    {log.citizenName || "Unknown Citizen"}
                                                </p>
                                                <p className="text-[11px] sm:text-xs text-amber-600 font-bold mt-1">
                                                    {log.incidentType || "Uncategorized"}
                                                </p>
                                                <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                    {log.lastMessage || "No message"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                {log.time.toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] text-slate-400 italic">
                                                {log.time.toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}