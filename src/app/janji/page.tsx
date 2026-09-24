"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { autoTech, durationOf, fmtDate, fmtTime, findConflict, findCustomerClash, isOff, outsideHours, rupiah, waLink, nextOpening } from "@/lib/schedule";
import type { Appt } from "@/lib/types";
import { PageHead } from "@/components/ui";
import { waMessage } from "@/components/ApptSheet";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-6">Memuat…</p>}>
      <Form />
    </Suspense>
  );
}

function Form() {
  const sp = useSearchParams();
  const router = useRouter();
  const { appts, techs, services, settings, today, nowMin, addAppt, updateAppt } = useStore();
  const editing = appts.find((a) => a.id === sp.get("edit")) ?? null;

  const [name, setName] = useState(editing?.customer ?? "");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [address, setAddress] = useState(editing?.address ?? "");
  const [serviceId, setServiceId] = useState(editing?.serviceId ?? services[0].id);
  const [units, setUnits] = useState(editing?.units ?? 1);
  const [date, setDate] = useState(editing?.date ?? sp.get("date") ?? today);
  const [techId, setTechId] = useState<string>(editing?.techId ?? sp.get("tech") ?? "auto");
  const [start, setStart] = useState<number | null>(editing ? editing.start : sp.get("start") ? Number(sp.get("start")) : null);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [done, setDone] = useState<Appt | null>(null);
  const [tried, setTried] = useState(false);

  const svc = services.find((s) => s.id === serviceId) ?? services[0];
  const duration = durationOf(svc, units);
  const ignoreId = editing?.id;

  const known = useMemo(() => {
    const m = new Map<string, Appt>();
    for (const a of appts) m.set(a.phone, a);
    return [...m.values()];
  }, [appts]);

  const slotState = useMemo(() => {
    const out: { s: number; free: boolean }[] = [];
    for (let s = settings.openMin; s + duration <= settings.closeMin; s += 30) {
      const past = date === today && s < nowMin - 15 && !editing;
      let free = false;
      if (!past) {
        free = techId === "auto"
          ? techs.some((t) => !isOff(t, date) && !findConflict(appts, settings, { techId: t.id, date, start: s, duration, ignoreId }))
          : (() => { const t = techs.find((x) => x.id === techId); return !!t && !isOff(t, date) && !findConflict(appts, settings, { techId, date, start: s, duration, ignoreId }); })();
      }
      out.push({ s, free });
    }
    return out;
  }, [appts, techs, settings, date, techId, duration, today, nowMin, editing, ignoreId]);

  const chosenTech = start === null ? null : techId === "auto" ? autoTech(appts, techs, settings, { date, start, duration }) : techs.find((t) => t.id === techId) ?? null;
  const conflict = start !== null && techId !== "auto" ? findConflict(appts, settings, { techId, date, start, duration, ignoreId }) : null;
  const clash = start !== null ? findCustomerClash(appts, { phone, date, start, duration, ignoreId }) : null;
  const offHit = techId !== "auto" ? (() => { const t = techs.find((x) => x.id === techId); return t ? isOff(t, date) : false; })() : false;
  const tooLate = start !== null && outsideHours(settings, start, duration);
  const slotOk = start !== null && !conflict && !offHit && !tooLate && !!chosenTech;
  const alt = conflict && start !== null ? autoTech(appts, techs, settings, { date, start, duration }) : null;
  const nearest = start !== null && !slotOk ? nextOpening(appts, techs, settings, date, duration, date === today ? nowMin : 0, today) : null;

  const valid = name.trim() && phone.replace(/\D/g, "").length >= 9 && address.trim();
  const price = svc.price * units;

  function submit() {
    setTried(true);
    if (!valid || !slotOk || !chosenTech || start === null) return;
    const payload = { customer: name.trim(), phone: phone.trim(), address: address.trim(), serviceId, units, techId: chosenTech.id, date, start, duration, notes: notes.trim() };
    if (editing) { updateAppt(editing.id, payload); router.push("/jadwal"); return; }
    setDone(addAppt({ ...payload, status: "baru" }));
  }

  if (done) {
    const t = techs.find((x) => x.id === done.techId);
    return (
      <div className="pop mx-auto max-w-xl pt-6 text-center">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border-2 border-ink bg-lime text-4xl shadow-[4px_4px_0_var(--ink)]">✓</div>
        <h1 className="font-display text-4xl font-extrabold">Janji tercatat, aman!</h1>
        <p className="mx-auto mt-3 max-w-md text-soft">{done.customer} dijadwalkan {fmtDate(done.date)} pukul {fmtTime(done.start)} bersama {t?.name}. Tidak ada tumpang tindih.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a className="btn btn-lime" target="_blank" rel="noreferrer" href={waLink(done.phone, waMessage(done, svc.name, settings.company, t?.name ?? "kami", "konfirmasi"))}>💬 Kirim konfirmasi WA</a>
          <Link className="btn" href="/jadwal">Lihat jadwal</Link>
          <button className="btn" onClick={() => { setDone(null); setName(""); setPhone(""); setAddress(""); setNotes(""); setStart(null); setTried(false); }}>Tambah lagi</button>
        </div>
      </div>
    );
  }

  const err = (bad: boolean) => (tried && bad ? "!border-coral shake" : "");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead kicker={editing ? "Ubah jadwal" : "Janji baru"} title={editing ? `Geser jadwal ${editing.customer.split(" ")[0]}` : "Catat janji service"} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-xl font-extrabold">1. Siapa & di mana</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="nm">Nama pelanggan</label>
                <input id="nm" className={`field ${err(!name.trim())}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Bu Rina" autoComplete="off" />
              </div>
              <div>
                <label className="label" htmlFor="hp">No. WhatsApp</label>
                <input id="hp" className={`field font-mono ${err(phone.replace(/\D/g, "").length < 9)}`} inputMode="tel" value={phone} list="known" placeholder="0812-…"
                  onChange={(e) => {
                    setPhone(e.target.value);
                    const k = known.find((x) => x.phone === e.target.value);
                    if (k) { setName(k.customer); setAddress(k.address); }
                  }} />
                <datalist id="known">{known.map((k) => <option key={k.phone} value={k.phone}>{k.customer}</option>)}</datalist>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="ad">Alamat</label>
                <input id="ad" className={`field ${err(!address.trim())}`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. …, Bandung" />
              </div>
            </div>
            <p className="mt-3 text-xs text-soft">Ketik nomor pelanggan lama, nama & alamat terisi otomatis.</p>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-xl font-extrabold">2. Kerjaan apa</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button key={s.id} className="chip" data-on={s.id === serviceId} onClick={() => setServiceId(s.id)}>{s.emoji} {s.name}</button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-4">
              <span className="label !mb-0">Jumlah unit AC</span>
              <div className="flex items-center gap-2">
                <button className="btn btn-sm" onClick={() => setUnits(Math.max(1, units - 1))} aria-label="Kurangi">−</button>
                <span className="w-8 text-center font-display text-2xl font-extrabold">{units}</span>
                <button className="btn btn-sm" onClick={() => setUnits(Math.min(10, units + 1))} aria-label="Tambah">＋</button>
              </div>
              <span className="font-mono text-sm text-soft">≈ {Math.floor(duration / 60)}j {duration % 60 ? `${duration % 60}m` : ""}</span>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-xl font-extrabold">3. Kapan & siapa teknisinya</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="dt">Tanggal</label>
                <input id="dt" type="date" className="field" min={today} value={date} onChange={(e) => { setDate(e.target.value); setStart(null); }} />
              </div>
              <div>
                <label className="label" htmlFor="tc">Teknisi</label>
                <select id="tc" className="field" value={techId} onChange={(e) => setTechId(e.target.value)}>
                  <option value="auto">✨ Otomatis (yang kosong)</option>
                  {techs.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.area}{isOff(t, date) ? " (libur)" : ""}</option>)}
                </select>
              </div>
            </div>
            <p className="label mt-5">Pilih jam mulai</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slotState.map(({ s, free }) => (
                <button key={s} disabled={!free && start !== s} onClick={() => setStart(s)} aria-pressed={start === s}
                  className={`min-h-11 rounded-xl border-2 border-ink font-mono text-sm font-medium transition ${start === s ? (slotOk ? "bg-ink text-paper" : "bg-coral") : free ? "bg-white hover:bg-lime" : "bg-transparent text-soft/60 line-through opacity-50"}`}>
                  {fmtTime(s)}
                </button>
              ))}
              {slotState.length === 0 && <p className="col-span-full text-sm text-soft">Durasi terlalu panjang untuk satu hari kerja.</p>}
            </div>
            <p className="mt-2 text-xs text-soft">Jam yang dicoret sudah dipakai atau bentrok dengan jeda perjalanan {settings.buffer} menit.</p>

            {(conflict || offHit || tooLate || clash || (start !== null && !chosenTech && techId === "auto")) && (
              <div className="shake mt-4 rounded-2xl border-2 border-ink bg-[#ffd0c7] p-4" role="alert">
                <p className="font-display text-lg font-extrabold">⚠️ Bentrok!</p>
                {conflict && <p className="text-sm">{techs.find((t) => t.id === techId)?.name} sudah ada janji {conflict.customer} pukul {fmtTime(conflict.start)}–{fmtTime(conflict.start + conflict.duration)} (plus jeda {settings.buffer} menit).</p>}
                {offHit && <p className="text-sm">Teknisi ini libur di hari tersebut.</p>}
                {tooLate && <p className="text-sm">Selesainya lewat jam kerja ({fmtTime(settings.closeMin)}).</p>}
                {techId === "auto" && !chosenTech && start !== null && <p className="text-sm">Semua teknisi terpakai di jam itu.</p>}
                {clash && <p className="text-sm">Nomor ini sudah punya janji lain di jam yang sama: {clash.customer}.</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {alt && <button className="btn btn-sm btn-lime" onClick={() => setTechId(alt.id)}>Pakai {alt.name} (kosong)</button>}
                  {nearest && <button className="btn btn-sm" onClick={() => { setDate(nearest.date); setTechId(techId === "auto" ? "auto" : nearest.tech.id); setStart(nearest.start); }}>Jam kosong terdekat: {nearest.date === date ? "" : fmtDate(nearest.date) + ", "}{fmtTime(nearest.start)}</button>}
                </div>
              </div>
            )}

            <div className="mt-5">
              <label className="label" htmlFor="nt">Catatan (opsional)</label>
              <textarea id="nt" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="AC netes, lantai 2, ada anjing…" />
            </div>
          </section>
        </div>

        {/* Ringkasan */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card bg-frost p-5">
            <p className="font-mono text-xs uppercase tracking-widest">Ringkasan</p>
            <p className="mt-2 font-display text-2xl font-extrabold leading-tight">{svc.emoji} {svc.name} × {units}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4"><dt className="font-bold">Pelanggan</dt><dd className="truncate text-right">{name || "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="font-bold">Tanggal</dt><dd>{fmtDate(date)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="font-bold">Jam</dt><dd className="font-mono">{start === null ? "—" : `${fmtTime(start)}–${fmtTime(start + duration)}`}</dd></div>
              <div className="flex justify-between gap-4"><dt className="font-bold">Teknisi</dt><dd>{chosenTech?.name ?? "—"}</dd></div>
              <div className="flex justify-between gap-4 border-t-2 border-ink pt-3 text-base"><dt className="font-extrabold">Estimasi</dt><dd className="font-display text-2xl font-extrabold">{rupiah(price)}</dd></div>
            </dl>
            <button className={`btn mt-5 w-full ${slotOk && valid ? "btn-lime" : "btn-ink"}`} onClick={submit}>
              {editing ? "Simpan jadwal baru" : "Simpan janji"}
            </button>
            {tried && !valid && <p className="mt-2 text-sm font-bold">Lengkapi nama, WhatsApp, dan alamat dulu.</p>}
            {tried && valid && start === null && <p className="mt-2 text-sm font-bold">Pilih jam mulai dulu.</p>}
            {!editing && start === null && <p className="mt-3 text-xs text-ink/70">Sistem cek bentrok otomatis setiap kamu pilih jam.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
