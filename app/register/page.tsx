"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const REGISTRATION_PASSWORD = "New@2026";

type Step = "password" | "biometric" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [biometricStatus, setBiometricStatus] = useState<"idle" | "registering" | "error">("idle");
  const [biometricError, setBiometricError] = useState("");
  const [skipLoading, setSkipLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== REGISTRATION_PASSWORD) {
      setPasswordError("Incorrect registration password.");
      setPassword("");
      inputRef.current?.focus();
      return;
    }
    setPasswordError("");
    setStep("biometric");
  };

  /* ── Create server session helper ── */
  const createSession = async () => {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    if (!res.ok) throw new Error("Session creation failed.");
  };

  /* ── Biometric registration ── */
  const handleBiometricRegister = async () => {
    setBiometricStatus("registering");
    setBiometricError("");

    try {
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported on this device/browser.");
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        throw new Error("No biometric authenticator found on this device.");
      }

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "My Wallet",
            // Use only the root domain to avoid subdomain mismatch issues
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: "wallet_user",
            displayName: "Wallet Owner",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },   // ES256 (preferred)
            { alg: -257, type: "public-key" },  // RS256 (fallback)
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            // "preferred" is far more compatible than "required" on Android
            userVerification: "preferred",
            // "discouraged" avoids Android Credential Manager conflicts
            residentKey: "discouraged",
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: "none",
        },
      });

      if (!credential || !(credential instanceof PublicKeyCredential)) {
        throw new Error("Registration failed — no credential returned.");
      }

      const rawId = credential.rawId;
      const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(rawId)));
      localStorage.setItem("webauthn_credential_id", credentialIdBase64);
      localStorage.setItem("biometric_registered", "true");

      await createSession();

      setBiometricStatus("idle");
      setStep("success");
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err: unknown) {
      setBiometricStatus("error");
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setBiometricError("Registration was cancelled. Please try again.");
        } else if (
          err.name === "UnknownError" ||
          err.message?.toLowerCase().includes("credential manager") ||
          err.message?.toLowerCase().includes("unknown error")
        ) {
          // Android Credential Manager specific error
          setBiometricError(
            "Your device's credential manager couldn't complete the request. " +
            "Make sure you have a screen lock (PIN / pattern / fingerprint) set up, then try again. " +
            "Or skip this step and use the master password to log in."
          );
        } else if (err.message?.includes("not supported") || err.message?.includes("No biometric")) {
          setBiometricError(err.message + " You can skip this and use the master password instead.");
        } else {
          setBiometricError(err.message || "Biometric registration failed.");
        }
      } else {
        setBiometricError("Biometric registration failed. You can skip this step and use the master password instead.");
      }
    }
  };

  /* ── Skip biometric — use master password only ── */
  const handleSkipBiometric = async () => {
    setSkipLoading(true);
    try {
      // Mark as not using biometrics; master password will work on login page
      localStorage.removeItem("webauthn_credential_id");
      localStorage.removeItem("biometric_registered");
      await createSession();
      setStep("success");
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch {
      setBiometricError("Something went wrong. Please try again.");
    } finally {
      setSkipLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-white font-bold text-2xl tracking-tight">Register Device</h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Set up biometric login for My Wallet
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10 px-4">
          {(["password", "biometric", "success"] as Step[]).map((s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${step === s ? "bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30" : ""}
                  ${
                    (step === "biometric" && s === "password") ||
                    (step === "success" && (s === "password" || s === "biometric"))
                      ? "bg-emerald-500 text-white"
                      : step !== s
                      ? "bg-slate-800 text-slate-500"
                      : ""
                  }
                `}
              >
                {(step === "biometric" && s === "password") ||
                (step === "success" && (s === "password" || s === "biometric")) ? (
                  "✓"
                ) : (
                  idx + 1
                )}
              </div>
              {idx < 2 && (
                <div
                  className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-500 ${
                    (step === "biometric" && s === "password") || step === "success"
                      ? "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Password ── */}
        {step === "password" && (
          <div className="animate-in fade-in slide-in-from-bottom">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl">
              <h2 className="text-white font-semibold text-lg mb-1.5">Enter Registration Code</h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter the registration password to proceed. This is a one-time step.
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="registration-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    placeholder="Registration password"
                    autoComplete="off"
                    autoFocus
                    className={`
                      w-full bg-slate-800 border rounded-xl px-4 py-3.5 text-white placeholder-slate-500
                      text-base outline-none transition-all duration-200 tracking-widest
                      ${passwordError
                        ? "border-rose-500 focus:border-rose-400"
                        : "border-slate-700 focus:border-indigo-500"
                      }
                    `}
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-rose-400 text-sm">
                    <span>⚠</span>
                    <span>{passwordError}</span>
                  </div>
                )}

                <button
                  id="verify-password-btn"
                  type="submit"
                  disabled={!password}
                  className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] text-white font-semibold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                  Continue →
                </button>
              </form>
            </div>

            <div className="text-center mt-6">
              <p className="text-slate-500 text-sm">
                Already registered?{" "}
                <a
                  href="/login"
                  id="go-to-login"
                  className="text-slate-300 font-semibold underline underline-offset-2 hover:text-white transition-colors"
                >
                  Log in
                </a>
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: Biometric Registration ── */}
        {step === "biometric" && (
          <div className="animate-in fade-in slide-in-from-bottom space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl text-center">
              <h2 className="text-white font-semibold text-lg mb-1.5">Register Biometric</h2>
              <p className="text-slate-400 text-sm mb-7">
                Your fingerprint or face will be used to log in securely. No biometric data leaves your device.
              </p>

              {/* Biometric icons side-by-side */}
              <div className="flex justify-center gap-6 mb-7">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                      <path d="M20 4C11.2 4 4 11.2 4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M36 20C36 28.8 28.8 36 20 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 9C13.4 9 8 14.4 8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 9C26.6 9 32 14.4 32 20C32 23.4 30.4 26.5 27.8 28.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M15 20C15 17.2 17.2 15 20 15C22.8 15 25 17.2 25 20C25 22.8 22.8 25 20 25C18.4 25 17 24.3 16 23.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-slate-400 text-xs">Fingerprint</span>
                </div>

                <div className="flex items-center text-slate-600 text-xl font-light">or</div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                      <rect x="4" y="4" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <rect x="27" y="4" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <rect x="4" y="27" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <rect x="27" y="27" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="15.5" cy="17" r="2" fill="currentColor"/>
                      <circle cx="24.5" cy="17" r="2" fill="currentColor"/>
                      <path d="M14 25C14.8 27 17 28.5 20 28.5C23 28.5 25.2 27 26 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-slate-400 text-xs">Face ID</span>
                </div>
              </div>

              {/* Error block with better messaging */}
              {biometricStatus === "error" && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-5 text-left">
                  <div className="flex items-start gap-2.5">
                    <span className="text-rose-400 text-base mt-0.5 shrink-0">⚠</span>
                    <p className="text-rose-300 text-sm leading-relaxed">{biometricError}</p>
                  </div>
                </div>
              )}

              {/* Primary: Register biometric */}
              <button
                id="register-biometric-btn"
                onClick={handleBiometricRegister}
                disabled={biometricStatus === "registering" || skipLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 active:scale-[0.98] text-white font-semibold text-base transition-all duration-200 shadow-xl shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {biometricStatus === "registering" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                    Waiting for biometric…
                  </span>
                ) : (
                  "Register Fingerprint / Face"
                )}
              </button>

              <p className="text-slate-500 text-xs mt-3">
                🔒 Biometric data stays on your device. We only store a reference ID.
              </p>
            </div>

            {/* Skip option — always visible, prominent after an error */}
            <div
              className={`bg-slate-900/60 border rounded-2xl p-5 transition-all duration-300 ${
                biometricStatus === "error"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-slate-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🔑</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium">
                    Skip biometric &amp; use master password
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    If biometrics won&apos;t work on your device, you can log in with the master password instead.
                  </p>
                </div>
              </div>
              <button
                id="skip-biometric-btn"
                onClick={handleSkipBiometric}
                disabled={skipLoading || biometricStatus === "registering"}
                className="w-full mt-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {skipLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    </svg>
                    Setting up…
                  </>
                ) : (
                  "Skip — Use Master Password"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && (
          <div className="animate-in fade-in scale-in text-center">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-5">
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-emerald-400">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3"/>
                  <path d="M20 32L28 40L44 24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-white font-bold text-xl mb-2">You&apos;re all set! 🎉</h2>
              <p className="text-slate-400 text-sm">
                Device registered successfully. Redirecting to your dashboard…
              </p>
              <div className="mt-6 flex justify-center">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
