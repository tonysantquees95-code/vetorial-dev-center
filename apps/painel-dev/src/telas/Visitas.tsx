import { useState } from "react";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { Aviso, Cartao, Carregando, GraficoBarras, Indicador, Vazio } from "../ui";

const PERIODOS = [{ dias: 7, rotulo: "7 dias" }, { dias: 14, rotulo: "14 dias" }, { dias: 30, rotulo: "30 dias" }] as const;
const NOME_DA_PAGINA = (p: string) => (p === "inicio" ? "Página inicial" : p.replace(/\.html$/, "").replace(/\/$/, "") || p);

/** Quantas pessoas entraram no site (visitantes diferentes por dia, sem guardar IP) e quantos baixaram cada app. */
export function Visitas() {
  const { api, endereco } = useApp();
  const [dias, setDias] = useState<number>(14);
  const { dado, erro, carregando } = useBusca(() => api.visitas(dias), 30_000, `${endereco}|${dias}`);
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  const totalDownloads = dado.downloads.reduce((a, d) => a + d.total, 0);
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Período" className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button key={p.dias} type="button" role="radio" aria-checked={dias === p.dias} onClick={() => setDias(p.dias)}
            className={`min-h-11 rounded-full border px-4 text-sm font-medium transition ${dias === p.dias ? "border-neon bg-neon/15 text-neon" : "border-borda text-suave hover:bg-white/5"}`}>{p.rotulo}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Indicador rotulo="Entraram hoje" valor={String(dado.hoje)} detalhe={`ontem: ${dado.ontem}`} tom="ok" />
        <Indicador rotulo="Últimos 7 dias" valor={String(dado.ultimos7)} detalhe="pessoas por dia, somadas" />
        <Indicador rotulo={`Em ${dado.dias} dias`} valor={String(dado.periodo)} detalhe="pessoas por dia, somadas" />
        <Indicador rotulo="Downloads" valor={String(totalDownloads)} detalhe={`em ${dado.dias} dias`} tom="ok" />
      </div>
      <Cartao titulo="Pessoas por dia" descricao="Cada pessoa conta uma vez por dia. Não guardamos IP nem cookie.">
        <GraficoBarras dias={dado.serie.map((s) => s.dia)} valores={dado.serie.map((s) => s.pessoas)} cor="#22d3ee" descricao="Pessoas que entraram no site por dia" />
      </Cartao>
      <Cartao titulo="Downloads por app">
        {dado.downloads.length === 0 ? <Vazio>Ninguém baixou ainda neste período.</Vazio> : (
          <ul className="divide-y divide-borda">
            {dado.downloads.map((d) => (
              <li key={d.app} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1 truncate">{d.nome}</span><span className="num text-suave">hoje {d.hoje}</span><span className="num w-10 text-right font-semibold">{d.total}</span></li>
            ))}
          </ul>
        )}
      </Cartao>
      <Cartao titulo="Páginas mais vistas">
        {dado.paginas.length === 0 ? <Vazio>Ainda sem visitas neste período.</Vazio> : (
          <ul className="divide-y divide-borda">
            {dado.paginas.map((p) => (
              <li key={p.pagina} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1 truncate">{NOME_DA_PAGINA(p.pagina)}</span><span className="num font-semibold">{p.visitas}</span></li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
