import { type ReactNode } from "react";
import Header from "./Header";

export default function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">{children}</main>
    </div>
  );
}
