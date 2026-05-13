"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import { Megaphone, Trash2, Calendar, Clock, Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

export default function AnnouncementPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("General");
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        const colRef = collection(db, "announcements");
        const q = query(colRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setAnnouncements(list);
            },
            (error) => {
                console.error("Firestore Listener Error:", error.code, error.message);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);

        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            await addDoc(collection(db, "announcements"), {
                title: title.trim(),
                content: content.trim(),
                type,
                imageUrl: imageUrl,
                postedBy: "Admin Command Center",
                createdAt: serverTimestamp(),
                date: dateStr,
                time: timeStr
            });

            setTitle("");
            setContent("");
            setImageUrl("");
            alert("Announcement published successfully!");
        } catch (error) {
            console.error("Post Error:", error);
            alert(`Failed to post: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remove this announcement permanently?")) return;

        try {
            await deleteDoc(doc(db, "announcements", id));
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting post. Check console for details.");
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F5F6FA]">
            <Sidebar />
            <main className="flex-1 ml-[280px] p-6 text-gray-800">
                <header className="bg-white min-h-[120px] px-8 py-5 rounded-lg shadow-sm mb-6 flex justify-between items-center border border-gray-100">
                    <h1 className="font-bold text-xl flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-md">
                            <Megaphone className="text-blue-600" size={18} />
                        </div>
                        Announcement Manager
                    </h1>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                            <h2 className="text-xs font-black mb-6 text-gray-400 uppercase tracking-[0.2em]">New Announcement</h2>
                            <form onSubmit={handlePost} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Headline</label>
                                    <input
                                        value={title} onChange={(e) => setTitle(e.target.value)} required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm"
                                        placeholder="Headline of the post"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Category</label>
                                    <select
                                        value={type} onChange={(e) => setType(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold text-gray-700 cursor-pointer"
                                    >
                                        <option value="General">General News</option>
                                        <option value="Emergency">Emergency Alert</option>
                                        <option value="Important">Important Update</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Image Attachment</label>
                                    {imageUrl ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                            <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
                                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                            <p className="mt-2 text-[10px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-widest">Select Image</p>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Message Detail</label>
                                    <textarea
                                        value={content} onChange={(e) => setContent(e.target.value)} required rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm resize-none"
                                        placeholder="What is this announcement about?"
                                    />
                                </div>

                                <button
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    {loading && <Loader2 className="animate-spin" size={18} />}
                                    <span className="text-sm tracking-widest uppercase">{loading ? "Publishing..." : "Publish Announcement"}</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Bulletin Feed</p>
                            </div>
                            <span className="text-[10px] font-bold ">{announcements.length} Total Posts</span>
                        </div>

                        <div className="space-y-4">
                            {announcements.length === 0 && !loading && (
                                <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                                    <Megaphone className="mx-auto text-gray-200 mb-4" size={48} />
                                    <p className="text-gray-400 font-medium">No announcements found.</p>
                                </div>
                            )}

                            {announcements.map((post) => (
                                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 flex p-4 gap-5 hover:shadow-md transition-all group">
                                    <div className="w-32 h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                        {post.imageUrl ? (
                                            <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="post" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <ImageIcon size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-black uppercase ${
                                                post.type === 'Emergency' ? 'text-red-600' : post.type === 'Important' ? 'text-amber-600' : 'text-blue-600'
                                            }`}>
                                                {post.type}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="text-gray-300 hover:text-red-500 p-1 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-base mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {post.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                                            {post.content}
                                        </p>
                                        <div className="pt-3 border-t border-gray-50 flex gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-blue-400" /> {post.date}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-blue-400" /> {post.time}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}