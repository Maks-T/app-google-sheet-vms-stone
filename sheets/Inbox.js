/**
 * sheets/Inbox.js — Модуль единого накопителя ссылок и их распределения по категориям
 */

const INBOX_CONFIG = {
  CANONICAL_SHEET_NAME: 'Входные ссылки',
  HEADERS: ['Категория (Тип товара)', 'product_url (Ссылка на страницу)', 'Статус распределения'],
  NOTES: [
    'Выберите категорию из выпадающего списка в каждой строке',
    'Прямая ссылка на страницу товара с сайта oliverdeck.ru',
    'Отметка о дате, времени и целевом листе переноса'
  ],
  CATEGORY_OPTIONS: [
    '1. Доски (terraceBoard)',
    '2. Ступени (stepBoard)',
    '3. Уголки и декор (decorProducts)',
    '4. Универсальная доска (зашивка) (board)',
    '5. Лаги (joist)',
    '6. Кляймеры и крепеж (brackets)',
    '7. Регулируемые опоры (adjustable_pedestal)',
    '8. Каркас и балки обвязки (foundation_beam)'
  ]
};

function getInboxSheet(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(INBOX_CONFIG.CANONICAL_SHEET_NAME)
    || ss.getSheetByName('отдельный лист')
    || ss.getSheetByName('0. Входные ссылки');
  if (!sheet) {
    sheet = ss.insertSheet(INBOX_CONFIG.CANONICAL_SHEET_NAME, 0);
  }
  return sheet;
}

function setupInboxLinksSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getInboxSheet(ss);

  const preservedItems = [];
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    const rawData = sheet.getRange(1, 1, lastRow, Math.min(sheet.getLastColumn(), 5)).getValues();
    let currentCategory = '';

    for (let r = 0; r < rawData.length; r++) {
      const colA = String(rawData[r][0] || '').trim();
      const colB = String(rawData[r][1] || '').trim();

      if (colA && !colA.startsWith('http') && !colA.toLowerCase().includes('категория')) {
        currentCategory = colA;
      }

      let targetUrl = '';
      if (colB.startsWith('http')) {
        targetUrl = colB;
      } else if (colA.startsWith('http')) {
        targetUrl = colA;
      }

      if (targetUrl) {
        const cleanUrl = cleanProductUrl(targetUrl);
        let resolvedCategory = currentCategory;
        if (targetUrl.includes('stupen_') && (currentCategory.includes('обрамлен') || !currentCategory)) {
          resolvedCategory = '2. Ступени (stepBoard)';
        } else if ((targetUrl.includes('opora') || targetUrl.includes('level') || targetUrl.includes('pedestal')) && !targetUrl.includes('laga')) {
          resolvedCategory = '7. Регулируемые опоры (adjustable_pedestal)';
        } else if (targetUrl.includes('truba') || targetUrl.includes('profilnaya') || targetUrl.includes('frame')) {
          resolvedCategory = '8. Каркас и балки обвязки (foundation_beam)';
        }

        const canonicalCategory = normalizeToCanonicalCategory(resolvedCategory);

        preservedItems.push({
          category: canonicalCategory,
          url: cleanUrl,
          status: 'Готов к распределению'
        });
      }
    }
  }

  sheet.clear();
  sheet.setName(INBOX_CONFIG.CANONICAL_SHEET_NAME);

  try {
    sheet.activate();
    ss.moveActiveSheet(1);
  } catch (e) {}

  const range = sheet.getRange(1, 1, 1, INBOX_CONFIG.HEADERS.length);
  range.setValues([INBOX_CONFIG.HEADERS]);
  range.setBackground('#1E293B');
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  range.setFontSize(10);
  range.setVerticalAlignment('middle');
  range.setHorizontalAlignment('center');

  for (let i = 0; i < INBOX_CONFIG.NOTES.length; i++) {
    sheet.getRange(1, i + 1).setNote(INBOX_CONFIG.NOTES[i]);
  }
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);

  const catRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(INBOX_CONFIG.CATEGORY_OPTIONS, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange('A2:A2000').setDataValidation(catRule);

  if (preservedItems.length > 0) {
    const rowsToWrite = preservedItems.map(item => [item.category, item.url, item.status]);
    sheet.getRange(2, 1, rowsToWrite.length, 3).setValues(rowsToWrite);
  }

  sheet.setColumnWidth(1, 310);
  sheet.setColumnWidth(2, 600);
  sheet.setColumnWidth(3, 240);

  ss.setActiveSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Лист "Входные ссылки" оформлен. Сохранено: ${preservedItems.length} ссылок.`,
    'Готово',
    4
  );
}

function normalizeToCanonicalCategory(categoryStr) {
  const lower = String(categoryStr || '').toLowerCase().trim();
  if (!lower) return '1. Доски (terraceBoard)';

  if (lower.includes('1.') || (lower.includes('доск') && !lower.includes('универсаль') && !lower.includes('обрамлен') && !lower.includes('зашив') && !lower.includes('ун-ая') && !lower.includes('забор'))) {
    return '1. Доски (terraceBoard)';
  }
  if (lower.includes('2.') || lower.includes('ступен')) {
    return '2. Ступени (stepBoard)';
  }
  if (lower.includes('3.') || lower.includes('угол')) {
    return '3. Уголки и декор (decorProducts)';
  }
  if (lower.includes('4.') || lower.includes('универсаль') || lower.includes('зашив') || lower.includes('обрамлен') || lower.includes('ун-ая') || lower.includes('забор')) {
    return '4. Универсальная доска (зашивка) (board)';
  }
  if (lower.includes('5.') || lower.includes('лаг')) {
    return '5. Лаги (joist)';
  }
  if (lower.includes('6.') || lower.includes('кляймер') || lower.includes('кляммер') || lower.includes('клипс') || lower.includes('саморез') || lower.includes('крепеж')) {
    return '6. Кляймеры и крепеж (brackets)';
  }
  if (lower.includes('7.') || lower.includes('опор') || lower.includes('level') || lower.includes('pedestal')) {
    return '7. Регулируемые опоры (adjustable_pedestal)';
  }
  if (lower.includes('8.') || lower.includes('каркас') || lower.includes('балк') || lower.includes('труб') || lower.includes('обвязк')) {
    return '8. Каркас и балки обвязки (foundation_beam)';
  }

  return '1. Доски (terraceBoard)';
}

function mapInboxCategoryToTargetSheet(categoryStr) {
  const canonical = normalizeToCanonicalCategory(categoryStr);
  if (canonical.includes('1.')) return '1. Доски';
  if (canonical.includes('2.')) return '2. Ступени';
  if (canonical.includes('3.')) return '3. Уголки и декор';
  if (canonical.includes('4.')) return '4. Универсальная доска (зашивка)';
  if (canonical.includes('5.')) return '5. Лаги';
  if (canonical.includes('6.')) return '6. Кляймеры и крепеж';
  if (canonical.includes('7.')) return '7. Регулируемые опоры';
  if (canonical.includes('8.')) return '8. Каркас и балки';
  return null;
}

function distributeInboxLinksToSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inboxSheet = getInboxSheet(ss);

  const data = inboxSheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('На листе "Входные ссылки" нет данных.');
    return;
  }

  let totalProcessed = 0;
  let totalAdded = 0;
  let skippedDuplicates = 0;

  const targetSheetsMap = {
    '1. Доски': getBoardsSheet(ss),
    '2. Ступени': ss.getSheetByName('2. Ступени'),
    '3. Уголки и декор': ss.getSheetByName('3. Уголки и декор'),
    '4. Универсальная доска (зашивка)': ss.getSheetByName('4. Универсальная доска (зашивка)') || ss.getSheetByName('4. Доска обрамления'),
    '5. Лаги': ss.getSheetByName('5. Лаги'),
    '6. Кляймеры и крепеж': ss.getSheetByName('6. Кляймеры и крепеж'),
    '7. Регулируемые опоры': ss.getSheetByName('7. Регулируемые опоры'),
    '8. Каркас и балки': ss.getSheetByName('8. Каркас и балки') || ss.getSheetByName('8. Балки и сваи')
  };

  const targetExistingUrls = {};
  for (const [name, targetSheet] of Object.entries(targetSheetsMap)) {
    targetExistingUrls[name] = new Set();
    if (targetSheet && targetSheet.getLastRow() > 1) {
      const urls = targetSheet.getRange(2, 16, targetSheet.getLastRow() - 1, 1).getValues();
      for (let u = 0; u < urls.length; u++) {
        const clean = cleanProductUrl(String(urls[u][0] || '').trim());
        if (clean) targetExistingUrls[name].add(clean);
      }
    }
  }

  const rowsToAppendBySheet = {
    '1. Доски': [],
    '2. Ступени': [],
    '3. Уголки и декор': [],
    '4. Универсальная доска (зашивка)': [],
    '5. Лаги': [],
    '6. Кляймеры и крепеж': [],
    '7. Регулируемые опоры': [],
    '8. Каркас и балки': []
  };

  let carriedCategory = '';

  for (let r = 1; r < data.length; r++) {
    const rawCategory = String(data[r][0] || '').trim();
    const rawUrl = String(data[r][1] || '').trim();

    if (rawCategory) {
      carriedCategory = rawCategory;
    }

    if (!rawUrl || !rawUrl.startsWith('http')) {
      continue;
    }

    const cleanUrl = cleanProductUrl(rawUrl);
    const categoryToUse = carriedCategory || rawCategory;
    const targetSheetName = mapInboxCategoryToTargetSheet(categoryToUse);

    if (!targetSheetName || !targetSheetsMap[targetSheetName]) {
      inboxSheet.getRange(r + 1, 3).setValue('Ошибка: не указана категория');
      continue;
    }

    totalProcessed++;

    if (targetExistingUrls[targetSheetName].has(cleanUrl)) {
      skippedDuplicates++;
      inboxSheet.getRange(r + 1, 3).setValue(`Уже на листе "${targetSheetName}"`);
      continue;
    }

    const newTargetRow = new Array(GDK_CONFIG.SHEET_COLUMNS.length).fill('');
    newTargetRow[0] = 'В очереди';
    newTargetRow[15] = cleanUrl;
    rowsToAppendBySheet[targetSheetName].push(newTargetRow);

    targetExistingUrls[targetSheetName].add(cleanUrl);
    totalAdded++;

    inboxSheet.getRange(r + 1, 3).setValue(`Перенесено в "${targetSheetName}" (${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`);
  }

  for (const [sheetName, newRows] of Object.entries(rowsToAppendBySheet)) {
    if (newRows.length > 0) {
      const targetSheet = targetSheetsMap[sheetName];
      const startRow = Math.max(targetSheet.getLastRow() + 1, 2);
      targetSheet.getRange(startRow, 1, newRows.length, GDK_CONFIG.SHEET_COLUMNS.length).setValues(newRows);
    }
  }

  SpreadsheetApp.getUi().alert(
    'Распределение ссылок завершено',
    `Обработано ссылок: ${totalProcessed}\n` +
    `Успешно добавлено на рабочие листы: ${totalAdded}\n` +
    `Пропущено дубликатов: ${skippedDuplicates}\n` +
    `\nТеперь вы можете запустить парсинг в меню.`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}