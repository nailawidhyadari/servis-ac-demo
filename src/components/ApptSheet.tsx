"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmtDate, fmtTime, rupiah, waLink } from "@/lib/schedule";
import type { Appt, Status } from "@/lib/types";
import { Sheet, StatusTag } from "./ui";

export function waMessage(a: Appt, svcName: string, company: string, techName: string, kind: "konfirmasi" | "ingat") {
  const when = `${fmtDate(a.date)} pukul ${fmtTime(a.start)}`;
  if (kind === "konfirmasi")
    return `Halo ${a.customer}, ini ${company}. Janji ${svcName} (${a.units} unit AC) sudah kami catat: ${when}, teknisi ${techName}. Kalau mau ganti jadwal, balas chat ini ya.`;
  return `Halo ${a.customer}, pengingat dari ${company}: besok ${when} teknisi ${techName} datang untuk ${svcName}. Mohon pastikan ada orang di rumah. Terima kasih!`;
}

const flow: { to: Status; label: string; cls: string }[] = [
  { to: "konfirmasi", label: "Konfirmasi", cls: "btn-lime" },
  { to: "jalan", label: "Mulai kerja", cls: "btn-lime" },
  { to: "selesai", label: "Tandai selesai", cls: "btn-ink" },
];

export function ApptSheet({ appt, onClose }: { appt: Appt | null; onClose: () => void }) {
  const { services, techs, settings, setStatus } = useStore();
  if (!appt) return null;
  const svc = services.find((s) => s.id === appt.serviceId);
  const tech = techs.find((t) => t.id === appt.techId);
  const price = (svc?.price ?? 0) * appt.units;
  const next = appt.status === "baru" ? flow[0] : appt.status === "konfirmasi" ? flow[1] : appt.status === "jalan" ? flow[2] : null;
  const closed = appt.status === "selesai" || appt.status === "batal";

  return (
    <Sheet open onClose={onClose} title={appt.customer}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusTag s={appt.status} />
        <span className="tag bg-card">{svc?.emoji} {svc?.name}</span>
        <span className="tag bg-card">{appt.units} unit</span>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="font-bold text-soft">Waktu</dt>
        <dd className="font-bold">{fmtDate(appt.date)}, {fmtTime(appt.start)}–{fmtTime(appt.start + appt.duration)}</dd>
        <dt className="font-bold text-soft">Teknisi</dt>
        <dd className="font-bold"><span className="mr-2 inline-block h-3 w-3 rounded-full border-2 border-ink align-middle" style={{ background: tech?.color }} />{tech?.name ?? "-"}</dd>
        <dt className="font-bold text-soft">Alamat</dt>
        <dd>{appt.address}</dd>
        <dt className="font-bold text-soft">HP</dt>
        <dd className="font-mono">{appt.phone}</dd>
        <dt className="font-bold text-soft">Estimasi</dt>
        <dd className="font-bold">{rupiah(price)}</dd>
        {appt.notes && (<><dt className="font-bold text-soft">Catatan</dt><dd>{appt.notes}</dd></>)}
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        {next && <button className={`btn ${next.cls}`} onClick={() => { setStatus(appt.id, next.to); onClose(); }}>{next.label}</button>}
        <a className="btn" target="_blank" rel="noreferrer" href={waLink(appt.phone, waMessage(appt, svc?.name ?? "service AC", settings.company, tech?.name ?? "kami", appt.status === "baru" ? "konfirmasi" : "ingat"))}>
          💬 {appt.status === "baru" ? "Kirim konfirmasi" : "Ingatkan via WA"}
        </a>
        {!closed && <Link className="btn" href={`/janji?edit=${appt.id}`}>Ubah jadwal</Link>}
        {!closed && <button className="btn btn-coral" onClick={() => { if (confirm("Batalkan janji ini? Slot langsung kosong lagi.")) { setStatus(appt.id, "batal"); onClose(); } }}>Batalkan</button>}
        {appt.status === "batal" && <button className="btn" onClick={() => { setStatus(appt.id, "baru"); onClose(); }}>Aktifkan lagi</button>}
      </div>
    </Sheet>
  );
}
