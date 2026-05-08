"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import dynamic from "next/dynamic";
import { formatDistanceToNow } from "date-fns";

import "leaflet/dist/leaflet.css";

// Dynamic imports para maiwasan ang SSR errors sa Next.js
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading City Map...</div>
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export default function AdminLocationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [responderIcon, setResponderIcon] = useState(null);
    const [userIcon, setUserIcon] = useState(null);
    const [units, setUnits] = useState([]);
    const [centerPos] = useState([14.8348, 120.2827]); // Sentro ng Olongapo City

    useEffect(() => {
        setIsMounted(true);
        const L = require("leaflet");

        setResponderIcon(L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            shadowSize: [41, 41]
        }));

        setUserIcon(L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            shadowSize: [41, 41]
        }));
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) { router.push("/login"); return; }
            setLoading(false);
        });

        const q = query(collection(db, "users"));
        const unsubscribeUsers = onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Siguraduhin na may coordinates bago i-render sa map
                if (data.lastKnownLat && data.lastKnownLon) {
                    list.push({ id: doc.id, ...data });
                }
            });
            setUnits(list);
        });

        return () => {
            unsubscribeAuth();
            unsubscribeUsers();
        };
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    if (!isMounted || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F5F6FA]">
            <Sidebar handleLogout={handleLogout} />
            <main className="flex-1 ml-[280px] p-6 h-screen flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100 flex justify-between items-center px-8">
                    <div>
                        <h1 className="font-bold text-gray-800 text-lg tracking-tight">City-Wide Live Monitoring</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Olongapo City Emergency Fleet</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase">Active Units</p>
                        <p className="text-xl font-black text-blue-600 leading-none">{units.length}</p>
                    </div>
                </div>

                {/* MAP */}
                <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative">
                    <MapContainer center={centerPos} zoom={14} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {units.map((u) => (
                            <Marker
                                key={u.id}
                                position={[u.lastKnownLat, u.lastKnownLon]}
                                icon={u.role === 'responder' ? responderIcon : userIcon}
                            >
                                // PALITAN ANG BUONG RETURN NG ADMIN PAGE NG CODE NA ITO:

                                <Popup>
                                    <div className="p-2 min-w-[200px] font-sans">
                                        {/* Sinisigurado na kukunin ang username para sa citizen at name para sa responder */}
                                        <p className={`font-black text-sm mb-1 uppercase tracking-tight ${u.role === 'responder' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {u.role === 'responder' ? (u.name || "Unknown Responder") : (u.username || "Unknown Citizen")}
                                        </p>

                                        <div className="h-[2px] bg-gray-100 my-2"></div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-start gap-2">
                                                <span className="text-[9px] font-black text-gray-400 uppercase w-12 mt-0.5">Street:</span>
                                                <p className="text-[11px] text-slate-700 font-bold flex-1 leading-tight">
                                                    {u.lastKnownStreet || "Unnamed Street"}
                                                </p>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <span className="text-[9px] font-black text-gray-400 uppercase w-12 mt-0.5">Brgy:</span>
                                                <p className="text-[11px] text-blue-600 font-black italic flex-1">
                                                    {u.lastKnownBarangay || "Not Set"}
                                                </p>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <span className="text-[9px] font-black text-gray-400 uppercase w-12 mt-0.5">Phone:</span>
                                                <p className="text-[11px] text-slate-800 font-bold flex-1">
                                                    {u.phoneNumber || "No Contact"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-2 border-t border-gray-50 flex justify-between items-center">
                                            <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Last Sync</span>
                                            <span className="text-[9px] text-gray-500 font-medium italic">
                {u.lastLocationUpdate
                    ? (typeof u.lastLocationUpdate.toDate === 'function'
                        ? formatDistanceToNow(u.lastLocationUpdate.toDate(), { addSuffix: true })
                        : formatDistanceToNow(new Date(u.lastLocationUpdate), { addSuffix: true }))
                    : 'Just now'}
            </span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* LEGEND */}
                    <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest border-b pb-1">Legend</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm shadow-red-200"></div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase">Emergency Responders</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm shadow-blue-200"></div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase">Citizens / Users</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}