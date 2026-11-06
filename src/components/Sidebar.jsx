"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
    LayoutDashboard,
    UserRound,
    MapPin,
    Phone,
    Megaphone,
    Users,
    Settings,
    LogOut,
    MessageSquare,
    Menu,
    X
} from "lucide-react";

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserRole(userData.role);
                        setProfileImage(userData.imageUrl || null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const adminItems = [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "Responder", path: "/responder", icon: UserRound },
        { name: "Location", path: "/location", icon: MapPin },
        { name: "Hotlines", path: "/hotlines", icon: Phone },
        { name: "Announcement", path: "/announcement", icon: Megaphone },
        { name: "Users", path: "/users", icon: Users },
    ];

    const responderItems = [
        { name: "Dashboard", path: "/role-responder/role-dashboard", icon: LayoutDashboard },
        { name: "Announcement", path: "/role-responder/role-announcement", icon: Megaphone },
        { name: "Messages", path: "/role-responder/role-messages", icon: MessageSquare },
        { name: "Map", path: "/role-responder/role-map", icon: MapPin },
    ];

    const menuItems = userRole === "responder" ? responderItems : adminItems;

    const confirmLogout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Logout Error:", error);
            alert("Failed to log out. Please try again.");
        } finally {
            setShowLogoutConfirm(false);
        }
    };

    return (
        <>
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#2D3FE2] z-[40] flex items-center justify-between px-4 shadow-md">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle Navigation Menu"
                        className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        {isOpen ? <X size={26} /> : <Menu size={26} />}
                    </button>
                    <span className="text-white font-black tracking-widest text-sm uppercase">
                        {userRole === "responder" ? "Responder" : "Administrator"}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/50 z-[45] lg:hidden backdrop-blur-sm transition-opacity"
                />
            )}

            <aside
                className={`w-[270px] flex flex-col h-screen fixed left-0 top-0 z-[50] shadow-2xl overflow-hidden transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
                style={{ backgroundColor: "#2D3FE2" }}
            >
                <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close Sidebar"
                    className="lg:hidden absolute top-4 right-4 text-white/80 hover:text-white p-1"
                >
                    <X size={24} />
                </button>

                <div className="pt-10 pb-6 w-full flex flex-col items-center justify-center">
                    <div className="w-28 h-28 flex items-center justify-center overflow-hidden rounded-full border-2 border-white/20">
                        {profileImage ? (
                            <img
                                src={profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src="/download1.png"
                                alt="Default Logo"
                                className="w-28 h-28 object-contain"
                            />
                        )}
                    </div>

                    <div className="text-center mt-3">
                        <h2 className="text-white text-[14px] font-black tracking-[4px] uppercase mb-1">
                            {userRole === "responder" ? "Responder" : "Administrator"}
                        </h2>
                        <div className="h-[2px] w-8 bg-white/30 mx-auto rounded-full"></div>
                    </div>
                </div>

                <div className="px-10">
                    <div className="h-[1px] bg-white/20 w-full mb-3"></div>
                </div>

                <nav className="flex-1 px-5 space-y-3 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.name}
                                onClick={() => {
                                    router.push(item.path);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 ${
                                    isActive
                                        ? "bg-white text-[#2D3FE2] shadow-md rounded-2xl"
                                        : "text-white hover:bg-white/10 rounded-xl"
                                }`}
                            >
                                <Icon size={20} className={isActive ? "text-[#2D3FE2]" : "text-white"} />
                                <span className="text-[15px] font-bold">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="px-5 pb-10">
                    <div className="h-[1px] bg-white/20 w-full mb-6"></div>
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                router.push(userRole === "responder" ? "/role-responder/role-settings" : "/settings");
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-4 px-4 py-3 text-[15px] font-bold text-white hover:bg-white/10 rounded-xl transition-all"
                        >
                            <Settings size={20} />
                            <span>Settings</span>
                        </button>

                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center gap-4 px-4 py-3 text-[15px] font-bold text-white hover:bg-red-500/20 rounded-xl transition-all"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white w-[340px] rounded-2xl p-6 shadow-2xl text-center relative animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">
                            Confirm Logout
                        </h2>
                        <p className="text-gray-700 text-sm mb-6">
                            Are you sure you want to logout?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl hover:bg-gray-200 font-semibold text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 font-bold rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95 text-white"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}