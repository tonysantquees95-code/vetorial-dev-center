# Vetorial Dev Center

Painel Dev da Vetorial Tech (administrador): projetos e fases, métricas de código, BI, tráfego da API, diagnóstico e aparelhos.
Site (PWA): https://tonysantquees95-code.github.io/vetorial-dev-center/ · APK Dev: aba Releases (`dev-1.N`).

- `apps/painel-dev`: o app (React 19, Tailwind 4, Vite, PWA, Capacitor 7).
- `packages/`: núcleo e configuração de build compartilhados.
- `legado/`: a primeira versão estática (roadmap).
- O servidor (Cloudflare Worker + D1) fica no repositório da Vênus; este painel só o consome.

`npm run dev` · `npm run verificar`. Variável `BASE_URL` define o endereço base do site (Pages usa `/vetorial-dev-center/`).
