/**
 * sheets/Boards.js — Модуль управления самодостаточным каталогом террасных досок (Лист 1)
 */

function getBoardsSheet(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('1. Доски') || ss.getSheetByName('1. Доски (Входные ссылки)');
  if (!sheet) {
    sheet = ss.insertSheet('1. Доски', 1);
  }
  return sheet;
}

function setupBoardsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getBoardsSheet(ss);

  const preservedUrls = [];
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const currentHeaders = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), 20)).getValues()[0];
    const urlColIndex = currentHeaders.indexOf('product_url');

    if (urlColIndex !== -1) {
      const values = sheet.getRange(2, urlColIndex + 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < values.length; i++) {
        const val = String(values[i][0] || '').trim();
        if (val.startsWith('http')) preservedUrls.push(val);
      }
    } else if (sheet.getLastColumn() <= 6) {
      const values = sheet.getRange(2, 5, lastRow - 1, 1).getValues();
      for (let i = 0; i < values.length; i++) {
        const val = String(values[i][0] || '').trim();
        if (val.startsWith('http')) preservedUrls.push(val);
      }
    }
  }

  setupSelfSufficientSheetLayout(sheet);
  sheet.setName('1. Доски');

  if (preservedUrls.length > 0) {
    const restoreRows = preservedUrls.map(url => {
      const row = new Array(GDK_CONFIG.SHEET_COLUMNS.length).fill('');
      row[0] = 'В очереди';
      row[15] = url;
      return row;
    });
    sheet.getRange(2, 1, restoreRows.length, GDK_CONFIG.SHEET_COLUMNS.length).setValues(restoreRows);
  }

  ss.setActiveSheet(sheet);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    `Лист "1. Доски" инициализирован. Сохранено ссылок: ${preservedUrls.length}`,
    'Готово',
    3
  );
}

function parseBoardsToFullCatalog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getBoardsSheet(ss);

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('На листе "1. Доски" нет ссылок в колонке P (product_url).');
    return;
  }

  const headers = data[0];
  let urlColIdx = headers.indexOf('product_url');
  if (urlColIdx === -1) urlColIdx = 15;

  const urlsToProcess = [];
  const seenUrls = new Set();

  for (let r = 1; r < data.length; r++) {
    const rawUrl = String(data[r][urlColIdx] || data[r][4] || '').trim();
    const cleanUrl = cleanProductUrl(rawUrl);
    if (cleanUrl.startsWith('http') && !seenUrls.has(cleanUrl)) {
      urlsToProcess.push(cleanUrl);
      seenUrls.add(cleanUrl);
    }
  }

  if (urlsToProcess.length === 0) {
    SpreadsheetApp.getUi().alert('Не найдено корректных ссылок в колонке product_url.');
    return;
  }

  const newCatalogRows = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i];
    sheet.getRange(i + 2, 1).setValue('В процессе...');
    SpreadsheetApp.flush();

    try {
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        }
      });

      if (response.getResponseCode() !== 200) {
        errorCount++;
        continue;
      }

      const html = response.getContentText();
      const product = parseOliverDeckProductPage(html, url, 'terraceBoard');
      const baseProductCode = generateGdkExternalCode(product.brand, product.url, product.width_mm, product.thickness_mm);

      product.variants.forEach(variant => {
        const sku = variant.slug ? `${baseProductCode}_${variant.slug}` : baseProductCode;
        const variantName = variant.name ? `${product.name} (${variant.name})` : product.name;
        const retailPrice = variant.price || product.price_retail || 0;
        const costPrice = retailPrice > 0 ? Math.round(retailPrice * 0.7) : 0;

        newCatalogRows.push([
          'Готов',
          baseProductCode,
          sku,
          variantName,
          product.brand,
          product.material,
          variant.name || '',
          variant.slug || '',
          variant.hex || '',
          product.length_mm || '',
          product.width_mm || '',
          product.thickness_mm || '',
          retailPrice || '',
          costPrice || '',
          variant.image_url || product.main_image || '',
          url,
          `OK: ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
        ]);
      });

      successCount++;
    } catch (e) {
      Logger.log(`Ошибка парсинга ${url}: ${e.message}`);
      errorCount++;
    }
  }

  if (newCatalogRows.length > 0) {
    const lastRow = Math.max(sheet.getLastRow(), 2);
    sheet.getRange(2, 1, lastRow - 1, GDK_CONFIG.SHEET_COLUMNS.length).clearContent();
    sheet.getRange(2, 1, newCatalogRows.length, GDK_CONFIG.SHEET_COLUMNS.length).setValues(newCatalogRows);
  }

  SpreadsheetApp.getUi().alert(
    'Парсинг досок завершен',
    `Обработано страниц досок: ${successCount}\nСформировано позиций и модификаций (SKU): ${newCatalogRows.length}\nОшибок: ${errorCount}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}