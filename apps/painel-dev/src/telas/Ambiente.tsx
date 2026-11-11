import { AMBIENTES } from "../logica";
import { useApp } from "../estado";

/** Seletor rápido: Produção / Homologação / Teste local. Cada ambiente guarda a própria sessão. */
export function SeletorDeAmbiente({ compacto = false }: { compacto?: boolean }) {
  const { g, trocarAmbiente, endereco } = useApp();
  return (
    <div>
      <div role="radiogroup" aria-label="Ambiente" className="grid grid-cols-3 gap-1 rounded-xl border border-borda bg-white/5 p-1">
        {AMBIENTES.map((a) => (
          <button key={a.id} type="button" role="radio" aria-checked={g.ambiente === a.id} onClick={() => trocarAmbiente(a.id)}
            className={`min-h-9 truncate rounded-lg px-1.5 text-xs font-medium transition ${g.ambiente === a.id ? (a.id === "producao" ? "bg-ok/20 text-ok" : a.id === "homologacao" ? "bg-aviso/20 text-aviso" : "bg-violeta/25 text-violet-200") : "text-suave hover:bg-white/5"}`}>
            {a.rotulo.replace("Homologação", "Homolog.").replace("Teste local", "Local")}
          </button>
        ))}
      </div>
      {!compacto && <div className="num mt-1 truncate text-[11px] text-suave">{endereco || "sem endereço: configure em Ajustes"}</div>}
      {compacto && !endereco && <div className="mt-1 text-center text-[11px] text-aviso">Esse ambiente ainda não tem endereço. Entre em Produção e configure em Ajustes.</div>}
    </div>
  );
}
