"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { db, storage } from "@/lib/firebase";
import imageCompression from "browser-image-compression";
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
import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "firebase/storage";
import { Megaphone, Trash2, Calendar, Clock, Upload, X } from "lucide-react";

export default function AnnouncementPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("General");
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

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
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setUploadProgress("Preparing...");

        try {
            let finalImageUrl = null;

            if (imageFile) {
                setUploadProgress("Optimizing image...");
                const options = {
                    maxSizeMB: 0.7,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                };

                const compressedFile = await imageCompression(imageFile, options);
                const fileName = `announcements/${Date.now()}_image`;
                const storageRef = ref(storage, fileName);
                const uploadTask = uploadBytesResumable(storageRef, compressedFile);

                const downloadUrl = await new Promise((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(`Uploading: ${Math.round(progress)}%`);
                        },
                        (error) => reject(error),
                        async () => {
                            const url = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(url);
                        }
                    );
                });
                finalImageUrl = downloadUrl;
            }

            setUploadProgress("Saving announcement...");

            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            await addDoc(collection(db, "announcements"), {
                title: title.trim(),
                content: content.trim(),
                type,
                imageUrl: finalImageUrl,
                postedBy: "Admin Command Center",
                createdAt: serverTimestamp(),
                date: dateStr,
                time: timeStr
            });

            setTitle("");
            setContent("");
            setImageFile(null);
            setPreviewUrl("");
            alert("Announcement published successfully!");
        } catch (error) {
            console.error("Post Error:", error);
            alert(`Failed to post: ${error.message}`);
        } finally {
            setLoading(false);
            setUploadProgress("");
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
                <header className="bg-white min-h-[140px] px-8 py-5 rounded-lg shadow-sm mb-6 flex justify-between items-center border border-gray-100">
                    <h1 className="font-bold text-xl flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-md">
                            <Megaphone className="text-blue-600" size={18} />
                        </div>
                        Announcement Manager
                    </h1>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* EDITOR SECTION */}
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
                                    {previewUrl ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                            <img src={previewUrl} alt="Preview" className="w-full h-52 object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => { setImageFile(null); setPreviewUrl(""); }}
                                                    className="bg-white text-red-500 p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50/50 hover:border-blue-300 transition-all group">
                                            <div className="p-3 bg-gray-50 rounded-full group-hover:bg-blue-100 transition-colors">
                                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-600" />
                                            </div>
                                            <p className="mt-3 text-[10px] font-black text-gray-400 group-hover:text-blue-600 uppercase tracking-widest">Select Image</p>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">Message Detail</label>
                                    <textarea
                                        value={content} onChange={(e) => setContent(e.target.value)} required rows={5}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm resize-none"
                                        placeholder="What is this announcement about?"
                                    />
                                </div>

                                <button
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex flex-col items-center justify-center gap-1"
                                >
                                    <span className="text-sm tracking-widest uppercase">{loading ? "Processing..." : "Publish Announcement"}</span>
                                    {loading && <span className="text-[10px] font-medium opacity-80 animate-pulse">{uploadProgress}</span>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* LIST SECTION */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Live Bulletin Feed</p>
                            </div>
                            <span className="text-[10px] font-bold ">
                                {announcements.length} Total Posts
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {announcements.length === 0 && !loading && (
                                <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                                    <Megaphone className="mx-auto text-gray-200 mb-4" size={48} />
                                    <p className="text-gray-400 font-medium">No announcements found in the database.</p>
                                </div>
                            )}

                            {announcements.map((post) => (
                                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 group">
                                    {post.imageUrl && (
                                        <div className="w-full h-48 bg-gray-100 overflow-hidden">
                                            <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="post" />
                                        </div>
                                    )}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-5">
                                            <span className={`text-[10px] px-3 font-black uppercase ${
                                                post.type === 'Emergency'
                                                    ? 'bg-red-50 text-red-600'
                                                    : post.type === 'Important'
                                                        ? 'text-amber-600'
                                                        : 'text-blue-600  '
                                            }`}>
                                                {post.type}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(post.id)}
                                                className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-3 mb-6 leading-relaxed flex-1">
                                            {post.content}
                                        </p>
                                        <div className="pt-5 border-t border-gray-50 flex justify-between items-center text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                            <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-400" /> {post.date}</span>
                                            <span className="flex items-center gap-2"><Clock size={14} className="text-blue-400" /> {post.time}</span>
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