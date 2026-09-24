import type { Appt, Service, Settings, Tech } from "./types";

export const pad = (n: number) => String(n).padStart(2, "0");
export const fmtTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (k: string, n: number) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};
export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const dayName = (k: string) => DAYS[fromKey(k).getDay()];
export const fmtDate = (k: string) => {
  const d = fromKey(k);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const fmtDateShort = (k: string) => {
  const d = fromKey(k);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const durationOf = (s: Service, units: number) => s.baseMin + Math.max(0, units - 1) * s.extraMin;

export const isOff = (t: Tech, date: string) => t.offDay !== null && fromKey(date).getDay() === t.offDay;

const active = (a: Appt) => a.status !== "batal";

/** Job A dan B bentrok bila blok (durasi + jeda) saling menimpa. */
export function findConflict(
  appts: Appt[],
  cfg: Settings,
  q: { techId: string; date: string; start: number; duration: number; ignoreId?: string },
): Appt | null {
  const qEnd = q.start + q.duration;
  for (const a of appts) {
    if (!active(a) || a.id === q.ignoreId || a.techId !== q.techId || a.date !== q.date) continue;
    const aEnd = a.start + a.duration;
    if (q.start < aEnd + cfg.buffer && a.start < qEnd + cfg.buffer) return a;
  }
  return null;
}

export function findCustomerClash(
  appts: Appt[],
  q: { phone: string; date: string; start: number; duration: number; ignoreId?: string },
): Appt | null {
  const p = q.phone.replace(/\D/g, "");
  if (p.length < 6) return null;
  for (const a of appts) {
    if (!active(a) || a.id === q.ignoreId || a.date !== q.date) continue;
    if (a.phone.replace(/\D/g, "") !== p) continue;
    if (q.start < a.start + a.duration && a.start < q.start + q.duration) return a;
  }
  return null;
}

export function outsideHours(cfg: Settings, start: number, duration: number) {
  return start < cfg.openMin || start + duration > cfg.closeMin;
}

/** Semua jam mulai (kelipatan 30 menit) yang aman untuk satu teknisi. */
export function freeStarts(
  appts: Appt[],
  cfg: Settings,
  q: { techId: string; date: string; duration: number; ignoreId?: string },
  tech: Tech,
): number[] {
  if (isOff(tech, q.date)) return [];
  const out: number[] = [];
  for (let s = cfg.openMin; s + q.duration <= cfg.closeMin; s += 30) {
    if (!findConflict(appts, cfg, { ...q, start: s })) out.push(s);
  }
  return out;
}

/** Cari teknisi yang kosong di jam tsb, yang paling sedikit jobnya hari itu. */
export function autoTech(
  appts: Appt[],
  techs: Tech[],
  cfg: Settings,
  q: { date: string; start: number; duration: number },
): Tech | null {
  const load = (t: Tech) => appts.filter((a) => active(a) && a.techId === t.id && a.date === q.date).length;
  const ok = techs
    .filter((t) => !isOff(t, q.date) && !findConflict(appts, cfg, { techId: t.id, ...q }))
    .sort((a, b) => load(a) - load(b));
  return ok[0] ?? null;
}

/** Jam terdekat berikutnya (teknisi mana pun) mulai dari tanggal tertentu. */
export function nextOpening(
  appts: Appt[],
  techs: Tech[],
  cfg: Settings,
  from: string,
  duration: number,
  nowMin: number,
  today: string,
) {
  for (let i = 0; i < 14; i++) {
    const date = addDays(from, i);
    for (let s = cfg.openMin; s + duration <= cfg.closeMin; s += 30) {
      if (date === today && s < nowMin) continue;
      const t = autoTech(appts, techs, cfg, { date, start: s, duration });
      if (t) return { date, start: s, tech: t };
    }
  }
  return null;
}

export const STATUS_LABEL: Record<Appt["status"], string> = {
  baru: "Baru",
  konfirmasi: "Terkonfirmasi",
  jalan: "Dikerjakan",
  selesai: "Selesai",
  batal: "Batal",
};

export function waLink(phone: string, text: string) {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
}
