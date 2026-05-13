"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
    onAuthStateChanged,
    signOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "firebase/auth";
import {
    Save,
    Settings2,
    UserCircle,
    Mail,
    Phone,
    BadgeCheck,
    Lock,
    KeyRound,
    AlertCircle
} from "lucide-react";

export default function AdminSettings() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [saveLoading, setSaveLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "ocpoadministrator@gmail.com",
        phone: "",
        role: "System Administrator",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }
            try {
                const docSnap = await getDoc(doc(db, "users", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.role !== "admin") {
                        router.push("/dashboard");
                    } else {
                        setUserData({ id: user.uid, ...data });
                        setProfileData((prev) => ({
                            ...prev,
                            fullName: data.name || "System Admin",
                            email: data.email || "ocpoadministrator@gmail.com",
                            phone: data.phoneNumber || "",
                        }));
                        setLoading(false);
                    }
                }
            } catch (error) {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        if(confirm("Confirm logout from Administrator session?")) {
            await signOut(auth);
            router.push("/login");
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaveLoading(true);
        try {
            const userRef = doc(db, "users", userData.id);
            await updateDoc(userRef, {
                name: profileData.fullName,
                phoneNumber: profileData.phone,
            });
            alert("Admin information updated successfully.");
        } catch (error) {
            alert("Failed to update information.");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        setSaveLoading(true);
        const user = auth.currentUser;
        try {
            const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwordData.newPassword);
            alert("Password updated successfully.");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            alert("Error: " + (error.code === 'auth/wrong-password' ? "Incorrect current password." : "Failed to update password."));
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) return null;

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 ml-[280px] flex flex-col h-full overflow-hidden">
                <header className="flex justify-between items-center p-8 bg-transparent border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#2D3FE2] rounded-2xl shadow-lg shadow-blue-200">
                            <Settings2 className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Settings</h1>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Manage System Controls</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-100 rounded-xl border border-slate-200">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-nowrap">Session Encrypted</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 py-10">
                    <div className="max-w-4xl mx-auto">

                        <div className="flex items-center gap-16 border-b border-slate-200 mb-10">
                            {["profile", "security"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-4 text-[12px] font-black uppercase tracking-widest transition-all relative ${
                                        activeTab === tab ? 'text-[#2D3FE2]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab === 'profile' ? 'General Profile' : 'Security & Access'}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2D3FE2] rounded-t-full" />}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-8">
                            {activeTab === "profile" && (
                                <div className="animate-in slide-in-from-bottom-2 duration-500">
                                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2 group">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <UserCircle size={14} className="text-slate-400 group-focus-within:text-[#2D3FE2]" />
                                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Administrator Full Name</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={profileData.fullName}
                                                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                                                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-800 outline-none focus:border-[#2D3FE2] focus:bg-white transition-all shadow-sm"
                                                    placeholder="Enter your name"
                                                />
                                            </div>

                                            <div className="space-y-2 group">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Phone size={14} className="text-slate-400 group-focus-within:text-[#2D3FE2]" />
                                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Official Contact Number</label>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                                    className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-800 outline-none focus:border-[#2D3FE2] focus:bg-white transition-all shadow-sm"
                                                    placeholder="Enter phone number"
                                                />
                                            </div>

                                            <div className="md:col-span-2 space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BadgeCheck size={14} className="text-emerald-500" />
                                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">System Permission Level</label>
                                                </div>
                                                <div className="w-full bg-slate-200/50 border-2 border-slate-200 rounded-xl px-5 py-4 font-black text-slate-500 uppercase tracking-tight">
                                                    {profileData.role}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={saveLoading}
                                            className="group flex items-center gap-3 px-10 py-4 bg-[#2D3FE2] text-slate-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-blue-300 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Save size={18} className="text-slate-300" />
                                            {saveLoading ? "Processing..." : "Update Records"}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {activeTab === "security" && (
                                <div className="animate-in slide-in-from-bottom-2 duration-500 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-4 border-b border-slate-200">
                                        <div className="space-y-2 group">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Mail size={14} className="text-slate-400 group-focus-within:text-[#2D3FE2]" />
                                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Primary Email Address</label>
                                            </div>
                                            <div className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-800">
                                                ocpoadministrator@gmail.com
                                            </div>
                                        </div>
                                        <div className="space-y-2 group"></div>
                                    </div>

                                    <form onSubmit={handleChangePassword} className="space-y-8">
                                        <div className="flex items-center gap-3 border-l-4 border-[#2D3FE2] pl-4">
                                            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Change Access Password</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {['currentPassword', 'newPassword', 'confirmPassword'].map((key) => (
                                                <div key={key} className="space-y-2 group">
                                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                        {key.replace(/([A-Z])/g, ' $1')}
                                                    </label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={passwordData[key]}
                                                        onChange={(e) => setPasswordData({...passwordData, [key]: e.target.value})}
                                                        className="w-full bg-slate-100 border-2 border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-800 outline-none focus:border-[#2D3FE2] focus:bg-white transition-all shadow-sm"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-slate-200">
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <AlertCircle size={16} className="text-orange-500" />
                                                <p className="text-[11px] font-bold leading-tight max-w-xs">Security verification required for credential updates.</p>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={saveLoading}
                                                className="flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg disabled:opacity-50"
                                            >
                                                <KeyRound size={16} />
                                                {saveLoading ? "Verifying..." : "Update Security Key"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}