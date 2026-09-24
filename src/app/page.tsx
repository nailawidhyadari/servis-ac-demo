"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, fmtDate, fmtDateShort, fmtTime, isOff, nextOpening, rupiah, waLink } from "@/lib/schedule";
import type { Appt } from "@/lib/types";
import { PageHead, Stat } from "@/components/ui";
import { ApptRow } from "@/components/ApptRow";
import { ApptSheet, waMessage } from "@/components/ApptSheet";

export default function Beranda() {
  const { appts, techs, services, settings, today, nowMin } = useStore();
  const [open, setOpen] = useState<Appt | null>(null);

  const d = useMemo(() => {
    const live = appts.filter((a) => a.status !== "batal");
    const todays = live.filter((a) => a.date === today).sort((a, b) => a.start - b.start);
    const revenue = todays.reduce((s, a) => s + (services.find((x) => x.id === a.serviceId)?.price ?? 0) * a.units, 0);
    const busy = new Set(todays.filter((a) => a.start <= nowMin && nowMin < a.start + a.duration).map((a) => a.techId));
    const tomorrow = addDays(today, 1);
    const unconfirmed = live.filter((a) => a.status === "baru" && a.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
    // pelanggan jatuh tempo servis berkala
    const last = new Map<string, Appt>();
    for (const a of live) if (a.status === "selesai") { const k = a.phone; const p = last.get(k); if (!p || p.date < a.date) last.set(k, a); }
    const upcoming = new Set(live.filter((a) => a.date >= today).map((a) => a.phone));
    const due = [...last.values()]
      .filter((a) => !upcoming.has(a.phone))
      .map((a) => ({ a, days: Math.round((new Date(today).getTime() - new Date(a.date).getTime()) / 86400000) }))
      .filter((x) => x.days >= settings.serviceCycleDays - 75)
      .sort((x, y) => y.days - x.days)
      .slice(0, 4);
    const open60 = nextOpening(appts, techs, settings, today, 60, nowMin, today);
    const nextUp = todays.filter((a) => a.start + a.duration > nowMin && a.status !== "selesai");
    const freeNow = techs.filter((t) => !isOff(t, today) && !busy.has(t.id)).length;
    return { todays, revenue, busy, tomorrow, unconfirmed, due, open60, nextUp, freeNow, tmr: live.filter((a) => a.date === tomorrow).length };
  }, [appts, techs, services, settings, today, nowMin]);

  const svc = (id: string) => services.find((s) => s.id === id)?.name ?? "service AC";
  const tech = (id: string) => techs.find((t) => t.id === id)?.name ?? "kami";
  const hour = new Date().getHours();
  const hi = hour < 11 ? "Pagi" : hour < 15 ? "Siang" : hour < 18 ? "Sore" : "Malam";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHead kicker={fmtDate(today)} title={`${hi}, Bos. Ini hari ini.`}>
        <Link href="/janji" className="btn btn-lime hidden md:inline-flex">＋ Janji baru</Link>
      </PageHead>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Janji hari ini" value={d.todays.length} hint={`${d.tmr} janji besok`} tint="var(--lime)" />
        <Stat label="Teknisi kosong" value={`${d.freeNow}/${techs.length}`} hint="sedang tidak di lokasi" tint="var(--frost)" />
        <Stat label="Belum konfirmasi" value={d.unconfirmed.length} hint="perlu dikabari via WA" tint="#ffe9a8" />
        <Stat label="Estimasi omzet" value={<span className="text-2xl md:text-3xl">{rupiah(d.revenue)}</span>} hint="dari janji hari ini" tint="#ffd0c7" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold">Urutan kerja hari ini</h2>
            <Link href="/jadwal" className="text-sm font-bold underline decoration-2 underline-offset-4">Lihat papan jadwal →</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {d.todays.length === 0 && <p className="card-flat p-5 text-soft">Hari ini kosong. Waktunya tawarin paket rutin ke pelanggan lama.</p>}
            {d.todays.map((a) => (
              <div key={a.id} className={a.start + a.duration <= nowMin && a.status !== "jalan" ? "opacity-60" : ""}>
                <ApptRow a={a} onOpen={setOpen} />
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="card bg-ink p-5 text-paper">
            <p className="font-mono text-xs uppercase tracking-widest text-lime">Slot kosong terdekat</p>
            {d.open60 ? (
              <>
                <p className="mt-2 font-display text-3xl font-extrabold leading-tight">
                  {d.open60.date === today ? "Hari ini" : fmtDate(d.open60.date)}, {fmtTime(d.open60.start)}
                </p>
                <p className="text-sm text-paper/70">Teknisi {d.open60.tech.name} kosong untuk job 1 jam.</p>
                <Link href={`/janji?date=${d.open60.date}&start=${d.open60.start}&tech=${d.open60.tech.id}`} className="btn btn-lime mt-4">Isi slot ini</Link>
              </>
            ) : (
              <p className="mt-2">Dua minggu ke depan penuh. Mantap!</p>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl font-extrabold">Kabari pelanggan</h2>
            <div className="flex flex-col gap-2.5">
              {d.unconfirmed.length === 0 && <p className="card-flat p-4 text-sm text-soft">Semua janji sudah terkonfirmasi.</p>}
              {d.unconfirmed.slice(0, 4).map((a) => (
                <div key={a.id} className="card-flat flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{a.customer}</p>
                    <p className="text-sm text-soft">{fmtDateShort(a.date)} · {fmtTime(a.start)}</p>
                  </div>
                  <a className="btn btn-sm btn-lime" target="_blank" rel="noreferrer" href={waLink(a.phone, waMessage(a, svc(a.serviceId), settings.company, tech(a.techId), "konfirmasi"))}>💬 WA</a>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 font-display text-2xl font-extrabold">Waktunya servis lagi</h2>
            <p className="mb-3 text-sm text-soft">Pelanggan lama yang AC-nya sudah ±{settings.serviceCycleDays} hari sejak terakhir dicuci.</p>
            <div className="flex flex-col gap-2.5">
              {d.due.length === 0 && <p className="card-flat p-4 text-sm text-soft">Belum ada yang jatuh tempo.</p>}
              {d.due.map(({ a, days }) => (
                <div key={a.id} className="card-flat flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{a.customer}</p>
                    <p className="text-sm text-soft">{svc(a.serviceId)} · {days} hari lalu</p>
                  </div>
                  <a className="btn btn-sm" target="_blank" rel="noreferrer" href={waLink(a.phone, `Halo ${a.customer}, ini ${settings.company}. Sudah ${days} hari sejak AC Anda terakhir kami servis. Mau dijadwalkan cuci AC lagi? Balas chat ini, kami carikan jam yang cocok.`)}>💬 Tawarkan</a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <ApptSheet appt={open} onClose={() => setOpen(null)} />
    </div>
  );
}
