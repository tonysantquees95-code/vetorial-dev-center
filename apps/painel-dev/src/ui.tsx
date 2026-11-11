import { useId, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { caminhoDaArea, caminhoDaLinha, compacto, maisPerto, pontosDaSerie, rotuloDia, tetoComum, type Tom } from "./logica";

// ------------------------------------------------------------------ ícones
const CAMINHOS: Record<string, string> = {
  pasta: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",
  grafico: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  chip: "M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM10 10h4v4h-4z",
  pulso: "M3 12h4l2-6 4 12 2-6h6",
  celular: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18h2",
  engrenagem: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  baixar: "M12 3v12m0 0l-4-4m4 4l4-4M4 21h16",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  atualizar: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  sair: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  mais: "M12 5v14M5 12h14",
  lixeira: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"
};
export function Icone({ nome, tam = 20 }: { nome: string; tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CAMINHOS[nome] ?? ""} />
    </svg>
  );
}

// ------------------------------------------------------------------ peças
const TOM: Record<Tom, string> = {
  ok: "bg-ok/15 text-ok border-ok/30",
  aviso: "bg-aviso/15 text-aviso border-aviso/30",
  erro: "bg-erro/15 text-erro border-erro/30",
  neutro: "bg-white/5 text-suave border-borda"
};
export function Selo({ tom = "neutro", children }: { tom?: Tom; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${TOM[tom]}`}>{children}</span>;
}

export function Ponto({ tom, vivo = false }: { tom: Tom; vivo?: boolean }) {
  const cor = { ok: "bg-ok", aviso: "bg-aviso", erro: "bg-erro", neutro: "bg-suave/50" }[tom];
  return <span className={`inline-block h-2 w-2 rounded-full ${cor} ${vivo ? "ponto-vivo" : ""}`} aria-hidden="true" />;
}

export function Cartao({ titulo, descricao, acao, children, className = "" }: { titulo?: string; descricao?: string; acao?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={`vidro rounded-2xl p-4 sm:p-5 ${className}`}>
      {(titulo || acao) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-[15px] font-semibold leading-tight">{titulo}</h2>}
            {descricao && <p className="mt-1 text-xs leading-relaxed text-suave">{descricao}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

export function Barra({ valor, tom = "ok", alto = false, rotulo }: { valor: number; tom?: Tom; alto?: boolean; rotulo: string }) {
  const v = Math.max(0, Math.min(100, valor));
  const cor = { ok: "from-ciano to-violeta", aviso: "from-aviso to-aviso", erro: "from-erro to-erro", neutro: "from-suave/40 to-suave/40" }[tom];
  return (
    <div role="progressbar" aria-label={rotulo} aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} className={`w-full overflow-hidden rounded-full bg-white/8 ${alto ? "h-3" : "h-1.5"}`}>
      <div className={`h-full rounded-full bg-gradient-to-r ${cor} transition-[width] duration-500`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Botao({ variante = "suave", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: "primario" | "suave" | "perigo" }) {
  const base = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-medium transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50";
  const v = {
    primario: "bg-gradient-to-r from-ciano to-violeta text-[#04101c] font-semibold",
    suave: "border border-borda bg-white/5 hover:bg-white/10",
    perigo: "border border-erro/40 bg-erro/10 text-erro hover:bg-erro/20"
  }[variante];
  return <button {...p} className={`${base} ${v} ${className}`} />;
}

/** Botão de duas etapas: o primeiro toque pede confirmação (sem janelas do navegador). */
export function BotaoConfirmar({ rotulo, confirmacao = "Toque de novo para confirmar", aoConfirmar, desabilitado }: { rotulo: string; confirmacao?: string; aoConfirmar: () => void; desabilitado?: boolean }) {
  const [pedindo, setPedindo] = useState(false);
  return pedindo ? (
    <div className="flex items-center gap-2">
      <Botao variante="perigo" onClick={() => { setPedindo(false); aoConfirmar(); }}>{confirmacao}</Botao>
      <Botao onClick={() => setPedindo(false)}>Cancelar</Botao>
    </div>
  ) : (
    <Botao variante="perigo" disabled={desabilitado} onClick={() => setPedindo(true)}>{rotulo}</Botao>
  );
}

export function Chave({ ligado, aoMudar, rotulo, desabilitado }: { ligado: boolean; aoMudar: (v: boolean) => void; rotulo: string; desabilitado?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={rotulo} disabled={desabilitado} onClick={() => aoMudar(!ligado)}
      className={`relative h-7 w-12 flex-none rounded-full border transition disabled:opacity-50 ${ligado ? "border-ciano/50 bg-ciano/30" : "border-borda bg-white/5"}`}>
      <span className={`absolute top-0.5 rounded-full bg-white shadow transition-all ${ligado ? "left-[22px]" : "left-0.5"}`} style={{ height: 22, width: 22 }} />
    </button>
  );
}

export function Aviso({ tom = "aviso", children }: { tom?: Tom; children: ReactNode }) {
  return <div role={tom === "erro" ? "alert" : "status"} className={`rounded-xl border px-3 py-2 text-sm ${TOM[tom]}`}>{children}</div>;
}

export function Indicador({ rotulo, valor, detalhe, tom = "neutro" }: { rotulo: string; valor: string; detalhe?: string; tom?: Tom }) {
  const cor = { ok: "text-ok", aviso: "text-aviso", erro: "text-erro", neutro: "text-texto" }[tom];
  return (
    <div className="vidro rounded-2xl p-3.5">
      <div className="text-xs text-suave">{rotulo}</div>
      <div className={`num mt-1 text-xl font-semibold leading-tight sm:text-2xl ${cor}`}>{valor}</div>
      {detalhe && <div className="mt-0.5 text-xs text-suave">{detalhe}</div>}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-borda px-4 py-6 text-center text-sm text-suave">{children}</p>;
}

export function Carregando() {
  return <div className="space-y-3" aria-busy="true" aria-label="Carregando">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />)}</div>;
}

// ------------------------------------------------------------------ gráficos
export interface Serie { nome: string; cor: string; valores: number[] }
const L = 320;
const A = 140;

/** Gráfico de linhas (com área quando há uma série só). Toque ou passe o mouse para ver os valores do dia. */
export function GraficoLinhas({ dias, series, formato = compacto, descricao }: { dias: string[]; series: Serie[]; formato?: (n: number) => string; descricao: string }) {
  const id = useId();
  const [sel, setSel] = useState<number | null>(null);
  const teto = tetoComum(series.map((s) => s.valores));
  const pts = series.map((s) => pontosDaSerie(s.valores, L, A, 8, teto));
  const base = pts[0] ?? [];
  const i = sel ?? Math.max(0, dias.length - 1);
  const mover = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSel(maisPerto(base, ((e.clientX - r.left) / r.width) * L));
  };
  return (
    <figure className="m-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="font-medium text-suave">{dias[i] ? rotuloDia(dias[i] as string) : ""}</span>
        {series.map((s) => (
          <span key={s.nome} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.cor }} />
            {s.nome}: <b className="num">{formato(s.valores[i] ?? 0)}</b>
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-40 w-full touch-pan-y" role="img" aria-label={descricao} onPointerMove={mover} onPointerLeave={() => setSel(null)}>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series[0]?.cor ?? "#22d3ee"} stopOpacity=".35" />
            <stop offset="100%" stopColor={series[0]?.cor ?? "#22d3ee"} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1="8" x2={L - 8} y1={A - 8 - f * (A - 16)} y2={A - 8 - f * (A - 16)} stroke="#22304d" strokeDasharray="3 4" />)}
        {series.length === 1 && base.length > 0 && <path d={caminhoDaArea(base, A - 8)} fill={`url(#g${id})`} />}
        {pts.map((p, k) => <path key={series[k]?.nome} d={caminhoDaLinha(p)} fill="none" stroke={series[k]?.cor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />)}
        {base[i] && <line x1={base[i]?.x} x2={base[i]?.x} y1="4" y2={A - 8} stroke="#9fb0cc" strokeOpacity=".4" />}
        {pts.map((p, k) => p[i] && <circle key={series[k]?.nome} cx={p[i]?.x} cy={p[i]?.y} r="3.5" fill={series[k]?.cor} stroke="#070b14" strokeWidth="1.5" />)}
      </svg>
      <div className="num mt-1 flex justify-between text-[10px] text-suave"><span>{dias[0] ? rotuloDia(dias[0]) : ""}</span><span>{dias.length ? `pico ${formato(teto)}` : ""}</span><span>{dias.length ? rotuloDia(dias[dias.length - 1] as string) : ""}</span></div>
    </figure>
  );
}

export function GraficoBarras({ dias, valores, cor, formato = compacto, descricao }: { dias: string[]; valores: number[]; cor: string; formato?: (n: number) => string; descricao: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(1, ...valores);
  const i = sel ?? Math.max(0, dias.length - 1);
  const w = L / Math.max(1, valores.length);
  return (
    <figure className="m-0">
      <div className="mb-2 text-xs text-suave">{dias[i] ? rotuloDia(dias[i] as string) : ""}: <b className="num text-texto">{formato(valores[i] ?? 0)}</b></div>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-36 w-full" role="img" aria-label={descricao} onPointerLeave={() => setSel(null)}>
        {valores.map((v, k) => {
          const h = (Math.max(0, v) / max) * (A - 16);
          return <rect key={dias[k] ?? k} x={k * w + w * 0.15} y={A - 8 - h} width={w * 0.7} height={Math.max(h, v > 0 ? 2 : 0)} rx="2" fill={cor} opacity={k === i ? 1 : 0.65} onPointerEnter={() => setSel(k)} onPointerDown={() => setSel(k)} />;
        })}
        <line x1="0" x2={L} y1={A - 8} y2={A - 8} stroke="#22304d" />
      </svg>
    </figure>
  );
}
