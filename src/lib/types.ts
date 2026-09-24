export type Status = "baru" | "konfirmasi" | "jalan" | "selesai" | "batal";

export type Service = {
  id: string;
  name: string;
  short: string;
  desc: string;
  baseMin: number; // durasi unit pertama
  extraMin: number; // tambahan per unit berikutnya
  price: number; // per unit
  emoji: string;
};

export type Tech = {
  id: string;
  name: string;
  area: string;
  phone: string;
  color: string;
  offDay: number | null; // 0 = Minggu
};

export type Appt = {
  id: string;
  customer: string;
  phone: string;
  address: string;
  serviceId: string;
  units: number;
  techId: string;
  date: string; // YYYY-MM-DD
  start: number; // menit sejak 00:00
  duration: number; // menit kerja, tanpa jeda perjalanan
  status: Status;
  notes: string;
  transport?: number;
  discount?: number;
  paid?: boolean;
  createdAt: number;
};

export type Settings = {
  company: string;
  openMin: number;
  closeMin: number;
  buffer: number; // jeda perjalanan antar job
  serviceCycleDays: number;
};
