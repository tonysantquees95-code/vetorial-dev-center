import { useEffect, useState } from "react";
import { rodandoNoApp } from "@venus/nucleo";
import { REPOSITORIO, plataformaDe, ultimoApk } from "../logica";
import { Aviso, Botao, Cartao } from "../ui";

const BUILD = Number(((import.meta.env as Record<string, string | undefined>).VITE_BUILD) ?? 0) || 0;

interface PromptInstalar extends Event { prompt: () => Promise<void> }
let guardado: PromptInstalar | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); guardado = e as PromptInstalar; });
}

/** Última versão do APK publicada (API pública do GitHub); null enquanto carrega ou se falhar. */
function useUltimoApk() {
  const [v, setV] = useState<{ build: number; url: string } | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch(`https://api.github.com/repos/${REPOSITORIO}/releases?per_page=20`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (vivo) setV(ultimoApk(j)); })
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
  const ultimo = useUltimoApk();
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
      <p className="text-sm text-suave">Windows: instala como aplicativo (janela própria, ícone na área de trabalho). Atualiza sozinho a cada versão.</p>
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
