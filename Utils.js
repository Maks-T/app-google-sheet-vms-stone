/**
 * Utils.js — Системные константы, схемы листов и вспомогательные утилиты для OliverDeck VMS-NC
 */

const GDK_CONFIG = {
  CURRENCY: 'RUB',
  BASE_URL: 'https://oliverdeck.ru',

  // Коды продуктовых семейств VMS-NC (согласно контракту oliver-deck)
  FAMILIES: {
    DECKING_SYSTEM: {
      external_code: 'fam_decking_systems',
      code: 'decking_system',
      name: { ru: 'Террасный настил', en: 'Terrace Decking Systems' }
    },
    HARDWARE_ACCESSORY: {
      external_code: 'fam_hardware_accessories',
      code: 'hardware_accessory',
      name: { ru: 'Комплектующие и крепеж', en: 'Hardware & Accessories' }
    }
  },

  // Точные коды типов товаров платформы VMS-NC
  PRODUCT_TYPES: {
    'terraceBoard': 'type_terraceBoard',
    'board': 'type_board',
    'stepBoard': 'type_stepBoard',
    'brackets': 'type_brackets',
    'decorProducts': 'type_decorProducts',
    'joist': 'type_joist',
    'adjustable_pedestal': 'type_adjustable_pedestal',
    'foundation_beam': 'type_foundation_beam',
    'screw_pile': 'type_screw_pile',
    'pile_cap': 'type_pile_cap',
    'rebar': 'type_rebar'
  },

  // Системные UUID категорий калькулятора (из эталона import_data.json)
  CALC_CATEGORIES: {
    'terraceBoard': 'f094F3QohaIRmvFaEAmJe2',
    'board': 'DbCTg4CIhiUHCNZZ28u2Q3',
    'stepBoard': 'W3licD2wgMnrMppMVZ7Yo0',
    'brackets': '7-ZHjGVRi90X2pkVocJLo1',
    'decorProducts': '635W7TuejTCwFMGmOmgSQ2',
    'joist': '7-ZHjGVRi90X2pkVocJLo1'
  },

  // Единая схема колонок для всех самодостаточных листов каталога
  SHEET_COLUMNS: [
    'status',
    'product_code',
    'sku',
    'name',
    'brand',
    'material',
    'color_name',
    'color_slug',
    'color_hex',
    'length_mm',
    'width_mm',
    'thickness_mm',
    'price_retail',
    'cost_price',
    'image_url',
    'product_url',
    'comment'
  ],

  COLUMN_NOTES: [
    'Статус: В очереди / Готов / Ошибка',
    'Системный код товара (external_code: gdk_...)',
    'Артикул модификации SKU',
    'Наименование товара',
    'Бренд (opt_brand_...)',
    'Материал изделия',
    'Наименование цвета',
    'Слаг цвета',
    'HEX-код цвета',
    'Длина, мм',
    'Ширина, мм',
    'Толщина, мм',
    'Розничная цена, KZT',
    'Себестоимость, KZT',
    'Ссылка на фото (CDN)',
    'URL страницы товара',
    'Результат и логи'
  ]
};

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

/**
 * Настройка оформления любого самодостаточного листа каталога
 */
function setupSelfSufficientSheetLayout(sheet) {
  sheet.clear();
  applyHeaderStyles(sheet, GDK_CONFIG.SHEET_COLUMNS, GDK_CONFIG.COLUMN_NOTES);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['В очереди', 'Готов', 'Ошибка'], true)
    .build();
  sheet.getRange('A2:A2000').setDataValidation(statusRule);

  // Форматирование чисел и валюты RUB
  sheet.getRange('J2:L2000').setNumberFormat('#,##0');
  sheet.getRange('M2:N2000').setNumberFormat('#,##0 "₽"');

  autoFitColumns(sheet, GDK_CONFIG.SHEET_COLUMNS.length);
  sheet.setColumnWidth(4, 280); // колонка name
  sheet.setColumnWidth(16, 260); // колонка product_url
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

/**
 * Генерация системного внешнего кода товара в формате gdk_brand_slug_dims
 */
function generateGdkExternalCode(brandCode, slugOrName, width, thickness) {
  const brandShort = (brandCode || '').replace(/^opt_brand_/, '').replace(/-/g, '_');
  let cleanSlug = (slugOrName || '')
    .toLowerCase()
    .replace(/https?:\/\/[^\/]+\/(?:katalog\/item|magazin\/product|katalog)\//, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30);

  const dimsPart = (width && thickness) ? `_${width}_${thickness}` : '';
  return `odk_${brandShort || 'item'}_${cleanSlug}${dimsPart}`.replace(/_+/g, '_');
}