# Guia de Implantação e Disponibilização para Terceiros — FisioFlow 🌿

Este guia detalha como disponibilizar o **FisioFlow** para outros fisioterapeutas, equipes e clínicas de forma 100% gratuita, escalável e segura.

---

## 🏛️ Arquitetura do FisioFlow

O FisioFlow é estruturado em duas camadas independentes e sem custo de infraestrutura fixa:

1. **Frontend PWA (Estático)**: 
   - Arquivos HTML, CSS, JavaScript e Service Worker.
   - Hospedável gratuitamente no **GitHub Pages**, **Vercel**, **Netlify** ou **Cloudflare Pages**.
2. **Backend Serverless Multi-Tenant (`Code.gs`)**:
   - Roda gratuitamente no Google Apps Script sob a infraestrutura do Google Drive.
   - Cria e orquestra planilhas isoladas no Google Drive para cada profissional cadastrado.
3. **Google Agenda (OAuth v3 & iCal)**:
   - Sincronização direta de compromissos com o Google Calendar do próprio usuário em 1 clique.

---

## 🚀 Passo 1: Publicar o Aplicativo (Frontend) no GitHub Pages

1. Acesse o seu repositório no GitHub: `https://github.com/matheusdochapeu-hub/fisioflow`.
2. Vá em **Settings** (Configurações) > **Pages** (no menu lateral esquerdo).
3. Na seção **Build and deployment**:
   - **Source**: selecione `Deploy from a branch`.
   - **Branch**: selecione `main` e a pasta `/ (root)`.
   - Clique em **Save**.
4. Em 1 a 2 minutos, o GitHub exibirá o link público do app:
   `https://matheusdochapeu-hub.github.io/fisioflow/`

> 📱 **Pronto!** Qualquer pessoa que abrir esse link no celular ou computador poderá usar o FisioFlow.

---

## ⚙️ Passo 2: Backend Central Multi-Tenant (`Code.gs`)

O FisioFlow já vem configurado de fábrica para se conectar a um backend multi-tenant em nuvem pronto para uso. Se você deseja manter seu próprio backend privado:

1. Acesse o [Google Drive](https://drive.google.com).
2. Crie uma nova Planilha Google em branco e nomeie-a como `FisioFlow — Servidor Central`.
3. No menu superior da planilha, clique em **Extensões** > **Apps Script**.
4. Apague todo o código de exemplo e cole o conteúdo integral do arquivo [`Code.gs`](Code.gs).
5. Clique em **Salvar** (ícone de disquete).
6. No canto superior direito, clique no botão azul **Implantar** > **Nova implantação**.
7. Clique na engrenagem ao lado de "Selecionar tipo" e escolha **App da Web**:
   - **Descrição**: `FisioFlow API v1`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem pode acessar**: `Qualquer pessoa` *(essencial para permitir que o app no celular grave e leia os dados)*
8. Clique em **Implantar** e autorize as permissões da sua conta Google.
9. Copie a **URL do App da Web** gerada (terminada em `/exec`).
10. Se desejar torná-la o padrão global do seu fork, substitua a constante `DEFAULT_CENTRAL_SCRIPT_URL` no arquivo `atendimentos.html`.

---

## 👩‍⚕️ Passo 3: Como os Fisioterapeutas Usam o App

Ao enviar o link `https://matheusdochapeu-hub.github.io/fisioflow/` para um fisioterapeuta:

### 1. Primeiro Acesso
- O profissional abre o link no navegador.
- **Opção A (Sem Cadastro)**: pode clicar em *"🎯 Testar primeiro no Modo Demonstração"* para conhecer a interface com dados de exemplo.
- **Opção B (Criar Banco de Dados)**: preenche:
  - **Nome Completo**
  - **E-mail do Gmail** (onde receberá a planilha compartilhada)
  - *(Opcional)* CREFITO/CPF, WhatsApp, Endereço do Consultório e consumo do carro.
- Clica em **"🚀 Começar Agora (Criar Minha Planilha Grátis)"**.

### 2. O que acontece nos bastidores
- Uma planilha nova, 100% privada e formatada com todas as abas necessárias é criada no Google Drive e compartilhada diretamente com o e-mail informado.
- O fisioterapeuta tem acesso irrestrito aos seus próprios dados no Google Drive.
- O desenvolvedor **não tem acesso** aos pacientes ou prontuários cadastrados.

### 3. Conexão com Google Agenda
- Na aba **Agenda**, basta clicar em **"🔗 Conectar Minha Google Agenda (1 Clique)"**.
- O Google abrirá a tela oficial de consentimento para conceder permissão de escrita na agenda pessoal do profissional.
- A partir daí, qualquer atendimento marcado ou alterado no FisioFlow reflete imediatamente no calendário do celular.
- O app também disponibiliza o link permanente de **Feed iCal (.ics)** para inscrição no Apple Calendar ou Outlook.

### 4. Instalação no Celular (PWA)
- **No iPhone (iOS / Safari)**:
  - Toque no botão de compartilhamento (ícone com quadrado e seta para cima).
  - Selecione **"Adicionar à Tela de Início"**.
- **No Android (Chrome)**:
  - Toque no botão flutuante **"Instalar App"** ou no menu ⋮ > **"Adicionar à tela inicial"**.

---

## 🔒 Conformidade LGPD e Segurança dos Dados

- **Isolamento de Tenants**: Cada profissional opera sobre uma planilha física separada no Google Drive.
- **Token OAuth Local**: Tokens de acesso à Google Agenda são salvos exclusivamente no `localStorage` do dispositivo do usuário e expiram automaticamente a cada hora, nunca passando por servidores intermediários.
- **Transparência**: O usuário tem um botão permanente em Configurações para abrir diretamente sua planilha no Google Drive e realizar backups em JSON ou CSV a qualquer instante.
