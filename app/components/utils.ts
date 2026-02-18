export function shortAddr(a?: string) {
  if (!a) return "—";
  if (a.length <= 14) return a;
  return a.slice(0, 6) + "…" + a.slice(-6);
}

export function fmt(n: number, digits = 8) {
  if (!Number.isFinite(n)) return "—";
  const s = n.toFixed(digits);
  return s.replace(/\.?0+$/, "");
}

export function tsToLocal(ts?: number) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}
