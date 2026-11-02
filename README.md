# FisioFlow 🌿

> **Aplicativo PWA completo de gestão clínica, atendimentos domiciliares, prontuários CREFITO e controle financeiro para fisioterapeutas.**

[![Licença MIT](https://img.shields.io/badge/licença-MIT-green.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Instalável%20%26%20Offline-orange.svg)](https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps)
[![Google Apps Script](https://img.shields.io/badge/Backend-Google%20Apps%20Script-blue.svg)](https://developers.google.com/apps-script)
[![Testes Automatizados](https://img.shields.io/badge/Testes-100%25%20Aprovados-success.svg)](test/)

---

## 💡 Sobre o FisioFlow

O **FisioFlow** é um aplicativo mobile-first (Progressive Web App - PWA) desenvolvido para solucionar os desafios da rotina de profissionais de fisioterapia (atendimento domiciliar e consultório): cadastro de pacientes, prontuários e evoluções clínicas em conformidade com o CREFITO, agendamento de sessões com cálculo inteligente de rotas e combustível, e gestão financeira completa com recibos e relatórios em PDF.

Todos os dados ficam armazenados de forma **gratuita, segura e privada** na própria planilha do Google Sheets do usuário via Google Apps Script, dispensando servidores pagos ou bancos de dados complexos.

---

## ✨ Principais Funcionalidades

### 1. 📋 Pacientes e Prontuários CREFITO
- **Ficha cadastral completa**:
  - Dados pessoais (Nome completo, Nome social/fantasia, CPF/RG, Nascimento).
  - Contatos de emergência e atalho com 1 toque para **WhatsApp**.
  - Condições de atendimento: valor padrão da sessão, frequência semanal, TCLE entregue e contrato assinado.
  - **Prontuário Domiciliar CREFITO**: Diagnóstico clínico (CID), Diagnóstico cinesiológico-funcional e Objetivos terapêuticos.
- **Ações Rápidas por Paciente**:
  - Check-in rápido de atendimento com valor padrão preenchido.
  - Registro de evolução clínica imediata.
  - Histórico de evoluções com exportação em PDF.
  - Extrato financeiro individual do paciente.
  - Arquivamento seguro de pacientes (sem exclusão acidental).

### 2. 📝 Evoluções Clínicas & Prontuários
- Registro estruturado: Sinais vitais (PA, FC), Estado clínico geral e Condutas fisioterapêuticas aplicadas.
- Feed cronológico com multi-filtros combináveis (por paciente, mês/ano, período de datas e busca por queixa ou conduta).
- **Exportação de Prontuários em PDF**: cabeçalho profissional, assinatura/carimbo digital e marca d'água elegante.
- Backup local (JSON/CSV) e restauração em lote (*bulk import*).

### 3. 🚗 Agenda Inteligente & Assistente de Rotas
- **Escala Flexível**: agendamento de sessões avulsas ou geração automática de escalas da semana ou mês com suporte a horários diferentes por dia.
- **Sincronização com Google Agenda**: integração bidirecional (cria, atualiza e remove compromissos no calendário do celular).
- **Assistente de Rotas & Combustível**:
  - Cálculo automático de trajetos e tempos de deslocamento entre pacientes.
  - Regra de deslocamento para atendimentos consecutivos (alerta de viabilidade e sugestão de ajuste de horário).
  - Análise inteligente em caso de cancelamentos (compara se compensa retornar à base ou aguardar no local, calculando tempo livre e custo de gasolina).
  - Simulação de rotas com consumo do veículo (km/L) e preço do combustível configuráveis.

### 4. 💰 Controle Financeiro & Recibos
- Visão mensal com saldo recebido e a receber.
- **Modo Privacidade (Ícone de Olho 👁️/🙈)**: oculte valores na tela com um toque para usar na frente de clientes.
- **Comprovantes e Recibos em PDF**: individuais ou consolidados com seleção múltipla de pacientes.
- **Relatório Anual Completo**:
  - KPIs: Faturamento anual, taxa de inadimplência, ticket médio e pacientes ativos.
  - Gráfico comparativo mensal com barras empilhadas (Recebido × Pendente).
  - Ranking de pacientes por faturamento.
  - Distribuição das receitas por forma de pagamento (Pix, Dinheiro, Cartão, Transferência).
  - Calendário interativo com marcação dos dias trabalhados.

### 5. ☕ "Me pague um café" (Pix) & 💬 "Fale com o Desenvolvedor"
- **Me pague um café**: botão presente no topo da aplicação e no rodapé das configurações, abrindo modal com QR Code Pix oficial estilizado e botão de cópia rápida da chave Pix (payload EMV/BR Code) para apoiar o desenvolvedor.
- **Fale com o desenvolvedor**: botão para canal direto de feedback, dúvidas e sugestões integrado via formulário oficial com modal embutido.

### 6. 📊 Contador de Acessos & Área Dev Secreta
- **Contador de acessos**: métricas automáticas de visitas locais e eventos de uso registrados com data/hora, plataforma e navegador.
- **Área Dev Protegida**:
  - Acesso direto via parâmetro de URL: `?dev=admin` (ou `?token=fisioflow2026`).
  - Ou clique no botão discreto **"⚙️ Área Dev"** no rodapé e insira a senha de desenvolvedor (`admin`, `matheus` ou `fisioflow2026`).
  - Painel com KPIs em tempo real, auditoria completa dos últimos acessos, configuração de Webhook/Cloudflare Worker para agregação global e exportação de logs em JSON.

---

## ⚡ Ativação 100% Automática para Terceiros (Sem Código)

O FisioFlow foi desenhado para que qualquer fisioterapeuta possa começar a usar **em menos de 10 segundos**, sem precisar entender nada de programação, Google Apps Script ou APIs:

1. **Primeiro Acesso em 1 Clique**:
   - O fisioterapeuta abre o link do app no celular ou computador.
   - Preenche apenas: **Nome completo**, **CREFITO/CPF** e seu **E-mail do Gmail**.
   - Clica em **"🚀 Conectar e Criar Minha Planilha"**.
2. **Criação e Compartilhamento Automático no Google Drive**:
   - O backend cria instantaneamente uma planilha dedicada exclusiva para esse profissional (`FisioFlow — Dra. [Nome]`).
   - Compartilha a planilha diretamente com o e-mail do Gmail informado como **Editor** — o fisioterapeuta pode abrir o Google Drive dele e ver a planilha em "Compartilhados comigo".
3. **Google Agenda Integrada**:
   - Os agendamentos criados no FisioFlow convidam e sincronizam diretamente com a Google Agenda do celular do profissional.
4. **Link Direto nas Configurações**:
   - Em **Configurações ⚙️**, o profissional tem o botão **"📊 Abrir Minha Planilha no Google Drive ↗"** para auditar, imprimir ou exportar seus dados a qualquer momento.
5. **✨ Modo Demonstração**:
   - Permite testar o app na hora sem internet ou sem cadastro, salvando tudo localmente no aparelho.

---

## 🛠️ Arquitetura Multi-Tenant (Google Apps Script Central)

Para você, desenvolvedor/administrador, gerenciar o FisioFlow para centenas de profissionais:

* O arquivo [`Code.gs`](Code.gs) possui inteligência **multi-inquilino** (*multi-tenant*):
  - Mantém uma aba central chamada `_Usuarios` com o controle de todos os fisioterapeutas cadastrados, links das planilhas, datas de criação e último acesso.
  - Cada fisioterapeuta possui uma planilha completamente isolada e privada no Google Drive, garantindo conformidade com a LGPD e privacidade total entre pacientes de diferentes profissionais.
  - Você só precisa implantar o `Code.gs` **uma única vez** no seu Google Drive como App da Web (`Executar como: Eu`, `Acesso: Qualquer pessoa`).

---

## 📱 Instalação como Aplicativo no Celular (PWA)

O FisioFlow é um **Progressive Web App**:
- **No Android / Chrome**: Ao acessar o link, clique no banner ou botão **"Instalar App"** (ou no menu ⋮ do Chrome > *Adicionar à tela inicial*).
- **No iOS / Safari**: Abra a página no Safari, toque no botão de compartilhar (ícone de quadrado com seta) e escolha **"Adicionar à Tela de Início"**.
- O app funciona com ícone nativo, tela cheia sem barras de navegador e armazena os recursos estáticos em cache para inicialização ultrarrápida.

---

## 💻 Desenvolvimento Local & Testes

Para rodar os testes unitários da aplicação:

```bash
# Rodar a suíte de testes (Node.js 20+)
node --test test/*.test.js
```

### Estrutura de Arquivos

```text
├── atendimentos.html       # Interface completa do PWA (Single Page Application)
├── Code.gs                 # Backend Google Apps Script (API REST/RPC da planilha)
├── index.html              # Ponto de entrada e redirecionamento inicial
├── manifest.json           # Manifesto PWA com metadados e ícones
├── sw.js                   # Service Worker para cache e funcionamento offline (v1)
├── package.json            # Configurações do projeto e scripts de teste
├── icons/                  # Ícones do aplicativo e QR Code Pix oficial
├── test/                   # Testes unitários automatizados
├── scripts/                # Biblioteca QR Code e scripts de build
└── MEMORIA_ATUALIZACOES.md # Histórico técnico de lançamentos e versões
```

---

## 🔒 Segurança e Privacidade

- **Zero compartilhamento de dados**: todos os dados de pacientes, registros clínicos e informações financeiras permanecem sob controle exclusivo da conta Google do proprietário da planilha.
- **Sem rastreamento invasivo**: métricas estritamente agregadas e anônimas locais no dispositivo.
- **Bloqueio de concorrência**: o backend utiliza `LockService` para garantir integridade dos registros mesmo com múltiplas gravações quase simultâneas.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se à vontade para usar, modificar e distribuir.
