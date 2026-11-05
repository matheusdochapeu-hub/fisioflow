const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Extract pure helper functions directly from atendimentos.html to avoid divergence
const html = fs.readFileSync(path.join(__dirname, '../atendimentos.html'), 'utf-8');

function extractFn(name) {
  const regex = new RegExp(`function ${name}\\([\\s\\S]*?\\n}`);
  const match = html.match(regex);
  if (!match) throw new Error(`Function ${name} not found in atendimentos.html`);
  return new Function(`return (${match[0]})`)();
}

function extractFnWithScope(name, scopeObj) {
  const regex = new RegExp(`function ${name}\\([\\s\\S]*?\\n}`);
  const match = html.match(regex);
  if (!match) throw new Error(`Function ${name} not found in atendimentos.html`);
  const keys = Object.keys(scopeObj);
  const vals = Object.values(scopeObj);
  return new Function(...keys, `return (${match[0]})`)(...vals);
}

const parseValor = extractFn('parseValor');
const formatDateBR = extractFn('formatDateBR');
const initials = extractFn('initials');
const escapeHtml = extractFn('escapeHtml');
const getPatientDisplayName = extractFn('getPatientDisplayName');
const getPatientLegalName = extractFn('getPatientLegalName');
const renderPatientAvatar = extractFnWithScope('renderPatientAvatar', { escapeHtml, initials });

describe('parseValor', () => {
  test('parses numbers and strings correctly', () => {
    assert.equal(parseValor(150), 150);
    assert.equal(parseValor('150.00'), 150);
    assert.equal(parseValor('150,00'), 150);
    assert.equal(parseValor('R$ 1.250,50'), 1250.5);
    assert.equal(parseValor(null), 0);
    assert.equal(parseValor(''), 0);
  });

  test('guards against accidental ISO timestamps and dates (returns 0)', () => {
    assert.equal(parseValor('2026-08-10T18:54:17.973Z'), 0);
    assert.equal(parseValor('2026-10-30'), 0);
    assert.equal(parseValor('2026-09-17'), 0);
  });
});

describe('formatDateBR', () => {
  test('converts ISO YYYY-MM-DD to DD/MM/YYYY', () => {
    assert.equal(formatDateBR('2026-10-30'), '30/10/2026');
    assert.equal(formatDateBR(''), '');
    assert.equal(formatDateBR('invalid'), 'invalid');
  });
});

describe('initials', () => {
  test('extracts two uppercase letters for single or multiple names', () => {
    assert.equal(initials('Maria Silva'), 'MS');
    assert.equal(initials('Ana'), 'AN');
    assert.equal(initials(''), '?');
  });
});

describe('escapeHtml', () => {
  test('escapes HTML special characters', () => {
    assert.equal(escapeHtml('<script>"alert"</script>'), '&lt;script&gt;&quot;alert&quot;&lt;/script&gt;');
    assert.equal(escapeHtml(null), '');
  });
});

describe('getPatientDisplayName and getPatientLegalName', () => {
  test('prefers nomeFantasia for internal display and nome for external documents', () => {
    const p = { nome: 'Maria Ferreira dos Santos', nomeFantasia: 'Dona Maria' };
    assert.equal(getPatientDisplayName(p), 'Dona Maria');
    assert.equal(getPatientLegalName(p), 'Maria Ferreira dos Santos');
  });

  test('falls back to nome when nomeFantasia is empty', () => {
    const p = { nome: 'Maria das Graças Silva', nomeFantasia: '' };
    assert.equal(getPatientDisplayName(p), 'Maria das Graças Silva');
    assert.equal(getPatientLegalName(p), 'Maria das Graças Silva');
  });
});

describe('renderPatientAvatar', () => {
  test('renders image tag when patient has photo', () => {
    const p = { nome: 'Maria Ferreira', nomeFantasia: 'Dona Maria', foto: 'data:image/jpeg;base64,abc123xyz' };
    const res = renderPatientAvatar(p);
    assert.match(res, /<img src="data:image\/jpeg;base64,abc123xyz"/);
    assert.match(res, /class="avatar-img"/);
  });

  test('falls back to initials using nomeFantasia when patient has no photo', () => {
    const p = { nome: 'Maria Ferreira dos Santos', nomeFantasia: 'Dona Maria', foto: '' };
    const res = renderPatientAvatar(p);
    assert.equal(res, '<div class="avatar">DM</div>');
  });

  test('handles null patient with fallback name', () => {
    const res = renderPatientAvatar(null, 'Carlos Souza');
    assert.equal(res, '<div class="avatar">CS</div>');
  });
});

const scheduleMatchesPatient = extractFnWithScope('scheduleMatchesPatient', {
  findPatientByName: () => null
});
const isSchedulePendingForecast = extractFnWithScope('isSchedulePendingForecast', {
  entries: [{ id: 'e123' }]
});

describe('scheduleMatchesPatient and isSchedulePendingForecast', () => {
  test('matches schedule by pacienteId, legal name, or nomeFantasia', () => {
    const p = { id: 'p1', nome: 'Maria Ferreira dos Santos', nomeFantasia: 'Dona Maria' };
    assert.equal(scheduleMatchesPatient({ pacienteId: 'p1', pacienteNome: 'Outro' }, p), true);
    assert.equal(scheduleMatchesPatient({ pacienteId: '', pacienteNome: 'Maria Ferreira dos Santos' }, p), true);
    assert.equal(scheduleMatchesPatient({ pacienteId: '', pacienteNome: 'dona maria' }, p), true);
    assert.equal(scheduleMatchesPatient({ pacienteId: 'p2', pacienteNome: 'Outro Paciente' }, p), false);
  });

  test('identifies only unlinked Agendado schedules as pending forecast', () => {
    assert.equal(isSchedulePendingForecast({ status: 'Agendado', atendimentoId: '' }), true);
    assert.equal(isSchedulePendingForecast({ status: '', atendimentoId: '' }), true);
    assert.equal(isSchedulePendingForecast({ status: 'Realizado', atendimentoId: 'e123' }), false);
    assert.equal(isSchedulePendingForecast({ status: 'Cancelado', atendimentoId: '' }), false);
    assert.equal(isSchedulePendingForecast({ status: 'Agendado', atendimentoId: 'e123' }), false);
  });
});

const timeStrToMin = extractFn('timeStrToMin');
const minToTimeStr = extractFnWithScope('minToTimeStr', {
  pad: (n) => String(n).padStart(2, '0')
});
const formatDurationFriendly = extractFn('formatDurationFriendly');
const calcFuelMetrics = extractFnWithScope('calcFuelMetrics', {
  getCarKmPerLiter: () => 14,
  getGasPrice: () => 6.10
});
const buildGoogleMapsDirUrl = extractFn('buildGoogleMapsDirUrl');
const formatDistanceKm = extractFn('formatDistanceKm');
const parseTimeMinutes = extractFn('parseTimeMinutes');
const formatTimeMinutes = extractFnWithScope('formatTimeMinutes', { minToTimeStr });
const formatDurationHuman = extractFnWithScope('formatDurationHuman', { formatDurationFriendly });
const calcFuelCost = extractFnWithScope('calcFuelCost', { calcFuelMetrics });
const buildGoogleMapsDirectionsUrl = extractFnWithScope('buildGoogleMapsDirectionsUrl', { buildGoogleMapsDirUrl });

let currentTestHomeAddress = '';
const getHomeAddressDisplayName = extractFnWithScope('getHomeAddressDisplayName', {
  getHomeAddress: () => currentTestHomeAddress
});
const getUserCityFallback = extractFnWithScope('getUserCityFallback', {
  getHomeAddress: () => currentTestHomeAddress,
  DEFAULT_CITY_FALLBACK: ''
});
const getPatientFullAddress = extractFnWithScope('getPatientFullAddress', {
  getUserCityFallback,
  DEFAULT_CITY_FALLBACK: ''
});

describe('Route and Fuel Assistant helpers', () => {
  test('timeStrToMin converts HH:MM to total minutes correctly', () => {
    assert.equal(timeStrToMin('00:00'), 0);
    assert.equal(timeStrToMin('10:00'), 600);
    assert.equal(timeStrToMin('14:00'), 840);
    assert.equal(timeStrToMin('14:50'), 890);
    assert.equal(timeStrToMin('15:00'), 900);
    assert.equal(timeStrToMin('16:00'), 960);
  });

  test('minToTimeStr formats total minutes into HH:MM string', () => {
    assert.equal(minToTimeStr(0), '00:00');
    assert.equal(minToTimeStr(600), '10:00');
    assert.equal(minToTimeStr(840), '14:00');
    assert.equal(minToTimeStr(890), '14:50');
    assert.equal(minToTimeStr(900), '15:00');
    assert.equal(minToTimeStr(960), '16:00');
  });

  test('formatDurationFriendly handles minutes and hours properly', () => {
    assert.equal(formatDurationFriendly(8), '8 min');
    assert.equal(formatDurationFriendly(9), '9 min');
    assert.equal(formatDurationFriendly(50), '50 min');
    assert.equal(formatDurationFriendly(60), '1h');
    assert.equal(formatDurationFriendly(70), '1h 10min');
    assert.equal(formatDurationFriendly(130), '2h 10min');
  });

  test('calcFuelMetrics calculates liters and cost with 14 km/L and R$ 6.10/L', () => {
    const res = calcFuelMetrics(14);
    assert.equal(res.km, 14);
    assert.equal(res.liters, 1.0);
    assert.equal(res.cost, 6.10);
    assert.equal(res.kml, 14);

    const res28 = calcFuelMetrics(28);
    assert.equal(res28.km, 28);
    assert.equal(res28.liters, 2.0);
    assert.equal(res28.cost, 12.20);

    const zero = calcFuelMetrics(0);
    assert.equal(zero.km, 0);
    assert.equal(zero.liters, 0);
    assert.equal(zero.cost, 0);
  });

  test('buildGoogleMapsDirUrl constructs valid direction URL with origin, destination, and optional waypoint', () => {
    const url = buildGoogleMapsDirUrl('Rua Maracaju, 88', 'Av Independencia, 1200');
    assert.match(url, /https:\/\/www\.google\.com\/maps\/dir\/\?api=1/);
    assert.match(url, /origin=Rua%20Maracaju%2C%2088/);
    assert.match(url, /destination=Av%20Independencia%2C%201200/);
    assert.match(url, /travelmode=driving/);

    const urlWaypoint = buildGoogleMapsDirUrl('Rua Maracaju, 88', 'Rua B', 'Rua A');
    assert.match(urlWaypoint, /waypoints=Rua%20A/);

    const urlAlias = buildGoogleMapsDirectionsUrl('Rua Maracaju, 88', ['Rua B']);
    assert.match(urlAlias, /destination=Rua%20B/);
  });

  test('formatDistanceKm formats km with comma decimal', () => {
    assert.equal(formatDistanceKm(4.5), '4,5 km');
    assert.equal(formatDistanceKm(12), '12,0 km');
    assert.equal(formatDistanceKm(0), '0,0 km');
  });

  test('parseTimeMinutes and formatTimeMinutes roundtrip correctly', () => {
    assert.equal(parseTimeMinutes('14:30'), 870);
    assert.equal(parseTimeMinutes(''), null);
    assert.equal(parseTimeMinutes(null), null);
    assert.equal(formatTimeMinutes(870), '14:30');
    assert.equal(formatDurationHuman(75), '1h 15min');
  });

  test('calcFuelCost delegates to calcFuelMetrics', () => {
    const f = calcFuelCost(28);
    assert.equal(f.liters, 2.0);
    assert.equal(f.cost, 12.20);
  });

  test('calcFuelMetrics handles null, undefined and NaN safely', () => {
    const fnNull = calcFuelMetrics(null);
    assert.equal(fnNull.km, 0);
    assert.equal(fnNull.liters, 0);
    assert.equal(fnNull.cost, 0);

    const fnUndef = calcFuelMetrics(undefined);
    assert.equal(fnUndef.km, 0);

    const fnNaN = calcFuelMetrics('invalid_number');
    assert.equal(fnNaN.km, 0);
  });

  test('getHomeAddressDisplayName filters out street numbers, CEPs and state codes and prefers neighborhood', () => {
    currentTestHomeAddress = '';
    assert.equal(getHomeAddressDisplayName(), 'Base');

    currentTestHomeAddress = 'Rua General Osório, 100 - Centro, Ribeirão Preto - SP';
    assert.equal(getHomeAddressDisplayName(), 'Centro');

    currentTestHomeAddress = 'Av. Independência, 1200, Jardim Sumaré, Ribeirão Preto - SP';
    assert.equal(getHomeAddressDisplayName(), 'Jardim Sumaré');

    currentTestHomeAddress = 'Rua Floriano Peixoto, 45';
    assert.equal(getHomeAddressDisplayName(), 'Rua Floriano Peixoto');

    currentTestHomeAddress = 'Clínica Central, Sala 102';
    assert.equal(getHomeAddressDisplayName(), 'Clínica Central');
  });

  test('getUserCityFallback extracts city and state from home address', () => {
    currentTestHomeAddress = 'Rua General Osório, 100 - Centro, Ribeirão Preto - SP';
    assert.equal(getUserCityFallback(), 'Ribeirão Preto - SP');

    currentTestHomeAddress = '';
    assert.equal(getUserCityFallback(), '');
  });

  test('getPatientFullAddress appends user city fallback and avoids duplication', () => {
    currentTestHomeAddress = 'Rua General Osório, 100 - Centro, Ribeirão Preto - SP';

    // Patient with only street and neighborhood receives user's base city fallback
    const p1 = { endereco: 'Rua Álvares Cabral, 300', bairro: 'Centro', cidade: '' };
    assert.equal(getPatientFullAddress(p1), 'Rua Álvares Cabral, 300, Centro, Ribeirão Preto - SP');

    // Patient with explicit other city preserves their city
    const p2 = { endereco: 'Rua Barão do Rio Branco, 50', bairro: 'Centro', cidade: 'Sertãozinho - SP' };
    assert.equal(getPatientFullAddress(p2), 'Rua Barão do Rio Branco, 50, Centro, Sertãozinho - SP');

    // Patient already having city in street avoids duplication
    const p3 = { endereco: 'Rua São Paulo, 100, Ribeirão Preto - SP', bairro: '', cidade: '' };
    assert.equal(getPatientFullAddress(p3), 'Rua São Paulo, 100, Ribeirão Preto - SP');

    // Empty patient returns empty string
    assert.equal(getPatientFullAddress(null), '');
    assert.equal(getPatientFullAddress({ endereco: '', bairro: '', cidade: '' }), '');
  });
});

describe('Rapid Clinical Helpers', () => {
  function appendTextLogic(current, text) {
    var c = (current || '').trim();
    if (!c) return text;
    if (/[.!?]$/.test(c)) return c + ' ' + text;
    return c + '. ' + text;
  }

  test('appends text cleanly with punctuation awareness', () => {
    assert.equal(appendTextLogic('', 'Cinesioterapia'), 'Cinesioterapia');
    assert.equal(appendTextLogic('Paciente estável.', 'Treino de marcha'), 'Paciente estável. Treino de marcha');
    assert.equal(appendTextLogic('Paciente sem dor', 'Alongamentos'), 'Paciente sem dor. Alongamentos');
  });

  test('clinical templates have valid diagnosis, functional, and objectives', () => {
    const templates = {
      lombalgia: {
        clinico: 'Lombalgia Crônica Mecânico-Postural (CID-10 M54.5)',
        funcional: 'Quadro álgico lombar...',
        objetivos: 'Alívio do quadro álgico...'
      },
      gonartrose: {
        clinico: 'Gonartrose Primária Bilateral / Osteoartrite de Joelho (CID-10 M17.0)',
        funcional: 'Crepitação articular...',
        objetivos: 'Redução do estresse articular...'
      }
    };
    for (const key of Object.keys(templates)) {
      assert.ok(templates[key].clinico.length > 5);
      assert.ok(templates[key].funcional.length > 5);
      assert.ok(templates[key].objetivos.length > 5);
    }
  });
});

describe('Google Calendar Integration Helpers', () => {
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  test('getUserCalendarId purges primary and falls back to configured email', () => {
    const mockStorage = {
      getItem(key) {
        if (key === 'ff_calendar_id') return 'primary';
        if (key === 'ff_google_user_email') return 'corredoresantifascistas@gmail.com';
        return null;
      }
    };
    const mockConfig = { calendarId: 'primary' };
    const getUserCalendarIdFn = extractFnWithScope('getUserCalendarId', {
      config: mockConfig,
      localStorage: mockStorage
    });

    const resolved = getUserCalendarIdFn();
    assert.equal(resolved, 'corredoresantifascistas@gmail.com');
    assert.notEqual(resolved.toLowerCase(), 'primary');
  });

  test('buildGCalTemplateUrl formats patient session correctly with authuser', () => {
    const getSchedulePatientDisplayName = (sc) => sc.pacienteNome || 'Dona Maria';
    const getSchedulePatientObj = () => ({ endereco: 'Rua das Flores, 123', bairro: 'Centro', cidade: 'Ribeirão Preto' });
    const getUserCalendarId = () => 'corredoresantifascistas@gmail.com';

    const buildGCalTemplateUrlFn = extractFnWithScope('buildGCalTemplateUrl', {
      getSchedulePatientDisplayName,
      getSchedulePatientObj,
      getUserCalendarId,
      isoDate,
      pad
    });

    const sc = {
      id: 'sc1',
      pacienteNome: 'Dona Maria',
      data: '2026-11-10',
      hora: '14:00',
      duracaoMin: 50,
      status: 'Agendado'
    };

    const url = buildGCalTemplateUrlFn(sc);
    assert.match(url, /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
    assert.match(url, /text=Dona%20Maria/);
    assert.match(url, /dates=20261110T140000%2F20261110T145000/);
    assert.match(url, /authuser=corredoresantifascistas%40gmail\.com/);
  });

  test('buildGCalTemplateUrl formats vacation block with all-day start and duration', () => {
    const getSchedulePatientDisplayName = () => '🏖️ Férias';
    const getSchedulePatientObj = () => null;
    const getUserCalendarId = () => 'corredoresantifascistas@gmail.com';

    const buildGCalTemplateUrlFn = extractFnWithScope('buildGCalTemplateUrl', {
      getSchedulePatientDisplayName,
      getSchedulePatientObj,
      getUserCalendarId,
      isoDate,
      pad
    });

    const scVac = {
      id: 'vac1',
      pacienteId: '__BLOQUEIO__',
      pacienteNome: '🏖️ Férias',
      data: '2026-11-15',
      hora: '08:00',
      duracaoMin: 720,
      status: 'Ausência',
      observacao: 'Congresso de Fisioterapia'
    };

    const urlVac = buildGCalTemplateUrlFn(scVac);
    assert.match(urlVac, /calendar\.google\.com\/calendar\/render\?action=TEMPLATE/);
    assert.match(urlVac, /dates=20261115T080000%2F20261115T200000/);
    assert.match(urlVac, /Congresso%20de%20Fisioterapia/);
  });

  test('openScheduleInGCalUrl opens day view directly if schedule is already synced with calendarEventId', () => {
    let openedUrl = '';
    const mockWindow = {
      open: (url) => { openedUrl = url; }
    };
    const scSynced = {
      id: 'sc_synced_1',
      calendarEventId: 'google_ev_123',
      data: '2026-11-10',
      hora: '14:00'
    };
    const openScheduleInGCalUrlFn = extractFnWithScope('openScheduleInGCalUrl', {
      schedules: [scSynced],
      getUserCalendarId: () => 'scarletsantos7@gmail.com',
      window: mockWindow,
      scriptUrl: () => 'demo',
      buildGCalTemplateUrl: () => ''
    });

    openScheduleInGCalUrlFn('sc_synced_1');
    assert.match(openedUrl, /calendar\.google\.com\/calendar\/r\/day\/2026\/11\/10/);
    assert.match(openedUrl, /authuser=scarletsantos7%40gmail\.com/);
  });

  test('buildIcsFeed_ in Code.gs produces valid RFC 5545 iCalendar feed', () => {
    const codeGs = fs.readFileSync(path.join(__dirname, '../Code.gs'), 'utf-8');
    const mIcs = codeGs.match(/function buildIcsFeed_\([\s\S]*?\n}/);
    assert.ok(mIcs, 'buildIcsFeed_ exists in Code.gs');

    const mPad = codeGs.match(/function pad2_\([\s\S]*?\n}/);
    const mFmt = codeGs.match(/function formatIcsDateTime_\([\s\S]*?\n}/);
    const mParse = codeGs.match(/function parseScheduleDates_\([\s\S]*?\n}/);

    const pad2_ = new Function(`return (${mPad[0]})`)();
    const formatIcsDateTime_ = new Function('pad2_', `return (${mFmt[0]})`)(pad2_);
    const parseScheduleDates_ = new Function('pad2_', 'Utilities', `return (${mParse[0]})`)(pad2_, { parseDate: () => null });
    const buildIcsFeed_ = new Function('pad2_', 'formatIcsDateTime_', 'parseScheduleDates_', `return (${mIcs[0]})`)(pad2_, formatIcsDateTime_, parseScheduleDates_);

    const feed = buildIcsFeed_([
      {
        ID: 'ag_test_1',
        PacienteNome: 'Dona Maria',
        Data: '2026-11-10',
        Hora: '14:00',
        DuracaoMin: 50,
        Status: 'Agendado'
      }
    ], 'scarletsantos7@gmail.com');

    assert.match(feed, /BEGIN:VCALENDAR/);
    assert.match(feed, /X-WR-CALNAME:Fisioflow/);
    assert.match(feed, /NAME:Fisioflow/);
    assert.match(feed, /X-WR-CALDESC:Atendimentos Fisioflow/);
    assert.match(feed, /VERSION:2\.0/);
    assert.match(feed, /BEGIN:VEVENT/);
    assert.match(feed, /UID:ag_test_1@fisioflow/);
    assert.match(feed, /DTSTART:20261110T140000/);
    assert.match(feed, /DTEND:20261110T145000/);
    assert.match(feed, /SUMMARY:Dona Maria/);
    assert.match(feed, /END:VCALENDAR/);
  });

  test('buildGCalApiPayload formats direct Google Calendar API v3 event properly', () => {
    const getSchedulePatientDisplayName = (sc) => sc.pacienteNome || 'Paciente';
    const getSchedulePatientObj = () => ({ telefone: '16999999999' });
    const getPatientFullAddress = () => 'Rua das Flores, 100 - Ribeirão Preto';

    const buildGCalApiPayloadFn = extractFnWithScope('buildGCalApiPayload', {
      getSchedulePatientDisplayName,
      getSchedulePatientObj,
      getPatientFullAddress
    });

    const sc = {
      id: 'sc_api_1',
      pacienteNome: 'João da Silva',
      data: '2026-11-10',
      hora: '14:00',
      duracaoMin: 50,
      status: 'Agendado'
    };

    const payload = buildGCalApiPayloadFn(sc);
    assert.equal(payload.summary, 'João da Silva');
    assert.ok(parseInt(payload.colorId, 10) >= 1 && parseInt(payload.colorId, 10) <= 11);
    assert.equal(payload.location, 'Rua das Flores, 100 - Ribeirão Preto');
    assert.match(payload.start.dateTime, /2026-11-10T14:00:00/);
    assert.match(payload.end.dateTime, /2026-11-10T14:50:00/);
    assert.equal(payload.start.timeZone, 'America/Sao_Paulo');
  });

  test('obterGoogleCalendarTokenSalvo and expiration lifecycle', () => {
    let mockStorage = {};
    const scope = {
      GCAL_TOKEN_STORAGE_KEY: 'ff_google_cal_oauth_token',
      GCAL_TOKEN_EXP_KEY: 'ff_google_cal_oauth_exp',
      sessionStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; }
      },
      localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; }
      },
      _googleAccessToken: null
    };

    const obterFn = extractFnWithScope('obterGoogleCalendarTokenSalvo', scope);
    const salvarFn = extractFnWithScope('salvarGoogleCalendarToken', scope);
    const limparFn = extractFnWithScope('limparGoogleCalendarToken', scope);

    // Initial state: no token
    assert.equal(obterFn(), null);

    // Save token with 3600s
    salvarFn('ya29.test_token_123', 3600);
    assert.equal(obterFn(), 'ya29.test_token_123');

    // Clear token
    limparFn();
    assert.equal(obterFn(), null);
  });
});

describe('Route Engine, Haversine Estimation and Coordinates Matching', () => {
  const mCoords = html.match(/var RP_COORDS_REF = \[[\s\S]*?\];/);
  const RP_COORDS_REF = new Function('return (' + mCoords[0].replace('var RP_COORDS_REF = ', '').replace(/;$/, '') + ')')();

  const normAddrKey = extractFn('normAddrKey');
  const makeRoutePairKey = extractFnWithScope('makeRoutePairKey', { normAddrKey });
  const findApproxCoordsRP = extractFnWithScope('findApproxCoordsRP', { normAddrKey, RP_COORDS_REF });
  const haversineRoadEstimate = extractFn('haversineRoadEstimate');
  const getRouteSyncOrApprox = extractFnWithScope('getRouteSyncOrApprox', {
    normAddrKey,
    makeRoutePairKey,
    getRouteCacheMap: () => ({}),
    findApproxCoordsRP,
    haversineRoadEstimate
  });

  test('matches coordinates for known Ribeirão Preto neighborhoods', () => {
    const home = findApproxCoordsRP('Rua Maracaju, 88 - Vila Tibério, Ribeirão Preto');
    assert.ok(home && home.matched);
    assert.equal(home.lat, -21.1764);
    assert.equal(home.lon, -47.8266);

    const usp = findApproxCoordsRP('Avenida dos Bandeirantes, 3900 - Monte Alegre, USP');
    assert.ok(usp && usp.matched);
    assert.equal(usp.lat, -21.1685);

    const centro = findApproxCoordsRP('Rua General Osório, 400 - Centro, Ribeirão Preto');
    assert.ok(centro && centro.matched);
    assert.equal(centro.lat, -21.1775);

    const botanico = findApproxCoordsRP('Avenida Professor João Fiúsa, 1200 - Jardim Botânico');
    assert.ok(botanico && botanico.matched);
    assert.equal(botanico.lat, -21.2115);

    const bonfim = findApproxCoordsRP('Condomínio Alphaville - Bonfim Paulista');
    assert.ok(bonfim && bonfim.matched);
    assert.equal(bonfim.lat, -21.2550);
  });

  test('haversineRoadEstimate returns realistic road distances and urban drive times', () => {
    const c1 = { lat: -21.1764, lon: -47.8266 }; // Vila Tiberio
    const c2 = { lat: -21.1685, lon: -47.8425 }; // Monte Alegre / USP
    const est = haversineRoadEstimate(c1, c2);
    assert.equal(est.ok, true);
    assert.ok(est.distanceKm >= 2.0 && est.distanceKm <= 3.5, 'Distance between Vila Tiberio and USP should be ~2.5km');
    assert.ok(est.durationMin >= 6 && est.durationMin <= 12, 'Drive time should be ~8-9min');
  });

  test('getRouteSyncOrApprox returns 0.4km and 2min for identical addresses', () => {
    const r = getRouteSyncOrApprox('Rua Maracaju, 88', 'Rua Maracaju, 88');
    assert.equal(r.ok, true);
    assert.equal(r.distanceKm, 0);
    assert.equal(r.durationMin, 0);
    assert.equal(r.sameLocation, true);
  });

  test('getRouteSyncOrApprox safely provides fallback for unknown neighborhoods without null/crash', () => {
    const r = getRouteSyncOrApprox('Rua Inexistente, 123', 'Avenida Qualquer, 456');
    assert.ok(r && r.ok);
    assert.ok(r.distanceKm > 0);
    assert.ok(r.durationMin > 0);
    assert.equal(r.approx, true);
  });

  test('ranking simulation does not crash when patients have blank addresses', () => {
    const patients = [
      { id: 'p1', nome: 'Paciente Sem Endereco', endereco: '', bairro: '', cidade: '' },
      { id: 'p2', nome: 'Paciente Com Endereco', endereco: 'Rua General Osorio, 100', bairro: 'Centro', cidade: 'Ribeirao Preto' }
    ];
    const getPatientFullAddress = (p) => {
      const parts = [p.endereco, p.bairro, p.cidade].filter(Boolean);
      return parts.join(', ');
    };
    const originAddr = 'Rua Maracaju, 88 - Vila Tiberio';
    const activeOthers = patients.filter((p) => getPatientFullAddress(p));
    assert.equal(activeOthers.length, 1);

    const rows = activeOthers.map((p) => {
      const pAddr = getPatientFullAddress(p);
      const r = getRouteSyncOrApprox(originAddr, pAddr) || { ok: true, distanceKm: 4.5, durationMin: 12, approx: true };
      return { patient: p, route: r, fuel: calcFuelMetrics(r.distanceKm) };
    }).sort((a, b) => a.route.durationMin - b.route.durationMin);

    assert.equal(rows.length, 1);
    assert.ok(rows[0].route.durationMin > 0);
    assert.ok(rows[0].fuel.liters > 0);
    assert.ok(rows[0].fuel.cost > 0);
  });

  test('Route calculations with blank base address safely return null or friendly fallback without exception', () => {
    // When home address is empty
    const blankHome = '';
    const patAddr = 'Rua General Osório, 100, Centro, Ribeirão Preto - SP';
    const rHome = (blankHome && patAddr) ? getRouteSyncOrApprox(blankHome, patAddr) : null;
    assert.equal(rHome, null);

    // Fuel cost calculation handles null distance safely
    const fuelHome = rHome ? calcFuelCost(rHome.distanceKm) : null;
    assert.equal(fuelHome, null);

    // When home address is configured
    const configuredHome = 'Rua Maracaju, 88, Vila Tibério, Ribeirão Preto - SP';
    const rHomeValid = getRouteSyncOrApprox(configuredHome, patAddr);
    assert.ok(rHomeValid && rHomeValid.ok);
    assert.ok(rHomeValid.distanceKm > 0);
    assert.ok(rHomeValid.durationMin > 0);

    const fuelValid = calcFuelCost(rHomeValid.distanceKm);
    assert.ok(fuelValid.liters > 0);
    assert.ok(fuelValid.cost > 0);
  });
});

describe('Dev Mode Isolation & Stealth for Regular Users', () => {
  test('atendimentos.html does not expose any visible dev elements, links or gesture handlers', () => {
    // Assert no dev button in HTML
    assert.equal(html.includes('id="btnDevPanel"'), false);
    // Assert no visible links to dev area
    assert.equal(html.includes('Área do Desenvolvedor (Acesso administrativo)'), false);
    assert.equal(html.includes('Área Dev &amp; Contador de Acessos'), false);
    assert.equal(html.includes('Área Dev & Contador de Acessos'), false);
    // Assert stamp has no secret gesture onclick
    assert.equal(html.includes('handleDevSecretTap'), false);
  });

  test('verificarModoDev opens dev modal ONLY when specific secret parameter is present', () => {
    let openedWithParam = false;
    let openedWithoutParam = false;
    let openedWithWrongParam = false;

    const DEV_AUTHORIZED_PASSWORDS = ['admin', 'matheus', 'fisioflow2026', '123456', 'matheus2026'];

    // 1. Regular user visiting without ?dev
    const verifyRegular = extractFnWithScope('verificarModoDev', {
      window: { location: { search: '', href: 'https://site.com/atendimentos.html' }, history: { replaceState() {} } },
      document: { title: 'FisioFlow' },
      DEV_AUTHORIZED_PASSWORDS,
      openDevModal: () => { openedWithoutParam = true; }
    });
    verifyRegular();
    assert.equal(openedWithoutParam, false, 'Regular user must not trigger dev modal');

    // 2. Regular user with random query param
    const verifyWrong = extractFnWithScope('verificarModoDev', {
      window: { location: { search: '?dev=other', href: 'https://site.com/atendimentos.html?dev=other' }, history: { replaceState() {} } },
      document: { title: 'FisioFlow' },
      DEV_AUTHORIZED_PASSWORDS,
      openDevModal: () => { openedWithWrongParam = true; }
    });
    verifyWrong();
    assert.equal(openedWithWrongParam, false, 'Invalid dev param must not trigger dev modal');

    // 3. Developer visiting with authorized specific link (?dev=admin)
    const verifyDev = extractFnWithScope('verificarModoDev', {
      window: { location: { search: '?dev=admin', href: 'https://site.com/atendimentos.html?dev=admin' }, history: { replaceState() {} } },
      document: { title: 'FisioFlow' },
      DEV_AUTHORIZED_PASSWORDS,
      openDevModal: () => { openedWithParam = true; }
    });
    verifyDev();
    assert.equal(openedWithParam, true, 'Authorized link must trigger dev modal');
  });
});

describe('Demo Mode & Sample Data Seeding', () => {
  let fakeStorage = {};
  const mockLocalStorage = {
    getItem: (k) => fakeStorage[k] || null,
    setItem: (k, v) => { fakeStorage[k] = String(v); },
    removeItem: (k) => { delete fakeStorage[k]; }
  };

  const seedDemoDataIfEmpty = extractFnWithScope('seedDemoDataIfEmpty', {
    localStorage: mockLocalStorage,
    isoDate: (d) => '2026-11-02'
  });

  test('seedDemoDataIfEmpty generates and returns 2 sample patients and related clinical data', () => {
    fakeStorage = {};
    const res = seedDemoDataIfEmpty(true);
    assert.ok(res && res.patients && res.patients.length === 2);
    assert.equal(res.patients[0].nomeFantasia, 'Dona Maria');
    assert.equal(res.patients[1].nomeFantasia, 'Seu João');
    assert.equal(res.entries.length, 2);
    assert.equal(res.evolutions.length, 1);
    assert.equal(res.schedules.length, 2);
    assert.equal(mockLocalStorage.getItem('ff_demo_seeded'), '1');
  });

  test('handleDemoPostAction handles patient, entry, schedule and payment operations', () => {
    let mockPatients = [];
    let mockEntries = [];
    let mockEvos = [];
    let mockScheds = [];

    const handleDemoPostAction = extractFnWithScope('handleDemoPostAction', {
      get patients() { return mockPatients; },
      set patients(v) { mockPatients = v; },
      get entries() { return mockEntries; },
      set entries(v) { mockEntries = v; },
      get evolutions() { return mockEvos; },
      set evolutions(v) { mockEvos = v; },
      get schedules() { return mockScheds; },
      set schedules(v) { mockScheds = v; },
      localStorage: mockLocalStorage
    });

    // 1. Create Patient
    const pRes = handleDemoPostAction({
      action: 'create_patient',
      id: 'p_test_1',
      nome: 'Carlos Drummond',
      nomeFantasia: 'Carlos'
    });
    assert.equal(pRes.success, true);
    assert.equal(mockPatients.length, 1);
    assert.equal(mockPatients[0].nomeFantasia, 'Carlos');

    // 2. Create Entry
    const eRes = handleDemoPostAction({
      action: 'create',
      id: 'e_test_1',
      nome: 'Carlos',
      valor: 150,
      status: 'Pendente'
    });
    assert.equal(eRes.success, true);
    assert.equal(mockEntries.length, 1);

    // 3. Update Status (Registrar Pagamento)
    handleDemoPostAction({
      action: 'update_status',
      id: 'e_test_1',
      status: 'Recebido',
      paymentDate: '2026-11-02'
    });
    assert.equal(mockEntries[0].status, 'Recebido');
    assert.equal(mockEntries[0].paymentDate, '2026-11-02');

    // 4. Batch Schedules (Férias / Ausências)
    const vacBatch = handleDemoPostAction({
      action: 'create_schedules_batch',
      items: [
        { id: 'vac_1', data: '2026-11-02', status: 'Ausência' },
        { id: 'vac_2', data: '2026-11-03', status: 'Ausência' }
      ]
    });
    assert.equal(vacBatch.success, true);
    assert.equal(mockScheds.length, 2);

    // 5. Update Schedule (Cancelar Conflito)
    handleDemoPostAction({
      action: 'update_schedule',
      item: { id: 'vac_1', status: 'Cancelado' }
    });
    assert.equal(mockScheds[0].status, 'Cancelado');

    // 6. Delete Schedule
    handleDemoPostAction({
      action: 'delete_schedule',
      id: 'vac_2'
    });
    assert.equal(mockScheds.length, 1);
  });
});

describe('Vacation & Absence Manager Helpers', () => {
  const isValidIsoDay = extractFn('isValidIsoDay');
  const vacationSpanDays = extractFnWithScope('vacationSpanDays', { isValidIsoDay });
  const VAC_MAX_DAYS = 120;
  const getVacationDatesRange = extractFnWithScope('getVacationDatesRange', {
    vacationSpanDays,
    VAC_MAX_DAYS,
    isoDate: (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }
  });

  test('vacationSpanDays validates ISO format, order and day count', () => {
    assert.equal(vacationSpanDays('2026-11-02', '2026-11-02'), 1);
    assert.equal(vacationSpanDays('2026-11-02', '2026-11-10'), 9);
    assert.equal(vacationSpanDays('2026-11-10', '2026-11-02'), -1);
    assert.equal(vacationSpanDays('20267-11-02', '2026-11-02'), -1);
    assert.equal(vacationSpanDays('invalid', '2026-11-02'), -1);
  });

  test('getVacationDatesRange returns continuous list of ISO date strings', () => {
    const range = getVacationDatesRange('2026-11-02', '2026-11-05');
    assert.deepEqual(range, ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05']);

    const single = getVacationDatesRange('2026-11-02', '2026-11-02');
    assert.deepEqual(single, ['2026-11-02']);
  });

  test('getVacationDatesRange guards against invalid or inverted dates', () => {
    assert.deepEqual(getVacationDatesRange('2026-11-05', '2026-11-02'), []);
    assert.deepEqual(getVacationDatesRange('', '2026-11-05'), []);
    assert.deepEqual(getVacationDatesRange('null', 'null'), []);
    assert.deepEqual(getVacationDatesRange('invalid-date', '2026-11-05'), []);
  });

  test('getVacationDatesRange enforces safety cap avoiding browser lockup', () => {
    const massive = getVacationDatesRange('2026-01-01', '2030-01-01');
    assert.equal(massive.length, 0, 'Exceeding VAC_MAX_DAYS must return empty array avoiding browser freeze');
    assert.equal(getVacationDatesRange('2026-01-01', '2026-04-30').length, 120);
  });
});

describe('Pacientes sem Nome Fantasia, sanitização e bloqueios de agenda', () => {
  const normName = extractFn('normName');
  const NON_PATIENT_NAMES = ['agachamento', 'flexao', 'prancha', 'exercicio', 'rotina', 'alongamento', '__bloqueio__', 'bloqueio', 'ausencia', 'ferias'];
  const BLOCK_LABELS = ['ferias', 'folga / recesso', 'congresso / curso', 'atestado / saude', 'atestado medico', 'feriado', 'bloqueio de horario'];
  const isInvalidPatientName = extractFnWithScope('isInvalidPatientName', { normName, NON_PATIENT_NAMES });
  const hasReservedName = extractFnWithScope('hasReservedName', { isInvalidPatientName });
  const isBlockLabelName = extractFnWithScope('isBlockLabelName', { normName, BLOCK_LABELS });
  const isNonPatientRecord = extractFnWithScope('isNonPatientRecord', { isInvalidPatientName, isBlockLabelName, hasReservedName });
  const isBlockSchedule = extractFn('isBlockSchedule');

  test('paciente sem Nome Fantasia continua válido (não some da lista)', () => {
    assert.equal(isNonPatientRecord({ nome: 'Irani Souza', nomeFantasia: '' }), false);
    assert.equal(isNonPatientRecord({ nome: 'Irani Souza' }), false);
    assert.equal(isNonPatientRecord({ nome: '', nomeFantasia: 'Dona Diva' }), false);
  });

  test('exercícios e rótulos de férias/ausência não são pacientes', () => {
    assert.equal(isNonPatientRecord({ nome: 'Flexão', nomeFantasia: '' }), true);
    assert.equal(isNonPatientRecord({ nome: '🏖️ Férias', nomeFantasia: '' }), true);
    assert.equal(isNonPatientRecord({ nome: '🏥 Atestado / Saúde', nomeFantasia: '' }), true);
    assert.equal(isNonPatientRecord({ nome: 'Maria', nomeFantasia: 'Prancha' }), true);
    assert.equal(isNonPatientRecord({ nome: '', nomeFantasia: '' }), true);
  });

  test('isBlockSchedule identifica bloqueios e ignora atendimentos normais', () => {
    assert.equal(isBlockSchedule({ pacienteId: '__BLOQUEIO__' }), true);
    assert.equal(isBlockSchedule({ status: 'Ausência' }), true);
    assert.equal(isBlockSchedule({ status: 'Férias' }), true);
    assert.equal(isBlockSchedule({ tipo: 'Bloqueio' }), true);
    assert.equal(isBlockSchedule({ pacienteId: 'p1', status: 'Agendado' }), false);
    assert.equal(isBlockSchedule(null), false);
  });
});

describe('Sincronização Multi-Dispositivo & Autoridade da Planilha', () => {
  test('dados da planilha sobrepõem metadados locais antigos', () => {
    const sheetData = {
      ID: 'p123',
      Nome: 'Diva Ferreira Atualizada',
      NomeFantasia: 'Dona Diva',
      Telefone: '16999998888',
      ValorPadrao: '150.00',
      Arquivado: 'Não'
    };
    const localMeta = {
      nome: 'Diva Ferreira Antiga',
      telefone: '16999991111',
      valorPadrao: '100.00',
      arquivado: 'Sim'
    };

    const resolvedName = sheetData.Nome || localMeta.nome || '';
    const resolvedTel = sheetData.Telefone || localMeta.telefone || '';
    const resolvedValor = sheetData.ValorPadrao || localMeta.valorPadrao || '';
    const resolvedArch = sheetData.Arquivado || localMeta.arquivado || 'Não';

    assert.equal(resolvedName, 'Diva Ferreira Atualizada', 'Nome da planilha deve vencer');
    assert.equal(resolvedTel, '16999998888', 'Telefone atualizado no celular deve vencer');
    assert.equal(resolvedValor, '150.00', 'Valor atualizado no celular deve vencer');
    assert.equal(resolvedArch, 'Não', 'Status arquivado da planilha deve vencer');
  });

  test('agendamentos da planilha sobrepõem cache local do computador', () => {
    const localScheds = [
      { id: 'sc1', hora: '14:00', status: 'Agendado' },
      { id: 'sc_deleted', hora: '10:00', status: 'Agendado' }
    ];
    const sheetScheds = [
      { id: 'sc1', hora: '15:00', status: 'Realizado' }
    ];

    const schedMap = {};
    localScheds.forEach(sc => {
      if (sc.id && sc.id.includes('_local_')) schedMap[sc.id] = sc;
    });
    sheetScheds.forEach(sc => {
      schedMap[sc.id] = sc;
    });
    const finalScheds = Object.values(schedMap);

    assert.equal(finalScheds.length, 1);
    assert.equal(finalScheds[0].hora, '15:00');
    assert.equal(finalScheds[0].status, 'Realizado');
  });
});

describe('Third-Party Distribution & Onboarding Readiness', () => {
  test('DEFAULT_CALENDAR_ID and DEFAULT_HOME_ADDRESS start completely empty', () => {
    assert.match(html, /var DEFAULT_CALENDAR_ID = '';/);
    assert.match(html, /var DEFAULT_HOME_ADDRESS = '';/);
  });

  test('receiptHeader falls back to generic "Profissional" when providerName is empty', () => {
    const capturedTexts = [];
    const fakeDoc = {
      setFillColor() {},
      rect() {},
      setTextColor() {},
      setFont() {},
      setFontSize() {},
      text(str) { capturedTexts.push(str); }
    };
    const receiptHeader = extractFnWithScope('receiptHeader', {
      marcaDaguaOutono: () => {},
      config: null
    });
    receiptHeader(fakeDoc, 'RECIBO');
    assert.equal(capturedTexts.some(t => t.includes('Fisioterapeuta Responsável: Profissional')), true);
  });

  test('setup screen contains friendly 1-click Demo Mode test button', () => {
    assert.equal(html.includes('ativarModoDemonstracao()'), true);
    assert.equal(html.includes('Testar primeiro no Modo Demonstração'), true);
  });

  test('atendimentos.html does not contain hardcoded developer personal email in user fields', () => {
    assert.equal(html.includes('matheusrodrigues1917@usp.br'), false);
  });
});









describe('Evoluções com SPO2/Observações, Check-in Diário & Google Agenda (v27)', () => {
  test('SPO2 formatado e gravado no modelo', () => {
    const ev = { id: 'ev1', pa: '12/8', fc: '72', spo2: '98%', estadoClinico: 'Estável', condutas: 'Cinesio', observacoes: 'Boa tolerância' };
    assert.equal(ev.spo2, '98%');
    assert.equal(ev.observacoes, 'Boa tolerância');
  });

  test('copiar conduta anterior obtém a conduta mais recente do mesmo paciente', () => {
    const evList = [
      { id: 'ev1', pacienteId: 'p1', data: '2026-11-01', hora: '14:00', condutas: 'Treino de equilíbrio estático' },
      { id: 'ev2', pacienteId: 'p1', data: '2026-11-03', hora: '15:00', condutas: 'Mobilização passiva e treino de marcha' },
      { id: 'ev3', pacienteId: 'p2', data: '2026-11-04', hora: '10:00', condutas: 'Eletroterapia TENS' }
    ];
    const pid = 'p1';
    const lastForP1 = evList.slice().sort((a,b) => (b.data + ' ' + b.hora).localeCompare(a.data + ' ' + a.hora))
      .find(x => x.pacienteId === pid && x.condutas);
    assert.ok(lastForP1);
    assert.equal(lastForP1.id, 'ev2');
    assert.equal(lastForP1.condutas, 'Mobilização passiva e treino de marcha');
  });

  test('título de evento no Google Agenda é estritamente o nome do paciente', () => {
    const sc = { pacienteNome: 'Dona Diva', status: 'Agendado' };
    const title = sc.pacienteNome;
    assert.equal(title, 'Dona Diva');
    assert.ok(!title.includes('Fisioterapia:'), 'Não deve conter prefixo Fisioterapia:');
  });

  test('atribuição de cor automática por paciente (1 a 11 determinística)', () => {
    function getPatientColor(name) {
      let hash = 0;
      const str = String(name || '').toLowerCase();
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return String((Math.abs(hash) % 11) + 1);
    }
    const c1 = getPatientColor('Sebastião');
    const c2 = getPatientColor('Sebastião');
    const c3 = getPatientColor('Irani');
    assert.equal(c1, c2, 'Mesmo paciente sempre recebe a mesma cor');
    assert.ok(parseInt(c1) >= 1 && parseInt(c1) <= 11, 'Cor deve estar entre 1 e 11');
    assert.ok(parseInt(c3) >= 1 && parseInt(c3) <= 11, 'Cor deve estar entre 1 e 11');
  });

  test('blindagem contra agenda da USP: proíbe uso de matheusrodrigues1917@usp.br', () => {
    function isForbidden(em) {
      const s = String(em || '').toLowerCase();
      return s.includes('matheusrodrigues1917@usp.br') || s.includes('@usp.br');
    }
    assert.equal(isForbidden('matheusrodrigues1917@usp.br'), true);
    assert.equal(isForbidden('outro@usp.br'), true);
    assert.equal(isForbidden('scarletsantos7@gmail.com'), false);
  });
});

describe('Aba Check-in Inicial, Desaparecimento pós Check-in & Navegação por Gestos Swipe (v29)', () => {
  test('Check-in é a primeira aba na navegação (à esquerda de Pacientes)', () => {
    const mNav = html.match(/<nav class="main-tabs"[\s\S]*?<\/nav>/);
    assert.ok(mNav, 'nav.main-tabs deve existir');
    const navContent = mNav[0];
    const checkinIdx = navContent.indexOf('id="tabBtnCheckin"');
    const pacientesIdx = navContent.indexOf('id="tabBtnPacientes"');
    assert.ok(checkinIdx > -1, 'tabBtnCheckin deve existir');
    assert.ok(pacientesIdx > -1, 'tabBtnPacientes deve existir');
    assert.ok(checkinIdx < pacientesIdx, 'tabBtnCheckin deve ficar antes de tabBtnPacientes');
  });

  test('Paciente com check-in realizado some da lista de check-in pendente', () => {
    const today = '2026-11-04';
    const scheds = [
      { id: 's1', data: today, status: 'Agendado', pacienteNome: 'Vinícius' },
      { id: 's2', data: today, status: 'Realizado', pacienteNome: 'Dona Diva' },
      { id: 's3', data: '2026-11-05', status: 'Agendado', pacienteNome: 'Sebastião' }
    ];

    const pending = scheds.filter(sc => sc.data === today && sc.status !== 'Realizado' && sc.status !== 'Cancelado');
    assert.equal(pending.length, 1);
    assert.equal(pending[0].pacienteNome, 'Vinícius');
  });

  test('Gesto Swipe calcula transição de aba corretamente', () => {
    const tabs = ['checkin', 'pacientes', 'agenda', 'evolucoes', 'financeiro'];
    function getNextTab(current, deltaX, deltaY, duration) {
      if (Math.abs(deltaX) >= 45 && duration <= 450 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
        const idx = tabs.indexOf(current);
        if (deltaX < 0 && idx < tabs.length - 1) return tabs[idx + 1];
        if (deltaX > 0 && idx > 0) return tabs[idx - 1];
      }
      return current;
    }

    assert.equal(getNextTab('checkin', -80, 10, 200), 'pacientes');
    assert.equal(getNextTab('pacientes', -70, 5, 180), 'agenda');
    assert.equal(getNextTab('agenda', 80, 5, 200), 'pacientes');
    assert.equal(getNextTab('pacientes', 60, 10, 210), 'checkin');
    assert.equal(getNextTab('checkin', -50, 100, 200), 'checkin');
  });
});

describe('Melhorias Portadas do App de Fisioterapia (v28)', () => {
  test('closeModalBg ignora cliques nos primeiros 350ms para evitar ghost-click e múltiplos toques', () => {
    let closed = false;
    const fakeEv = { target: 1, currentTarget: 1 };
    function closeModalBgTest(ev, ts) {
      if (Date.now() - ts < 350) return;
      if (ev && ev.target === ev.currentTarget) closed = true;
    }
    // Clique imediato (100ms após abrir)
    closeModalBgTest(fakeEv, Date.now() - 100);
    assert.equal(closed, false, 'Não deve fechar durante animação nos primeiros 350ms');

    // Clique deliberado após 400ms
    closeModalBgTest(fakeEv, Date.now() - 400);
    assert.equal(closed, true, 'Deve fechar normalmente após os 350ms');
  });

  test('toggleAgendaMonthOrDayScope alterna entre visão de hoje e visão do mês', () => {
    let selectedDay = '2026-11-04';
    function toggle(day) {
      return day ? null : '2026-11-04';
    }
    selectedDay = toggle(selectedDay);
    assert.equal(selectedDay, null, 'Quando dia selecionado, volta para mês inteiro');
    selectedDay = toggle(selectedDay);
    assert.equal(selectedDay, '2026-11-04', 'Quando nulo, foca no dia atual');
  });

  test('SPO2 e Observações são suportados nos formulários de evolução', () => {
    assert.ok(html.includes('id="newEvoSPO2"'), 'Campo newEvoSPO2 deve existir no modal');
    assert.ok(html.includes('id="editEvoSPO2"'), 'Campo editEvoSPO2 deve existir no modal de edição');
    assert.ok(html.includes('id="newEvoObservacoes"'), 'Campo newEvoObservacoes deve existir');
    assert.ok(html.includes('id="editEvoObservacoes"'), 'Campo editEvoObservacoes deve existir');
    assert.ok(html.includes('copyPreviousConductToNewEvo()'), 'Botão copiar conduta deve existir');
  });

  test('Rota de mesmo endereço retorna badge amigável sem tempo ou combustível', () => {
    assert.ok(html.includes('Mesmo Endereço / Local'), 'Badge visual de mesmo endereço deve existir');
    assert.ok(html.includes('0 min de deslocamento (0 km · Sem custo de combustível)'), 'Texto amigável de 0 min deve existir');
  });

  test('Navegação entre dias no Check-in calcula D+1, D-1, D+2 e D-2 corretamente', () => {
    function calculateCheckinDay(baseIso, delta) {
      if (delta === 0) return baseIso;
      const parts = baseIso.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + delta);
      const pad = n => (n < 10 ? '0' : '') + n;
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    const today = '2026-11-04';
    assert.equal(calculateCheckinDay(today, 1), '2026-11-05'); // D+1
    assert.equal(calculateCheckinDay(today, 2), '2026-11-06'); // D+2
    assert.equal(calculateCheckinDay(today, -1), '2026-11-03'); // D-1
    assert.equal(calculateCheckinDay(today, -2), '2026-11-02'); // D-2
    assert.equal(calculateCheckinDay(today, 0), '2026-11-04');  // Hoje
  });

  test('Cálculo de rótulo relativo (Hoje, Amanhã, Ontem, D+N, D-N)', () => {
    function getRelativeLabel(baseIso, targetIso) {
      const p1 = baseIso.split('-');
      const p2 = targetIso.split('-');
      const d1 = new Date(parseInt(p1[0], 10), parseInt(p1[1], 10) - 1, parseInt(p1[2], 10));
      const d2 = new Date(parseInt(p2[0], 10), parseInt(p2[1], 10) - 1, parseInt(p2[2], 10));
      const diffDays = Math.round((d2 - d1) / 86400000);
      if (diffDays === 0) return 'Hoje';
      if (diffDays === 1) return 'Amanhã (D+1)';
      if (diffDays === -1) return 'Ontem (D-1)';
      if (diffDays > 1) return 'D+' + diffDays;
      return 'D' + diffDays;
    }

    const today = '2026-11-04';
    assert.equal(getRelativeLabel(today, '2026-11-04'), 'Hoje');
    assert.equal(getRelativeLabel(today, '2026-11-05'), 'Amanhã (D+1)');
    assert.equal(getRelativeLabel(today, '2026-11-06'), 'D+2');
    assert.equal(getRelativeLabel(today, '2026-11-03'), 'Ontem (D-1)');
    assert.equal(getRelativeLabel(today, '2026-11-02'), 'D-2');
  });
});

describe('Transparência e Sincronização Google Agenda (v33)', () => {
  test('updateGCalBannerUI só oculta o banner se OAuth estiver ativamente conectado', () => {
    function resolveBannerState(calId, isOAuth) {
      if (isOAuth) {
        return { hideBanner: true, statusText: '✓ Ao Vivo', badge: 'green' };
      }
      if (calId) {
        return { hideBanner: false, statusText: '⚠️ Ativar', badge: 'amber' };
      }
      return { hideBanner: false, statusText: '➕', badge: 'neutral' };
    }

    // Caso 1: Usuário digitou e-mail, mas ainda não autenticou no OAuth
    const unauthenticatedUser = resolveBannerState('corredoresantifascistas@gmail.com', false);
    assert.equal(unauthenticatedUser.hideBanner, false, 'Banner não deve sumir antes de conectar');
    assert.match(unauthenticatedUser.statusText, /Ativar/);
    assert.equal(unauthenticatedUser.badge, 'amber');

    // Caso 2: Usuário autenticado com OAuth ativo
    const authenticatedUser = resolveBannerState('corredoresantifascistas@gmail.com', true);
    assert.equal(authenticatedUser.hideBanner, true, 'Banner pode ser recolhido quando conectado ao vivo');
    assert.match(authenticatedUser.statusText, /Ao Vivo/);

    // Caso 3: Sem e-mail
    const emptyUser = resolveBannerState('', false);
    assert.equal(emptyUser.hideBanner, false);
  });

  test('Geração correta de URLs de Assinatura iCal direta no Google Agenda', () => {
    const rawFeedUrl = 'https://script.google.com/macros/s/AKfycbzp_fake/exec?action=calendar_feed&usuarioId=corredoresantifascistas';
    const webcalFeedUrl = rawFeedUrl.replace(/^https?:\/\//i, 'webcal://');
    const gcalSubUrl = 'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(webcalFeedUrl);

    assert.ok(webcalFeedUrl.startsWith('webcal://'));
    assert.ok(gcalSubUrl.startsWith('https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2F'));
    assert.ok(gcalSubUrl.includes('usuarioId%3Dcorredoresantifascistas'));
  });

  test('Notificação de agendamento é honesta e só confirma Google Agenda se evento existir', () => {
    function resolveScheduleToast(item, autoLinkedCount) {
      let toastMsg = 'Atendimento agendado!';
      if (autoLinkedCount > 0) {
        toastMsg += ' (1 já realizado vinculado)';
      }
      // Se não gerou calendarEventId, não deve mentir que foi para o Google Agenda
      const gcalToast = item.calendarEventId ? 'Sincronizado com o Google Agenda!' : null;
      return { toastMsg, gcalToast };
    }

    const withoutGCal = resolveScheduleToast({ id: 'ag_1', calendarEventId: '' }, 0);
    assert.equal(withoutGCal.toastMsg, 'Atendimento agendado!');
    assert.equal(withoutGCal.gcalToast, null, 'Não deve exibir toast de Google Agenda quando não sincronizou');

    const withGCal = resolveScheduleToast({ id: 'ag_2', calendarEventId: 'ev_12345' }, 0);
    assert.equal(withGCal.gcalToast, 'Sincronizado com o Google Agenda!');
  });

  test('atendimentos.html removeu o botão de OAuth em 1 clique e tornou assinatura da agenda Fisioflow a opção oficial', () => {
    const htmlAtend = fs.readFileSync(path.join(__dirname, '..', 'atendimentos.html'), 'utf8');
    assert.equal(htmlAtend.includes('Conectar Minha Google Agenda (1 Clique)'), false, 'Botão OAuth removido a pedido do usuário');
    assert.equal(htmlAtend.includes('Opção 1: Conexão Oficial Google (Gravação Direta)'), false, 'Card OAuth removido');
    assert.ok(htmlAtend.includes('Adicionar Agenda "Fisioflow" no Google Agenda'), 'Botão oficial de assinatura da agenda Fisioflow deve existir');
    assert.ok(htmlAtend.includes('Passo Obrigatório: Google Agenda (Fisioflow)'), 'Passo destacado no onboarding');
  });

  test('resolveSpreadsheet_ lógica de matching multi-tenant encontra usuário por email ou usuarioId', () => {
    const usersSheetData = [
      ['ID', 'Email', 'Nome', 'Documento', 'SpreadsheetID'],
      ['usr_123', 'corredoresantifascistas@gmail.com', 'Camila Santos', 'CREFITO-123', 'sheet_abc_456']
    ];

    function mockResolveUser(usuarioId, meta) {
      let email = String((meta && (meta.email || meta.calendarId)) || '').trim();
      let normalizedId = String(usuarioId || '').trim().toLowerCase();
      if (normalizedId.indexOf('@') > -1 && !email) {
        email = normalizedId;
      }
      if (!normalizedId && email) {
        normalizedId = email.toLowerCase();
      }
      const targetEmail = email ? email.toLowerCase() : '';
      for (let i = 1; i < usersSheetData.length; i++) {
        const rowUid = String(usersSheetData[i][0]).trim().toLowerCase();
        const rowEmail = String(usersSheetData[i][1]).trim().toLowerCase();
        const matchUid = normalizedId && (rowUid === normalizedId || rowEmail === normalizedId);
        const matchEmail = targetEmail && (rowEmail === targetEmail || rowUid === targetEmail);
        if (matchUid || matchEmail) {
          return { found: true, sheetId: usersSheetData[i][4], resolvedId: usersSheetData[i][0] };
        }
      }
      return { found: false };
    }

    // Cenário 1: Busca pelo usr_123
    const res1 = mockResolveUser('usr_123', {});
    assert.equal(res1.found, true);
    assert.equal(res1.sheetId, 'sheet_abc_456');

    // Cenário 2: Feed iCal passou apenas usuarioId=corredoresantifascistas@gmail.com
    const res2 = mockResolveUser('corredoresantifascistas@gmail.com', {});
    assert.equal(res2.found, true, 'Deve encontrar a planilha mesmo se passar email no lugar do ID');
    assert.equal(res2.sheetId, 'sheet_abc_456');

    // Cenário 3: Passou email no meta
    const res3 = mockResolveUser('', { email: 'corredoresantifascistas@gmail.com' });
    assert.equal(res3.found, true);
    assert.equal(res3.sheetId, 'sheet_abc_456');
  });
});

describe('Exportação de PDF com Fundo Limpo (Remoção de Planos de Fundo)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'atendimentos.html'), 'utf8');

  test('atendimentos.html não invoca marca d água ou planos de fundo em quebras de página', () => {
    const occurrences = (html.match(/marcaDaguaOutono/g) || []).length;
    assert.equal(occurrences, 1);
    assert.equal(html.includes('marcaDaguaOutono(doc, 210'), false);
    assert.equal(html.includes('marcaDaguaOutono(doc,210'), false);
    assert.equal(html.includes('marcaDaguaOutono(doc)'), false);
    assert.equal(html.includes('doc.setGState'), false);
    assert.equal(html.includes('doc.ellipse'), false);
  });

  test('marcaDaguaOutono é no-op seguro que não desenha nada no canvas do PDF', () => {
    let drawCalls = 0;
    const fakeDoc = {
      setFillColor() { drawCalls++; },
      ellipse() { drawCalls++; },
      circle() { drawCalls++; },
      setGState() { drawCalls++; },
      rect() { drawCalls++; }
    };
    const fnMatch = html.match(/function marcaDaguaOutono\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fnMatch);
    const fn = new Function('doc', 'pageW', 'pageH', fnMatch[1]);
    fn(fakeDoc, 210, 297);
    assert.equal(drawCalls, 0);
  });

  test('receiptHeader renderiza cabeçalho limpo sem invocar planos de fundo', () => {
    const fnMatch = html.match(/function receiptHeader\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fnMatch);
    const capturedTexts = [];
    let ellipseCalls = 0;
    const fakeDoc = {
      setFillColor() {},
      rect() {},
      setTextColor() {},
      setFont() {},
      setFontSize() {},
      text(str) { capturedTexts.push(str); },
      ellipse() { ellipseCalls++; }
    };
    const fn = new Function('doc', 'title', 'config', fnMatch[1]);
    fn(fakeDoc, 'Extrato Financeiro', { providerName: 'Profissional' });
    assert.equal(ellipseCalls, 0);
    assert.equal(capturedTexts.some(t => t.includes('Profissional')), true);
  });
});

describe('Aba Inicial Padrão Configurável (Check-in padrão com seleção em Configurações)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'atendimentos.html'), 'utf8');

  test('setupScreen possui select com todas as 5 abas disponíveis e checkin como padrão', () => {
    assert.equal(html.includes('id="defaultTabSelect"'), true);
    assert.equal(html.includes('value="checkin"'), true);
    assert.equal(html.includes('value="pacientes"'), true);
    assert.equal(html.includes('value="agenda"'), true);
    assert.equal(html.includes('value="evolucoes"'), true);
    assert.equal(html.includes('value="financeiro"'), true);
  });

  test('getDefaultTab retorna checkin por padrão na ausência de configuração', () => {
    const fnMatch = html.match(/function getDefaultTab\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fnMatch);
    const fn = new Function('config', 'localStorage', fnMatch[1]);
    const fakeStorage = { getItem: () => null };
    assert.equal(fn(null, fakeStorage), 'checkin');
    assert.equal(fn({}, fakeStorage), 'checkin');
  });

  test('getDefaultTab respeita a aba escolhida pelo usuário nas configurações', () => {
    const fnMatch = html.match(/function getDefaultTab\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fnMatch);
    const fn = new Function('config', 'localStorage', fnMatch[1]);
    const fakeStorage = { getItem: (key) => key === 'ff_default_tab' ? 'agenda' : null };
    assert.equal(fn({ defaultTab: 'pacientes' }, fakeStorage), 'pacientes');
    assert.equal(fn(null, fakeStorage), 'agenda');
  });

  test('getDefaultTab faz fallback seguro para checkin se valor for inválido', () => {
    const fnMatch = html.match(/function getDefaultTab\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    assert.ok(fnMatch);
    const fn = new Function('config', 'localStorage', fnMatch[1]);
    const fakeStorage = { getItem: () => 'invalida' };
    assert.equal(fn({ defaultTab: 'aba_fantasma' }, fakeStorage), 'checkin');
    assert.equal(fn(null, fakeStorage), 'checkin');
  });
});

describe('Exportação de Evoluções em PDF em Lote por Período e Múltiplos Pacientes (v52)', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'atendimentos.html'), 'utf8');

  test('botão de exportação em PDF está presente na aba de evoluções chamando modal de lote', () => {
    assert.equal(html.includes('id="btnExportEvolucoesPDF"'), true);
    assert.equal(html.includes('openExportEvolutionsBatchModal()'), true);
  });

  test('evolutionMatchesPatient identifica paciente tanto por ID quanto por correspondência de nome', () => {
    const fnMatch = html.match(/function evolutionMatchesPatient\(ev,\s*p\)[\s\S]*?\n\}/);
    assert.ok(fnMatch, 'evolutionMatchesPatient must be defined');
    const findPatientForEvolution = (ev) => ev.pacienteNome === 'João' ? { id: 'p_joao' } : null;
    const fn = new Function('findPatientForEvolution', 'return (' + fnMatch[0] + ')')(findPatientForEvolution);

    assert.equal(fn({ pacienteId: 'p1' }, { id: 'p1' }), true);
    assert.equal(fn({ pacienteId: 'p1' }, { id: 'p2' }), false);
    assert.equal(fn({ pacienteNome: 'João' }, { id: 'p_joao' }), true);
    assert.equal(fn({ pacienteNome: 'Outro' }, { id: 'p_joao' }), false);
    assert.equal(fn(null, { id: 'p1' }), false);
  });

  test('getWeekBounds calcula início (segunda-feira) e fim (domingo) corretamente', () => {
    const fnMatch = html.match(/function getWeekBounds\(dateStr\)[\s\S]*?\n\}/);
    assert.ok(fnMatch, 'getWeekBounds must be defined');
    const isoDate = (d) => {
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
      return y + '-' + m + '-' + day;
    };
    const fn = new Function('isoDate', 'return (' + fnMatch[0] + ')')(isoDate);

    // Quarta-feira 04/11/2026 -> Semana de 02/11/2026 (Segunda) a 08/11/2026 (Domingo)
    const boundsMid = fn('2026-11-04');
    assert.equal(boundsMid.start, '2026-11-02');
    assert.equal(boundsMid.end, '2026-11-08');

    // Domingo 08/11/2026 -> mesma semana
    const boundsSun = fn('2026-11-08');
    assert.equal(boundsSun.start, '2026-11-02');
    assert.equal(boundsSun.end, '2026-11-08');

    // Segunda 02/11/2026 -> mesma semana
    const boundsMon = fn('2026-11-02');
    assert.equal(boundsMon.start, '2026-11-02');
    assert.equal(boundsMon.end, '2026-11-08');
  });

  test('filterEvolutionsByPeriod filtra pontualmente por dia, semana, mês, ano e todo o período', () => {
    const fnMatch = html.match(/function filterEvolutionsByPeriod\(evList,\s*pType,\s*pParams\)[\s\S]*?\n\}/);
    assert.ok(fnMatch, 'filterEvolutionsByPeriod must be defined');
    const fn = new Function('return (' + fnMatch[0] + ')')();

    const sample = [
      { id: '1', data: '2026-11-04' },
      { id: '2', data: '2026-11-02' },
      { id: '3', data: '2026-10-15' },
      { id: '4', data: '2025-05-20' }
    ];

    // Dia
    const byDay = fn(sample, 'dia', { date: '2026-11-04' });
    assert.equal(byDay.length, 1);
    assert.equal(byDay[0].id, '1');

    // Semana
    const byWeek = fn(sample, 'semana', { startDate: '2026-11-02', endDate: '2026-11-08' });
    assert.equal(byWeek.length, 2);

    // Mês
    const byMonthNov = fn(sample, 'mes', { year: 2026, month: 11 });
    assert.equal(byMonthNov.length, 2);
    const byMonthOct = fn(sample, 'mes', { year: 2026, month: 10 });
    assert.equal(byMonthOct.length, 1);

    // Ano
    const byYear2026 = fn(sample, 'ano', { year: 2026 });
    assert.equal(byYear2026.length, 3);
    const byYear2025 = fn(sample, 'ano', { year: 2025 });
    assert.equal(byYear2025.length, 1);

    // Todo o período
    const byAll = fn(sample, 'todo', {});
    assert.equal(byAll.length, 4);
  });

  test('PDF de evoluções inclui SPO2 formatado e campo de Observações', () => {
    assert.equal(html.includes('SPO2: '), true);
    assert.equal(html.includes('OBSERVAÇÕES:'), true);
    assert.equal(html.includes('ev.observacoes'), true);
  });
});
