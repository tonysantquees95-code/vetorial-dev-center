import { useCallback, useEffect, useRef, useState } from "react";
import { ErroApi } from "./api";

/** Busca agora e repete a cada `ms` enquanto a aba está visível. Falhas não apagam o último dado bom. */
export function useBusca<T>(buscar: () => Promise<T>, ms: number | null, chave: string) {
  const [dado, setDado] = useState<T | null>(null);
  const [erro, setErro] = useState<string>("");
  const [carregando, setCarregando] = useState(true);
  const f = useRef(buscar);
  f.current = buscar;

  const rodar = useCallback(async () => {
    // a 1ª chamada costuma falhar (servidor "acordando"/rede ainda subindo): tenta de novo sozinho antes de mostrar erro
    for (let tentativa = 0; ; tentativa++) {
      try {
        setDado(await f.current());
        setErro("");
        break;
      } catch (e) {
        const passageiro = !(e instanceof ErroApi) || e.status === 0 || e.status >= 500;
        if (passageiro && tentativa < 3) {
          await new Promise((r) => setTimeout(r, 1200 * (tentativa + 1)));
          continue;
        }
        setErro(e instanceof ErroApi ? e.message : "Não deu certo.");
        break;
      }
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    setDado(null);
    setCarregando(true);
    void rodar();
    if (!ms) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void rodar();
    }, ms);
    const v = () => document.visibilityState === "visible" && void rodar();
    document.addEventListener("visibilitychange", v);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", v);
    };
  }, [chave, ms, rodar]);

  return { dado, erro, carregando, recarregar: rodar, definir: setDado };
}
