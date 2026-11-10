/**
 * Conector entre o app de controle de atendimentos e esta planilha.
 * Cria e gerencia automaticamente as abas "Atendimentos", "Pacientes",
 * "Evolucoes", "Exercicios" e "Rotinas".
 */

var SHEET_ATEND = 'Atendimentos';
var SHEET_PAC = 'Pacientes';
var SHEET_EVO = 'Evolucoes';
var SHEET_AGEND = 'Agendamentos';
var SHEET_CONFIG = 'Configuracao';

var ATEND_HEADERS = ['ID', 'Paciente', 'Data', 'Hora', 'Valor', 'Status', 'DataPagamento', 'Latitude', 'Longitude', 'CriadoEm'];
var PAC_HEADERS = [
  'ID', 'Nome', 'Telefone', 'ValorPadrao', 'FormaPagamento', 'CriadoEm',
  'Endereco', 'Bairro', 'Cidade', 'DataNascimento', 'Contato02',
  'Documento', 'TCLE', 'Contrato', 'FrequenciaSemanal',
  'DiagClinico', 'DiagFuncional', 'Objetivos', 'Arquivado', 'Foto', 'NomeFantasia', 'OldNome'
];
var EVO_HEADERS = ['ID', 'PacienteID', 'PacienteNome', 'Data', 'Hora', 'PA', 'FC', 'EstadoClinico', 'Condutas', 'CriadoEm', 'SPO2', 'Observacoes'];
var AGEND_HEADERS = [
  'ID', 'PacienteID', 'PacienteNome', 'Data', 'Hora', 'DuracaoMin',
  'Valor', 'Status', 'Observacao', 'CalendarEventId', 'CalendarId', 'AtendimentoId', 'CriadoEm'
];
var CONFIG_HEADERS = ['Chave', 'Valor', 'AtualizadoEm'];

function ensureHeaders_(sheet, expectedHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    sheet.setFrozenRows(1);
    return;
  }
  var maxCols = sheet.getMaxColumns();
  if (maxCols < expectedHeaders.length) {
    sheet.insertColumnsAfter(maxCols, expectedHeaders.length - maxCols);
  }
  var currentHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  var matches = expectedHeaders.every(function(h, i) { return currentHeaders[i] === h; });
  if (!matches) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
  }
}

var _currentSS_ = null;
var _activeResolvedUserId_ = '';
var SHEET_USUARIOS = '_Usuarios';
var USUARIOS_HEADERS = ['UsuarioId', 'Email', 'Nome', 'Documento', 'SpreadsheetId', 'SpreadsheetUrl', 'CriadoEm', 'UltimoAcesso'];

function getActiveOrTargetSpreadsheet_() {
  if (_currentSS_) return _currentSS_;
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch(e) {
    return null;
  }
}

function resolveSpreadsheet_(usuarioId, meta) {
  _activeResolvedUserId_ = '';
  var masterSs = null;
  try { masterSs = SpreadsheetApp.getActiveSpreadsheet(); } catch(e){}
  if (!masterSs) return null;

  var email = String((meta && (meta.email || meta.calendarId)) || '').trim();
  var nome = String((meta && (meta.nome || meta.providerName)) || '').trim();
  var doc = String((meta && (meta.documento || meta.providerDoc)) || '').trim();
  var normalizedId = String(usuarioId || '').trim().toLowerCase();

  // Se usuarioId contiver @, ele é um e-mail!
  if (normalizedId.indexOf('@') > -1 && !email) {
    email = normalizedId;
  }
  if (!normalizedId && email) {
    normalizedId = email.toLowerCase();
  }

  if (!usuarioId && !email) {
    return masterSs;
  }

  try {
    var uSheet = masterSs.getSheetByName(SHEET_USUARIOS);
    if (!uSheet) {
      uSheet = masterSs.insertSheet(SHEET_USUARIOS);
      uSheet.appendRow(USUARIOS_HEADERS);
      uSheet.setFrozenRows(1);
    } else {
      ensureHeaders_(uSheet, USUARIOS_HEADERS);
    }

    var data = uSheet.getDataRange().getValues();
    var foundRowIdx = -1;
    var foundSheetId = '';

    for (var i = 1; i < data.length; i++) {
      var rowUid = String(data[i][0]).trim().toLowerCase();
      var rowEmail = String(data[i][1]).trim().toLowerCase();
      // Permite resolução segura por usuarioId ou pelo email cadastrado
      // Isso garante sincronização instantânea e perfeita entre Celular e Computador
      var targetEmail = email ? email.toLowerCase() : '';
      var matchUid = normalizedId && (rowUid === normalizedId || rowEmail === normalizedId);
      var matchEmail = targetEmail && (rowEmail === targetEmail || rowUid === targetEmail);
      if (matchUid || matchEmail) {
        foundRowIdx = i + 1;
        foundSheetId = String(data[i][4]).trim();
        _activeResolvedUserId_ = String(data[i][0]).trim();
        break;
      }
    }

    if (foundRowIdx > 0 && foundSheetId) {
      try {
        uSheet.getRange(foundRowIdx, 8).setValue(new Date());
      } catch(e){}

      try {
        return SpreadsheetApp.openById(foundSheetId);
      } catch(errOpen) {
        console.warn('Erro ao abrir planilha existente, criando nova:', errOpen);
      }
    }

    var actualId = usuarioId || ('usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7));
    _activeResolvedUserId_ = actualId;
    var title = 'FisioFlow — ' + (nome || email || actualId);
    var newSs = SpreadsheetApp.create(title);
    var newSheetId = newSs.getId();
    var newSheetUrl = newSs.getUrl();

    var prevSS = _currentSS_;
    _currentSS_ = newSs;
    getPacSheet_();
    getAtendSheet_();
    getEvoSheet_();
    getAgendSheet_();
    getExeSheet_();
    getRotSheet_();
    getConfigSheet_();
    if (meta) {
      saveConfigInSheet_({
        NomeProfissional: nome,
        Documento: doc,
        EmailGoogle: email,
        Telefone: meta.contato || meta.telefone || '',
        EnderecoBase: meta.enderecoBase || meta.homeAddress || '',
        ConsumoKmL: String(meta.carKmPerLiter || '12'),
        PrecoGasolina: String(meta.gasPrice || '5.80')
      });
    }
    _currentSS_ = prevSS;

    if (email && email.indexOf('@') > -1) {
      try {
        var file = DriveApp.getFileById(newSheetId);
        file.addEditor(email);
      } catch(shareErr) {
        console.warn('Aviso ao compartilhar planilha com ' + email + ': ' + shareErr.message);
      }
    }

    var now = new Date();
    uSheet.appendRow([actualId, email, nome, doc, newSheetId, newSheetUrl, now, now]);
    return newSs;
  } catch(errResolve) {
    console.warn('Erro ao resolver planilha do usuário, usando master:', errResolve);
    return masterSs;
  }
}

function getSheet_(name, headers) {
  var ss = getActiveOrTargetSpreadsheet_();
  if (!ss) throw new Error('Nenhuma planilha ativa disponível para a operação.');
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  } else {
    ensureHeaders_(sheet, headers);
  }
  return sheet;
}

function getAtendSheet_() { return getSheet_(SHEET_ATEND, ATEND_HEADERS); }
function getPacSheet_()   { return getSheet_(SHEET_PAC, PAC_HEADERS); }
function getEvoSheet_()   { return getSheet_(SHEET_EVO, EVO_HEADERS); }
function getAgendSheet_() { return getSheet_(SHEET_AGEND, AGEND_HEADERS); }
function getConfigSheet_() { return getSheet_(SHEET_CONFIG, CONFIG_HEADERS); }

/** Remove automaticamente da planilha abas desnecessárias (ex.: Exercícios e Rotinas) */
function cleanupUnusedSheets_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    var toDelete = ['Exercicios', 'exercicios', 'Rotinas', 'rotinas'];
    toDelete.forEach(function(sName) {
      var sh = ss.getSheetByName(sName);
      if (sh && ss.getSheets().length > 1) {
        ss.deleteSheet(sh);
      }
    });
  } catch (e) {}
}

function saveConfigInSheet_(cfg) {
  if (!cfg || typeof cfg !== 'object') return;
  var sheet = getConfigSheet_();
  var data = sheet.getDataRange().getValues();
  var existing = {};
  for (var i = 1; i < data.length; i++) {
    var k = String(data[i][0]).trim();
    if (k) existing[k] = i + 1;
  }
  var now = new Date();
  for (var key in cfg) {
    if (!cfg.hasOwnProperty(key)) continue;
    var val = String(cfg[key] !== undefined && cfg[key] !== null ? cfg[key] : '');
    if (existing[key]) {
      sheet.getRange(existing[key], 2, 1, 2).setValues([[val, now]]);
    } else {
      sheet.appendRow([key, val, now]);
      existing[key] = sheet.getLastRow();
    }
  }
}

function getConfigObject_() {
  try {
    var sheet = getConfigSheet_();
    var data = sheet.getDataRange().getValues();
    var cfg = {};
    for (var i = 1; i < data.length; i++) {
      var k = String(data[i][0]).trim();
      if (k) cfg[k] = data[i][1];
    }
    return cfg;
  } catch(e) {
    return {};
  }
}

function getTimeZone_() {
  try {
    var ss = getActiveOrTargetSpreadsheet_();
    return (ss && ss.getSpreadsheetTimeZone()) || 'America/Sao_Paulo';
  } catch(e) {
    return 'America/Sao_Paulo';
  }
}

function formatCellValue_(header, value) {
  if (Object.prototype.toString.call(value) === '[object Date]') {
    var tz = getTimeZone_();
    if (header === 'Data' || header === 'DataPagamento' || header === 'DataNascimento') {
      return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
    }
    if (header === 'Hora') {
      return Utilities.formatDate(value, tz, 'HH:mm');
    }
    return Utilities.formatDate(value, tz, "yyyy-MM-dd'T'HH:mm:ss");
  }
  return value;
}

function sheetToObjects_(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = formatCellValue_(headers[j], data[i][j]);
    }
    // Protege PrecoGasolina caso o Google Sheets tenha formatado como data
    if (obj['Chave'] === 'PrecoGasolina' && (typeof obj['Valor'] === 'string' && /^\d{4}-\d{2}-\d{2}/.test(obj['Valor']))) {
      obj['Valor'] = 6.10;
    }
    rows.push(obj);
  }
  return rows;
}

function getRowObjectById_(sheet, id) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        obj[headers[j]] = formatCellValue_(headers[j], data[i][j]);
      }
      return obj;
    }
  }
  return null;
}

function deleteRowById_(sheet, id) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var rowObj = {};
      for (var h = 0; h < headers.length; h++) {
        rowObj[headers[h]] = data[i][h];
      }
      sheet.deleteRow(i + 1);
      return rowObj;
    }
  }
  return null;
}

/** Remove TODAS as linhas cujo valor na coluna colIndex (0-based) seja igual a value. */
function deleteRowsByField_(sheet, colIndex, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIndex]) === String(value)) {
      sheet.deleteRow(i + 1);
    }
  }
}

/** Apaga todos os itens de rotina de um paciente num rótulo específico (vazio = "principal"). */
function deleteRoutineByLabel_(pacienteId, rotulo) {
  var sheet = getRotSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var cPac = headers.indexOf('PacienteID');
  var cRot = headers.indexOf('Rotulo');
  var alvo = String(rotulo || '');
  for (var i = data.length - 1; i >= 1; i--) {
    var rot = cRot > -1 ? String(data[i][cRot] || '') : '';
    if (String(data[i][cPac]) === String(pacienteId) && rot === alvo) {
      sheet.deleteRow(i + 1);
    }
  }
}

/** Renomeia o rótulo de todos os itens de um paciente que estejam no rótulo antigo. */
function renameRoutineLabel_(pacienteId, rotuloAntigo, rotuloNovo) {
  var sheet = getRotSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var cPac = headers.indexOf('PacienteID');
  var cRot = headers.indexOf('Rotulo');
  if (cRot === -1) return;
  var de = String(rotuloAntigo || '');
  for (var i = 1; i < data.length; i++) {
    var rot = String(data[i][cRot] || '');
    if (String(data[i][cPac]) === String(pacienteId) && rot === de) {
      sheet.getRange(i + 1, cRot + 1).setValue(rotuloNovo || '');
    }
  }
}

/**
 * Atualiza múltiplos campos de uma linha identificada por id em uma única operação de leitura e gravação no Sheets.
 * Reduz N leituras e N gravações a apenas 1 leitura e 1 gravação por linha.
 */
function updateRowObjectById_(sheet, id, fieldsObj) {
  if (!fieldsObj || typeof fieldsObj !== 'object') return null;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  var headers = data[0];
  var colMap = {};
  for (var c = 0; c < headers.length; c++) {
    colMap[headers[c]] = c;
  }
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var changed = false;
      for (var key in fieldsObj) {
        if (fieldsObj.hasOwnProperty(key)) {
          var colIdx = colMap[key];
          if (colIdx !== undefined && colIdx >= 0) {
            data[i][colIdx] = fieldsObj[key];
            changed = true;
          }
        }
      }
      if (changed) {
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      }
      var rowObj = {};
      for (var h = 0; h < headers.length; h++) {
        rowObj[headers[h]] = data[i][h];
      }
      return rowObj;
    }
  }
  return null;
}

function updateFieldById_(sheet, id, colName, value) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var col = headers.indexOf(colName) + 1;
  if (col === 0) return;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, col).setValue(value);
      break;
    }
  }
}

/** Atualiza todas as linhas onde matchColName == matchVal, definindo targetColName = newVal. */
function updateRowsByField_(sheet, matchColName, matchVal, targetColName, newVal) {
  if (!matchVal) return;
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  var headers = data[0];
  var cMatch = headers.indexOf(matchColName);
  var cTarget = headers.indexOf(targetColName);
  if (cMatch === -1 || cTarget === -1) return;
  var targetStr = String(matchVal).trim();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][cMatch] || '').trim() === targetStr) {
      sheet.getRange(i + 1, cTarget + 1).setValue(newVal);
    }
  }
}

function updateAtendField_(id, colName, value) {
  updateFieldById_(getAtendSheet_(), id, colName, value);
}

/* ---------- Integração Google Agenda (CalendarApp) ---------- */
/**
 * Execute esta função uma vez pelo botão "Executar" no editor do Apps Script
 * para autorizar o acesso automático ao Google Agenda (CalendarApp).
 */
function autorizarGoogleAgenda() {
  var cal = CalendarApp.getDefaultCalendar();
  Logger.log('Google Agenda autorizado com sucesso: ' + (cal ? cal.getName() : 'OK'));
}

function pad2_(n) {
  return (n < 10 ? '0' : '') + n;
}

function parseScheduleDates_(dataStr, horaStr, duracaoMin) {
  var str = String(dataStr || '').trim();
  var y, m, d;
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    var parts = str.substring(0, 10).split('-');
    y = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    d = parseInt(parts[2], 10);
  } else if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    var parts = str.substring(0, 10).split('/');
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
    y = parseInt(parts[2], 10);
  } else {
    var dParts = str.split('-');
    if (dParts.length !== 3) return null;
    y = parseInt(dParts[0], 10);
    m = parseInt(dParts[1], 10);
    d = parseInt(dParts[2], 10);
  }
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  var horaClean = String(horaStr || '').trim().toLowerCase();
  var isAllDay = !horaClean || horaClean.indexOf('dia') !== -1 || horaClean.indexOf('inteiro') !== -1 || horaClean === 'bloqueio';

  var hh = 9;
  var mm = 0;
  var dur = parseInt(duracaoMin, 10);

  if (isAllDay) {
    hh = 8;
    mm = 0;
    if (!dur || dur <= 0) dur = 720; // 08:00 às 20:00 (12 horas)
  } else {
    var hParts = horaClean.split(':');
    hh = parseInt(hParts[0] || '9', 10);
    mm = parseInt(hParts[1] || '0', 10);
    if (isNaN(hh) || isNaN(mm)) {
      hh = 8;
      mm = 0;
      if (!dur || dur <= 0) dur = 720;
    } else {
      if (!dur || dur <= 0) dur = 50;
    }
  }

  var tz = 'America/Sao_Paulo';
  try {
    var ss = getActiveOrTargetSpreadsheet_();
    if (ss && ss.getSpreadsheetTimeZone()) {
      tz = ss.getSpreadsheetTimeZone();
    }
  } catch (e) {}

  var dateFormatted = y + '-' + pad2_(m) + '-' + pad2_(d) + ' ' + pad2_(hh) + ':' + pad2_(mm) + ':00';
  var start = null;
  try {
    start = Utilities.parseDate(dateFormatted, tz, 'yyyy-MM-dd HH:mm:ss');
  } catch (e2) {}

  if (!start || isNaN(start.getTime())) {
    start = new Date(y, m - 1, d, hh, mm, 0);
  }
  if (!start || isNaN(start.getTime())) return null;

  var end = new Date(start.getTime() + dur * 60000);
  return { start: start, end: end };
}

var DEFAULT_CALENDAR_ID = 'primary';
var _resolvedCalendarCache = {};

function isForbiddenDevCalendar_(calOrEmail) {
  if (!calOrEmail) return false;
  var em = (typeof calOrEmail === 'string' ? calOrEmail : (calOrEmail.getId ? calOrEmail.getId() : '')).toLowerCase();
  return em.indexOf('matheusrodrigues1917@usp.br') !== -1 || em.indexOf('@usp.br') !== -1;
}

function getPatientCalendarColorId_(patientIdOrName) {
  var str = String(patientIdOrName || 'Paciente').trim().toLowerCase();
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String((Math.abs(hash) % 11) + 1);
}

function resolveUserCalendar_(calendarId) {
  var rawCid = String(calendarId || DEFAULT_CALENDAR_ID || '').trim();
  var cid = rawCid.toLowerCase();
  if (_resolvedCalendarCache[cid]) return _resolvedCalendarCache[cid];

  var defaultCal = null;
  try {
    var rawDef = CalendarApp.getDefaultCalendar();
    if (rawDef && !isForbiddenDevCalendar_(rawDef)) defaultCal = rawDef;
  } catch (e) {}

  var effectiveEmail = '';
  try { effectiveEmail = Session.getEffectiveUser().getEmail().toLowerCase(); } catch (e2) {}

  // Se executado pela conta de desenvolvedor da USP, proíbe gravação na conta pessoal do desenvolvedor
  if (isForbiddenDevCalendar_(effectiveEmail)) {
    defaultCal = null;
  }

  // 1. Se a conta que roda o script for a dona direta da agenda solicitada (e não for conta de desenvolvimento proibida)
  if (defaultCal && !isForbiddenDevCalendar_(defaultCal) && (defaultCal.getId().toLowerCase() === cid || (effectiveEmail && effectiveEmail === cid) || cid === 'primary')) {
    var resDirect = {
      cal: defaultCal,
      calendarId: cid || defaultCal.getId(),
      guestEmail: null,
      targetGuest: null,
      isOwner: true,
      isDirectShared: false,
      mode: 'direct_native'
    };
    _resolvedCalendarCache[cid] = resDirect;
    return resDirect;
  }

  // 2. Tenta acessar via getCalendarById
  if (cid && cid !== 'primary') {
    var targetVariants = [rawCid, cid];
    for (var vIdx = 0; vIdx < targetVariants.length; vIdx++) {
      var target = targetVariants[vIdx];
      if (isForbiddenDevCalendar_(target)) continue;
      var customCal = null;
      try {
        customCal = CalendarApp.getCalendarById(target);
      } catch (e3) {}
      if (customCal && !isForbiddenDevCalendar_(customCal)) {
        var resCustom = {
          cal: customCal,
          calendarId: target,
          guestEmail: null,
          targetGuest: null,
          isOwner: false,
          isDirectShared: true,
          mode: 'direct_shared'
        };
        _resolvedCalendarCache[cid] = resCustom;
        return resCustom;
      }
    }

    // Busca inteligente em todas as agendas acessíveis pelo usuário executor (CalendarApp.getAllCalendars)
    try {
      var allCals = CalendarApp.getAllCalendars() || [];
      for (var cIdx = 0; cIdx < allCals.length; cIdx++) {
        var c = allCals[cIdx];
        if (!c || isForbiddenDevCalendar_(c)) continue;
        var cIdLow = String(c.getId() || '').toLowerCase();
        var cNameLow = String(c.getName() || '').toLowerCase();
        if (cIdLow === cid || cNameLow === cid) {
          var resSmart = {
            cal: c,
            calendarId: c.getId(),
            guestEmail: null,
            targetGuest: null,
            isOwner: false,
            isDirectShared: true,
            mode: 'direct_shared'
          };
          _resolvedCalendarCache[cid] = resSmart;
          return resSmart;
        }
      }
    } catch (eAll) {}
  }

  // 3. Fallback: Se for a conta USP ou se defaultCal não estiver disponível, nunca grava na conta USP!
  if (isForbiddenDevCalendar_(effectiveEmail) || !defaultCal || isForbiddenDevCalendar_(defaultCal)) {
    var resBlocked = {
      cal: null,
      calendarId: cid,
      guestEmail: null,
      targetGuest: null,
      isOwner: false,
      isDirectShared: false,
      mode: 'blocked_dev_account',
      warning: 'Agenda do usuário (' + cid + ') não encontrada para gravação direta. Bloqueada gravação na conta do desenvolvedor (USP).'
    };
    _resolvedCalendarCache[cid] = resBlocked;
    return resBlocked;
  }

  var resFallback = {
    cal: defaultCal,
    calendarId: cid || (defaultCal ? defaultCal.getId() : 'primary'),
    guestEmail: (cid && cid.indexOf('@') > -1 && cid !== 'primary') ? cid : null,
    targetGuest: (cid && cid.indexOf('@') > -1 && cid !== 'primary') ? cid : null,
    isOwner: false,
    isDirectShared: false,
    mode: 'invite',
    effectiveUser: effectiveEmail
  };
  _resolvedCalendarCache[cid] = resFallback;
  return resFallback;
}

/** Preenche automaticamente endereço, telefone e NomeFantasia do paciente caso não venham no payload. */
function enrichScheduleItemWithPatient_(item) {
  if (!item) return item;
  if ((!item.endereco || !item.telefone || !item.pacienteDisplay) && item.pacienteId) {
    try {
      var pRow = getRowObjectById_(getPacSheet_(), item.pacienteId);
      if (pRow) {
        if (!item.pacienteDisplay) {
          item.pacienteDisplay = pRow.NomeFantasia || pRow.Nome || item.pacienteNome || 'Paciente';
        }
        if (!item.telefone && pRow.Telefone) {
          item.telefone = String(pRow.Telefone);
        }
        if (!item.endereco) {
          var locParts = [pRow.Endereco, pRow.Bairro, pRow.Cidade].filter(function(x) { return !!x; });
          item.endereco = locParts.join(', ');
        }
      }
    } catch (e) {}
  }
  return item;
}

function buildCalendarTitleAndDesc_(item) {
  var isBlock = item.pacienteId === '__BLOQUEIO__' || item.status === 'Ausência' || item.status === 'Férias' || item.tipo === 'Bloqueio';
  if (isBlock) {
    var bTitle = (item.pacienteNome || '🏖️ Férias');
    if (item.observacao) bTitle += ': ' + item.observacao;
    var bLines = [
      '🚫 Bloqueio de Horário / Ausência de Trabalho',
      'Tipo: ' + (item.pacienteNome || 'Férias / Ausência'),
      'Motivo: ' + (item.observacao || 'Registrado no App FisioFlow'),
      'Sincronizado automaticamente pelo FisioFlow.'
    ];
    return {
      title: bTitle,
      description: bLines.join('\n'),
      location: '',
      isBlock: true
    };
  }

  // Formato estrito: "nome do paciente" e só
  var title = item.pacienteDisplay || item.pacienteNome || 'Paciente';
  var descLines = ['Paciente: ' + (item.pacienteNome || item.pacienteDisplay || '')];
  if (item.telefone) descLines.push('Telefone: ' + item.telefone);
  if (item.observacao) descLines.push('Observações: ' + item.observacao);
  descLines.push('Sincronizado pelo App FisioFlow.');

  return {
    title: title,
    description: descLines.join('\n'),
    location: item.endereco || '',
    isBlock: false
  };
}

function createCalendarEventForSchedule_(item) {
  try {
    enrichScheduleItemWithPatient_(item);
    var dates = parseScheduleDates_(item.data, item.hora, item.duracaoMin);
    if (!dates) return { eventId: '', warning: 'Data/hora inválida para o Google Agenda.' };
    var resolved = resolveUserCalendar_(item.calendarId);
    if (!resolved.cal || isForbiddenDevCalendar_(resolved.cal)) {
      return { eventId: '', warning: resolved.warning || 'Agenda do usuário não autorizada para escrita direta. Bloqueada gravação na conta pessoal do desenvolvedor.' };
    }

    var calData = buildCalendarTitleAndDesc_(item);

    var opts = {
      location: calData.location,
      description: calData.description,
      sendInvites: false
    };
    if (resolved.targetGuest && !resolved.isOwner && !resolved.isDirectShared) {
      opts.guests = resolved.targetGuest;
      opts.sendInvites = true;
    }

    var ev = null;
    try {
      ev = resolved.cal.createEvent(calData.title, dates.start, dates.end, opts);
    } catch (writeErr) {
      return { eventId: '', warning: 'Erro ao gravar na agenda do usuário: ' + (writeErr.message || String(writeErr)) };
    }

    if (ev) {
      if (!calData.isBlock) {
        try {
          var pKey = item.pacienteId || item.pacienteDisplay || item.pacienteNome || '';
          ev.setColor(getPatientCalendarColorId_(pKey));
        } catch (colErr) {}
        try { ev.addPopupReminder(30); } catch (remErr) {}
      }
      return { eventId: ev.getId(), warning: '' };
    }

    if (ev) {
      try { ev.addPopupReminder(30); } catch (remErr) {}
      return { eventId: ev.getId(), warning: '' };
    }
    return { eventId: '', warning: 'Não foi possível gerar evento no Google Agenda.' };
  } catch (err) {
    return { eventId: '', warning: err.message || String(err) };
  }
}

function updateCalendarEventForSchedule_(item) {
  try {
    enrichScheduleItemWithPatient_(item);
    if (item.status === 'Cancelado') {
      if (item.calendarEventId) {
        deleteCalendarEventForSchedule_(item.calendarEventId, item.calendarId);
      }
      return { eventId: '', warning: '' };
    }
    if (!item.calendarEventId) {
      return createCalendarEventForSchedule_(item);
    }
    var dates = parseScheduleDates_(item.data, item.hora, item.duracaoMin);
    if (!dates) return { eventId: item.calendarEventId, warning: '' };
    var resolved = resolveUserCalendar_(item.calendarId);
    var ev = null;
    if (resolved.cal) {
      try { ev = resolved.cal.getEventById(item.calendarEventId); } catch (e) {}
    }
    if (!ev && !isForbiddenDevCalendar_(CalendarApp.getDefaultCalendar())) {
      try { ev = CalendarApp.getDefaultCalendar().getEventById(item.calendarEventId); } catch (e2) {}
    }
    if (!ev) {
      return createCalendarEventForSchedule_(item);
    }

    var calData = buildCalendarTitleAndDesc_(item);

    ev.setTitle(calData.title);
    ev.setTime(dates.start, dates.end);
    if (item.endereco !== undefined) ev.setLocation(calData.location);
    ev.setDescription(calData.description);
    if (!calData.isBlock) {
      try {
        var pKey = item.pacienteId || item.pacienteDisplay || item.pacienteNome || '';
        ev.setColor(getPatientCalendarColorId_(pKey));
      } catch (colErr) {}
    }
    return { eventId: ev.getId(), warning: '' };
  } catch (err) {
    return { eventId: item.calendarEventId || '', warning: err.message || String(err) };
  }
}

function deleteCalendarEventForSchedule_(eventId, calendarId) {
  if (!eventId) return;
  try {
    var resolved = resolveUserCalendar_(calendarId);
    var ev = null;
    if (resolved.cal) {
      try { ev = resolved.cal.getEventById(eventId); } catch (e) {}
    }
    if (!ev && !isForbiddenDevCalendar_(CalendarApp.getDefaultCalendar())) {
      try { ev = CalendarApp.getDefaultCalendar().getEventById(eventId); } catch (e2) {}
    }
    if (ev) ev.deleteEvent();
  } catch (err) {}
}

var NON_PATIENT_NAMES_ = ['agachamento', 'flexao', 'prancha', 'exercicio', 'rotina', 'alongamento', '__bloqueio__', 'bloqueio', 'ausencia', 'ferias'];

function isInvalidPatientName_(name) {
  if (!name) return true;
  var n = String(name).trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (!n) return true;
  for (var i = 0; i < NON_PATIENT_NAMES_.length; i++) {
    if (n === NON_PATIENT_NAMES_[i] || n.indexOf(NON_PATIENT_NAMES_[i]) === 0) return true;
  }
  return false;
}

/** Nome Fantasia é opcional: vazio é aceito; só é rejeitado se preenchido com termo reservado. */
function isInvalidOptionalName_(name) {
  return !!String(name || '').trim() && isInvalidPatientName_(name);
}
/** Normaliza nome de paciente para comparar (sem acento, minúsculo, espaços simples). */
function normPatientName_(name) {
  return String(name || '').trim().toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Procura um lançamento já existente para a mesma paciente + data + horário.
 *  Devolve o ID encontrado ou '' — usado para impedir duplicidade de sessão. */
function findSessionEntryId_(sheet, pacienteNome, data, hora) {
  var target = normPatientName_(pacienteNome);
  if (!target || !data || !hora) return '';
  var rows = sheetToObjects_(sheet);
  var hhmm = String(hora).slice(0, 5);
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!row || !row.ID) continue;
    if (normPatientName_(row.Paciente) !== target) continue;
    if (String(row.Data) !== String(data)) continue;
    if (String(row.Hora).slice(0, 5) !== hhmm) continue;
    return String(row.ID);
  }
  return '';
}

function formatIcsDateTime_(isoDate, timeStr) {
  var str = String(isoDate || '').trim();
  var d = '';
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    d = str.substring(0, 10).replace(/-/g, '');
  } else if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    var p = str.substring(0, 10).split('/');
    d = p[2] + p[1] + p[0];
  } else {
    var clean = str.replace(/[^0-9]/g, '');
    d = clean.substring(0, 8);
  }
  var tParts = String(timeStr || '14:00').split(':');
  var hh = pad2_(parseInt(tParts[0], 10) || 14);
  var mm = pad2_(parseInt(tParts[1], 10) || 0);
  return d + 'T' + hh + mm + '00';
}

function buildIcsFeed_(items, usuarioId) {
  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FisioFlow//Agendamentos//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Fisioflow',
    'NAME:Fisioflow',
    'X-WR-CALDESC:Atendimentos Fisioflow',
    'X-WR-TIMEZONE:America/Sao_Paulo'
  ];
  var nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  (items || []).forEach(function(it) {
    if (!it || !it.Data) return;
    var hora = it.Hora || '14:00';
    var dur = parseInt(it.DuracaoMin, 10) || 50;
    var dates = parseScheduleDates_(it.Data, hora, dur);
    if (!dates) return;

    var dtStart = formatIcsDateTime_(it.Data, hora);
    var endH = pad2_(dates.end.getHours());
    var endM = pad2_(dates.end.getMinutes());
    var endY = dates.end.getFullYear();
    var endMo = pad2_(dates.end.getMonth() + 1);
    var endD = pad2_(dates.end.getDate());
    var dtEnd = '' + endY + endMo + endD + 'T' + endH + endM + '00';

    var isBlock = it.PacienteID === '__BLOQUEIO__' || it.Status === 'Ausência' || it.Status === 'Férias' || it.Tipo === 'Bloqueio';
    var title = isBlock ? ('🏖️ ' + (it.PacienteNome || 'Férias / Ausência')) : (it.PacienteNome || 'Paciente');
    var summary = title.replace(/[\r\n]+/g, ' ');
    var descLines = [];
    if (it.Observacao) descLines.push('Obs: ' + it.Observacao);
    if (it.Telefone) descLines.push('Telefone: ' + it.Telefone);
    if (it.Valor) descLines.push('Valor: R$ ' + it.Valor);
    descLines.push('Sincronizado automaticamente pelo FisioFlow.');

    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + (it.ID || ('ag_' + Date.now())) + '@fisioflow');
    lines.push('DTSTAMP:' + nowIso);
    lines.push('DTSTART:' + dtStart);
    lines.push('DTEND:' + dtEnd);
    lines.push('SUMMARY:' + summary);
    if (it.Endereco) {
      lines.push('LOCATION:' + String(it.Endereco).replace(/[\r\n]+/g, ', '));
    }
    lines.push('DESCRIPTION:' + descLines.join('\\n'));
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'calendar_feed' || action === 'feed_ics' || action === 'ics') {
    var usuarioIdFeed = (e && e.parameter && (e.parameter.usuarioId || e.parameter.email)) || '';
    var emailFeed = (e && e.parameter && (e.parameter.email || e.parameter.calendarId)) || '';
    var metaFeed = (e && e.parameter) || {};
    if (!metaFeed.email && emailFeed) metaFeed.email = emailFeed;
    if (!metaFeed.email && usuarioIdFeed.indexOf('@') > -1) metaFeed.email = usuarioIdFeed;
    var feedSs = resolveSpreadsheet_(usuarioIdFeed, metaFeed);
    _currentSS_ = feedSs;
    var rawAgendFeed = sheetToObjects_(getAgendSheet_());
    var activeAgendFeed = rawAgendFeed.filter(function(a){
      return a && a.ID && a.Data && a.Status !== 'Cancelado';
    });
    var icsFeed = buildIcsFeed_(activeAgendFeed, usuarioIdFeed);
    _currentSS_ = null;
    return ContentService.createTextOutput(icsFeed)
      .setMimeType(ContentService.MimeType.ICAL);
  }

  var usuarioId = (e && e.parameter && e.parameter.usuarioId) || '';
  var targetSs = resolveSpreadsheet_(usuarioId, (e && e.parameter) || {});
  _currentSS_ = targetSs;

  cleanupUnusedSheets_();

  var rawPac = sheetToObjects_(getPacSheet_());
  var cleanPac = rawPac.filter(function(p){
    return !isInvalidPatientName_(p.Nome) && !isInvalidOptionalName_(p.NomeFantasia);
  });

  var rawAgend = sheetToObjects_(getAgendSheet_());
  var cleanAgend = rawAgend.filter(function(a){
    return a && a.ID && a.Data;
  });

  var result = {
    success: true,
    usuarioId: _activeResolvedUserId_ || usuarioId,
    spreadsheetUrl: targetSs ? targetSs.getUrl() : '',
    configuracao: getConfigObject_(),
    atendimentos: sheetToObjects_(getAtendSheet_()),
    pacientes: cleanPac,
    evolucoes: sheetToObjects_(getEvoSheet_()),
    exercicios: [],
    rotinas: [],
    agendamentos: cleanAgend
  };
  _currentSS_ = null;
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var result = { success: true, action: 'unknown', handled: true };
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (parseErr) {
    result.success = false;
    result.error = 'Payload JSON inválido: ' + parseErr.message;
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  result.action = body.action || 'create';

  /* ---------- Ações de leitura / cálculo externo (executam sem lock de escrita na planilha) ---------- */
  if (body.action === 'calc_routes_batch') {
    var pairs = Array.isArray(body.pairs) ? body.pairs : [];
    var routesOut = {};
    for (var rIdx = 0; rIdx < pairs.length; rIdx++) {
      var pair = pairs[rIdx];
      if (!pair || !pair.key || !pair.origin || !pair.destination) continue;
      try {
        var finder = Maps.newDirectionFinder()
          .setLanguage('pt-BR')
          .setOrigin(String(pair.origin))
          .setDestination(String(pair.destination))
          .setMode(Maps.DirectionFinder.Mode.DRIVING);
        var dirs = finder.getDirections();
        if (dirs && dirs.routes && dirs.routes.length > 0 && dirs.routes[0].legs && dirs.routes[0].legs.length > 0) {
          var leg = dirs.routes[0].legs[0];
          var distMeters = (leg.distance && typeof leg.distance.value === 'number') ? leg.distance.value : 0;
          var durSeconds = (leg.duration && typeof leg.duration.value === 'number') ? leg.duration.value : 0;
          routesOut[pair.key] = {
            ok: true,
            distanceKm: Math.round((distMeters / 1000) * 10) / 10,
            durationMin: Math.max(1, Math.round(durSeconds / 60)),
            distanceText: (leg.distance && leg.distance.text) || '',
            durationText: (leg.duration && leg.duration.text) || '',
            startAddress: leg.start_address || pair.origin,
            endAddress: leg.end_address || pair.destination
          };
        } else {
          routesOut[pair.key] = { ok: false, error: 'Rota não encontrada' };
        }
      } catch (mapErr) {
        routesOut[pair.key] = { ok: false, error: mapErr.message || String(mapErr) };
      }
    }
    result.routes = routesOut;
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (body.action === 'test_calendar') {
    var resolvedTest = resolveUserCalendar_(body.calendarId);
    if (!resolvedTest.cal) {
      result.success = false;
      result.error = 'Não foi possível acessar o Google Agenda. Autorize o CalendarApp no editor do Apps Script executando a função autorizarGoogleAgenda.';
    } else {
      var effectiveEmail = '';
      try { effectiveEmail = Session.getEffectiveUser().getEmail(); } catch (eEff) {}
      result.calendarName = resolvedTest.cal.getName();
      result.mode = resolvedTest.mode;
      result.calendarId = resolvedTest.calendarId;
      result.effectiveUser = effectiveEmail;
      result.isDirectShared = !!resolvedTest.isDirectShared;
      result.isOwner = !!resolvedTest.isOwner;
      result.sendInvites = (resolvedTest.mode === 'invite');

      if (resolvedTest.mode === 'direct_native') {
        result.message = 'Conectado nativamente à sua conta Google (' + (resolvedTest.cal.getName() || resolvedTest.calendarId) + '). Agendamentos e alterações são gravados instantaneamente na sua Google Agenda.';
      } else if (resolvedTest.mode === 'direct_shared') {
        result.message = 'Conectado com sucesso à agenda compartilhada "' + (resolvedTest.cal.getName() || resolvedTest.calendarId) + '". Gravação e atualização 100% automáticas e diretas.';
      } else {
        result.message = 'Aviso: A agenda ' + (body.calendarId || 'Gmail') + ' ainda não está compartilhada para gravação direta com a conta do servidor (' + effectiveEmail + ').';
      }
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /* ---------- Ações com escrita na planilha (usam ScriptLock) ---------- */
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    lockAcquired = lock.tryLock(20000);
    if (!lockAcquired) {
      result.success = false;
      result.error = 'O servidor da planilha está ocupado. Tente novamente em instantes.';
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var usuarioId = body.usuarioId || body.email || '';
    var targetSs = resolveSpreadsheet_(usuarioId, body);
    _currentSS_ = targetSs;
    if (_currentSS_) {
      result.spreadsheetUrl = _currentSS_.getUrl();
    }

    /* ---------- Registro Automático de Novo Usuário (Multi-Tenant) ---------- */
    if (body.action === 'register_user') {
      result.usuarioId = _activeResolvedUserId_ || usuarioId;
      result.spreadsheetId = _currentSS_ ? _currentSS_.getId() : '';
      result.spreadsheetUrl = _currentSS_ ? _currentSS_.getUrl() : '';
      saveConfigInSheet_({
        NomeProfissional: body.nome || '',
        Documento: body.documento || '',
        EmailGoogle: body.email || '',
        Telefone: body.contato || body.telefone || '',
        EnderecoBase: body.enderecoBase || body.homeAddress || '',
        ConsumoKmL: String(body.carKmPerLiter || '12'),
        PrecoGasolina: String(body.gasPrice || '5.80')
      });
      result.config = getConfigObject_();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    /* ---------- Salvar Configurações na Planilha ---------- */
    if (body.action === 'save_config') {
      saveConfigInSheet_(body.config || body);
      result.config = getConfigObject_();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }

    /* ---------- Atendimentos ---------- */
    if (body.action === 'delete') {
      deleteRowById_(getAtendSheet_(), body.id);

    } else if (body.action === 'update_status') {
      updateRowObjectById_(getAtendSheet_(), body.id, {
        Status: body.status,
        DataPagamento: body.paymentDate || ''
      });

    } else if (body.action === 'update') {
      var atendFields = {};
      if (body.nome !== undefined) atendFields['Paciente'] = body.nome;
      if (body.data !== undefined) atendFields['Data'] = body.data;
      if (body.hora !== undefined) atendFields['Hora'] = body.hora;
      if (body.valor !== undefined) atendFields['Valor'] = body.valor;
      if (body.status !== undefined) atendFields['Status'] = body.status;
      if (body.paymentDate !== undefined) atendFields['DataPagamento'] = body.paymentDate;
      updateRowObjectById_(getAtendSheet_(), body.id, atendFields);

    /* ---------- Pacientes ---------- */
    } else if (body.action === 'create_patient') {
      if (body.item && typeof body.item === 'object') {
        Object.assign(body, body.item);
      }
      if (isInvalidPatientName_(body.nome) || isInvalidOptionalName_(body.nomeFantasia)) {
        result.success = false;
        result.error = 'Nome de paciente inválido: não é permitido cadastrar exercícios como pacientes.';
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
      }
      getPacSheet_().appendRow([
        body.id,
        body.nome,
        body.telefone || '',
        body.valorPadrao || '',
        body.formaPagamento || '',
        new Date().toISOString(),
        body.endereco || '',
        body.bairro || '',
        body.cidade || '',
        body.dataNascimento || '',
        body.contato02 || '',
        body.documento || '',
        body.tcle || '',
        body.contrato || '',
        body.frequenciaSemanal || '',
        body.diagClinico || '',
        body.diagFuncional || '',
        body.objetivos || '',
        body.arquivado || 'Não',
        body.foto || '',
        body.nomeFantasia || '',
        body.oldNome || ''
      ]);

    } else if (body.action === 'update_patient') {
      if (body.item && typeof body.item === 'object') {
        Object.assign(body, body.item);
      }
      if ((body.nome !== undefined && isInvalidPatientName_(body.nome)) ||
          (body.nomeFantasia !== undefined && isInvalidOptionalName_(body.nomeFantasia))) {
        result.success = false;
        result.error = 'Nome de paciente inválido.';
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
      }
      var pacSheet = getPacSheet_();
      var existingPac = getRowObjectById_(pacSheet, body.id) || {};
      var oldNomeRef = body.oldNome || existingPac.Nome || '';

      var pacFields = {};
      var pacMap = {
        nome: 'Nome',
        nomeFantasia: 'NomeFantasia',
        oldNome: 'OldNome',
        telefone: 'Telefone',
        valorPadrao: 'ValorPadrao',
        formaPagamento: 'FormaPagamento',
        endereco: 'Endereco',
        bairro: 'Bairro',
        cidade: 'Cidade',
        dataNascimento: 'DataNascimento',
        contato02: 'Contato02',
        documento: 'Documento',
        tcle: 'TCLE',
        contrato: 'Contrato',
        frequenciaSemanal: 'FrequenciaSemanal',
        diagClinico: 'DiagClinico',
        diagFuncional: 'DiagFuncional',
        objetivos: 'Objetivos',
        arquivado: 'Arquivado',
        foto: 'Foto'
      };
      for (var fKey in pacMap) {
        if (body[fKey] !== undefined) {
          pacFields[pacMap[fKey]] = body[fKey];
        }
      }
      updateRowObjectById_(pacSheet, body.id, pacFields);

      // Se o nome completo foi alterado, propaga para Evolucoes, Agendamentos e Atendimentos
      if (body.nome && oldNomeRef && body.nome !== oldNomeRef) {
        updateRowsByField_(getEvoSheet_(), 'PacienteID', body.id, 'PacienteNome', body.nome);
        updateRowsByField_(getAgendSheet_(), 'PacienteID', body.id, 'PacienteNome', body.nome);
        updateRowsByField_(getAtendSheet_(), 'Paciente', oldNomeRef, 'Paciente', body.nome);
      }

    } else if (body.action === 'delete_patient') {
      // Antes de apagar os agendamentos da planilha, remove os eventos correspondentes do Google Agenda
      try {
        var allAgends = sheetToObjects_(getAgendSheet_());
        for (var aIdx = 0; aIdx < allAgends.length; aIdx++) {
          var agItem = allAgends[aIdx];
          if (String(agItem.PacienteID) === String(body.id) && agItem.CalendarEventId) {
            deleteCalendarEventForSchedule_(agItem.CalendarEventId, agItem.CalendarId || DEFAULT_CALENDAR_ID);
          }
        }
      } catch (calCleanErr) {}

      deleteRowById_(getPacSheet_(), body.id);
      // Remove em cascata evoluções e agendamentos vinculados ao paciente (coluna PacienteID = índice 1)
      deleteRowsByField_(getEvoSheet_(), 1, body.id);
      deleteRowsByField_(getAgendSheet_(), 1, body.id);

    /* ---------- Agendamentos & Google Agenda (CalendarApp) ---------- */
    } else if (body.action === 'create_schedule') {
      if (body.item && typeof body.item === 'object') {
        Object.assign(body, body.item);
      }
      if (!body.id || !body.data) {
        result.success = false;
        result.error = 'ID e Data são obrigatórios para agendamento.';
        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
      }
      var calRes;
      if (body.calendarEventId) {
        calRes = updateCalendarEventForSchedule_(body);
      } else {
        calRes = createCalendarEventForSchedule_(body);
      }
      var evId = (calRes && calRes.eventId) || body.calendarEventId || '';
      var sAgSingle = getAgendSheet_();
      var existingSingle = getRowObjectById_(sAgSingle, body.id);
      if (existingSingle) {
        var updObj = {
          Data: body.data,
          Hora: body.hora,
          DuracaoMin: body.duracaoMin || 50,
          Status: body.status || 'Agendado',
          Observacao: body.observacao || '',
          CalendarId: body.calendarId || DEFAULT_CALENDAR_ID || 'primary'
        };
        if (evId) updObj.CalendarEventId = evId;
        updateRowObjectById_(sAgSingle, body.id, updObj);
      } else {
        sAgSingle.appendRow([
          body.id,
          body.pacienteId || '',
          body.pacienteNome || '',
          body.data || '',
          body.hora || '',
          body.duracaoMin || 50,
          body.valor !== undefined ? body.valor : '',
          body.status || 'Agendado',
          body.observacao || '',
          evId,
          body.calendarId || DEFAULT_CALENDAR_ID || 'primary',
          body.atendimentoId || '',
          new Date().toISOString()
        ]);
      }
      result.calendarEventId = evId;
      result.eventId = evId;
      if (calRes && calRes.warning) result.calendarWarning = calRes.warning;

    } else if (body.action === 'create_schedules_batch' || body.action === 'sync_schedules') {
      var items = Array.isArray(body.items) ? body.items : [];
      var sAg = getAgendSheet_();
      var existingRows = sheetToObjects_(sAg);
      var existingMap = {};
      existingRows.forEach(function(r) { if (r.ID) existingMap[String(r.ID)] = true; });

      var nowBatch = new Date().toISOString();
      var eventIds = {};
      var syncedCount = 0;
      var warnings = [];
      var rowsToAdd = [];

      items.forEach(function(it) {
        if (!it.calendarId && body.calendarId) it.calendarId = body.calendarId;
        var cRes;
        if (it.calendarEventId) {
          cRes = updateCalendarEventForSchedule_(it);
        } else {
          cRes = createCalendarEventForSchedule_(it);
        }
        var cId = (cRes && cRes.eventId) || it.calendarEventId || '';
        eventIds[it.id] = cId;
        if (cId) syncedCount++;
        if (cRes && cRes.warning && warnings.indexOf(cRes.warning) === -1) warnings.push(cRes.warning);

        if (existingMap[String(it.id)]) {
          var updFields = {};
          if (cId) updFields['CalendarEventId'] = cId;
          if (it.data) updFields['Data'] = it.data;
          if (it.hora) updFields['Hora'] = it.hora;
          if (it.status) updFields['Status'] = it.status;
          if (it.duracaoMin) updFields['DuracaoMin'] = it.duracaoMin;
          if (it.observacao !== undefined) updFields['Observacao'] = it.observacao;
          if (it.valor !== undefined) updFields['Valor'] = it.valor;
          updateRowObjectById_(sAg, it.id, updFields);
        } else {
          rowsToAdd.push([
            it.id,
            it.pacienteId || '',
            it.pacienteNome || '',
            it.data || '',
            it.hora || '',
            it.duracaoMin || 50,
            it.valor !== undefined ? it.valor : '',
            it.status || 'Agendado',
            it.observacao || '',
            cId,
            it.calendarId || DEFAULT_CALENDAR_ID || 'primary',
            it.atendimentoId || '',
            nowBatch
          ]);
        }
      });
      if (rowsToAdd.length > 0) {
        sAg.getRange(sAg.getLastRow() + 1, 1, rowsToAdd.length, AGEND_HEADERS.length).setValues(rowsToAdd);
      }
      result.eventIds = eventIds;
      result.eventMap = eventIds;
      result.calendarSyncedCount = syncedCount;
      if (warnings.length > 0) result.calendarWarning = warnings.join('; ');

    } else if (body.action === 'update_schedule') {
      if (body.item && typeof body.item === 'object') {
        Object.assign(body, body.item);
      }
      var sAgUpd = getAgendSheet_();
      var existingRow = getRowObjectById_(sAgUpd, body.id) || {};
      var agendFields = {};
      if (body.pacienteId !== undefined) agendFields['PacienteID'] = body.pacienteId;
      if (body.pacienteNome !== undefined) agendFields['PacienteNome'] = body.pacienteNome;
      if (body.data !== undefined) agendFields['Data'] = body.data;
      if (body.hora !== undefined) agendFields['Hora'] = body.hora;
      if (body.duracaoMin !== undefined) agendFields['DuracaoMin'] = body.duracaoMin;
      if (body.valor !== undefined) agendFields['Valor'] = body.valor;
      if (body.status !== undefined) agendFields['Status'] = body.status;
      if (body.observacao !== undefined) agendFields['Observacao'] = body.observacao;
      if (body.atendimentoId !== undefined) agendFields['AtendimentoId'] = body.atendimentoId;
      if (body.calendarId !== undefined) agendFields['CalendarId'] = body.calendarId;

      var mergedItem = {
        id: body.id,
        pacienteId: body.pacienteId !== undefined ? body.pacienteId : existingRow.PacienteID,
        pacienteNome: body.pacienteNome !== undefined ? body.pacienteNome : existingRow.PacienteNome,
        pacienteDisplay: body.pacienteDisplay || body.pacienteNome || existingRow.PacienteNome,
        data: body.data !== undefined ? body.data : existingRow.Data,
        hora: body.hora !== undefined ? body.hora : existingRow.Hora,
        duracaoMin: body.duracaoMin !== undefined ? body.duracaoMin : existingRow.DuracaoMin,
        status: body.status !== undefined ? body.status : existingRow.Status,
        observacao: body.observacao !== undefined ? body.observacao : existingRow.Observacao,
        endereco: body.endereco || '',
        telefone: body.telefone || '',
        calendarEventId: body.calendarEventId || existingRow.CalendarEventId || '',
        calendarId: body.calendarId || existingRow.CalendarId || DEFAULT_CALENDAR_ID || 'primary'
      };
      var updCal = updateCalendarEventForSchedule_(mergedItem);
      if (updCal.eventId !== undefined && updCal.eventId !== existingRow.CalendarEventId) {
        agendFields['CalendarEventId'] = updCal.eventId || '';
      }
      updateRowObjectById_(sAgUpd, body.id, agendFields);
      result.calendarEventId = updCal.eventId || '';
      if (updCal.warning) result.calendarWarning = updCal.warning;

    } else if (body.action === 'delete_schedule') {
      if (body.item && typeof body.item === 'object') {
        Object.assign(body, body.item);
      }
      var sAgDel = getAgendSheet_();
      var deletedRow = deleteRowById_(sAgDel, body.id);
      var evIdToDel = body.calendarEventId || (deletedRow && deletedRow.CalendarEventId) || '';
      var calIdToDel = body.calendarId || (deletedRow && deletedRow.CalendarId) || DEFAULT_CALENDAR_ID || 'primary';
      if (evIdToDel) {
        deleteCalendarEventForSchedule_(evIdToDel, calIdToDel);
      }

    /* ---------- Evoluções Clínicas ---------- */
    } else if (body.action === 'create_evolution') {
      getEvoSheet_().appendRow([
        body.id,
        body.pacienteId || '',
        body.pacienteNome || '',
        body.data || '',
        body.hora || '',
        body.pa || '',
        body.fc || '',
        body.estadoClinico || '',
        body.condutas || '',
        new Date().toISOString(),
        body.spo2 || '',
        body.observacoes || ''
      ]);

    } else if (body.action === 'update_evolution') {
      var sEvo = getEvoSheet_();
      var evoFields = {};
      if (body.data !== undefined) evoFields['Data'] = body.data;
      if (body.hora !== undefined) evoFields['Hora'] = body.hora;
      if (body.pa !== undefined) evoFields['PA'] = body.pa;
      if (body.fc !== undefined) evoFields['FC'] = body.fc;
      if (body.estadoClinico !== undefined) evoFields['EstadoClinico'] = body.estadoClinico;
      if (body.condutas !== undefined) evoFields['Condutas'] = body.condutas;
      if (body.spo2 !== undefined) evoFields['SPO2'] = body.spo2;
      if (body.observacoes !== undefined) evoFields['Observacoes'] = body.observacoes;
      updateRowObjectById_(sEvo, body.id, evoFields);

    } else if (body.action === 'delete_evolution') {
      deleteRowById_(getEvoSheet_(), body.id);

    /* ---------- Exercícios & Rotinas (Descontinuados - No-op para compatibilidade) ---------- */
    } else if (body.action === 'create_exercise' || body.action === 'update_exercise' || body.action === 'delete_exercise' ||
               body.action === 'create_routine_item' || body.action === 'update_routine_item' || body.action === 'delete_routine_item' ||
               body.action === 'rename_routine' || body.action === 'clear_routine') {
      result.handled = true;
      result.warning = 'Exercícios e Rotinas foram removidos desta versão.';

    } else if (!body.action || body.action === 'create') {
      var sAtendCreate = getAtendSheet_();
      var existingById = body.id ? getRowObjectById_(sAtendCreate, body.id) : null;

      if (existingById) {
        // Reenvio do mesmo ID (retentativa/duplo toque): não grava de novo.
        result.success = true;
        result.duplicate = true;
        result.entryId = String(body.id);
      } else {
        // Mesma paciente + mesma data + mesmo horário = mesma sessão.
        // Se já existe (ex.: check-in feito em outro aparelho), devolve o ID existente
        // para o app apenas vincular o agendamento, sem criar cobrança repetida.
        var existingSessionId = findSessionEntryId_(sAtendCreate, body.nome, body.data, body.hora);
        if (existingSessionId) {
          result.success = true;
          result.duplicateOf = existingSessionId;
          result.entryId = existingSessionId;
        } else {
          sAtendCreate.appendRow([
            body.id,
            body.nome,
            body.data,
            body.hora || '',
            body.valor,
            body.status || 'Pendente',
            body.paymentDate || '',
            body.lat || '',
            body.lng || '',
            new Date().toISOString()
          ]);
          result.entryId = body.id;
        }
      }

    } else if (body.action === 'bulk_import') {
      var nowIso = new Date().toISOString();

      // 1. Pacientes
      if (Array.isArray(body.pacientes) && body.pacientes.length > 0) {
        var pRows = body.pacientes.map(function(p) {
          return [
            p.id,
            p.nome,
            p.telefone || '',
            p.valorPadrao || '',
            p.formaPagamento || '',
            p.criadoEm || nowIso,
            p.endereco || '',
            p.bairro || '',
            p.cidade || '',
            p.dataNascimento || '',
            p.contato02 || '',
            p.documento || '',
            p.tcle || '',
            p.contrato || '',
            p.frequenciaSemanal || '',
            p.diagClinico || '',
            p.diagFuncional || '',
            p.objetivos || '',
            p.arquivado || 'Não',
            p.foto || '',
            p.nomeFantasia || '',
            p.oldNome || ''
          ];
        });
        var sP = getPacSheet_();
        sP.getRange(sP.getLastRow() + 1, 1, pRows.length, PAC_HEADERS.length).setValues(pRows);
      }

      // 2. Atendimentos
      if (Array.isArray(body.atendimentos) && body.atendimentos.length > 0) {
        var aRows = body.atendimentos.map(function(a) {
          return [a.id, a.nome, a.data, a.hora || '', a.valor, a.status || 'Pendente', a.paymentDate || '', a.lat || '', a.lng || '', a.criadoEm || nowIso];
        });
        var sA = getAtendSheet_();
        sA.getRange(sA.getLastRow() + 1, 1, aRows.length, ATEND_HEADERS.length).setValues(aRows);
      }

      // 3. Evoluções
      if (Array.isArray(body.evolucoes) && body.evolucoes.length > 0) {
        var evoRows = body.evolucoes.map(function(ev) {
          return [
            ev.id,
            ev.pacienteId || '',
            ev.pacienteNome || '',
            ev.data || '',
            ev.hora || '',
            ev.pa || '',
            ev.fc || '',
            ev.estadoClinico || '',
            ev.condutas || '',
            ev.criadoEm || nowIso,
            ev.spo2 || '',
            ev.observacoes || ''
          ];
        });
        var sEvoSheet = getEvoSheet_();
        sEvoSheet.getRange(sEvoSheet.getLastRow() + 1, 1, evoRows.length, EVO_HEADERS.length).setValues(evoRows);
      }

      // 4. Agendamentos
      if (Array.isArray(body.agendamentos) && body.agendamentos.length > 0) {
        var agRows = body.agendamentos.map(function(ag) {
          return [
            ag.id,
            ag.pacienteId || '',
            ag.pacienteNome || '',
            ag.data || '',
            ag.hora || '',
            ag.duracaoMin || 50,
            ag.valor !== undefined ? ag.valor : '',
            ag.status || 'Agendado',
            ag.observacao || '',
            ag.calendarEventId || '',
            ag.calendarId || DEFAULT_CALENDAR_ID || 'primary',
            ag.atendimentoId || '',
            ag.criadoEm || nowIso
          ];
        });
        var sAgSheet = getAgendSheet_();
        sAgSheet.getRange(sAgSheet.getLastRow() + 1, 1, agRows.length, AGEND_HEADERS.length).setValues(agRows);
      }

      result.importedCounts = {
        pacientes: (body.pacientes || []).length,
        atendimentos: (body.atendimentos || []).length,
        evolucoes: (body.evolucoes || []).length,
        agendamentos: (body.agendamentos || []).length,
        exercicios: 0,
        rotinas: 0
      };

    } else {
      result.success = false;
      result.handled = false;
      result.error = 'Ação não reconhecida pelo script: ' + body.action +
        '. Publique a versão mais recente do Code.gs (Nova versão) no Apps Script.';
    }

  } catch (err) {
    result.success = false;
    result.error = 'Exceção interna no script: ' + (err.message || String(err));
  } finally {
    _currentSS_ = null;
    if (lockAcquired) {
      lock.releaseLock();
    }
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
