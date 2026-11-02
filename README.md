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

## ⚡ Integração e Onboarding com Conta Google (Primeiro Acesso)

O FisioFlow conta com um assistente automatizado de primeiro acesso com a Conta Google:

1. **Vincular Conta Google**: com 1 clique usando o Google Identity Services (GIS), o usuário seleciona e autoriza sua conta Google.
2. **Criação Automática no Google Drive & Sheets**: o app cria instantaneamente uma nova planilha chamada `FisioFlow - Gestão Clínica` no Drive do usuário com todas as 4 abas estruturadas e formatadas (`Atendimentos`, `Pacientes`, `Evolucoes`, `Config`).
3. **Vinculação com Google Agenda**: conecta o e-mail do calendário para sincronização automática de sessões e horários de atendimento.
4. **Deploy do Apps Script**: exibe botão de 1 clique para copiar o `Code.gs` e atalho para abrir o editor do Apps Script da planilha criada para gerar a URL `/exec`.

---

## 🚀 Como Configurar e Utilizar

Para colocar o **FisioFlow** em produção para você ou seus clientes:

### Método A: Onboarding Automático Google (Recomendado)
1. Abra o arquivo [`atendimentos.html`](atendimentos.html) no navegador ou acesse a versão hospedada no GitHub Pages.
2. Na tela de boas-vindas, clique em **"Conectar com o Google"**.
3. Autorize o acesso — o FisioFlow criará sua planilha estruturada no Google Drive e vinculará sua Google Agenda automaticamente.
4. Clique em **"Copiar Code.gs"** e siga o link direto para implantar seu Web App no Apps Script.

### Método B: Configuração Manual
1. Crie uma nova planilha no seu [Google Drive](https://drive.google.com).
2. Na planilha, clique em **Extensões > Apps Script**.
3. Apague o conteúdo padrão, cole o código do arquivo [`Code.gs`](Code.gs) e salve.
4. Clique em **Implantar > Nova implantação**, escolha **App da Web**, configure para executar como **Eu** e acesso para **Qualquer pessoa**.
5. Copie a URL gerada (`/exec`) e cole na tela de configuração inicial do FisioFlow.

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
