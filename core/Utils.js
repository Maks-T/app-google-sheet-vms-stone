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
    .requireValueInList(['В очереди', 'Готов', 'Ошибка'], true)
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