// Lógica pura do Painel Dev (sem React nem rede): formatação, ambientes, gráficos e tráfego. Testada em teste/logica.test.mjs.

export type Ambiente = "producao" | "homologacao" | "local";
export const AMBIENTES: { id: Ambiente; rotulo: string; dica: string }[] = [
  { id: "producao", rotulo: "Produção", dica: "O servidor de verdade (Cloudflare)." },
  { id: "homologacao", rotulo: "Homologação", dica: "Cópia do servidor para testar antes de publicar." },
  { id: "local", rotulo: "Teste local", dica: "Servidor rodando na sua máquina (wrangler dev)." }
];
export const ADMIN_EMAIL_PADRAO = "vetorialtech.dev@gmail.com";

const REDE_LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|\[::1\])$/;

/** Aceita "meu.servidor.dev" (vira https) e http só em rede local. Devolve null se não presta. */
export function normalizarUrl(entrada: string): string | null {
  let t = entrada.trim();
  if (!t) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) t = (REDE_LOCAL.test(t.split(/[:/]/)[0] ?? "") ? "http://" : "https://") + t;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && !(u.protocol === "http:" && REDE_LOCAL.test(u.hostname))) return null;
  if (u.username || u.password) return null;
  return u.origin;
}

export interface UrlsSalvas {
  homologacao: string;
  local: string;
}
export const URLS_PADRAO: UrlsSalvas = { homologacao: "", local: "http://localhost:8787" };

/** Endereço do servidor do ambiente; "" quando o ambiente ainda não foi configurado. */
export function urlDoAmbiente(id: Ambiente, urls: UrlsSalvas, producao: string): string {
  return id === "producao" ? producao : urls[id];
}

export const ehAmbiente = (v: unknown): v is Ambiente => v === "producao" || v === "homologacao" || v === "local";

// ------------------------------------------------------------------ formatação
export const moeda = (centavos: number): string => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((centavos || 0) / 100);

export function compacto(n: number): string {
  const v = Math.abs(n);
  const f = (x: number, s: string) => `${(Math.round(x * 10) / 10).toString().replace(".", ",")}${s}`;
  if (v >= 1e9) return f(n / 1e9, " bi");
  if (v >= 1e6) return f(n / 1e6, " mi");
  if (v >= 1e4) return f(n / 1e3, " mil");
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

export function bytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1).replace(".", ",")} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(".", ",")} MB`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} kB`;
  return `${n} B`;
}

export function haQuanto(ms: number, agora = Date.now()): string {
  if (!ms) return "nunca";
  const s = Math.max(0, Math.round((agora - ms) / 1000));
  if (s < 10) return "agora";
  if (s < 60) return `há ${s} s`;
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
}

export function restante(ate: number, agora = Date.now()): string {
  const m = Math.max(0, Math.floor((ate - agora) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
}

export const rotuloDia = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const soma = (v: number[]): number => v.reduce((a, b) => a + b, 0);

export function variacao(atual: number, anterior: number): number | null {
  if (!anterior) return atual ? null : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}

// ------------------------------------------------------------------ gráficos (SVG)
export interface Ponto {
  x: number;
  y: number;
}

/** Converte valores em pontos dentro de largura × altura, com margem. O teto da escala é o maior valor (ou 1). */
export function pontosDaSerie(valores: number[], largura: number, altura: number, margem = 6, teto?: number): Ponto[] {
  const max = Math.max(teto ?? 0, ...valores, 1);
  const n = valores.length;
  return valores.map((v, i) => ({
    x: margem + (n <= 1 ? (largura - 2 * margem) / 2 : (i * (largura - 2 * margem)) / (n - 1)),
    y: altura - margem - (Math.max(0, v) / max) * (altura - 2 * margem)
  }));
}

export const caminhoDaLinha = (p: Ponto[]): string => p.map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" ");

export function caminhoDaArea(p: Ponto[], base: number): string {
  if (!p.length) return "";
  const a = p[0] as Ponto;
  const z = p[p.length - 1] as Ponto;
  return `${caminhoDaLinha(p)} L${z.x.toFixed(1)} ${base} L${a.x.toFixed(1)} ${base} Z`;
}

/** Maior valor entre várias séries (escala comum para comparar provedores). */
export const tetoComum = (series: number[][]): number => Math.max(1, ...series.map((s) => Math.max(0, ...s)));

/** Índice do ponto mais próximo do toque (x em coordenadas do gráfico). */
export function maisPerto(pontos: Ponto[], x: number): number {
  let melhor = 0;
  let d = Infinity;
  pontos.forEach((p, i) => {
    const dd = Math.abs(p.x - x);
    if (dd < d) {
      d = dd;
      melhor = i;
    }
  });
  return melhor;
}

// ------------------------------------------------------------------ estados e tráfego
export type Tom = "ok" | "aviso" | "erro" | "neutro";
export const tomDoStatusHttp = (s: number): Tom => (s >= 500 ? "erro" : s >= 400 ? "aviso" : s >= 200 ? "ok" : "neutro");
export const tomDoBuild = (estado: string): Tom => (estado === "ok" ? "ok" : estado === "falhou" ? "erro" : estado === "rodando" ? "aviso" : "neutro");
export const rotuloDoBuild = (estado: string): string => ({ ok: "Build ok", falhou: "Build falhou", rodando: "Compilando", desconhecido: "Sem build" })[estado] ?? "Sem build";
export const rotuloDaFase = (s: string): string => ({ planejada: "Planejada", em_andamento: "Em andamento", concluida: "Concluída", bloqueada: "Bloqueada" })[s] ?? s;
export const tomDaFase = (s: string): Tom => (s === "concluida" ? "ok" : s === "bloqueada" ? "erro" : s === "em_andamento" ? "aviso" : "neutro");

export interface LinhaDeTrafego {
  id: number;
  quando: number;
  metodo: string;
  rota: string;
  status: number;
  ms: number;
  origem: string;
}

/** Junta as linhas novas no topo, sem repetir ids, e corta no limite. */
export function mesclarTrafego(atuais: LinhaDeTrafego[], novas: LinhaDeTrafego[], max = 200): LinhaDeTrafego[] {
  const ids = new Set(atuais.map((l) => l.id));
  return [...novas.filter((l) => !ids.has(l.id)), ...atuais].sort((a, b) => b.id - a.id).slice(0, max);
}

export type FiltroDeTrafego = "todas" | "erros" | "lentas";
export function filtrarTrafego(linhas: LinhaDeTrafego[], f: FiltroDeTrafego): LinhaDeTrafego[] {
  if (f === "erros") return linhas.filter((l) => l.status >= 400);
  if (f === "lentas") return linhas.filter((l) => l.ms >= 500);
  return linhas;
}

export const nomeDoProvedor = (p: string): string => ({ groq: "Groq", deepseek: "DeepSeek", gemini: "Gemini Flash" })[p] ?? p;
export const COR_DO_PROVEDOR: Record<string, string> = { groq: "#fb923c", deepseek: "#60a5fa", gemini: "#34d399" };

/** Progresso médio das fases (0–100), como o servidor calcula. */
export const progressoMedio = (fases: { progresso: number }[]): number => (fases.length ? Math.round(soma(fases.map((f) => f.progresso)) / fases.length) : 0);

// ------------------------------------------------------------------ aplicativos (download e atualização)
export const REPOSITORIO = "tonysantquees95-code/vetorial-dev-center";

/** Número do build numa tag "dev-1.N" (ou "1.N"); 0 se não for uma tag de versão. */
export const buildDaTag = (tag: string): number => {
  const m = /^(?:dev-)?1\.(\d+)$/.exec(String(tag).trim());
  return m ? Number(m[1]) : 0;
};

/** Do conjunto de releases da API do GitHub, a mais nova com o APK anexado. */
export function ultimoApk(releases: unknown): { build: number; url: string } | null {
  if (!Array.isArray(releases)) return null;
  let melhor: { build: number; url: string } | null = null;
  for (const r of releases as { tag_name?: string; draft?: boolean; assets?: { name?: string; browser_download_url?: string }[] }[]) {
    if (!r || r.draft) continue;
    const build = buildDaTag(r.tag_name ?? "");
    const apk = (r.assets ?? []).find((a) => a.name === "VenusDev.apk" && a.browser_download_url);
    if (build > 0 && apk && (!melhor || build > melhor.build)) melhor = { build, url: apk.browser_download_url as string };
  }
  return melhor;
}

/** Última versão com o instalador do Windows anexado. */
export function ultimoWindows(releases: unknown): { build: number; url: string } | null {
  if (!Array.isArray(releases)) return null;
  let melhor: { build: number; url: string } | null = null;
  for (const r of releases as { tag_name?: string; draft?: boolean; assets?: { name?: string; browser_download_url?: string }[] }[]) {
    if (!r || r.draft) continue;
    const build = buildDaTag(r.tag_name ?? "");
    const exe = (r.assets ?? []).find((a) => a.name === "VetorialDev-Setup.exe" && a.browser_download_url);
    if (build > 0 && exe && (!melhor || build > melhor.build)) melhor = { build, url: exe.browser_download_url as string };
  }
  return melhor;
}

export type Plataforma = "android" | "windows" | "outra";
export const plataformaDe = (ua: string): Plataforma => (/android/i.test(ua) ? "android" : /windows/i.test(ua) ? "windows" : "outra");
