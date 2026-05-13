"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { UserCircle, Search } from "lucide-react";

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm)
    );

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

                <div className="flex items-center mb-6">
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
                            className="w-full pl-10 pr-4 py-2 bg-white rounded-lg text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-400 text-gray-600 placeholder-gray-300"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-50">
                            <th className="px-8 py-4 font-normal">Name</th>
                            <th className="px-8 py-4 font-normal">Address</th>
                            <th className="px-8 py-4 font-normal">Date Registered</th>
                            <th className="px-8 py-4 font-normal">Contact Number</th>
                            <th className="px-8 py-4 font-normal text-right">Action</th>
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
                            filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 text-gray-700 border-b border-gray-50 last:border-none">
                                    <td className="px-8 py-5 font-medium">{user.username || "N/A"}</td>
                                    <td className="px-8 py-5 font-medium">{user.address || "N/A"}</td>
                                    <td className="px-8 py-5 font-medium">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : "N/A"}
                                    </td>
                                    <td className="px-8 py-5 font-medium">{user.phoneNumber || "N/A"}</td>

                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-4 text-sm font-bold">
                                            <button className="text-[#2D44E7] hover:underline">Edit</button>
                                            <button className="text-[#2D44E7] hover:underline">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
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
        </div>
    );
}