import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken as getAppCheckToken,
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js";

const config = window.HABIT_PLANET_FIREBASE_CONFIG;
const appCheckSiteKey = String(window.HABIT_PLANET_APP_CHECK_SITE_KEY || "").trim();
const configured = Boolean(config && config.apiKey && config.projectId && config.authDomain);
let app = null;
let auth = null;
let db = null;
let appCheck = null;
if (configured) {
  app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
  if (appCheckSiteKey) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.warn("Firebase App Check initialization failed", error);
    }
  }
  getRedirectResult(auth).catch((error) => console.warn("Firebase redirect result", error));
}

export const cloudAvailable = configured;
export const appCheckAvailable = Boolean(appCheck);
export const getCurrentUser = () => auth?.currentUser ?? null;

export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function loginGoogle() {
  if (!auth) throw new Error("Firebase is not configured");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    return await signInWithPopup(auth, provider);
  } catch (error) {
    const code = String(error?.code || "");
    if (["auth/popup-blocked", "auth/cancelled-popup-request", "auth/operation-not-supported-in-this-environment"].includes(code)) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw error;
  }
}

export async function logout() {
  if (auth) await signOut(auth);
}

export async function loadState(uid) {
  if (!db || !uid) return null;
  const snap = await getDoc(doc(db, "users", uid, "appState", "habit_planet"));
  if (!snap.exists()) return null;
  return snap.data()?.state ?? null;
}

export async function saveState(uid, state) {
  if (!db || !uid) return;
  await setDoc(
    doc(db, "users", uid, "appState", "habit_planet"),
    { state, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export function watchEntitlement(uid, callback) {
  if (!db || !uid) {
    callback(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, "entitlements", uid),
    (snap) => callback(snap.exists() ? snap.data() : null),
    (error) => {
      console.warn("entitlement watch failed", error);
      callback(null);
    },
  );
}

export async function idToken() {
  if (!auth?.currentUser) throw new Error("Login required");
  return auth.currentUser.getIdToken();
}

export async function appCheckToken() {
  if (!appCheck) return "";
  try {
    return (await getAppCheckToken(appCheck, false)).token || "";
  } catch (error) {
    console.warn("Firebase App Check token failed", error);
    return "";
  }
}
