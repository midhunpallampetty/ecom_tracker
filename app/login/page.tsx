"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type BiometricType = "fingerprint" | "face" | "none" | "checking";
type LoginMode = "biometric" | "password";

const MASTER_PASSWORD = "Foxion.accounts@2026";

export default function LoginPage() {
  const router = useRouter();
  const [biometricType, setBiometricType] = useState<BiometricType>("checking");
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  // Master-password fallback
  const [loginMode, setLoginMode] = useState<LoginMode>("biometric");
  const [masterPwd, setMasterPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const pwdInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const registered = localStorage.getItem("biometric_registered") === "true";
    setIsRegistered(registered);
    detectBiometricType();
  }, []);

  // Auto-switch to password mode if biometrics unavailable
  useEffect(() => {
    if (biometricType === "none") {
      setLoginMode("password");
    }
  }, [biometricType]);

  const detectBiometricType = async () => {
    try {
      if (!window.PublicKeyCredential) {
        setBiometricType("none");
        return;
      }
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setBiometricType("none");
        return;
      }
      const ua = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isMacOS = /mac/.test(ua) && !/(iphone|ipad|ipod)/.test(ua);
      if (isIOS || isMacOS) {
        const isModernIPhone =
          isIOS && parseInt((ua.match(/iphone os (\d+)/) || ["", "0"])[1]) >= 12;
        setBiometricType(isModernIPhone || isMacOS ? "face" : "fingerprint");
      } else {
        setBiometricType("fingerprint");
      }
    } catch {
      setBiometricType("fingerprint");
    }
  };

  /* ─── Biometric login ─── */
  const handleBiometricLogin = async () => {
    if (!isRegistered) {
      setErrorMsg("No biometric registered. Please register first.");
      setStatus("error");
      return;
    }
    setStatus("scanning");
    setErrorMsg("");

    try {
      const credentialId = localStorage.getItem("webauthn_credential_id");
      if (!credentialId) {
        setErrorMsg("No credential found. Please re-register.");
        setStatus("error");
        return;
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credIdBytes = Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: credIdBytes, type: "public-key", transports: ["internal"] }],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (!assertion) {
        setErrorMsg("Authentication cancelled.");
        setStatus("error");
        return;
      }

      const authMethod = biometricType === "face" ? "biometric_face" : "biometric_fingerprint";
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", authMethod }),
      });
      if (!res.ok) throw new Error("Session creation failed");

      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        setErrorMsg("Authentication was cancelled or timed out.");
      } else {
        setErrorMsg("Biometric authentication failed. Try again.");
      }
      setStatus("error");
    }
  };

  /* ─── Master password login ─── */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");

    if (masterPwd !== MASTER_PASSWORD) {
      setPwdError("Incorrect master password.");
      setMasterPwd("");
      pwdInputRef.current?.focus();
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", authMethod: "master_password" }),
      });
      if (!res.ok) throw new Error("Session creation failed");
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 800);
    } catch {
      setPwdError("Something went wrong. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  };

  /* ─── Config ─── */
  const biometricConfig = {
    fingerprint: {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M32 6C17.6 6 6 17.6 6 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M58 32C58 46.4 46.4 58 32 58" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M32 14C21.5 14 13 22.5 13 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M32 14C42.5 14 51 22.5 51 32C51 37.5 48.5 42.4 44.5 45.7" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M24 32C24 27.6 27.6 24 32 24C36.4 24 40 27.6 40 32C40 36.4 36.4 40 32 40C29.5 40 27.2 38.9 25.6 37.2" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M32 24V32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M19 21C19 21 17 26 17 32C17 38 18.5 43.5 21.5 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M32 40C32 40 32 48 28 56" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M45 21C47 24.5 48 28.1 48 32C48 38 46 43.3 42.5 47.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      ),
      label: "Touch to Verify",
      sublabel: "Use your fingerprint sensor",
      gradient: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/30",
      glowColor: "#10b981",
    },
    face: {
      icon: (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="8" y="8" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="3"/>
          <rect x="42" y="8" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="3"/>
          <rect x="8" y="42" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="3"/>
          <rect x="42" y="42" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="3"/>
          <circle cx="25" cy="27" r="3" fill="currentColor"/>
          <circle cx="39" cy="27" r="3" fill="currentColor"/>
          <path d="M23 40C24.5 43 27.5 45 32 45C36.5 45 39.5 43 41 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      ),
      label: "Look to Verify",
      sublabel: "Use Face ID / Face Recognition",
      gradient: "from-violet-400 to-purple-500",
      glow: "shadow-violet-500/30",
      glowColor: "#8b5cf6",
    },
    none: {
      icon: null,
      label: "",
      sublabel: "",
      gradient: "from-slate-400 to-slate-500",
      glow: "",
      glowColor: "#64748b",
    },
    checking: {
      icon: (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
        </div>
      ),
      label: "Detecting…",
      sublabel: "Checking biometric capabilities",
      gradient: "from-slate-400 to-slate-500",
      glow: "",
      glowColor: "#64748b",
    },
  };

  const config = biometricConfig[biometricType];
  const isBiometricAvailable = biometricType !== "none" && biometricType !== "checking";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl transition-all duration-700"
          style={{
            background:
              loginMode === "password"
                ? "radial-gradient(circle, #f59e0b 0%, transparent 70%)"
                : biometricType === "face"
                ? "radial-gradient(circle, #8b5cf6 0%, transparent 70%)"
                : "radial-gradient(circle, #10b981 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-sm mx-auto flex flex-col items-center gap-7 animate-in fade-in slide-in-from-bottom">
        {/* App header */}
        <div className="text-center">
          <div className="text-4xl mb-3">💼</div>
          <h1 className="text-white font-bold text-2xl tracking-tight">My Wallet</h1>
          <p className="text-slate-400 text-sm mt-1">Personal Finance Tracker</p>
        </div>

        {/* ── MODE TOGGLE (only shown if biometrics IS available) ── */}
        {isBiometricAvailable && (
          <div className="flex w-full bg-slate-900 border border-slate-800 rounded-2xl p-1.5 gap-1.5">
            <button
              id="tab-biometric"
              onClick={() => { setLoginMode("biometric"); setStatus("idle"); setErrorMsg(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                loginMode === "biometric"
                  ? biometricType === "face"
                    ? "bg-violet-500 text-white shadow-sm"
                    : "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{biometricType === "face" ? "🫦" : "👆"}</span>
              <span>{biometricType === "face" ? "Face ID" : "Fingerprint"}</span>
            </button>
            <button
              id="tab-password"
              onClick={() => { setLoginMode("password"); setStatus("idle"); setPwdError(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                loginMode === "password"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🔑</span>
              <span>Password</span>
            </button>
          </div>
        )}

        {/* ══════════════════════════════════
            BIOMETRIC PANEL
        ══════════════════════════════════ */}
        {loginMode === "biometric" && isBiometricAvailable && (
          <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative">
              {/* Pulse rings — scanning */}
              {status === "scanning" && (
                <>
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient} opacity-20 animate-ping`}
                    style={{ transform: "scale(1.5)" }}
                  />
                  <div
                    className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 animate-ping`}
                    style={{ animationDelay: "0.3s", transform: "scale(1.8)" }}
                  />
                </>
              )}
              {/* Success ring */}
              {status === "success" && (
                <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-30 scale-150 animate-ping" />
              )}

              {/* Main circle button */}
              <button
                id="biometric-login-btn"
                onClick={handleBiometricLogin}
                disabled={status === "scanning" || status === "success"}
                className={`
                  relative w-36 h-36 rounded-full flex items-center justify-center
                  bg-slate-900 border-2 transition-all duration-300 cursor-pointer
                  ${status === "success" ? "border-emerald-400 shadow-lg shadow-emerald-500/40" : ""}
                  ${status === "error"   ? "border-rose-500 shadow-lg shadow-rose-500/30" : ""}
                  ${status === "idle"    ? `border-slate-700 hover:border-slate-500 active:scale-95 shadow-xl ${config.glow}` : ""}
                  ${status === "scanning"? `border-slate-600 shadow-xl ${config.glow}` : ""}
                `}
              >
                <div
                  className={`
                    w-16 h-16 transition-all duration-300
                    ${status === "success" ? "text-emerald-400 scale-110" : ""}
                    ${status === "error"   ? "text-rose-400" : ""}
                    ${status === "idle" || status === "scanning" ? "text-slate-300" : ""}
                  `}
                  style={
                    status === "scanning"
                      ? { filter: `drop-shadow(0 0 8px ${config.glowColor})` }
                      : {}
                  }
                >
                  {status === "success" ? (
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3"/>
                      <path d="M20 32L28 40L44 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    config.icon
                  )}
                </div>

                {/* Spinning sweep overlay when scanning */}
                {status === "scanning" && (
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden"
                    style={{
                      background: `conic-gradient(from 0deg, transparent 70%, ${config.glowColor}40 100%)`,
                      animation: "spin 1.5s linear infinite",
                    }}
                  />
                )}
              </button>
            </div>

            {/* Status text */}
            <div className="text-center space-y-1.5">
              {status === "success" ? (
                <>
                  <p className="text-emerald-400 font-semibold text-lg">Verified! ✓</p>
                  <p className="text-slate-400 text-sm">Redirecting to dashboard…</p>
                </>
              ) : status === "error" ? (
                <>
                  <p className="text-rose-400 font-semibold text-base">{errorMsg}</p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="text-slate-400 text-sm underline underline-offset-2"
                  >
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <p className="text-white font-semibold text-base">{config.label}</p>
                  <p className="text-slate-400 text-sm">{config.sublabel}</p>
                </>
              )}
            </div>

            {/* Not-registered warning */}
            {!isRegistered && (
              <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
                <p className="text-amber-400 text-sm font-medium">No biometric registered yet</p>
                <p className="text-amber-400/70 text-xs mt-1">Register your device before logging in</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            MASTER PASSWORD PANEL
        ══════════════════════════════════ */}
        {loginMode === "password" && (
          <div className="w-full animate-in fade-in slide-in-from-bottom">
            {/* No-biometrics badge */}
            {biometricType === "none" && (
              <div className="flex items-center gap-2.5 bg-slate-800/60 border border-slate-700 rounded-2xl px-4 py-3 mb-5">
                <span className="text-xl">🖥️</span>
                <div>
                  <p className="text-slate-200 text-sm font-medium">Biometrics not available</p>
                  <p className="text-slate-500 text-xs">Using master password instead</p>
                </div>
              </div>
            )}

            {status === "success" ? (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-emerald-400">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3"/>
                    <path d="M20 32L28 40L44 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-emerald-400 font-bold text-lg">Verified! ✓</p>
                <p className="text-slate-400 text-sm mt-1">Redirecting to dashboard…</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                    🔑
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-base">Master Password</h2>
                    <p className="text-slate-400 text-xs">Enter your secure access password</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="relative">
                    <input
                      ref={pwdInputRef}
                      id="master-password-input"
                      type={showPwd ? "text" : "password"}
                      value={masterPwd}
                      onChange={(e) => { setMasterPwd(e.target.value); setPwdError(""); }}
                      placeholder="Enter master password"
                      autoComplete="current-password"
                      autoFocus
                      className={`
                        w-full bg-slate-800 border rounded-xl px-4 py-3.5 pr-12
                        text-white placeholder-slate-500 text-base outline-none
                        transition-all duration-200 tracking-wide
                        ${pwdError
                          ? "border-rose-500 focus:border-rose-400"
                          : "border-slate-700 focus:border-amber-500"
                        }
                      `}
                    />
                    {/* Show/hide toggle */}
                    <button
                      type="button"
                      id="toggle-password-visibility"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPwd ? (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12a10.94 10.94 0 0 1 2.06-3.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.61 11 8a10.79 10.79 0 0 1-1.67 2.94" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                          <path d="M1 12C2.73 7.61 7 4 12 4s9.27 3.61 11 8c-1.73 4.39-6 8-11 8S2.73 16.39 1 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {pwdError && (
                    <div className="flex items-center gap-2 text-rose-400 text-sm">
                      <span>⚠</span>
                      <span>{pwdError}</span>
                    </div>
                  )}

                  <button
                    id="master-password-submit"
                    type="submit"
                    disabled={!masterPwd || pwdLoading}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    {pwdLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4"/>
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      "Sign In →"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Checking state placeholder ── */}
        {biometricType === "checking" && loginMode === "biometric" && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-36 h-36 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
            </div>
            <p className="text-slate-500 text-sm">Detecting capabilities…</p>
          </div>
        )}

        {/* Register link */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            First time here?{" "}
            <a
              href="/register"
              id="go-to-register"
              className="text-slate-300 font-semibold underline underline-offset-2 hover:text-white transition-colors"
            >
              Register Device
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
