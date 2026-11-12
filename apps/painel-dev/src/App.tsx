import { useEffect, useState } from "react";
import { useApp } from "./estado";
import { Ajustes } from "./telas/Ajustes";
import { AvisoDeAtualizacao, LinksDaVenus } from "./telas/Aplicativos";
import { SeletorDeAmbiente } from "./telas/Ambiente";
import { Bi } from "./telas/Bi";
import { Cofre } from "./telas/Cofre";
import { Dispositivos } from "./telas/Dispositivos";
import { Ferramentas } from "./telas/Ferramentas";
import { Login } from "./telas/Login";
import { Projetos } from "./telas/Projetos";
import { Trafego } from "./telas/Trafego";
import { Icone } from "./ui";
import { LogoVivo } from "./logo";

function Links() {
  return <div className="mx-auto max-w-3xl"><LinksDaVenus /></div>;
}

/** Atualizar a página: limpa os caches do app instalado e recarrega, para pegar a versão nova na hora. */
async function atualizarPagina() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
  } catch { /* segue para o recarregamento mesmo assim */ }
  const u = new URL(location.href);
  u.searchParams.set("r", String(Date.now()));
  location.replace(u.toString());
}

function BotaoAtualizar({ className = "" }: { className?: string }) {
  const [girando, setGirando] = useState(false);
  return (
    <button type="button" aria-label="Atualizar a página" title="Atualizar" disabled={girando}
      onClick={() => { setGirando(true); void atualizarPagina(); }}
      className={`flex h-10 w-10 flex-none items-center justify-center rounded-full border border-borda bg-white/5 text-suave transition hover:bg-white/10 hover:text-white ${className}`}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={girando ? "animate-spin" : ""} aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v5h-5" /></svg>
    </button>
  );
}

const ABAS = [
  { id: "projetos", rotulo: "Projetos", detalhe: "Builds, versões e downloads", icone: "pasta", tela: Projetos },
  { id: "links", rotulo: "Links e atalhos", detalhe: "Sites, downloads e páginas", icone: "link", tela: Links },
  { id: "bi", rotulo: "BI", detalhe: "Números e gráficos", icone: "grafico", tela: Bi },
  { id: "ferramentas", rotulo: "Funções", detalhe: "IA e automações", icone: "chip", tela: Ferramentas },
  { id: "trafego", rotulo: "Tráfego", detalhe: "Uso e atividade", icone: "pulso", tela: Trafego },
  { id: "dispositivos", rotulo: "Aparelhos", detalhe: "Onde o app está instalado", icone: "celular", tela: Dispositivos },
  { id: "cofre", rotulo: "Cofre", detalhe: "Chaves e senhas das APIs", icone: "cadeado", tela: Cofre },
  { id: "ajustes", rotulo: "Ajustes", detalhe: "Conta, ambiente e cache", icone: "engrenagem", tela: Ajustes }
] as const;
/** Os que ficam sempre à mão na barra de baixo; o resto está no menu. */
const FIXAS: Id[] = ["projetos", "links", "bi"];
type Id = (typeof ABAS)[number]["id"];

const daHash = (): Id => (ABAS.find((a) => `#/${a.id}` === location.hash)?.id ?? "projetos") as Id;

export function App() {
  const { logado, email, g } = useApp();
  const [aba, setAba] = useState<Id>(daHash);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const f = () => setAba(daHash());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  // o botão voltar do aparelho fecha o menu em vez de sair da aba
  useEffect(() => {
    if (!menu) return;
    try { history.pushState({ menu: 1 }, ""); } catch { return; }
    let porVoltar = false;
    const f = () => { porVoltar = true; setMenu(false); };
    window.addEventListener("popstate", f, { once: true });
    return () => { window.removeEventListener("popstate", f); if (!porVoltar && history.state?.menu) history.back(); };
  }, [menu]);
  const ir = (id: Id) => {
    location.hash = `/${id}`;
    setAba(id);
    setMenu(false);
    window.scrollTo({ top: 0 });
  };
  if (!logado) return <Login />;
  const Atual = (ABAS.find((a) => a.id === aba) ?? ABAS[0]).tela;
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px]">
      <aside className="sticky top-0 hidden h-dvh w-56 flex-none flex-col gap-1 border-r border-borda p-4 md:flex">
        <div className="mb-4 flex items-center gap-2"><LogoVivo tam={36} /><div><div className="text-sm font-semibold leading-tight">Painel Dev</div><div className="text-[11px] text-suave">Vetorial Tech</div></div></div>
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => ir(a.id)} aria-current={aba === a.id ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${aba === a.id ? "bg-ciano/15 text-ciano" : "text-suave hover:bg-white/5"}`}><Icone nome={a.icone} />{a.rotulo}</button>
        ))}
        <div className="mt-auto space-y-2"><SeletorDeAmbiente /><div className="truncate text-[11px] text-suave">{email}</div></div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-borda bg-fundo/85 px-4 py-2.5 backdrop-blur md:hidden" style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
          <button type="button" onClick={() => setMenu(true)} aria-haspopup="dialog" aria-label="Abrir o menu" className="-ml-1 flex min-h-10 min-w-0 items-center gap-2 rounded-xl px-1 active:bg-white/5"><LogoVivo tam={30} /><h1 className="truncate text-[15px] font-semibold">{ABAS.find((a) => a.id === aba)?.rotulo}</h1><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-suave" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></button>
          <div className="flex flex-none items-center gap-2"><BotaoAtualizar className="h-9 w-9" />
          <span className={`flex-none rounded-full border px-2.5 py-1 text-[11px] font-medium ${g.ambiente === "producao" ? "border-ok/30 bg-ok/15 text-ok" : g.ambiente === "homologacao" ? "border-aviso/30 bg-aviso/15 text-aviso" : "border-violeta/40 bg-violeta/20 text-violet-200"}`}>{g.ambiente === "producao" ? "Produção" : g.ambiente === "homologacao" ? "Homologação" : "Teste local"}</span></div>
        </header>
        <div className="fixed right-4 top-3 z-30 hidden md:block"><BotaoAtualizar /></div>
        <AvisoDeAtualizacao />
        <main className="px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6">
          <h1 className="mb-4 hidden text-xl font-semibold md:block">{ABAS.find((a) => a.id === aba)?.rotulo}</h1>
          <Atual />
        </main>
      </div>
      <nav aria-label="Seções" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-borda bg-fundo/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {ABAS.filter((a) => FIXAS.includes(a.id)).map((a) => (
          <button key={a.id} onClick={() => ir(a.id)} aria-current={aba === a.id ? "page" : undefined} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] ${aba === a.id ? "text-ciano" : "text-suave"}`}><Icone nome={a.icone} tam={22} /><span className="max-w-full truncate px-1">{a.id === "links" ? "Links" : a.rotulo}</span></button>
        ))}
        <button onClick={() => setMenu(true)} aria-haspopup="dialog" className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] ${!FIXAS.includes(aba) ? "text-ciano" : "text-suave"}`}><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>Menu</button>
      </nav>
      {menu && <MenuPopup aba={aba} ir={ir} fechar={() => setMenu(false)} email={email ?? ""} />}
    </div>
  );
}

/** Menu em pop-up: abre pela fotinho/título lá em cima ou pelo "Menu" embaixo e mostra todas as seções. */
function MenuPopup({ aba, ir, fechar, email }: { aba: Id; ir: (id: Id) => void; fechar: () => void; email: string }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); };
    window.addEventListener("keydown", tecla);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", tecla); document.body.style.overflow = antes; };
  }, [fechar]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Menu do Painel Dev">
      <button type="button" aria-label="Fechar o menu" onClick={fechar} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-borda bg-fundo p-4 shadow-2xl md:rounded-3xl" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 md:hidden" aria-hidden="true" />
        <div className="mb-3 flex items-center gap-3">
          <LogoVivo tam={40} />
          <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold leading-tight">Painel Dev</div><div className="truncate text-xs text-suave">{email || "Vetorial Tech"}</div></div>
          <button type="button" onClick={fechar} aria-label="Fechar" className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-borda bg-white/5 text-suave"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ABAS.map((a) => (
            <button key={a.id} type="button" onClick={() => ir(a.id)} aria-current={aba === a.id ? "page" : undefined}
              className={`flex min-h-[84px] flex-col items-start justify-between gap-1 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${aba === a.id ? "border-ciano/50 bg-ciano/10 text-ciano" : "border-borda bg-white/4 hover:bg-white/8"}`}>
              <Icone nome={a.icone} tam={22} />
              <span><span className="block text-sm font-medium leading-tight">{a.rotulo}</span><span className={`block text-[11px] leading-snug ${aba === a.id ? "text-ciano/70" : "text-suave"}`}>{a.detalhe}</span></span>
            </button>
          ))}
        </div>
        <div className="mt-3"><SeletorDeAmbiente compacto /></div>
      </div>
    </div>
  );
}
