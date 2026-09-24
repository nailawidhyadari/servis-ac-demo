"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Appt, Service, Settings, Status, Tech } from "./types";
import { defaultServices, defaultSettings, defaultTechs, makeSeed } from "./seed";
import { toKey } from "./schedule";

type Data = { appts: Appt[]; services: Service[]; techs: Tech[]; settings: Settings };

type Ctx = Data & {
  ready: boolean;
  today: string;
  nowMin: number;
  addAppt: (a: Omit<Appt, "id" | "createdAt">) => Appt;
  updateAppt: (id: string, patch: Partial<Appt>) => void;
  setStatus: (id: string, s: Status) => void;
  saveService: (s: Service) => void;
  removeService: (id: string) => void;
  saveTech: (t: Tech) => void;
  removeTech: (id: string) => void;
  setSettings: (s: Settings) => void;
  resetDemo: () => void;
};

const KEY = "sejukin-demo-v1";
const C = createContext<Ctx | null>(null);

export function useStore() {
  const c = useContext(C);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data | null>(null);
  const [today, setToday] = useState("");
  const [nowMin, setNowMin] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage & jam lokal baru bisa dibaca setelah mount (hindari mismatch hydration) */
    const now = new Date();
    const t = toKey(now);
    setToday(t);
    setNowMin(now.getHours() * 60 + now.getMinutes());
    let loaded: Data | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) loaded = JSON.parse(raw);
    } catch {}
    setData(loaded ?? { appts: makeSeed(t), services: defaultServices, techs: defaultTechs, settings: defaultSettings });
    /* eslint-enable react-hooks/set-state-in-effect */
    const tick = setInterval(() => {
      const n = new Date();
      setToday(toKey(n));
      setNowMin(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  const mut = useCallback((f: (d: Data) => Data) => setData((d) => (d ? f(d) : d)), []);

  const value = useMemo<Ctx | null>(() => {
    if (!data) return null;
    return {
      ...data,
      ready: true,
      today,
      nowMin,
      addAppt: (a) => {
        const full: Appt = { ...a, id: "a" + Math.random().toString(36).slice(2, 8), createdAt: Date.now() };
        mut((d) => ({ ...d, appts: [...d.appts, full] }));
        return full;
      },
      updateAppt: (id, patch) => mut((d) => ({ ...d, appts: d.appts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      setStatus: (id, s) => mut((d) => ({ ...d, appts: d.appts.map((a) => (a.id === id ? { ...a, status: s } : a)) })),
      saveService: (s) => mut((d) => ({ ...d, services: d.services.some((x) => x.id === s.id) ? d.services.map((x) => (x.id === s.id ? s : x)) : [...d.services, s] })),
      removeService: (id) => mut((d) => ({ ...d, services: d.services.filter((x) => x.id !== id) })),
      saveTech: (t) => mut((d) => ({ ...d, techs: d.techs.some((x) => x.id === t.id) ? d.techs.map((x) => (x.id === t.id ? t : x)) : [...d.techs, t] })),
      removeTech: (id) => mut((d) => ({ ...d, techs: d.techs.filter((x) => x.id !== id) })),
      setSettings: (s) => mut((d) => ({ ...d, settings: s })),
      resetDemo: () => setData({ appts: makeSeed(today), services: defaultServices, techs: defaultTechs, settings: defaultSettings }),
    };
  }, [data, today, nowMin, mut]);

  if (!value) {
    return <div className="grid min-h-dvh place-items-center font-display text-2xl">Nyalain AC dulu…</div>;
  }
  return <C.Provider value={value}>{children}</C.Provider>;
}
