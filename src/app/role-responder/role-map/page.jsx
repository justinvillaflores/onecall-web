"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center font-bold text-gray-400">Loading Live Map...</div> });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false });

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const rad1 = (lat1 * Math.PI) / 180;
    const rad2 = (lat2 * Math.PI) / 180;
    const diffLat = ((lat2 - lat1) * Math.PI) / 180;
    const diffLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(diffLat / 2) ** 2 + Math.cos(rad1) * Math.cos(rad2) * Math.sin(diffLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function MapLogic({ position, autoFollow }) {
    const { useMap } = require("react-leaflet");
    const map = useMap();

    useEffect(() => {
        if (position && map) {
            map.flyTo(position, 17, { animate: true, duration: 1.5 });
        }
    }, [position, map]);

    return null;
}

const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.max(0, Math.floor((new Date() - date) / 1000));
    if (seconds < 10) return "Live Now";
    let interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval}h ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval}m ago`;
    return `${seconds}s ago`;
};

const isValidAddress = (value) => {
    if (typeof value !== "string") return false;
    const text = value.trim();
    if (!text) return false;
    if (/^(unknown|unnamed|unnamed street|unknown street|unknown road|unknown barangay|n\/a|not available|unavailable|none|null|undefined|-|ol ongapo city|olongapo city)$/i.test(text)) return false;
    if (/^(unnamed|unknown)\s+(street|road|barangay|address)/i.test(text)) return false;
    if (/^[A-Z0-9]{2,}\+[A-Z0-9]{2,}$/i.test(text.replace(/\s/g, ""))) return false;
    return true;
};

const getProfileAddressParts = (entity) => {
    const address = entity?.address || entity?.profile?.address || entity?.homeAddress || "";
    if (!isValidAddress(address)) return { street: "", barangay: "" };

    const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
    let street = parts[0] || "";
    let barangay = "";

    const explicitBarangay = address.match(/\b(?:brgy\.?|barangay)\s+([^,]+)/i);
    if (explicitBarangay) barangay = explicitBarangay[1].trim();
    else if (parts.length > 1) barangay = parts[1];

    if (/^(olongapo city|philippines)$/i.test(street)) street = "";
    if (/^(olongapo city|philippines)$/i.test(barangay)) barangay = "";

    return {
        street: isValidAddress(street) ? street : "",
        barangay: isValidAddress(barangay) ? barangay : ""
    };
};

const getCitizenStreet = (citizen) => {
    const profileAddress = getProfileAddressParts(citizen);
    const candidates = [
        citizen.street,
        citizen.lastKnownStreet,
        citizen.streetName,
        citizen.addressStreet,
        citizen.profile?.street,
        profileAddress.street
    ];
    return candidates.find(isValidAddress) || "Address unavailable";
};

const getCitizenBarangay = (citizen) => {
    const profileAddress = getProfileAddressParts(citizen);
    const candidates = [
        citizen.barangay,
        citizen.lastKnownBarangay,
        citizen.barangayName,
        citizen.profile?.barangay,
        profileAddress.barangay
    ];
    return candidates.find(isValidAddress) || "Address unavailable";
};

const getResponderStreet = (responder) => {
    const profileAddress = getProfileAddressParts(responder);
    const candidates = [
        responder?.street,
        responder?.lastKnownStreet,
        responder?.streetName,
        responder?.addressStreet,
        responder?.profile?.street,
        profileAddress.street
    ];
    return candidates.find(isValidAddress) || "Address unavailable";
};

const getResponderBarangay = (responder) => {
    const profileAddress = getProfileAddressParts(responder);
    const candidates = [
        responder?.barangay,
        responder?.lastKnownBarangay,
        responder?.barangayName,
        responder?.profile?.barangay,
        profileAddress.barangay
    ];
    return candidates.find(isValidAddress) || "Address unavailable";
};

const getCitizenName = (citizen) => citizen.username || citizen.fullName || citizen.fullname || citizen.name || "Citizen";
const getCitizenPhone = (citizen) => citizen.phoneNumber || citizen.contactNumber || citizen.phone || "Not provided";
const getResponderPhone = (responder) => responder?.phoneNumber || responder?.contactNumber || responder?.phone || "Not provided";

function RoleMapContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const targetLat = searchParams.get("lat");
    const targetLon = searchParams.get("lon");
    const targetCitizenId = searchParams.get("citizenId");

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [citizenIcon, setCitizenIcon] = useState(null);

    const [currentPos, setCurrentPos] = useState([14.8348, 120.2827]);
    const [responderPos, setResponderPos] = useState([14.8348, 120.2827]);
    const [activeCitizens, setActiveCitizens] = useState([]);

    const [autoFollow, setAutoFollow] = useState(!(targetCitizenId || (targetLat && targetLon)));
    const lastSentPosRef = useRef(null);
    const lastSentTimeRef = useRef(0);

    useEffect(() => {
        setIsMounted(true);
        const L = require("leaflet");
        const styleSheet = document.createElement("style");
        styleSheet.innerText = ".custom-user-marker,.custom-responder-logo-marker{transition:transform .8s linear!important}";
        document.head.appendChild(styleSheet);

        const userSvg = `<div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center"><span style="position:absolute;width:100%;height:100%;border-radius:50%;background-color:#2563eb;opacity:.35;animation:pulse 1.5s infinite"></span><div style="position:relative;width:28px;height:28px;background-color:#2563eb;border:2.5px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(37,99,235,.5)"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div></div>`;

        setCitizenIcon(L.divIcon({ html: userSvg, className: "custom-user-marker", iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17] }));

        return () => document.head.removeChild(styleSheet);
    }, []);

    const createResponderLogoIcon = (imageUrl) => {
        if (typeof window === "undefined") return null;
        const L = require("leaflet");
        const imageContent = imageUrl
            ? `<img src="${imageUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

        const responderSvg = `<div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center"><span style="position:absolute;width:100%;height:100%;border-radius:50%;background-color:#ef4444;opacity:.5;animation:pulse 1.2s infinite"></span><div style="position:relative;width:36px;height:36px;background-color:#dc2626;border:3px solid #fff;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(220,38,38,.6)">${imageContent}</div></div>`;

        return L.divIcon({ html: responderSvg, className: "custom-responder-logo-marker", iconSize: [44, 44], iconAnchor: [22, 22], popupAnchor: [0, -22] });
    };

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push("/login");
                setLoading(false);
                return;
            }

            const userDocRef = doc(db, "users", user.uid);
            const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserData({ id: user.uid, ...docSnap.data() });
                }
                setLoading(false);
            }, (err) => {
                console.error("User snapshot error:", err);
                setLoading(false);
            });

            return () => unsubDoc();
        });

        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        let watcher = null;

        const updatePosition = (pos) => {
            const { latitude, longitude, speed } = pos.coords;
            const newPos = [latitude, longitude];

            setResponderPos(newPos);

            if (!targetCitizenId && (!targetLat || !targetLon)) {
                setCurrentPos(newPos);
            }

            const now = Date.now();
            let shouldBroadcast = false;

            if (!lastSentPosRef.current) {
                shouldBroadcast = true;
            } else {
                const distanceMoved = calculateDistance(lastSentPosRef.current[0], lastSentPosRef.current[1], latitude, longitude);
                if (distanceMoved >= 2 || now - lastSentTimeRef.current >= 2000) shouldBroadcast = true;
            }

            if (shouldBroadcast && auth.currentUser) {
                lastSentPosRef.current = newPos;
                lastSentTimeRef.current = now;

                updateDoc(doc(db, "users", auth.currentUser.uid), {
                    lastKnownLat: latitude,
                    lastKnownLon: longitude,
                    speed: speed || 0,
                    lastLocationUpdate: serverTimestamp()
                }).catch((error) => console.error("Firestore update error:", error));
            }
        };

        const handleGpsError = (err) => {
            console.warn(`GPS Warning Code ${err.code}: ${err.message}`);

            if (err.code === 3 && typeof window !== "undefined" && navigator.geolocation) {
                if (watcher) navigator.geolocation.clearWatch(watcher);
                watcher = navigator.geolocation.watchPosition(updatePosition, (fallbackErr) => console.error("GPS Fallback Error:", fallbackErr.message), { enableHighAccuracy: false, maximumAge: 5000, timeout: 15000 });
            }
        };

        if (typeof window !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updatePosition, () => {}, { enableHighAccuracy: false, timeout: 5000 });
            watcher = navigator.geolocation.watchPosition(updatePosition, handleGpsError, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
        }

        return () => {
            if (watcher && navigator.geolocation) navigator.geolocation.clearWatch(watcher);
        };
    }, [targetLat, targetLon, targetCitizenId]);

    useEffect(() => {
        if (loading || !isMounted) return;

        const q = query(collection(db, "users"), where("role", "==", "citizen"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((citizen) => Number.isFinite(citizen.lastKnownLat) && Number.isFinite(citizen.lastKnownLon));

            setActiveCitizens(list);

            if (targetCitizenId) {
                const targetCitizen = list.find((c) => c.id === targetCitizenId);
                if (targetCitizen && Number.isFinite(targetCitizen.lastKnownLat) && Number.isFinite(targetCitizen.lastKnownLon)) {
                    setCurrentPos([targetCitizen.lastKnownLat, targetCitizen.lastKnownLon]);
                }
            } else if (targetLat && targetLon) {
                setCurrentPos([parseFloat(targetLat), parseFloat(targetLon)]);
            }
        }, (error) => console.error("Citizen tracking listener error:", error));

        return () => unsubscribe();
    }, [loading, isMounted, targetLat, targetLon, targetCitizenId]);

    if (!isMounted || loading) {
        return <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    const responderIcon = createResponderLogoIcon(userData?.imageUrl);

    return (
        <div className="flex min-h-screen bg-[#F1F3F9]">
            <Sidebar handleLogout={() => signOut(auth)} />
            <main className="flex-1 ml-0 lg:ml-[270px] p-4 sm:p-6 lg:p-8 h-screen flex flex-col overflow-hidden pt-20 lg:pt-8 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-white p-4 sm:px-8 rounded-xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-base sm:text-lg font-bold text-gray-800">Live Incident & Movement Tracker</h1>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                            {activeCitizens.length} Live Tracking Users in Olongapo
                        </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        <button onClick={() => setAutoFollow(!autoFollow)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${autoFollow ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                            {autoFollow ? "Auto-Follow ON" : "Auto-Follow OFF"}
                        </button>
                        <div className="text-right sm:border-l sm:pl-4 border-gray-200">
                            <p className="text-xs font-bold text-blue-600 truncate max-w-[120px] sm:max-w-none">{userData?.name || "Responder Unit"}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative">
                    <MapContainer center={currentPos} zoom={17} style={{ height: "100%", width: "100%" }} zoomControl={true}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapLogic position={currentPos} autoFollow={autoFollow} />

                        {responderIcon && responderPos && (
                            <Marker position={responderPos} icon={responderIcon} zIndexOffset={1000}>
                                <Popup>
                                    <div className="p-2 min-w-[210px]">
                                        <div className="flex justify-between items-center mb-2 gap-2">
                                            <div className="flex items-center gap-2">
                                                {userData?.imageUrl && <img src={userData.imageUrl} alt="Responder" className="w-6 h-6 rounded-full object-cover border border-red-200" />}
                                                <p className="font-black text-red-600 text-sm">{userData?.name || "Responder Unit"}</p>
                                            </div>
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>
                                        </div>
                                        <div className="h-px bg-gray-100 my-2" />
                                        <div className="space-y-2">
                                            <div><p className="text-[10px] font-bold text-gray-400 uppercase">Role</p><p className="text-[11px] font-semibold text-gray-800">{userData?.role || "responder"}</p></div>
                                            <div><p className="text-[10px] font-bold text-gray-400 uppercase">Street</p><p className="text-[11px] font-semibold text-gray-800">{getResponderStreet(userData)}</p></div>
                                            <div><p className="text-[10px] font-bold text-gray-400 uppercase">Brgy</p><p className="text-[11px] font-semibold text-gray-800">{getResponderBarangay(userData)}</p></div>
                                            <div><p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p><p className="text-[11px] font-semibold text-gray-800">{getResponderPhone(userData)}</p></div>
                                        </div>
                                        <div className="mt-2 py-2 px-2 bg-gray-50 rounded border border-gray-100 flex justify-between items-center gap-2">
                                            <span className="text-[9px] text-gray-400 uppercase font-bold">Last Sync</span>
                                            <span className="text-[10px] font-bold text-emerald-600">{formatLastSeen(userData?.lastLocationUpdate)}</span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {citizenIcon && activeCitizens.map((citizen) => {
                            const isTargetUser = citizen.id === targetCitizenId;

                            return (
                                <Marker key={citizen.id} position={[citizen.lastKnownLat, citizen.lastKnownLon]} icon={citizenIcon}>
                                    <Tooltip
                                        direction="top"
                                        offset={[0, -10]}
                                        opacity={0.95}
                                        permanent={isTargetUser}
                                    >
                                        <span className={`text-[10px] font-bold ${isTargetUser ? 'text-red-600 bg-red-50 px-1 rounded' : 'text-blue-600'}`}>
                                            {getCitizenName(citizen)}
                                        </span>
                                    </Tooltip>
                                    <Popup>
                                        <div className="p-2 min-w-[210px]">
                                            <div className="flex justify-between items-center mb-2 gap-2">
                                                <p className="font-black text-blue-600 text-sm">{getCitizenName(citizen)}</p>
                                                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"></span>
                                            </div>
                                            <div className="h-px bg-gray-100 my-2" />
                                            <div className="space-y-2">
                                                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Role</p><p className="text-[11px] font-semibold text-gray-800">{citizen.role || "citizen"}</p></div>
                                                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Street</p><p className="text-[11px] font-semibold text-gray-800">{getCitizenStreet(citizen)}</p></div>
                                                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Brgy</p><p className="text-[11px] font-semibold text-gray-800">{getCitizenBarangay(citizen)}</p></div>
                                                <div><p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p><p className="text-[11px] font-semibold text-gray-800">{getCitizenPhone(citizen)}</p></div>
                                            </div>
                                            {citizen.speed > 0 && <p className="text-[10px] font-black text-amber-600 mt-2">🚗 Moving (~{(citizen.speed * 3.6).toFixed(1)} km/h)</p>}
                                            <div className="mt-2 py-2 px-2 bg-gray-50 rounded border border-gray-100 flex justify-between items-center gap-2">
                                                <span className="text-[9px] text-gray-400 uppercase font-bold">Last Sync</span>
                                                <span className="text-[10px] font-bold text-emerald-600">{formatLastSeen(citizen.lastLocationUpdate)}</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-[500] bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl border border-gray-100">
                        <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase mb-2 sm:mb-3 tracking-widest border-b pb-1">Live Legend</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-600 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                                    {userData?.imageUrl ? (
                                        <img src={userData.imageUrl} alt="Responder Logo" className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 uppercase">Responder Location</span>
                            </div>
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm ml-0.5 animate-pulse shrink-0"></div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-700 uppercase">Live Citizen</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function RoleMap() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <RoleMapContent />
        </Suspense>
    );
}