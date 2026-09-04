"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Cpu,
  KeyRound,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { VaultDashboard } from "@/components/VaultDashboard";
import api from "@/lib/api";

type ProfileTab = "overview" | "my_agents" | "activities";

type MarketplaceActivity = {
  id: string;
  agentType?: string | null;
  createdAt?: string | null;
  creditsUsed?: number | string | null;
  artifactCid?: string | null;
  deployedAgent?: {
    teeAttestation?: boolean | null;
  } | null;
};

type DeployedAgentItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: string;
  category: string;
  icon?: string;
  color?: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [activities, setActivities] = useState<MarketplaceActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [myAgents, setMyAgents] = useState<DeployedAgentItem[]>([]);
  const [myAgentsLoading, setMyAgentsLoading] = useState(false);

  useEffect(() => {
    if (!user || !user.onboardingCompleted) return;

    let isMounted = true;
    setActivitiesLoading(true);
    setMyAgentsLoading(true);

    api
      .get("/agents/runs")
      .then((response) => {
        if (isMounted) {
          setActivities(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((error) => {
        console.error("Failed to load marketplace activities", error);
        if (isMounted) {
          setActivities([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setActivitiesLoading(false);
        }
      });

    api
      .get("/agents/my")
      .then((response) => {
        if (isMounted) {
          setMyAgents(Array.isArray(response.data) ? response.data : []);
        }
      })
      .catch((error) => {
        console.error("Failed to load custom agents", error);
        if (isMounted) {
          setMyAgents([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setMyAgentsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (isLoading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm font-medium text-gray-400">Loading profile…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center p-4 text-center sm:p-6 lg:p-8">
        <div className="space-y-5">
          <CircleUserRound className="w-12 h-12 mx-auto text-orange-500" />
          <h1 className="text-3xl font-bold text-gray-900">Your profile is waiting</h1>
          <p className="text-gray-500">Sign in to manage your AgentBazaar account.</p>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  const initial = user.username.charAt(0).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 pb-16 text-gray-900">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-orange-100">
            {initial}
          </div>
          <div>
            <p className="text-[11px] font-bold text-orange-500 uppercase tracking-[0.24em] mb-2">Operator profile</p>
            <h1 className="text-4xl font-bold tracking-tight">{user.username}</h1>
            <p className="mt-1 text-gray-500">{user.email}</p>
          </div>
        </div>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/settings">
            <Settings className="w-4 h-4 mr-2" />Account settings
          </Link>
        </Button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ProfileStatus
          icon={BadgeCheck}
          label="Account status"
          value={user.onboardingCompleted ? "Ready to build" : "Setup in progress"}
          detail={user.onboardingCompleted ? "Your onboarding is complete." : "Complete onboarding to unlock your workspace."}
          tone="orange"
        />
        <ProfileStatus
          icon={Sparkles}
          label="Execution Engine"
          value="Hedera x402"
          detail="Decentralized micro-payments & verifiable agent runs."
          tone="green"
        />
        <ProfileStatus
          icon={KeyRound}
          label="Access"
          value="Signed in"
          detail="Your session is active on this device."
          tone="blue"
        />
      </section>

      <section className="bg-white border border-gray-100 rounded-[32px] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "overview"
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("my_agents")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "my_agents"
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            My Deployed Agents
            {myAgents.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "my_agents" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
                {myAgents.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "activities"
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Activities
          </button>
        </div>

        {activeTab === "overview" ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-xl font-bold">Continue building</h2>
                <p className="text-sm text-gray-500 mt-1">Jump back into the parts of AgentBazaar that matter most.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ProfileLink href="/projects" icon={BriefcaseBusiness} title="My projects" description="View and organize your work." />
              <ProfileLink href="/deploy" icon={Rocket} title="Deploy an agent" description="Launch a new agent workflow." />
              <ProfileLink href="/settings" icon={Settings} title="Preferences" description="Manage security and app settings." />
            </div>

            <div className="pt-4">
              <VaultDashboard />
            </div>
          </div>
        ) : activeTab === "my_agents" ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">My Deployed Agents</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your listed custom agents and monitor verification status.</p>
              </div>
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href="/deploy">
                  <Rocket className="w-4 h-4 mr-2" />Deploy new agent
                </Link>
              </Button>
            </div>

            {myAgentsLoading ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">Loading your deployed agents…</div>
            ) : myAgents.length > 0 ? (
              <div className="space-y-3">
                {myAgents.map((agent) => (
                  <div key={agent.id} className="rounded-[24px] border border-gray-100 bg-gray-50/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold shrink-0">
                        {agent.icon || "🤖"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider">
                            {agent.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{agent.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {agent.status === "pending" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                          <Clock3 className="w-3.5 h-3.5" /> Waiting for admin verification
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                          <BadgeCheck className="w-3.5 h-3.5" /> Deployed on AgentBazaar
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50/70 p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No agents deployed yet</h3>
                <p className="mt-2 text-sm text-gray-500">Deploy your first custom AI agent to list it on AgentBazaar.</p>
                <Button asChild variant="secondary" className="mt-5 rounded-xl">
                  <Link href="/deploy">Deploy an agent</Link>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Marketplace activities</h2>
                <p className="text-sm text-gray-500 mt-1">Your recent actions across the marketplace and agent runs.</p>
              </div>
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href="/runs">
                  <Activity className="w-4 h-4 mr-2" />View full history
                </Link>
              </Button>
            </div>

            {activitiesLoading ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-500">Loading your marketplace activity…</div>
            ) : activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const activityTitle = activity.agentType ? `${activity.agentType} run` : "Marketplace activity";
                  const creditsLabel = activity.creditsUsed != null ? `${activity.creditsUsed} CRD` : "No credits logged";
                  const activityTime = formatActivityDate(activity.createdAt);

                  return (
                    <div key={activity.id} className="rounded-[24px] border border-gray-100 bg-gray-50/70 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{activityTitle}</h3>
                            {activity.deployedAgent?.teeAttestation ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                                <ShieldCheck className="w-3 h-3" />Verified
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            {activity.deployedAgent?.teeAttestation
                              ? "TEE verified execution captured on the marketplace."
                              : "Recorded from your marketplace activity and agent run history."}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-semibold text-gray-900">{creditsLabel}</p>
                          <p className="mt-1 text-xs text-gray-400">{activityTime}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 className="w-3.5 h-3.5" />{activityTime}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5" />{activity.agentType || "Marketplace"}
                        </span>
                        {activity.artifactCid ? (
                          <span className="inline-flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" />Artifact recorded
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50/70 p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No marketplace activity yet</h3>
                <p className="mt-2 text-sm text-gray-500">Launch an agent from the marketplace to start building your activity history.</p>
                <Button asChild variant="secondary" className="mt-5 rounded-xl">
                  <Link href="/marketplace">Explore marketplace</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="border border-orange-100 bg-orange-50/50 rounded-[28px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold">Sign out of this device</h2>
          <p className="text-sm text-gray-500 mt-1">This clears your local session and returns you to sign in.</p>
        </div>
        <Button variant="secondary" onClick={signOut} className="rounded-xl border-orange-100 hover:bg-white">Sign out</Button>
      </section>
    </main>
  );
}

function formatActivityDate(value?: string | null) {
  if (!value) return "Recently recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently recorded";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ProfileStatus({ icon: Icon, label, value, detail, extra, tone }: { icon: any; label: string; value: string; detail: string; extra?: string; tone: "orange" | "green" | "blue" | "gray" }) {
  const styles = {
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    gray: "bg-gray-50 text-gray-500 border-gray-100",
  };

  return (
    <div className="bg-white border border-gray-100 rounded-[28px] p-6 shadow-sm">
      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${styles[tone]}`}><Icon className="w-5 h-5" /></div>
      <p className="mt-5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-lg font-bold text-gray-900 truncate">{value}</p>
      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{detail}</p>
      {extra ? <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-400">{extra}</p> : null}
    </div>
  );
}

function ProfileLink({ href, icon: Icon, title, description }: { href: string; icon: any; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-white flex items-center justify-center text-orange-500"><Icon className="w-5 h-5" /></div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500" />
    </Link>
  );
}
