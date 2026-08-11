import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Trophy,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  ChevronDown,
  Award,
  FileText,
  Users,
  TrendingUp,
  Heart,
  Lightbulb,
  Target,
  ChevronUp,
  PartyPopper,
} from "lucide-react";
import { useState as useFaqState } from "react";

// ─── Countdown Timer ──────────────────────────────────────────────────────────
const DEADLINE = new Date("2026-08-01T04:59:00.000Z");

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = DEADLINE.getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = DEADLINE.getTime() - Date.now();
      setTimeLeft(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, expired: timeLeft === 0 };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="text-4xl sm:text-5xl font-display font-semibold text-white tabular-nums"
        style={{ minWidth: "2.5ch", textAlign: "center" }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--gold-400)" }}>
        {label}
      </div>
    </div>
  );
}

function CountdownSeparator() {
  return (
    <div className="text-3xl sm:text-4xl font-display font-light text-white/40 self-start mt-1">
      :
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Navbar({ user, onApply }: { user: any; onApply: () => void }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: "rgba(15, 20, 40, 0.95)",
        borderColor: "rgba(201, 168, 76, 0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: "var(--gold-500)" }} />
          <span className="font-display text-lg font-semibold text-white tracking-wide">
            RISEhigHER
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Button
              onClick={onApply}
              size="sm"
              className="font-medium"
              style={{ backgroundColor: "var(--gold-500)", color: "var(--navy-950)" }}
            >
              My Application
            </Button>
          ) : (
            <Button
              onClick={onApply}
              size="sm"
              className="font-medium"
              style={{ backgroundColor: "var(--gold-500)", color: "var(--navy-950)" }}
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── FAQ Section ─────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Do I need to be a full-time business owner to apply?",
    a: "No. You may operate your business part-time. The application asks whether you operate full-time or part-time, but both are eligible.",
  },
  {
    q: "Can I apply if my business is less than a year old?",
    a: "Yes — as long as your business has been in operation for at least 6 months and meets all other eligibility requirements, you may apply.",
  },
  {
    q: "Do I need to be a member of the RISEhigHER Network to apply?",
    a: "Yes. The award is offered exclusively to members of the RISEhigHER Network community, a program of The Murchison Consulting Group, LLC.",
  },
  {
    q: "Is there a fee to apply?",
    a: "Absolutely not. The RISEhigHER Elevation Award is completely free to enter. No purchase or payment of any kind is necessary to apply or win.",
  },
  {
    q: "What can the $1,000 be used for?",
    a: "The funds are yours to invest in your business as described in your application. Common uses include a website, operating procedures, inventory, marketing, or professional development. Your itemized budget in Part IV of the application describes exactly how you plan to use the funds.",
  },
  {
    q: "My business has independent contractors — am I still eligible?",
    a: "Yes. The eligibility requirement is that you have no W-2 employees. Independent contractors paid via Form 1099 are permitted and do not disqualify you.",
  },
  {
    q: "What documents do I need to upload?",
    a: "You will need to upload four PDF documents: (1) your business formation document, (2) evidence of a business bank account in your business's legal name, (3) a profit and loss statement for the most recent completed calendar quarter, and (4) your current written business plan.",
  },
  {
    q: "When will the winner be announced?",
    a: "Applications close on July 31 at 11:59 PM CT. The winner will be announced after the evaluation period is complete. Watch this page and the RISEhigHER Network community for the announcement.",
  },
  {
    q: "Can I save my application and come back to it?",
    a: "Yes. Your application auto-saves as you type, and you can use the \"Save & Exit\" button at any time to save your progress and return later. You must log in to access your saved application.",
  },
  {
    q: "I'm having trouble with the application. Who do I contact?",
    a: "Email jennifer@bookmcg.com with the subject line \"RISEhigHER Elevation Award Application Support\" and Jennifer will get back to you as quickly as possible.",
  },
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useFaqState<number | null>(null);
  return (
    <section className="py-20" style={{ backgroundColor: "var(--navy-50)" }}>
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <Badge
            variant="outline"
            className="mb-4 text-xs tracking-widest uppercase"
            style={{ borderColor: "var(--gold-500)", color: "var(--gold-600)" }}
          >
            Frequently Asked Questions
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: "var(--navy-950)" }}>
            Got Questions?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know before you apply.
          </p>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border overflow-hidden transition-all"
              style={{
                borderColor: openIndex === i ? "var(--gold-400)" : "var(--navy-200)",
                backgroundColor: "white",
              }}
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-semibold text-sm sm:text-base" style={{ color: "var(--navy-900)" }}>
                  {item.q}
                </span>
                {openIndex === i
                  ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "var(--gold-500)" }} />
                  : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--navy-400)" }} />}
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
          Still have questions?{" "}
          <a
            href="mailto:jennifer@bookmcg.com?subject=RISEhigHER%20Elevation%20Award%20Question"
            className="underline underline-offset-2 font-medium"
            style={{ color: "var(--gold-600)" }}
          >
            Email Jennifer directly
          </a>
        </p>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { data: deadlineData } = trpc.application.deadlineStatus.useQuery();
  const { data: announcement } = trpc.settings.getAnnouncement.useQuery();
  const countdown = useCountdown();

  const handleApply = () => {
    if (user) {
      navigate("/apply");
    } else {
      window.location.href = getLoginUrl("/apply");
    }
  };

  const eligibilityItems = [
    "Member of the RISEhigHER Network community",
    "Legally registered business entity in good standing (LLC, Corporation, Sole Proprietorship with DBA, or Nonprofit)",
    "Business bank account titled in the legal name of the business",
    "Net profit of $5,000 or less for the most recent completed calendar quarter",
    "No W-2 employees (independent contractors via Form 1099 are permitted)",
    "Current written business plan",
    "Authorized representative is at least 18 years of age and a U.S. legal resident",
  ];

  const scoringCriteria = [
    { label: "90-Day Impact & Measurability", points: 30, icon: TrendingUp },
    { label: "Customer Impact Narrative", points: 25, icon: Users },
    { label: "Operating History & Demonstrated Progress", points: 15, icon: FileText },
    { label: "Founder Narrative & Timeliness", points: 15, icon: Star },
    { label: "Itemized Budget Quality & Specificity", points: 15, icon: Award },
  ];

  const applicationParts = [
    { part: "Part I", title: "Business Information", desc: "Legal name, entity type, contact details, and business description" },
    { part: "Part II", title: "Eligibility Certifications", desc: "Confirm all eligibility requirements before proceeding" },
    { part: "Part III", title: "Organizational Narratives", desc: "Customer impact, operating history, and founder story" },
    { part: "Part IV", title: "Use of Funds", desc: "Itemized budget and 90-day impact plan" },
    { part: "Part V", title: "Supporting Documents", desc: "Business formation docs, bank account evidence, P&L, and business plan" },
    { part: "Part VI", title: "Certifications & Signature", desc: "Legal certifications and authorized representative signature" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onApply={handleApply} />

      {/* ── Hero ── */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{ background: "linear-gradient(135deg, var(--navy-950) 0%, var(--navy-800) 60%, oklch(25% 0.08 260) 100%)" }}
      >
        {/* Decorative gold lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(ellipse at 70% 50%, oklch(72% 0.13 75 / 0.08) 0%, transparent 60%)`,
          }}
        />
        <div
          className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, var(--gold-500) 0, var(--gold-500) 1px, transparent 0, transparent 50%)`,
            backgroundSize: "30px 30px",
          }}
        />

        <div className="container relative z-10 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              className="mb-6 text-xs tracking-widest uppercase border px-4 py-1.5"
              style={{
                backgroundColor: "oklch(72% 0.13 75 / 0.15)",
                borderColor: "oklch(72% 0.13 75 / 0.4)",
                color: "var(--gold-400)",
              }}
            >
              Sponsored by 2020 Counseling Professionals, PLLC
            </Badge>

            <h1
              className="font-display text-6xl sm:text-7xl lg:text-8xl font-semibold text-white leading-none mb-4"
              style={{ letterSpacing: "-0.02em" }}
            >
              RISEhig<span style={{ color: "var(--gold-500)" }}>HER</span>
            </h1>
            <h2
              className="font-display text-3xl sm:text-4xl font-light text-white/80 mb-3 tracking-wide"
            >
              Elevation Award
            </h2>
            <p className="text-white/50 text-sm uppercase tracking-widest mb-4">
              Offered exclusively to the RISEhigHER Network community
            </p>
            <p className="font-display text-xl sm:text-2xl text-white/60 font-light italic mb-10 max-w-2xl mx-auto leading-relaxed">
              Supporting women-owned businesses to grow in a community that honors her whole life.
            </p>

            <div
              className="inline-flex items-baseline gap-3 mb-12 px-8 py-4 rounded-2xl"
              style={{ backgroundColor: "oklch(72% 0.13 75 / 0.12)", border: "1px solid oklch(72% 0.13 75 / 0.3)" }}
            >
              <span className="font-display text-6xl sm:text-7xl font-bold" style={{ color: "var(--gold-500)" }}>
                $1,000
              </span>
              <span className="font-display text-xl text-white/70 font-light">Small Business Award</span>
            </div>

            {/* Countdown */}
            {!countdown.expired && !deadlineData?.isPassed ? (
              <div className="mb-12">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-4">
                  Application Deadline — July 31 at 11:59 PM CT
                </p>
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  <CountdownUnit value={countdown.days} label="Days" />
                  <CountdownSeparator />
                  <CountdownUnit value={countdown.hours} label="Hours" />
                  <CountdownSeparator />
                  <CountdownUnit value={countdown.minutes} label="Min" />
                  <CountdownSeparator />
                  <CountdownUnit value={countdown.seconds} label="Sec" />
                </div>
              </div>
            ) : (
              <div
                className="mb-12 px-6 py-3 rounded-lg inline-block"
                style={{ backgroundColor: "oklch(55% 0.22 25 / 0.2)", border: "1px solid oklch(55% 0.22 25 / 0.4)" }}
              >
                <p className="text-red-300 font-medium">Applications are now closed</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!deadlineData?.isPassed && (
                <Button
                  onClick={handleApply}
                  size="lg"
                  className="text-base font-semibold px-10 py-6 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.97]"
                  style={{
                    backgroundColor: "var(--gold-500)",
                    color: "var(--navy-950)",
                  }}
                >
                  Apply Now — Free to Enter
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="text-base font-medium px-10 py-6 rounded-xl border-white/20 text-white hover:bg-white/10 transition-all duration-200"
                onClick={() => document.getElementById("eligibility")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
                <ChevronDown className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <p className="mt-6 text-white/30 text-sm">
              No purchase or payment of any kind is necessary to enter or win.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why This Award Exists ── */}
      <section
        className="py-24"
        style={{ background: "linear-gradient(135deg, var(--navy-950) 0%, var(--navy-800) 100%)" }}
      >
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: "var(--gold-400)" }}>
                The Story Behind the Award
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white mb-6">
                Why We Created This
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left — Jennifer's story */}
              <div className="space-y-5">
                <p className="text-white/80 text-lg leading-relaxed">
                  As a fellow business owner, Jennifer Murchison knows what it feels like to start
                  without capital — no budget for ads, no money for a website, no funds for the
                  operating procedures manual that would let you step out of the day-to-day.
                </p>
                <p className="text-white/60 leading-relaxed">
                  To a new business owner, <span className="text-white font-medium">$1,000 can be anywhere from one client to multiple
                  sales</span> in a commerce business — giving real breathing room to stop working
                  <em> in</em> the business and start working <em>on</em> it.
                </p>
                <p className="text-white/60 leading-relaxed">
                  That is the gap this award was designed to close. Not a loan. Not a grant with
                  impossible requirements. A recognition of the work you are already doing — and
                  a resource to help you go further.
                </p>
                <div
                  className="mt-6 p-5 rounded-2xl border"
                  style={{ borderColor: "oklch(72% 0.13 75 / 0.3)", backgroundColor: "oklch(72% 0.13 75 / 0.06)" }}
                >
                  <p className="font-display text-xl italic text-white/90 leading-relaxed">
                    "Entrepreneurship is a male-dominated industry where 1:1 executive coaching is
                    not available at an accessible rate. We are changing that."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <img
                      src="/manus-storage/jennifer-murchison-brand_abaf13e3.png"
                      alt="Jennifer Murchison, Principal Consultant of The Murchison Consulting Group, LLC"
                      className="w-8 h-8 rounded-full object-cover object-top flex-shrink-0"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold">Jennifer Murchison</p>
                      <p className="text-white/40 text-xs">Principal Consultant, The Murchison Consulting Group, LLC</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right — The real cost of starting */}
              <div className="space-y-4">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-2">What $1,000 means to a new business owner</p>
                {[
                  { label: "A professional website", sub: "Your first online presence, built properly" },
                  { label: "A year of business software", sub: "Accounting, scheduling, or project management tools" },
                  { label: "Your first paid marketing campaign", sub: "Reach customers you couldn't reach organically" },
                  { label: "An operating procedures manual", sub: "The system that lets you work on the business, not in it" },
                  { label: "Inventory for a commerce launch", sub: "The stock that turns your idea into real revenue" },
                ].map(({ label, sub }) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{ backgroundColor: "oklch(100% 0 0 / 0.04)", border: "1px solid oklch(100% 0 0 / 0.08)" }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "oklch(72% 0.13 75 / 0.2)" }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--gold-400)" }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-white/40 text-xs mt-0.5">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-24" style={{ backgroundColor: "var(--cream)" }}>
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color: "var(--gold-500)" }}>
                The Murchison Consulting Group, LLC
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-4" style={{ color: "var(--navy-900)" }}>
                Our Mission & Vision
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14">
              <div
                className="p-8 rounded-2xl border"
                style={{ backgroundColor: "white", borderColor: "var(--border)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "oklch(72% 0.13 75 / 0.1)" }}
                >
                  <Heart className="w-6 h-6" style={{ color: "var(--gold-500)" }} />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3" style={{ color: "var(--navy-900)" }}>Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To ensure that every community has businesses founded by women who receive the
                  support they need to develop and grow — in a supported environment that honors
                  her full life as a mother, wife, employee, and community member.
                </p>
              </div>

              <div
                className="p-8 rounded-2xl border"
                style={{ backgroundColor: "white", borderColor: "var(--border)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "oklch(72% 0.13 75 / 0.1)" }}
                >
                  <Target className="w-6 h-6" style={{ color: "var(--gold-500)" }} />
                </div>
                <h3 className="font-display text-2xl font-semibold mb-3" style={{ color: "var(--navy-900)" }}>Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To be a leading force in economic development and community revitalization through
                  entrepreneurship — making 1:1 executive coaching and business development
                  resources accessible to women who have historically been priced out of them.
                </p>
              </div>
            </div>

            {/* About Jennifer */}
            <div
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="px-8 py-5 border-b"
                style={{ backgroundColor: "var(--navy-900)", borderColor: "oklch(100% 0 0 / 0.1)" }}
              >
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--gold-400)" }}>
                  About the Founder
                </p>
              </div>
              <div className="bg-white p-8">
                <div className="flex items-start gap-6">
                  <img
                    src="/manus-storage/jennifer-murchison-brand_abaf13e3.png"
                    alt="Jennifer Murchison, Principal Consultant of The Murchison Consulting Group, LLC — wearing a deep navy blazer with a champagne gold blouse, smiling confidently in a professional headshot"
                    className="w-24 h-24 rounded-2xl object-cover object-top flex-shrink-0 shadow-md"
                  />
                  <div>
                    <h3 className="font-display text-2xl font-semibold mb-0.5" style={{ color: "var(--navy-900)" }}>
                      Jennifer Murchison
                    </h3>
                    <p className="text-sm font-medium mb-4" style={{ color: "var(--gold-500)" }}>
                      Principal Consultant — The Murchison Consulting Group, LLC
                    </p>
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      Jennifer created the RISEhigHER Network and the Elevation Award from a deeply
                      personal place: the recognition that entrepreneurship — especially for women
                      managing businesses alongside family, faith, and full-time employment — requires
                      more than hustle. It requires infrastructure, community, and capital.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Through The Murchison Consulting Group, Jennifer works at the intersection of
                      economic development and community revitalization, providing the coaching,
                      systems, and support that women-owned businesses need to move from survival
                      mode to sustainable growth.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Award Overview ── */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p
              className="text-xs uppercase tracking-widest font-medium mb-3"
              style={{ color: "var(--gold-500)" }}
            >
              About the Award
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold mb-6" style={{ color: "var(--navy-900)" }}>
              Investing in Small Business Growth
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              The RISEhigHER Elevation Award is a $1,000 skill-based business competition sponsored
              by 2020 Counseling Professionals, PLLC and offered exclusively to members of the
              RISEhigHER Network community — a program of The Murchison Consulting Group, LLC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: "$1,000 Award",
                desc: "Disbursed in two installments of $500 each — first upon announcement, second upon completion of the 90 Day Impact Kit.",
              },
              {
                icon: CheckCircle2,
                title: "Skill-Based",
                desc: "Winners are selected by a review panel based on published evaluation criteria — not by chance. Every application is judged fairly.",
              },
              {
                icon: Clock,
                title: "July 31 Deadline",
                desc: "Applications must be received by 11:59 PM Central Time on July 31. The winner will be announced shortly after.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-8 border transition-shadow hover:shadow-md"
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "oklch(72% 0.13 75 / 0.1)" }}
                >
                  <Icon className="w-6 h-6" style={{ color: "var(--gold-500)" }} />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2" style={{ color: "var(--navy-900)" }}>
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Eligibility ── */}
      <section
        id="eligibility"
        className="py-24"
        style={{ backgroundColor: "var(--cream)" }}
      >
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-xs uppercase tracking-widest font-medium mb-3"
                style={{ color: "var(--gold-500)" }}
              >
                Eligibility
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold" style={{ color: "var(--navy-900)" }}>
                Who Can Apply?
              </h2>
            </div>

            <div className="space-y-3">
              {eligibilityItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 rounded-xl bg-white border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "oklch(72% 0.13 75 / 0.15)" }}
                  >
                    <CheckCircle2 className="w-4 h-4" style={{ color: "var(--gold-500)" }} />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--navy-800)" }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-center text-muted-foreground text-sm mt-8">
              One application per business entity. Immediate family and household members of the
              Sponsor and Community Partner principals are not eligible.
            </p>
          </div>
        </div>
      </section>

      {/* ── Scoring ── */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p
                className="text-xs uppercase tracking-widest font-medium mb-3"
                style={{ color: "var(--gold-500)" }}
              >
                Evaluation Criteria
              </p>
              <h2 className="font-display text-4xl sm:text-5xl font-semibold" style={{ color: "var(--navy-900)" }}>
                How Applications Are Scored
              </h2>
              <p className="mt-4 text-muted-foreground">
                Applications are evaluated on a 100-point scale by a panel selected by the Sponsor
                and Community Partner.
              </p>
            </div>

            <div className="space-y-4">
              {scoringCriteria.map(({ label, points, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-5 p-5 rounded-xl border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--navy-900)" }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: "var(--navy-900)" }}>
                      {label}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className="font-display text-2xl font-semibold"
                      style={{ color: "var(--gold-500)" }}
                    >
                      {points}
                    </span>
                    <span className="text-muted-foreground text-sm">pts</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="mt-8 p-5 rounded-xl text-sm text-center"
              style={{ backgroundColor: "oklch(18% 0.05 250 / 0.05)", color: "var(--navy-800)" }}
            >
              Parts I, II, V, and VI are evaluated on a pass/fail basis. The highest scoring
              eligible application wins. In the event of a tie, the panel will rank tied
              applications on the 90-day impact response.
            </div>
          </div>
        </div>
      </section>

      {/* ── Application Process ── */}
      <section
        className="py-24"
        style={{ background: "linear-gradient(135deg, var(--navy-950) 0%, var(--navy-800) 100%)" }}
      >
        <div className="container">
          <div className="text-center mb-14">
            <p
              className="text-xs uppercase tracking-widest font-medium mb-3"
              style={{ color: "var(--gold-400)" }}
            >
              Application Process
            </p>
            <h2 className="font-display text-4xl sm:text-5xl font-semibold text-white">
              Six Steps to Apply
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {applicationParts.map(({ part, title, desc }, i) => (
              <div
                key={part}
                className="p-6 rounded-2xl"
                style={{
                  backgroundColor: "oklch(100% 0 0 / 0.05)",
                  border: "1px solid oklch(100% 0 0 / 0.1)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ backgroundColor: "oklch(72% 0.13 75 / 0.2)", color: "var(--gold-400)" }}
                  >
                    {part}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!deadlineData?.isPassed && (
        <section className="py-24 bg-white">
          <div className="container text-center">
            <h2
              className="font-display text-4xl sm:text-5xl font-semibold mb-4"
              style={{ color: "var(--navy-900)" }}
            >
              Ready to Apply?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
              Applications are free to submit. Create your account, complete all six parts, and
              upload your supporting documents before July 31 at 11:59 PM CT.
            </p>
            <Button
              onClick={handleApply}
              size="lg"
              className="text-base font-semibold px-12 py-6 rounded-xl shadow-lg transition-all duration-200 active:scale-[0.97]"
              style={{ backgroundColor: "var(--navy-900)", color: "white" }}
            >
              Start Your Application
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="mt-4 text-muted-foreground text-sm">
              No purchase necessary. Free to enter. Void where prohibited.
            </p>
          </div>
        </section>
      )}

      {/* ── Winner Announcement Banner ── */}
      {announcement?.enabled && (
        <section
          className="py-12 text-center"
          style={{ background: "linear-gradient(135deg, var(--gold-500) 0%, oklch(75% 0.18 75) 100%)" }}
        >
          <div className="container max-w-2xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              <PartyPopper className="w-6 h-6" style={{ color: "var(--navy-950)" }} />
              <span className="font-display text-2xl font-bold" style={{ color: "var(--navy-950)" }}>We Have a Winner!</span>
              <PartyPopper className="w-6 h-6" style={{ color: "var(--navy-950)" }} />
            </div>
            {announcement.businessName && (
              <p className="text-3xl font-display font-bold mb-3" style={{ color: "var(--navy-950)" }}>
                {announcement.businessName}
              </p>
            )}
            {announcement.message ? (
              <p className="text-base" style={{ color: "var(--navy-900)" }}>{announcement.message}</p>
            ) : (
              <p className="text-base" style={{ color: "var(--navy-900)" }}>
                Congratulations to the recipient of the RISEhigHER Elevation Award! Thank you to everyone who applied.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <FaqSection />

      {/* ── Footer ── */}
      <footer
        className="py-10 border-t"
        style={{ backgroundColor: "var(--navy-950)", borderColor: "oklch(100% 0 0 / 0.08)" }}
      >
        <div className="container text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-4 h-4" style={{ color: "var(--gold-500)" }} />
            <span className="font-display text-white font-semibold">RISEhigHER Elevation Award</span>
          </div>
          <p className="text-white/30 text-xs">
            Sponsored by 2020 Counseling Professionals, PLLC &bull; Offered exclusively to the
            RISEhigHER Network community, a program of The Murchison Consulting Group, LLC
          </p>
          <p className="text-white/20 text-xs mt-2">
            No purchase or payment of any kind is necessary to enter or win. This is a skill-based
            contest governed by the laws of the State of Texas.
          </p>
        </div>
      </footer>
    </div>
  );
}
