import { useState } from "react";
import { ErroApi, type Contagem, type Relato } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, Botao, Cartao, Carregando, Indicador, Selo, Vazio } from "../ui";

type Filtro = "novos" | "problema" | "ideia" | "elogio" | "pesquisa" | "assinatura" | "todos";
const TIPO: Record<Relato["tipo"], { rotulo: string; tom: "erro" | "ok" | "aviso" | "neutro" }> = {
  problema: { rotulo: "Erro", tom: "erro" }, ideia: { rotulo: "Ideia", tom: "aviso" }, elogio: { rotulo: "Elogio", tom: "ok" }, pesquisa: { rotulo: "Pesquisa", tom: "neutro" }, assinatura: { rotulo: "Vai assinar?", tom: "aviso" },
};

function Barras({ titulo, itens, total }: { titulo: string; itens: Contagem[]; total: number }) {
  if (!itens.length) return null;
  return (
    <div>
      <div className="mb-2 text-xs font-medium text-suave">{titulo}</div>
      <ul className="space-y-1.5">
        {itens.map((i) => (
          <li key={i.id} className="text-sm">
            <div className="flex justify-between gap-2"><span>{i.nome}</span><span className="text-suave">{i.n}</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-ciano to-violeta" style={{ width: `${Math.max(6, Math.round((100 * i.n) / Math.max(1, total)))}%` }} /></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tudo que as pessoas mandam de dentro dos apps: erros, ideias, elogios e a pesquisa rápida (o que dá certo e o que não dá). */
export function Feedback() {
  const { api, endereco } = useApp();
  const [filtro, setFiltro] = useState<Filtro>("novos");
  const { dado, erro, carregando, recarregar } = useBusca(() => api.feedback(), 15_000, endereco);
  const [msg, setMsg] = useState("");
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  const r = dado.resumo;
  const lista = dado.relatos.filter((x) => (filtro === "novos" ? x.status === "novo" : filtro === "todos" ? true : x.tipo === filtro));
  async function marcar(id: number, status: string) {
    setMsg("");
    try { await api.marcarFeedback(id, status); void recarregar(); } catch (e) { setMsg(e instanceof ErroApi ? e.message : "Não deu certo."); }
  }
  const filtros: [Filtro, string][] = [["novos", `Novos (${r.novos})`], ["problema", "Erros"], ["ideia", `Ideias (${r.ideias})`], ["elogio", `Elogios (${r.elogios})`], ["assinatura", `Vai assinar? (${r.assinaturas})`], ["pesquisa", `Pesquisas (${r.pesquisas})`], ["todos", `Todos (${r.total})`]];
  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      {msg && <Aviso tom="erro">{msg}</Aviso>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Novos" valor={String(r.novos)} tom={r.novos ? "aviso" : "neutro"} />
        <Indicador rotulo="Erros em aberto" valor={String(r.problemas)} tom={r.problemas ? "erro" : "ok"} />
        <Indicador rotulo="Nota média (1 a 5)" valor={r.notaMedia === null ? "—" : String(r.notaMedia)} detalhe={`${r.pesquisas} pesquisa(s)`} />
        <Indicador rotulo="Ideias" valor={String(r.ideias)} />
      </div>
      {r.assinaturas > 0 && (
        <Cartao titulo="Vão assinar?" descricao="Resposta de quem está testando ou já usa os apps pagos">
          <div className="grid gap-5 md:grid-cols-2">
            <Barras titulo="Decisão" itens={r.decisoes} total={r.assinaturas} />
            <Barras titulo="Por que não ou ainda não" itens={r.motivosNao} total={r.assinaturas} />
          </div>
        </Cartao>
      )}
      {r.pesquisas > 0 && (
        <Cartao titulo="O que a pesquisa mostra" descricao="Respostas da pesquisa rápida dentro dos apps">
          <div className="grid gap-5 md:grid-cols-2">
            <Barras titulo="O app ajuda?" itens={r.ajuda} total={r.pesquisas} />
            <Barras titulo="Indicaria para um amigo?" itens={r.indicaria} total={r.pesquisas} />
            <Barras titulo="O que mais chamou a atenção" itens={r.chamou} total={r.pesquisas} />
            <Barras titulo="Como conheceu a Vetorial" itens={r.comoConheceu} total={r.pesquisas} />
          </div>
        </Cartao>
      )}
      <div role="group" aria-label="Filtro" className="flex flex-wrap gap-2">
        {filtros.map(([id, nome]) => (
          <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}
            className={`min-h-10 rounded-full border px-4 text-sm font-medium transition ${filtro === id ? "border-ciano bg-ciano/15 text-ciano" : "border-borda bg-white/5 text-suave hover:text-white"}`}>
            {filtro === id ? "✓ " : ""}{nome}
          </button>
        ))}
      </div>
      {!lista.length && <Vazio>Nada por aqui{filtro === "novos" ? ": tudo foi visto." : "."}</Vazio>}
      <div className="space-y-3">
        {lista.map((x) => (
          <Cartao key={x.id}>
            <div className="flex flex-wrap items-center gap-2">
              <Selo tom={TIPO[x.tipo].tom}>{TIPO[x.tipo].rotulo}</Selo>
              <Selo>{dado.apps[x.app] ?? x.app}{x.versao ? ` ${x.versao}` : ""} · {x.plataforma}</Selo>
              {x.status !== "novo" && <Selo tom={x.status === "resolvido" ? "ok" : "neutro"}>{x.status === "resolvido" ? "Resolvido" : "Visto"}</Selo>}
              <span className="ml-auto text-xs text-suave">{haQuanto(x.criado)}</span>
            </div>
            {x.texto && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{x.texto}</p>}
            {x.tipo === "assinatura" && (
              <ul className="mt-3 space-y-1 text-sm text-suave">
                <li>Decisão: <b className="text-texto">{dado.rotulos.decisao?.[x.respostas.decisao ?? ""] ?? x.respostas.decisao}</b></li>
                {x.respostas.motivo && <li>Motivo: <b className="text-texto">{dado.rotulos.motivo?.[x.respostas.motivo] ?? x.respostas.motivo}</b></li>}
                {x.respostas.dias_de_uso != null && <li>Dias de uso: <b className="text-texto">{x.respostas.dias_de_uso}</b>{x.respostas.plano ? ` · plano ${x.respostas.plano}` : ""}</li>}
              </ul>
            )}
            {x.tipo === "pesquisa" && (
              <ul className="mt-3 space-y-1 text-sm text-suave">
                {x.nota !== null && <li>Nota: <b className="text-texto">{x.nota}/5</b></li>}
                {x.respostas.ajuda && <li>Ajuda: <b className="text-texto">{dado.rotulos.ajuda?.[x.respostas.ajuda] ?? x.respostas.ajuda}</b></li>}
                {x.respostas.chamou?.length ? <li>Chamou atenção: <b className="text-texto">{x.respostas.chamou.map((k) => dado.rotulos.chamou?.[k] ?? k).join(", ")}</b></li> : null}
                {x.respostas.como_conheceu && <li>Conheceu por: <b className="text-texto">{dado.rotulos.como_conheceu?.[x.respostas.como_conheceu] ?? x.respostas.como_conheceu}</b></li>}
                {x.respostas.indicaria && <li>Indicaria: <b className="text-texto">{dado.rotulos.indicaria?.[x.respostas.indicaria] ?? x.respostas.indicaria}</b></li>}
                {x.respostas.falta && <li>Falta/não funcionou: <span className="text-texto">{x.respostas.falta}</span></li>}
                {x.respostas.por_que && <li>Por que testou: <span className="text-texto">{x.respostas.por_que}</span></li>}
              </ul>
            )}
            {x.contato && <p className="mt-2 text-xs text-suave">Contato: <span className="text-texto">{x.contato}</span></p>}
            {x.aparelho && <p className="mt-1 break-words text-xs text-suave">{x.aparelho}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {x.status !== "visto" && x.status !== "resolvido" && <Botao onClick={() => void marcar(x.id, "visto")}>Marcar como visto</Botao>}
              {x.status !== "resolvido" && <Botao variante="primario" onClick={() => void marcar(x.id, "resolvido")}>Resolvido</Botao>}
              {x.status !== "novo" && <Botao onClick={() => void marcar(x.id, "novo")}>Reabrir</Botao>}
            </div>
          </Cartao>
        ))}
      </div>
    </div>
  );
}
