import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle2, Trophy, ArrowLeft } from "lucide-react";

export default function ApplicationConfirmation() {
  const [, navigate] = useLocation();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--cream)" }}
    >
      <div className="max-w-lg w-full text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "oklch(72% 0.13 75 / 0.15)" }}
        >
          <CheckCircle2 className="w-10 h-10" style={{ color: "var(--gold-500)" }} />
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-5 h-5" style={{ color: "var(--gold-500)" }} />
          <span className="font-display text-lg font-semibold" style={{ color: "var(--navy-900)" }}>
            RISEhigHER Elevation Award
          </span>
        </div>

        <h1
          className="font-display text-4xl font-semibold mb-4"
          style={{ color: "var(--navy-900)" }}
        >
          Application Submitted
        </h1>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          Your application for the RISEhigHER Elevation Award has been successfully submitted. A
          review panel will evaluate all eligible applications and the winner will be announced
          shortly after the July 31 deadline.
        </p>

        <div
          className="rounded-xl p-5 mb-8 text-left space-y-3"
          style={{ backgroundColor: "white", border: "1px solid var(--border)" }}
        >
          <h3 className="font-semibold text-sm" style={{ color: "var(--navy-900)" }}>
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--navy-900)", color: "white" }}
              >
                1
              </span>
              Applications close July 31 at 11:59 PM CT
            </li>
            <li className="flex items-start gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--navy-900)", color: "white" }}
              >
                2
              </span>
              A review panel evaluates all eligible submissions
            </li>
            <li className="flex items-start gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--navy-900)", color: "white" }}
              >
                3
              </span>
              The winner is announced and the first $500 installment is issued within 14 days
            </li>
            <li className="flex items-start gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "var(--navy-900)", color: "white" }}
              >
                4
              </span>
              The second $500 installment follows upon receipt of the 90 Day Impact Kit
            </li>
          </ul>
        </div>

        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Home
        </Button>

        <p className="mt-6 text-xs text-muted-foreground">
          Sponsored by 2020 Counseling Professionals, PLLC &bull; Offered exclusively to the
          RISEhigHER Network community
        </p>
      </div>
    </div>
  );
}
