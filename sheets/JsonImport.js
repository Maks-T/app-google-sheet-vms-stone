/**
 * sheets/JsonImport.js — Загрузка привязок и недостающих товаров из import_data.json
 */

var EAV_HANDLED = ['brand', 'material', 'length_mm', 'width_mm', 'thickness_mm', 'source_url', 'product_calc_category'];
var EAV_HANDLED_PEDESTAL = ['brand', 'material', 'height_min', 'height_max', 'max_load_kg', 'source_url', 'product_calc_category'];

function showImportJsonDialog() {
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;font-size:13px">' +
    '<p style="margin:0 0 8px">Вставьте весь <b>import_data.json</b> или только массив <code>binding_rules</code>.</p>' +
    '<textarea id="t" style="width:100%;height:300px;font-family:monospace;font-size:11px"></textarea>' +
    '<p><label><input type="checkbox" id="r" checked> Привязки: заменить содержимое листов пайплайнов из файла</label><br>' +
    '<label><input type="checkbox" id="p" checked> Товары: добавить на листы каталога позиции, которых там нет (статус «Ручной»)</label></p>' +
    '<button id="b" onclick="run()">Загрузить</button> <span id="s"></span>' +
    '<script>function run(){var b=document.getElementById("b");b.disabled=true;document.getElementById("s").textContent="Загрузка...";' +
    'google.script.run.withSuccessHandler(function(m){document.getElementById("s").textContent=m;b.disabled=false;})' +
    '.withFailureHandler(function(e){document.getElementById("s").textContent="Ошибка: "+e.message;b.disabled=false;})' +
    '.importFromJsonText(document.getElementById("t").value,{rules:document.getElementById("r").checked,products:document.getElementById("p").checked});}</script>' +
    '</div>'
  ).setWidth(760).setHeight(480);
  SpreadsheetApp.getUi().showModalDialog(html, 'Загрузка из import_data.json');
}

function importFromJsonText(text, opts) {
  const data = JSON.parse(text);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const messages = [];

  if (opts.products && data.products) {
    const added = importMissingProducts(ss, data);
    messages.push('товаров добавлено: ' + added);
  }

  if (opts.rules) {
    const rules = Array.isArray(data) ? data : (data.binding_rules || []);
    messages.push(importBindingRules(ss, rules));
  }

  return messages.join('; ');
}

function importBindingRules(ss, rules) {
  const catalog = buildCatalogIndex(ss);
  const parts = [];
  const known = getAllPipelineDefinitions();

  known.forEach(pipeline => {
    const own = rules.filter(r => r.pipeline_external_code === pipeline.code);
    const sheet = getOrCreateSheet(ss, getBindingSheetName(pipeline));
    setupBindingSheetLayout(sheet);
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, BINDING_COLUMNS.length).clearContent();
    }
    if (own.length > 0) {
      const rows = own.map(r => bindingRowFromRule(r, catalog));
      sheet.getRange(2, 1, rows.length, BINDING_COLUMNS.length).setValues(rows);
    }
    refreshBindingDropdowns(sheet, pipeline, catalog);
    parts.push(pipeline.code + ': ' + own.length);
  });

  const unknown = rules.filter(r => !known.some(p => p.code === r.pipeline_external_code)).length;
  collectAllBindingRules(ss, true);
  return 'привязки ' + parts.join(', ') + (unknown ? '; пропущено правил неизвестных пайплайнов: ' + unknown : '');
}

function getColorNamesFromImport(data) {
  const map = {};
  const attr = (data.attributes || []).find(a => a.code === 'color');
  (attr ? attr.options : []).forEach(o => {
    map[o.external_code] = { slug: o.slug, name: (o.value && o.value.ru) || o.slug, hex: (o.meta && o.meta.hex) || '' };
  });
  return map;
}

// товар из JSON → строки листа каталога
function catalogRowsFromImportProduct(product, colors) {
  const type = String(product.product_type_external_code || '').replace(/^type_/, '');
  const eav = product.eav || {};
  const isPedestal = type === 'adjustable_pedestal';
  const handled = isPedestal ? EAV_HANDLED_PEDESTAL : EAV_HANDLED;
  const extra = {};
  Object.keys(eav).forEach(k => {
    if (!handled.includes(k) && eav[k] !== null && eav[k] !== '') extra[k] = eav[k];
  });
  if (eav.product_calc_category && eav.product_calc_category !== GDK_CONFIG.CALC_CATEGORIES[type]) {
    extra.product_calc_category = eav.product_calc_category;
  }
  const sourceUrl = product.source_url || eav.source_url || '';

  return (product.variants || []).map(v => {
    const ve = v.eav || {};
    const color = ve.color ? (colors[ve.color] || { slug: String(ve.color).replace(/^opt_/, ''), name: '', hex: '' }) : null;
    const variantExtra = Object.assign({}, extra);
    Object.keys(ve).forEach(k => {
      if (k !== 'color') variantExtra[k] = ve[k];
    });

    return padCatalogRow([
      sourceUrl ? 'Готов' : 'Ручной',
      product.external_code,
      v.sku || v.external_code,
      (v.name && v.name.ru) || (product.name && product.name.ru) || '',
      eav.brand || '',
      eav.material || '',
      color ? color.name : '',
      color ? color.slug : '',
      color ? color.hex : '',
      (isPedestal ? eav.height_min : eav.length_mm) || '',
      (isPedestal ? eav.height_max : eav.width_mm) || '',
      (isPedestal ? eav.max_load_kg : eav.thickness_mm) || '',
      v.price || '',
      v.cost_price || '',
      v.preview_picture || product.preview_picture || '',
      sourceUrl,
      'Импорт из JSON',
      v.stock === null || v.stock === undefined ? '' : v.stock,
      formatExtraEav(variantExtra)
    ]);
  });
}

function getCatalogSheetMetaForType(type) {
  const sheetType = type === 'lath' ? 'fenceProfile' : type;
  return GDK_CONFIG.CATALOG_SHEETS.find(m => m.type === sheetType) || null;
}

function importMissingProducts(ss, data) {
  const catalog = buildCatalogIndex(ss);
  const colors = getColorNamesFromImport(data);
  const bySheet = {};
  let added = 0;

  (data.products || []).forEach(product => {
    const type = String(product.product_type_external_code || '').replace(/^type_/, '');
    const meta = getCatalogSheetMetaForType(type);
    if (!meta) return;
    const rows = catalogRowsFromImportProduct(product, colors).filter(row => !catalog.has(row[2]));
    if (rows.length === 0) return;
    bySheet[meta.sheetName] = (bySheet[meta.sheetName] || []).concat(rows);
  });

  Object.keys(bySheet).forEach(sheetName => {
    const meta = GDK_CONFIG.CATALOG_SHEETS.find(m => m.sheetName === sheetName);
    let sheet = findCatalogSheet(ss, meta);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      setupSelfSufficientSheetLayout(sheet);
    }
    ensureCatalogHeaders(sheet);
    const rows = bySheet[sheetName];
    const startRow = getLastSkuRow(sheet) + 1;
    sheet.getRange(startRow, 1, rows.length, GDK_CONFIG.SHEET_COLUMNS.length).setValues(rows);
    added += rows.length;
  });

  return added;
}

// дописывает новые колонки stock / extra_eav в старые листы
function ensureCatalogHeaders(sheet) {
  const cols = GDK_CONFIG.SHEET_COLUMNS;
  const current = sheet.getRange(1, 1, 1, cols.length).getValues()[0];
  if (cols.every((c, i) => current[i] === c)) return;
  applyHeaderStyles(sheet, cols, GDK_CONFIG.COLUMN_NOTES);
  sheet.getRange('A2:A2000').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(GDK_CONFIG.STATUS_OPTIONS, true)
    .build());
}

function getLastSkuRow(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 1;
  const values = sheet.getRange(2, 3, last - 1, 1).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0] || '').trim()) return i + 2;
  }
  return 1;
}
