/**
 * sheets/Components.js — Листы комплектующих, основания и ограждений
 */

function getGdkComponentSheets() {
  return GDK_CONFIG.CATALOG_SHEETS
    .filter(meta => meta.type !== 'terraceBoard')
    .map(meta => Object.assign({}, meta, {
      productTypeExt: GDK_CONFIG.PRODUCT_TYPES[meta.type],
      calcCategory: GDK_CONFIG.CALC_CATEGORIES[meta.type] || null
    }));
}

function findComponentSheet(ss, targetMeta) {
  return findCatalogSheet(ss, targetMeta);
}

function setupAllComponentSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const componentSheets = getGdkComponentSheets();

  componentSheets.forEach(meta => {
    let sheet = findComponentSheet(ss, meta);
    if (!sheet) {
      sheet = ss.insertSheet(meta.sheetName);
    }

    const manualRows = readManualCatalogRows(sheet);
    const preservedUrls = [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const headers = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), 20)).getValues()[0];
      const urlColIdx = headers.indexOf('product_url');
      const colToRead = urlColIdx !== -1 ? urlColIdx + 1 : 16;

      const values = sheet.getRange(2, colToRead, lastRow - 1, 1).getValues();
      for (let i = 0; i < values.length; i++) {
        const val = cleanProductUrl(String(values[i][0] || '').trim());
        if (val.startsWith('http') && !preservedUrls.includes(val)) {
          preservedUrls.push(val);
        }
      }
    }

    setupSelfSufficientSheetLayout(sheet);

    const restoreRows = preservedUrls.map(url => {
      const row = new Array(GDK_CONFIG.SHEET_COLUMNS.length).fill('');
      row[0] = 'В очереди';
      row[15] = url;
      return row;
    }).concat(manualRows);
    if (restoreRows.length > 0) {
      sheet.getRange(2, 1, restoreRows.length, GDK_CONFIG.SHEET_COLUMNS.length).setValues(restoreRows);
    }
  });

  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Все листы комплектующих успешно инициализированы.',
    'Готово',
    3
  );
}

function parseAllComponentSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const componentSheets = getGdkComponentSheets();
  let totalProcessed = 0;
  let totalSkus = 0;

  componentSheets.forEach(meta => {
    const sheet = findComponentSheet(ss, meta);
    if (sheet) {
      const result = parseSingleComponentSheet(sheet, meta);
      totalProcessed += result.processed;
      totalSkus += result.skus;
    }
  });

  SpreadsheetApp.getUi().alert(
    'Парсинг всех комплектующих завершен',
    `Обработано страниц товаров: ${totalProcessed}\nСформировано позиций и модификаций (SKU): ${totalSkus}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function parseActiveComponentSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();
  const componentSheets = getGdkComponentSheets();

  const meta = componentSheets.find(m => m.sheetName === sheetName || (m.altNames || []).includes(sheetName));

  if (!meta) {
    SpreadsheetApp.getUi().alert(`Лист "${sheetName}" не является зарегистрированным листом комплектующих.`);
    return;
  }

  const result = parseSingleComponentSheet(sheet, meta);
  SpreadsheetApp.getUi().alert(
    `Парсинг листа "${sheetName}" завершен`,
    `Обработано страниц: ${result.processed}\nСформировано вариантов (SKU): ${result.skus}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function parseSingleComponentSheet(sheet, meta) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return { processed: 0, skus: 0 };

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

  if (urlsToProcess.length === 0) return { processed: 0, skus: 0 };

  const newRows = [];
  let processedCount = 0;

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

      if (response.getResponseCode() !== 200) continue;

      const html = response.getContentText();
      const product = parseOliverDeckProductPage(html, url, meta.type);
      const baseCode = generateGdkExternalCode(product.brand, product.url, product.width_mm, product.thickness_mm);

      product.variants.forEach(v => {
        const sku = v.slug ? `${baseCode}_${v.slug}` : baseCode;
        const variantName = v.name ? `${product.name} (${v.name})` : product.name;
        const retailPrice = v.price || product.price_retail || 0;
        const costPrice = retailPrice > 0 ? Math.round(retailPrice * 0.7) : 0;

        const colLength = (meta.type === 'adjustable_pedestal' && product.height_min) ? product.height_min : (product.length_mm || '');
        const colWidth = (meta.type === 'adjustable_pedestal' && product.height_max) ? product.height_max : (product.width_mm || '');
        const colThickness = (meta.type === 'adjustable_pedestal' && product.max_load_kg) ? product.max_load_kg : (product.thickness_mm || '');
        const logComment = (meta.type === 'adjustable_pedestal' && product.height_min)
          ? `H: ${product.height_min}-${product.height_max} мм (${product.max_load_kg || 1000} кг)`
          : `OK: ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;

        newRows.push(padCatalogRow([
          'Готов',
          baseCode,
          sku,
          variantName,
          product.brand,
          product.material,
          v.name || '',
          v.slug || '',
          v.hex || '',
          colLength,
          colWidth,
          colThickness,
          retailPrice || '',
          costPrice || '',
          v.image_url || product.main_image || '',
          url,
          logComment
        ]));
      });
      processedCount++;
    } catch (e) {
      Logger.log(`Ошибка парсинга комплектующего ${url}: ${e.message}`);
    }
  }

  if (newRows.length > 0) {
    const allRows = newRows.concat(readManualCatalogRows(sheet));
    const lastRow = Math.max(sheet.getLastRow(), 2);
    sheet.getRange(2, 1, lastRow - 1, GDK_CONFIG.SHEET_COLUMNS.length).clearContent();
    sheet.getRange(2, 1, allRows.length, GDK_CONFIG.SHEET_COLUMNS.length).setValues(allRows);
  }

  return { processed: processedCount, skus: newRows.length };
}