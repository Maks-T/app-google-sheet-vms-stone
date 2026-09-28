/**
 * Validator.gs — Проверка и удаление битых ссылок (включая мягкие 404)
 */
function runBrokenLinksValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('2. Обнаруженные комплектующие');
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const validRows = [data[0]];
  let removedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const url = String(data[i][3]).trim();
    if (!url) continue;

    let isBroken = false;

    try {
      const resp = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36'
        }
      });

      const statusCode = resp.getResponseCode();
      const html = resp.getContentText();

      // Проверяем как HTTP код, так и маркеры 404 в тексте страницы Polivan
      if (
        statusCode === 404 || 
        statusCode >= 500 || 
        html.includes('404 Запрошенная') || 
        html.includes('Попробуйте воспользоваться поиском') ||
        html.includes('Страница не найдена')
      ) {
        isBroken = true;
      }
    } catch (e) {
      isBroken = true;
    }

    if (!isBroken) {
      validRows.push(data[i]);
    } else {
      removedCount++;
    }
  }

  if (removedCount > 0) {
    sheet.clearContents();
    sheet.getRange(1, 1, validRows.length, 5).setValues(validRows);
  }

  SpreadsheetApp.getUi().alert(
    'Проверка завершена',
    `Удалено битых 404 ссылок: ${removedCount}\nОсталось корректных ссылок: ${validRows.length - 1}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}