import type { Appt, Service, Settings, Tech } from "./types";
import { addDays, durationOf, findConflict } from "./schedule";

export const defaultSettings: Settings = {
  company: "Sejuk Abadi Service",
  openMin: 8 * 60,
  closeMin: 18 * 60,
  buffer: 30,
  serviceCycleDays: 90,
};

export const defaultServices: Service[] = [
  { id: "cuci", name: "Cuci AC", short: "Cuci", desc: "Bersihin indoor, outdoor, filter, dan evaporator.", baseMin: 60, extraMin: 45, price: 85000, emoji: "🫧" },
  { id: "freon", name: "Isi Freon", short: "Freon", desc: "Cek tekanan lalu isi ulang R32 / R410A.", baseMin: 60, extraMin: 45, price: 250000, emoji: "❄️" },
  { id: "bongkar", name: "Bongkar Pasang", short: "Pindah", desc: "Lepas dan pasang ulang unit di lokasi baru.", baseMin: 150, extraMin: 120, price: 450000, emoji: "🔧" },
  { id: "pasang", name: "Pasang Baru", short: "Pasang", desc: "Instalasi unit baru, pipa 3 meter, vakum.", baseMin: 150, extraMin: 120, price: 350000, emoji: "🆕" },
  { id: "servis", name: "Perbaikan / Servis", short: "Servis", desc: "Bocor, tidak dingin, berisik, atau error kode.", baseMin: 90, extraMin: 60, price: 150000, emoji: "🩺" },
  { id: "rutin", name: "Paket Rutin (kantor)", short: "Rutin", desc: "Perawatan berkala unit kantor atau toko.", baseMin: 45, extraMin: 30, price: 70000, emoji: "🏢" },
];

export const defaultTechs: Tech[] = [
  { id: "t1", name: "Andi", area: "Bandung Timur", phone: "0812-2000-0001", color: "#ffd166", offDay: 0 },
  { id: "t2", name: "Bayu", area: "Bandung Barat", phone: "0812-2000-0002", color: "#9be7c4", offDay: 0 },
  { id: "t3", name: "Rizki", area: "Bandung Utara", phone: "0812-2000-0003", color: "#ffb3c1", offDay: 1 },
  { id: "t4", name: "Dimas", area: "Cimahi & KBB", phone: "0812-2000-0004", color: "#b9c4ff", offDay: 0 },
];

const people: [string, string, string][] = [
  ["Bu Rina Marlina", "0812-3345-1102", "Jl. Cihampelas 88, Bandung"],
  ["Pak Hendra", "0821-5567-2210", "Komp. Buah Batu Regency C4"],
  ["Toko Kopi Senja", "0813-7788-4409", "Jl. Braga 21, Bandung"],
  ["Dr. Sinta Klinik", "0857-1122-3390", "Jl. Setiabudi 145, Bandung"],
  ["Kak Dewi Anggraini", "0812-9090-7781", "Apartemen Gateway, Ujungberung"],
  ["Pak Yusuf Hasan", "0819-2233-6640", "Jl. Antapani 12, Bandung"],
  ["Bu Lilis", "0878-4455-1023", "Jl. Sukajadi 210, Bandung"],
  ["Kantor Notaris Mega", "0822-3300-9188", "Jl. Riau 34, Bandung"],
  ["Mas Fajar", "0856-7701-2245", "Perum Cibiru Indah B9"],
  ["Bu Ratna", "0811-2200-3391", "Jl. Dipatiukur 77, Bandung"],
  ["Studio Foto Lensa", "0838-9001-7723", "Jl. Ganesha 5, Bandung"],
  ["Pak Wawan", "0877-1234-5566", "Jl. Rancabolang 19, Bandung"],
];

const notes = ["", "", "Ada anjing, tolong bel dulu", "AC 1 PK, sering netes", "Lantai 2, perlu tangga", "", "Bawa freon R32", ""];

export function makeSeed(today: string): Appt[] {
  const out: Appt[] = [];
  let n = 0;
  let r = 7;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const starts = [8 * 60, 9 * 60 + 30, 11 * 60, 13 * 60, 14 * 60 + 30, 16 * 60];
  for (let d = -12; d <= 6; d++) {
    const date = addDays(today, d);
    const perDay = d === 0 ? 7 : 3 + Math.floor(rnd() * 4);
    for (let i = 0; i < perDay; i++) {
      const tech = defaultTechs[Math.floor(rnd() * defaultTechs.length)];
      const svc = defaultServices[Math.floor(rnd() * 5)];
      const units = 1 + Math.floor(rnd() * 3);
      const duration = durationOf(svc, units);
      const start = starts[Math.floor(rnd() * starts.length)];
      if (start + duration > defaultSettings.closeMin) continue;
      if (findConflict(out, defaultSettings, { techId: tech.id, date, start, duration })) continue;
      const p = people[Math.floor(rnd() * people.length)];
      const status = d < 0 ? (rnd() > 0.1 ? "selesai" : "batal") : d === 0 ? (start < 11 * 60 ? "selesai" : start < 13 * 60 ? "jalan" : "konfirmasi") : rnd() > 0.35 ? "konfirmasi" : "baru";
      out.push({
        id: `a${++n}`, customer: p[0], phone: p[1], address: p[2], serviceId: svc.id, units,
        techId: tech.id, date, start, duration, status, notes: notes[Math.floor(rnd() * notes.length)],
        createdAt: Date.now() - (14 - d) * 86400000,
      });
    }
  }
  return out;
}
