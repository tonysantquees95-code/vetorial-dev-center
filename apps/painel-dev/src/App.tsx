import { useEffect, useState } from "react";
import { useApp } from "./estado";
import { Ajustes } from "./telas/Ajustes";
import { SeletorDeAmbiente } from "./telas/Ambiente";
import { Bi } from "./telas/Bi";
import { Dispositivos } from "./telas/Dispositivos";
import { Ferramentas } from "./telas/Ferramentas";
import { Login } from "./telas/Login";
import { Projetos } from "./telas/Projetos";
import { Trafego } from "./telas/Trafego";
import { Icone } from "./ui";

const ABAS = [
  { id: "projetos", rotulo: "Projetos", icone: "pasta", tela: Projetos },
  { id: "bi", rotulo: "BI", icone: "grafico", tela: Bi },
  { id: "ferramentas", rotulo: "Funções", icone: "chip", tela: Ferramentas },
  { id: "trafego", rotulo: "Tráfego", icone: "pulso", tela: Trafego },
  { id: "dispositivos", rotulo: "Aparelhos", icone: "celular", tela: Dispositivos },
  { id: "ajustes", rotulo: "Ajustes", icone: "engrenagem", tela: Ajustes }
] as const;
type Id = (typeof ABAS)[number]["id"];

const daHash = (): Id => (ABAS.find((a) => `#/${a.id}` === location.hash)?.id ?? "projetos") as Id;

export function App() {
  const { logado, email, g } = useApp();
  const [aba, setAba] = useState<Id>(daHash);
  useEffect(() => {
    const f = () => setAba(daHash());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  const ir = (id: Id) => {
    location.hash = `/${id}`;
    setAba(id);
    window.scrollTo({ top: 0 });
  };
  if (!logado) return <Login />;
  const Atual = (ABAS.find((a) => a.id === aba) ?? ABAS[0]).tela;
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px]">
      <aside className="sticky top-0 hidden h-dvh w-56 flex-none flex-col gap-1 border-r border-borda p-4 md:flex">
        <div className="mb-4 flex items-center gap-2"><img src="/icons/pwa-192.png" alt="" width={36} height={36} className="rounded-xl" /><div><div className="text-sm font-semibold leading-tight">Painel Dev</div><div className="text-[11px] text-suave">Vetorial Tech</div></div></div>
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => ir(a.id)} aria-current={aba === a.id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${aba === a.id ? "bg-ciano/15 text-ciano" : "text-suave hover:bg-white/5"}`}><Icone nome={a.icone} />{a.rotulo}</button>
        ))}
        <div className="mt-auto space-y-2"><SeletorDeAmbiente /><div className="truncate text-[11px] text-suave">{email}</div></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-borda bg-fundo/85 px-4 py-2.5 backdrop-blur md:hidden" style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
          <div className="flex min-w-0 items-center gap-2"><img src="/icons/pwa-192.png" alt="" width={28} height={28} className="rounded-lg" /><h1 className="truncate text-[15px] font-semibold">{ABAS.find((a) => a.id === aba)?.rotulo}</h1></div>
          <span className={`flex-none rounded-full border px-2.5 py-1 text-[11px] font-medium ${g.ambiente === "producao" ? "border-ok/30 bg-ok/15 text-ok" : g.ambiente === "homologacao" ? "border-aviso/30 bg-aviso/15 text-aviso" : "border-violeta/40 bg-violeta/20 text-violet-200"}`}>{g.ambiente === "producao" ? "Produção" : g.ambiente === "homologacao" ? "Homologação" : "Teste local"}</span>
        </header>
        <main className="px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6">
          <h1 className="mb-4 hidden text-xl font-semibold md:block">{ABAS.find((a) => a.id === aba)?.rotulo}</h1>
          <Atual />
        </main>
      </div>
      <nav aria-label="Seções" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[repeat(6,minmax(0,1fr))] border-t border-borda bg-fundo/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => ir(a.id)} aria-current={aba === a.id ? "page" : undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] ${aba === a.id ? "text-ciano" : "text-suave"}`}><Icone nome={a.icone} tam={21} />{a.rotulo}</button>
        ))}
      </nav>
    </div>
  );
}
