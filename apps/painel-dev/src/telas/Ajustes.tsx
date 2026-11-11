import { useEffect, useState } from "react";
import { rodandoNoApp } from "@venus/nucleo";
import { ErroApi, PRODUCAO, type Telemetria } from "../api";
import { useApp } from "../estado";
import { useBusca } from "../hooks";
import { AMBIENTES, compacto, haQuanto, nomeDoProvedor, restante } from "../logica";
import { Aviso, Barra, Botao, BotaoConfirmar, Cartao, Carregando, Chave, Selo } from "../ui";
import { Aplicativos } from "./Aplicativos";
import { SeletorDeAmbiente } from "./Ambiente";

interface LeituraLocal { bateria: { nivel: number | null; carregando: boolean; temperatura: null }; hardware: { modelo: string; so: string; ramMb: number | null; nucleos: number | null; armazenamentoLivreMb: number | null; rede: string } }

/** Lê bateria e hardware deste aparelho (APIs do navegador/WebView; o que não existir fica vazio). */
async function lerAparelho(): Promise<LeituraLocal> {
  const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }>; deviceMemory?: number; connection?: { effectiveType?: string }; userAgentData?: { platform?: string } };
  let bat: { level: number; charging: boolean } | null = null;
  try {
    bat = (await nav.getBattery?.()) ?? null;
  } catch {
    bat = null;
  }
  let livre: number | null = null;
  try {
    const e = await navigator.storage?.estimate?.();
    if (e?.quota && e.usage !== undefined) livre = Math.round((e.quota - e.usage) / 1e6);
  } catch {
    livre = null;
  }
  const modelo = /\(([^)]*Android[^)]*)\)/.exec(navigator.userAgent)?.[1]?.split(";").slice(-1)[0]?.trim() ?? navigator.platform ?? "";
  return {
    bateria: { nivel: bat ? Math.round(bat.level * 100) : null, carregando: !!bat?.charging, temperatura: null },
    hardware: { modelo: modelo.slice(0, 60), so: (nav.userAgentData?.platform ?? navigator.platform ?? "").slice(0, 40), ramMb: nav.deviceMemory ? nav.deviceMemory * 1024 : null, nucleos: navigator.hardwareConcurrency ?? null, armazenamentoLivreMb: livre, rede: nav.connection?.effectiveType ?? "" }
  };
}

export function Ajustes() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
      <Aplicativos />
      <CartaoAmbiente />
      <CartaoSessao />
      <CartaoIA />
      <CartaoCache />
      <CartaoEscuta />
      <CartaoHardware />
    </div>
  );
}

function CartaoAmbiente() {
  const { g, endereco, salvarUrl } = useApp();
  const { api } = useApp();
  const [h, setH] = useState(g.urls.homologacao);
  const [l, setL] = useState(g.urls.local);
  const [msg, setMsg] = useState<{ tom: "ok" | "erro" | "aviso"; t: string } | null>(null);
  async function testar() {
    setMsg(null);
    try {
      const r = await api.saude();
      setMsg({ tom: r.ms > 1500 ? "aviso" : "ok", t: `Servidor respondeu em ${r.ms} ms.` });
    } catch (e) {
      setMsg({ tom: "erro", t: e instanceof ErroApi ? e.message : "Sem resposta." });
    }
  }
  const salvar = (qual: "homologacao" | "local", v: string) => {
    const e = salvarUrl(qual, v);
    setMsg(e ? { tom: "erro", t: e } : { tom: "ok", t: "Endereço salvo." });
  };
  const campo = "min-h-10 min-w-0 flex-1 rounded-xl border border-borda bg-white/5 px-3 text-sm";
  return (
    <Cartao titulo="Ambiente do servidor" descricao="Troque entre produção, homologação e teste local. Cada ambiente guarda a sua própria sessão de administrador.">
      <SeletorDeAmbiente />
      <div className="mt-3 space-y-3">
        {AMBIENTES.filter((a) => a.id !== "producao").map((a) => (
          <label key={a.id} className="block text-xs text-suave">{a.rotulo} · {a.dica}
            <div className="mt-1 flex gap-2">
              <input className={campo} value={a.id === "homologacao" ? h : l} onChange={(e) => (a.id === "homologacao" ? setH : setL)(e.target.value)} placeholder={a.id === "local" ? "http://10.0.2.2:8787" : "https://homologacao.exemplo.dev"} inputMode="url" autoCapitalize="none" autoCorrect="off" />
              <Botao onClick={() => salvar(a.id as "homologacao" | "local", a.id === "homologacao" ? h : l)}>Salvar</Botao>
            </div>
          </label>
        ))}
        <p className="text-xs text-suave">Produção: <span className="num">{PRODUCAO}</span>{rodandoNoApp() ? " · No emulador, o computador é 10.0.2.2." : ""}</p>
        <div className="flex items-center gap-2"><Botao onClick={testar} disabled={!endereco}>Testar conexão</Botao><span className="num truncate text-xs text-suave">{endereco}</span></div>
        {msg && <Aviso tom={msg.tom}>{msg.t}</Aviso>}
      </div>
    </Cartao>
  );
}

function CartaoSessao() {
  const { email, expira, sair, g } = useApp();
  return (
    <Cartao titulo="Sessão do administrador" descricao="Vetorial ID com permissão de superadministrador. A chave de sessão é assinada pelo servidor e vale 12 horas.">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-suave">E-mail</dt><dd className="truncate">{email}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-suave">Permissão</dt><dd><Selo tom="ok">superadmin</Selo></dd></div>
        <div className="flex justify-between gap-3"><dt className="text-suave">Expira em</dt><dd className="num">{restante(expira)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-suave">Ambiente</dt><dd>{AMBIENTES.find((a) => a.id === g.ambiente)?.rotulo}</dd></div>
      </dl>
      <div className="mt-4"><Botao variante="perigo" onClick={() => void sair()}>Sair deste aparelho</Botao></div>
    </Cartao>
  );
}

function CartaoIA() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando, recarregar } = useBusca(async () => ({ config: await api.config(), ferr: await api.ferramentas() }), 30_000, endereco);
  const [msg, setMsg] = useState("");
  if (carregando && !dado) return <Cartao titulo="Chaves corporativas de IA"><Carregando /></Cartao>;
  async function alternar(id: string, ligar: boolean) {
    setMsg("");
    try {
      await api.definirConfig(`provedor:${id}`, ligar);
      await recarregar();
    } catch (e) {
      setMsg(e instanceof ErroApi ? e.message : "Não deu certo.");
    }
  }
  return (
    <Cartao titulo="Chaves corporativas de IA" descricao="Ligue ou desligue cada provedor. Desligado, ele sai da fila e a reserva assume na hora (o Gemini não tem reserva). As chaves em si ficam só nos segredos do Worker.">
      {(erro || msg) && <div className="mb-2"><Aviso tom="erro">{msg || erro}</Aviso></div>}
      <ul className="space-y-2">
        {dado?.config && Object.entries(dado.config.provedores).map(([id, p]) => {
          const uso = dado.ferr.provedores.find((x) => x.id === id);
          return (
            <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-borda bg-white/3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium">{nomeDoProvedor(id)}</div>
                <div className="num text-xs text-suave">{p.chaveConfigurada ? "chave configurada" : "sem chave no servidor"} · {compacto(uso?.requisicoes24h ?? 0)} req. em 24 h</div>
              </div>
              <Chave ligado={p.ligado} rotulo={`${nomeDoProvedor(id)} ligado`} aoMudar={(v) => void alternar(id, v)} />
            </li>
          );
        })}
      </ul>
    </Cartao>
  );
}

function CartaoCache() {
  const { api, endereco } = useApp();
  const { dado, erro, carregando, recarregar } = useBusca(() => api.cache(), 30_000, endereco);
  const [msg, setMsg] = useState<{ tom: "ok" | "erro"; t: string } | null>(null);
  async function limpar() {
    setMsg(null);
    try {
      const r = await api.limparCache();
      setMsg({ tom: "ok", t: r.restam ? `${r.apagadas} entradas apagadas. Ainda há mais: limpe de novo.` : `${r.apagadas} entradas apagadas.` });
      void recarregar();
    } catch (e) {
      setMsg({ tom: "erro", t: e instanceof ErroApi ? e.message : "Não deu certo." });
    }
  }
  return (
    <Cartao titulo="Cache vetorial" descricao="Respostas repetidas das IAs guardadas no KV (exato) e no Vectorize (parecidas). Limpar força respostas novas.">
      {carregando && !dado ? <Carregando /> : erro && !dado ? <Aviso tom="erro">{erro}</Aviso> : dado && (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Selo tom={dado.exato ? "ok" : "aviso"}>cache exato: {dado.exato ? "ligado" : "desligado"}</Selo>
            <Selo tom={dado.semantico ? "ok" : "aviso"}>semântico: {dado.semantico ? "ligado" : "desligado"}</Selo>
          </div>
          <div className="mb-1 flex justify-between text-xs text-suave"><span>Respostas vindas do cache (24 h)</span><span className="num">{dado.acertos24h} de {dado.acertos24h + dado.chamadas24h} · {dado.taxa}%</span></div>
          <Barra valor={dado.taxa} rotulo="Taxa de acerto do cache" />
          <div className="mt-4"><BotaoConfirmar rotulo="Limpar cache" confirmacao="Confirmar limpeza" desabilitado={!dado.exato} aoConfirmar={() => void limpar()} /></div>
        </>
      )}
      {msg && <div className="mt-3"><Aviso tom={msg.tom}>{msg.t}</Aviso></div>}
    </Cartao>
  );
}

function CartaoEscuta() {
  const { api, endereco } = useApp();
  const { dado, erro, recarregar } = useBusca(() => api.config(), null, endereco);
  const [msg, setMsg] = useState("");
  async function mudar(v: boolean) {
    setMsg("");
    try {
      await api.definirConfig("escuta_continua", v);
      await recarregar();
    } catch (e) {
      setMsg(e instanceof ErroApi ? e.message : "Não deu certo.");
    }
  }
  return (
    <Cartao titulo="Escuta contínua" descricao="Chave de liberação da escuta em segundo plano da Vênus. Com ela ligada, o Android mostra o indicador de microfone enquanto escuta.">
      {(erro || msg) && <div className="mb-2"><Aviso tom="erro">{msg || erro}</Aviso></div>}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-borda bg-white/3 px-3 py-2.5">
        <div className="text-sm">Liberar escuta contínua<div className="text-xs text-suave">{dado ? (dado.escutaContinua ? "Liberada para os aparelhos." : "Bloqueada: só escuta com o app aberto.") : "carregando…"}</div></div>
        <Chave ligado={!!dado?.escutaContinua} desabilitado={!dado} rotulo="Escuta contínua" aoMudar={(v) => void mudar(v)} />
      </div>
    </Cartao>
  );
}

function CartaoHardware() {
  const { api, endereco } = useApp();
  const { dado, erro, recarregar } = useBusca(() => api.telemetria(), 60_000, endereco);
  const [local, setLocal] = useState<LeituraLocal | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    void lerAparelho().then(setLocal);
  }, []);
  const vindex = dado?.itens.find((i) => i.origem === "vindex");
  const fresco = vindex && Date.now() - vindex.atualizado < 30 * 60_000;
  async function enviar() {
    if (!local) return;
    setMsg("");
    try {
      await api.enviarTelemetria(local);
      setMsg("Leitura enviada ao servidor.");
      void recarregar();
    } catch (e) {
      setMsg(e instanceof ErroApi ? e.message : "Não deu certo.");
    }
  }
  return (
    <Cartao titulo="Bateria e hardware" descricao="Os dados do Vindex chegam pelo servidor quando ele envia a telemetria. Enquanto isso, aparece a leitura deste aparelho.">
      {erro && <div className="mb-2"><Aviso>{erro}</Aviso></div>}
      {fresco && vindex ? <Leitura titulo="Vindex" t={vindex} /> : <p className="mb-3 text-xs text-aviso">{vindex ? `Última leitura do Vindex ${haQuanto(vindex.atualizado)}.` : "O Vindex ainda não enviou telemetria."}</p>}
      {!fresco && vindex && <Leitura titulo="Vindex (antiga)" t={vindex} />}
      {local && <Leitura titulo="Este aparelho" t={{ origem: "dev", atualizado: Date.now(), ...local }} />}
      <div className="mt-3 flex flex-wrap items-center gap-2"><Botao onClick={() => void enviar()} disabled={!local}>Enviar leitura ao servidor</Botao>{msg && <span className="text-xs text-suave" role="status">{msg}</span>}</div>
    </Cartao>
  );
}

function Leitura({ titulo, t }: { titulo: string; t: Telemetria }) {
  const n = t.bateria.nivel;
  return (
    <div className="mb-3 rounded-xl border border-borda bg-white/3 p-3">
      <div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium">{titulo}</span><span className="text-xs text-suave">{haQuanto(t.atualizado)}</span></div>
      {n !== null ? (
        <div className="mb-2"><div className="mb-1 flex justify-between text-xs text-suave"><span>Bateria{t.bateria.carregando ? " · carregando" : ""}</span><span className="num">{n}%</span></div><Barra valor={n} tom={n <= 15 && !t.bateria.carregando ? "erro" : n <= 30 ? "aviso" : "ok"} rotulo="Bateria" /></div>
      ) : <p className="mb-2 text-xs text-suave">Bateria: sem leitura neste navegador.</p>}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {t.hardware.modelo && <Selo>{t.hardware.modelo}</Selo>}
        {t.hardware.so && <Selo>{t.hardware.so}</Selo>}
        {t.hardware.nucleos ? <Selo>{t.hardware.nucleos} núcleos</Selo> : null}
        {t.hardware.ramMb ? <Selo>~{Math.round(t.hardware.ramMb / 1024)} GB de RAM</Selo> : null}
        {t.hardware.armazenamentoLivreMb ? <Selo>{compacto(t.hardware.armazenamentoLivreMb)} MB livres</Selo> : null}
        {t.hardware.rede && <Selo>rede {t.hardware.rede}</Selo>}
        {t.bateria.temperatura !== null && <Selo>{t.bateria.temperatura} °C</Selo>}
      </div>
    </div>
  );
}
