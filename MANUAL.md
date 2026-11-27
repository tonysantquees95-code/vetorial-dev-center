# Manual — Painel Dev

> Escrito para a Vetorial Tech. Não contém segredos: só diz ONDE ficam. Visão de todos os apps: Manual da Vetorial Tech (Drive).

Painel do administrador: builds, versões, avisos, assinaturas, feedback, visitas, cofre e este manual.

## Onde fica cada coisa
- `apps/painel-dev/src/telas/`: uma tela por aba (Projetos, Avisos, Assinaturas, Feedback, Visitas, Usuarios, Trafego, Bi, Cofre, Manual...). `api.ts` fala com o servidor. `desktop/`: casca Windows. `legado/`: versão antiga.
- Aviso novo: `TOM`/`NOME` em `telas/Avisos.tsx` + `AlertaDev` em `api.ts` + o servidor gera o tipo.
- O botão Manual lê o `MANUAL.md` de cada repositório pelo servidor (`/dev/manual`).
- Fluxo `painel.yml`: gera `dev-1.N`.


## Como voltar atrás se algo quebrar
- No GitHub: aba **Actions** mostra o fluxo vermelho; **Code › Commits** mostra o commit culpado; abra o commit e toque em **⋯ › Revert** (cria um commit novo que desfaz o anterior).
- O número da versão sempre sobe: a versão boa volta como número novo, nunca se republica um número antigo.
- Banco de dados e dados dos usuários não voltam com o código (migrações só andam para frente).

## Movimentações importantes
Uma linha por mudança que valha lembrar (a mais nova em cima). O Painel Dev também mostra os últimos commits automaticamente.

| Data | O que mudou | Onde |
| --- | --- | --- |
| 2026-11-27 | Cartão "Backup das chaves dos APKs" na aba Cofre (gerar, copiar e restaurar; texto criptografado). Cenário `cofre-backup` no teste visual. | `apps/painel-dev/src/telas/Cofre.tsx`, `api.ts` |
| 2026-11-27 | Manual criado | `MANUAL.md` |
