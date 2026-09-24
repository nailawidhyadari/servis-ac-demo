"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { rupiah } from "@/lib/schedule";
import type { Service } from "@/lib/types";
import { PageHead, Sheet } from "@/components/ui";

const blank = (): Service => ({ id: "s" + Math.random().toString(36).slice(2, 7), name: "", short: "", desc: "", baseMin: 60, extraMin: 45, price: 100000, emoji: "🛠️" });

export default function Layanan() {
  const { services, saveService, removeService, appts } = useStore();
  const [edit, setEdit] = useState<Service | null>(null);
  const set = <K extends keyof Service>(k: K, v: Service[K]) => setEdit((e) => (e ? { ...e, [k]: v } : e));
  const used = (id: string) => appts.some((a) => a.serviceId === id);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead kicker="Daftar harga & durasi" title="Layanan">
        <button className="btn btn-lime" onClick={() => setEdit(blank())}>＋ Layanan</button>
      </PageHead>
      <p className="mb-5 max-w-xl text-soft">Durasi di sini yang dipakai sistem buat menghitung blok waktu. Makin akurat, makin jarang bentrok.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => (
          <button key={s.id} onClick={() => setEdit(s)} className="card p-5 text-left transition hover:-translate-y-1" style={{ rotate: `${(i % 3 - 1) * 0.4}deg` }}>
            <span className="text-3xl">{s.emoji}</span>
            <h2 className="mt-2 font-display text-2xl font-extrabold">{s.name}</h2>
            <p className="mt-1 min-h-10 text-sm text-soft">{s.desc}</p>
            <div className="mt-4 flex items-end justify-between">
              <span className="font-display text-2xl font-extrabold">{rupiah(s.price)}<span className="text-sm font-bold text-soft">/unit</span></span>
              <span className="tag bg-frost">{s.baseMin} mnt</span>
            </div>
          </button>
        ))}
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit && services.some((s) => s.id === edit.id) ? "Ubah layanan" : "Layanan baru"}>
        {edit && (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (edit.name.trim()) { saveService({ ...edit, short: edit.short || edit.name.split(" ")[0] }); setEdit(null); } }}>
            <div className="grid grid-cols-[72px_1fr] gap-3">
              <div><label className="label" htmlFor="em">Ikon</label><input id="em" className="field text-center" value={edit.emoji} onChange={(e) => set("emoji", e.target.value)} /></div>
              <div><label className="label" htmlFor="sn">Nama</label><input id="sn" className="field" value={edit.name} onChange={(e) => set("name", e.target.value)} required /></div>
            </div>
            <div><label className="label" htmlFor="sd">Deskripsi</label><input id="sd" className="field" value={edit.desc} onChange={(e) => set("desc", e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label" htmlFor="sp">Harga/unit</label><input id="sp" type="number" inputMode="numeric" className="field" value={edit.price} onChange={(e) => set("price", +e.target.value)} /></div>
              <div><label className="label" htmlFor="sb">Menit unit 1</label><input id="sb" type="number" inputMode="numeric" step={15} className="field" value={edit.baseMin} onChange={(e) => set("baseMin", +e.target.value)} /></div>
              <div><label className="label" htmlFor="sx">+Menit/unit</label><input id="sx" type="number" inputMode="numeric" step={15} className="field" value={edit.extraMin} onChange={(e) => set("extraMin", +e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-lime flex-1" type="submit">Simpan</button>
              {services.some((s) => s.id === edit.id) && services.length > 1 && (
                <button type="button" className="btn btn-coral" onClick={() => { if (used(edit.id) ? confirm("Layanan ini sudah dipakai di janji lama. Tetap hapus?") : true) { removeService(edit.id); setEdit(null); } }}>Hapus</button>
              )}
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
