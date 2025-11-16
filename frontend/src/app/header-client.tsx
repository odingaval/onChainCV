"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";

function ConnectButton() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();
  const isBusy = connectStatus === "pending";

  if (isConnected) {
    const short = `${address?.slice(0, 6)}…${address?.slice(-4)}`;
    return (
      <button
        className="rounded-md bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-2 text-sm text-white shadow hover:opacity-95 transition"
        onClick={() => disconnect()}
        title={address || ""}
      >
        {short}
      </button>
    );
  }
  return (
    <button
  className="rounded-md bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-2 text-sm text-white shadow hover:opacity-95 transition"
  onClick={() => connect({ connector: connectors[0] })}
  disabled={isBusy || connectors.length === 0}
>
  {isBusy ? "Connecting…" : "Connect Wallet"}
</button>
  );
}

function NavTabs() {
  const pathname = usePathname();
  const tabs = [
    { href: "/issue", label: "Issue Credential" },
    { href: "/view", label: "View Credential" },
    { href: "/my", label: "My Credentials" },
    { href: "/admin", label: "Admin" },
  ];
  return (
    <nav className="mt-3 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-full px-3 py-1 text-sm transition border ${
              active
                ? "bg-white/10 border-white/30 text-white"
                : "bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

function LandingTopNav() {
  return (
    <nav className="hidden md:flex items-center gap-6">
      <a href="#features" className="text-sm text-zinc-200 hover:text-white transition">Features</a>
      <a href="#how-it-works" className="text-sm text-zinc-200 hover:text-white transition">How It Works</a>
      <a href="#why" className="text-sm text-zinc-200 hover:text-white transition">Why OnchainCV</a>
      <Link href="/view" className="rounded-md bg-gradient-to-r from-cyan-500 to-violet-600 px-3 py-2 text-sm text-white shadow hover:opacity-95 transition">
        Launch App
      </Link>
    </nav>
  );
}

export default function HeaderClient() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/20 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500">
          OnchainCV
        </Link>
        {isLanding ? <LandingTopNav /> : <ConnectButton />}
      </div>
      {!isLanding && (
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <NavTabs />
        </div>
      )}
    </header>
  );
}