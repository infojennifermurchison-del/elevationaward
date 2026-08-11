import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2, Trophy, Users, FileText, Award, ChevronRight, Star, PartyPopper, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";

function statusBadge(status: string) {
  switch (status) {
    case "submitted":
      return <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">Submitted</Badge>;
    case "winner":
      return <Badge className="text-xs" style={{ backgroundColor: "var(--gold-500)", color: "var(--navy-950)" }}>Winner</Badge>;
    case "draft":
      return <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>;
    case "disqualified":
      return <Badge variant="outline" className="text-xs border-red-300 text-red-600 bg-red-50">Disqualified</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>;
  }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const stats = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const apps = trpc.admin.listApplications.useQuery(undefined, { enabled: user?.role === "admin" });
  const announcement = trpc.settings.getAnnouncement.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateAnnouncement = trpc.settings.updateAnnouncement.useMutation({
    onSuccess: () => announcement.refetch(),
  });
  const [annBusinessName, setAnnBusinessName] = useState("");
  const [annMessage, setAnnMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = getLoginUrl("/admin");
    }
  }, [user, loading]);

  if (loading || apps.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--cream)" }}>
        <div className="text-center max-w-sm px-6">
          <Trophy className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-2xl font-semibold mb-2" style={{ color: "var(--navy-900)" }}>
            Access Restricted
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            This area is only accessible to the site owner.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Applications", value: stats.data?.total ?? 0, icon: FileText },
    { label: "Submitted", value: stats.data?.submitted ?? 0, icon: Users },
    { label: "Drafts", value: stats.data?.drafts ?? 0, icon: FileText },
    { label: "Winners", value: stats.data?.winners ?? 0, icon: Award },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--cream)" }}>
      {/* Header */}
      <div
        className="border-b"
        style={{ backgroundColor: "var(--navy-950)", borderColor: "oklch(100% 0 0 / 0.08)" }}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5" style={{ color: "var(--gold-500)" }} />
            <div>
              <span className="font-display text-white font-semibold">RISEhigHER Elevation Award</span>
              <span
                className="ml-3 text-xs uppercase tracking-widest px-2 py-0.5 rounded"
                style={{ backgroundColor: "oklch(72% 0.13 75 / 0.2)", color: "var(--gold-400)" }}
              >
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
              onClick={() => navigate("/admin/evaluators")}
            >
              <Users className="w-4 h-4 mr-1.5" />
              Evaluators
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white"
              onClick={() => navigate("/")}
            >
              View Site
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold" style={{ color: "var(--navy-900)" }}>
            Application Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and manage all RISEhigHER Elevation Award applications
          </p>
        </div>

        {/* Winner Announcement Toggle */}
        <div
          className="bg-white rounded-2xl p-6 border mb-8"
          style={{ borderColor: announcement.data?.enabled ? "var(--gold-400)" : "var(--border)" }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <PartyPopper className="w-5 h-5" style={{ color: "var(--gold-500)" }} />
              <div>
                <h3 className="font-semibold text-sm" style={{ color: "var(--navy-900)" }}>Winner Announcement Banner</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {announcement.data?.enabled ? "Banner is live on the homepage" : "Banner is hidden — toggle on after selecting a winner"}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                updateAnnouncement.mutate({
                  enabled: !announcement.data?.enabled,
                  businessName: annBusinessName || announcement.data?.businessName || undefined,
                  message: annMessage || announcement.data?.message || undefined,
                })
              }
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: announcement.data?.enabled ? "var(--gold-600)" : "var(--navy-400)" }}
              disabled={updateAnnouncement.isPending}
            >
              {announcement.data?.enabled
                ? <ToggleRight className="w-8 h-8" style={{ color: "var(--gold-500)" }} />
                : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
              {announcement.data?.enabled ? "On" : "Off"}
            </button>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Winner Business Name</label>
              <input
                type="text"
                placeholder={announcement.data?.businessName ?? "e.g. Bloom & Co."}
                value={annBusinessName}
                onChange={e => setAnnBusinessName(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2"
                style={{ borderColor: "var(--navy-200)", color: "var(--navy-900)" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Custom Message (optional)</label>
              <input
                type="text"
                placeholder="Congratulations to our winner!"
                value={annMessage}
                onChange={e => setAnnMessage(e.target.value)}
                className="w-full text-sm border rounded-lg px-3 py-2 outline-none focus:ring-2"
                style={{ borderColor: "var(--navy-200)", color: "var(--navy-900)" }}
              />
            </div>
          </div>
          {(annBusinessName || annMessage) && (
            <Button
              size="sm"
              className="mt-3"
              style={{ backgroundColor: "var(--gold-500)", color: "var(--navy-950)" }}
              onClick={() =>
                updateAnnouncement.mutate({
                  enabled: announcement.data?.enabled ?? false,
                  businessName: annBusinessName || undefined,
                  message: annMessage || undefined,
                })
              }
              disabled={updateAnnouncement.isPending}
            >
              {updateAnnouncement.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-5 border"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="font-display text-4xl font-semibold" style={{ color: "var(--navy-900)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--navy-900)" }}>All Applications</h2>
            <span className="text-xs text-muted-foreground">{apps.data?.length ?? 0} total</span>
          </div>

          {!apps.data || apps.data.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No applications yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {apps.data.map(({ application: app, user: applicant }) => (
                <button
                  key={app.id}
                  onClick={() => navigate(`/admin/application/${app.id}`)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm text-white"
                    style={{ backgroundColor: "var(--navy-800)" }}
                  >
                    {(app.legalBusinessName ?? applicant.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate" style={{ color: "var(--navy-900)" }}>
                        {app.legalBusinessName || "(No business name)"}
                      </span>
                      {app.status === "winner" && (
                        <Star className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--gold-500)" }} />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{applicant.name ?? applicant.email ?? "Unknown"}</span>
                      {app.repName && <span>&bull; {app.repName}</span>}
                      {app.submittedAt && (
                        <span>&bull; {new Date(app.submittedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {statusBadge(app.status)}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
