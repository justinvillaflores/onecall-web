"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    User,
    Lock,
    Bell,
    Camera,
    Save,
} from "lucide-react";

export default function RoleSettings() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [saveLoading, setSaveLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "",
        phone: "",
        imageUrl: ""
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
                    if (data.role !== "responder") {
                        router.push("/dashboard");
                    } else {
                        setUserData({ id: user.uid, ...data });
                        setProfileData({
                            fullName: data.name || "",
                            email: data.email || user.email,
                            phone: data.phoneNumber || "",
                            imageUrl: data.imageUrl || ""
                        });
                        setLoading(false);
                    }
                } else {
                    router.push("/login");
                }
            } catch (error) {
                console.error("Security check error:", error);
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
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
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile.");
        } finally {
            setSaveLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#F1F3F9] overflow-hidden">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 ml-[280px] flex flex-col h-full overflow-hidden">

                <div className="flex justify-between items-center m-8 mb-4 bg-white p-3 px-8 rounded-[10px] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl text-gray-800 tracking-tight font-normal">Settings</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-800">
                                {profileData.fullName || "Responder Unit"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">

                        <div className="w-full md:w-64 space-y-2">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                            >
                                <User size={18} /> Profile
                            </button>
                            <button
                                onClick={() => setActiveTab("security")}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                            >
                                <Lock size={18} /> Security
                            </button>
                            <button
                                onClick={() => setActiveTab("notifications")}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'}`}
                            >
                                <Bell size={18} /> Alerts
                            </button>
                        </div>

                        <div className="flex-1 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-12">

                            {activeTab === "profile" && (
                                <form onSubmit={handleUpdateProfile} className="p-8 space-y-8 animate-in fade-in duration-500">

                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden text-blue-600 text-lg font-black shadow-inner border border-white">
                                                {profileData.imageUrl ? (
                                                    <img src={profileData.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    profileData.fullName.charAt(0)
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-0">
                                            <h2 className="text-sm font-black text-gray-800 leading-tight">{profileData.fullName}</h2>
                                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Responder Account</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Service Name / Full Name</label>
                                            <input
                                                type="text"
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                                                className="w-full px-5 py-3 bg-[#F8F9FA] border border-gray-100 rounded-xl text-sm outline-none focus:border-blue-500/50 focus:bg-white transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</label>
                                            <input type="email" value={profileData.email} disabled className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-400 font-medium cursor-not-allowed" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Contact Number</label>
                                            <input
                                                type="text"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                                className="w-full px-5 py-3 bg-[#F8F9FA] border border-gray-100 rounded-xl text-sm outline-none focus:border-blue-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={saveLoading}
                                            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Save size={16} /> {saveLoading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === "security" && (
                                <div className="p-8 space-y-8 animate-in fade-in duration-500">
                                    <div className="space-y-1">
                                        <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Security</h2>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic">Maintain access security</p>
                                    </div>

                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                                        <div>
                                            <p className="text-sm font-black text-gray-800">Account Protection</p>
                                            <p className="text-[11px] text-gray-500 leading-relaxed mt-1 font-medium">Your account is secured with Firebase Auth. Manage your credentials carefully to ensure emergency services availability.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-w-md">
                                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                                            <p className="text-[10px] font-bold text-orange-700 uppercase">Note:</p>
                                            <p className="text-[11px] text-orange-600 font-medium">Password changes require a recent login session for security reasons.</p>
                                        </div>
                                        <button
                                            type="button"
                                            className="px-8 py-3.5 bg-gray-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                                        >
                                            Request Password Reset Email
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}