"use client";

import { useState, useEffect, useCallback } from "react";
import SessionHeatmap, { HeatmapLocation } from "./SessionHeatmap";

export interface UserSessionItem {
  _id: string;
  sessionId: string;
  ipAddress: string;
  userLocation: {
    city: string;
    region: string;
    country: string;
    countryCode: string;
    latitude: number;
    longitude: number;
    isp?: string;
  };
  deviceInfo: {
    deviceType: "desktop" | "phone" | "tablet" | "other";
    os: string;
    browser: string;
    rawUserAgent: string;
  };
  authMethod: "biometric_fingerprint" | "biometric_face" | "master_password" | "unknown";
  status: "active" | "revoked" | "expired";
  lastActiveAt: string;
  loginAt: string;
}

export interface DeviceStats {
  desktop: number;
  phone: number;
  tablet: number;
  other: number;
  total: number;
  desktopPercent: number;
  phonePercent: number;
  tabletPercent: number;
}

export default function UserSessionManager() {
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [activeSessions, setActiveSessions] = useState<UserSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({
    desktop: 0,
    phone: 0,
    tablet: 0,
    other: 0,
    total: 0,
    desktopPercent: 0,
    phonePercent: 0,
    tabletPercent: 0,
  });
  const [locationHeatmap, setLocationHeatmap] = useState<HeatmapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchSessionData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.history || []);
        setActiveSessions(data.activeSessions || []);
        setCurrentSessionId(data.currentSessionId || "");
        if (data.deviceStats) setDeviceStats(data.deviceStats);
        if (data.locationHeatmap) setLocationHeatmap(data.locationHeatmap);
      }
    } catch (err) {
      console.error("Failed to load session history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Handle single session revocation
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        // If revoking current session, redirect to login
        if (sessionId === currentSessionId) {
          window.location.href = "/login";
          return;
        }
        await fetchSessionData();
      }
    } catch (err) {
      console.error("Error revoking session:", err);
    } finally {
      setRevokingId(null);
    }
  };

  // Handle revoke all other active sessions
  const handleRevokeAllOthers = async () => {
    if (!confirm("Are you sure you want to terminate all other active device sessions?")) {
      return;
    }
    setRevokeAllLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeAllOthers: true }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessionData();
      }
    } catch (err) {
      console.error("Error revoking sessions:", err);
    } finally {
      setRevokeAllLoading(false);
    }
  };

  // Filtered session history list
  const filteredHistory = sessions.filter((session) => {
    const matchesSearch =
      searchQuery === "" ||
      session.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.userLocation?.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.userLocation?.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.deviceInfo?.os.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.deviceInfo?.browser.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDevice =
      filterDevice === "all" || session.deviceInfo?.deviceType === filterDevice;

    const matchesStatus =
      filterStatus === "all" || session.status === filterStatus;

    return matchesSearch && matchesDevice && matchesStatus;
  });

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "phone":
        return "📱";
      case "tablet":
        return "📱";
      case "desktop":
      default:
        return "💻";
    }
  };

  const getAuthBadge = (authMethod: string) => {
    switch (authMethod) {
      case "biometric_fingerprint":
        return { label: "Fingerprint", icon: "👆", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "biometric_face":
        return { label: "Face ID", icon: "🫦", color: "bg-violet-500/20 text-violet-300 border-violet-500/30" };
      case "master_password":
      default:
        return { label: "Password", icon: "🔑", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
      {/* ══════════════════════════════════════════════════════════════════
          1. DEVICE TYPE BREAKDOWN STAT CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-extrabold text-lg tracking-tight flex items-center gap-2">
              <span>🖥️</span> Device Usage & Security Overview
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Breakdown of access points across Desktop, Phone, and Tablet devices
            </p>
          </div>
          <button
            onClick={fetchSessionData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>Refresh Audit Log</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Desktop Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">
                💻
              </div>
              <span className="text-cyan-400 font-extrabold text-xl">
                {deviceStats.desktopPercent}%
              </span>
            </div>
            <p className="text-white font-bold text-base">Desktop Devices</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {deviceStats.desktop} of {deviceStats.total} total logins
            </p>
            {/* Visual Progress Line */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#06b6d4]"
                style={{ width: `${deviceStats.desktopPercent}%` }}
              />
            </div>
          </div>

          {/* Phone / Mobile Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-violet-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xl">
                📱
              </div>
              <span className="text-violet-400 font-extrabold text-xl">
                {deviceStats.phonePercent}%
              </span>
            </div>
            <p className="text-white font-bold text-base">Mobile Phones</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {deviceStats.phone} of {deviceStats.total} total logins
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-violet-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#8b5cf6]"
                style={{ width: `${deviceStats.phonePercent}%` }}
              />
            </div>
          </div>

          {/* Tablet Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">
                📱
              </div>
              <span className="text-emerald-400 font-extrabold text-xl">
                {deviceStats.tabletPercent}%
              </span>
            </div>
            <p className="text-white font-bold text-base">Tablet Devices</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {deviceStats.tablet} of {deviceStats.total} total logins
            </p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#10b981]"
                style={{ width: `${deviceStats.tabletPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. GEOLOCATION HEATMAP COMPONENT
      ══════════════════════════════════════════════════════════════════ */}
      <SessionHeatmap locations={locationHeatmap} loading={loading} />

      {/* ══════════════════════════════════════════════════════════════════
          3. ACTIVE SESSIONS MANAGER
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🔐</span>
              <h3 className="text-white font-extrabold text-lg tracking-tight">
                Active User Sessions
              </h3>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Currently logged-in devices with active session tokens
            </p>
          </div>

          {activeSessions.length > 1 && (
            <button
              onClick={handleRevokeAllOthers}
              disabled={revokeAllLoading}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 self-start sm:self-auto"
            >
              {revokeAllLoading ? (
                <span className="animate-spin">🔄</span>
              ) : (
                <span>🚫</span>
              )}
              <span>Revoke All Other Devices</span>
            </button>
          )}
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            <p className="text-slate-400 text-sm">No active sessions detected.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((s) => {
              const isCurrent = s.sessionId === currentSessionId;
              const devIcon = getDeviceIcon(s.deviceInfo?.deviceType);
              const authBadge = getAuthBadge(s.authMethod);

              return (
                <div
                  key={s._id}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isCurrent
                      ? "bg-slate-900 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                        {devIcon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold text-sm">
                            {s.deviceInfo?.os} · {s.deviceInfo?.browser}
                          </p>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 glow-cyan">
                              Current Device
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs">
                          {s.userLocation?.city}, {s.userLocation?.country} ({s.ipAddress})
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 shrink-0 ${authBadge.color}`}
                    >
                      <span>{authBadge.icon}</span>
                      <span>{authBadge.label}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                    <div>
                      <span>LoggedIn: </span>
                      <span className="text-slate-300">
                        {new Date(s.loginAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {isCurrent ? (
                      <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Active Now
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRevokeSession(s.sessionId)}
                        disabled={revokingId === s.sessionId}
                        className="text-rose-400 hover:text-rose-300 text-xs font-semibold underline underline-offset-2 transition-colors"
                      >
                        {revokingId === s.sessionId ? "Revoking…" : "Revoke Session"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4. LOGGED USER HISTORY AUDIT TABLE
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-extrabold text-lg tracking-tight flex items-center gap-2">
              <span>📋</span> Logged User History & Access Audit
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Complete historical record of all user login events with IP and device details
            </p>
          </div>

          <span className="text-slate-400 text-xs bg-slate-800 px-3 py-1 rounded-full self-start sm:self-auto">
            {filteredHistory.length} of {sessions.length} records
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IP, city, country, OS, or browser…"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-slate-500 text-xs outline-none focus:border-violet-500 transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              🔍
            </span>
          </div>

          <div className="flex gap-2">
            <select
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs outline-none focus:border-violet-500"
            >
              <option value="all">All Devices</option>
              <option value="desktop">💻 Desktop</option>
              <option value="phone">📱 Phone</option>
              <option value="tablet">📱 Tablet</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs outline-none focus:border-violet-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="revoked">Revoked Only</option>
            </select>
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Device & OS</th>
                <th className="py-3 px-3">IP Address & Location</th>
                <th className="py-3 px-3">Auth Method</th>
                <th className="py-3 px-3">Login Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No matching login history records found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((s) => {
                  const devIcon = getDeviceIcon(s.deviceInfo?.deviceType);
                  const authBadge = getAuthBadge(s.authMethod);
                  const isCurrent = s.sessionId === currentSessionId;

                  return (
                    <tr
                      key={s._id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Device & OS */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{devIcon}</span>
                          <div>
                            <p className="text-white font-bold">
                              {s.deviceInfo?.os || "Unknown OS"}
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              {s.deviceInfo?.browser || "Browser"} ·{" "}
                              <span className="capitalize">{s.deviceInfo?.deviceType}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* IP & Location */}
                      <td className="py-3.5 px-3">
                        <div>
                          <p className="text-cyan-300 font-mono font-semibold">
                            {s.ipAddress}
                          </p>
                          <p className="text-slate-400 text-[11px]">
                            {s.userLocation?.city}, {s.userLocation?.country}
                          </p>
                        </div>
                      </td>

                      {/* Auth Method */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 ${authBadge.color}`}
                        >
                          <span>{authBadge.icon}</span>
                          <span>{authBadge.label}</span>
                        </span>
                      </td>

                      {/* Login Date */}
                      <td className="py-3.5 px-3 text-slate-300 font-medium">
                        {new Date(s.loginAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {s.status === "active" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {isCurrent ? "Current Active" : "Active"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Revoked
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        {s.status === "active" && !isCurrent ? (
                          <button
                            onClick={() => handleRevokeSession(s.sessionId)}
                            disabled={revokingId === s.sessionId}
                            className="text-rose-400 hover:text-rose-300 text-xs font-semibold underline transition-colors"
                          >
                            {revokingId === s.sessionId ? "Revoking…" : "Revoke"}
                          </button>
                        ) : isCurrent ? (
                          <span className="text-cyan-400 text-[11px] font-bold">This Device</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
