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

---

## 🚀 Como Configurar e Utilizar

Para colocar o **FisioFlow** em produção para você ou seus clientes:

### Passo 1: Configurar a Planilha no Google Drive
1. Crie uma nova planilha no seu [Google Drive](https://drive.google.com).
2. Nomeie como desejar (ex: `FisioFlow - Gestão Clínica`).

### Passo 2: Configurar o Google Apps Script
1. Na planilha, clique no menu superior em **Extensões > Apps Script**.
2. Apague o código padrão que estiver no arquivo `Código.gs`.
3. Copie todo o conteúdo do arquivo [`Code.gs`](Code.gs) deste repositório e cole no editor.
4. Clique no ícone de salvar (💾).

### Passo 3: Implantar como App da Web
1. No canto superior direito do Apps Script, clique no botão azul **Implantar > Nova implantação**.
2. Clique no ícone de engrenagem ⚙️ ao lado de "Selecione o tipo" e escolha **App da Web**.
3. Preencha as opções:
   - **Descrição**: `FisioFlow API`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem pode acessar**: `Qualquer pessoa` *(necessário para o aplicativo PWA no navegador poder consultar e salvar dados)*
4. Clique em **Implantar** e autorize as permissões solicitadas pela sua conta Google.
5. Copie a **URL do app da Web** gerada (termina com `/exec`).

### Passo 4: Acessar e Conectar o FisioFlow
1. Abra o arquivo [`atendimentos.html`](atendimentos.html) no navegador ou hospede os arquivos em um serviço estático gratuito (como [GitHub Pages](https://pages.github.com), Netlify ou Vercel).
2. Na tela de boas-vindas do app:
   - Informe o seu nome profissional e registro CREFITO.
   - Cole a URL do Apps Script (`/exec`) no campo correspondente.
   - (Opcional) Informe o e-mail da sua Google Agenda e endereço base.
3. Clique em **Salvar e Começar**. Pronto! O aplicativo está configurado e pronto para uso.

> 💡 **Dica para distribuição a terceiros**: Se você for hospedar uma versão fixa para um cliente, pode inserir a URL gerada diretamente na constante `SCRIPT_URL` no topo de `atendimentos.html`. Dessa forma, o app já abre direto conectado para o usuário.

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
├── sw.js                   # Service Worker para cache e funcionamento offline
├── package.json            # Configurações do projeto e scripts de teste
├── icons/                  # Ícones do aplicativo em diferentes resoluções
├── test/                   # Testes unitários automatizados
├── scripts/                # Scripts auxiliares e sincronização
└── MEMORIA_ATUALIZACOES.md # Histórico técnico de lançamentos e versões
```

---

## 🔒 Segurança e Privacidade

- **Zero compartilhamento de dados**: todos os dados de pacientes, registros clínicos e informações financeiras permanecem sob controle exclusivo da conta Google do proprietário da planilha.
- **Sem rastreamento**: o FisioFlow não utiliza bibliotecas de telemetria de terceiros.
- **Bloqueio de concorrência**: o backend utiliza `LockService` para garantir integridade dos registros mesmo com múltiplas gravações quase simultâneas.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se à vontade para usar, modificar e distribuir.
