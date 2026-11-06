"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut, createUserWithEmailAndPassword, getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { initializeApp, getApps } from "firebase/app";
import { doc, setDoc, collection, onSnapshot, query, orderBy, updateDoc, deleteDoc } from "firebase/firestore";
import { UserCircle, Search, Building2, Eye, EyeOff, X, Trash2, Phone, UploadCloud, ShieldCheck, Lock } from "lucide-react";

const withTimeout = (promise, timeoutMs = 12000, errorMessage = "Request timed out. Please check your network connection.") => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export default function ResponderPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceName, setServiceName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [street, setStreet] = useState("");
    const [barangay, setBarangay] = useState("");
    const [password, setPassword] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedResponder, setSelectedResponder] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [responders, setResponders] = useState([]);
    const [isPrivacyProtected, setIsPrivacyProtected] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const CLOUD_NAME = "o3atijfz";
    const UPLOAD_PRESET = "onecall_preset";

    useEffect(() => {
        setMounted(true);
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setResponders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).filter((user) => user.role === "responder"));
        }, (error) => console.error("Firestore Listener Error:", error));
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const maskPhone = (phone) => {
        if (!phone || phone === "---") return "---";
        if (!isPrivacyProtected) return phone;
        if (phone.length <= 4) return "****";
        return phone.slice(0, 3) + "****" + phone.slice(-3);
    };

    const maskEmail = (mail) => {
        if (!mail) return "---";
        if (!isPrivacyProtected) return mail;
        const [user, domain] = mail.split("@");
        if (!domain) return "****";
        return `${user.charAt(0)}${"*".repeat(Math.max(user.length - 2, 2))}${user.slice(-1)}@${domain}`;
    };

    const maskPassword = (pass) => {
        if (!pass) return "••••••••";
        if (!isPrivacyProtected) return pass;
        return "••••••••";
    };

    const handlePrivacyToggleRequest = () => {
        if (isPrivacyProtected) {
            setShowPasswordModal(true);
            setAdminPassword("");
            setPasswordError("");
        } else {
            setIsPrivacyProtected(true);
        }
    };

    const handleVerifyAdminPassword = async (e) => {
        e.preventDefault();
        if (!adminPassword) {
            setPasswordError("Please enter your admin password.");
            return;
        }

        setIsVerifying(true);
        setPasswordError("");

        try {
            const currentUser = auth.currentUser;
            if (!currentUser?.email) throw new Error("No authenticated admin found.");
            const credential = EmailAuthProvider.credential(currentUser.email, adminPassword);
            await reauthenticateWithCredential(currentUser, credential);
            setIsPrivacyProtected(false);
            setShowPasswordModal(false);
            setAdminPassword("");
        } catch (error) {
            console.error("Re-authentication error:", error);
            setPasswordError("Incorrect password. Access denied.");
        } finally {
            setIsVerifying(false);
        }
    };

    const resetForm = () => {
        setServiceName("");
        setEmail("");
        setPhoneNumber("");
        setStreet("");
        setBarangay("");
        setPassword("");
        setImageUrl("");
        setImageFile(null);
        setSelectedResponder(null);
        setShowPassword(false);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImageUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const uploadToCloudinary = async (file) => {
        if (!file) return imageUrl || "";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
                signal: controller.signal
            });
            const data = await res.json();
            if (!res.ok || !data.secure_url) throw new Error(data.error?.message || "Failed to upload image to Cloudinary");
            return data.secure_url;
        } catch (err) {
            if (err.name === "AbortError") throw new Error("Image upload timed out. Please check your internet connection.");
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    const handleAddResponder = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await withTimeout((async () => {
                const secondaryApp = getApps().find((app) => app.name === "SecondaryApp") || initializeApp(auth.app.options, "SecondaryApp");
                const secondaryAuth = getAuth(secondaryApp);
                const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
                const user = userCredential.user;
                const finalImageUrl = imageFile ? await uploadToCloudinary(imageFile) : "";

                await setDoc(doc(db, "users", user.uid), {
                    name: serviceName.trim(),
                    email: email.trim(),
                    phoneNumber: phoneNumber.trim(),
                    street: street.trim(),
                    barangay: barangay.trim(),
                    password,
                    imageUrl: finalImageUrl,
                    role: "responder",
                    createdAt: new Date().toISOString()
                });

                await signOut(secondaryAuth);
            })(), 20000, "Adding responder timed out. Please check your internet connection.");

            alert("New Responder registered successfully!");
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Add Responder Error:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (responder) => {
        setSelectedResponder(responder);
        setServiceName(responder.name || "");
        setEmail(responder.email || "");
        setPhoneNumber(responder.phoneNumber || "");
        setStreet(responder.street || "");
        setBarangay(responder.barangay || "");
        setImageUrl(responder.imageUrl || "");
        setImageFile(null);
        setIsEditModalOpen(true);
    };

    const handleUpdateResponder = async (e) => {
        e.preventDefault();
        if (!selectedResponder?.id) return;
        setLoading(true);

        try {
            await withTimeout((async () => {
                const finalImageUrl = imageFile ? await uploadToCloudinary(imageFile) : imageUrl;
                await updateDoc(doc(db, "users", selectedResponder.id), {
                    name: serviceName.trim(),
                    email: email.trim(),
                    phoneNumber: phoneNumber.trim(),
                    street: street.trim(),
                    barangay: barangay.trim(),
                    imageUrl: finalImageUrl
                });
            })(), 15000, "Update operation timed out. Please try again.");

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
            await withTimeout(deleteDoc(doc(db, "users", selectedResponder.id)), 10000, "Delete request timed out. Please try again.");
            alert("Responder deleted successfully.");
            setIsDeleteModalOpen(false);
            resetForm();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Delete failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredResponders = responders.filter((item) => {
        const search = searchQuery.toLowerCase();
        return item.name?.toLowerCase().includes(search) ||
            item.email?.toLowerCase().includes(search) ||
            item.phoneNumber?.toLowerCase().includes(search) ||
            item.street?.toLowerCase().includes(search) ||
            item.barangay?.toLowerCase().includes(search);
    });

    const closeFormModal = () => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={handleLogout} />
            <main className="ml-[280px] flex-1 p-8">
                <div className="mb-8 flex items-center justify-between rounded-[10px] bg-white p-3 px-6 shadow-sm">
                    <h1 className="text-xl font-normal tracking-tight text-gray-800">Responder</h1>
                    <UserCircle size={40} strokeWidth={1} className="cursor-pointer text-gray-300" />
                </div>

                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700">
                            + Add New Responder
                        </button>
                        <div className="relative w-full max-w-[350px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-100 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-blue-400" />
                        </div>
                    </div>
                    <button onClick={handlePrivacyToggleRequest} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all ${isPrivacyProtected ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-amber-200 bg-amber-50 text-amber-600"}`}>
                        <ShieldCheck size={16} />
                        <span>{isPrivacyProtected ? "Data Privacy Mask: ON" : "Data Privacy Mask: OFF"}</span>
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-100 bg-slate-50/50">
                        <tr className="text-[11px] uppercase tracking-widest text-gray-400">
                            <th className="px-8 py-4 font-bold">Services</th>
                            <th className="px-8 py-4 font-bold">Phone Number</th>
                            <th className="px-8 py-4 font-bold">Email</th>
                            <th className="px-8 py-4 font-bold">Password</th>
                            <th className="px-8 py-4 font-bold">Date Registered</th>
                            <th className="px-8 py-4 text-right font-bold">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                        {filteredResponders.length ? filteredResponders.map((item) => (
                            <tr key={item.id} className="group text-gray-700 transition-colors hover:bg-gray-50/50">
                                <td className="px-8 py-3 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                                            {item.imageUrl ? <img src={item.imageUrl} alt="logo" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <Building2 size={16} className="text-slate-400" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                                            <p className="mt-1 text-xs text-gray-400">{item.street || "Street not provided"}{item.barangay ? `, ${item.barangay}` : ""}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-4 font-mono text-sm text-gray-500">{maskPhone(item.phoneNumber)}</td>
                                <td className="px-8 py-4 font-mono text-sm text-gray-600">{maskEmail(item.email)}</td>
                                <td className="px-8 py-4"><span className="rounded bg-gray-100 px-2 py-1 font-mono text-[10px] text-gray-600">{maskPassword(item.password)}</span></td>
                                <td className="px-8 py-4 text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "---"}</td>
                                <td className="px-8 py-4 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => handleEditClick(item)} className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800">Edit</button>
                                        <button onClick={() => handleDeleteClick(item)} className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-800">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className="py-8 text-center text-sm text-gray-400">No responders found.</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </main>

            {mounted && (isModalOpen || isEditModalOpen) && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeFormModal} />
                    <div className="relative z-10 my-auto w-full max-w-[450px] rounded-2xl bg-white p-8 shadow-2xl">
                        <button onClick={closeFormModal} className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-600"><X size={20} /></button>
                        <div className="mb-4 flex justify-center">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                {imageUrl ? <img src={imageUrl} alt="Preview" className="h-full w-full object-cover" /> : <Building2 size={22} className="text-gray-500" />}
                            </div>
                        </div>
                        <h2 className="text-center text-lg font-bold text-gray-800">{isEditModalOpen ? "Edit Responder" : "Add New Responder"}</h2>
                        <p className="mb-6 text-center text-sm text-gray-400">{isEditModalOpen ? "Update the information of this emergency service." : "Register a new emergency service account."}</p>

                        <form className="space-y-4" onSubmit={isEditModalOpen ? handleUpdateResponder : handleAddResponder}>
                            <div>
                                <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Service Logo (Optional)</label>
                                <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                        {imageUrl ? <img src={imageUrl} alt="preview" className="h-full w-full object-cover" /> : <UploadCloud size={20} className="text-slate-300" />}
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageChange} className="w-full cursor-pointer text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-600 hover:file:bg-blue-100" />
                                </div>
                            </div>

                            <input placeholder="Service Name" value={serviceName} onChange={(e) => setServiceName(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none transition-all focus:ring-2 focus:ring-blue-100" />

                            <div className="relative">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input placeholder="Phone Number (for SMS)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-800 outline-none transition-all focus:ring-2 focus:ring-blue-100" />
                            </div>

                            <input placeholder="Street" value={street} onChange={(e) => setStreet(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none transition-all focus:ring-2 focus:ring-blue-100" />
                            <input placeholder="Barangay" value={barangay} onChange={(e) => setBarangay(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none transition-all focus:ring-2 focus:ring-blue-100" />

                            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none transition-all focus:ring-2 focus:ring-blue-100" />

                            {!isEditModalOpen && (
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none transition-all focus:ring-2 focus:ring-blue-100" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeFormModal} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:opacity-50">{loading ? "Saving..." : isEditModalOpen ? "Update" : "Save"}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {mounted && isDeleteModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-[300px] overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex flex-col items-center p-8 text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50"><Trash2 size={36} className="text-red-500" /></div>
                            <h3 className="mb-3 text-2xl font-bold tracking-tight text-gray-900">Delete Account?</h3>
                            <p className="text-[15px] leading-relaxed text-gray-500">Are you sure you want to remove <span className="font-bold text-gray-800">"{selectedResponder?.name}"</span>? This action cannot be reversed.</p>
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 rounded-2xl bg-gray-50 py-3 text-[14px] font-bold text-gray-500 transition-all hover:bg-gray-100 active:scale-95">Cancel</button>
                            <button onClick={confirmDelete} disabled={loading} className="flex-1 rounded-2xl bg-red-600 py-3 text-[14px] font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50">{loading ? "Deleting..." : "Yes, Delete"}</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {showPasswordModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="relative w-[380px] rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-gray-900"><Lock size={20} className="text-[#2D44E7]" /><h3>Security Verification</h3></div>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 transition-colors hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <p className="mb-4 text-sm text-gray-600">To disable the Data Privacy mask and reveal confidential information, please enter your admin password:</p>
                        <form onSubmit={handleVerifyAdminPassword}>
                            <div className="mb-4">
                                <input type="password" placeholder="Enter Admin Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#2D44E7]" autoFocus />
                                {passwordError && <p className="mt-1.5 text-xs font-medium text-red-500">{passwordError}</p>}
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100">Cancel</button>
                                <button type="submit" disabled={isVerifying} className="flex-1 rounded-xl bg-[#2D44E7] py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 disabled:opacity-50">{isVerifying ? "Verifying..." : "Confirm"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}