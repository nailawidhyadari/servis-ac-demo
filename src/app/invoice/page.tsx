"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { fmtDate, fmtTime, rupiah } from "@/lib/schedule";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Invoice />
    </Suspense>
  );
}

function Invoice() {
  const id = useSearchParams().get("id");
  const { appts, services, techs, settings } = useStore();
  const a = appts.find((x) => x.id === id);
  const [discount, setDiscount] = useState(0);
  const [transport, setTransport] = useState(0);
  const [paid, setPaid] = useState(false);

  if (!a) return <p className="p-6">Janji tidak ditemukan. <Link className="underline" href="/jadwal">Kembali</Link></p>;
  const svc = services.find((s) => s.id === a.serviceId);
  const tech = techs.find((t) => t.id === a.techId);
  const sub = (svc?.price ?? 0) * a.units;
  const total = Math.max(0, sub + transport - discount);
  const no = `INV/${a.date.replaceAll("-", "")}/${a.id.replace(/\D/g, "").padStart(3, "0").slice(-3) || a.id.slice(-3).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex flex-wrap items-center gap-3 print:hidden">
        <Link href="/jadwal" className="btn btn-sm">← Kembali</Link>
        <button className="btn btn-lime" onClick={() => window.print()}>🖨️ Cetak / Simpan PDF</button>
        <div className="flex items-center gap-2">
          <label className="label !mb-0" htmlFor="tr">Transport</label>
          <input id="tr" type="number" inputMode="numeric" className="field !min-h-9 w-28" value={transport || ""} onChange={(e) => setTransport(+e.target.value)} placeholder="0" />
          <label className="label !mb-0" htmlFor="ds">Diskon</label>
          <input id="ds" type="number" inputMode="numeric" className="field !min-h-9 w-28" value={discount || ""} onChange={(e) => setDiscount(+e.target.value)} placeholder="0" />
          <button className="chip" data-on={paid} onClick={() => setPaid(!paid)}>Lunas</button>
        </div>
      </div>

      <article className="card p-6 md:p-10 print:!rounded-none print:!border-0 print:!p-0 print:!shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-6">
          <div>
            <p className="font-display text-3xl font-extrabold">{settings.company}</p>
            <p className="text-sm text-soft">Jasa service & instalasi AC</p>
          </div>
          <div className="text-right">
            <p className="font-display text-4xl font-extrabold tracking-tight">INVOICE</p>
            <p className="font-mono text-sm">{no}</p>
            <span className={`tag mt-2 ${paid ? "bg-lime" : "bg-[#ffe9a8]"}`}>{paid ? "Lunas" : "Belum dibayar"}</span>
          </div>
        </header>

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="label">Ditagihkan ke</p>
            <p className="font-bold">{a.customer}</p>
            <p className="text-sm">{a.address}</p>
            <p className="font-mono text-sm">{a.phone}</p>
          </div>
          <div className="sm:text-right">
            <p className="label">Pengerjaan</p>
            <p className="font-bold">{fmtDate(a.date)}, {fmtTime(a.start)}–{fmtTime(a.start + a.duration)}</p>
            <p className="text-sm">Teknisi: {tech?.name ?? "-"}</p>
          </div>
        </section>

        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-y-2 border-ink text-xs uppercase tracking-wider">
              <th className="py-2">Layanan</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Harga</th><th className="py-2 text-right">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ink/30">
              <td className="py-3 font-bold">{svc?.name}<span className="block text-xs font-normal text-soft">{svc?.desc}</span></td>
              <td className="py-3 text-right">{a.units}</td>
              <td className="py-3 text-right">{rupiah(svc?.price ?? 0)}</td>
              <td className="py-3 text-right font-bold">{rupiah(sub)}</td>
            </tr>
            {transport > 0 && <tr className="border-b border-ink/30"><td className="py-3" colSpan={3}>Transport</td><td className="py-3 text-right">{rupiah(transport)}</td></tr>}
            {discount > 0 && <tr className="border-b border-ink/30"><td className="py-3" colSpan={3}>Diskon</td><td className="py-3 text-right">−{rupiah(discount)}</td></tr>}
          </tbody>
        </table>

        <div className="mt-5 flex items-center justify-between rounded-2xl border-2 border-ink bg-lime px-5 py-4 print:bg-transparent">
          <span className="font-extrabold uppercase tracking-wider">Total</span>
          <span className="font-display text-3xl font-extrabold">{rupiah(total)}</span>
        </div>
        {a.notes && <p className="mt-5 text-sm"><b>Catatan:</b> {a.notes}</p>}
        <p className="mt-8 text-center text-xs text-soft">Terima kasih sudah mempercayakan AC Anda kepada {settings.company}. Garansi pengerjaan 7 hari.</p>
      </article>
    </div>
  );
}
