/**
 * sheets/AutoBindings.js — Автозаполнение листов привязок из каталога
 */

var AUTO_SETTINGS_SHEET = 'Настройки автопривязок';

var AUTO_SETTINGS_COLUMNS = ['pipeline', 'parent_type', 'role', 'target', 'include', 'exclude', 'default_value', 'enabled'];

var AUTO_SETTINGS_NOTES = [
  'Пайплайн',
  'Тип родителя',
  'Роль (слот)',
  'Тип дочернего товара или scalar',
  'Слова в названии дочернего товара. "+" = И, "|" = ИЛИ. Пример: промежуточ+№7|рядов',
  'Исключить товары с этими словами в названии, синтаксис тот же',
  'Для скаляров: значение по умолчанию. Значение из extra_eav товара (holes=4) важнее',
  'FALSE — роль не заполнять'
];

// стартовые фильтры: только слова из названий, без SKU
var AUTO_SEEDS = {
  'pl_terrace|terraceBoard|startClip': ['промежуточ+№9', ''],
  'pl_terrace|terraceBoard|baseClip': ['промежуточ+№7+металлопроф', ''],
  'pl_terrace|board|fixing': ['4,2|4.2', ''],
  'pl_terrace|stepBoard|noseSize': ['', '', '20'],
  'pl_terrace|brackets|holes': ['', '', '1'],
  'pl_fence|pillar|bracket': ['столб', ''],
  'pl_fence|pillar|bracketFastener': ['3,5|3.5', ''],
  'pl_fence|pillar|accessories': ['крышк|юбк', ''],
  'pl_fence|baluster|bracket': ['балясин', ''],
  'pl_fence|baluster|bracketFastener': ['3,5|3.5', ''],
  'pl_fence|rail|bracket': ['перил', ''],
  'pl_fence|rail|bracketFastener': ['3,5|3.5', ''],
  'pl_fence|fenceProfile|bracket': ['уголок|угол', ''],
  'pl_fence|fenceProfile|bracketFastener': ['саморез', ''],
  'pl_fence|fenceProfile|lathFastener': ['саморез', ''],
  'pl_fence|lath|lathFastener': ['саморез', ''],
  'pl_fence|brackets|holes': ['', '', '2'],
  'pl_joist|joist|fixing': ['4,2|4.2', ''],
  'pl_stairs|stepBoard|stairClip': ['ступен', ''],
  'pl_stairs|stepBoard|clipFastener': ['4,8|4.8', ''],
  'pl_stairs|stepBoard|frameTube': ['40х40|40x40', ''],
  'pl_stairs|stepBoard|noseSize': ['', '', '20']
};

function setupAutoBindingSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, AUTO_SETTINGS_SHEET);
  const existing = readAutoBindingSettings(sheet);

  const rows = [];
  getAllPipelineDefinitions().forEach(pipeline => {
    Object.keys(pipeline.schema).forEach(parentType => {
      Object.keys(pipeline.schema[parentType]).forEach(role => {
        const slot = pipeline.schema[parentType][role];
        const key = pipeline.code + '|' + parentType + '|' + role;
        const old = existing[key];
        const seed = AUTO_SEEDS[key] || ['', '', ''];
        rows.push([
          pipeline.code,
          parentType,
          role,
          slot.target_type === 'scalar' ? 'scalar' : slot.target_code,
          old ? old.include : seed[0],
          old ? old.exclude : seed[1],
          old && old.defaultValue !== '' ? old.defaultValue : (seed[2] || ''),
          old ? old.enabled : true
        ]);
      });
    });
  });

  sheet.clear();
  applyHeaderStyles(sheet, AUTO_SETTINGS_COLUMNS, AUTO_SETTINGS_NOTES);
  sheet.getRange(2, 1, rows.length, AUTO_SETTINGS_COLUMNS.length).setValues(rows);
  sheet.getRange(2, 1, rows.length, 4).setFontColor('#64748B');
  setColumnValidation(sheet, `H2:H${rows.length + 1}`, ['TRUE', 'FALSE'], true);
  [110, 130, 130, 140, 300, 220, 110, 80].forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  return sheet;
}

function readAutoBindingSettings(sheet) {
  const out = {};
  if (!sheet || sheet.getLastRow() < 2) return out;
  sheet.getRange(2, 1, sheet.getLastRow() - 1, AUTO_SETTINGS_COLUMNS.length).getValues().forEach(r => {
    const key = r[0] + '|' + r[1] + '|' + r[2];
    out[key] = {
      include: String(r[4] || '').trim(),
      exclude: String(r[5] || '').trim(),
      defaultValue: r[6] === 0 ? '0' : String(r[6] || '').trim(),
      enabled: parseBool(r[7], true)
    };
  });
  return out;
}

// "a+b|c" → совпадает, если есть (a и b) или c
function matchesTerms(name, expr) {
  if (!expr) return false;
  const lower = String(name || '').toLowerCase();
  return expr.split('|').some(group => {
    const terms = group.split('+').map(t => t.trim().toLowerCase()).filter(Boolean);
    return terms.length > 0 && terms.every(t => lower.includes(t));
  });
}

// кандидаты по ярусам: тот же цвет → без цвета → остальные; внутри — сначала тот же бренд
function pickChildren(parent, candidates, isMultiple) {
  if (candidates.length === 0) return [];
  const byBrand = list => list.filter(c => c.brand && c.brand === parent.brand)
    .concat(list.filter(c => !(c.brand && c.brand === parent.brand)));
  const tiers = [
    candidates.filter(c => parent.color && c.color === parent.color),
    candidates.filter(c => !c.color),
    candidates.filter(c => c.color && c.color !== parent.color)
  ].map(byBrand);
  const tier = tiers.find(t => t.length > 0);
  return isMultiple ? tier : [tier[0]];
}

// existingRows: строки листа; возвращает новые строки
function generateBindingRows(pipeline, catalog, settings, existingRows) {
  const items = [];
  catalog.forEach((item, sku) => items.push(Object.assign({ sku: sku }, item)));

  const targetTypes = new Set();
  Object.values(pipeline.schema).forEach(slots => Object.values(slots).forEach(slot => {
    if (slot.target_type === 'product_type') targetTypes.add(slot.target_code);
  }));

  const rowKeys = new Set();
  const roleKeys = new Set();
  const referenced = new Set();
  const newRows = [];
  existingRows.forEach(r => {
    const p = String(r[BC.PARENT] || '').trim();
    const role = String(r[BC.ROLE] || '').trim();
    const c = String(r[BC.CHILD] || '').trim();
    if (!p || !role) return;
    rowKeys.add(p + '|' + role + '|' + c);
    roleKeys.add(p + '|' + role);
    if (c) referenced.add(c);
  });

  const add = (parent, role, child, value, slot) => {
    const key = parent.sku + '|' + role + '|' + (child ? child.sku : '');
    if (rowKeys.has(key)) return;
    rowKeys.add(key);
    roleKeys.add(parent.sku + '|' + role);
    if (child) referenced.add(child.sku);
    const row = new Array(BINDING_COLUMNS.length).fill('');
    row[BC.PARENT] = parent.sku;
    row[BC.PARENT_NAME] = parent.name;
    row[BC.ROLE] = role;
    row[BC.CHILD] = child ? child.sku : '';
    row[BC.CHILD_NAME] = child ? child.name : '';
    row[BC.VALUE] = value;
    row[BC.FORMULA] = '1';
    row[BC.REQUIRED] = slot.is_required;
    row[BC.SORT] = 10;
    row[BC.CHECK] = 'авто';
    newRows.push(row);
  };

  const processParentType = parentType => {
    const slots = pipeline.schema[parentType];
    // только скаляры (holes, noseSize) — лишь для товаров, уже попавших в пайплайн
    const scalarOnly = Object.values(slots).every(slot => slot.target_type === 'scalar');
    const isRoot = !targetTypes.has(parentType);
    items.filter(p => p.type === parentType && (isRoot || !scalarOnly || referenced.has(p.sku))).forEach(parent => {
      Object.keys(slots).forEach(role => {
        const slot = slots[role];
        const cfg = settings[pipeline.code + '|' + parentType + '|' + role] || { include: '', exclude: '', defaultValue: '', enabled: true };
        if (!cfg.enabled) return;
        if (!slot.is_multiple && roleKeys.has(parent.sku + '|' + role)) return;

        if (slot.target_type === 'scalar') {
          const own = parent.attrs ? parent.attrs[role] : undefined;
          const value = own !== undefined && own !== '' ? String(own) : cfg.defaultValue;
          if (value !== '') add(parent, role, null, value, slot);
          return;
        }

        const candidates = items.filter(c => c.type === slot.target_code
          && c.sku !== parent.sku
          && (!cfg.include || matchesTerms(c.name, cfg.include))
          && !(cfg.exclude && matchesTerms(c.name, cfg.exclude)));
        pickChildren(parent, candidates, slot.is_multiple).forEach(child => add(parent, role, child, '', slot));
      });
    });
  };

  // корни, затем дочерние типы, пока появляются новые ссылки
  const types = Object.keys(pipeline.schema);
  types.filter(t => !targetTypes.has(t)).forEach(processParentType);
  for (let pass = 0; pass < types.length; pass++) {
    const before = newRows.length;
    types.filter(t => targetTypes.has(t)).forEach(processParentType);
    if (newRows.length === before) break;
  }

  return newRows;
}

function autoFillBindingSheets() {
  runAutoFill(false);
}

function rebuildBindingSheets() {
  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert('Пересоздать привязки', 'Все строки на листах "Привязки pl_*" будут удалены и созданы заново из каталога. Продолжить?', ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return;
  runAutoFill(true);
}

function runAutoFill(clearFirst) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let settingsSheet = ss.getSheetByName(AUTO_SETTINGS_SHEET);
  if (!settingsSheet) settingsSheet = setupAutoBindingSettingsSheet();
  const settings = readAutoBindingSettings(settingsSheet);
  const catalog = buildCatalogIndex(ss);
  const report = [];

  getAllPipelineDefinitions().forEach(pipeline => {
    const sheet = getOrCreateSheet(ss, getBindingSheetName(pipeline));
    setupBindingSheetLayout(sheet);
    if (clearFirst && sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, BINDING_COLUMNS.length).clearContent();
    }
    const existing = readBindingRows(sheet);
    const rows = generateBindingRows(pipeline, catalog, settings, existing);
    if (rows.length > 0) {
      const start = getLastBindingRow(sheet) + 1;
      sheet.getRange(start, 1, rows.length, BINDING_COLUMNS.length).setValues(rows);
    }
    refreshBindingDropdowns(sheet, pipeline, catalog);
    report.push(`${pipeline.code}: +${rows.length}`);
  });

  SpreadsheetApp.getUi().alert('Привязки из каталога', 'Добавлено строк: ' + report.join(', ') + '\nНовые строки помечены "авто". Проверьте их пунктом 6.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function getLastBindingRow(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 1;
  const values = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0] || '').trim()) return i + 2;
  }
  return 1;
}
