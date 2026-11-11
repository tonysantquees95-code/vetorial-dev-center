import { URL_API, rodandoNoApp } from "@venus/nucleo";
import { ADMIN_EMAIL_PADRAO, ehAmbiente, normalizarUrl, urlDoAmbiente, URLS_PADRAO, type Ambiente, type UrlsSalvas } from "./logica";

export class ErroApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensagem: string,
    public dados: Record<string, any> = {}
  ) {
    super(mensagem);
  }
}

// ------------------------------------------------------------------ respostas do servidor
export interface Fase { id: string; projeto: string; titulo: string; progresso: number; status: string; ordem: number }
export interface Build { workflow: string; estado: string; resultado: string | null; numero: number; commit: string; quando: number; url: string }
export interface ApkInfo { app: string; rotulo: string; versao: { numero: number; tag: string; pagina: string; tamanho: number; publicado: number } | null; baixar: string | null }
export interface Metricas { arquivos: number; linhas: number; linguagens: { nome: string; arquivos: number; linhas: number }[]; pastas?: { nome: string; arquivos: number; linhas: number }[]; fonte: "ci" | "estimado"; atualizado: number; commit?: string }
export interface Projeto {
  id: string; nome: string; descricao: string; repo: string | null; urlRepo: string | null; conectado: boolean; aviso?: string;
  fases: Fase[]; progresso: number; fasesConcluidas: number; metricas: Metricas | null; builds: Build[]; estadoBuild: string; apks: ApkInfo[];
}
export interface Painel { gerado: number; admin: string; projetos: Projeto[] }
export interface Bi {
  gerado: number; dias: string[]; faturamentoCentavos: number[]; novosLojistas: number[]; novasContas: number[];
  requisicoesIA: Record<string, number[]>; tokensIA: Record<string, number[]>; errosIA: Record<string, number[]>;
  totais: { lojas: number; lojasAtivas: number; pagantes: number; faturamentoPeriodoCentavos: number; faturamentoTotalCentavos: number; pagamentosTotal: number; requisicoesIA: number; tokensIA: number; respostasDoCache: number };
}
export interface Automacao { id: string; rotulo: string; executor: string; reserva: string | null; funcoes: { tarefa: string; provedor: string }[]; emUso: string | null; requisicoes24h: number; ativaAgora: boolean }
export interface Servico { id: string; rotulo: string; executor: string; configurado: boolean; atividadeHora: number | null }
export interface ProvedorIa { id: string; chaveConfigurada: boolean; ligado: boolean; requisicoes24h: number; erros24h: number }
export interface Ferramentas { gerado: number; provedores: ProvedorIa[]; automacoes: Automacao[]; servicos: Servico[] }
export interface Trafego {
  agora: number; ultimo: number;
  itens: { id: number; quando: number; metodo: string; rota: string; status: number; ms: number; origem: string }[];
  ultimos5min: { total: number; erros: number; recusados: number; p50: number; p95: number; rotas: { rota: string; n: number }[] };
}
export interface SessaoAtiva { sessao: string; usuario: string; email: string; nome: string; plataforma: string; criado: number; ultimoPing: number }
export interface ContaDisp { usuario: string; email: string; nome: string; dispositivos: number; ativas: number; sessoes: SessaoAtiva[] }
export interface Dispositivos { agora: number; maxDispositivos: number; maxAtivas: number; ttlMs: number; sessoesAtivas: number; contas: ContaDisp[] }
export interface ConfigDev { escutaContinua: boolean; provedores: Record<string, { ligado: boolean; chaveConfigurada: boolean }>; repos: { vindex: string; vortex: string } }
export interface EstadoCache { exato: boolean; semantico: boolean; acertos24h: number; chamadas24h: number; taxa: number }
export interface Telemetria { origem: string; atualizado: number; bateria: { nivel: number | null; carregando: boolean; temperatura: number | null }; hardware: { modelo: string; so: string; ramMb: number | null; nucleos: number | null; armazenamentoLivreMb: number | null; rede: string } }
export interface ChaveCofre { nome: string; rotulo: string; noCofre: boolean; previa: string; atualizado: number; noServidor: boolean }
export interface EstadoCofre { configurado: boolean; bloqueadoAte: number; sugeridas: { nome: string; rotulo: string }[] }
export interface ListaCofre { chaves: ChaveCofre[]; historico: { quando: number; acao: string; nome: string; ok: number }[] }
export interface SessaoAdmin { token: string; papel: string; expira: number; sessao: string; usuario: { id: string; email: string; nome: string } }

// ------------------------------------------------------------------ armazenamento local (por ambiente)
const CHAVE = "vdev.v1";
export interface Guardado {
  ambiente: Ambiente;
  urls: UrlsSalvas;
  sessoes: Partial<Record<Ambiente, { token: string; email: string; expira: number }>>;
  aparelho: string;
}
function novoAparelho(): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return "vdev-" + [...a].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function lerGuardado(): Guardado {
  try {
    const g = JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
    return {
      ambiente: ehAmbiente(g.ambiente) ? g.ambiente : "producao",
      urls: { ...URLS_PADRAO, ...(g.urls ?? {}) },
      sessoes: g.sessoes && typeof g.sessoes === "object" ? g.sessoes : {},
      aparelho: typeof g.aparelho === "string" && g.aparelho.length >= 8 ? g.aparelho : novoAparelho()
    };
  } catch {
    return { ambiente: "producao", urls: { ...URLS_PADRAO }, sessoes: {}, aparelho: novoAparelho() };
  }
}
export function gravarGuardado(g: Guardado) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(g));
  } catch {
    /* modo privado: segue sem guardar */
  }
}

export const PRODUCAO = URL_API;
export const enderecoAtual = (g: Guardado) => urlDoAmbiente(g.ambiente, g.urls, PRODUCAO);
export const dispositivoDoPainel = (g: Guardado) => ({ id: g.aparelho, nome: rodandoNoApp() ? "Vetorial Dev (APK)" : "Painel Dev (navegador)", plataforma: rodandoNoApp() ? "android" : "web" });
export { ADMIN_EMAIL_PADRAO, normalizarUrl };

// ------------------------------------------------------------------ cliente
export function criarCliente(base: () => string, token: () => string, aoNegar: () => void) {
  async function chamar<T>(metodo: string, caminho: string, corpo?: unknown, comToken = true): Promise<T> {
    const b = base();
    if (!b) throw new ErroApi(0, "sem_endereco", "Esse ambiente ainda não tem endereço. Configure em Ajustes.");
    let r: Response;
    try {
      r = await fetch(`${b}${caminho}`, {
        method: metodo,
        headers: { ...(corpo !== undefined ? { "content-type": "application/json" } : {}), ...(comToken && token() ? { authorization: `Bearer ${token()}` } : {}) },
        body: corpo !== undefined ? JSON.stringify(corpo) : undefined
      });
    } catch {
      throw new ErroApi(0, "sem_conexao", "Sem conexão com o servidor desse ambiente.");
    }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401 && comToken) aoNegar();
      throw new ErroApi(r.status, d.codigo ?? "erro", d.error ?? "Algo deu errado.", d);
    }
    return d as T;
  }
  return {
    saude: async () => {
      const t0 = performance.now();
      const d = await chamar<{ ok: boolean; versao?: number }>("GET", "/saude", undefined, false);
      return { ...d, ms: Math.round(performance.now() - t0) };
    },
    entrar: (email: string, senha: string, dispositivo: object, extra: { encerrar?: string; remover?: string } = {}) => chamar<SessaoAdmin>("POST", "/dev/entrar", { email, senha, dispositivo, ...extra }, false),
    primeiroAcesso: (senha: string, convite: string, dispositivo: object) => chamar<SessaoAdmin>("POST", "/dev/primeiro-acesso", { senha, convite, dispositivo }, false),
    sair: () => chamar<{ ok: boolean }>("POST", "/dev/sair", {}),
    painel: () => chamar<Painel>("GET", "/dev/painel"),
    bi: (dias: number) => chamar<Bi>("GET", `/dev/bi?dias=${dias}`),
    ferramentas: () => chamar<Ferramentas>("GET", "/dev/ferramentas"),
    trafego: (desde = 0) => chamar<Trafego>("GET", `/dev/trafego?desde=${desde}&limite=80`),
    dispositivos: () => chamar<Dispositivos>("GET", "/dev/dispositivos"),
    encerrarSessao: (id: string) => chamar<{ ok: boolean }>("POST", `/dev/sessoes/${id}/encerrar`, {}),
    cofreEstado: () => chamar<EstadoCofre>("GET", "/dev/cofre/estado"),
    cofreIniciar: (senha: string) => chamar<{ ok: boolean }>("POST", "/dev/cofre/iniciar", { senha }),
    cofreListar: (senha: string) => chamar<ListaCofre>("POST", "/dev/cofre/listar", { senha }),
    cofreGuardar: (senha: string, nome: string, valor: string) => chamar<{ ok: boolean; previa: string }>("POST", "/dev/cofre/guardar", { senha, nome, valor }),
    cofreApagar: (senha: string, nome: string) => chamar<{ ok: boolean }>("POST", "/dev/cofre/apagar", { senha, nome }),
    cofreTrocarSenha: (senha: string, nova: string) => chamar<{ ok: boolean }>("POST", "/dev/cofre/trocar-senha", { senha, nova }),
    apk: (app: string) => chamar<{ app: string; numero: number; tag: string; tamanho: number; url: string }>("GET", `/dev/apk?app=${encodeURIComponent(app)}`),
    config: () => chamar<ConfigDev>("GET", "/dev/config"),
    definirConfig: (chave: string, valor: string | boolean) => chamar<{ ok: boolean }>("PUT", "/dev/config", { chave, valor }),
    cache: () => chamar<EstadoCache>("GET", "/dev/cache"),
    limparCache: () => chamar<{ apagadas: number; restam: boolean }>("DELETE", "/dev/cache"),
    telemetria: () => chamar<{ agora: number; itens: Telemetria[] }>("GET", "/dev/telemetria"),
    enviarTelemetria: (d: object) => chamar<{ ok: boolean }>("POST", "/dev/telemetria", d),
    novaFase: (projeto: string, titulo: string, progresso: number) => chamar<Fase>("POST", "/dev/fases", { projeto, titulo, progresso }),
    salvarFase: (id: string, d: { titulo?: string; progresso?: number; status?: string }) => chamar<Fase>("PUT", `/dev/fases/${id}`, d),
    apagarFase: (id: string) => chamar<{ ok: boolean }>("DELETE", `/dev/fases/${id}`)
  };
}
export type Cliente = ReturnType<typeof criarCliente>;
