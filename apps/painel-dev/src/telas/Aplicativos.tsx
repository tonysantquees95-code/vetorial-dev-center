import { useEffect, useState } from "react";
import { rodandoNoApp } from "@venus/nucleo";
import { useApp } from "../estado";
import { REPOSITORIO, plataformaDe, ultimoApk, ultimoWindows } from "../logica";
import { Aviso, Botao, Cartao } from "../ui";

const BUILD = Number(((import.meta.env as Record<string, string | undefined>).VITE_BUILD) ?? 0) || 0;

interface PromptInstalar extends Event { prompt: () => Promise<void> }
let guardado: PromptInstalar | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); guardado = e as PromptInstalar; });
}

/** Última versão do APK publicada (API pública do GitHub); null enquanto carrega ou se falhar. */
function useUltimoApk() {
  return useUltimas().apk;
}
function useUltimas() {
  const [v, setV] = useState<{ apk: { build: number; url: string } | null; windows: { build: number; url: string } | null }>({ apk: null, windows: null });
  useEffect(() => {
    let vivo = true;
    fetch(`https://api.github.com/repos/${REPOSITORIO}/releases?per_page=20`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo) setV({ apk: ultimoApk(j), windows: ultimoWindows(j) }); })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);
  return v;
}

const abrir = (url: string) => { window.location.href = url; };

/** Faixa de atualização: aparece sozinha dentro do APK quando há versão mais nova (o site/PWA já se atualiza sozinho). */
export function AvisoDeAtualizacao() {
  const ultimo = useUltimoApk();
  if (!rodandoNoApp() || !ultimo || BUILD === 0 || ultimo.build <= BUILD) return null;
  return (
    <div className="mx-auto mb-3 max-w-3xl px-3 pt-3">
      <Aviso tom="neutro">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Versão nova do Painel Dev disponível (1.{ultimo.build}).</span>
          <Botao variante="primario" onClick={() => abrir(ultimo.url)}>Atualizar agora</Botao>
        </div>
      </Aviso>
    </div>
  );
}

/** Download do app Android e instalação no Windows; aparece destacado conforme o aparelho de quem entra. */
export function Aplicativos() {
  const { apk: ultimo, windows: ultimoWin } = useUltimas();
  const plataforma = plataformaDe(navigator.userAgent);
  const [podeInstalar, setPodeInstalar] = useState(!!guardado);
  const [instalado, setInstalado] = useState(false);
  useEffect(() => {
    const a = () => setPodeInstalar(!!guardado);
    const b = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", a);
    window.addEventListener("appinstalled", b);
    return () => { window.removeEventListener("beforeinstallprompt", a); window.removeEventListener("appinstalled", b); };
  }, []);
  if (rodandoNoApp()) return null;
  const instalarWeb = async () => {
    if (!guardado) return;
    await guardado.prompt();
    guardado = null;
    setPodeInstalar(false);
  };
  const android = (
    <div className="space-y-2">
      <p className="text-sm text-suave">App Android: baixe, toque no arquivo e instale. Depois ele avisa sozinho quando sair versão nova.</p>
      <Botao variante="primario" className="w-full" disabled={!ultimo} onClick={() => ultimo && abrir(ultimo.url)}>
        {ultimo ? `Baixar APK para Android (1.${ultimo.build})` : "Procurando a versão…"}
      </Botao>
    </div>
  );
  const windows = (
    <div className="space-y-2">
      <p className="text-sm text-suave">Windows: baixe o instalador (tela de instalação e atalho na área de trabalho). O app abre sempre na versão mais recente. Também dá para instalar direto do navegador:</p>
      <Botao variante="primario" className="w-full" disabled={!ultimoWin} onClick={() => ultimoWin && abrir(ultimoWin.url)}>
        {ultimoWin ? `Baixar instalador para Windows (1.${ultimoWin.build})` : "Procurando o instalador…"}
      </Botao>
      {instalado ? <Aviso tom="ok">Painel Dev instalado neste computador.</Aviso> : podeInstalar ? (
        <Botao variante="primario" className="w-full" onClick={() => void instalarWeb()}>Instalar no Windows</Botao>
      ) : (
        <p className="text-xs text-suave">No Edge ou Chrome, abra o menu (⋯) e escolha “Instalar este site como aplicativo”.</p>
      )}
    </div>
  );
  return (
    <Cartao titulo="Baixar o aplicativo" descricao="O Painel Dev como app, sempre na versão mais recente.">
      <div className="space-y-4">
        {plataforma === "windows" ? <>{windows}{android}</> : plataforma === "android" ? <>{android}{windows}</> : <>{windows}{android}</>}
      </div>
    </Cartao>
  );
}

/** Todos os links da suíte num lugar só: abrir, copiar e compartilhar (sem procurar no GitHub nem em pastas). */
export function LinksDaVenus() {
  const { endereco } = useApp();
  const [msg, setMsg] = useState("");
  const base = endereco.replace(/\/+$/, "");
  const grupos: { titulo: string; itens: { rotulo: string; detalhe: string; url: string; abrir?: boolean }[] }[] = [
    { titulo: "Vênus", itens: [
      { rotulo: "Site da Vênus", detalhe: "A página de vendas: planos, teste grátis e entrar.", url: `${base}/`, abrir: true },
      { rotulo: "Vênus no navegador (iPhone)", detalhe: "Para iPhone e qualquer navegador. No Safari: Compartilhar › Adicionar à Tela de Início.", url: `${base}/app/`, abrir: true },
      { rotulo: "Vênus para Android", detalhe: "APK: baixe e toque no arquivo para instalar.", url: `${base}/venus/android` },
      { rotulo: "Vênus para Windows", detalhe: "Instalador: abra no computador.", url: `${base}/venus/windows` },
      { rotulo: "Minha conta (Vetorial ID)", detalhe: "Assinatura, pacotes, aparelhos e downloads.", url: `${base}/conta.html`, abrir: true },
      { rotulo: "Página de download da Vênus", detalhe: "Uma página curta com todos os botões, boa para mandar a clientes.", url: `${base}/venus`, abrir: true },
    ] },
    { titulo: "Vindex", itens: [
      { rotulo: "Vindex para Android", detalhe: "APK do otimizador e organizador.", url: `${base}/vindex/android` },
      { rotulo: "Vindex para Windows", detalhe: "Instalador do Vindex.", url: `${base}/vindex/windows` },
      { rotulo: "Página de download do Vindex", detalhe: "Página curta com os dois botões.", url: `${base}/vindex`, abrir: true },
    ] },
    { titulo: "Vortex", itens: [
      { rotulo: "Vortex para Android", detalhe: "APK da central de jogos retrô.", url: `${base}/vortex/android` },
      { rotulo: "Vortex para Windows", detalhe: "Instalador do Vortex.", url: `${base}/vortex/windows` },
      { rotulo: "Página de download do Vortex", detalhe: "Página curta com os dois botões.", url: `${base}/vortex`, abrir: true },
    ] },
    { titulo: "Administração", itens: [
      { rotulo: "Painel Dev (site)", detalhe: "Abre o painel em qualquer navegador e pode ser instalado como app.", url: `${location.origin}${import.meta.env.BASE_URL}`, abrir: true },
    ] },
  ];
  const todos = grupos.flatMap((g) => g.itens);
  const copiar = async (u: string, nome: string) => {
    try { await navigator.clipboard.writeText(u); setMsg(`Link de “${nome}” copiado.`); } catch { setMsg(u); }
  };
  const compartilhar = async (u: string, nome: string) => {
    try { await navigator.share({ title: nome, url: u }); } catch { await copiar(u, nome); }
  };
  const copiarTudo = async () => {
    const texto = todos.map((i) => `${i.rotulo}: ${i.url}`).join("\n");
    try { await navigator.clipboard.writeText(texto); setMsg("Todos os links foram copiados."); } catch { setMsg(texto); }
  };
  return (
    <Cartao titulo="Links e downloads" descricao="Tudo num lugar só: toque para abrir, copiar ou compartilhar." acao={<Botao onClick={() => void copiarTudo()}>Copiar todos</Botao>}>
      <div className="space-y-5">
        {grupos.map((g) => (
          <section key={g.titulo}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-suave">{g.titulo}</h3>
            <div className="space-y-3">
              {g.itens.map((i) => (
                <div key={i.rotulo} className="rounded-xl border border-borda bg-white/3 px-3 py-2">
                  <div className="text-sm">{i.rotulo}</div>
                  <div className="text-xs text-suave">{i.detalhe}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {i.abrir ? <Botao variante="primario" onClick={() => { window.open(i.url, "_blank", "noopener"); }}>Abrir</Botao> : <Botao variante="primario" onClick={() => { window.location.href = i.url; }}>Baixar</Botao>}
                    <Botao onClick={() => void copiar(i.url, i.rotulo)}>Copiar link</Botao>
                    {typeof navigator.share === "function" && <Botao onClick={() => void compartilhar(i.url, i.rotulo)}>Compartilhar</Botao>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {msg && <p className="break-all text-xs text-suave" role="status">{msg}</p>}
        <p className="text-xs text-suave">Se um download ainda não aparecer, a primeira versão está sendo gerada. A Vênus web só aparece depois que o servidor for publicado com ela.</p>
      </div>
    </Cartao>
  );
}
