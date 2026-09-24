"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const nav = [
  { href: "/", label: "Beranda", icon: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/jadwal", label: "Jadwal", icon: "M4 5h16v15H4zM4 10h16M9 3v4M15 3v4" },
  { href: "/pelanggan", label: "Pelanggan", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6" },
  { href: "/layanan", label: "Layanan", icon: "M12 3v18M17 7a4 3 0 0 0-5-1.5C9 6 7 7 7 9s2 3 5 3 5 1 5 3-2.5 3-5 3a4.5 3 0 0 1-5-2" },
  { href: "/tim", label: "Tim", icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 1 0 0-6M18 15c2 .5 4 2 4 5" },
];

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-6 w-6 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="grid place-items-center rounded-xl border-2 border-ink bg-lime shadow-[2px_2px_0_var(--ink)]" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke="#0f1b2d" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
        <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
      </svg>
    </span>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { settings } = useStore();
  const isOn = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  return (
    <div className="mx-auto min-h-dvh max-w-[1400px] md:grid md:grid-cols-[88px_1fr] lg:grid-cols-[250px_1fr]">
      {/* Sidebar: tablet = rail ikon, laptop = penuh */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r-2 border-ink px-3 py-6 md:flex lg:px-5">
        <Link href="/" className="flex items-center gap-3 px-1">
          <Logo />
          <span className="hidden lg:block">
            <span className="block font-display text-2xl font-extrabold leading-none">Sejukin</span>
            <span className="mt-1 block max-w-[150px] truncate text-xs font-semibold text-soft">{settings.company}</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-2">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isOn(n.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-3 font-bold transition ${
                isOn(n.href) ? "border-ink bg-ink text-paper" : "border-transparent hover:border-ink hover:bg-card"
              } max-lg:justify-center`}
              title={n.label}
            >
              <Icon d={n.icon} />
              <span className="hidden lg:block">{n.label}</span>
            </Link>
          ))}
        </nav>
        <Link href="/janji" className="btn btn-lime mt-2 max-lg:!px-0" title="Janji baru">
          <span className="text-xl leading-none">＋</span>
          <span className="hidden lg:block">Janji baru</span>
        </Link>
        <p className="mt-auto hidden rounded-2xl border-2 border-dashed border-ink/40 p-3 text-xs font-semibold text-soft lg:block">
          Mode demo. Data tersimpan di browser ini saja.
        </p>
      </aside>

      <div className="min-w-0 pb-28 md:pb-10">
        {/* Bar atas HP */}
        <header className="flex items-center justify-between px-4 pt-4 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={34} />
            <span className="font-display text-xl font-extrabold">Sejukin</span>
          </Link>
          <span className="max-w-[45%] truncate text-xs font-bold text-soft">{settings.company}</span>
        </header>
        <main className="px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>

      {/* Nav bawah HP */}
      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-card md:hidden" aria-label="Menu utama">
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {[nav[0], nav[1], null, nav[2], nav[4]].map((n, i) =>
            n ? (
              <li key={n.href}>
                <Link href={n.href} aria-current={isOn(n.href) ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${isOn(n.href) ? "text-ink" : "text-soft"}`}>
                  <span className={`rounded-full px-4 py-1 ${isOn(n.href) ? "bg-lime" : ""}`}><Icon d={n.icon} className="h-5 w-5" /></span>
                  {n.label}
                </Link>
              </li>
            ) : (
              <li key={i} className="relative">
                <Link href="/janji" aria-label="Janji baru" className="absolute -top-7 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border-2 border-ink bg-lime text-3xl font-black shadow-[3px_3px_0_var(--ink)] active:translate-y-0.5">
                  ＋
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  );
}
