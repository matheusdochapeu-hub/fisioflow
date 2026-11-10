# AGENTS.md — FisioFlow

> Contexto para agentes de IA. Escopo: **esta pasta**.

## O que é

PWA de gestão clínica para fisioterapeutas: pacientes, prontuários CREFITO,
agenda/check-in, evoluções com sinais vitais, financeiro com recibos e PDFs.

**Este é o produto que será disponibilizado para terceiros** (arquitetura
multi-tenant). Ele **não** é a versão da Scarlet — essa é `../matheus-app-fisioterapia`.
As duas pastas são parecidas e evoluem em paralelo **de propósito**: não unifique.

## Stack

- PWA em HTML/CSS/vanilla JS (SPA), mobile-first.
- Backend: Google Apps Script (`Code.gs`) + Google Sheets, **multi-tenant**.
- Sem frameworks e sem build.

## Rodar localmente

```powershell
python -m http.server 8000   # e abrir http://localhost:8000
```

## Testes

```powershell
node --test test/**/*.test.js   # 101 testes (helpers + pós-ações)
```

## Deploy

- GitHub Pages a partir da `main`: <https://matheusdochapeu-hub.github.io/fisioflow/>
- CI em `.github/workflows/ci.yml`: roda a suíte (101 testes) em todo push/PR.

## Arquivos-chave

| Arquivo | Papel |
|---|---|
| `index.html` | SPA completa (5 abas) |
| `atendimentos.html` | Tela legada de atendimentos ainda referenciada |
| `Code.gs` | Backend Apps Script multi-tenant |
| `sw.js` | Service Worker (`fisioflow-vN`) |
| `MEMORY.md` | Histórico e decisões do projeto |
| `plans/` | Planos de implementação e auditoria |

## Regras críticas

1. **Nunca commitar o ID/URL de implantação do Apps Script com acesso aberto.**
   Existe plano para blindar isso em `plans/005-protect-script-url-and-credentials.md`.
2. **Regra do check-in:** ao confirmar um atendimento, o paciente sai imediatamente da
   lista do dia (continua nas outras abas). Não "conserte" esse comportamento.
3. **Sinais vitais (SpO2) e observações nunca podem ser sobrescritos** por uma resposta da
   planilha com campos vazios — há cache persistente dedicado para isso.
4. Ao subir assets, **incrementar a versão do `CACHE_NAME`** no `sw.js`.
5. Dados de pacientes são dados sensíveis de saúde: não use dados reais em testes,
   fixtures ou screenshots.

## Vizinhança (ecossistema)

- `../matheus-app-fisioterapia` — versão privada da Scarlet (código irmão, **não** duplicar
  correções automaticamente; avalie caso a caso).
- `../matrix` — consome o faturamento clínico via `satellite-connectors.js`.
