# Vetorial Dev Center

Painel Dev da Vetorial Tech (administrador): projetos e fases, métricas de código, BI, tráfego da API, diagnóstico e aparelhos.
Site (PWA): https://tonysantquees95-code.github.io/vetorial-dev-center/ · APK Dev: aba Releases (`dev-1.N`).

- `apps/painel-dev`: o app (React 19, Tailwind 4, Vite, PWA, Capacitor 7).
- `packages/`: núcleo e configuração de build compartilhados.
- `legado/`: a primeira versão estática (roadmap).
- O servidor (Cloudflare Worker + D1) fica no repositório da Vênus; este painel só o consome.

`npm run dev` · `npm run verificar`. Variável `BASE_URL` define o endereço base do site (Pages usa `/vetorial-dev-center/`).

## Teste visual das telas
`npm run build && npm run test:visual -w @venus/painel-dev` abre o painel em 7 tamanhos de tela e confere cortes e rolagem (config em `apps/painel-dev/teste-visual/config.mjs`).

## Teste de segurança (igual em todos os apps da suíte)
- `apps/painel-dev/teste/seguranca.test.mjs` roda junto com os outros testes e na publicação: se falhar, a publicação para. Confere o repositório inteiro: segredo escrito no código (chaves, tokens, senhas), arquivo que nunca pode ser versionado (.env, chaves de assinatura), CSP do Tauri sem `unsafe-eval`/curinga, manifesto do Android (debug, tráfego http, componente exposto sem permissão, `QUERY_ALL_PACKAGES`), `eval`, HTML montado com texto (`innerHTML`), endereço `http://` fora da máquina local, segredo no log, HTTPS desligado e WebView com acesso perigoso.
- Exceção justificada = uma linha em `seguranca.permitidos.json` (regra, arquivo, trecho e MOTIVO de verdade); sem motivo, não vale. Texto digitado pela pessoa ou vindo de site/servidor nunca entra em HTML sem escapar (`textContent` ou `esc()`).
- O arquivo é o mesmo em todos os apps: mudou uma regra? Mude em todos. Achou uma brecha nova? Escreva primeiro um teste que a reproduz.
