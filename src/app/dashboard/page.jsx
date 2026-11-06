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
    onSnapshot,
    orderBy,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import {
    UserCircle,
    Users,
    ShieldAlert,
    MessageSquare,
    Star,
    Clock,
    MapPin,
    Megaphone,
    X,
    Loader2,
    UploadCloud,
    Trash2,
    ClipboardX,
    FileQuestion,
    PieChart as PieIcon
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const [totalCitizens, setTotalCitizens] = useState(0);
    const [totalResponders, setTotalResponders] = useState(0);
    const [totalReports, setTotalReports] = useState(0);
    const [totalFeedback, setTotalFeedback] = useState(0);
    const [feedbackList, setFeedbackList] = useState([]);
    const [reportsList, setReportsList] = useState([]);

    const [selectedReport, setSelectedReport] = useState(null);
    const [announceModalOpen, setAnnounceModalOpen] = useState(false);
    const [announceLoading, setAnnounceLoading] = useState(false);

    const [announceForm, setAnnounceForm] = useState({
        title: "",
        type: "Emergency",
        content: ""
    });

    const [imageUrl, setImageUrl] = useState("");

    const CHART_COLORS = [
        "#E91E63", "#3F51B5", "#8BC34A", "#FF9800",
        "#607D8B", "#CDDC39", "#00BCD4", "#9C27B0"
    ];

    const [hotlineData, setHotlineData] = useState([]);

    useEffect(() => {
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

                setLoading(false);

                const qCitizens = query(collection(db, "users"), where("role", "==", "citizen"));
                unsubscribeCitizens = onSnapshot(qCitizens, (snapshot) => {
                    setTotalCitizens(snapshot.size);
                });

                const qResponders = query(collection(db, "users"), where("role", "==", "responder"));
                unsubscribeResponders = onSnapshot(qResponders, (snapshot) => {
                    setTotalResponders(snapshot.size);

                    let totalCompleted = 0;
                    const respondersList = [];

                    snapshot.docs.forEach((docSnap) => {
                        const data = docSnap.data();
                        const completed = data.completedResponses || 0;
                        if (completed > 0) {
                            totalCompleted += completed;
                            respondersList.push({
                                name: data.name || "Responder Unit",
                                completedCount: completed,
                            });
                        }
                    });

                    if (totalCompleted > 0) {
                        const formattedChartData = respondersList.map((resp, index) => ({
                            name: resp.name,
                            value: Number(((resp.completedCount / totalCompleted) * 100).toFixed(1)),
                            count: resp.completedCount,
                            color: CHART_COLORS[index % CHART_COLORS.length]
                        }));
                        setHotlineData(formattedChartData);
                    } else {
                        setHotlineData([]);
                    }
                });

                const qReports = query(collection(db, "reports"), orderBy("createdAt", "desc"));
                unsubscribeReports = onSnapshot(qReports, (snapshot) => {
                    setTotalReports(snapshot.size);
                    const fetchedReports = snapshot.docs.map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data()
                    }));
                    setReportsList(fetchedReports);
                }, (err) => {
                    unsubscribeReports = onSnapshot(collection(db, "reports"), (snapshot) => {
                        setTotalReports(snapshot.size);
                        const fetchedReports = snapshot.docs.map(docSnap => ({
                            id: docSnap.id,
                            ...docSnap.data()
                        }));
                        setReportsList(fetchedReports);
                    });
                });

                unsubscribeFeedback = onSnapshot(collection(db, "feedback"), (snapshot) => {
                    setTotalFeedback(snapshot.size);
                    const feedbacks = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setFeedbackList(feedbacks);
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

    const handleOpenAnnounceModal = (report) => {
        setSelectedReport(report);
        setAnnounceForm({
            title: `ALERT: ${report.incidentType || "Emergency Incident"} in ${report.location || "Area"}`,
            type: report.priority === "High" ? "Emergency" : "Important",
            content: `Official Incident Notice: ${report.details}\n\nLocation: ${report.location}\nReported by: ${report.responderName || "Responder Unit"}`
        });

        setImageUrl(report.imageUrl || "");
        setAnnounceModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePublishAnnouncement = async (e) => {
        e.preventDefault();
        if (announceLoading) return;

        setAnnounceLoading(true);

        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            await addDoc(collection(db, "announcements"), {
                title: announceForm.title.trim(),
                content: announceForm.content.trim(),
                type: announceForm.type,
                imageUrl: imageUrl,
                postedBy: "Admin Command Center",
                sourceReportId: selectedReport?.id || null,
                createdAt: serverTimestamp(),
                date: dateStr,
                time: timeStr
            });

            alert("Announcement published successfully!");
            setAnnounceModalOpen(false);
            setSelectedReport(null);
            setImageUrl("");
        } catch (error) {
            console.error("Error broadcasting announcement:", error);
            alert(`Failed to post: ${error.message}`);
        } finally {
            setAnnounceLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

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
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-normal text-gray-800">Reports Overview</h3>
                                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded-full">
                                    {totalReports} Live Reports
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-2">
                                {reportsList.length > 0 ? (
                                    reportsList.map((rep) => (
                                        <div key={rep.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                                    {rep.incidentType || "Emergency Incident"}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                        rep.priority === 'High' ? 'bg-red-100 text-red-600' :
                                                            rep.priority === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-700'
                                                    }`}>
                                                        {rep.priority || 'Normal'} Priority
                                                    </span>

                                                    <button
                                                        onClick={() => handleOpenAnnounceModal(rep)}
                                                        className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition-all shadow-sm active:scale-95"
                                                        title="Broadcasting this report as a public announcement"
                                                    >
                                                        <Megaphone size={12} />
                                                        <span>Announce</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                                {rep.details}
                                            </p>

                                            <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold border-t border-gray-200/50 pt-2 mt-1">
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={12} className="text-blue-500" />
                                                    <span>{rep.location || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>By: {rep.responderName || "Responder"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center h-full space-y-3">
                                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shadow-inner">
                                            <ClipboardX size={32} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">No Reports Available</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Emergency reports submitted by responders will appear here.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white flex-1 w-full rounded-[10px] shadow-sm p-8 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-normal text-gray-800">User Feedback</h3>
                                <span className="text-xs bg-yellow-100 text-yellow-800 font-semibold px-2.5 py-0.5 rounded-full">
                                    {totalFeedback} Reviews
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3 pr-2">
                                {feedbackList.length > 0 ? (
                                    feedbackList.map((item) => (
                                        <div key={item.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, idx) => (
                                                        <Star
                                                            key={idx}
                                                            size={14}
                                                            className={idx < (Number(item.rating) || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                                        />
                                                    ))}
                                                    <span className="text-xs font-bold text-gray-600 ml-1">
                                                        ({item.rating}/5)
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-700 font-medium leading-snug">
                                                {item.comment}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center h-full space-y-3">
                                        <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center shadow-inner">
                                            <FileQuestion size={32} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">No Feedback Received</p>
                                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Citizens' reviews and star ratings will show up here.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white flex-1 min-h-[550px] rounded-[10px] shadow-sm p-8 flex flex-col">
                        <h3 className="text-xl font-normal text-gray-800 mb-6">Hotline Performance</h3>

                        {hotlineData.length > 0 ? (
                            <div className="flex-1 flex flex-col items-center">
                                <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={hotlineData}
                                                dataKey="value"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={110}
                                                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                                labelLine={false}
                                                stroke="none"
                                            >
                                                {hotlineData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value, name, props) => [`${props.payload.count} Completed (${value}%)`, name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-8 w-full max-w-[300px]">
                                    <p className="text-[10px] font-normal text-gray-400 mb-4 uppercase tracking-[0.2em]">Active Responders Distribution:</p>
                                    <div className="grid grid-cols-1 gap-3 max-h-[160px] overflow-y-auto pr-1">
                                        {hotlineData.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                                                    <span className="text-[11px] text-gray-600 font-medium uppercase tracking-wider truncate max-w-[150px]">
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-800">
                                                    {item.count} responses ({item.value}%)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50/50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center my-auto space-y-3">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shadow-inner">
                                    <PieIcon size={40} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">No Performance Recorded</p>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1 max-w-[260px]">
                                        Distribution charts will generate automatically once active responders process incoming emergency alerts.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {announceModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
                            <button
                                onClick={() => setAnnounceModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Megaphone size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Publish Incident Announcement</h2>
                                    <p className="text-xs text-gray-400">Broadcast this report as a public announcement</p>
                                </div>
                            </div>

                            <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Headline</label>
                                    <input
                                        type="text"
                                        required
                                        value={announceForm.title}
                                        onChange={(e) => setAnnounceForm({ ...announceForm, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-medium"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Announcement Category</label>
                                    <select
                                        value={announceForm.type}
                                        onChange={(e) => setAnnounceForm({ ...announceForm, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-bold text-gray-700"
                                    >
                                        <option value="General">General News</option>
                                        <option value="Emergency">Emergency Alert</option>
                                        <option value="Important">Important Update</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Announcement Content</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={announceForm.content}
                                        onChange={(e) => setAnnounceForm({ ...announceForm, content: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 font-medium resize-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Image Attachment</label>
                                    {imageUrl ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                            <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setImageUrl("")}
                                                    className="bg-white text-red-500 p-2 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all group">
                                            <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                            <p className="mt-2 text-[10px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-widest">Select Image</p>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setAnnounceModalOpen(false)}
                                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold uppercase rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={announceLoading}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {announceLoading && <Loader2 size={16} className="animate-spin" />}
                                        <span className="text-xs uppercase">{announceLoading ? "Publishing..." : "Publish Broadcast"}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}