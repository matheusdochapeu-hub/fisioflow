# Guia Passo a Passo: Liberar o Google Agenda no FisioFlow

Este guia foi salvo para consulta rápida sempre que você quiser liberar o login oficial do Google Calendar para novas contas ou para o público geral no **Google Cloud Console**.

---

## 📌 Links Diretos e Dados do Seu Projeto

* **Link Direto da Tela de Consentimento:**  
  👉 [https://console.cloud.google.com/apis/credentials/consent?project=concursos-512413](https://console.cloud.google.com/apis/credentials/consent?project=concursos-512413)
* **Nome do Projeto no Google Cloud:** `Concursos`
* **ID do Projeto:** `concursos-512413`
* **Número do Projeto:** `1006150921481`
* **Client ID OAuth:** `1006150921481-phsaf0s3j0ie65d69j3l1uth3b895148.apps.googleusercontent.com`

---

## 🔍 Entendendo o "Erro 403: access_denied"

Quando um projeto no Google Cloud está no status **"Em teste" (Testing)**:
* O Google **bloqueia** qualquer conta de e-mail que não esteja cadastrada na lista de *"Usuários de teste"*.
* É por isso que a conta `corredoresantifascistas@gmail.com` recebeu a tela preta com o erro `Erro 403: access_denied`.

---

## 🛠️ Passo a Passo 1: Liberar a conta `corredoresantifascistas` (Em 1 Minuto)

1. Abra o link: [Tela de Consentimento OAuth no Google Cloud](https://console.cloud.google.com/apis/credentials/consent?project=concursos-512413).
2. Se estiver no novo visual da **Google Auth Platform**, clique na aba **Público** (*Audience*) no menu lateral esquerdo.
3. Role a página até a seção **Usuários de teste** (*Test users*).
4. Clique no botão **`+ ADD USERS`** (ou **Adicionar usuários**).
5. Digite:
   ```text
   corredoresantifascistas@gmail.com
   ```
6. Clique em **Salvar** (*Save*).
7. **Pronto!** A conta agora está autorizada e o botão azul no FisioFlow funcionará sem o erro 403.

---

## 🚀 Passo a Passo 2: Liberar para Terceiros (Qualquer Usuário sem cadastro prévio)

Para que qualquer profissional ou terceiro que acesse o FisioFlow consiga sincronizar a agenda sem que você precise cadastrar o e-mail dele:

1. Na mesma página [Tela de Consentimento OAuth](https://console.cloud.google.com/apis/credentials/consent?project=concursos-512413).
2. Na seção **Status da publicação** (*Publishing status*), onde diz **"Em teste"** (*Testing*):
3. Clique no botão:
   > **`PUBLICAR APLICATIVO`** (*Publish App*)
4. Na janela de confirmação que abrir, clique em **Confirmar** (*Confirm*).
5. O status passará para **"Em produção"** (*In production*).
   * *Em produção, o Google permite que até 100 usuários utilizem o app livremente.*
   * *Os usuários verão apenas o aviso inicial padrão de "O Google não verificou este app", onde basta clicar em "Avançado > Acessar matheusdochapeu-hub.github.io".*

---

## 📡 Alternativa Nativa Recomendada: Assinatura iCal (Zero Login, Nunca Expira)

Se você ou algum usuário não quiser fazer o login do Google Cloud:
1. No FisioFlow, abra **⚙️ Google Agenda**.
2. Clique no botão verde:
   > **`[📅 Abrir e Assinar no Google Agenda]`**
3. O Google Agenda oficial abrirá perguntando: *"Deseja adicionar a agenda FisioFlow - Atendimentos?"*. Clique em **Adicionar**.
4. **Funciona 100% no celular e no computador**, não expira a cada 1 hora e não exige autorização no Google Cloud.
