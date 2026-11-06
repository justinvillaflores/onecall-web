"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/Sidebar";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), {
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center bg-gray-100 text-xs sm:text-sm text-gray-500">Loading city map...</div>
});
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Tooltip = dynamic(() => import("react-leaflet").then((m) => m.Tooltip), { ssr: false });

const CENTER = [14.8348, 120.2827];
const MAP_STYLE = { height: "100%", width: "100%", zIndex: 1 };

function getLeafletIcons() {
    const L = require("leaflet");
    const userIcon = L.divIcon({
        className: "custom-user-marker",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
        html: `<div style="position:relative;width:34px;height:34px;display:grid;place-items:center"><span style="position:absolute;inset:0;border-radius:50%;background:#2563eb;opacity:.3;animation:pulse 1.5s infinite"></span><div style="width:28px;height:28px;border:2.5px solid white;border-radius:50%;background:#2563eb;display:grid;place-items:center;box-shadow:0 3px 10px #2563eb80"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div></div>`
    });

    return {
        userIcon,
        responderIcon: (imageUrl) => L.divIcon({
            className: "custom-responder-logo-marker",
            iconSize: [44, 44],
            iconAnchor: [22, 22],
            popupAnchor: [0, -22],
            html: `<div style="position:relative;width:44px;height:44px;display:grid;place-items:center"><span style="position:absolute;inset:0;border-radius:50%;background:#ef4444;opacity:.35;animation:pulse 1.2s infinite"></span><div style="position:relative;width:36px;height:36px;overflow:hidden;border:3px solid white;border-radius:50%;background:#dc2626;display:grid;place-items:center;box-shadow:0 4px 12px #dc262699">${imageUrl ? `<img src="${String(imageUrl).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}" alt="Responder logo" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>` : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`}</div></div>`
        })
    };
}

function validAddress(value) {
    if (typeof value !== "string") return "";

    const text = value.trim();
    if (
        !text ||
        /^(unknown(?:\s+(?:street|road|barangay|address))?|unnamed(?:\s+(?:street|road|barangay|address))?|n\/?a|n\.a\.|not available|address unavailable|barangay unavailable|none|null|undefined|-)$/i.test(text) ||
        /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,}$/i.test(text)
    ) {
        return "";
    }

    return text;
}

const getProfileAddressParts = (unit) => {
    const address = unit?.address || unit?.profile?.address || unit?.homeAddress || "";
    if (!validAddress(address)) return { street: "", barangay: "" };

    const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
    let street = parts[0] || "";
    let barangay = "";

    const explicitBarangay = address.match(/\b(?:brgy\.?|barangay)\s+([^,]+)/i);
    if (explicitBarangay) barangay = explicitBarangay[1].trim();
    else if (parts.length > 1) barangay = parts[1];

    if (/^(olongapo city|philippines)$/i.test(street)) street = "";
    if (/^(olongapo city|philippines)$/i.test(barangay)) barangay = "";

    return {
        street: validAddress(street) ? street : "",
        barangay: validAddress(barangay) ? barangay : ""
    };
};

function getStreet(unit) {
    const profileParts = getProfileAddressParts(unit);

    return (
        validAddress(unit.street) ||
        validAddress(unit.lastKnownStreet) ||
        validAddress(unit.streetName) ||
        validAddress(unit.addressStreet) ||
        validAddress(unit.profile?.street) ||
        profileParts.street ||
        "Address unavailable"
    );
}

function getBarangay(unit) {
    const profileParts = getProfileAddressParts(unit);

    return (
        validAddress(unit.barangay) ||
        validAddress(unit.lastKnownBarangay) ||
        validAddress(unit.barangayName) ||
        validAddress(unit.profile?.barangay) ||
        profileParts.barangay ||
        "Barangay unavailable"
    );
}

function lastSync(value) {
    try {
        const date = value?.toDate
            ? value.toDate()
            : value instanceof Date
                ? value
                : null;

        if (!date || Number.isNaN(date.getTime())) return "Unavailable";
        return formatDistanceToNow(date, { addSuffix: true });
    } catch {
        return "Unavailable";
    }
}

function InfoRow({ label, children }) {
    return (
        <div className="flex items-start gap-2">
            <span className="mt-0.5 w-12 shrink-0 text-[9px] font-black uppercase text-gray-400">{label}:</span>
            <div className="min-w-0 flex-1 break-words text-[11px] font-bold text-slate-700">{children}</div>
        </div>
    );
}

export default function AdminLocationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [icons, setIcons] = useState(null);
    const [units, setUnits] = useState([]);
    const [mapError, setMapError] = useState("");

    useEffect(() => {
        setIsMounted(true);
        let styleSheet;

        try {
            setIcons(getLeafletIcons());
            styleSheet = document.createElement("style");
            styleSheet.textContent = `
                .custom-user-marker,.custom-responder-logo-marker{background:transparent!important;border:0!important;transition:transform .8s linear!important}
                @keyframes pulse{0%{transform:scale(.85);opacity:.45}70%{transform:scale(1.2);opacity:.1}100%{transform:scale(1.3);opacity:0}}
            `;
            document.head.appendChild(styleSheet);
        } catch (error) {
            console.error("Map icon initialization error:", error);
            setMapError("Unable to initialize map markers.");
        }

        return () => {
            if (styleSheet?.parentNode) styleSheet.parentNode.removeChild(styleSheet);
        };
    }, []);

    useEffect(() => {
        let unsubscribeUsers = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (!user) {
                unsubscribeUsers();
                setLoading(false);
                router.replace("/login");
                return;
            }

            unsubscribeUsers = () => {};

            unsubscribeUsers = onSnapshot(
                collection(db, "users"),
                (snapshot) => {
                    const list = [];

                    snapshot.forEach((userDoc) => {
                        const data = userDoc.data();
                        const lat = data.lastKnownLat;
                        const lon = data.lastKnownLon;

                        if (
                            typeof lat === "number" &&
                            Number.isFinite(lat) &&
                            lat >= -90 &&
                            lat <= 90 &&
                            typeof lon === "number" &&
                            Number.isFinite(lon) &&
                            lon >= -180 &&
                            lon <= 180
                        ) {
                            list.push({
                                id: userDoc.id,
                                ...data
                            });
                        }
                    });

                    setUnits(list);
                    setLoading(false);
                    setMapError("");
                },
                (error) => {
                    console.error("Firestore location listener error:", error);
                    setMapError("Unable to load live locations. Check your connection and Firestore permissions.");
                    setLoading(false);
                }
            );
        });

        return () => {
            unsubscribeAuth();
            unsubscribeUsers();
        };
    }, [router]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.replace("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    if (!isMounted || loading || !icons) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F1F3F9]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F5F6FA]">
            <Sidebar handleLogout={handleLogout} />

            <main className="ml-0 lg:ml-[270px] flex h-screen min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-6 pt-20 lg:pt-6 transition-all duration-300 w-full">
                <header className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 rounded-xl border border-gray-100 bg-white p-3.5 sm:px-8 sm:py-4 shadow-sm">
                    <div>
                        <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-800">City-Wide Live Monitoring</h1>
                        <p className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5 sm:mt-0">
                            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                            Olongapo City Real-Time Fleet & Active Users
                        </p>
                    </div>
                    <div className="flex sm:block items-center justify-between border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0 sm:text-right">
                        <p className="text-[10px] sm:text-xs font-bold uppercase text-gray-500">Units on Map</p>
                        <p className="text-lg sm:text-xl font-black leading-none text-blue-600">{units.length}</p>
                    </div>
                </header>

                {mapError && (
                    <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 sm:p-3 text-xs sm:text-sm text-amber-800">
                        {mapError}
                    </div>
                )}

                <section className="relative min-h-0 flex-1 overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 bg-white shadow-md">
                    <MapContainer center={CENTER} zoom={14} style={MAP_STYLE}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {units.map((unit) => {
                            const isResponder = unit.role === "responder";
                            const title = isResponder
                                ? unit.name || unit.username || "Unknown Responder"
                                : unit.username || unit.fullName || unit.fullname || unit.name || "Unknown Citizen";
                            const markerIcon = isResponder ? icons.responderIcon(unit.imageUrl) : icons.userIcon;

                            return (
                                <Marker
                                    key={unit.id}
                                    position={[unit.lastKnownLat, unit.lastKnownLon]}
                                    icon={markerIcon}
                                    zIndexOffset={isResponder ? 1000 : 0}
                                >
                                    <Tooltip direction="top" offset={[0, isResponder ? -18 : -12]} opacity={0.95}>
                                        <span className={isResponder ? "font-bold text-red-600" : "font-bold text-blue-600"}>
                                            {title}
                                        </span>
                                    </Tooltip>

                                    <Popup>
                                        <div className="min-w-[200px] sm:min-w-[220px] space-y-2 p-1.5 sm:p-2 font-sans">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    {isResponder && unit.imageUrl && (
                                                        <img src={unit.imageUrl} alt="Responder logo" className="h-7 w-7 rounded-full border border-red-200 object-cover shrink-0" />
                                                    )}
                                                    <p className={`break-words text-xs sm:text-sm font-black uppercase ${isResponder ? "text-red-600" : "text-blue-600"}`}>
                                                        {title}
                                                    </p>
                                                </div>
                                                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                                            </div>

                                            <div className="h-px bg-gray-100" />
                                            <InfoRow label="Role">{unit.role || "Citizen"}</InfoRow>
                                            <InfoRow label="Street">{getStreet(unit)}</InfoRow>
                                            <InfoRow label="Brgy">{getBarangay(unit)}</InfoRow>
                                            <InfoRow label="Phone">{unit.phoneNumber || unit.contactNumber || unit.phone || "No contact"}</InfoRow>

                                            {Number.isFinite(unit.speed) && unit.speed > 0 && (
                                                <InfoRow label="Speed">
                                                    <span className="text-amber-600">{(unit.speed * 3.6).toFixed(1)} km/h</span>
                                                </InfoRow>
                                            )}

                                            <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                                                <span className="text-[8px] font-black uppercase tracking-wider text-gray-400">Last Sync</span>
                                                <span className="text-[10px] font-bold text-emerald-600">{lastSync(unit.lastLocationUpdate)}</span>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>

                    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-[1000] rounded-xl sm:rounded-2xl border border-gray-100 bg-white/95 p-3 sm:p-4 shadow-xl backdrop-blur-sm">
                        <p className="mb-2 sm:mb-3 border-b pb-1 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400">Live Fleet Legend</p>
                        <div className="space-y-2 sm:space-y-3">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <span className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 rounded-full border-2 border-white bg-red-600 shadow-sm" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-700">Emergency Responders</span>
                            </div>
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 rounded-full border-2 border-white bg-blue-600 shadow-sm" />
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-700">Citizens / Users</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}