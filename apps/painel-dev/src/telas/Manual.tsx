import { Fragment, type ReactNode } from "react";
import type { ManualDoProjeto } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, Carregando } from "../ui";

/** Texto em linha: **negrito**, `código` e [texto](https://…). Tudo vira elemento do React (nunca HTML solto). */
function emLinha(t: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https:\/\/[^)\s]+\))/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(t))) {
    if (m.index > ultimo) partes.push(t.slice(ultimo, m.index));
    const x = m[0];
    if (x.startsWith("**")) partes.push(<strong key={i++}>{x.slice(2, -2)}</strong>);
    else if (x.startsWith("`")) partes.push(<code key={i++} className="break-words rounded bg-white/8 px-1 text-[0.85em] text-ciano">{x.slice(1, -1)}</code>);
    else {
      const [, rotulo = "", url = ""] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(x) ?? [];
      partes.push(<a key={i++} href={url} target="_blank" rel="noopener noreferrer" className="text-ciano underline">{rotulo}</a>);
    }
    ultimo = m.index + x.length;
  }
  if (ultimo < t.length) partes.push(t.slice(ultimo));
  return partes;
}

const celulas = (linha: string) => linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

/** Markdown simples do manual: títulos, parágrafos, listas, tabelas. Sem imagens e sem HTML. */
export function ManualTexto({ texto }: { texto: string }) {
  const linhas = texto.replace(/\r/g, "").split("\n");
  const blocos: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < linhas.length) {
    const l = linhas[i] ?? "";
    if (!l.trim()) { i++; continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(l);
    if (h) {
      const nivel = (h[1] ?? "").length;
      blocos.push(<h4 key={k++} className={nivel <= 2 ? "mt-5 text-base font-semibold" : "mt-4 text-sm font-semibold text-ciano"}>{emLinha(h[2] ?? "")}</h4>);
      i++;
      continue;
    }
    if (l.trim().startsWith("|") && /^\s*\|?\s*:?-{2,}/.test(linhas[i + 1] ?? "")) {
      const cab = celulas(l);
      i += 2;
      const corpo: string[][] = [];
      while (i < linhas.length && (linhas[i] ?? "").trim().startsWith("|")) corpo.push(celulas(linhas[i++] ?? ""));
      blocos.push(
        <div key={k++} className="mt-3 space-y-2">
          {corpo.map((c, r) => (
            <div key={r} className="rounded-xl border border-borda bg-white/3 p-3 text-sm">
              <div className="font-medium">{emLinha(c[0] ?? "")}</div>
              {cab.slice(1).map((t, j) => (c[j + 1] ?? "") ? (
                <div key={j} className="mt-1.5 break-words"><span className="block text-[11px] uppercase tracking-wide text-suave">{t}</span>{emLinha(c[j + 1] ?? "")}</div>
              ) : null)}
            </div>
          ))}
        </div>,
      );
      continue;
    }
    const item = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
    if (item.test(l)) {
      const ordenada = /^\s*\d+\./.test(l);
      const itens: string[] = [];
      while (i < linhas.length && item.test(linhas[i] ?? "")) itens.push(item.exec(linhas[i++] ?? "")?.[3] ?? "");
      const Lista = ordenada ? "ol" : "ul";
      blocos.push(<Lista key={k++} className={`mt-2 space-y-1.5 pl-5 text-sm ${ordenada ? "list-decimal" : "list-disc"}`}>{itens.map((t, j) => <li key={j} className="break-words">{emLinha(t)}</li>)}</Lista>);
      continue;
    }
    const para: string[] = [];
    while (i < linhas.length && (linhas[i] ?? "").trim() && !/^(#{1,4}\s|\s*([-*]|\d+\.)\s|\s*\|)/.test(linhas[i] ?? "")) para.push(linhas[i++] ?? "");
    if (!para.length) { i++; continue; }
    blocos.push(<p key={k++} className="mt-2 break-words text-sm leading-relaxed">{emLinha(para.join(" "))}</p>);
  }
  return <Fragment>{blocos}</Fragment>;
}

/** Manual do projeto + últimas movimentações, lidos do GitHub pelo servidor. */
export function ManualDoApp({ id }: { id: string }) {
  const { api, endereco } = useApp();
  const { dado, erro, carregando } = useBusca<ManualDoProjeto>(() => api.manual(id), null, `${endereco}|manual|${id}`);
  if (carregando && !dado) return <Carregando />;
  if (!dado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  return (
    <div className="rounded-2xl border border-borda bg-white/3 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-suave">
        <span>{dado.atualizado ? `Manual atualizado ${haQuanto(dado.atualizado)}` : "Manual ainda não escrito"}</span>
        <a href={`${dado.url}/blob/HEAD/MANUAL.md`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-8 items-center text-ciano hover:underline">Ver no GitHub</a>
      </div>
      {dado.falha && <div className="mt-2"><Aviso>{dado.falha}</Aviso></div>}
      {dado.texto && <ManualTexto texto={dado.texto} />}
      <h4 className="mt-5 text-sm font-semibold">Últimas movimentações</h4>
      {dado.movimentacoes.length === 0 ? (
        <p className="mt-2 text-sm text-suave">Nenhuma movimentação lida agora.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {dado.movimentacoes.map((m) => (
            <li key={m.sha} className="rounded-xl border border-borda px-3 py-2 text-sm">
              <div className="break-words">{m.mensagem || "(sem texto)"}</div>
              <div className="num mt-0.5 text-xs text-suave">{m.sha} · {m.autor || "—"} · {m.quando ? haQuanto(m.quando) : "—"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
