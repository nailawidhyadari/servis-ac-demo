"use client";

import { useEffect, type ReactNode } from "react";
import type { Status } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/schedule";

const tone: Record<Status, string> = {
  baru: "bg-[#ffe9a8]",
  konfirmasi: "bg-frost",
  jalan: "bg-lime",
  selesai: "bg-[#e3e0d6] text-soft",
  batal: "bg-[#ffd0c7] line-through",
};

export function StatusTag({ s }: { s: Status }) {
  return <span className={`tag ${tone[s]}`}>{STATUS_LABEL[s]}</span>;
}

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-soft">{kicker}</p>
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight md:text-5xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", k);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Tutup" className="absolute inset-0 bg-ink/55" onClick={onClose} />
      <div className="card pop relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none p-5 md:max-w-lg md:rounded-b-[20px]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold leading-tight">{title}</h2>
          <button onClick={onClose} className="btn btn-sm shrink-0" aria-label="Tutup">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint, tint }: { label: string; value: ReactNode; hint?: string; tint: string }) {
  return (
    <div className="card p-4" style={{ background: tint }}>
      <p className="text-xs font-extrabold uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold leading-none md:text-5xl">{value}</p>
      {hint && <p className="mt-2 text-xs font-semibold text-ink/70">{hint}</p>}
    </div>
  );
}
