"use client";

import "./globals.css";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function RootLayout({ children }) {
    const [user, setUser] = useState(undefined);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u ? u : null);
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    const publicPages = ["/", "/about", "/contact", "/login"];
    const showHeader = publicPages.includes(pathname);

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen flex flex-col bg-white" suppressHydrationWarning>
        {user === undefined ? (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white w-full gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading OneCall...</p>
            </div>
        ) : (
            <>
                {showHeader && (
                    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                        <nav className="container mx-auto flex justify-between items-center p-4 lg:px-8 relative">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                    1
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                                    One<span className="text-blue-600">Call</span>
                                </h1>
                            </div>

                            <ul className="hidden md:flex space-x-8 text-sm font-bold text-slate-600">
                                <li><Link href="/" className="hover:text-blue-600 transition">Home</Link></li>
                                <li><Link href="/about" className="hover:text-blue-600 transition">About</Link></li>
                                <li><Link href="/contact" className="hover:text-blue-600 transition">Contact</Link></li>
                            </ul>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <Link
                                    href="/login"
                                    className="bg-slate-900 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shadow-md sm:shadow-lg shadow-slate-200"
                                >
                                    Sign in
                                </Link>

                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
                                    aria-label="Toggle menu"
                                >
                                    {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                                </button>
                            </div>

                            {mobileMenuOpen && (
                                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-xl py-4 px-6 flex flex-col space-y-4 text-sm font-bold text-slate-700 animate-in slide-in-from-top-2 duration-200">
                                    <Link href="/" className="hover:text-blue-600 transition py-1">Home</Link>
                                    <Link href="/about" className="hover:text-blue-600 transition py-1">About</Link>
                                    <Link href="/contact" className="hover:text-blue-600 transition py-1">Contact</Link>
                                </div>
                            )}
                        </nav>
                    </header>
                )}

                <main className="flex-grow">
                    {children}
                </main>
            </>
        )}
        </body>
        </html>
    );
}