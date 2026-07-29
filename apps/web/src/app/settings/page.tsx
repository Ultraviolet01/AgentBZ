"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageCircleQuestion,
  PanelTop,
  Settings as SettingsIcon,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

type PreferencesState = {
  language: "en" | "fr" | "es";
  profilePublic: boolean;
  shareActivity: boolean;
};

const STORAGE_KEY = "agentbazaar-settings";

const defaultPreferences: PreferencesState = {
  language: "en",
  profilePublic: true,
  shareActivity: true,
};

export default function SettingsPage() {
  const { user, isLoading, signOut } = useAuth();
  const [preferences, setPreferences] = useState<PreferencesState>(defaultPreferences);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedValue = window.localStorage.getItem(STORAGE_KEY);
    if (savedValue) {
      try {
        const parsed = JSON.parse(savedValue) as Partial<PreferencesState>;
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm font-medium text-gray-400">Loading settings…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center p-4 text-center sm:p-6 lg:p-8">
        <div className="space-y-4">
          <ShieldCheck className="w-12 h-12 mx-auto text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900">Sign in to manage settings</h1>
          <p className="text-gray-500">Your account controls will appear here once you sign in.</p>
          <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ type: "error", text: "Please fill in all password fields." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordStatus({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: "error", text: "New passwords do not match." });
      return;
    }

    try {
      setIsSavingPassword(true);
      await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus({ type: "success", text: "Password updated successfully." });
    } catch (error: any) {
      setPasswordStatus({ type: "error", text: error?.response?.data?.error || "Unable to update password right now." });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "This will deactivate your account and sign you out from this browser. Continue?"
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.delete("/auth/account");
      await signOut();
    } catch (error: any) {
      window.alert(error?.response?.data?.error || "Unable to deactivate your account right now.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 pb-16 text-gray-900">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[24px] border border-orange-100 bg-orange-50 text-orange-500 shadow-sm">
            <SettingsIcon className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">Account controls</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1>
          </div>
        </div>
        <p className="max-w-2xl text-lg text-gray-500">
          Manage the basics of your account, privacy, and workspace experience.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-100 p-2.5 text-gray-600">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="text-sm text-gray-500">Your core identity and access details.</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <SettingRow label="Username" value={user.username} icon={UserRound} />
            <SettingRow label="Email" value={user.email} icon={Mail} />
          </div>

          <form onSubmit={handlePasswordSubmit} className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">Change password</h3>
            </div>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Current password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-0"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowCurrentPassword((value) => !value)}>
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-0"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowNewPassword((value) => !value)}>
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-0"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingPassword}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Save password
            </button>
            {passwordStatus ? (
              <p className={`mt-3 flex items-center gap-2 text-sm ${passwordStatus.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                <CheckCircle2 className="h-4 w-4" />
                {passwordStatus.text}
              </p>
            ) : null}
          </form>
        </div>

        <div className="rounded-[32px] border border-orange-100 bg-orange-50/60 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-2.5 text-orange-500 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Delete account</h2>
              <p className="mt-1 text-sm text-gray-600">This deactivates your account and signs you out.</p>
              <p className="mt-3 text-sm text-gray-600">
                Your account will be disabled and you will need support to restore it later.
              </p>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete account
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-1">
        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-100 p-2.5 text-gray-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Preferences</h2>
              <p className="text-sm text-gray-500">Tune the app to fit your workflow.</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Language</p>
              <p className="text-xs text-gray-500">Select the display language</p>
            </div>
            <select
              value={preferences.language}
              onChange={(event) => setPreferences((value) => ({ ...value, language: event.target.value as "en" | "fr" | "es" }))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-100 p-2.5 text-gray-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Privacy</h2>
              <p className="text-sm text-gray-500">Control how your profile and activity are shared.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <ToggleRow
              label="Public profile"
              description="Show your profile to other users"
              enabled={preferences.profilePublic}
              onToggle={() => setPreferences((value) => ({ ...value, profilePublic: !value.profilePublic }))}
            />
            <ToggleRow
              label="Share marketplace activity"
              description="Let others see your recent activity"
              enabled={preferences.shareActivity}
              onToggle={() => setPreferences((value) => ({ ...value, shareActivity: !value.shareActivity }))}
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-100 p-2.5 text-gray-600">
              <MessageCircleQuestion className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Support</h2>
              <p className="text-sm text-gray-500">Need help or want to report an issue?</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <SupportLink href="/help" label="Help center" />
            <SupportLink href="mailto:support@agentbazaar.com" label="Contact support" />
            <SupportLink href="/report-bug" label="Report a bug" />
          </div>
        </div>
      </section>
    </main>
  );
}

function SettingRow({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white p-2 text-gray-500 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-xs text-gray-500">{value}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </div>
  );
}

function ToggleRow({ label, description, enabled, onToggle }: { label: string; description: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? "bg-orange-500" : "bg-gray-300"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function SupportLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-white">
      <span>{label}</span>
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </Link>
  );
}
