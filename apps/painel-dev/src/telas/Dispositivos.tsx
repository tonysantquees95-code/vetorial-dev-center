import { useState } from "react";
import { ErroApi, type ContaDisp } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, BotaoConfirmar, Cartao, Carregando, Indicador, Selo, Vazio } from "../ui";

const ICONE: Record<string, string> = { android: "🤖", ios: "📱", windows: "🖥️", web: "🌐" };

/** Sessões ativas de todas as contas, com a regra de 3 aparelhos vinculados e 2 ativos ao mesmo tempo. */
export function Dispositivos() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando, recarregar } = useBusca(() => api.dispositivos(), 10_000, endereco);
  const [msg, setMsg] = useState("");
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  const noLimite = dado.contas.filter((c) => c.ativas >= dado.maxAtivas).length;

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
      <div className="grid grid-cols-3 gap-3">
        <Indicador rotulo="Sessões ativas" valor={String(dado.sessoesAtivas)} detalhe={`ping nos últimos ${Math.round(dado.ttlMs / 60000)} min`} />
        <Indicador rotulo="Contas" valor={String(dado.contas.length)} />
        <Indicador rotulo="No limite" valor={String(noLimite)} detalhe={`${dado.maxAtivas} ativas por conta`} tom={noLimite ? "aviso" : "neutro"} />
      </div>
      {dado.contas.length === 0 && <Vazio>Nenhuma conta do Vetorial ID ainda.</Vazio>}
      <div className="grid gap-3 lg:grid-cols-2">{dado.contas.map((c) => <Conta key={c.usuario} c={c} max={dado.maxDispositivos} maxAtivas={dado.maxAtivas} aoEncerrar={encerrar} />)}</div>
    </div>
  );
}

function Conta({ c, max, maxAtivas, aoEncerrar }: { c: ContaDisp; max: number; maxAtivas: number; aoEncerrar: (id: string) => void }) {
  return (
    <Cartao titulo={c.nome || c.email} descricao={c.nome ? c.email : undefined} acao={<Selo tom={c.ativas >= maxAtivas ? "aviso" : "neutro"}>{c.ativas}/{maxAtivas} ativas</Selo>}>
      <div className="mb-3 flex items-center gap-1.5" aria-label={`${c.dispositivos} de ${max} aparelhos vinculados`}>
        {Array.from({ length: max }, (_, i) => <span key={i} className={`h-2 flex-1 rounded-full ${i < c.dispositivos ? "bg-ciano" : "bg-white/10"}`} />)}
        <span className="num ml-1 text-xs text-suave">{c.dispositivos}/{max} vinculados</span>
      </div>
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
