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
- **Endereço Base Próprio para Cada Usuário**: cada profissional configura seu próprio ponto de partida (residência ou consultório), permitindo ao Assistente de Rotas traçar trajetos individualizados.
- **Parâmetros do Veículo Customizáveis**: consumo médio urbano (km/L) e preço da gasolina (R$/L) configurados pelo usuário e salvos na nuvem.
- **Escala Flexível**: agendamento de sessões avulsas ou geração automática de escalas da semana ou mês com suporte a horários diferentes por dia.
- **Sincronização com Google Agenda**: integração bidirecional (cria, atualiza e remove compromissos no calendário do celular).
- **Assistente de Rotas & Combustível**:
  - Cálculo automático de trajetos e tempos de deslocamento entre pacientes a partir da base do profissional.
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

1. **Primeiro Acesso em 1 Clique (ou Modo Demonstração)**:
   - O fisioterapeuta abre o link do app no celular ou computador.
   - Pode clicar diretamente em **"🎯 Testar primeiro no Modo Demonstração"** para navegar imediatamente com dados fictícios.
   - Para criar seu ambiente de produção: preenche **Nome completo**, **E-mail do Google (Gmail)**, **CREFITO/CPF** (opcional) e **Endereço Base / Consultório**.
   - Clica em **"🚀 Começar Agora (Criar Minha Planilha Grátis)"**.
2. **Criação e Compartilhamento Automático no Google Drive**:
   - O backend cria instantaneamente uma planilha dedicada exclusiva para esse profissional (`FisioFlow — Dra. [Nome]`).
   - Compartilha a planilha diretamente com o e-mail do Gmail informado como **Editor** — o fisioterapeuta pode abrir o Google Drive dele e ver a planilha em "Compartilhados comigo".
3. **Persistência de Configurações no Google Sheets**:
   - Todos os dados da aba de Configurações (dados profissionais, endereço do consultório, consumo do carro) são sincronizados em uma aba dedicada `Configuracao` da planilha.
4. **Google Agenda Integrada (1-Clique OAuth & Live iCal Feed)**:
   - **Conexão em 1 Clique (Google OAuth v3)**: com apenas um toque no botão *"Conectar Minha Google Agenda"*, os agendamentos, reagendamentos, cancelamentos e períodos de férias são enviados e sincronizados diretamente com o Google Calendar do celular do profissional, sem necessidade de compartilhar calendários ou configurações manuais.
   - **Feed ao Vivo (iCal / .ics)**: link de assinatura privada permanente para sincronizar com Google Agenda, Apple Calendar (iPhone/Mac) ou Outlook com atualizações contínuas.
   - **Abertura Direta do Dia**: o botão *"📅 Google Agenda"* no card de agendamento abre diretamente o dia correspondente no aplicativo oficial do Google Agenda.
5. **Link Direto nas Configurações**:
   - Em **Configurações ⚙️**, o profissional tem o botão **"📊 Abrir Minha Planilha no Google Drive ↗"** para auditar, imprimir ou exportar seus dados a qualquer momento.
6. **✨ Modo Demonstração**:
   - Permite testar o app na hora sem internet ou sem cadastro, salvando tudo localmente no aparelho.

---

## 🛠️ Arquitetura Multi-Tenant (Google Apps Script Central)

Para você, desenvolvedor/administrador, gerenciar o FisioFlow para centenas de profissionais:

* O arquivo [`Code.gs`](Code.gs) possui inteligência **multi-inquilino** (*multi-tenant*):
  - Mantém uma aba central chamada `_Usuarios` com o controle de todos os fisioterapeutas cadastrados, links das planilhas, datas de criação e último acesso.
  - Cada fisioterapeuta possui uma planilha completamente isolada e privada no Google Drive, com abas dedicadas (`Atendimentos`, `Pacientes`, `Evolucoes`, `Exercicios`, `Rotinas`, `Agendamentos` e `Configuracao`).
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
├── Code.gs                 # Backend Google Apps Script (API REST/RPC multi-tenant)
├── index.html              # Ponto de entrada e redirecionamento inicial
├── manifest.json           # Manifesto PWA com metadados e ícones
├── sw.js                   # Service Worker para cache e funcionamento offline (v4)
├── package.json            # Configurações do projeto e scripts de teste
├── icons/                  # Ícones do aplicativo e QR Code Pix oficial
├── test/                   # Testes unitários automatizados
├── scripts/                # Biblioteca QR Code e scripts de build
└── MEMORIA_ATUALIZACOES.md # Histórico técnico de lançamentos e versões
```

---

## 🔒 Privacidade Absoluta, Sigilo Profissional e LGPD

O FisioFlow foi desenhado sob o princípio de **Privacy by Design** e em estrita conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)** e o **Código de Ética e Deontologia da Fisioterapia (Resoluções COFFITO/CREFITO)**:

### 1. 🛡️ Garantia de Não-Acesso pelos Desenvolvedores
- **Os desenvolvedores do FisioFlow NÃO têm acesso, não visualizam, não armazenam cópias e NUNCA acessarão ou comercializarão nenhum dado pessoal ou clínico dos seus pacientes.**
- Todo prontuário, anotação de evolução, sinal vital (PA/FC), hipótese diagnóstica (CID) e registro financeiro pertence única e exclusivamente ao fisioterapeuta responsável e ao paciente titular.

### 2. 📁 Armazenamento Descentralizado no Google Drive do Usuário
- Cada profissional possui sua **própria planilha isolada no Google Sheets** (`FisioFlow — Dra. [Nome]`), compartilhada diretamente com seu e-mail do Gmail com permissão de Editor.
- Não existem servidores ou bancos de dados intermediários sob custódia de terceiros retendo fichas médicas ou dados de saúde.

### 3. ⚙️ Sincronização da Aba `Configuracao` na Planilha
- Todas as preferências inseridas na aba de **Configurações** (Nome Profissional, Registro CREFITO, Contato, Endereço Base / Consultório, Consumo do Veículo Km/L e Preço da Gasolina) são gravadas automaticamente na aba `Configuracao` da planilha privada do usuário, garantindo portabilidade e sincronização entre múltiplos dispositivos.

### 4. ⚖️ Direitos do Titular (Artigos 17 e 18 da LGPD)
- **Portabilidade Total**: A qualquer momento, o profissional pode exportar o banco de dados completo em formatos universais (`.json` ou `.csv`) diretamente pela tela de Configurações.
- **Direito de Revogação e Exclusão**: Como a planilha fica no Google Drive do usuário, ele tem autonomia plena para revogar acessos ou excluir permanentemente a planilha quando desejar.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se à vontade para usar, modificar e distribuir.
