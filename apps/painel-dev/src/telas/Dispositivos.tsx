import { useState } from "react";
import { ErroApi, type ContaDisp } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, BotaoConfirmar, Cartao, Carregando, Indicador, Selo, Vazio } from "../ui";

const ICONE: Record<string, string> = { android: "🤖", ios: "📱", windows: "🖥️", web: "🌐" };

/** Sessões ativas de todas as contas (sem mostrar limites: o dono não tem). */
export function Dispositivos() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando, recarregar } = useBusca(() => api.dispositivos(), 10_000, endereco);
  const [msg, setMsg] = useState("");
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;

  async function encerrar(id: string) {
    setMsg("");
    try {
      await api.encerrarSessao(id);
      void recarregar();
    } catch (e) {
      setMsg(e instanceof ErroApi ? e.message : "Não deu certo.");
    }
  }
  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      {msg && <Aviso tom="erro">{msg}</Aviso>}
      <div className="grid grid-cols-2 gap-3">
        <Indicador rotulo="Sessões ativas" valor={String(dado.sessoesAtivas)} detalhe={`ping nos últimos ${Math.round(dado.ttlMs / 60000)} min`} />
        <Indicador rotulo="Contas" valor={String(dado.contas.length)} />
      </div>
      {dado.contas.length === 0 && <Vazio>Nenhuma conta do Vetorial ID ainda.</Vazio>}
      <div className="grid gap-3 lg:grid-cols-2">{dado.contas.map((c) => <Conta key={c.usuario} c={c} aoEncerrar={encerrar} />)}</div>
    </div>
  );
}

function Conta({ c, aoEncerrar }: { c: ContaDisp; aoEncerrar: (id: string) => void }) {
  return (
    <Cartao titulo={c.nome || c.email} descricao={c.nome ? c.email : undefined} acao={<Selo tom="neutro">{c.ativas} {c.ativas === 1 ? "ativa" : "ativas"}</Selo>}>
      <p className="num mb-3 text-xs text-suave">{c.dispositivos} {c.dispositivos === 1 ? "aparelho vinculado" : "aparelhos vinculados"}</p>
      {c.sessoes.length === 0 ? <p className="text-xs text-suave">Nenhuma sessão ativa agora.</p> : (
        <ul className="space-y-2">
          {c.sessoes.map((s) => (
            <li key={s.sessao} className="flex items-center justify-between gap-2 rounded-xl border border-borda bg-white/3 px-3 py-2">
              <div className="min-w-0 text-sm"><span aria-hidden="true">{ICONE[s.plataforma] ?? "📟"} </span>{s.plataforma}<div className="text-xs text-suave">ping {haQuanto(s.ultimoPing)} · entrou {haQuanto(s.criado)}</div></div>
              <BotaoConfirmar rotulo="Encerrar" confirmacao="Confirmar" aoConfirmar={() => aoEncerrar(s.sessao)} />
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  );
}
