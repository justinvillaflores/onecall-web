"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { User, Lock, Bell, Save, Send, AlertTriangle } from "lucide-react";

export default function RoleSettings() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [saveLoading, setSaveLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);

    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "",
        phone: "",
        street: "",
        barangay: "",
        imageUrl: ""
    });

    const [reportForm, setReportForm] = useState({
        incidentType: "Medical Emergency",
        location: "",
        priority: "High",
        details: ""
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            try {
                const userRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(userRef);

                if (!docSnap.exists()) {
                    router.push("/login");
                    return;
                }

                const data = docSnap.data();

                if (data.role !== "responder") {
                    router.push("/dashboard");
                    return;
                }

                setUserData({ id: user.uid, ...data });
                setProfileData({
                    fullName: data.name || "",
                    email: data.email || user.email || "",
                    phone: data.phoneNumber || "",
                    street: data.street || "",
                    barangay: data.barangay || "",
                    imageUrl: data.imageUrl || ""
                });
                setLoading(false);
            } catch (error) {
                console.error("Profile loading error:", error);
                router.push("/login");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to log out. Please try again.");
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        const currentUser = auth.currentUser;
        if (!currentUser || !userData?.id || currentUser.uid !== userData.id) {
            alert("Your session is invalid. Please log in again.");
            router.push("/login");
            return;
        }

        setSaveLoading(true);

        try {
            await updateDoc(doc(db, "users", currentUser.uid), {
                name: profileData.fullName.trim(),
                phoneNumber: profileData.phone.trim(),
                street: profileData.street.trim(),
                barangay: profileData.barangay.trim()
            });

            setUserData((prev) => ({
                ...prev,
                name: profileData.fullName.trim(),
                phoneNumber: profileData.phone.trim(),
                street: profileData.street.trim(),
                barangay: profileData.barangay.trim()
            }));

            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleSendReport = async (e) => {
        e.preventDefault();

        if (!reportForm.location.trim() || !reportForm.details.trim()) {
            alert("Please fill in all required fields (Location & Details).");
            return;
        }

        if (!userData?.id || auth.currentUser?.uid !== userData.id) {
            alert("Your session is invalid. Please log in again.");
            router.push("/login");
            return;
        }

        setReportLoading(true);

        try {
            await addDoc(collection(db, "reports"), {
                responderId: userData.id,
                responderName: profileData.fullName || "Responder Unit",
                incidentType: reportForm.incidentType,
                location: reportForm.location.trim(),
                priority: reportForm.priority,
                details: reportForm.details.trim(),
                createdAt: serverTimestamp(),
                status: "Pending"
            });

            alert("Incident Report sent to Admin successfully!");
            setReportForm({
                incidentType: "Medical Emergency",
                location: "",
                priority: "High",
                details: ""
            });
        } catch (error) {
            console.error("Error sending report:", error);
            alert("Failed to submit report. Please try again.");
        } finally {
            setReportLoading(false);
        }
    };

    const updateProfileField = (field, value) => {
        setProfileData((prev) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={handleLogout} />

            <main className="ml-0 lg:ml-[270px] flex min-h-screen flex-1 flex-col overflow-y-auto pt-20 lg:pt-0 transition-all duration-300">
                <div className="m-4 sm:m-6 lg:m-8 mb-4 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3.5 sm:p-4 px-4 sm:px-8 shadow-sm">
                    <h1 className="text-base sm:text-xl font-medium tracking-tight text-gray-800">Settings</h1>
                    <p className="text-[11px] sm:text-xs font-bold text-gray-800 truncate max-w-[140px] sm:max-w-none">
                        {profileData.fullName || "Responder Unit"}
                    </p>
                </div>

                <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-2 sm:pt-4">
                    <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:gap-6 lg:flex-row">
                        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-64 shrink-0 no-scrollbar">
                            {[
                                { id: "profile", label: "Profile", icon: User },
                                { id: "security", label: "Security", icon: Lock },
                                { id: "notifications", label: "Reports", icon: Bell }
                            ].map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`flex items-center justify-center lg:justify-start gap-2.5 sm:gap-3 rounded-xl border px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shrink-0 flex-1 lg:flex-none ${
                                        activeTab === id
                                            ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100"
                                            : "border-gray-100 bg-white text-gray-400 hover:bg-gray-50"
                                    }`}
                                >
                                    <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mb-12 flex-1 rounded-2xl sm:rounded-[24px] border border-gray-100 bg-white shadow-sm">
                            {activeTab === "profile" && (
                                <form onSubmit={handleUpdateProfile} className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center overflow-hidden rounded-full border border-white bg-blue-50 text-base sm:text-lg font-black text-blue-600 shadow-inner shrink-0">
                                            {profileData.imageUrl ? (
                                                <img src={profileData.imageUrl} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                profileData.fullName.charAt(0)
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <h2 className="text-xs sm:text-sm font-black leading-tight text-gray-800 truncate">
                                                {profileData.fullName || "Responder Unit"}
                                            </h2>
                                            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                                                Responder Account
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Service Name / Full Name</label>
                                            <input
                                                type="text"
                                                value={profileData.fullName}
                                                onChange={(e) => updateProfileField("fullName", e.target.value)}
                                                required
                                                className="w-full rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium outline-none transition-all focus:border-blue-500/50 focus:bg-white"
                                            />
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Email Address</label>
                                            <input
                                                type="email"
                                                value={profileData.email}
                                                disabled
                                                className="w-full cursor-not-allowed rounded-xl border border-gray-100 bg-gray-50 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-400"
                                            />
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Contact Number</label>
                                            <input
                                                type="text"
                                                value={profileData.phone}
                                                onChange={(e) => updateProfileField("phone", e.target.value)}
                                                className="w-full rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium outline-none transition-all focus:border-blue-500/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Street</label>
                                            <input
                                                type="text"
                                                value={profileData.street}
                                                onChange={(e) => updateProfileField("street", e.target.value)}
                                                placeholder="Enter street"
                                                className="w-full rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium outline-none transition-all focus:border-blue-500/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Barangay</label>
                                            <input
                                                type="text"
                                                value={profileData.barangay}
                                                onChange={(e) => updateProfileField("barangay", e.target.value)}
                                                placeholder="Enter barangay"
                                                className="w-full rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium outline-none transition-all focus:border-blue-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 sm:pt-4">
                                        <button
                                            type="submit"
                                            disabled={saveLoading}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 sm:px-8 py-3.5 sm:py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                                        >
                                            <Save size={16} /> {saveLoading ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {activeTab === "security" && (
                                <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
                                    <div className="space-y-1">
                                        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-gray-800">Security</h2>
                                        <p className="text-[9px] sm:text-[10px] font-black uppercase italic tracking-widest text-gray-400">Maintain access security</p>
                                    </div>

                                    <div className="flex items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-blue-100/50 bg-blue-50/50 p-4 sm:p-6">
                                        <div>
                                            <p className="text-xs sm:text-sm font-black text-gray-800">Account Protection</p>
                                            <p className="mt-1 text-[10px] sm:text-[11px] font-medium leading-relaxed text-gray-500">
                                                Your account is secured with Firebase Auth. Manage your credentials carefully to ensure emergency services availability.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full sm:max-w-md space-y-4">
                                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-3.5 sm:p-4">
                                            <p className="text-[9px] sm:text-[10px] font-bold uppercase text-orange-700">Note:</p>
                                            <p className="text-[10px] sm:text-[11px] font-medium text-orange-600">Password changes require a recent login session for security reasons.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => alert("Please use the password reset process for your registered email address.")}
                                            className="w-full sm:w-auto rounded-xl bg-gray-800 px-6 sm:px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-black active:scale-95"
                                        >
                                            Request Password Reset Email
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "notifications" && (
                                <form onSubmit={handleSendReport} className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={18} className="text-blue-600 sm:w-5 sm:h-5" />
                                            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-gray-800">Submit Incident Report</h2>
                                        </div>
                                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Report incident updates directly to the Admin Dashboard
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Incident Category</label>
                                            <select
                                                value={reportForm.incidentType}
                                                onChange={(e) => setReportForm({ ...reportForm, incidentType: e.target.value })}
                                                className="w-full rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 outline-none transition-all focus:border-blue-500/50"
                                            >
                                                <option value="Medical Emergency">Medical Emergency</option>
                                                <option value="Fire Incident">Fire Incident</option>
                                                <option value="Vehicular Accident">Vehicular Accident</option>
                                                <option value="Public Disturbance / Crime">Public Disturbance / Crime</option>
                                                <option value="Natural Disaster / Rescue">Natural Disaster / Rescue</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Priority Level</label>
                                            <select
                                                value={reportForm.priority}
                                                onChange={(e) => setReportForm({ ...reportForm, priority: e.target.value })}
                                                className="w-full rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 outline-none transition-all focus:border-blue-500/50"
                                            >
                                                <option value="High">High Priority (Urgent)</option>
                                                <option value="Medium">Medium Priority</option>
                                                <option value="Low">Low Priority</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Location / Barangay</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. East Bajac-Bajac, Olongapo City"
                                                value={reportForm.location}
                                                onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                                                required
                                                className="w-full rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium outline-none transition-all focus:border-blue-500/50"
                                            />
                                        </div>

                                        <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                                            <label className="ml-1 text-[9px] sm:text-[10px] font-black uppercase text-gray-400">Incident Details & Situation Update</label>
                                            <textarea
                                                rows={4}
                                                placeholder="Describe the ongoing situation, units deployed, or assistance required..."
                                                value={reportForm.details}
                                                onChange={(e) => setReportForm({ ...reportForm, details: e.target.value })}
                                                required
                                                className="w-full resize-none rounded-xl border border-gray-100 bg-[#F8F9FA] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium outline-none transition-all focus:border-blue-500/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={reportLoading}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 sm:px-8 py-3.5 sm:py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                                        >
                                            <Send size={16} /> {reportLoading ? "Submitting Report..." : "Submit Report to Admin"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}