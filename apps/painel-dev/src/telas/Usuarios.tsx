import { useMemo, useState } from "react";
import { ErroApi, type UsuarioDoPainel } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, BotaoConfirmar, Cartao, Carregando, Indicador, Selo, Vazio } from "../ui";

const NOME_DO_APP: Record<string, string> = { venus: "Vênus", vindex: "Vindex", vortex: "Vortex", vyntem: "Vyntem", velox: "Velox", drive: "Vetorial Drive", voxix: "Voxix" };
const SITUACAO: Record<UsuarioDoPainel["situacao"], { rotulo: string; tom: "ok" | "aviso" | "neutro" }> = {
  admin: { rotulo: "Administrador · ilimitado", tom: "ok" }, pagante: { rotulo: "Pagante", tom: "ok" }, teste: { rotulo: "Em teste grátis", tom: "aviso" }, gratis: { rotulo: "Só produtos grátis", tom: "neutro" },
};
type Filtro = "todos" | "pagantes" | "teste" | "gratis" | "agora";

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
  async function excluir(id: string) {
    setMsg("");
    try { await api.excluirUsuario(id); void recarregar(); } catch (e) { setMsg(e instanceof ErroApi ? e.message : "Não deu certo."); }
  }
  const filtros: [Filtro, string][] = [["todos", `Todos (${dado.total})`], ["pagantes", `Pagantes (${dado.pagantes})`], ["teste", `Em teste (${dado.emTeste})`], ["gratis", `Só grátis (${dado.soGratis})`], ["agora", `Usando agora (${dado.usandoAgora})`]];
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
      <div className="grid gap-3 lg:grid-cols-2">{lista.map((u) => <Usuario key={u.id} u={u} apps={dado.apps} aoEncerrar={encerrar} aoBloquear={bloquear} aoExcluir={excluir} />)}</div>
    </div>
  );
}

function Usuario({ u, apps, aoEncerrar, aoBloquear, aoExcluir }: { u: UsuarioDoPainel; apps: string[]; aoEncerrar: (id: string) => void; aoBloquear: (id: string, sim: boolean) => void; aoExcluir: (id: string) => void }) {
  const s = SITUACAO[u.situacao];
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
              <li key={a} className="flex items-center justify-between gap-2 rounded-xl border border-borda bg-white/3 px-3 py-2 text-sm">
                <span>{NOME_DO_APP[a] ?? a}</span>
                <span className="num text-xs text-suave">{x.dispositivos} {x.dispositivos === 1 ? "aparelho" : "aparelhos"} · <span className={x.ativas ? "text-ok" : ""}>{x.ativas} em uso agora</span></span>
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
