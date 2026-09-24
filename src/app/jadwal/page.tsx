"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, dayName, fmtDate, fmtTime, fromKey, isOff, pad } from "@/lib/schedule";
import type { Appt } from "@/lib/types";
import { PageHead } from "@/components/ui";
import { ApptSheet } from "@/components/ApptSheet";

const ROW = 44; // px per 30 menit

export default function Jadwal() {
  const { appts, techs, services, settings, today, nowMin } = useStore();
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [open, setOpen] = useState<Appt | null>(null);
  const [only, setOnly] = useState<string>("all");

  const strip = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(today, i - 2)), [today]);
  const count = (k: string) => appts.filter((a) => a.date === k && a.status !== "batal").length;
  const cols = techs.filter((t) => only === "all" || t.id === only);
  const rows = (settings.closeMin - settings.openMin) / 30;
  const y = (m: number) => ((m - settings.openMin) / 30) * ROW;
  const dayAppts = appts.filter((a) => a.date === date && a.status !== "batal");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead kicker="Papan jadwal" title={fmtDate(date)}>
        <div className="flex gap-2">
          <button className="btn btn-sm" onClick={() => setDate(addDays(date, -1))} aria-label="Hari sebelumnya">←</button>
          <button className="btn btn-sm" onClick={() => setDate(today)} disabled={date === today}>Hari ini</button>
          <button className="btn btn-sm" onClick={() => setDate(addDays(date, 1))} aria-label="Hari berikutnya">→</button>
        </div>
      </PageHead>

      <div className="scroll-x -mx-4 mb-4 flex gap-2 px-4 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="Pilih tanggal">
        {strip.map((k) => {
          const on = k === date;
          const c = count(k);
          return (
            <button key={k} role="tab" aria-selected={on} onClick={() => setDate(k)}
              className={`flex w-[58px] shrink-0 flex-col items-center rounded-2xl border-2 border-ink py-2 ${on ? "bg-ink text-paper" : "bg-card"} ${k === today && !on ? "ring-4 ring-lime" : ""}`}>
              <span className="text-[10px] font-extrabold uppercase">{dayName(k).slice(0, 3)}</span>
              <span className="font-display text-2xl font-extrabold leading-none">{fromKey(k).getDate()}</span>
              <span className={`mt-1 rounded-full px-1.5 text-[10px] font-bold ${on ? "bg-lime text-ink" : "bg-frost"}`}>{c} job</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button className="chip" data-on={only === "all"} onClick={() => setOnly("all")}>Semua teknisi</button>
        {techs.map((t) => (
          <button key={t.id} className="chip" data-on={only === t.id} onClick={() => setOnly(t.id)}>
            <span className="h-3 w-3 rounded-full border-2 border-ink" style={{ background: t.color }} />{t.name}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="scroll-x max-h-[70dvh] overflow-y-auto">
          <div className="grid min-w-max" style={{ gridTemplateColumns: `52px repeat(${cols.length}, minmax(${cols.length > 2 ? 168 : 200}px, 1fr))` }}>
            {/* header */}
            <div className="sticky top-0 z-20 border-b-2 border-ink bg-card" />
            {cols.map((t) => (
              <div key={t.id} className="sticky top-0 z-20 flex items-center gap-2 border-b-2 border-l-2 border-ink px-3 py-2.5" style={{ background: t.color }}>
                <span className="font-display text-lg font-extrabold">{t.name}</span>
                <span className="truncate text-xs font-semibold">{isOff(t, date) ? "libur" : t.area}</span>
              </div>
            ))}
            {/* gutter jam */}
            <div className="relative bg-card" style={{ height: rows * ROW }}>
              {Array.from({ length: rows }, (_, i) => i % 2 === 0 && (
                <span key={i} className="absolute right-2 -translate-y-1/2 font-mono text-[11px] text-soft" style={{ top: i * ROW + (i === 0 ? 8 : 0) }}>
                  {pad(settings.openMin / 60 + i / 2)}:00
                </span>
              ))}
            </div>
            {cols.map((t) => {
              const off = isOff(t, date);
              return (
                <div
                  key={t.id}
                  className={`relative border-l-2 border-ink ${off ? "cursor-not-allowed" : "cursor-cell"}`}
                  style={{
                    height: rows * ROW,
                    backgroundImage: off
                      ? "repeating-linear-gradient(135deg, rgba(15,27,45,.12) 0 6px, transparent 6px 12px)"
                      : `linear-gradient(to bottom, rgba(15,27,45,.16) 1px, transparent 1px)`,
                    backgroundSize: off ? undefined : `100% ${ROW * 2}px`,
                  }}
                  onClick={(e) => {
                    if (off) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    const slot = Math.floor((e.clientY - r.top) / ROW);
                    router.push(`/janji?date=${date}&tech=${t.id}&start=${settings.openMin + slot * 30}`);
                  }}
                  aria-label={`Kolom ${t.name}${off ? ", libur" : ", klik slot kosong untuk buat janji"}`}
                >
                  {off && <span className="absolute inset-x-0 top-4 text-center text-xs font-extrabold uppercase tracking-widest text-soft">Libur</span>}
                  {dayAppts.filter((a) => a.techId === t.id).map((a) => {
                    const svc = services.find((s) => s.id === a.serviceId);
                    const h = (a.duration / 30) * ROW;
                    const bh = (settings.buffer / 30) * ROW;
                    return (
                      <div key={a.id}>
                        <div className="pointer-events-none absolute inset-x-1 rounded-b-lg border-2 border-dashed border-ink/40 border-t-0"
                          style={{ top: y(a.start) + h - 2, height: bh, backgroundImage: "repeating-linear-gradient(135deg, rgba(15,27,45,.1) 0 4px, transparent 4px 8px)" }}
                          title="Jeda perjalanan" />
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpen(a); }}
                          className={`absolute inset-x-1 overflow-hidden rounded-xl border-2 border-ink p-2 text-left transition hover:z-10 hover:shadow-[3px_3px_0_var(--ink)] ${a.status === "selesai" ? "opacity-60" : ""}`}
                          style={{ top: y(a.start), height: h - 2, background: t.color }}
                        >
                          <span className="block font-mono text-[11px] font-medium leading-none">{fmtTime(a.start)}–{fmtTime(a.start + a.duration)}</span>
                          <span className="mt-1 block truncate text-sm font-extrabold leading-tight">{a.customer}</span>
                          {h > 70 && <span className="block truncate text-xs font-semibold">{svc?.emoji} {svc?.short} · {a.units} unit</span>}
                          {a.status === "baru" && h > 50 && <span className="tag mt-1 bg-card !py-0 !text-[10px]">Belum konfirm</span>}
                        </button>
                      </div>
                    );
                  })}
                  {date === today && nowMin >= settings.openMin && nowMin <= settings.closeMin && (
                    <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-coral" style={{ top: y(nowMin) }}>
                      <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-coral" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-soft">Klik kotak kosong buat bikin janji. Blok bergaris di bawah tiap job = jeda {settings.buffer} menit perjalanan, jadi sistem tidak akan menaruh janji di situ.</p>
      <ApptSheet appt={open} onClose={() => setOpen(null)} />
    </div>
  );
}
