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
    assert.match(url, /text=Fisioterapia%20-%20Dona%20Maria/);
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
    assert.match(feed, /VERSION:2\.0/);
    assert.match(feed, /BEGIN:VEVENT/);
    assert.match(feed, /UID:ag_test_1@fisioflow/);
    assert.match(feed, /DTSTART:20261110T140000/);
    assert.match(feed, /DTEND:20261110T145000/);
    assert.match(feed, /SUMMARY:Fisioterapia: Dona Maria/);
    assert.match(feed, /END:VCALENDAR/);
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
    assert.equal(r.distanceKm, 0.4);
    assert.equal(r.durationMin, 2);
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





