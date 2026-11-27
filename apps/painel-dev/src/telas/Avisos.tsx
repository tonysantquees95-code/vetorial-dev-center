import { useEffect, useRef, useState } from "react";
import type { AlertasDev } from "../api";
import { useApp } from "../estado";
import { haQuanto } from "../logica";
import { Botao, Selo } from "../ui";

const TOM = { build: "erro", relato: "aviso", alta: "erro", cadastro: "ok", download: "ok", pagamento: "ok", cobranca: "erro" } as const;
const NOME = { build: "Build", relato: "Erro relatado", alta: "Erro em alta", cadastro: "Novo usuário", download: "Download", pagamento: "Pagamento", cobranca: "Cobrança" } as const;

/** Faixa no alto do painel: build quebrado, erro relatado nos apps, erro em alta, novo cadastro e download de app. Confere a cada minuto com o painel aberto. */
export function FaixaDeAvisos() {
  const { api } = useApp();
  const [d, setD] = useState<AlertasDev | null>(null);
  const [aberta, setAberta] = useState(false);
  const vistos = useRef<Set<number> | null>(null);
  const [perm, setPerm] = useState<string>(typeof Notification === "undefined" ? "indisponivel" : Notification.permission);

  async function ler() {
    try {
      const r = await api.alertas();
      const novos = r.alertas.filter((a) => a.status === "novo");
      if (vistos.current && perm === "granted") {
        for (const a of novos) if (!vistos.current.has(a.id)) { try { new Notification(a.titulo, { body: a.detalhe }); } catch { /* sem notificação no aparelho */ } }
      }
      vistos.current = new Set(novos.map((a) => a.id));
      setD(r);
    } catch { /* sem rede agora: tenta de novo no próximo minuto */ }
  }
  useEffect(() => { void ler(); const t = setInterval(() => void ler(), 60000); return () => clearInterval(t); }, [perm]); // eslint-disable-line react-hooks/exhaustive-deps

  async function marcar(corpo: { id?: number; status?: string; todos?: boolean }) { try { await api.marcarAlertas(corpo); } catch { /* ignora */ } void ler(); }
  if (!d || !d.alertas.length) return null;
  const abertos = d.alertas.filter((a) => a.status !== "resolvido");
  if (!abertos.length) return null;
  const temNovo = d.novos > 0;
  return (
    <section aria-label="Avisos do Painel" className={`mx-4 mt-3 rounded-2xl border p-3 md:mx-6 ${temNovo ? "border-erro/40 bg-erro/10" : "border-borda bg-white/5"}`}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setAberta(!aberta)} aria-expanded={aberta} className="min-h-10 flex-1 text-left text-sm font-medium">
          {temNovo ? `⚠ ${d.novos} aviso${d.novos > 1 ? "s" : ""} novo${d.novos > 1 ? "s" : ""}` : `${abertos.length} aviso${abertos.length > 1 ? "s" : ""} em aberto`}
          <span className="ml-2 text-xs font-normal text-suave">{aberta ? "Fechar" : "Ver"}</span>
        </button>
        {temNovo && <Botao className="min-h-9 px-3 text-xs" onClick={() => void marcar({ todos: true })}>Marcar como visto</Botao>}
      </div>
      {aberta && (
        <ul className="mt-2 space-y-2">
          {abertos.slice(0, 12).map((a) => (
            <li key={a.id} className="rounded-xl border border-borda bg-black/20 p-3">
              <div className="flex flex-wrap items-center gap-2"><Selo tom={TOM[a.tipo]}>{NOME[a.tipo]}</Selo><span className="text-sm font-medium">{a.titulo}</span></div>
              <div className="mt-1 text-xs text-suave">{a.detalhe} · {haQuanto(a.criado)}</div>
              <div className="mt-2 flex gap-2">
                {a.status === "novo" && <Botao className="min-h-9 px-3 text-xs" onClick={() => void marcar({ id: a.id, status: "visto" })}>Visto</Botao>}
                <Botao className="min-h-9 px-3 text-xs" onClick={() => void marcar({ id: a.id, status: "resolvido" })}>Resolvido</Botao>
              </div>
            </li>
          ))}
        </ul>
      )}
      {aberta && perm === "default" && <div className="mt-2"><Botao className="min-h-9 px-3 text-xs" onClick={() => void Notification.requestPermission().then(setPerm)}>Avisar também pelo aparelho</Botao></div>}
    </section>
  );
}
