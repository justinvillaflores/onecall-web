"use client";

import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <div className="flex min-h-screen bg-[#F0F2F5]">
            <Sidebar handleLogout={handleLogout} />

            <main className="flex-1 lg:ml-[280px] p-6">
                <h1 className="text-xl font-bold mb-4">Settings</h1>

                <div className="bg-white p-6 rounded shadow">
                    <p>Settings here</p>
                </div>
            </main>
        </div>
    );
}