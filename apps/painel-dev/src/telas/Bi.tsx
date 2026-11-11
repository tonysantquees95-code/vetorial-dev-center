import { useState } from "react";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { COR_DO_PROVEDOR, compacto, moeda, nomeDoProvedor, soma, variacao } from "../logica";
import { Aviso, Cartao, Carregando, GraficoBarras, GraficoLinhas, Indicador, Selo } from "../ui";

const PERIODOS = [7, 30, 90];
const PROV = ["groq", "deepseek", "gemini"];

/** BI em tempo real (atualiza a cada 30 s): faturamento do Plano Fundadores, IAs, tokens e novos lojistas. */
export function Bi() {
  const { api, endereco } = useApp();
  const [dias, setDias] = useState(30);
  const { dado, erro, carregando } = useBusca(() => api.bi(dias), 30_000, `${endereco}|${dias}`);
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  const t = dado.totais;
  const metade = Math.floor(dado.dias.length / 2);
  const fat1 = soma(dado.faturamentoCentavos.slice(0, metade));
  const fat2 = soma(dado.faturamentoCentavos.slice(metade));
  const v = variacao(fat2, fat1);
  const novos = soma(dado.novosLojistas);
  const semDadosIA = t.requisicoesIA === 0 && t.respostasDoCache === 0;
  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      <div className="flex items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Período" className="inline-flex gap-1 rounded-xl border border-borda bg-white/5 p-1">
          {PERIODOS.map((p) => (
            <button key={p} role="radio" aria-checked={dias === p} onClick={() => setDias(p)} className={`min-h-9 rounded-lg px-3 text-sm ${dias === p ? "bg-ciano/20 text-ciano" : "text-suave"}`}>{p} dias</button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-suave"><span className="ponto-vivo inline-block h-2 w-2 rounded-full bg-ok" />ao vivo</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo={`Faturamento · ${dias} dias`} valor={moeda(t.faturamentoPeriodoCentavos)} detalhe={v === null ? "sem base de comparação" : `${v >= 0 ? "+" : ""}${v}% vs. metade anterior`} tom={v !== null && v < 0 ? "aviso" : "ok"} />
        <Indicador rotulo="Lojas ativas" valor={String(t.lojasAtivas)} detalhe={`${t.pagantes} pagantes · ${t.lojas} cadastradas`} />
        <Indicador rotulo="Novos lojistas" valor={String(novos)} detalhe={`${soma(dado.novasContas)} novas contas Vetorial ID`} />
        <Indicador rotulo="Requisições às IAs" valor={compacto(t.requisicoesIA)} detalhe={`${compacto(t.tokensIA)} tokens · ${compacto(t.respostasDoCache)} do cache`} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <Cartao titulo="Faturamento do Plano Fundadores" descricao={`Pagamentos confirmados por dia · total desde o início: ${moeda(t.faturamentoTotalCentavos)} em ${t.pagamentosTotal} pagamentos.`}>
          <GraficoLinhas dias={dado.dias} series={[{ nome: "Faturamento", cor: "#22d3ee", valores: dado.faturamentoCentavos }]} formato={moeda} descricao="Faturamento diário do Plano Fundadores" />
        </Cartao>
        <Cartao titulo="Novos lojistas" descricao="Lojas criadas por dia (cada conta nova no Vetorial ID cria uma loja com 7 dias de teste).">
          <GraficoBarras dias={dado.dias} valores={dado.novosLojistas} cor="#8b5cf6" descricao="Novos lojistas por dia" />
        </Cartao>
        <Cartao titulo="Requisições nas IAs (Cloudflare)" descricao="Chamadas atendidas por cada provedor, por dia. Respostas do cache não contam.">
          {semDadosIA && <div className="mb-2"><Aviso>Ainda não há uso registrado. A contagem começa a partir desta versão do servidor.</Aviso></div>}
          <GraficoLinhas dias={dado.dias} series={PROV.map((p) => ({ nome: nomeDoProvedor(p), cor: COR_DO_PROVEDOR[p] ?? "#fff", valores: dado.requisicoesIA[p] ?? [] }))} descricao="Requisições por provedor de IA" />
        </Cartao>
        <Cartao titulo="Tokens usados" descricao="Entrada + saída por provedor (o chat com busca na web não informa tokens).">
          <GraficoLinhas dias={dado.dias} series={PROV.map((p) => ({ nome: nomeDoProvedor(p), cor: COR_DO_PROVEDOR[p] ?? "#fff", valores: dado.tokensIA[p] ?? [] }))} descricao="Tokens por provedor de IA" />
          <div className="mt-3 flex flex-wrap gap-2">
            {PROV.map((p) => <Selo key={p} tom={soma(dado.errosIA[p] ?? []) ? "aviso" : "neutro"}>{nomeDoProvedor(p)}: {soma(dado.errosIA[p] ?? [])} erros</Selo>)}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
