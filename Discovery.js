/**
 * Скрипт обхода страниц досок и извлечения сопутствующих товаров
 */
function discoverAccessoriesFromWeb() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName('1. Доски (Входные ссылки)');
  const discoverySheet = ss.getSheetByName('2. Обнаруженные комплектующие');

  if (!inputSheet || !discoverySheet) return;

  const inputRows = inputSheet.getDataRange().getValues();
  if (inputRows.length < 2) {
    SpreadsheetApp.getUi().alert('На листе "1. Доски (Входные ссылки)" нет ссылок.');
    return;
  }

  // Очищаем лист 2 перед новым сбором
  const lastDiscRow = discoverySheet.getLastRow();
  if (lastDiscRow > 1) {
    discoverySheet.getRange(2, 1, lastDiscRow - 1, 5).clearContent();
  }

  const existingSet = new Set();
  const newRows = [];
  let processedCount = 0;

  for (let r = 1; r < inputRows.length; r++) {
    const status = String(inputRows[r][0]).trim();
    let boardCode = String(inputRows[r][1]).trim();
    let boardName = String(inputRows[r][2]).trim();
    let series = String(inputRows[r][3]).trim();
    const boardUrl = String(inputRows[r][4]).trim();

    if (!boardUrl || status === 'Готов') continue;

    try {
      inputSheet.getRange(r + 1, 1).setValue('В процессе...');
      SpreadsheetApp.flush();

      const options = {
        'muteHttpExceptions': true,
        'followRedirects': true,
        'headers': {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        }
      };

      const response = UrlFetchApp.fetch(boardUrl, options);
      const statusCode = response.getResponseCode();

      if (statusCode !== 200) {
        inputSheet.getRange(r + 1, 1).setValue('Ошибка');
        inputSheet.getRange(r + 1, 6).setValue('HTTP ' + statusCode);
        continue;
      }

      const html = response.getContentText();

      // Авто-название из <h1>
      if (!boardName) {
        const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
        if (h1Match) {
          boardName = h1Match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
          inputSheet.getRange(r + 1, 3).setValue(boardName);
        }
      }

      // Авто-серия
      if (!series) {
        series = detectSeries(boardUrl, boardName || html);
        if (series) {
          inputSheet.getRange(r + 1, 4).setValue(series);
        }
      }

      // Авто-генерация уникального product_code
      if (!boardCode) {
        boardCode = generateBoardCode(boardUrl, series, boardName || html);
        inputSheet.getRange(r + 1, 2).setValue(boardCode);
      }

      // Парсинг точного списка комплектующих
      const discoveredItems = parseExactList2aFromHtml(html);

      if (discoveredItems.length === 0) {
        inputSheet.getRange(r + 1, 1).setValue('Готов');
        inputSheet.getRange(r + 1, 6).setValue('Блок комплектующих не найден');
        processedCount++;
        continue;
      }

      discoveredItems.forEach(item => {
        const key = boardCode + '|' + item.url + '|' + item.name;
        if (!existingSet.has(key)) {
          newRows.push([
            boardCode,
            item.type,
            item.name,
            item.url,
            item.isColorDependent ? 'ДА' : 'НЕТ'
          ]);
          existingSet.add(key);
        }
      });

      inputSheet.getRange(r + 1, 1).setValue('Готов');
      inputSheet.getRange(r + 1, 6).setValue('Найдено комплектующих: ' + discoveredItems.length);
      processedCount++;

    } catch (err) {
      inputSheet.getRange(r + 1, 1).setValue('Ошибка');
      inputSheet.getRange(r + 1, 6).setValue(err.message);
    }
  }

  if (newRows.length > 0) {
    discoverySheet.getRange(2, 1, newRows.length, 5).setValues(newRows);
  }

  SpreadsheetApp.getUi().alert(
    'Парсинг завершен',
    `Обработано досок: ${processedCount}\nКомплектующих добавлено: ${newRows.length}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function parseExactList2aFromHtml(html) {
  const items = [];
  const headingRegex = /Комплектующие\s+для\s+этого\s+товара/i;
  const matchHeading = headingRegex.exec(html);
  if (!matchHeading) return items;

  const afterHeadingHtml = html.substring(matchHeading.index);
  const ulMatch = /<ul[^>]*class=["'][^"']*list2a[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(afterHeadingHtml)
               || /<ul[^>]*>([\s\S]*?)<\/ul>/i.exec(afterHeadingHtml);
  if (!ulMatch) return items;

  const listHtml = ulMatch[1];
  const liRegex = /<li[^>]*>\s*<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
  let match;
  const seenUrls = new Set();

  while ((match = liRegex.exec(listHtml)) !== null) {
    const rawUrl = match[1].trim();
    let name = match[2]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();

    if (!name || name.length < 4 || rawUrl.startsWith('tel:') || rawUrl.endsWith('.pdf')) continue;

    const fullUrl = rawUrl.startsWith('http') 
      ? rawUrl 
      : ('https://polivan.com' + (rawUrl.startsWith('/') ? '' : '/') + rawUrl);

    if (seenUrls.has(fullUrl + '|' + name)) continue;
    seenUrls.add(fullUrl + '|' + name);

    const classified = classifyAccessoryByName(name);
    items.push({
      name: name,
      url: fullUrl,
      type: classified.type,
      isColorDependent: classified.isColorDependent
    });
  }

  return items;
}

function classifyAccessoryByName(name) {
  const lower = name.toLowerCase();
  if (lower.includes('кляймер') || lower.includes('кляммер')) return { type: 'brackets', isColorDependent: false };
  if (lower.includes('уголок') || lower.includes('угол') || lower.includes('заглушка')) return { type: 'decorProducts', isColorDependent: true };
  if (lower.includes('ступень') || lower.includes('ступен')) return { type: 'stepBoard', isColorDependent: true };
  if (lower.includes('универсальная доска') || lower.includes('доска для обрамления') || lower.includes('планка')) return { type: 'board', isColorDependent: true };
  if (lower.includes('саморез') || lower.includes('шуруп') || lower.includes('крепеж')) return { type: 'fasteners', isColorDependent: false };
  if (lower.includes('лага') || lower.includes('профиль')) return { type: 'joists', isColorDependent: false };
  if (lower.includes('террасная доска')) return { type: 'terraceBoard', isColorDependent: true };
  return { type: 'decorProducts', isColorDependent: true };
}

function detectSeries(url, text) {
  const haystack = (url + ' ' + text).toLowerCase();
  if (haystack.includes('denpasar') || haystack.includes('денпасар')) return 'Денпасар';
  if (haystack.includes('singaraja') || haystack.includes('сингараджа')) return 'Сингараджа';
  if (haystack.includes('nusadua') || haystack.includes('нусадуа')) return 'Нусадуа';
  if (haystack.includes('jimbaran') || haystack.includes('джимбаран')) return 'Джимбаран';
  if (haystack.includes('candidasa') || haystack.includes('кандидаса')) return 'Кандидаса';
  return 'Polivan';
}

function generateBoardCode(url, series, text) {
  const haystack = (url + ' ' + text).toLowerCase();
  const seriesSlug = series.toLowerCase() === 'денпасар' ? 'denpasar'
                   : series.toLowerCase() === 'сингараджа' ? 'singaraja'
                   : series.toLowerCase() === 'нусадуа' ? 'nusadua'
                   : series.toLowerCase() === 'джимбаран' ? 'jimbaran'
                   : series.toLowerCase() === 'кандидаса' ? 'candidasa'
                   : 'board';

  const tags = [];
  if (haystack.includes('massive') || haystack.includes('массив') || haystack.includes('полнотел')) tags.push('massive');
  if (haystack.includes('co-extrusion') || haystack.includes('коэкструзия')) tags.push('coex');
  if (haystack.includes('pioneer') || haystack.includes('пионер')) tags.push('pioneer');
  if (haystack.includes('pudeck') || haystack.includes('пудек')) tags.push('pudeck');

  if (haystack.includes('3d') || haystack.includes('wood') || haystack.includes('текстура') || haystack.includes('дерева')) {
    tags.push('3d_wood');
  } else if (haystack.includes('velvet') || haystack.includes('вельвет')) {
    tags.push('velvet');
  } else if (haystack.includes('brushing') || haystack.includes('шлифован')) {
    tags.push('brushing');
  } else if (haystack.includes('design') || haystack.includes('дизайн')) {
    tags.push('design');
  }

  let dims = '';
  const matchDims = /(\d{2})\s*[хxX*]\s*(\d{2,3})/i.exec(url + ' ' + text);
  if (matchDims) {
    dims = matchDims[1] + '_' + matchDims[2];
  }

  const parts = [seriesSlug, ...tags, dims].filter(Boolean);
  return parts.join('_');
}