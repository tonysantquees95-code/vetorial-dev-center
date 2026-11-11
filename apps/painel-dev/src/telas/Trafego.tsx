import { useEffect, useRef, useState } from "react";
import { ErroApi } from "../api";
import { useApp } from "../estado";
import { filtrarTrafego, mesclarTrafego, tomDoStatusHttp, type FiltroDeTrafego, type LinhaDeTrafego } from "../logica";
import { Aviso, Botao, Cartao, Indicador, Selo, Vazio } from "../ui";
import type { Trafego as TrafegoResp } from "../api";

const FILTROS: { id: FiltroDeTrafego; rotulo: string }[] = [{ id: "todas", rotulo: "Todas" }, { id: "erros", rotulo: "Só erros" }, { id: "lentas", rotulo: "Lentas (≥500 ms)" }];
const hora = (ms: number) => new Date(ms).toLocaleTimeString("pt-BR", { hour12: false });

/** Monitor de requisições do Worker em tempo real (consulta a cada 3 s, só uma linha por pedido, sem dados pessoais). */
export function Trafego() {
  const { api, endereco } = useApp();
  const [linhas, setLinhas] = useState<LinhaDeTrafego[]>([]);
  const [resumo, setResumo] = useState<TrafegoResp["ultimos5min"] | null>(null);
  const [pausado, setPausado] = useState(false);
  const [filtro, setFiltro] = useState<FiltroDeTrafego>("todas");
  const [erro, setErro] = useState("");
  const ultimo = useRef(0);

  useEffect(() => {
    setLinhas([]);
    setResumo(null);
    ultimo.current = 0;
  }, [endereco]);

  useEffect(() => {
    if (pausado) return;
    let vivo = true;
    async function rodar() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await api.trafego(ultimo.current);
        if (!vivo) return;
        ultimo.current = Math.max(ultimo.current, r.ultimo);
        setLinhas((l) => mesclarTrafego(l, r.itens));
        setResumo(r.ultimos5min);
        setErro("");
      } catch (e) {
        if (vivo) setErro(e instanceof ErroApi ? e.message : "Não deu certo.");
      }
    }
    void rodar();
    const t = setInterval(rodar, 3000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [api, pausado, endereco]);

  const visiveis = filtrarTrafego(linhas, filtro);
  return (
    <div className="space-y-4">
      {erro && <Aviso tom="erro">{erro}</Aviso>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador rotulo="Pedidos · 5 min" valor={String(resumo?.total ?? 0)} detalhe={resumo?.rotas[0] ? `mais usada: ${resumo.rotas[0].rota}` : "nada ainda"} />
        <Indicador rotulo="Erros do servidor" valor={String(resumo?.erros ?? 0)} tom={resumo?.erros ? "erro" : "ok"} detalhe={`${resumo?.recusados ?? 0} recusados (4xx)`} />
        <Indicador rotulo="Tempo mediano" valor={`${resumo?.p50 ?? 0} ms`} />
        <Indicador rotulo="Tempo p95" valor={`${resumo?.p95 ?? 0} ms`} tom={(resumo?.p95 ?? 0) >= 800 ? "aviso" : "neutro"} />
      </div>
      <Cartao
        titulo="Tráfego do Cloudflare"
        descricao="Cada linha é um pedido ao Worker. O painel não aparece aqui."
        acao={<Botao onClick={() => setPausado(!pausado)} aria-pressed={pausado}>{pausado ? "Retomar" : "Pausar"}</Botao>}
      >
        <div className="rolagem-x mb-3 flex gap-1.5">
          {FILTROS.map((f) => <button key={f.id} onClick={() => setFiltro(f.id)} aria-pressed={filtro === f.id} className={`min-h-9 flex-none rounded-full border px-3 text-xs ${filtro === f.id ? "border-ciano/50 bg-ciano/15 text-ciano" : "border-borda text-suave"}`}>{f.rotulo}</button>)}
          <span className="ml-auto flex flex-none items-center gap-1.5 px-1 text-xs text-suave">{pausado ? "pausado" : <><span className="ponto-vivo inline-block h-2 w-2 rounded-full bg-ok" />ao vivo</>}</span>
        </div>
        {visiveis.length === 0 ? (
          <Vazio>{linhas.length ? "Nenhum pedido nesse filtro." : "Esperando pedidos… (o registro começa nesta versão do servidor)"}</Vazio>
        ) : (
          <ul className="num divide-y divide-borda/60 text-[13px]" aria-live="off">
            {visiveis.slice(0, 120).map((l) => (
              <li key={l.id} className="flex items-center gap-2 py-2">
                <span className="w-[60px] flex-none text-xs text-suave">{hora(l.quando)}</span>
                <span className="w-11 flex-none text-xs font-semibold text-suave">{l.metodo}</span>
                <span className="min-w-0 flex-1 truncate">{l.rota}</span>
                <span className="hidden flex-none text-xs text-suave sm:inline">{l.origem}</span>
                <Selo tom={tomDoStatusHttp(l.status)}>{l.status}</Selo>
                <span className={`w-14 flex-none text-right text-xs ${l.ms >= 500 ? "text-aviso" : "text-suave"}`}>{l.ms} ms</span>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </div>
  );
}
