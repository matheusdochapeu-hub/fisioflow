# Memória de Atualizações — FisioFlow (`fisioflow`)

Data da consolidação: `02/11/2026`  
Versão do Service Worker: `fisioflow-v20` (`sw.js`)

---

## 9. Auditoria Completa e Blindagem do Módulo de Rotas, Endereço Base e Consumo (`v20`)
- **Blindagem Contra Exceções de Endereço Base Nulo (`TypeError: Cannot read properties of null`):**
  - Identificado e corrigido ponto crítico em `updateScheduleModalRouteAnalysis()` onde `rHome.distanceKm` era acessado diretamente sem validar se `rHome` era nulo (ocorrendo quando o usuário ainda não havia configurado endereço base).
  - Corrigido em `previewPatientFormRoutes()` o acesso direto a `rHome.distanceKm`, agora exibindo aviso amigável com botão direto para configurar a base, sem travar o cálculo de tempo de carro entre os outros pacientes.
  - Blindado cálculo de intervalo longo `driveHomeTotal`: se `homeAddr` ou `rHome` não estiverem configurados, informa o trajeto direto e orienta o cadastro da base sem lançar exceção.
- **Correção do Nome de Exibição da Base (`getHomeAddressDisplayName`):**
  - Anteriormente, o algoritmo separava por hífen/vírgula e retornava cegamente o segundo elemento. Para endereços como `"Rua General Osório, 100 - Centro, Ribeirão Preto - SP"`, o segundo elemento era o número `"100"`, resultando no texto incorreto `"Saída da Base (100) → Paciente"`.
  - Agora, o algoritmo filtra ativamente números de rua, CEPs, números de apartamento/sala e siglas de estado (UF), extraindo com precisão o nome real do bairro (ex.: `"Centro"` ou `"Jardim Sumaré"`).
- **Dedução Automática de Cidade (`getUserCityFallback`):**
  - Implementada função para extrair a cidade/UF do endereço base do usuário.
  - Em `getPatientFullAddress(p)`, caso o fisioterapeuta cadastre apenas rua e bairro sem preencher a cidade, o sistema assume automaticamente a cidade do profissional, evitando que geocodificadores pesquisem o bairro em outros municípios ou estados, além de evitar duplicação caso a cidade já esteja no texto.
- **Resiliência do Cálculo de Combustível (`calcFuelMetrics`):**
  - Protegido contra `null`, `undefined` e `NaN` para quilometragem, garantindo valores seguros padrão para `kml` e preço do combustível e prevenindo divisão por zero.
- **UX do Simulador de Rotas (`openRouteSimulatorModal` / `runRouteSimulator`):**
  - Ao selecionar a origem `__HOME__` (Base / Consultório) com endereço vazio, o simulador exibe banner claro com botão direto de configuração em vez de tela em branco ou erro de proximidade.
  - O ranking de proximidade informa claramente se o endereço base ainda não foi preenchido.
- **Service Worker & Testes Automatizados:**
  - Service worker atualizado para `fisioflow-v20` em `sw.js`.
  - Suíte de testes expandida para 41 testes unitários automatizados cobrindo todos os cenários de rotas, endereços, deduções de cidade e cálculo de combustível.

---

## 8. Modo Desenvolvedor Estritamente Acessível por Link Específico (`v19`)
- **Acesso Exclusivo por Link Específico:**
  - O modo desenvolvedor e o painel de métricas/contador de acessos agora são acionados **exclusivamente** via link com parâmetro de autenticação autorizado (`?dev=admin`, `?dev=fisioflow2026`, etc.).
  - Ao carregar a URL específica, o painel administrativo abre imediatamente na tela e a URL é higienizada automaticamente via `history.replaceState` (removendo `?dev=` do endereço para não ficar salvo no histórico do navegador).
  - Ao fechar o modal, o app retorna 100% ao modo de uso regular.
- **Inexistência de Elementos Dev na Interface do Usuário:**
  - Removido completamente o botão `#btnDevPanel` do rodapé do app.
  - Removidos quaisquer cliques ou gestos secretos de toque furtivo do selo "FF" (`.stamp`), tornando-o um elemento visual puramente estático.
  - Removido qualquer modal de digitação de senha na tela normal.
  - O usuário comum não possui nenhum elemento, botão, link ou atalho interativo no DOM para visualizar ou acionar a área do desenvolvedor.
- **Service Worker & Testes Automatizados:**
  - Service worker atualizado para `fisioflow-v19` em `sw.js`.
  - 36 testes unitários automatizados passando com 100% de sucesso, garantindo a ausência total de elementos dev no HTML e a restrição estrita de ativação via link.

---

## 7. Ocultação Total e Sigilo do Modo Desenvolvedor para Usuários Comuns (`v18`)
- **Remoção de Links Visíveis do Modo Dev:**
  - Removido o link `🔐 Área do Desenvolvedor (Acesso administrativo)` da tela de cadastro/setup inicial (`#setupScreen`). Usuários novatos agora veem apenas a interface limpa e as informações de boas-vindas e LGPD.
  - Removido o link `🔐 Área Dev & Contador de Acessos` do rodapé da tela principal (`footer`). Usuários comuns não têm nenhuma referência visual ou texto sobre a área de desenvolvimento.
- **Isolamento e Sigilo Estrito da Área Dev:**
  - O painel do desenvolvedor NÃO é ativado automaticamente pelo simples preenchimento de e-mail no aplicativo.
  - O botão `#btnDevPanel` permanece com `display: none !important;` e só ganha visibilidade se o desenvolvedor se autenticar ativamente na sessão (`sessionStorage.setItem('fisioflow_dev_autenticado', '1')`).
- **Formas Exclusivas de Acesso para o Desenvolvedor:**
  - **1. Link Secreto via URL:** Parâmetro `?dev=admin` ou `?dev=fisioflow2026` (ex.: `https://.../atendimentos.html?dev=admin`). O parâmetro é limpo da URL automaticamente após o desbloqueio para não ficar no histórico do navegador.
  - **2. Easter Egg Discreto no Selo "FF":** Tocar 5 vezes seguidas no selo "FF" (`.stamp`) no topo abre o modal protegido solicitando a senha de administrador. Usuários que tocam normalmente não ativam nada.
- **Service Worker & Testes Automatizados:**
  - Service worker atualizado para `fisioflow-v18` em `sw.js`.
  - Adicionada suíte de testes unitários `Dev Mode Isolation & Stealth for Regular Users`, totalizando 36 testes passando com 100% de sucesso.

---

## 6. Sincronização Completa com o Google Agenda, Correção de 'primary' e Sincronização em Lote (`v17`)
- **Eliminação da Armadilha do CalendarId `'primary'`:**
  - `DEFAULT_CALENDAR_ID` alterado de `'primary'` para `''`.
  - `getUserCalendarId()` atualizado para descartar estritamente o valor `'primary'` (que no Google Apps Script grava os eventos apenas na agenda da conta criadora do script sem convidar o usuário, deixando o celular do fisioterapeuta vazio).
  - Resolução automática em cascata da conta real do usuário: prioriza `config.calendarId`, `localStorage.ff_calendar_id`, e-mail de login Google (`ff_google_user_email`), autenticação dev (`ff_dev_auth_email`) ou `config.usuarioId` / `config.contactEmail`.
  - Limpeza automática e higienização durante a inicialização do app (`init`): qualquer valor `'primary'` salvo anteriormente é purgado do `config` e do `localStorage`.
- **Sincronização em Lote com Google Agenda (`syncAllSchedulesWithGCal`):**
  - Adicionado botão interativo `[🔄 Sincronizar Tudo]` no banner recolhido da Agenda e no modal de configurações de agenda e rotas.
  - Sincroniza todos os agendamentos ativos e blocos de férias com o Google Agenda em uma única requisição em lote (`create_schedules_batch`), vinculando os IDs retornados (`calendarEventId`) no estado local e salvando no `localStorage`.
  - Ao salvar o e-mail no modal `openCalendarSettingsModal`, se houver agendamentos ainda não sincronizados, o disparo ocorre de forma automatizada e transparente para o profissional.
- **Correção da Criação e Sincronização de Férias e Ausências:**
  - Corrigido o envio de horários para dias inteiros em `submitVacationBlock`: envio padronizado de `hora: '08:00'` e `duracaoMin: 720` para a API, eliminando o erro de parsing `NaN:NaN` e a mensagem *"Data/hora inválida para o Google Agenda"*.
  - Payload achatado em `create_schedule` e `create_schedules_batch`, garantindo compatibilidade total com o endpoint central do Apps Script.
  - Adicionado botão `[📅 Google Agenda]` nos cards de ausência da visão diária para abertura direta no Google Agenda ou sincronização instantânea.
- **Melhoria no Gerador de Links Web do Google Agenda (`buildGCalTemplateUrl` e `openScheduleInGCalUrl`):**
  - Formatação inteligente de datas, horários e títulos tanto para sessões de fisioterapia domiciliar quanto para bloqueios de agenda/férias.
  - Parâmetro `&authuser=` vinculado ao e-mail real do usuário para abrir diretamente no perfil correto do Google Calendar web/app.
  - Sincronização em segundo plano caso o usuário clique no botão e o agendamento ainda não tenha ID de evento registrado.
- **Banner Retrátil Visível e Funcional:**
  - Corrigido bug onde o banner recolhido recebia `.hidden` ao vincular e sumia da tela. Agora o elemento `<details>` permanece como barra discreta de ~36px indicando o e-mail conectado (ex.: `corredoresantifascistas@gmail.com`), com dot verde pulsante e botão de configurações.
- **Área do Desenvolvedor & Reconhecimento de Usuário Dev:**
  - Auto-autorização imediata para o e-mail `corredoresantifascistas@gmail.com` e `matheusdochapeu@gmail.com` na inicialização.
  - Acesso direto via parâmetro de URL (`?dev=admin`, `?dev=fisioflow2026`) ou pelo link no rodapé com senha de desenvolvedor.
- **Service Worker & Testes Automatizados:**
  - Service worker atualizado para `fisioflow-v17` em `sw.js`.
  - 29 testes unitários automatizados passando com 100% de sucesso (`node --test fisioflow/test/*.test.js`).

- **Correção e Salvamento Local-First do Modal de Férias e Ausências (`openVacationModal` / `submitVacationBlock`):**
  - Modal estruturado estritamente no padrão de modais do app (`.modal-bg` com backdrop blur + `.modal` com `.grabber`), responsivo em dispositivos móveis.
  - Salvamento otimista imediato (`local-first`) no array `schedules` e no `localStorage`, fechamento instantâneo do modal, renderização atualizada da grade e notificação toast com sucesso.
  - Sincronização remota executada de forma assíncrona em segundo plano para o Apps Script e Google Calendar, eliminando travamento do botão ou falha na criação local caso a rede oscile.
- **UX Harmonizada do Calendário com Tamanhos Uniformes:**
  - Grade do calendário (`renderAgendaCalendar`): todas as células de dias (`.cal-day`) possuem altura padronizada e travada em `46px` (`height: 46px; min-height: 46px; max-height: 46px; box-sizing: border-box;`), com `.cal-day-num` e área de indicadores `.cal-day-dots` de `13px`, mantendo todas as semanas e dias perfeitamente alinhados, sem deformações visuais causadas pela presença ou ausência de badges.
  - Grid de estatísticas (`.agenda-kpi-grid`): 4 cards de KPI (`Agendados`, `A Realizar`, `Realizados`, `Ausências`) com altura uniforme de `52px`, 25% de largura proporcional cada, valores monoespaçados destacados e suporte a seleção interativa com classe `.active`.
  - Implementada a função `setAgendaStatusFilter(st)` para alternar o filtro e destacar visualmente o KPI ativo com clique direto.
  - Barra de ações (`.agenda-actions-row`): 3 botões em grade de proporção idêntica (`[📅 + Agendar]`, `[🏖️ Férias / Ausência]`, `[🚗 Rotas & Distâncias]`), altura padrão de `42px` e bordas alinhadas.
- **Recolhimento e Redução do Vínculo com Google Agenda:**
  - Card dominante substituído por container retrátil compacto (`<details id="gcalDetailsWrapper">` + `<summary id="gcalBannerBox">`), ocupando apenas uma barra discreta de ~36px com dot de status, e-mail vinculado e pílula `⚙️ Configurar`.
  - Conteúdo expandido apenas sob demanda do usuário caso deseje alterar agenda ou exportar calendário `.ICS`.
- **Cache do Service Worker:**
  - Atualizado para `fisioflow-v16` em `sw.js`.

---

## 4. Correção do Modal de Férias, UX Uniforme do Calendário e Ocultação do Banner do Google Agenda (`v15`)
- **Correção Definitiva do Botão "Férias / Ausência" (`openVacationModal`):**
  - Reestruturado com o padrão de modais do app: `.modal-bg` com backdrop blur + `.modal` com `.grabber`, abrindo com animação slide-up responsiva e fechamento ao tocar no fundo ou botão Cancelar.
- **UX Uniforme do Calendário e Botões com Tamanhos Similares:**
  - Células do calendário com altura uniforme de `44px`, eliminando desproporção na primeira semana.
  - Chips de estatísticas do mês e barra de botões com tamanhos padronizados.
- **Ocultação e Recolhimento do Vínculo com Google Agenda:**
  - Banner informativo ocultado automaticamente da tela principal quando a agenda já está vinculada, mantendo o acesso pela tela de Configurações (⚙️).
- **Cache do Service Worker:**
  - Atualizado para `fisioflow-v15` em `sw.js`.

---

## 3. Módulo de Férias e Ausências com Integração na Agenda e Relatório Financeiro (`v14`)
- **Registro Rápido de Férias e Ausências (`atendimentos.html`):**
  - Adicionado o botão `[🏖️ Férias / Ausência]` na barra de ações rápidas da Agenda.
  - Modal interativo (`openVacationModal`) com seleção de período (Data Inicial e Data Final), tipo de ausência (`🏖️ Férias`, `🌴 Folga / Recesso`, `🎓 Congresso / Curso`, `🏥 Atestado Médico`, `🏛️ Feriado`, `🚫 Bloqueio de Horário`), modo Dia Inteiro (08:00–20:00) ou Horário Específico, e observações.
  - **Detecção de Conflitos em Tempo Real:** ao selecionar as datas, o sistema verifica automaticamente se há agendamentos de pacientes marcados para o período e exibe alerta visual em vermelho com o total de conflitos e a opção de cancelá-los automaticamente com 1 clique ao confirmar o bloqueio.
  - **Alerta Preventivo no Agendamento:** a função `submitSchedule()` alerta caso o usuário tente agendar um paciente em uma data já bloqueada por férias/ausência.
- **Sincronização com o Google Calendar (`Code.gs`):**
  - `buildCalendarTitleAndDesc_(item)` distingue atendimentos clínicos de bloqueios de agenda (`pacienteId === '__BLOQUEIO__'` ou `status === 'Ausência'`).
  - Eventos de férias/bloqueio são registrados diretamente no Google Agenda vinculado com título amigável e `sendInvites: false`, sem enviar convites por e-mail ou adicionar participantes.
- **Visualização Visual na Grade e Lista da Agenda:**
  - Grade mensal com marcação de badge `🏖️` e borda âmbar tracejada nos dias com ausências cadastradas.
  - Lista de atendimentos do dia com card estilizado em tom âmbar suave com tag `🏖️ Ausência` e botão de exclusão imediata `[✕ Excluir Ausência]`.
  - 4º chip de estatísticas do mês no cabeçalho da Agenda: `[ X ] dias de ausência`, com filtro direto via clique (`setAgendaStatusFilter('Ausência')`).
- **Integração Completa no Relatório Financeiro:**
  - **Chip de KPI Anual:** exibição destacada no topo do relatório: `🏖️ FÉRIAS / FOLGA: X dias no ano`.
  - **Banner Explicativo de Produtividade:** se o mês selecionado possuir ausências, exibe banner informativo contextualizando que variações no faturamento decorrem do recesso/férias programados.
  - **Gráfico Comparativo Mês a Mês:** indicador visual `🏖️` nos meses que registraram ausências.
  - **Impacto Neutro na Projeção Financeira:** ausências são gravadas com `Valor: 0` e status `Ausência`, garantindo que não inflem a previsão de faturamento nem apareçam como receitas pendentes.
- **Substituição do Botão "Pagar" por "Registrar Pagamento" & Remoção de Exercícios como Pacientes:**
  - Botão de ação rápida nos cards pendentes renomeado para `💰 Registrar Pagamento`.
  - Lista de bloqueio `NON_PATIENT_NAMES` e filtro `isInvalidPatientName(name)` para ignorar e rejeitar termos de exercícios ("agachamento", "flexao", "prancha") em rankings, listas e carregamentos.
- **Cache do Service Worker:**
  - Atualizado para `fisioflow-v14` em `sw.js`.

---

## 0. Multi-Tenant Central, LGPD e Sincronização de Configurações (`v32 - fisioflow-v4`)
- **Backend Multi-Inquilino Centralizado (`Code.gs`):**
  - Registro central de profissionais na aba `_Usuarios` (`UsuarioId`, `Email`, `Nome`, `Documento`, `SpreadsheetId`, `SpreadsheetUrl`, `CriadoEm`, `UltimoAcesso`).
  - Criação instantânea de planilha dedicada no Google Drive do desenvolvedor e compartilhamento como **Editor** com o Gmail do fisioterapeuta (`SpreadsheetApp.create` + `addEditor`).
  - Roteamento dinâmico de todas as requisições (`doGet` e `doPost`) para a planilha isolada do usuário via `usuarioId`.
- **Endereço Base Próprio para Cada Usuário:**
  - Campo `#providerAddressInput` no onboarding e nas configurações para o fisioterapeuta definir seu ponto de partida (residência ou consultório).
  - Parâmetros veiculares de consumo urbano (km/L) e preço da gasolina (R$/L) configuráveis.
  - O Assistente de Rotas calcula trajetos, tempos e custos a partir do endereço configurado pelo próprio usuário.
- **Persistência da Aba `Configuracao` no Google Sheets:**
  - Criação automática da aba `Configuracao` (`Chave`, `Valor`, `AtualizadoEm`) em cada planilha.
  - Sincronização bidirecional: `save_config` via `doPost` e leitura automática em `doGet` (`configuracao: getConfigObject_()`).
- **Conformidade LGPD & Sigilo Profissional (Lei nº 13.709/2018):**
  - Card informativo no onboarding e nas configurações destacando o princípio do *Privacy by Design*.
  - Modal interativo `openLgpdModal()` com detalhes sobre custódia exclusiva, sigilo CREFITO/COFFITO e direitos de portabilidade/exclusão.
  - **Garantia explícita de que os desenvolvedores NÃO têm acesso, não visualizam e nunca acessarão nenhum prontuário ou dado de paciente.**
- **Módulos de Comunicação e Apoio:**
  - Botão oficial "☕ Me pague um café" com modal e QR Code Pix + payload EMV.
  - Botão "💬 Fale com o desenvolvedor" integrado via Google Forms em modal embutido.
  - Área Dev protegida por senha/link para auditoria e telemetria de acessos.

---

## 1. Estabilidade, Concorrência, Sincronização e Link da Planilha (`Plans 001–005` + `v21–v31`)
- **Validação estrita em `postAction` (`atendimentos.html`):** Detecta erros HTTP, páginas HTML de erro do Google Apps Script e respostas `handled: false` ou `success: false`, retornando o objeto JSON parseado (`data`) para uso direto nos fluxos de sincronização.
- **Bloqueio de concorrência em `Code.gs`:** Uso de `LockService.getScriptLock()` (timeout de 30s) com `try/catch/finally` e formatação de datas respeitando o fuso horário da planilha (`getTimeZone_()`).
- **Migração automática de colunas e abas (`ensureHeaders_` em `Code.gs`):** Adiciona automaticamente novas colunas (`NomeFantasia`, `OldNome`, `Arquivado`, `Foto`, dados clínicos CREFITO-3), expande colunas físicas quando necessário (`insertColumnsAfter`) e cria/atualiza as abas `Evolucoes` e `Agendamentos`.
- **Importação em lote (`bulk_import` em `Code.gs` e `importBackup` em `atendimentos.html`):** Restauração rápida de backups em uma única chamada em lote incluindo `Pacientes`, `Atendimentos`, `Evolucoes` e `Agendamentos`.
- **Persistência local resiliente (`saveLocalPatientMeta`, `saveLocalEvolutions`, `saveLocalSchedules` em `atendimentos.html`):** Mantém metadados cadastrais, fotos, nome fantasia, status de arquivamento, evoluções clínicas e agendamentos sincronizados também no `localStorage` (`ft_pmeta_<id>`, `ft_archived_<id>`, `ft_avatar_<id>`, `ft_nome_fantasia_<id>`, `ft_local_evolutions`, `ft_local_schedules`).
- **Atualização automática do Link da Planilha (`SCRIPT_URL` e `init()` em `atendimentos.html`):** Configurado o link da implantação do Apps Script (`/exec`) com migração automática do `config.scriptUrl` salvo no navegador ao abrir o app.

---

## 2. Correções Gerais de Usabilidade, Layout e Navegação Mobile
- **Remoção de botões não utilizados:** Removidos os botões *"Rotinas"*, *"Exercícios"* e *"Cartilha"*.
- **Correção do autopreenchimento `"2026"` em Novo Atendimento:** Endurecida a função `parseValor()` e `loadData()` para ignorar strings de data/timestamp (`^\d{4}-\d{2}-\d{2}`) vindas da coluna `ValorPadrao`.
- **Correção da sobreposição do prefixo `R$` no campo Valor da Sessão (`v22`):** Ajustada a especificidade CSS em `.modal .money-field input` (`padding-left: 38px !important` no desktop e `34px !important` no celular) para que o `R$` nunca sobreponha o número digitado.
- **Botão "Voltar" do celular nos Modais e Configurações:**
  - Abrir qualquer modal empilha `{ modalOpen: true }` no `history`; clicar em "Voltar" no aparelho fecha apenas o modal aberto sem sair do aplicativo.
  - Abrir as Configurações (`openSettings`) empilha `{ screen: 'settings' }`; clicar em "Voltar" descarta edições não salvas, mantém as últimas configurações válidas e retorna para a tela inicial (`cancelSetup`).
- **Valores Financeiros Ocultos por Padrão (Ícone de Olho `🙈 / 👁️`):**
  - Todos os saldos e valores iniciam ocultos por padrão (`sessionStorage.getItem('show_financials') !== 'true'`).
  - Botão de exibir/ocultar valores presente na **Aba Financeiro**, no **Relatório Financeiro** e no modal **Financeiro do Paciente**, atualizando instantaneamente também os valores na **Aba Agenda**.

---

## 3. Arquitetura em 4 Abas Principais

### Aba 1 — Pacientes e Dados Cadastrais (`👥 Pacientes`)
- **Cards de Pacientes com Menu Cascata:** Busca instantânea por Nome Fantasia, Nome Completo, CPF/RG, telefone ou bairro, com botão direto para **📅 Agendar**.
- **Foto de Perfil em Miniatura (`renderPatientAvatar` / `compressPatientPhoto`):** Permite subir foto da galeria ou tirar foto com a câmera na ficha cadastral, comprimindo automaticamente para miniatura quadrada `160x160` JPEG exibida no lugar das iniciais.
- **Nome Fantasia vs. Nome Completo (`getPatientDisplayName` / `getPatientLegalName`):**
  - **Nome Fantasia:** Aparece antes do Nome Completo na ficha do paciente e é usado em **todas as visualizações internas** do aplicativo.
  - **Nome Completo:** Usado exclusivamente em **todos os documentos exportados** (PDFs de ficha cadastral, prontuários/evoluções, extratos, recibos individuais, comprovantes mensais e exportação CSV). O Nome Fantasia jamais aparece em documentos externos.
- **Ficha Cadastral e Prontuário CREFITO-3 (`openPatientForm` / `exportPatientFichaPDF`):** Campos alinhados lado a lado no celular (`40px`/`42px`), com botão **"📄 Exportar Ficha (PDF)"** para geração da ficha completa e prontuário CREFITO-3 usando exclusivamente o Nome Completo oficial.
- **Exames e Documentos (`openPatientFilesModal`):** Dois botões dedicados para anexar PDFs/imagens ou bater foto na hora (`capture="environment"`), visualizar, baixar e excluir arquivos (armazenados via `IndexedDB` `ft_docs_db`).
- **Financeiro Individual do Paciente (`openPatientFinancial` / `renderPatientFinancialDetails`):**
  - Filtro por período (*Tudo*, *Por Mês*, *Por Ano*, *Vários Meses*) e botão exibir/ocultar valores (`🙈 / 👁️`).
  - **Previsão do Paciente (`#pFinForecastBox`):** Exibe **Ganho Real (Feito)**, **Previsto (Agenda)** e **Ganho Possível**, além de listar as sessões agendadas pendentes com botão de **✓ Check-in** rápido.
- **Fluxo de Arquivamento e Aba "📁 Pacientes Arquivados" (`toggleArchivePatient` / `deletePatient`):**
  - Ao clicar em **Finalizar / Arquivar Paciente**, todos os dados são mantidos intactos e o card é movido para a seção **"📁 Pacientes Arquivados"** no final da página.
  - Pacientes ativos não podem ser excluídos diretamente; a **Exclusão Definitiva** só é permitida após o paciente estar arquivado e exige confirmação explícita (`confirm(...)`).

### Aba 2 — Agenda e Integração com Google Agenda (`📅 Agenda`) (`v27–v31`)
- **Integração com Google Agenda (`DEFAULT_CALENDAR_ID = 'primary'`):**
  - Integração nativa com a agenda principal da conta ou e-mail configurável pelo profissional em **⚙️ Configurar Agenda**.
- **Agendamento Único ou Escala da Semana / Mês (`openScheduleModal` / `submitSchedule`):**
  - Permite agendar uma sessão avulsa ou gerar em lote toda a escala da semana, quinzena, mês atual ou próximo mês escolhendo os dias da semana (`Seg` a `Dom`).
  - **Destaque Visual do "Período Rápido" (`v31`):** Os botões de período rápido (*Esta Semana*, *Próximas 2 Semanas*, *Este Mês Inteiro*, *Próximo Mês*) mudam de cor (terracota com texto branco em destaque `.preset-chip.active`) ao serem selecionados ou quando as datas inicial/final correspondem ao período.
  - **Horários Diferentes por Dia da Semana + Verificação na Prévia (`v31`):** Quando 2 ou mais dias da semana são selecionados para o paciente (ex.: *Terça* e *Quinta*), exibe automaticamente o painel **⏰ Horários por Dia da Semana** permitindo definir horários distintos para cada dia (ex.: Terça às `14:00` e Quinta às `10:00`). O quadro de pré-visualização mostra o resumo da escala semanal em badges e exibe o horário exato ao lado de cada data que será criada (`Ter 03/11 (14:00), Qui 05/11 (10:00)...`), com botão para expandir todas as datas.
- **Sincronização Automática com Google Agenda (`CalendarApp` em `Code.gs`):**
  - Cria automaticamente os eventos no Google Agenda com nome do paciente, endereço, telefone e observações (`create_schedule`, `create_schedules_batch`), atualiza data/hora ao remarcar (`update_schedule`) e remove do Google Agenda ao cancelar (`delete_schedule`) ou ao excluir um paciente (`delete_patient`).
  - Inclui também atalho **"📅 Abrir no Google Agenda"** por sessão e exportação de arquivo `.ics` (**"📲 Exportar Agenda"**).
- **Prevenção de Conflitos e Vínculo Bidirecional entre Agenda, Check-ins e Lançamentos Manuais (`v28`):**
  - **No modal "Novo Atendimento / Check-in" (`openNewEntry` / `onNewEntryPatientOrDateChange`):** Detecta automaticamente se o paciente tem agendamento pendente na data escolhida (ou em datas próximas para reposição/antecipação), pré-preenche horário/valor e vincula o lançamento ao agendamento (`status = 'Realizado'`, `atendimentoId = entry.id`), além de exibir alerta amarelo caso já exista atendimento lançado no mesmo dia.
  - **No modal "Nova Evolução Clínica" (`updateNewEvoScheduleUI` / `submitNewEvolution`):** Detecta agendamento pendente na data da evolução e oferece opção pré-marcada para confirmar o Check-in e lançar no financeiro simultaneamente.
  - **No Check-in da Agenda e na geração de escala (`completeScheduleCheckin` / `submitSchedule` / `reconcileSchedulesWithEntries`):** Se já houver um atendimento lançado manualmente no mesmo dia para o paciente, vincula ao lançamento existente sem duplicar cobrança; se excluir o atendimento financeiro (`deleteEntry`), o agendamento volta para `Agendado`.

### Aba 3 — Evoluções Clínicas (`📋 Evoluções`)
- **Layout Limpo e Ordenação:** Botão **"+ Nova Evolução"**, filtros recolhidos por padrão e ordenação crescente/decrescente.
- **Histórico de Evoluções do Paciente (`openPatientEvolutions`):** Seleção individual ou **"Selecionar todas"** para exportar múltiplas evoluções em um PDF único (`exportSelectedPatientEvolutionsPDF`).

### Aba 4 — Financeiro e Previsões (`💰 Financeiro`) (`v25–v30`)
- **Painel de Previsão Mensal (`#finForecastCard` em `renderList`):**
  - Separa os KPIs principais de **Ganho Real (Sessões já realizadas: Recebido vs. A Receber)** do quadro de previsão do mês (**Ganho Real (Feito)**, **Previsto (Agendado)** e **Ganho Possível Total**), listando também as sessões agendadas do mês com botão de **✓ Check-in**.
- **Relatório Financeiro Geral Interativo (`openReports` / `renderReportBody` / `renderWorkCalendar`):**
  - **Previsão Anual/Mensal:** Quadro comparativo entre **Ganho Real (Trabalhado)**, **Previsto na Agenda (A Realizar)** e **Ganho Possível**.
  - **Gráfico de 12 Meses Empilhado:** Exibe barras com 3 camadas (*Recebido*, *A Receber já feito* e *Previsto na Agenda tracejado em azul*).
  - **Todos os Pacientes no Ranking (Interativo):** Lista 100% dos pacientes com sessões realizadas ou agendadas no período (sem limite de 6), mostrando ganho real e ganho possível; ao clicar em qualquer paciente, expande a lista de sessões realizadas e agendadas com botões diretos para editar, alternar Pago/Pendente, excluir ou fazer Check-in.
  - **Calendário Interativo de Dias Trabalhados e Agendados:** Marca dias trabalhados (`✓` verde) e dias agendados (`📅` azul); ao clicar em qualquer dia, exibe todos os pacientes atendidos e agendados naquela data com atalhos de edição e Check-in.

---

## 4. Auditoria Minuciosa de Bugs e Incongruências Back-end & Front-end (`atend-v30`)

### Back-end (`Code.gs`)
1. **Incongruência de chaves em `create_schedules_batch`:** O front-end lia `respB.eventMap` e `respB.calendarSyncedCount`, enquanto o `Code.gs` retornava apenas `result.eventIds`. Agora o `Code.gs` retorna `result.eventMap`, `result.eventIds` e `result.calendarSyncedCount` (quantidade exata de eventos criados no Google Agenda).
2. **Enriquecimento automático de dados do paciente nos eventos do Google Agenda (`enrichScheduleItemWithPatient_`):** Ao criar ou atualizar agendamentos (`createCalendarEventForSchedule_` / `updateCalendarEventForSchedule_`), o `Code.gs` agora busca automaticamente telefone, endereço completo (`Endereco, Bairro, Cidade`) e nome de exibição na aba `Pacientes` caso o payload não os envie, garantindo que o evento no Google Agenda nunca fique sem localização ou contato.
3. **Remoção em cascata de eventos do Google Agenda ao excluir paciente (`delete_patient`):** Antes de remover as linhas da aba `Agendamentos` de um paciente excluído, o `Code.gs` percorre os agendamentos do paciente e apaga os respectivos eventos no Google Agenda (`deleteCalendarEventForSchedule_`), evitando eventos órfãos na agenda.
4. **Coluna `OldNome` persistida na aba `Pacientes` (`PAC_HEADERS`) e propagação de renomeação (`updateRowsByField_`):** Adicionada a coluna `OldNome` em `PAC_HEADERS` e implementada a propagação automática em `update_patient`: quando o nome oficial do paciente é alterado, o `Code.gs` preserva o nome anterior em `OldNome` e atualiza o nome nas abas `Evolucoes` (`PacienteNome`), `Agendamentos` (`PacienteNome`) e `Atendimentos` (`Paciente`).
5. **Proteção de limites de colunas em `ensureHeaders_`:** Corrigido caso em que uma planilha com número de colunas físicas menor que `expectedHeaders.length` ou totalmente vazia (`lastRow === 0`) poderia falhar ao adicionar novas colunas; agora `ensureHeaders_` expande as colunas com `sheet.insertColumnsAfter` antes de gravar os cabeçalhos.
6. **Restauração da aba `Agendamentos` em `bulk_import`:** O endpoint `bulk_import` no `Code.gs` e a função `importBackup` no `atendimentos.html` agora incluem `body.agendamentos`, restaurando os agendamentos diretamente na planilha além do `localStorage`.

### Front-end (`atendimentos.html`)
1. **Variáveis CSS ausentes em `:root` (botão de Check-in transparente e badges):** Definidas as variáveis `--ok`, `--ok-bg`, `--err`, `--danger-bg`, `--primary-dark`, `--bg-deep`, `--ink-faint` e `--line-strong` em `:root`, corrigindo o fundo do botão **✓ Check-in** na aba Agenda (`background:var(--ok)`) e cores de badges/alertas.
2. **IDs de DOM incorretos ao atualizar modais abertos após Check-in (`completeScheduleCheckin`):** Corrigidas as referências `document.getElementById('reportBody')` para `document.getElementById('repBody')` e `document.getElementById('pFinSummary')` para `document.getElementById('pFinSessionsList')`, garantindo que o Check-in feito de dentro do Relatório Financeiro ou do Financeiro Individual do Paciente atualize a tela imediatamente.
3. **Atualização imediata da aba Agenda ao clicar no botão de privacidade (`toggleHideFinancials`):** Adicionada chamada a `renderAgendaTab()` dentro de `toggleHideFinancials()` para ocultar/exibir os valores das sessões agendadas instantaneamente.
4. **Botão e função de exportação de PDF da Ficha Cadastral / Prontuário CREFITO-3 (`exportPatientFichaPDF`):** Adicionado o botão **"📄 Exportar Ficha (PDF)"** no modal de edição do paciente (`openPatientForm`), gerando o PDF completo com dados cadastrais e prontuário CREFITO-3 utilizando exclusivamente o Nome Completo oficial (`getPatientLegalName`).
5. **Propagação em memória ao renomear paciente (`submitPatientForm`):** Quando o nome completo de um paciente é alterado, o app agora atualiza imediatamente em memória os registros vinculados em `entries`, `evolutions` e `schedules`, mantendo consistência instantânea sem exigir recarregamento.

---

## 5. Histórico Cronológico Recente e Diretriz Permanente de Salvamento
> **Diretriz Permanente:** Toda e qualquer alteração feita no código (`atendimentos.html`, `Code.gs`, `sw.js`, testes) **deve sempre** incrementar o `CACHE_VERSION` em `sw.js`, ser registrada imediatamente em `MEMORIA_ATUALIZACOES.md` (e no artefato `memoria_atualizacoes.md`) e ser sincronizada no GitHub (`scripts/sync-github.js`).

- **`atend-v25`:** Ranking completo de todos os pacientes no Relatório Financeiro com expansão clicável e edição direta de lançamentos.
- **`atend-v26`:** Calendário de dias trabalhados clicável no Relatório Financeiro para ver e editar pacientes atendidos em cada data.
- **`atend-v27`:** Criação da aba **📅 Agenda**, integração nativa com Google Agenda (`CalendarApp` em `Code.gs`), agendamento avulso ou escala semanal/mensal e Check-in com 1 toque.
- **`atend-v28`:** Prevenção de conflitos e vínculo bidirecional entre agendamentos, check-ins e lançamentos manuais, além de quadros de **Previsão Financeira (Ganho Real vs. Ganho Possível)** na aba Financeiro, no Relatório Financeiro e no Financeiro Individual do Paciente.
- **`atend-v29`:** Suporte a integração direta do Google Agenda no front-end (`DEFAULT_CALENDAR_ID`) e no back-end (`resolveUserCalendar_`).
- **`atend-v30`:** Auditoria completa Back-end & Front-end (correção de `eventMap`/`calendarSyncedCount` em lote, enriquecimento automático de endereço/telefone no Google Agenda, exclusão de eventos do Google Agenda ao excluir paciente, coluna `OldNome` e propagação de troca de nome nas abas da planilha e em memória, variáveis CSS `--ok`/`--ok-bg`/`--err`, IDs `#repBody`/`#pFinSessionsList` no Check-in, exportação de PDF da Ficha Cadastral CREFITO-3 e restauração de agendamentos no `bulk_import`).
- **`atend-v31`:** Destaque por cor nos botões de **"Período Rápido"** (`.preset-chip.active`) ao selecionar e suporte a **horários diferentes por dia da semana** (`#schedDowTimesBox`, ex.: Terça às `14:00` e Quinta às `10:00`) com verificação detalhada de cada data e horário na pré-visualização da escala.
- **`atend-v32`:** Motor Inteligente de **Rotas, Deslocamento e Consumo de Combustível** integrado à Agenda e aos Cadastros de Pacientes:
  - **Endereço Base e Consumo:** Endereço padrão base configurável, consumo do carro (km/L na cidade) e preço da gasolina, ajustáveis no modal **📅 Configurar Agenda & Rotas**.
  - **Cenário 1 — Intervalos Longos (ex: 10h → 14h):** O app calcula automaticamente o tempo de trânsito de ida e volta para a base e recomenda voltar para a base quando o tempo livre for superior a 30 minutos, exibindo o tempo líquido de descanso e o gasto de combustível (em litros e R$).
  - **Cenário 2 — Sessões Consecutivas (ex: 14h de 50 min terminando 14h50 → 15h):** Aplica a regra estrita de deslocamento de no máximo **8 a 9 minutos de carro** entre os endereços dos pacientes. Se a rota ultrapassar 8–9 minutos, gera alerta de atraso destacado com botão de 1 clique para ajustar automaticamente o horário da próxima sessão para o horário viável mais próximo.
  - **Cenário 3 — Cancelamento no Meio do Dia (ex: 14h → 15h cancelado → 16h):** O botão **✕ Cancelar Sessão** altera o status para `Cancelado` (removendo do Google Agenda e mantendo botão de reativar) e recalcula instantaneamente o dia, gerando uma comparação lado a lado entre **Ir para a Base** (tempo livre na base + consumo) e **Esperar na Rua / Ir Direto para as 16h** (tempo de espera local + consumo direto).
  - **Cenário 4 — Novos e Atuais Pacientes com Análise de Proximidade:**
    - **No Cadastro de Paciente (`openPatientForm`):** Botão **🚗 Calcular Distância e Tempo de Carro (Base & Outros Pacientes)** que exibe a distância e gasto de combustível da base até o paciente e compara com todos os outros pacientes ativos, destacando em verde aqueles a $\le 9$ min de carro (aptos para encaixe consecutivo).
    - **No Agendamento de Sessões / Escala (`openScheduleModal`):** Painel dinâmico que analisa em tempo real o paciente e o horário escolhido em relação à base e a atendimentos adjacentes do mesmo dia, alertando sobre a regra de 8–9 min ou recomendação de base/rua antes mesmo de salvar.
    - **Simulador Geral de Rotas (`openRouteSimulatorModal`):** Botão **🚗 Rotas & Distâncias** na aba Agenda para simular trajetos entre quaisquer pacientes ou a partir da base, testar cenários rápidos e ver a matriz de proximidade completa.
  - **Motor Híbrido de Rotas (Google Maps + Fallback Local):** `Code.gs` com handler `calc_routes_batch` usando `Maps.newDirectionFinder()` do Google Apps Script (direções de trânsito reais sem necessidade de chave externa de API); fallback inteligente no navegador com OSRM/Nominatim, com cache persistido em `localStorage` (`ft_route_cache_v1`).
- **`atend-v33`:** Verificação Aprofundada do Google Agenda e Auditoria Geral de Incongruências:
  - **Verificação do Vínculo com o Google Agenda:**
    - **Proteção Contra Erro de Auto-Convite (`resolveUserCalendar_` em `Code.gs`):** O `Code.gs` identifica se a conta do Apps Script executando a operação pertence ao próprio usuário. Nesse caso, `guestEmail` fica nulo e a gravação ocorre diretamente na agenda padrão, evitando a exceção do Google Agenda ao tentar convidar o próprio criador do evento. Se executado por outra conta, adiciona o e-mail como convidado para inserção automática na agenda.
    - **Correção de Timezone Explícito (`parseScheduleDates_` em `Code.gs`):** As datas/horas agora são processadas com `Utilities.parseDate(...)` considerando o fuso da planilha (`SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone()`) ou `America/Sao_Paulo`, prevenindo deslocamentos indevidos de horário no celular da usuária caso o script esteja em fuso GMT ou Nova York.
    - **Exclusão Real de Eventos Cancelados no Google Agenda:** Em `updateCalendarEventForSchedule_` (`Code.gs`) e `cancelScheduleStatus` (`atendimentos.html`), ao cancelar uma sessão o evento é removido do Google Agenda e a chave `CalendarEventId` é limpa na planilha, liberando a agenda. Ao reativar a sessão, um novo evento é criado e o novo ID é gravado.
    - **Mensagem Amigável no Teste de Conexão (`test_calendar`):** Retorna no modal se os eventos estão sendo gravados diretamente ou vinculados via convite para a agenda informada.
  - **Correção de Incongruências no Front-End (`atendimentos.html`):**
    - **Correção de Nomes de Funções (`buildGoogleMapsDirectionsUrl` vs `buildGoogleMapsDirUrl`):** Corrigida a chamada no simulador de rotas e criados aliases de compatibilidade para evitar `ReferenceError`.
    - **Criação de Aliases de Rotas e Combustível:** Implementadas as funções `formatDistanceKm`, `parseTimeMinutes`, `formatTimeMinutes`, `formatDurationHuman` e `calcFuelCost`, garantindo interoperabilidade entre modais.
    - **Conformidade RFC 5545 em Arquivos `.ics` (`exportSchedulesICS`):** Adicionada a propriedade obrigatória `DTSTAMP`, permitindo importação limpa sem avisos em qualquer calendário (iOS, Google, macOS, Windows).
  - **Testes Unitários:** 24 testes unitários automatizados passando com 100% de sucesso.



