"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import {
    UserCircle,
    Building2,
    Search,
    Trash2,
    Edit2,
    Plus,
    Loader2,
    PhoneCall,
    X,
    AlertTriangle
} from "lucide-react";

export default function HotlinesPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Para sa delete modal
    const [idToDelete, setIdToDelete] = useState(null); // ID na buburahin
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [hotlines, setHotlines] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        number: "",
        category: "Police",
        imageUrl: ""
    });

    useEffect(() => {
        setMounted(true);

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/login");
            }
        });

        const q = query(collection(db, "hotlines"), orderBy("name", "asc"));
        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setHotlines(data);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
        };
    }, [router]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.number) return alert("Please fill in the required fields.");

        try {
            if (editingId) {
                const docRef = doc(db, "hotlines", editingId);
                await updateDoc(docRef, { ...formData, lastUpdated: serverTimestamp() });
            } else {
                await addDoc(collection(db, "hotlines"), {
                    ...formData,
                    createdAt: serverTimestamp(),
                    lastUpdated: serverTimestamp()
                });
            }
            closeModal();
        } catch (error) {
            console.error("Error saving hotline:", error);
            alert("Failed to save.");
        }
    };

    const handleDeleteClick = (id) => {
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete) return;
        try {
            await deleteDoc(doc(db, "hotlines", idToDelete));
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setIdToDelete(null);
    };

    const openEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            number: item.number,
            category: item.category || "Police",
            imageUrl: item.imageUrl || ""
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: "", number: "", category: "Police", imageUrl: "" });
    };

    const filteredHotlines = hotlines.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 ml-[280px] p-10">
                <div className="flex justify-between items-center mb-8 bg-white p-6 px-8 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hotlines Management</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-700">Administrator</p>
                            <p className="text-xs text-slate-400">OCPO Main</p>
                        </div>
                        <UserCircle size={40} strokeWidth={1.5} className="text-slate-400" />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="relative flex-1 max-w-lg group">
                        <Search
                            size={18}
                            strokeWidth={1.5}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                        />
                        <input
                            type="text"
                            placeholder="Search by name or station..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg outline-none
                            focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400
                            transition-all shadow-sm text-sm placeholder:text-slate-400"
                        />
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
                                    shadow-md hover:bg-blue-700 flex items-center gap-2
                                    transition-all active:scale-95 text-sm whitespace-nowrap"
                    >
                        <Plus size={18} strokeWidth={2} />
                        Add New Hotline
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                            <p className="text-slate-500 font-medium">Loading hotlines...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr className="text-slate-500 text-[11px] uppercase tracking-widest">
                                    <th className="px-8 py-4 font-bold">Name / Station</th>
                                    <th className="px-8 py-4 font-bold">Category</th>
                                    <th className="px-8 py-4 font-bold">Contact No. / Links</th>
                                    <th className="px-8 py-4 text-right font-bold">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                {filteredHotlines.length > 0 ? (
                                    filteredHotlines.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-3 align-middle">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 flex-shrink-0 rounded-md bg-slate-100 border border-slate-200 overflow-hidden">
                                                        {item.imageUrl ? (
                                                            <img
                                                                src={item.imageUrl}
                                                                alt="logo"
                                                                className="w-full h-full object-cover"
                                                                style={{
                                                                    maxWidth: "40px",
                                                                    maxHeight: "40px"
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Building2 size={16} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        item.category === 'Police' ? 'bg-blue-100 text-blue-700' :
                                                            item.category === 'Barangay' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {item.category}
                                                    </span>
                                            </td>
                                            <td className="px-8 py-4 text-slate-600 font-mono text-sm">{item.number}</td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center text-slate-400 italic">
                                            No hotlines found. Try searching or add a new one.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {mounted && isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md backdrop-saturate-150 transition-all duration-300"
                        onClick={closeModal}
                    />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-10 transition-all duration-200 scale-100">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center">
                                <PhoneCall className="text-blue-600" size={32} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
                            {editingId ? "Update Hotline" : "New Emergency Entry"}
                        </h2>
                        <p className="text-slate-500 text-center text-sm mb-8 px-4">
                            Ensure the contact details are correct. Changes will reflect instantly on all mobile devices.
                        </p>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="Police">Police Station</option>
                                    <option value="Barangay">Barangay</option>
                                    <option value="Other">Other Emergency Hotlines</option>
                                    <option value="Report">Report</option>
                                    <option value="Services">Services</option>
                                    <option value="Pages">Pages</option>
                                    <option value="Other Pages">Other Pages</option>
                                    <option value="Olongapo City CCTV Live Stream One">CCTV Stream</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                    Name / Station
                                </label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Police Station 1"
                                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                    Contact Number
                                </label>
                                <input
                                    name="number"
                                    value={formData.number}
                                    onChange={handleChange}
                                    placeholder="e.g. 0912 345 6789"
                                    className="w-full px-5 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                    Logo (Optional)
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                        {formData.imageUrl ? (
                                            <img
                                                src={formData.imageUrl}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Building2 size={18} className="text-slate-400" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData({ ...formData, imageUrl: reader.result });
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0 file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    {editingId ? "Update Hotline" : "Save Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {mounted && isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">

                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={cancelDelete}
                    />

                    <div className="relative w-[280px] rounded-2xl p-5
                        bg-white
                        border border-slate-200
                        shadow-xl">

                        <div className="flex justify-center mb-3">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                            </div>
                        </div>

                        <h2 className="text-base font-bold text-slate-800 text-center">
                            Delete Hotline?
                        </h2>

                        <p className="text-xs text-slate-500 text-center mt-1 mb-4 leading-snug">
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-2">

                            <button
                                onClick={cancelDelete}
                                className="flex-1 py-2 rounded-lg text-xs font-semibold
                               bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2 rounded-lg text-xs font-semibold
                               bg-red-600 text-black hover:bg-red-700
                               active:scale-95 transition"
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}