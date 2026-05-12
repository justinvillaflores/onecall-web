    import { initializeApp, getApps, getApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";
    import { getStorage } from "firebase/storage";

    const firebaseConfig = {
        apiKey: "AIzaSyDtWsIszmQI_cRCFnD29a_jb72VDGchbwE",
        authDomain: "onecall-d0bf8.firebaseapp.com",
        projectId: "onecall-d0bf8",
        storageBucket: "onecall-d0bf8.firebasestorage.app",
        messagingSenderId: "851267786422",
        appId: "1:851267786422:web:5a5ab917cd5757e8bcf817",
        measurementId: "G-2QX38MF8F5"
    };

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    export const auth = getAuth(app);
    export const db = getFirestore(app);
    export const storage = getStorage(app);