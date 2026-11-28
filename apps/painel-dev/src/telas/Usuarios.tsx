import { useMemo, useState } from "react";
import { ErroApi, type UsuarioDoPainel } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, Botao, BotaoConfirmar, Cartao, Carregando, Indicador, Selo, Vazio } from "../ui";

const NOME_DO_APP: Record<string, string> = { venus: "Vênus", vindex: "Vindex", vortex: "Vortex", vyntem: "Vyntem", velox: "Velox", drive: "Vetorial Drive", voxix: "Voxix" };
const SITUACAO: Record<UsuarioDoPainel["situacao"], { rotulo: string; tom: "ok" | "aviso" | "neutro" }> = {
  admin: { rotulo: "Administrador · ilimitado", tom: "ok" }, testador: { rotulo: "Testador · grátis sem prazo", tom: "ok" }, pagante: { rotulo: "Pagante", tom: "ok" }, cortesia: { rotulo: "Cortesia da Vênus", tom: "ok" }, teste: { rotulo: "Em teste grátis", tom: "aviso" }, gratis: { rotulo: "Só produtos grátis", tom: "neutro" },
};
type Filtro = "todos" | "pagantes" | "cortesia" | "teste" | "gratis" | "agora";
const dataBR = (ms: number) => new Date(ms).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/** Quem usa os aplicativos: por pessoa, quantos aparelhos cadastrados e quantos em uso agora em cada app, e se paga ou só usa o que é grátis. */
export function Usuarios() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando, recarregar } = useBusca(() => api.usuarios(), 10_000, endereco);
  const [msg, setMsg] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const lista = useMemo(() => {
    if (!dado) return [];
    const b = busca.trim().toLowerCase();
    return dado.usuarios.filter((u) => {
      if (b && !`${u.nome} ${u.email}`.toLowerCase().includes(b)) return false;
      if (filtro === "pagantes") return u.pagante;
      if (filtro === "cortesia") return u.situacao === "cortesia";
      if (filtro === "teste") return u.situacao === "teste";
      if (filtro === "gratis") return u.situacao === "gratis";
      if (filtro === "agora") return u.sessoes.length > 0;
      return true;
    });
  }, [dado, filtro, busca]);
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;

  async function encerrar(id: string) {
    setMsg("");
    try { await api.encerrarSessao(id); void recarregar(); } catch (e) { setMsg(e instanceof ErroApi ? e.message : "Não deu certo."); }
  }
  async function bloquear(id: string, sim: boolean) {
    setMsg("");
    try { await api.bloquearUsuario(id, sim); void recarregar(); } catch (e) { setMsg(e instanceof ErroApi ? e.message : "Não deu certo."); }
  }
  async function removerAparelho(usuario: string, aparelho: string) {
    setMsg("");
    try { await api.removerAparelho(usuario, aparelho); void recarregar(); } catch (e) { setMsg(e instanceof ErroApi ? e.message : "Não deu certo."); }
  }
  async function excluir(id: string) {
    setMsg("");
    try { await api.excluirUsuario(id); void recarregar(); } catch (e) { setMsg(e instanceof ErroApi ? e.message : "Não deu certo."); }
  }
  async function cortesia(id: string, dar: boolean) {
    setMsg("");
    try { await api.cortesia(id, dar); void recarregar(); } catch (e) { setMsg(e instanceof ErroApi ? e.message : "Não deu certo."); }
  }
  const filtros: [Filtro, string][] = [["todos", `Todos (${dado.total})`], ["pagantes", `Pagantes (${dado.pagantes})`], ["cortesia", `Cortesia (${dado.usuarios.filter((u) => u.situacao === "cortesia").length})`], ["teste", `Em teste (${dado.emTeste})`], ["gratis", `Só grátis (${dado.soGratis})`], ["agora", `Usando agora (${dado.usandoAgora})`]];
  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      {msg && <Aviso tom="erro">{msg}</Aviso>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Usuários" valor={String(dado.total)} />
        <Indicador rotulo="Pagantes" valor={String(dado.pagantes)} tom="ok" />
        <Indicador rotulo="Só produtos grátis" valor={String(dado.soGratis)} />
        <Indicador rotulo="Usando agora" valor={String(dado.usandoAgora)} detalhe={dado.semRecuperacao ? `${dado.semRecuperacao} sem recuperação de senha` : undefined} />
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar usuários">
        {filtros.map(([id, rotulo]) => <button key={id} role="tab" aria-selected={filtro === id} onClick={() => setFiltro(id)} className={`min-h-9 rounded-full border px-3 text-xs ${filtro === id ? "border-neon text-neon" : "border-borda text-suave"}`}>{rotulo}</button>)}
      </div>
      <input className="min-h-11 w-full rounded-xl border border-borda bg-black/20 px-3 text-sm" placeholder="Buscar por nome ou e-mail" value={busca} onChange={(e) => setBusca(e.target.value)} />
      {lista.length === 0 && <Vazio>{dado.total === 0 ? "Nenhuma conta do Vetorial ID ainda." : "Nenhum usuário nesse filtro."}</Vazio>}
      <div className="grid gap-3 lg:grid-cols-2">{lista.map((u) => <Usuario key={u.id} u={u} apps={dado.apps} aoEncerrar={encerrar} aoBloquear={bloquear} aoExcluir={excluir} aoRemoverAparelho={removerAparelho} aoCortesia={cortesia} />)}</div>
    </div>
  );
}

function Usuario({ u, apps, aoEncerrar, aoBloquear, aoExcluir, aoRemoverAparelho, aoCortesia }: { u: UsuarioDoPainel; apps: string[]; aoCortesia: (id: string, dar: boolean) => void; aoEncerrar: (id: string) => void; aoBloquear: (id: string, sim: boolean) => void; aoExcluir: (id: string) => void; aoRemoverAparelho: (usuario: string, aparelho: string) => void }) {
  const s = SITUACAO[u.situacao];
  const [aberto, setAberto] = useState<string | null>(null);
  const usados = apps.flatMap((a) => { const x = u.apps[a]; return x ? [{ a, x }] : []; });
  return (
    <Cartao titulo={u.nome || u.email} descricao={u.nome ? u.email : undefined} acao={<div className="flex flex-wrap justify-end gap-1">{u.bloqueado && <Selo tom="erro">Bloqueado</Selo>}<Selo tom={s.tom}>{s.rotulo}</Selo></div>}>
      <p className="num mb-3 text-xs text-suave">
        {u.admin ? "Sem teste nem plano: o administrador usa tudo, sem limites · " : u.pagante && u.pacote ? `Plano ${u.pacote} · ` : ""}entrou {haQuanto(u.criado)}{u.recuperacao ? "" : " · sem recuperação de senha"}
      </p>
      {usados.length === 0 ? <p className="text-xs text-suave">Ainda não vinculou nenhum aparelho.</p> : (
        <ul className="space-y-1.5">
          {usados.map(({ a, x }) => {
            return (
              <li key={a} className="rounded-xl border border-borda bg-white/3 px-3 py-2 text-sm">
                <button type="button" className="flex min-h-10 w-full flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-left" onClick={() => setAberto(aberto === a ? null : a)} aria-expanded={aberto === a}>
                  <span>{NOME_DO_APP[a] ?? a}</span>
                  <span className="num text-xs text-suave">{x.dispositivos} {x.dispositivos === 1 ? "aparelho" : "aparelhos"} · <span className={x.ativas ? "text-ok" : ""}>{x.ativas} em uso agora</span> {aberto === a ? "▴" : "▾"}</span>
                </button>
                {aberto === a && (
                  <ul className="mt-2 space-y-2 border-t border-borda pt-2">
                    {x.aparelhos.map((ap) => (
                      <li key={ap.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="min-w-0 text-suave"><span className="text-texto">{ap.nome || ap.plataforma}</span> · {ap.plataforma} · {ap.emUso ? "em uso agora" : `visto ${haQuanto(ap.ultimo)}`}</span>
                        {!ap.emUso && <BotaoConfirmar rotulo="Remover" confirmacao="Confirmar" aoConfirmar={() => aoRemoverAparelho(u.id, ap.id)} />}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {u.sessoes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {u.sessoes.map((x) => (
            <li key={x.sessao} className="flex items-center justify-between gap-2 text-xs text-suave">
              <span>{NOME_DO_APP[x.app] ?? x.app} · {x.plataforma} · ping {haQuanto(x.ultimoPing)}</span>
              <BotaoConfirmar rotulo="Encerrar" confirmacao="Confirmar" aoConfirmar={() => aoEncerrar(x.sessao)} />
            </li>
          ))}
        </ul>
      )}
      {u.liberacao && <PosVenda liberacao={u.liberacao} />}
      {!u.admin && u.situacao !== "testador" && u.situacao !== "pagante" && (
        <div className="mt-3 space-y-2 border-t border-borda pt-3">
          {u.situacao === "cortesia" ? (
            <>
              <p className="num text-sm text-ok">Vênus liberada até {dataBR(u.ativoAte)}</p>
              <BotaoConfirmar rotulo="Retirar cortesia" confirmacao="Confirmar retirada" aoConfirmar={() => aoCortesia(u.id, false)} />
            </>
          ) : (
            <>
              <p className="break-all text-xs text-suave">Depois de receber o pagamento, libere a Vênus para <span className="text-texto">{u.email}</span>. Uma vez por conta, sem cobrança automática.</p>
              <BotaoLiberar aoConfirmar={() => aoCortesia(u.id, true)} />
            </>
          )}
        </div>
      )}
      {!u.admin && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-borda pt-3">
          {u.bloqueado
            ? <BotaoConfirmar rotulo="Desbloquear" confirmacao="Confirmar" aoConfirmar={() => aoBloquear(u.id, false)} />
            : <BotaoConfirmar rotulo="Bloquear" confirmacao="Confirmar" aoConfirmar={() => aoBloquear(u.id, true)} />}
          {u.pagante ? <span className="text-xs text-suave">Pagante: só dá para bloquear.</span> : <BotaoConfirmar rotulo="Excluir perfil" confirmacao="Confirmar exclusão" aoConfirmar={() => aoExcluir(u.id)} />}
        </div>
      )}
    </Cartao>
  );
}

/** Quando o lojista assinou e as três mensagens do roteiro, com a data de cada uma. Quem envia é a pessoa. */
function PosVenda({ liberacao }: { liberacao: NonNullable<UsuarioDoPainel["liberacao"]> }) {
  const [copiada, setCopiada] = useState<number | null>(null);
  const [falhou, setFalhou] = useState(false);
  const agora = Date.now();
  async function copiar(dia: number, texto: string) {
    try { await navigator.clipboard.writeText(texto); setCopiada(dia); setFalhou(false); } catch { setFalhou(true); }
  }
  return (
    <div className="mt-3 space-y-2 border-t border-borda pt-3">
      <p className="num text-sm">Assinou em {dataBR(liberacao.inicio)} · 60 dias até {dataBR(liberacao.fim)}</p>
      <details>
        <summary className="min-h-10 cursor-pointer py-2 text-sm text-neon">Mensagens de acompanhamento</summary>
        <ul className="space-y-2">
          {liberacao.mensagens.map((m) => (
            <li key={m.dia} className="space-y-2 rounded-xl border border-borda bg-white/3 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium">{m.rotulo}<Selo tom={agora >= m.quando ? "aviso" : "neutro"}>{agora >= m.quando ? `Desde ${dataBR(m.quando)}` : `Enviar em ${dataBR(m.quando)}`}</Selo></div>
              <p className="select-text text-xs text-suave">{m.texto}</p>
              <Botao className="min-h-9 px-3 text-xs" onClick={() => void copiar(m.dia, m.texto)}>{copiada === m.dia ? "Copiada" : "Copiar mensagem"}</Botao>
            </li>
          ))}
        </ul>
        {falhou && <p className="mt-2 text-xs text-suave" role="status">Não deu para copiar. Segure o dedo no texto para selecionar.</p>}
      </details>
    </div>
  );
}

/** Liberar não é ação de perigo: botão comum, mas sempre com um segundo toque. */
function BotaoLiberar({ aoConfirmar }: { aoConfirmar: () => void }) {
  const [pedindo, setPedindo] = useState(false);
  return pedindo ? (
    <div className="flex flex-wrap items-center gap-2">
      <Botao variante="primario" onClick={() => { setPedindo(false); aoConfirmar(); }}>Confirmar 60 dias</Botao>
      <Botao onClick={() => setPedindo(false)}>Cancelar</Botao>
    </div>
  ) : <Botao onClick={() => setPedindo(true)}>Liberar 60 dias de Vênus</Botao>;
}
