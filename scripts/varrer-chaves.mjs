// Falha se achar chave/segredo escrito no cliente (apps, Kotlin, builds web). Segredos só existem como variáveis do servidor.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const raiz = new URL("..", import.meta.url).pathname; // raiz do repositório
const IGNORAR = new Set(["node_modules", "dist-desktop", ".git", ".gradle", "build", ".wrangler", "package-lock.json", "varrer-chaves.mjs"]);
const ALVOS = ["apps", "packages"].filter((p) => existsSync(join(raiz, p)));
const PADROES = [
  [/AIza[0-9A-Za-z_-]{30,}/, "chave do Google/Gemini"],
  [/\bgsk_[A-Za-z0-9]{20,}/, "chave do Groq"],
  [/\bsk-[A-Za-z0-9_-]{20,}/, "chave tipo OpenAI/DeepSeek"],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}/, "token do GitHub"],
  [/\bAPP_USR-[0-9a-f-]{20,}/, "token do Mercado Pago"],
  [/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, "chave privada"],
  [/(?:secret|token|senha|password|api[_-]?key)["']?\s*[:=]\s*["'][A-Za-z0-9_\-/+=]{24,}["']/i, "segredo atribuído em texto"],
];
const EXT = /\.(kt|java|xml|json|m?[jt]sx?|html|css|properties|ya?ml|gradle|kts|txt)$/;
const problemas = [];

function varrer(dir) {
  for (const nome of readdirSync(dir)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) varrer(caminho);
    else if (EXT.test(nome) && statSync(caminho).size < 3_000_000) {
      const linhas = readFileSync(caminho, "utf8").split("\n");
      linhas.forEach((l, i) => {
        for (const [re, quem] of PADROES) if (re.test(l)) problemas.push(`${relative(raiz, caminho)}:${i + 1}: ${quem}`);
      });
    }
  }
}
for (const alvo of ALVOS) varrer(join(raiz, alvo));
// builds já gerados (se existirem) também não podem carregar chaves
for (const d of ["assistente", "robo", "dois-em-um"]) {
  const dist = join(raiz, "venus-apps/apps", d, "dist");
  if (existsSync(dist)) varrer(dist);
}
if (problemas.length) {
  console.error("Possíveis chaves expostas no cliente:\n" + problemas.join("\n"));
  process.exit(1);
}
console.log("Varredura de chaves: nenhuma chave exposta no cliente.");
