"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { fmtDateShort, rupiah, waLink } from "@/lib/schedule";
import type { Appt } from "@/lib/types";
import { PageHead } from "@/components/ui";
import { ApptRow } from "@/components/ApptRow";
import { ApptSheet } from "@/components/ApptSheet";

export default function Pelanggan() {
  const { appts, services, settings, today } = useStore();
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Appt | null>(null);

  const list = useMemo(() => {
    const m = new Map<string, Appt[]>();
    for (const a of appts) m.set(a.phone, [...(m.get(a.phone) ?? []), a]);
    return [...m.entries()]
      .map(([phone, all]) => {
        const sorted = [...all].sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
        const done = sorted.filter((a) => a.status === "selesai");
        const spent = done.reduce((s, a) => s + (services.find((x) => x.id === a.serviceId)?.price ?? 0) * a.units, 0);
        const nextAppt = sorted.filter((a) => a.date >= today && a.status !== "batal").at(-1);
        return { phone, name: sorted[0].customer, address: sorted[0].address, sorted, done, spent, nextAppt };
      })
      .filter((c) => (c.name + c.phone + c.address).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.spent - a.spent);
  }, [appts, services, q, today]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHead kicker={`${list.length} pelanggan`} title="Buku pelanggan" />
      <input className="field mb-5" placeholder="Cari nama, nomor, atau alamat…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari pelanggan" />
      <div className="flex flex-col gap-3">
        {list.map((c) => {
          const on = openKey === c.phone;
          const last = c.done[0];
          return (
            <div key={c.phone} className="card overflow-hidden">
              <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setOpenKey(on ? null : c.phone)} aria-expanded={on}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-lime font-display text-xl font-extrabold">{c.name.replace(/^(Bu|Pak|Mas|Kak|Dr\.)\s/, "")[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xl font-extrabold">{c.name}</span>
                  <span className="block truncate text-sm text-soft">{c.address}</span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block font-bold">{c.done.length}× servis</span>
                  <span className="block text-sm text-soft">{rupiah(c.spent)}</span>
                </span>
                <span className="text-xl">{on ? "−" : "＋"}</span>
              </button>
              {on && (
                <div className="border-t-2 border-ink bg-paper/60 p-4">
                  <div className="mb-3 flex flex-wrap gap-2 text-sm">
                    <span className="tag bg-card font-mono">{c.phone}</span>
                    {last && <span className="tag bg-frost">Terakhir {fmtDateShort(last.date)}</span>}
                    {c.nextAppt ? <span className="tag bg-lime">Berikutnya {fmtDateShort(c.nextAppt.date)}</span> : <span className="tag bg-[#ffe9a8]">Belum ada janji</span>}
                    <span className="tag bg-card sm:hidden">{rupiah(c.spent)}</span>
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <a className="btn btn-sm btn-lime" target="_blank" rel="noreferrer" href={waLink(c.phone, `Halo ${c.name}, ini ${settings.company}. Ada yang bisa kami bantu untuk AC-nya?`)}>💬 Chat WhatsApp</a>
                    <Link className="btn btn-sm" href="/janji">＋ Janji baru</Link>
                  </div>
                  <p className="label">Riwayat</p>
                  <div className="flex flex-col gap-2">
                    {c.sorted.slice(0, 6).map((a) => <ApptRow key={a.id} a={a} onOpen={setSheet} showDate={fmtDateShort(a.date)} />)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {list.length === 0 && <p className="card-flat p-6 text-center text-soft">Tidak ada yang cocok.</p>}
      </div>
      <ApptSheet appt={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}
