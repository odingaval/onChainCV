"use client";
import { usePathname } from "next/navigation";

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {isLanding ? (
        children
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 shadow-lg">
          {children}
        </div>
      )}
    </main>
  );
}