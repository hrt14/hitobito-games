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

const config = window.HABIT_PLANET_FIREBASE_CONFIG;
const configured = Boolean(config && config.apiKey && config.projectId && config.authDomain);
let app = null;
let auth = null;
if (configured) {
  app = initializeApp(config);
  auth = getAuth(app);
  getRedirectResult(auth).catch((error) => console.warn("Firebase redirect result", error));
}

export const cloudAvailable = configured;
export const getCurrentUser = () => auth?.currentUser ?? null;

export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function loginGoogle() {
  if (!auth) throw new Error("Firebase Auth is not configured");
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

export async function idToken(forceRefresh = false) {
  if (!auth?.currentUser) throw new Error("Login required");
  return auth.currentUser.getIdToken(forceRefresh);
}

async function api(path, init = {}) {
  const token = await idToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json; charset=utf-8");
  let response = await fetch(path, { ...init, headers });

  // A freshly rotated Firebase signing key/token can briefly fail verification.
  // Refresh once before surfacing a login error to the UI.
  if (response.status === 401 && auth?.currentUser) {
    const freshToken = await idToken(true);
    headers.set("Authorization", `Bearer ${freshToken}`);
    response = await fetch(path, { ...init, headers });
  }
  return response;
}

async function apiJson(path, init = {}) {
  const response = await api(path, init);
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) throw new Error(body?.error || `API error ${response.status}`);
  return body;
}

export async function loadState(uid) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid) return null;
  const body = await apiJson("/api/state", { method: "GET" });
  return body?.state ?? null;
}

export async function saveState(uid, state) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid) return;
  await apiJson("/api/state", {
    method: "PUT",
    body: JSON.stringify({ state }),
  });
}

export function watchEntitlement(uid, callback) {
  if (!auth?.currentUser || auth.currentUser.uid !== uid) {
    callback(null);
    return () => {};
  }

  let stopped = false;
  let timer = null;
  let inFlight = false;

  const refresh = async () => {
    if (stopped || inFlight || !auth?.currentUser || auth.currentUser.uid !== uid) return;
    inFlight = true;
    try {
      const body = await apiJson("/api/entitlement", { method: "GET" });
      if (!stopped) callback(body?.entitlement ?? null);
    } catch (error) {
      console.warn("entitlement watch failed", error);
      if (!stopped) callback(null);
    } finally {
      inFlight = false;
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") refresh();
  };
  document.addEventListener("visibilitychange", onVisibility);
  refresh();
  timer = setInterval(refresh, 15000);

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

// Kept as a compatibility no-op for older app-entry code. Cloudflare API access is
// protected by Firebase ID Token verification; Firestore/App Check is not used.
export async function appCheckToken() {
  return "";
}
