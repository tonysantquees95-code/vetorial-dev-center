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
    try {
      setDado(await f.current());
      setErro("");
    } catch (e) {
      setErro(e instanceof ErroApi ? e.message : "Não deu certo.");
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
