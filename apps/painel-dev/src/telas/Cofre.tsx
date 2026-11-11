import { useState } from "react";
import { ErroApi, type ChaveCofre, type ListaCofre } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { haQuanto } from "../logica";
import { Aviso, Botao, BotaoConfirmar, Cartao, Carregando, Selo } from "../ui";

const campo = "w-full rounded-xl border border-borda bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-ciano";
const forte = (s: string) => s.length >= 12 && /[A-Za-z]/.test(s) && /[0-9]/.test(s);

/** Cofre de chaves: guarda as APIs cifradas no servidor. Os valores nunca voltam para a tela. */
export function Cofre() {
  const { api, endereco } = useApp();
  const { dado: estado, erro, carregando, recarregar } = useBusca(() => api.cofreEstado(), null, endereco);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [lista, setLista] = useState<ListaCofre | null>(null);
  const [msg, setMsg] = useState<{ tom: "erro" | "ok"; t: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function rodar<T>(f: () => Promise<T>, ok?: string): Promise<T | undefined> {
    setMsg(null);
    setOcupado(true);
    try {
      const r = await f();
      if (ok) setMsg({ tom: "ok", t: ok });
      return r;
    } catch (e) {
      setMsg({ tom: "erro", t: e instanceof ErroApi ? e.message : "Não deu certo." });
      if (e instanceof ErroApi && e.codigo === "cofre_senha") setLista(null);
      void recarregar();
    } finally {
      setOcupado(false);
    }
  }
  const abrir = async (s = senha) => { const r = await rodar(() => api.cofreListar(s)); if (r) setLista(r); };
  const criar = async () => {
    if (!forte(senha)) return setMsg({ tom: "erro", t: "Use pelo menos 12 caracteres, com letras e números." });
    if (senha !== senha2) return setMsg({ tom: "erro", t: "As duas senhas não são iguais." });
    if (await rodar(() => api.cofreIniciar(senha))) { await recarregar(); await abrir(); }
  };

  if (carregando && !estado) return <Carregando />;
  if (!estado) return <Aviso tom="erro">{erro || "Sem dados."}</Aviso>;
  const trancado = estado.bloqueadoAte > Date.now();

  if (!lista) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        {msg && <Aviso tom={msg.tom}>{msg.t}</Aviso>}
        <Cartao titulo={estado.configurado ? "Abrir o cofre" : "Criar a senha do cofre"} descricao={estado.configurado ? "Digite a senha do cofre (diferente da senha de login)." : "Escolha uma senha forte: 12 ou mais caracteres, com letras e números. Anote em lugar seguro: não tem como recuperar."}>
          {trancado && <Aviso>Cofre trancado por tentativas erradas. Tente de novo em {Math.max(1, Math.ceil((estado.bloqueadoAte - Date.now()) / 60000))} min.</Aviso>}
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void (estado.configurado ? abrir() : criar()); }}>
            <input className={campo} type="password" autoComplete="off" placeholder="Senha do cofre" value={senha} onChange={(e) => setSenha(e.target.value)} />
            {!estado.configurado && <input className={campo} type="password" autoComplete="off" placeholder="Repita a senha" value={senha2} onChange={(e) => setSenha2(e.target.value)} />}
            <Botao variante="primario" className="w-full" disabled={ocupado || trancado || !senha}>{estado.configurado ? "Abrir" : "Criar cofre"}</Botao>
          </form>
        </Cartao>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {msg && <Aviso tom={msg.tom}>{msg.t}</Aviso>}
      <Aviso tom="neutro">As chaves ficam cifradas no servidor e nunca voltam para a tela (só os 4 últimos caracteres). Por enquanto o servidor ainda usa as chaves que já tem; a troca para o cofre só acontece depois que você conferir que está tudo aqui.</Aviso>
      <div className="grid gap-3 lg:grid-cols-2">
        {lista.chaves.map((c) => (
          <Linha key={c.nome} c={c} ocupado={ocupado}
            aoGuardar={async (v) => { if (await rodar(() => api.cofreGuardar(senha, c.nome, v), `${c.nome} guardada.`)) await abrir(); }}
            aoApagar={async () => { if (await rodar(() => api.cofreApagar(senha, c.nome), `${c.nome} removida do cofre.`)) await abrir(); }} />
        ))}
      </div>
      <Importar aoGerar={async () => (await rodar(() => api.cofreCodigo(senha)))?.codigo ?? ""} ocupado={ocupado} />
      <NovaChave ocupado={ocupado} aoGuardar={async (n, v) => { if (await rodar(() => api.cofreGuardar(senha, n, v), `${n} guardada.`)) await abrir(); }} />
      <TrocarSenha ocupado={ocupado} aoTrocar={async (nova) => { if (await rodar(() => api.cofreTrocarSenha(senha, nova), "Senha do cofre trocada.")) { setSenha(nova); } }} />
      <Cartao titulo="Últimos acessos" descricao="Sem valores de chave, só o que foi feito.">
        <ul className="space-y-1 text-xs text-suave">{lista.historico.map((h, i) => <li key={i}>{haQuanto(h.quando)} · {h.acao}{h.nome ? ` · ${h.nome}` : ""}{h.ok ? "" : " · falhou"}</li>)}</ul>
      </Cartao>
      <Botao onClick={() => { setLista(null); setSenha(""); }}>Trancar o cofre</Botao>
    </div>
  );
}

function Linha({ c, ocupado, aoGuardar, aoApagar }: { c: ChaveCofre; ocupado: boolean; aoGuardar: (v: string) => void; aoApagar: () => void }) {
  const [v, setV] = useState("");
  return (
    <Cartao titulo={c.nome} descricao={c.rotulo || undefined} acao={<div className="flex gap-1.5">{c.noCofre && <Selo tom="ok">no cofre {c.previa}</Selo>}{c.noServidor && <Selo>no servidor</Selo>}</div>}>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { aoGuardar(v); setV(""); } }}>
        <input className={campo} type="password" autoComplete="off" placeholder={c.noCofre ? "Colar nova chave (substitui)" : "Colar a chave"} value={v} onChange={(e) => setV(e.target.value)} />
        <Botao variante="primario" disabled={ocupado || !v.trim()}>Guardar</Botao>
      </form>
      {c.noCofre && <div className="mt-2"><BotaoConfirmar rotulo="Remover do cofre" aoConfirmar={aoApagar} desabilitado={ocupado} /></div>}
    </Cartao>
  );
}

function NovaChave({ ocupado, aoGuardar }: { ocupado: boolean; aoGuardar: (n: string, v: string) => void }) {
  const [n, setN] = useState("");
  const [v, setV] = useState("");
  return (
    <Cartao titulo="Outra chave" descricao="Nome em maiúsculas, números e _ (ex.: MINHA_API_KEY).">
      <form className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]" onSubmit={(e) => { e.preventDefault(); aoGuardar(n.toUpperCase(), v); setN(""); setV(""); }}>
        <input className={campo} autoCapitalize="characters" autoComplete="off" placeholder="NOME_DA_CHAVE" value={n} onChange={(e) => setN(e.target.value)} />
        <input className={campo} type="password" autoComplete="off" placeholder="Valor" value={v} onChange={(e) => setV(e.target.value)} />
        <Botao variante="primario" disabled={ocupado || !n || !v}>Guardar</Botao>
      </form>
    </Cartao>
  );
}

function TrocarSenha({ ocupado, aoTrocar }: { ocupado: boolean; aoTrocar: (nova: string) => void }) {
  const [nova, setNova] = useState("");
  return (
    <Cartao titulo="Trocar a senha do cofre">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (forte(nova)) { aoTrocar(nova); setNova(""); } }}>
        <input className={campo} type="password" autoComplete="new-password" placeholder="Nova senha (12+ com letras e números)" value={nova} onChange={(e) => setNova(e.target.value)} />
        <Botao disabled={ocupado || !forte(nova)}>Trocar</Botao>
      </form>
    </Cartao>
  );
}

const REPOS = ["Venus-core", "Vindex-", "vetorial-dev-center", "desejo-de-intimidade"];
function Importar({ aoGerar, ocupado }: { aoGerar: () => Promise<string>; ocupado: boolean }) {
  const [codigo, setCodigo] = useState("");
  return (
    <Cartao titulo="Importar do GitHub" descricao="Traz para o cofre os segredos que você já cadastrou nos repositórios, sem copiar um por um.">
      <ol className="mb-3 list-decimal space-y-1 pl-5 text-xs text-suave">
        <li>Toque em “Gerar código” (vale 15 minutos e só funciona uma vez).</li>
        <li>No GitHub, em cada repositório abaixo: Actions → “Enviar segredos para o cofre” → Run workflow → cole o código.</li>
        <li>Para cada repositório gere um código novo. Chaves que já estão no cofre não são trocadas, a menos que você marque a opção.</li>
        <li>Volte aqui e toque em Abrir de novo para ver as chaves que chegaram.</li>
      </ol>
      <p className="mb-3 text-xs text-suave">Repositórios: {REPOS.join(" · ")}</p>
      {codigo ? (
        <div className="space-y-2"><code className="block break-all rounded-xl border border-borda bg-white/5 p-3 text-sm select-all">{codigo}</code>
          <Botao onClick={() => { void navigator.clipboard?.writeText(codigo); }}>Copiar</Botao></div>
      ) : <Botao variante="primario" disabled={ocupado} onClick={async () => setCodigo(await aoGerar())}>Gerar código</Botao>}
    </Cartao>
  );
}
