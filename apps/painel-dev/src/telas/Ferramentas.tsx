import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { COR_DO_PROVEDOR, compacto, nomeDoProvedor } from "../logica";
import { Aviso, Cartao, Carregando, Ponto, Selo } from "../ui";

/** Mapa de quem executa o quê: cada função/automação, o provedor em uso, a reserva e a atividade recente. */
export function Ferramentas() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando } = useBusca(() => api.ferramentas(), 20_000, endereco);
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  return (
    <div className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}
      <Cartao titulo="Provedores de IA" descricao="Groq cuida de velocidade e texto, DeepSeek de lógica, código e BI, e o Gemini só entra com imagem, PDF, áudio ou OCR.">
        <div className="grid gap-2 sm:grid-cols-3">
          {dado.provedores.map((p) => (
            <div key={p.id} className="rounded-xl border border-borda bg-white/3 p-3">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_DO_PROVEDOR[p.id] }} />{nomeDoProvedor(p.id)}</span>
                <Selo tom={!p.chaveConfigurada ? "erro" : p.ligado ? "ok" : "aviso"}>{!p.chaveConfigurada ? "sem chave" : p.ligado ? "ligado" : "desligado"}</Selo></div>
              <div className="num mt-2 text-xs text-suave">{compacto(p.requisicoes24h)} requisições em 24 h · {p.erros24h} erros</div>
            </div>
          ))}
        </div>
      </Cartao>

      <Cartao titulo="Funções atribuídas às IAs" descricao="Quem está executando cada automação agora. Se o provedor principal for desligado nos Ajustes, a reserva assume.">
        <ul className="space-y-2">
          {dado.automacoes.map((a) => (
            <li key={a.id} className="rounded-xl border border-borda bg-white/3 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium"><Ponto tom={a.ativaAgora ? "ok" : "neutro"} vivo={a.ativaAgora} />{a.rotulo}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-suave">
                    <span>Executa:</span>
                    {a.emUso ? <Selo tom="ok">{nomeDoProvedor(a.emUso)}{a.emUso !== a.executor ? " (reserva)" : ""}</Selo> : <Selo tom="erro">nenhum ligado</Selo>}
                    {a.reserva && a.emUso === a.executor && <span>· reserva: {nomeDoProvedor(a.reserva)}</span>}
                    {!a.reserva && <span>· sem reserva</span>}
                  </div>
                </div>
                <div className="num flex-none text-right text-xs text-suave"><div className="text-base font-semibold text-texto">{compacto(a.requisicoes24h)}</div>em 24 h</div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">{a.funcoes.map((f) => <Selo key={f.tarefa}>{f.tarefa}</Selo>)}</div>
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao titulo="Serviços de backend" descricao="Automações que rodam no Worker da Cloudflare, e o que cada uma usa.">
        <ul className="space-y-2">
          {dado.servicos.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-borda bg-white/3 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium"><Ponto tom={!s.configurado ? "aviso" : (s.atividadeHora ?? 0) > 0 ? "ok" : "neutro"} vivo={(s.atividadeHora ?? 0) > 0} />{s.rotulo}</div>
                <div className="mt-0.5 text-xs text-suave">{s.executor}</div>
              </div>
              <div className="flex-none text-right">
                <Selo tom={s.configurado ? "ok" : "aviso"}>{s.configurado ? "configurado" : "falta chave"}</Selo>
                {s.atividadeHora !== null && <div className="num mt-1 text-xs text-suave">{s.atividadeHora} na última hora</div>}
              </div>
            </li>
          ))}
        </ul>
      </Cartao>
    </div>
  );
}
