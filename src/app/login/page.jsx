"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();

        // Basic Validation bago tumawag sa Firebase
        if (!email.trim() || !password.trim()) {
            alert("Please fill in all fields.");
            return;
        }

        setLoading(true);

        try {
            // 1. Login gamit ang Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
            const user = userCredential.user;

            // 2. Kukunin ang record mula sa Firestore 'users' collection
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            // CHECK: Kung deleted na ang account sa Firestore list o walang record
            if (!userDoc.exists()) {
                await signOut(auth);
                alert("Account record not found in database. Please contact the administrator.");
                setLoading(false);
                return;
            }

            const userData = userDoc.data();
            const role = userData.role;

            // 3. Conditional Redirect base sa Role
            // Siguraduhing tumutugma ang role names sa Firestore (e.g., 'admin', 'responder')
            if (role === "admin") {
                router.push("/dashboard");
            } else if (role === "responder") {
                // Tiyaking tama ang path na ito sa iyong file structure
                router.push("/role-responder/role-dashboard");
            } else {
                alert("Access Denied: You do not have the required permissions to access this portal.");
                await signOut(auth);
            }

        } catch (error) {
            console.error("Login Error Code:", error.code);

            // Mas malinaw na error messages para sa user
            let friendlyMessage = "Login failed. Please check your credentials.";

            if (error.code === 'auth/invalid-credential') {
                friendlyMessage = "Incorrect email or password. Please try again.";
            } else if (error.code === 'auth/user-disabled') {
                friendlyMessage = "This account has been disabled.";
            } else if (error.code === 'auth/too-many-requests') {
                friendlyMessage = "Too many failed attempts. Please try again later.";
            } else if (error.code === 'auth/network-request-failed') {
                friendlyMessage = "Network error. Please check your internet connection.";
            }

            alert(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 bg-slate-50">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-md border border-gray-100">

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        Command Center
                    </h2>
                    <p className="text-slate-500 mt-2 font-medium">
                        Sign in to access emergency dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="admin@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all transform active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Verifying...</span>
                            </div>
                        ) : (
                            "Login to Portal"
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                    <span className="text-green-500">●</span>
                    Authorized Personnel Only • Secure v4.2
                </div>
            </div>
        </div>
    );
}