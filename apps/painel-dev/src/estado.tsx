import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { criarCliente, dispositivoDoPainel, enderecoAtual, gravarGuardado, lerGuardado, ErroApi, type Cliente, type Guardado, type SessaoAdmin } from "./api";
import { normalizarUrl, type Ambiente } from "./logica";

interface Ctx {
  g: Guardado;
  api: Cliente;
  endereco: string;
  email: string | null;
  expira: number;
  logado: boolean;
  trocarAmbiente: (a: Ambiente) => void;
  salvarUrl: (a: "homologacao" | "local", url: string) => string | null;
  iniciar: (s: SessaoAdmin) => void;
  sair: () => Promise<void>;
  dispositivo: () => object;
}
const Contexto = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(Contexto);
  if (!c) throw new Error("fora do provedor");
  return c;
};

export function Provedor({ children }: { children: ReactNode }) {
  const [g, setG] = useState<Guardado>(() => {
    const x = lerGuardado();
    gravarGuardado(x);
    return x;
  });
  const ref = useRef(g);
  ref.current = g;

  const atualizar = useCallback((f: (x: Guardado) => Guardado) => {
    const novo = f(ref.current);
    ref.current = novo;
    gravarGuardado(novo);
    setG(novo);
  }, []);

  const api = useMemo(
    () =>
      criarCliente(
        () => enderecoAtual(ref.current),
        () => ref.current.sessoes[ref.current.ambiente]?.token ?? "",
        () => atualizar((x) => ({ ...x, sessoes: { ...x.sessoes, [x.ambiente]: undefined } })) // sessão recusada: volta ao login
      ),
    [atualizar]
  );

  const sessao = g.sessoes[g.ambiente];
  const valor: Ctx = {
    g,
    api,
    endereco: enderecoAtual(g),
    email: sessao?.email ?? null,
    expira: sessao?.expira ?? 0,
    logado: !!sessao && sessao.expira > Date.now(),
    trocarAmbiente: (a) => atualizar((x) => ({ ...x, ambiente: a })),
    salvarUrl: (a, url) => {
      const n = url.trim() ? normalizarUrl(url) : "";
      if (n === null) return "Endereço inválido. Use https:// (ou http:// só em rede local).";
      atualizar((x) => ({ ...x, urls: { ...x.urls, [a]: n } }));
      return null;
    },
    iniciar: (s) => atualizar((x) => ({ ...x, sessoes: { ...x.sessoes, [x.ambiente]: { token: s.token, email: s.usuario.email, expira: s.expira } } })),
    sair: async () => {
      try {
        await api.sair();
      } catch (e) {
        if (!(e instanceof ErroApi)) throw e;
      }
      atualizar((x) => ({ ...x, sessoes: { ...x.sessoes, [x.ambiente]: undefined } }));
    },
    dispositivo: () => dispositivoDoPainel(ref.current)
  };
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
