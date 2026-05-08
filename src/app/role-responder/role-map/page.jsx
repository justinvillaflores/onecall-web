"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    doc, getDoc, updateDoc, serverTimestamp,
    collection, query, where, onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import dynamic from "next/dynamic";

import "leaflet/dist/leaflet.css";

/**
 * SOLUTION: Kinakailangan nating i-load ang lahat ng Leaflet components nang dynamic
 * at i-disable ang SSR (Server Side Rendering) para hindi mag-error sa appendChild.
 */
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

const MapLogic = dynamic(() => Promise.resolve(({ position }) => {
    const { useMap } = require("react-leaflet");
    const map = useMap();
    useEffect(() => {
        if (position && map) {
            map.setView(position, map.getZoom());
        }
    }, [position, map]);
    return null;
}), { ssr: false });

export default function RoleMap() {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false); // Para iwas hydration mismatch
    const [geoIcon, setGeoIcon] = useState(null);
    const [citizenIcon, setCitizenIcon] = useState(null);

    const [currentPos, setCurrentPos] = useState([14.8348, 120.2827]); // Default Olongapo
    const [activeCitizens, setActiveCitizens] = useState([]);

    // 1. I-set ang Mounted state
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. SETUP ICONS (Client-side only)
    useEffect(() => {
        if (typeof window !== "undefined") {
            const L = require("leaflet");
            setGeoIcon(L.icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41], iconAnchor: [12, 41],
            }));
            setCitizenIcon(L.icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41], iconAnchor: [12, 41],
            }));
        }
    }, []);

    // 3. AUTH & RESPONDER GPS WATCHER
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (!user) { router.push("/login"); return; }
            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                setLoading(false);
            }
        });

        let watcher = null;
        if (typeof window !== "undefined" && navigator.geolocation) {
            watcher = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCurrentPos([latitude, longitude]);
                    if (auth.currentUser) {
                        updateDoc(doc(db, "users", auth.currentUser.uid), {
                            lastKnownLat: latitude,
                            lastKnownLon: longitude,
                            lastLocationUpdate: serverTimestamp()
                        });
                    }
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );
        }

        return () => {
            unsubscribeAuth();
            if (watcher !== null) navigator.geolocation.clearWatch(watcher);
        };
    }, [router]);

    // 4. FETCH ONLY CITIZENS (Last 5 Minutes Logic)
    useEffect(() => {
        if (!auth.currentUser || loading) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

            const activeChatIds = snapshot.docs
                .filter(chatDoc => {
                    const data = chatDoc.data();
                    const lastUpdate = data.updatedAt?.toDate().getTime() || 0;
                    return lastUpdate > fiveMinutesAgo;
                })
                .map(chatDoc => {
                    return chatDoc.data().participants.find(id => id !== auth.currentUser.uid);
                });

            if (activeChatIds.length === 0) {
                setActiveCitizens([]);
                return;
            }

            const citizensQuery = query(collection(db, "users"), where("__name__", "in", activeChatIds));

            return onSnapshot(citizensQuery, (cSnapshot) => {
                const list = cSnapshot.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(c => c.lastKnownLat && c.lastKnownLon && c.role === "citizen");
                setActiveCitizens(list);
            });
        });

        return () => unsubscribe();
    }, [loading]);

    // Wag mag-render ng map hangga't hindi pa mounted sa client
    if (loading || !isMounted) return (
        <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={() => signOut(auth)} />
            <main className="flex-1 ml-[280px] p-8 h-screen flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 px-8 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">Live Incident Map</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {activeCitizens.length > 0
                                ? `Monitoring: ${activeCitizens.length} Active Requesters (Last 5 mins)`
                                : "No active emergency messages"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-blue-600">{userData?.name || "Responder Unit"}</p>
                    </div>
                </div>

                {/* MAP CONTAINER */}
                <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative">
                    {/* Check if isMounted is double sure for the map */}
                    {isMounted && (
                        <MapContainer center={currentPos} zoom={15} style={{ height: "100%", width: "100%", zIndex: 1 }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                            <MapLogic position={currentPos} />

                            {/* RESPONDER MARKER */}
                            {geoIcon && (
                                <Marker position={currentPos} icon={geoIcon}>
                                    <Popup><b>You (Responder)</b></Popup>
                                </Marker>
                            )}

                            {/* CITIZEN MARKERS */}
                            {citizenIcon && activeCitizens.map((citizen) => (
                                <Marker
                                    key={citizen.id}
                                    position={[citizen.lastKnownLat, citizen.lastKnownLon]}
                                    icon={citizenIcon}
                                >
                                    <Popup>
                                        <div className="p-1">
                                            <p className="font-black text-red-600 text-sm mb-1">{citizen.username || "User"}</p>
                                            <div className="h-px bg-gray-100 my-1" />
                                            <p className="text-[11px] font-bold text-gray-800">
                                                📍 {citizen.lastKnownStreet || "Olongapo City"}
                                            </p>
                                            <p className="text-[10px] font-bold text-blue-500">
                                                Brgy. {citizen.lastKnownBarangay || "Unknown"}
                                            </p>
                                            <button
                                                onClick={() => router.push(`/messages?chat=${citizen.id}`)}
                                                className="mt-2 w-full bg-blue-600 text-white text-[10px] py-1 rounded"
                                            >
                                                View Conversation
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}

                    {/* LEGEND */}
                    <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-gray-600 uppercase">You (Responder)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_5px_red]"></div>
                            <span className="text-[10px] font-bold text-gray-600 uppercase">Emergency User</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}