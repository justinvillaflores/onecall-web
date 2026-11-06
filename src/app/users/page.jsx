"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { UserCircle, Search, ShieldCheck, AlertCircle, Copy, Lock, X, Eye, EyeOff, Trash2, Phone, MapPin, User, Loader2 } from "lucide-react";

const MAX_FAILED_ATTEMPTS = 3;

// 1. LOCKOUT TIMER DURATION
// const LOCKOUT_DURATION_MS = 10 * 1000;              //  10 SECONDS TESTING
// const LOCKOUT_DURATION_MS = 60 * 1000;              //  1 MINUTE
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000;     //  24 HOURS (DEFAULT PRODUCTION)

// =========================================================================================

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [isPrivacyProtected, setIsPrivacyProtected] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [adminPassword, setAdminPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const [showPasswordText, setShowPasswordText] = useState(false);

    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);
    const [timeRemainingText, setTimeRemainingText] = useState("");

    const [editUserModal, setEditUserModal] = useState(false);
    const [deleteUserModal, setDeleteUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [editForm, setEditForm] = useState({
        username: "",
        phoneNumber: "",
        address: ""
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedAttempts = parseInt(localStorage.getItem("admin_privacy_attempts") || "0", 10);
            const savedLockout = localStorage.getItem("admin_privacy_lockout");

            setFailedAttempts(savedAttempts);

            if (savedLockout) {
                const lockoutTime = parseInt(savedLockout, 10);
                if (Date.now() < lockoutTime) {
                    setLockoutUntil(lockoutTime);
                } else {
                    localStorage.removeItem("admin_privacy_lockout");
                    localStorage.setItem("admin_privacy_attempts", "0");
                    setFailedAttempts(0);
                    setLockoutUntil(null);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (!lockoutUntil) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = lockoutUntil - now;

            if (diff <= 0) {
                localStorage.removeItem("admin_privacy_lockout");
                localStorage.setItem("admin_privacy_attempts", "0");
                setFailedAttempts(0);
                setLockoutUntil(null);
                setPasswordError("");
                setTimeRemainingText("");
                clearInterval(interval);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                if (hours > 0) {
                    setTimeRemainingText(`${hours}h ${minutes}m ${seconds}s`);
                } else if (minutes > 0) {
                    setTimeRemainingText(`${minutes}m ${seconds}s`);
                } else {
                    setTimeRemainingText(`${seconds}s`);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockoutUntil]);

    useEffect(() => {
        let unsubscribeUsers;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            const q = query(collection(db, "users"), where("role", "==", "citizen"));

            unsubscribeUsers = onSnapshot(q, (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(usersData);
                setLoading(false);
            }, (error) => {
                console.error("Firestore listener error:", error);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUsers) unsubscribeUsers();
        };
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const maskName = (name) => {
        if (!name || name === "N/A") return "N/A";
        if (!isPrivacyProtected) return name;
        const parts = name.trim().split(" ");
        return parts.map(part => part.charAt(0) + "*".repeat(Math.max(part.length - 1, 2))).join(" ");
    };

    const maskAddress = (address) => {
        if (!address || address === "N/A") return "N/A";
        if (!isPrivacyProtected) return address;
        return "Protected Address (Hidden for Privacy)";
    };

    const maskPhone = (phone) => {
        if (!phone || phone === "N/A") return "N/A";
        if (!isPrivacyProtected) return phone;
        if (phone.length <= 4) return "****";
        return phone.slice(0, 3) + "****" + phone.slice(-3);
    };

    const handlePrivacyToggleRequest = () => {
        if (isPrivacyProtected) {
            setShowPasswordModal(true);
            setAdminPassword("");
            setPasswordError("");
            setShowPasswordText(false);
        } else {
            setIsPrivacyProtected(true);
        }
    };

    const handleVerifyAdminPassword = async (e) => {
        e.preventDefault();

        if (lockoutUntil && Date.now() < lockoutUntil) {
            setPasswordError(`Account security lock active. Try again in ${timeRemainingText}.`);
            return;
        }

        if (!adminPassword.trim()) {
            setPasswordError("Please enter your admin password.");
            return;
        }

        setIsVerifying(true);
        setPasswordError("");

        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !currentUser.email) {
                throw new Error("No authenticated user session found.");
            }

            const credential = EmailAuthProvider.credential(currentUser.email, adminPassword);
            await reauthenticateWithCredential(currentUser, credential);

            setIsPrivacyProtected(false);
            setShowPasswordModal(false);
            setAdminPassword("");
            setFailedAttempts(0);
            localStorage.setItem("admin_privacy_attempts", "0");
            localStorage.removeItem("admin_privacy_lockout");

        } catch (error) {
            const newAttempts = failedAttempts + 1;
            setFailedAttempts(newAttempts);
            localStorage.setItem("admin_privacy_attempts", newAttempts.toString());

            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
                setLockoutUntil(lockoutTime);
                localStorage.setItem("admin_privacy_lockout", lockoutTime.toString());
                setPasswordError(`Too many failed attempts! Access blocked.`);
            } else {
                const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
                setPasswordError(`Incorrect password. ${remaining} attempt(s) remaining.`);
            }
        } finally {
            setIsVerifying(false);
        }
    };

    const handleOpenEditModal = (user) => {
        setSelectedUser(user);
        setEditForm({
            username: user.username || "",
            phoneNumber: user.phoneNumber || "",
            address: user.address || ""
        });
        setEditUserModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        setActionLoading(true);
        try {
            const userRef = doc(db, "users", selectedUser.id);
            await updateDoc(userRef, {
                username: editForm.username.trim(),
                phoneNumber: editForm.phoneNumber.trim(),
                address: editForm.address.trim()
            });

            alert("Citizen details updated successfully!");
            setEditUserModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error("Update error:", error);
            alert(`Failed to update citizen: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenDeleteModal = (user) => {
        setSelectedUser(user);
        setDeleteUserModal(true);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        setActionLoading(true);
        try {
            await deleteDoc(doc(db, "users", selectedUser.id));
            alert("Citizen account deleted successfully!");
            setDeleteUserModal(false);
            setSelectedUser(null);
        } catch (error) {
            console.error("Delete error:", error);
            alert(`Failed to delete account: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm)
    );

    const duplicateIdentifiers = new Set();
    const seenPhones = new Set();
    const seenNames = new Set();

    users.forEach(user => {
        const phone = user.phoneNumber?.trim();
        const uname = user.username?.trim().toLowerCase();

        if (phone && seenPhones.has(phone)) {
            duplicateIdentifiers.add(phone);
        } else if (phone) {
            seenPhones.add(phone);
        }

        if (uname && seenNames.has(uname)) {
            duplicateIdentifiers.add(uname);
        } else if (uname) {
            seenNames.add(uname);
        }
    });

    const isCurrentlyLocked = lockoutUntil && Date.now() < lockoutUntil;

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 ml-[280px] p-8">

                <div className="flex justify-between items-center mb-8 bg-white p-3 px-6 rounded-[10px] shadow-sm">
                    <h1 className="text-xl text-gray-800 tracking-tight font-normal">
                        Users
                    </h1>
                    <UserCircle size={40} strokeWidth={1} className="text-gray-300 cursor-pointer" />
                </div>

                <div className="flex flex-wrap justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative w-full max-w-[350px]">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                            />
                            <input
                                type="text"
                                placeholder="Search citizens..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-400 text-gray-600 placeholder-gray-300"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handlePrivacyToggleRequest}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                isPrivacyProtected
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-200"
                            }`}
                        >
                            <ShieldCheck size={16} />
                            <span>{isPrivacyProtected ? "Data Privacy Mask: ON" : "Data Privacy Mask: OFF"}</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-50">
                            <th className="px-8 py-4 font-normal">Name & Authenticity</th>
                            <th className="px-8 py-4 font-normal">Address</th>
                            <th className="px-8 py-4 font-normal">Date Registered</th>
                            <th className="px-8 py-4 font-normal">Contact Number</th>
                            <th className="px-8 py-4 font-normal text-center uppercase tracking-wider text-xs">Action</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="px-8 py-10 text-center text-gray-400 text-xs uppercase tracking-widest font-bold">
                                    Loading citizen records...
                                </td>
                            </tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => {
                                const isAuthentic = user.username && user.phoneNumber && user.address;
                                const isDuplicate =
                                    (user.phoneNumber && duplicateIdentifiers.has(user.phoneNumber.trim())) ||
                                    (user.username && duplicateIdentifiers.has(user.username.trim().toLowerCase()));

                                return (
                                    <tr key={user.id} className="hover:bg-gray-50 text-gray-700 border-b border-gray-50 last:border-none">
                                        <td className="px-8 py-5 font-medium">
                                            <div className="flex items-center gap-2">
                                                <span>{maskName(user.username)}</span>
                                                {isAuthentic ? (
                                                    <span title="Verified User Authenticity" className="flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[10px] font-bold gap-0.5">
                                                        <ShieldCheck size={12} /> Verified
                                                    </span>
                                                ) : (
                                                    <span title="Incomplete Profile Info" className="flex items-center text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold gap-0.5">
                                                        <AlertCircle size={12} /> Unverified
                                                    </span>
                                                )}

                                                {isDuplicate && (
                                                    <span title="Potential Multiple Entry / Duplicate Account detected" className="flex items-center text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-[10px] font-bold gap-0.5 animate-pulse">
                                                        <Copy size={12} /> Duplicate Risk
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-8 py-5 font-medium">{maskAddress(user.address)}</td>

                                        <td className="px-8 py-5 font-medium">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : "N/A"}
                                        </td>

                                        <td className="px-8 py-5 font-medium">{maskPhone(user.phoneNumber)}</td>

                                        <td className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => handleOpenEditModal(user)}
                                                    className="text-blue-600 font-extrabold text-xs tracking-wider uppercase hover:underline transition-all"
                                                >
                                                    EDIT
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDeleteModal(user)}
                                                    className="text-red-600 font-extrabold text-xs tracking-wider uppercase hover:underline transition-all"
                                                >
                                                    DELETE
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-10 text-center text-gray-400">
                                    No citizens found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </main>

            {editUserModal && selectedUser && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white w-[420px] rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setEditUserModal(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white mb-3 shadow-md">
                                <UserCircle size={32} />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Edit Citizen Profile</h2>
                            <p className="text-xs text-gray-400">Update the personal details of this registered user.</p>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-3.5">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Full Name / Username</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={editForm.username}
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        placeholder="Enter Citizen Name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={editForm.phoneNumber}
                                        onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                        placeholder="Enter Contact Number"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Address Location</label>
                                <div className="relative">
                                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        placeholder="Enter Address Location"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditUserModal(false)}
                                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-xl transition-all border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                    <span>{actionLoading ? "Updating..." : "Update"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteUserModal && selectedUser && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white w-[380px] rounded-3xl p-6 shadow-2xl relative text-center animate-in fade-in zoom-in duration-200">
                        {/* Red Trash Circle Header */}
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={30} />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6 px-2">
                            Are you sure you want to remove <span className="font-bold text-gray-800">"{selectedUser.username || "this user"}"</span>? This action cannot be reversed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteUserModal(false)}
                                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-2xl transition-all border border-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleDeleteUser}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                <span>{actionLoading ? "Deleting..." : "Yes, Delete"}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white w-[380px] rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-gray-900 font-bold">
                                <Lock size={20} className="text-[#2D44E7]" />
                                <h3>Security Verification</h3>
                            </div>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">
                            To disable the Data Privacy mask and reveal confidential information, please enter your admin password:
                        </p>

                        <form onSubmit={handleVerifyAdminPassword}>
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type={showPasswordText ? "text" : "password"}
                                        placeholder="Enter Admin Password"
                                        value={adminPassword}
                                        disabled={isCurrentlyLocked}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        className="w-full pl-4 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#2D44E7] text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        disabled={isCurrentlyLocked}
                                        onClick={() => setShowPasswordText(!showPasswordText)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                                    >
                                        {showPasswordText ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {isCurrentlyLocked ? (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-xl text-xs mt-3 font-semibold text-center">
                                        <p>Too many failed attempts!</p>
                                        <p className="mt-0.5 text-[11px]">Try again in: <span className="font-bold underline">{timeRemainingText}</span></p>
                                    </div>
                                ) : (
                                    passwordError && (
                                        <p className="text-red-500 text-xs mt-1.5 font-medium">{passwordError}</p>
                                    )
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 py-2.5 rounded-xl hover:bg-gray-100 font-semibold text-gray-600 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isVerifying || isCurrentlyLocked}
                                    className="flex-1 py-2.5 bg-[#2D44E7] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all text-sm disabled:opacity-50"
                                >
                                    {isVerifying ? "Verifying..." : "Confirm"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}