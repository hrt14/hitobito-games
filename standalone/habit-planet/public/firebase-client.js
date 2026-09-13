const config = window.HABIT_PLANET_FIREBASE_CONFIG;
const configured = Boolean(config && config.apiKey && config.projectId && config.authDomain);
const returningFromCheckout = new URLSearchParams(location.search).get("pro") === "success";

let auth = null;
let GoogleAuthProvider = null;
let onAuthStateChanged = null;
let signInWithPopup = null;
let signInWithRedirect = null;
let signOut = null;

if (configured) {
  try {
    const [{ initializeApp }, authModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js"),
    ]);
    const app = initializeApp(config);
    auth = authModule.getAuth(app);
    GoogleAuthProvider = authModule.GoogleAuthProvider;
    onAuthStateChanged = authModule.onAuthStateChanged;
    signInWithPopup = authModule.signInWithPopup;
    signInWithRedirect = authModule.signInWithRedirect;
    signOut = authModule.signOut;
    authModule.getRedirectResult(auth).catch((error) => console.warn("Firebase redirect result", error));
  } catch (error) {
    // The Habit Planet UI must still boot in LocalStorage mode when offline or when
    // Google's CDN is temporarily unavailable. Reloading after connectivity returns
    // re-enables Firebase Authentication.
    console.warn("Firebase Auth unavailable; using local mode", error);
    auth = null;
  }
}

export const cloudAvailable = Boolean(auth);
export const getCurrentUser = () => auth?.currentUser ?? null;

export function watchAuth(callback) {
  if (!auth || !onAuthStateChanged) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function loginGoogle() {
  if (!auth || !GoogleAuthProvider) throw new Error("Firebase Auth is not available");
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
  if (auth && signOut) await signOut(auth);
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
  let checkoutTimer = null;
  let checkoutPollsRemaining = returningFromCheckout ? 15 : 0;
  let inFlight = false;

  const stopCheckoutPolling = () => {
    checkoutPollsRemaining = 0;
    if (checkoutTimer) clearInterval(checkoutTimer);
    checkoutTimer = null;
  };

  const refresh = async () => {
    if (stopped || inFlight || !auth?.currentUser || auth.currentUser.uid !== uid) return;
    inFlight = true;
    try {
      const body = await apiJson("/api/entitlement", { method: "GET" });
      const value = body?.entitlement ?? null;
      if (!stopped) callback(value);
      if (["active", "trialing"].includes(String(value?.status || ""))) stopCheckoutPolling();
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

  // Normal operation is deliberately sparse to conserve account-level D1 row reads.
  timer = setInterval(refresh, 60_000);

  // A successful Stripe return gets a short, bounded fast-poll window so Pro unlocks
  // promptly without making every signed-in client poll D1 every few seconds forever.
  if (checkoutPollsRemaining > 0) {
    checkoutTimer = setInterval(() => {
      if (--checkoutPollsRemaining < 0) return stopCheckoutPolling();
      refresh();
    }, 2_000);
  }

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    stopCheckoutPolling();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

// Compatibility no-op. Cloudflare API access is protected by Firebase ID Token
// verification; Firestore/App Check is not used by the Cloudflare edition.
export async function appCheckToken() {
  return "";
}
