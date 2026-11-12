import { useState } from "react";
import { ErroApi, type ApkInfo, type Cliente, type Fase, type Projeto } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { bytes, compacto, haQuanto, rotuloDaFase, rotuloDoBuild, tomDaFase, tomDoBuild } from "../logica";
import { Aviso, Barra, Botao, BotaoConfirmar, Cartao, Carregando, Icone, Indicador, Ponto, Selo, Vazio } from "../ui";

export function Projetos() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando, recarregar } = useBusca(() => api.painel(), 60_000, endereco);
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  const ps = dado.projetos;
  const linhas = ps.reduce((s, p) => s + (p.metricas?.linhas ?? 0), 0);
  const arquivos = ps.reduce((s, p) => s + (p.metricas?.arquivos ?? 0), 0);
  const ok = ps.filter((p) => p.estadoBuild === "ok").length;
  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Projetos" valor={String(ps.length)} detalhe={`${ps.filter((p) => p.conectado).length} com repositório`} />
        <Indicador rotulo="Linhas de código" valor={compacto(linhas)} detalhe="soma dos repositórios" />
        <Indicador rotulo="Arquivos" valor={compacto(arquivos)} />
        <Indicador rotulo="Builds" valor={`${ok}/${ps.filter((p) => p.conectado).length || 0}`} detalhe="projetos compilando ok" tom={ps.some((p) => p.estadoBuild === "falhou") ? "erro" : "ok"} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
        {ps.map((p) => <CartaoDoProjeto key={p.id} p={p} aoMudar={recarregar} />)}
      </div>
    </div>
  );
}

function CartaoDoProjeto({ p, aoMudar }: { p: Projeto; aoMudar: () => void }) {
  const { api } = useApp();
  return (
    <Cartao
      titulo={p.nome}
      descricao={p.descricao}
      acao={
        <div className="flex flex-col items-end gap-1.5">
          <Selo tom={tomDoBuild(p.estadoBuild)}><Ponto tom={tomDoBuild(p.estadoBuild)} vivo={p.estadoBuild === "rodando"} />{rotuloDoBuild(p.estadoBuild)}</Selo>
          {p.urlRepo && (
            <a href={p.urlRepo} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center gap-1 text-xs text-ciano hover:underline"><Icone nome="link" tam={14} />Repositório</a>
          )}
        </div>
      }
    >
      <div className="mb-4">
        {p.compilando ? (
          <>
            <div className="mb-1.5 flex items-end justify-between gap-2">
              <span className="min-w-0 text-xs text-aviso"><span className="block truncate">Compilando · {p.compilando.workflow}</span>{p.compilando.etapa && <span className="block truncate text-suave">{p.compilando.etapa}</span>}</span>
              <span className="num text-2xl font-semibold text-aviso">{p.compilando.percentual}%</span>
            </div>
            <Barra valor={p.compilando.percentual} alto tom="aviso" rotulo={`Compilação do ${p.nome}`} />
          </>
        ) : (
          <>
            <div className="mb-1.5 flex items-end justify-between">
              <span className="text-xs text-suave">Progresso geral · {p.fasesConcluidas}/{p.fases.length} etapas concluídas</span>
              <span className="num text-2xl font-semibold">{p.progresso}%</span>
            </div>
            <Barra valor={p.progresso} alto rotulo={`Progresso do ${p.nome}`} />
          </>
        )}
      </div>

      {!p.conectado && <LigarRepositorio p={p} aoSalvar={aoMudar} api={api} />}
      {p.aviso && <div className="mb-3"><Aviso>{p.aviso}</Aviso></div>}

      {p.metricas && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Mini rotulo="linhas" valor={compacto(p.metricas.linhas)} />
            <Mini rotulo="arquivos" valor={compacto(p.metricas.arquivos)} />
            <Mini rotulo={p.metricas.fonte === "ci" ? "contagem exata" : "estimativa"} valor={p.metricas.atualizado ? haQuanto(p.metricas.atualizado) : "—"} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.metricas.linguagens.slice(0, 5).map((l) => <Selo key={l.nome}>{l.nome} · {compacto(l.linhas)}</Selo>)}
          </div>
        </div>
      )}

      {p.builds.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <h3 className="text-xs font-medium uppercase tracking-wide text-suave">Builds</h3>
          {p.builds.map((b) => {
            const tom = b.estado !== "completed" ? "aviso" : b.resultado === "success" ? "ok" : "erro";
            return (
              <a key={b.workflow} href={b.url} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center justify-between gap-2 rounded-xl border border-borda bg-white/3 px-3 text-sm hover:bg-white/6">
                <span className="flex min-w-0 items-center gap-2"><Ponto tom={tom} vivo={b.estado !== "completed"} /><span className="truncate">{b.workflow}</span></span>
                <span className="num flex-none text-xs text-suave">#{b.numero} · {b.commit} · {haQuanto(b.quando)}</span>
              </a>
            );
          })}
        </div>
      )}

      <Plataformas p={p} />

      <Fases p={p} aoMudar={aoMudar} api={api} />
    </Cartao>
  );
}

const Mini = ({ rotulo, valor }: { rotulo: string; valor: string }) => (
  <div className="rounded-xl border border-borda bg-white/3 px-2 py-2"><div className="num text-lg font-semibold">{valor}</div><div className="text-[11px] text-suave">{rotulo}</div></div>
);

type Destino = { tipo: "app"; app: string } | { tipo: "site"; url: string; nota?: string } | { tipo: "breve" };
type Plataforma = "android" | "windows" | "web" | "ios";
const ROTULOS: Record<Plataforma, string> = { android: "Android", windows: "Windows", web: "Versão web", ios: "iOS" };

/** Onde cada projeto é usado. O que ainda não existe fica como atalho "em breve" e vira botão de verdade quando sair. */
function destinos(id: string, site: string): Partial<Record<Plataforma, Destino>> {
  switch (id) {
    case "venus": return { android: { tipo: "app", app: "venus" }, windows: { tipo: "app", app: "windows" }, web: { tipo: "site", url: `${site}/app/` }, ios: { tipo: "site", url: `${site}/app/`, nota: "No Safari: Compartilhar › Adicionar à Tela de Início" } };
    case "vindex": return { android: { tipo: "app", app: "vindex-android" }, windows: { tipo: "app", app: "vindex-windows" }, web: { tipo: "breve" }, ios: { tipo: "breve" } };
    case "vortex": return { android: { tipo: "app", app: "vortex" }, windows: { tipo: "breve" }, web: { tipo: "breve" }, ios: { tipo: "breve" } };
    case "devcenter": { const painel = `${location.origin}${import.meta.env.BASE_URL}`; return { android: { tipo: "app", app: "dev" }, windows: { tipo: "breve" }, web: { tipo: "site", url: painel }, ios: { tipo: "site", url: painel, nota: "No Safari: Compartilhar › Adicionar à Tela de Início" } }; }
    default: return {};
  }
}

function Plataformas({ p }: { p: Projeto }) {
  const { api, endereco } = useApp();
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState("");
  const d = destinos(p.id, endereco.replace(/\/+$/, ""));
  const ordem = (["android", "windows", "web", "ios"] as Plataforma[]).filter((k) => d[k]);
  if (ordem.length === 0) return null;
  async function baixar(app: string) {
    setOcupado(app);
    setMsg("");
    try {
      const r = await api.apk(app);
      setMsg("Download iniciado. O link vale por poucos minutos.");
      window.location.href = r.url; // abrir em nova janela depois de esperar a rede é bloqueado no celular
    } catch (e) {
      setMsg(e instanceof ErroApi ? e.message : "Não consegui o link agora.");
    }
    setOcupado("");
  }
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-suave">Baixar e abrir</h3>
      <div className="grid grid-cols-2 gap-2">
        {ordem.map((k) => {
          const x = d[k] as Destino;
          const info: ApkInfo | undefined = x.tipo === "app" ? p.apks.find((a) => a.app === x.app) : undefined;
          const pronto = x.tipo === "site" || (x.tipo === "app" && !!info?.versao && p.conectado);
          const detalhe = x.tipo === "breve" ? "Em breve" : x.tipo === "site" ? (x.nota ?? "Abre no navegador") : info?.versao ? `1.${info.versao.numero} · ${bytes(info.versao.tamanho)} · ${haQuanto(info.versao.publicado)}` : "Ainda sem versão publicada";
          return (
            <div key={k} className="flex flex-col justify-between gap-2 rounded-xl border border-borda bg-white/3 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm">{ROTULOS[k]}</div>
                <div className="num text-xs text-suave">{detalhe}</div>
              </div>
              <Botao variante={pronto ? "primario" : undefined} disabled={!pronto || ocupado === (x.tipo === "app" ? x.app : "")}
                aria-label={`${x.tipo === "site" ? "Abrir" : "Baixar"} ${p.nome} para ${ROTULOS[k]}`}
                onClick={() => { if (x.tipo === "site") window.open(x.url, "_blank", "noopener,noreferrer"); else if (x.tipo === "app") void baixar(x.app); }}>
                {x.tipo === "site" ? "Abrir" : <><Icone nome="baixar" tam={16} />{x.tipo === "breve" ? "Em breve" : "Baixar"}</>}
              </Botao>
            </div>
          );
        })}
      </div>
      {msg && <p className="mt-1 text-xs text-suave" role="status">{msg}</p>}
    </div>
  );
}

function LigarRepositorio({ p, aoSalvar, api }: { p: Projeto; aoSalvar: () => void; api: Cliente }) {
  const [repo, setRepo] = useState("");
  const [msg, setMsg] = useState("");
  if (p.id === "venus") return null;
  async function salvar() {
    setMsg("");
    try {
      await api.definirConfig(`repo:${p.id}`, repo);
      setRepo("");
      aoSalvar();
    } catch (e) {
      setMsg(e instanceof ErroApi ? e.message : "Não deu certo.");
    }
  }
  return (
    <div className="mb-4 rounded-xl border border-dashed border-borda p-3">
      <p className="mb-2 text-xs text-suave">Ligue o repositório do {p.nome} para ver linhas de código, builds e APKs.</p>
      <div className="flex gap-2">
        <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="dono/repositório" aria-label={`Repositório do ${p.nome}`} autoCapitalize="none" className="min-h-10 min-w-0 flex-1 rounded-xl border border-borda bg-white/5 px-3 text-sm" />
        <Botao variante="primario" disabled={!repo.trim()} onClick={salvar}>Ligar</Botao>
      </div>
      {msg && <p className="mt-1 text-xs text-erro" role="alert">{msg}</p>}
    </div>
  );
}

function Fases({ p, aoMudar, api }: { p: Projeto; aoMudar: () => void; api: Cliente }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const [novo, setNovo] = useState("");
  const [msg, setMsg] = useState("");
  async function tentar(f: () => Promise<unknown>) {
    setMsg("");
    try {
      await f();
      aoMudar();
    } catch (e) {
      setMsg(e instanceof ErroApi ? e.message : "Não deu certo.");
    }
  }
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-suave">Fases de desenvolvimento</h3>
      {p.fases.length === 0 && <Vazio>Nenhuma fase cadastrada. Adicione a primeira abaixo.</Vazio>}
      <ul className="space-y-1.5">
        {p.fases.map((f) => (
          <li key={f.id} className="rounded-xl border border-borda bg-white/3">
            <button type="button" className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left" aria-expanded={aberta === f.id} onClick={() => setAberta(aberta === f.id ? null : f.id)}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm">{f.titulo}</span><span className="num text-sm font-medium">{f.progresso}%</span></div>
                <div className="mt-1.5 flex items-center gap-2"><div className="flex-1"><Barra valor={f.progresso} tom={tomDaFase(f.status) === "neutro" ? "neutro" : tomDaFase(f.status) === "erro" ? "erro" : "ok"} rotulo={f.titulo} /></div><Selo tom={tomDaFase(f.status)}>{rotuloDaFase(f.status)}</Selo></div>
              </div>
            </button>
            {aberta === f.id && <EditorDeFase f={f} tentar={tentar} api={api} aoFechar={() => setAberta(null)} />}
          </li>
        ))}
      </ul>
      <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (novo.trim()) void tentar(async () => { await api.novaFase(p.id, novo.trim(), 0); setNovo(""); }); }}>
        <input value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nova fase…" aria-label={`Nova fase do ${p.nome}`} className="min-h-10 min-w-0 flex-1 rounded-xl border border-borda bg-white/5 px-3 text-sm" maxLength={120} />
        <Botao type="submit" disabled={!novo.trim()}><Icone nome="mais" tam={16} />Adicionar</Botao>
      </form>
      {msg && <p className="mt-1 text-xs text-erro" role="alert">{msg}</p>}
    </div>
  );
}

function EditorDeFase({ f, tentar, api, aoFechar }: { f: Fase; tentar: (fn: () => Promise<unknown>) => Promise<void>; api: Cliente; aoFechar: () => void }) {
  const [titulo, setTitulo] = useState(f.titulo);
  const [prog, setProg] = useState(f.progresso);
  const [status, setStatus] = useState(f.status);
  return (
    <div className="space-y-3 border-t border-borda px-3 py-3">
      <input value={titulo} onChange={(e) => setTitulo(e.target.value)} aria-label="Nome da fase" maxLength={120} className="min-h-10 w-full rounded-xl border border-borda bg-white/5 px-3 text-sm" />
      <label className="block text-xs text-suave">Progresso: <b className="num text-texto">{prog}%</b>
        <input type="range" min={0} max={100} step={5} value={prog} onChange={(e) => { const v = Number(e.target.value); setProg(v); setStatus(v >= 100 ? "concluida" : v > 0 && status !== "bloqueada" ? "em_andamento" : status); }} className="mt-1 w-full" />
      </label>
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className="min-h-10 w-full rounded-xl border border-borda bg-painel px-3 text-sm">
        {["planejada", "em_andamento", "concluida", "bloqueada"].map((s) => <option key={s} value={s}>{rotuloDaFase(s)}</option>)}
      </select>
      <div className="flex flex-wrap items-center gap-2">
        <Botao variante="primario" onClick={() => void tentar(async () => { await api.salvarFase(f.id, { titulo, progresso: prog, status }); aoFechar(); })}>Salvar</Botao>
        <Botao onClick={aoFechar}>Fechar</Botao>
        <BotaoConfirmar rotulo="Excluir" aoConfirmar={() => void tentar(() => api.apagarFase(f.id))} />
      </div>
    </div>
  );
}
