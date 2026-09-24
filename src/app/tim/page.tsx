"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmtTime } from "@/lib/schedule";
import type { Tech } from "@/lib/types";
import { PageHead, Sheet } from "@/components/ui";

const COLORS = ["#ffd166", "#9be7c4", "#ffb3c1", "#b9c4ff", "#f4a6ff", "#ffc38a", "#a5e8f2"];
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function Tim() {
  const { techs, appts, settings, today, nowMin, saveTech, removeTech, setSettings, resetDemo } = useStore();
  const [edit, setEdit] = useState<Tech | null>(null);
  const set = <K extends keyof Tech>(k: K, v: Tech[K]) => setEdit((e) => (e ? { ...e, [k]: v } : e));
  const span = settings.closeMin - settings.openMin;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead kicker="Orang lapangan" title="Tim teknisi">
        <button className="btn btn-lime" onClick={() => setEdit({ id: "t" + Math.random().toString(36).slice(2, 6), name: "", area: "", phone: "", color: COLORS[techs.length % COLORS.length], offDay: 0 })}>＋ Teknisi</button>
      </PageHead>

      <div className="grid gap-4 sm:grid-cols-2">
        {techs.map((t) => {
          const mine = appts.filter((a) => a.techId === t.id && a.date === today && a.status !== "batal");
          const load = Math.min(100, Math.round((mine.reduce((s, a) => s + a.duration + settings.buffer, 0) / span) * 100));
          const now = mine.find((a) => a.start <= nowMin && nowMin < a.start + a.duration);
          return (
            <button key={t.id} onClick={() => setEdit(t)} className="card p-5 text-left transition hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink font-display text-2xl font-extrabold" style={{ background: t.color }}>{t.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-2xl font-extrabold leading-none">{t.name}</span>
                  <span className="block truncate text-sm text-soft">{t.area} · libur {t.offDay === null ? "—" : DAYS[t.offDay]}</span>
                </span>
                <span className={`tag ${now ? "bg-lime" : "bg-card"}`}>{now ? "Di lokasi" : "Standby"}</span>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs font-bold"><span>Terisi hari ini</span><span>{load}% · {mine.length} job</span></div>
                <div className="h-4 overflow-hidden rounded-full border-2 border-ink bg-white"><div className="h-full" style={{ width: `${load}%`, background: t.color }} /></div>
              </div>
            </button>
          );
        })}
      </div>

      <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold">Aturan jadwal</h2>
      <div className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4"><label className="label" htmlFor="co">Nama perusahaan (muncul di pesan WA)</label><input id="co" className="field" value={settings.company} onChange={(e) => setSettings({ ...settings, company: e.target.value })} /></div>
        <div><label className="label" htmlFor="op">Buka</label><input id="op" type="time" className="field" value={fmtTime(settings.openMin)} onChange={(e) => { const [h, m] = e.target.value.split(":").map(Number); if (!isNaN(h)) setSettings({ ...settings, openMin: h * 60 + m }); }} /></div>
        <div><label className="label" htmlFor="cl">Tutup</label><input id="cl" type="time" className="field" value={fmtTime(settings.closeMin)} onChange={(e) => { const [h, m] = e.target.value.split(":").map(Number); if (!isNaN(h)) setSettings({ ...settings, closeMin: h * 60 + m }); }} /></div>
        <div><label className="label" htmlFor="bf">Jeda perjalanan (menit)</label><input id="bf" type="number" inputMode="numeric" step={15} min={0} className="field" value={settings.buffer} onChange={(e) => setSettings({ ...settings, buffer: Math.max(0, +e.target.value) })} /></div>
        <div><label className="label" htmlFor="cy">Siklus servis (hari)</label><input id="cy" type="number" inputMode="numeric" min={30} className="field" value={settings.serviceCycleDays} onChange={(e) => setSettings({ ...settings, serviceCycleDays: Math.max(30, +e.target.value) })} /></div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/layanan" className="btn">Atur layanan & harga →</Link>
        <button className="btn btn-sm" onClick={() => { if (confirm("Kembalikan semua data ke contoh awal?")) resetDemo(); }}>Reset data demo</button>
      </div>

      <Sheet open={!!edit} onClose={() => setEdit(null)} title={edit && techs.some((t) => t.id === edit.id) ? "Ubah teknisi" : "Teknisi baru"}>
        {edit && (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (edit.name.trim()) { saveTech(edit); setEdit(null); } }}>
            <div><label className="label" htmlFor="tn">Nama</label><input id="tn" className="field" value={edit.name} onChange={(e) => set("name", e.target.value)} required /></div>
            <div><label className="label" htmlFor="ta">Wilayah</label><input id="ta" className="field" value={edit.area} onChange={(e) => set("area", e.target.value)} /></div>
            <div><label className="label" htmlFor="tp">No. HP</label><input id="tp" className="field font-mono" inputMode="tel" value={edit.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><label className="label" htmlFor="to">Hari libur</label>
              <select id="to" className="field" value={edit.offDay ?? ""} onChange={(e) => set("offDay", e.target.value === "" ? null : +e.target.value)}>
                <option value="">Tidak ada</option>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
            </div>
            <div><span className="label">Warna di jadwal</span><div className="flex gap-2">{COLORS.map((c) => <button type="button" key={c} aria-label={c} onClick={() => set("color", c)} className={`h-9 w-9 rounded-full border-2 border-ink ${edit.color === c ? "ring-4 ring-lime" : ""}`} style={{ background: c }} />)}</div></div>
            <div className="flex gap-2">
              <button className="btn btn-lime flex-1" type="submit">Simpan</button>
              {techs.some((t) => t.id === edit.id) && techs.length > 1 && <button type="button" className="btn btn-coral" onClick={() => { if (confirm("Hapus teknisi? Janji lamanya tetap tersimpan.")) { removeTech(edit.id); setEdit(null); } }}>Hapus</button>}
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
