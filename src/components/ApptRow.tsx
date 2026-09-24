"use client";

import { useStore } from "@/lib/store";
import { fmtTime } from "@/lib/schedule";
import type { Appt } from "@/lib/types";
import { StatusTag } from "./ui";

export function ApptRow({ a, onOpen, showDate }: { a: Appt; onOpen: (a: Appt) => void; showDate?: string }) {
  const { services, techs } = useStore();
  const svc = services.find((s) => s.id === a.serviceId);
  const tech = techs.find((t) => t.id === a.techId);
  return (
    <button onClick={() => onOpen(a)} className="card-flat flex w-full items-center gap-3 p-3 text-left transition hover:-translate-y-0.5 hover:bg-white">
      <span className="grid w-16 shrink-0 place-items-center rounded-xl border-2 border-ink py-1.5" style={{ background: tech?.color }}>
        {showDate && <span className="text-[10px] font-extrabold uppercase">{showDate}</span>}
        <span className="font-mono text-base font-medium leading-none">{fmtTime(a.start)}</span>
        <span className="mt-0.5 text-[10px] font-bold">{tech?.name}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{a.customer}</span>
        <span className="block truncate text-sm text-soft">{svc?.emoji} {svc?.short} · {a.units} unit · {a.address}</span>
      </span>
      <StatusTag s={a.status} />
    </button>
  );
}
