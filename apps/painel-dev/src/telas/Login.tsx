import { useState, type FormEvent } from "react";
import { ADMIN_EMAIL_PADRAO, ErroApi } from "../api";
import { useApp } from "../estado";
import { Aviso, Botao, Cartao } from "../ui";
import { SeletorDeAmbiente } from "./Ambiente";

interface Escolha { tipo: "encerrar" | "remover"; itens: { id: string; titulo: string }[] }

/** Entrada do administrador: Vetorial ID (só o e-mail corporativo passa) e, na primeira vez, o convite do servidor. */
export function Login() {
  const { api, iniciar, dispositivo } = useApp();
  const [primeiro, setPrimeiro] = useState(false);
  const [email, setEmail] = useState(ADMIN_EMAIL_PADRAO);
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [convite, setConvite] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [escolha, setEscolha] = useState<Escolha | null>(null);

  async function enviar(extra: { encerrar?: string; remover?: string } = {}) {
    setErro("");
    if (primeiro && senha !== senha2) return setErro("As senhas não são iguais.");
    setOcupado(true);
    try {
      const s = primeiro ? await api.primeiroAcesso(senha, convite.trim(), dispositivo()) : await api.entrar(email.trim(), senha, dispositivo(), extra);
      iniciar(s);
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === "limite_simultaneo") {
        setEscolha({ tipo: "encerrar", itens: (e.dados.ativas ?? []).map((a: any) => ({ id: a.sessao, titulo: `${a.nome} (${a.plataforma})` })) });
      } else if (e instanceof ErroApi && e.codigo === "limite_dispositivos") {
        setEscolha({ tipo: "remover", itens: (e.dados.dispositivos ?? []).map((d: any) => ({ id: d.id, titulo: `${d.nome} (${d.plataforma})` })) });
      } else setErro(e instanceof Error ? e.message : "Não deu certo.");
    }
    setOcupado(false);
  }
  const aoEnviar = (ev: FormEvent) => {
    ev.preventDefault();
    void enviar();
  };
  const campo = "min-h-11 w-full rounded-xl border border-borda bg-white/5 px-3 text-[15px] placeholder:text-suave/60";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <div className="text-center">
        <img src="/icons/pwa-192.png" alt="" width={72} height={72} className="mx-auto rounded-2xl" />
        <h1 className="mt-3 text-2xl font-semibold">Painel Dev</h1>
        <p className="text-sm text-suave">Vetorial Tech · acesso do administrador</p>
      </div>
      <SeletorDeAmbiente compacto />
      {escolha ? (
        <Cartao titulo={escolha.tipo === "encerrar" ? "Limite de 2 aparelhos ao mesmo tempo" : "Limite de 3 aparelhos vinculados"} descricao={escolha.tipo === "encerrar" ? "Encerre uma sessão para entrar neste aparelho." : "Remova um aparelho para vincular este."}>
          <div className="space-y-2">
            {escolha.itens.map((i) => (
              <Botao key={i.id} className="w-full justify-between" onClick={() => { const e = escolha; setEscolha(null); void enviar(e.tipo === "encerrar" ? { encerrar: i.id } : { remover: i.id }); }}>
                <span>{i.titulo}</span>
                <span className="text-xs text-suave">{escolha.tipo === "encerrar" ? "encerrar" : "remover"}</span>
              </Botao>
            ))}
            <Botao className="w-full" onClick={() => setEscolha(null)}>Cancelar</Botao>
          </div>
        </Cartao>
      ) : (
        <Cartao>
          <form onSubmit={aoEnviar} className="space-y-3" aria-label={primeiro ? "Primeiro acesso" : "Entrar"}>
            {!primeiro && (
              <label className="block text-sm">
                <span className="text-suave">E-mail do Vetorial ID</span>
                <input className={campo} type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>
            )}
            {primeiro && (
              <label className="block text-sm">
                <span className="text-suave">Convite do servidor</span>
                <input className={campo} type="text" autoComplete="off" autoCapitalize="none" value={convite} onChange={(e) => setConvite(e.target.value)} required />
              </label>
            )}
            <label className="block text-sm">
              <span className="text-suave">{primeiro ? "Crie uma senha (8 caracteres ou mais)" : "Senha"}</span>
              <input className={campo} type="password" autoComplete={primeiro ? "new-password" : "current-password"} minLength={primeiro ? 8 : 1} value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </label>
            {primeiro && (
              <label className="block text-sm">
                <span className="text-suave">Repita a senha</span>
                <input className={campo} type="password" autoComplete="new-password" value={senha2} onChange={(e) => setSenha2(e.target.value)} required />
              </label>
            )}
            {erro && <Aviso tom="erro">{erro}</Aviso>}
            <Botao type="submit" variante="primario" className="w-full" disabled={ocupado}>{ocupado ? "Aguarde…" : primeiro ? "Criar acesso do administrador" : "Entrar"}</Botao>
          </form>
          <button type="button" className="mt-3 w-full text-center text-sm text-ciano underline-offset-2 hover:underline" onClick={() => { setPrimeiro(!primeiro); setErro(""); }}>
            {primeiro ? "Já tenho acesso" : "Primeiro acesso (tenho o convite)"}
          </button>
        </Cartao>
      )}
      <p className="text-center text-xs text-suave">Só a conta administrativa da Vetorial Tech entra aqui. A sessão dura 12 horas e conta nas regras de 3 aparelhos e 2 ativos.</p>
    </main>
  );
}
