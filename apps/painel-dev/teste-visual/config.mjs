// Telas que o teste visual visita no Painel Dev (cada aba abre pelo endereço #/aba).
import { readFileSync } from "node:fs";
const ABAS = [...readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8").match(/const ABAS = \[([\s\S]*?)\] as const/)[1].matchAll(/id: "([^"]+)"/g)].map((m) => m[1]);

const agora = Date.now();
const dias = Array.from({ length: 7 }, (_, i) => `2026-11-${String(12 + i).padStart(2, "0")}`);
const serie = (n) => dias.map((_, i) => n + i * 3);
const projeto = (id, nome) => ({ id, nome, descricao: "Aplicativo da Vetorial Tech com uma descrição razoavelmente comprida para testar a quebra de linha.", repo: `tonysantquees95-code/${id}`, urlRepo: `https://github.com/tonysantquees95-code/${id}`, conectado: true, fases: [{ id: `${id}-1`, projeto: id, titulo: "Primeira versão", progresso: 80, status: "andamento", ordem: 1 }], progresso: 80, fasesConcluidas: 0, metricas: { arquivos: 120, linhas: 25000, linguagens: [{ nome: "TypeScript", arquivos: 90, linhas: 20000 }], fonte: "ci", atualizado: agora }, builds: [{ workflow: "app.yml", estado: "completed", resultado: "success", numero: 12, commit: "abc1234", quando: agora, url: "https://github.com" }], estadoBuild: "success", apks: [] });
const usuario = (i, extra = {}) => ({ id: `u${i}`, email: `pessoa.com.um.email.bem.comprido.${i}@exemplo.com.br`, nome: `Pessoa ${i}`, telefone: "", criado: agora, recuperacao: true, situacao: "gratis", admin: false, bloqueado: false, pagante: false, pacote: "", ativoAte: 0, apps: { venus: { dispositivos: 2, ativas: 1, ultimo: agora, aparelhos: [{ id: "a1", nome: "Celular (Vênus)", plataforma: "android", criado: agora, ultimo: agora, emUso: true }] } }, sessoes: [], ...extra });
const respostas = {
  "/dev/painel": { gerado: agora, admin: "teste@exemplo.com", projetos: [projeto("venus-core", "Vênus"), projeto("vindex", "Vindex")] },
  "/dev/bi": { gerado: agora, dias, faturamentoCentavos: serie(1000), novosLojistas: serie(1), novasContas: serie(2), requisicoesIA: { gemini: serie(10), deepseek: serie(5) }, tokensIA: { gemini: serie(100) }, errosIA: { gemini: serie(0) }, totais: { lojas: 10, lojasAtivas: 8, pagantes: 3, faturamentoPeriodoCentavos: 12345, faturamentoTotalCentavos: 99999, pagamentosTotal: 7, requisicoesIA: 500, tokensIA: 12000, respostasDoCache: 40 } },
  "/dev/ferramentas": { gerado: agora, provedores: [{ id: "gemini", chaveConfigurada: true, ligado: true, requisicoes24h: 50, erros24h: 1 }], automacoes: [{ id: "chat", rotulo: "Conversa", executor: "gemini", reserva: null, funcoes: [{ tarefa: "responder", provedor: "gemini" }], emUso: "gemini", requisicoes24h: 50, ativaAgora: true }], servicos: [{ id: "d1", rotulo: "Banco de dados", executor: "cloudflare", configurado: true, atividadeHora: 12 }] },
  "/dev/trafego": { agora, ultimo: 1, itens: [{ id: 1, quando: agora, metodo: "GET", rota: "/voxix/historico?desde=0&limite=300", status: 200, ms: 40, origem: "venus" }], ultimos5min: { total: 1, erros: 0, recusados: 0, p50: 40, p95: 90, rotas: [{ rota: "/voxix/historico", n: 1 }] } },
  "/dev/usuarios": { agora, apps: ["venus", "vindex", "vortex", "vyntem", "voxix"], maxDispositivos: 3, maxAtivas: 2, total: 3, pagantes: 1, bloqueados: 0, emTeste: 0, soGratis: 2, usandoAgora: 1, semRecuperacao: 0, usuarios: [usuario(1, { situacao: "admin", admin: true }), usuario(2, { situacao: "pagante", pagante: true }), usuario(3)] },
  "/dev/dispositivos": { agora, maxDispositivos: 3, maxAtivas: 2, ttlMs: 600000, sessoesAtivas: 1, contas: [] },
  "/dev/config": { escutaContinua: false, provedores: { gemini: { ligado: true, chaveConfigurada: true } }, repos: { vindex: "tonysantquees95-code/vindex", vortex: "tonysantquees95-code/vortex" } },
  "/dev/feedback": {
    apps: { venus: "Vênus", vindex: "Vindex" }, rotulos: { ajuda: { muito: "Ajuda muito" }, indicaria: { sim: "Sim" }, chamou: { agenda: "Agenda de serviços", assistente: "Assistente com IA e voz" }, como_conheceu: { instagram: "Instagram" } },
    resumo: { total: 3, novos: 2, problemas: 1, ideias: 1, elogios: 0, pesquisas: 1, notaMedia: 4.5, comoConheceu: [{ id: "instagram", nome: "Instagram", n: 1 }], ajuda: [{ id: "muito", nome: "Ajuda muito", n: 1 }], chamou: [{ id: "agenda", nome: "Agenda de serviços", n: 1 }], indicaria: [{ id: "sim", nome: "Sim", n: 1 }] },
    relatos: [
      { id: 3, criado: agora, app: "venus", versao: "1.210", plataforma: "android", tipo: "problema", texto: "O botão de enviar não responde quando eu toco, mesmo depois de reiniciar o aplicativo várias vezes seguidas.", nota: null, respostas: {}, contato: "51999990000", aparelho: "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36", status: "novo", resposta_dev: "" },
      { id: 2, criado: agora, app: "vindex", versao: "", plataforma: "windows", tipo: "ideia", texto: "Seria bom poder girar várias páginas de uma vez.", nota: null, respostas: {}, contato: "", aparelho: "", status: "visto", resposta_dev: "" },
      { id: 1, criado: agora, app: "venus", versao: "1.210", plataforma: "android", tipo: "pesquisa", texto: "", nota: 5, respostas: { ajuda: "muito", chamou: ["agenda", "assistente"], como_conheceu: "instagram", indicaria: "sim", falta: "Mais modelos de logo" }, contato: "", aparelho: "", status: "novo", resposta_dev: "" },
    ],
  },
  "/dev/alertas": { novos: 2, alertas: [
    { id: 2, criado: agora, tipo: "build", app: "vortex", titulo: "Build falhou: Vortex", detalhe: "App (interface e Windows) #98 · commit 84e0088", status: "novo" },
    { id: 1, criado: agora, tipo: "alta", app: "venus", titulo: "Erro em alta no Vênus", detalhe: "3 relatos de problema na última hora", status: "novo" },
  ] },
  "/dev/cache": { exato: true, semantico: true, acertos24h: 5, chamadas24h: 50, taxa: 0.1 },
  "/dev/telemetria": { agora, itens: [] },
  "/dev/cofre/estado": { configurado: true, bloqueadoAte: 0, sugeridas: [] },
};

export default {
  porta: 4184,
  espera: 1000,
  guardado: (modo) => modo === "entrar" ? {} : {
    "vdev.v1": JSON.stringify({ ambiente: "producao", urls: {}, aparelho: "vdev-teste-aparelho", sessoes: { producao: { token: "teste", email: "teste@exemplo.com", expira: Date.now() + 86_400_000 } } }),
  },
  respostas,
  cenarios: [
    ["avisos", "normal", async (p) => { await p.getByRole("button", { name: /aviso/ }).first().click(); await p.getByText("Build falhou: Vortex").waitFor(); }],
    ["entrar", "entrar", async (p) => { await p.waitForTimeout(300); }],
    ...ABAS.map((a) => [`aba-${a}`, "normal", async (p) => { await p.evaluate((h) => { location.hash = `#/${h}`; }, a); await p.waitForTimeout(700); }]),
    ["menu-do-celular", "normal", async (p) => { const b = p.getByLabel("Abrir o menu"); if (!(await b.isVisible())) throw new Error("PULAR: sem menu nesta largura"); await b.click(); await p.waitForTimeout(400); }],
  ],
};
