/**
 * core/Utils.js — Системные вспомогательные функции и утилиты
 */

function cleanProductUrl(url) {
  if (!url) return '';
  return url.split('?')[0].replace(/\/+$/, '') + '/';
}

function cleanHtmlText(text) {
  if (!text) return '';
  return text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function transliterate(word) {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  return word.split('').map(letter => ru[letter] || letter).join('');
}

function applyHeaderStyles(sheet, headers, notes) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground('#334155');
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  range.setFontSize(10);
  range.setVerticalAlignment('middle');
  range.setHorizontalAlignment('center');

  for (let i = 0; i < notes.length; i++) {
    sheet.getRange(1, i + 1).setNote(notes[i]);
  }

  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
}

function setupSelfSufficientSheetLayout(sheet) {
  sheet.clear();
  applyHeaderStyles(sheet, GDK_CONFIG.SHEET_COLUMNS, GDK_CONFIG.COLUMN_NOTES);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(GDK_CONFIG.STATUS_OPTIONS, true)
    .build();
  sheet.getRange('A2:A2000').setDataValidation(statusRule);

  sheet.getRange('J2:L2000').setNumberFormat('#,##0');
  sheet.getRange('M2:N2000').setNumberFormat('#,##0 "₽"');

  autoFitColumns(sheet, GDK_CONFIG.SHEET_COLUMNS.length);
  sheet.setColumnWidth(4, 280);
  sheet.setColumnWidth(16, 260);
}

function autoFitColumns(sheet, count) {
  for (let col = 1; col <= count; col++) {
    sheet.autoResizeColumn(col);
    const width = sheet.getColumnWidth(col);
    sheet.setColumnWidth(col, Math.max(width + 20, 115));
  }
}

function setColumnValidation(sheet, rangeA1, valuesList, allowInvalid) {
  if (!valuesList || valuesList.length === 0) {
    sheet.getRange(rangeA1).clearDataValidations();
    return;
  }
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(valuesList, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(rangeA1).setDataValidation(rule);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function generateGdkExternalCode(brandCode, slugOrName, width, thickness) {
  const brandShort = (brandCode || '').replace(/^opt_brand_/, '').replace(/-/g, '_');
  let cleanSlug = (slugOrName || '')
    .toLowerCase()
    .replace(/https?:\/\/[^\/]+\/(?:katalog\/item|magazin\/product|katalog)\//, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 60);

  const dimsPart = (width && thickness) ? `_${width}_${thickness}` : '';
  return `odk_${brandShort || 'item'}_${cleanSlug}${dimsPart}`.replace(/_+/g, '_');
}

function findCatalogSheet(ss, meta) {
  let sheet = ss.getSheetByName(meta.sheetName);
  if (!sheet && meta.altNames) {
    for (const alt of meta.altNames) {
      sheet = ss.getSheetByName(alt);
      if (sheet) {
        sheet.setName(meta.sheetName);
        break;
      }
    }
  }
  return sheet;
}

function padCatalogRow(row) {
  const size = GDK_CONFIG.SHEET_COLUMNS.length;
  const out = row.slice(0, size);
  while (out.length < size) out.push('');
  return out;
}

// ручная позиция: есть sku, нет ссылки
function isManualCatalogRow(row) {
  const sku = String(row[2] || '').trim();
  const url = String(row[15] || '').trim();
  return !!sku && !url.startsWith('http');
}

function readManualCatalogRows(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const width = Math.max(sheet.getLastColumn(), 1);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  return values.filter(isManualCatalogRow).map(padCatalogRow);
}

function resolveCatalogType(sheetType, name, sku) {
  const lowerName = String(name || '').toLowerCase();
  const lowerSku = String(sku || '').toLowerCase();
  if (sheetType === 'brackets' && (lowerName.includes('саморез') || lowerName.includes('шуруп') || lowerSku.includes('screw'))) {
    return 'fasteners';
  }
  if (sheetType === 'fenceProfile' && (lowerName.includes('рейк') || lowerSku.includes('lath'))) {
    return 'lath';
  }
  return sheetType;
}

// sku → { type, name, sheet, brand, color, attrs }
function buildCatalogIndex(ss) {
  const index = new Map();
  GDK_CONFIG.CATALOG_SHEETS.forEach(meta => {
    const sheet = findCatalogSheet(ss, meta);
    if (!sheet || sheet.getLastRow() < 2) return;
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, GDK_CONFIG.SHEET_COLUMNS.length).getValues();
    values.forEach(row => {
      const sku = String(row[2] || '').trim();
      if (!sku || index.has(sku)) return;
      const name = String(row[3] || '').trim();
      index.set(sku, {
        type: resolveCatalogType(meta.type, name, sku),
        name: name,
        sheet: meta.sheetName,
        brand: String(row[4] || '').trim(),
        color: String(row[7] || '').trim().toLowerCase(),
        attrs: parseExtraEav(row[18])
      });
    });
  });
  return index;
}

function parseExtraEav(text) {
  const out = {};
  String(text || '').split(/[;\n]/).forEach(part => {
    const idx = part.indexOf('=');
    if (idx < 1) return;
    const key = part.slice(0, idx).trim();
    const raw = part.slice(idx + 1).trim();
    if (!key) return;
    if (raw === 'true' || raw === 'false') out[key] = raw === 'true';
    else if (raw !== '' && !isNaN(Number(raw.replace(',', '.')))) out[key] = Number(raw.replace(',', '.'));
    else out[key] = raw;
  });
  return out;
}

function formatExtraEav(obj) {
  return Object.keys(obj).map(k => k + '=' + obj[k]).join('; ');
}

function md5Hex(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

// ссылка на фото → путь для импорта; уже локальный путь не трогаем
function toImportImagePath(url) {
  const src = String(url || '').trim();
  if (!src) return null;
  if (!/^https?:\/\//i.test(src)) return src;

  const path = src.replace(/^https?:\/\/[^\/]+/i, '').split(/[?#]/)[0];
  const cfg = GDK_CONFIG.IMAGES;
  if (cfg.PLACEHOLDERS.some(p => path === p)) return null;
  if (cfg.MODE !== 'local') return src;

  const fileName = path.split('/').pop() || '';
  const baseName = fileName.replace(/\.[^.]+$/, '');
  if (!baseName) return src;
  return cfg.DIR + '/' + baseName + '_' + md5Hex(path).slice(0, 6) + '.' + cfg.EXT;
}

// "Профильная труба 60х40х2" → { width: 60, height: 40, wall: 2 }
function parseProfileFromName(name) {
  const m = /(\d{2,3})\s*[xхХX×*]\s*(\d{2,3})(?:\s*[xхХX×*]\s*(\d{1,2}(?:[.,]\d)?))?/.exec(String(name || ''));
  if (!m) return null;
  return {
    width: parseInt(m[1], 10),
    height: parseInt(m[2], 10),
    wall: m[3] ? parseFloat(m[3].replace(',', '.')) : null
  };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
