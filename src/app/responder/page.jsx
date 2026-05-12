"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, storage } from "@/lib/firebase"; // Siguraduhing na-export ang 'storage' sa firebase config mo
import {
    doc,
    setDoc,
    collection,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
    UserCircle,
    Search,
    Building2,
    Eye,
    EyeOff,
    X,
    Trash2,
    Phone,
    UploadCloud
} from "lucide-react";

export default function ResponderPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // MGA MODAL STATES
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // MGA STATES PARA SA INPUTS AT DATA
    const [serviceName, setServiceName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState(null); // Bagong state para sa file object
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedResponder, setSelectedResponder] = useState(null);

    // STATE PARA SA TABLE DATA
    const [responders, setResponders] = useState([]);

    useEffect(() => {
        setMounted(true);

        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(user => user.role === "responder");
            setResponders(list);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const resetForm = () => {
        setServiceName("");
        setEmail("");
        setPhoneNumber("");
        setPassword("");
        setImageUrl("");
        setImageFile(null);
        setSelectedResponder(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImageFile(file); // I-save ang actual file para sa upload
        const reader = new FileReader();
        reader.onloadend = () => {
            setImageUrl(reader.result); // Para sa preview lang
        };
        reader.readAsDataURL(file);
    };

    // Helper function para sa pag-upload sa Firebase Storage
    const uploadImage = async (userId) => {
        if (!imageFile) return imageUrl; // Kung walang bagong file, ibalik ang dating URL

        const storageRef = ref(storage, `responder_logos/${userId}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        return await getDownloadURL(snapshot.ref);
    };

    const handleAddResponder = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // I-upload muna ang image bago i-save ang doc
            const finalImageUrl = await uploadImage(user.uid);

            await setDoc(doc(db, "users", user.uid), {
                name: serviceName,
                email: email,
                phoneNumber: phoneNumber,
                password: password,
                imageUrl: finalImageUrl,
                role: "responder",
                createdAt: new Date().toISOString()
            });

            alert("New Responder registered successfully!");
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (responder) => {
        setSelectedResponder(responder);
        setServiceName(responder.name);
        setEmail(responder.email);
        setPhoneNumber(responder.phoneNumber || "");
        setImageUrl(responder.imageUrl || "");
        setImageFile(null); // Reset file input
        setIsEditModalOpen(true);
    };

    const handleUpdateResponder = async (e) => {
        e.preventDefault();
        if (!selectedResponder?.id) return;

        setLoading(true);
        try {
            // I-upload ang bagong image kung meron
            const finalImageUrl = await uploadImage(selectedResponder.id);

            const docRef = doc(db, "users", selectedResponder.id);
            await updateDoc(docRef, {
                name: serviceName,
                email: email,
                phoneNumber: phoneNumber,
                imageUrl: finalImageUrl
            });
            alert("Responder updated successfully!");
            setIsEditModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Update error:", error);
            alert("Update failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (responder) => {
        setSelectedResponder(responder);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedResponder?.id) return;

        setLoading(true);
        try {
            await deleteDoc(doc(db, "users", selectedResponder.id));
            setIsDeleteModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 ml-[280px] p-8">
                <div className="flex justify-between items-center mb-8 bg-white p-3 px-6 rounded-[10px] shadow-sm">
                    <h1 className="text-xl text-gray-800 tracking-tight font-normal">Responder</h1>
                    <UserCircle size={40} strokeWidth={1} className="text-gray-300 cursor-pointer" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition"
                    >
                        + Add New Responder
                    </button>

                    <div className="relative w-full max-w-[350px]">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-gray-200 text-gray-600 shadow-sm"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-gray-100">
                        <tr className="text-gray-400 text-[11px] uppercase tracking-widest">
                            <th className="px-8 py-4 font-bold">Services</th>
                            <th className="px-8 py-4 font-bold">Phone Number</th>
                            <th className="px-8 py-4 font-bold">Email</th>
                            <th className="px-8 py-4 font-bold">Password</th>
                            <th className="px-8 py-4 font-bold">Date Registered</th>
                            <th className="px-8 py-4 text-right font-bold">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {responders.map((item, i) => (
                            <tr key={item.id || i} className="hover:bg-gray-50/50 text-gray-700 transition-colors group">
                                <td className="px-8 py-3 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex-shrink-0 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                            {item.imageUrl ? (
                                                <img
                                                    src={item.imageUrl}
                                                    alt="logo"
                                                    className="w-full h-full object-cover"
                                                    style={{ maxWidth: "40px", maxHeight: "40px" }}
                                                />
                                            ) : (
                                                <Building2 size={16} className="text-slate-400" />
                                            )}
                                        </div>
                                        <span className="font-semibold text-slate-700 text-sm">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-4 text-sm font-mono text-gray-500">{item.phoneNumber || "---"}</td>
                                <td className="px-8 py-4 text-sm">{item.email}</td>
                                <td className="px-8 py-4">
                                    <span className="font-mono text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-600">
                                        {item.password}
                                    </span>
                                </td>
                                <td className="px-8 py-4 text-xs text-gray-500">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "---"}
                                </td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase tracking-wider"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(item)}
                                            className="text-red-600 hover:text-red-800 font-bold text-xs uppercase tracking-wider"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODAL PARA SA ADD AT EDIT */}
            {mounted && (isModalOpen || isEditModalOpen) &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }} />
                        <div className="relative bg-white w-full max-w-[450px] rounded-2xl shadow-2xl p-8 z-10 animate-in fade-in zoom-in duration-200">
                            <button
                                onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={22} className="text-gray-500" />
                                    )}
                                </div>
                            </div>

                            <h2 className="text-center text-lg font-bold text-gray-800">
                                {isEditModalOpen ? "Edit Responder" : "Add New Responder"}
                            </h2>
                            <p className="text-center text-sm text-gray-400 mb-6">
                                {isEditModalOpen ? "Update the information of this emergency service." : "Register a new emergency service account."}
                            </p>

                            <form className="space-y-4" onSubmit={isEditModalOpen ? handleUpdateResponder : handleAddResponder}>

                                {/* Logo Upload Field (Optional) */}
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 ml-1">
                                        Service Logo (Optional)
                                    </label>
                                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {imageUrl ? (
                                                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <UploadCloud size={20} className="text-slate-300" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3
                                            file:rounded-md file:border-0 file:text-xs file:font-semibold
                                            file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer w-full"
                                        />
                                    </div>
                                </div>

                                <input
                                    placeholder="Service Name"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />

                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        placeholder="Phone Number (for SMS)"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    />
                                </div>

                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                />

                                {!isEditModalOpen && (
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsModalOpen(false); setIsEditModalOpen(false); }}
                                        className="flex-1 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-sm font-semibold text-gray-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all font-bold text-sm shadow-lg shadow-blue-100"
                                    >
                                        {loading ? "Saving..." : (isEditModalOpen ? "Update" : "Save")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* DELETE MODAL */}
            {mounted && isDeleteModalOpen &&
                createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-all duration-200"
                            onClick={() => setIsDeleteModalOpen(false)}
                        />
                        <div className="relative bg-white w-full max-w-[300px] rounded-3xl shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
                            <div className="p-8 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                                    <Trash2 size={36} className="text-red-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Delete Account?</h3>
                                <p className="text-gray-500 text-[15px] leading-relaxed">
                                    Are you sure you want to remove <span className="font-bold text-gray-800">"{selectedResponder?.name}"</span>?
                                    This action cannot be reversed.
                                </p>
                            </div>
                            <div className="flex gap-3 p-6 pt-0">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="flex-1 py-3 text-[14px] font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={loading}
                                    className="flex-1 py-3 text-[14px] font-bold bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
}