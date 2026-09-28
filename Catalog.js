/**
 * Сбор всех вариаций, цветов, цен, размеров и фотографий в лист "3. Каталог товаров и SKU"
 */
function parseAllProductsAndVariantsToCatalog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inputSheet = ss.getSheetByName('1. Доски (Входные ссылки)');
  const discoverySheet = ss.getSheetByName('2. Обнаруженные комплектующие');
  const catalogSheet = ss.getSheetByName('3. Каталог товаров и SKU');

  if (!inputSheet || !discoverySheet || !catalogSheet) return;

  const queue = [];
  const seenUrls = new Set();

  // 1. Доски
  const boardRows = inputSheet.getDataRange().getValues();
  for (let i = 1; i < boardRows.length; i++) {
    const code = String(boardRows[i][1]).trim();
    const name = String(boardRows[i][2]).trim();
    const url = String(boardRows[i][4]).trim();
    if (url && !seenUrls.has(url)) {
      queue.push({ code: code, type: 'terraceBoard', name: name, url: url });
      seenUrls.add(url);
    }
  }

  // 2. Комплектующие
  const discRows = discoverySheet.getDataRange().getValues();
  for (let i = 1; i < discRows.length; i++) {
    const parentCode = String(discRows[i][0]).trim();
    const type = String(discRows[i][1]).trim();
    const name = String(discRows[i][2]).trim();
    const url = String(discRows[i][3]).trim();
    if (url && !seenUrls.has(url)) {
      const code = generateModelCode(url, type, parentCode);
      queue.push({ code: code, type: type, name: name, url: url });
      seenUrls.add(url);
    }
  }

  if (queue.length === 0) {
    SpreadsheetApp.getUi().alert('Нет ссылок для обработки.');
    return;
  }

  const lastRow = catalogSheet.getLastRow();
  if (lastRow > 1) {
    catalogSheet.getRange(2, 1, lastRow - 1, 13).clearContent();
  }

  const catalogRows = [];
  let processedPages = 0;

  for (let q = 0; q < queue.length; q++) {
    const item = queue[q];
    try {
      const options = {
        'muteHttpExceptions': true,
        'followRedirects': true,
        'headers': {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        }
      };

      const response = UrlFetchApp.fetch(item.url, options);
      if (response.getResponseCode() !== 200) continue;

      const html = response.getContentText();
      const parsedData = parseProductPageDetails(html, item);

      parsedData.forEach(row => {
        catalogRows.push(row);
      });

      processedPages++;
    } catch (e) {
      Logger.log('Ошибка парсинга: ' + item.url + ' -> ' + e.message);
    }
  }

  if (catalogRows.length > 0) {
    catalogSheet.getRange(2, 1, catalogRows.length, 13).setValues(catalogRows);
    syncDropdowns();
  }

  SpreadsheetApp.getUi().alert(
    'Парсинг каталога завершен',
    `Обработано страниц: ${processedPages}\nСформировано товаров и вариантов (SKU): ${catalogRows.length}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Разбор страницы товара: гарантия заполнения всех колонок
 */
function parseProductPageDetails(html, item) {
  const rows = [];

  const dims = extractDimensionsFromHtml(html, item.name, item.type);
  const price = extractPriceFromHtml(html);
  const cleanPrice = (price && !isNaN(price) && price > 0) ? price : '';
  const cleanCost = cleanPrice !== '' ? Math.round(cleanPrice * 0.7) : '';

  // Извлекаем цвета и соответствующие им картинки из галереи
  const colorItems = extractColorsAndGalleryFromHtml(html);

  // Если у товара нет цветов (кляймер, лага, саморез)
  if (colorItems.length === 0) {
    const sku = item.code;
    rows.push([
      item.code,
      item.type,
      sku,
      item.name,
      '', // color_name
      '', // color_slug
      '', // color_hex
      dims.length || '',
      dims.width || '',
      dims.height || '',
      cleanPrice,
      cleanCost,
      dims.mainImage || ''
    ]);
    return rows;
  }

  // Если у товара есть цвета (доски, ступени, уголки)
  colorItems.forEach(c => {
    const sku = item.code + '_' + c.slug;
    const variantName = item.name + ' (' + c.name + ')';

    rows.push([
      item.code,
      item.type,
      sku,
      variantName,
      c.name,
      c.slug,
      c.hex,
      dims.length || '',
      dims.width || '',
      dims.height || '',
      cleanPrice,
      cleanCost,
      c.imageUrl || dims.mainImage || ''
    ]);
  });

  return rows;
}

/**
 * Извлечение цветов и сопоставление с фотографиями из галереи
 */
function extractColorsAndGalleryFromHtml(html) {
  const colors = [];
  const seenSlugs = new Set();
  const galleryMap = {};

  // 1. Сканируем слайдер галереи (WPGS / Slick)
  const slideRegex = /<a[^>]+href=["']([^"']+\.(?:webp|jpg|png|jpeg))["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = slideRegex.exec(html)) !== null) {
    const imgUrl = match[1].startsWith('http') ? match[1] : ('https://polivan.com' + match[1]);
    const innerHtml = match[2];

    const altMatch = /alt=["']([^"']*)["']/i.exec(innerHtml);
    const altText = altMatch ? altMatch[1].trim() : '';

    const colorInfo = detectColorFromTextOrUrl(imgUrl, altText);
    if (colorInfo) {
      galleryMap[colorInfo.slug] = imgUrl;

      if (!seenSlugs.has(colorInfo.slug)) {
        colors.push({
          name: colorInfo.name,
          slug: colorInfo.slug,
          hex: colorInfo.hex,
          imageUrl: imgUrl
        });
        seenSlugs.add(colorInfo.slug);
      }
    }
  }

  // 2. Если в галерее alt были не подписаны, считываем блок выбора цветов
  if (colors.length === 0) {
    const palette = [
      { name: 'Шоколад', slug: 'wenge', hex: '#3B2219' },
      { name: 'Венге', slug: 'wenge', hex: '#3B2219' },
      { name: 'Серый', slug: 'grey', hex: '#718096' },
      { name: 'Графит', slug: 'graphite', hex: '#4A5568' },
      { name: 'Песочный', slug: 'sand', hex: '#A07855' },
      { name: 'Бронза', slug: 'sand', hex: '#A07855' },
      { name: 'Терракот', slug: 'terracotta', hex: '#8C3B2B' },
      { name: 'Антрацит', slug: 'anthracite', hex: '#2D3748' },
      { name: 'Черный', slug: 'anthracite', hex: '#2D3748' },
      { name: 'Белый', slug: 'white', hex: '#E2E8F0' }
    ];

    const colorAreaIdx = html.search(/Цвет/i);
    const colorText = colorAreaIdx !== -1 ? html.substring(colorAreaIdx, colorAreaIdx + 12000) : html;

    palette.forEach(p => {
      const regex = new RegExp(p.name, 'i');
      if (regex.test(colorText) && !seenSlugs.has(p.slug)) {
        colors.push({
          name: p.name,
          slug: p.slug,
          hex: p.hex,
          imageUrl: galleryMap[p.slug] || ''
        });
        seenSlugs.add(p.slug);
      }
    });
  }

  return colors;
}

/**
 * Определение цвета по названию файла и alt
 */
function detectColorFromTextOrUrl(url, alt) {
  const text = (url + ' ' + alt).toLowerCase();

  if (text.includes('seryj') || text.includes('серый')) return { name: 'Серый', slug: 'grey', hex: '#718096' };
  if (text.includes('grafit') || text.includes('графит')) return { name: 'Графит', slug: 'graphite', hex: '#4A5568' };
  if (text.includes('chernyj') || text.includes('черный') || text.includes('antratsit') || text.includes('антрацит')) return { name: 'Антрацит', slug: 'anthracite', hex: '#2D3748' };
  if (text.includes('temno-korichnevyj') || text.includes('темно-коричневый') || text.includes('shokolad') || text.includes('шоколад') || text.includes('wenge') || text.includes('венге')) return { name: 'Тёмно-коричневый', slug: 'dark_brown', hex: '#3B2219' };
  if (text.includes('svetlo-korichnevyj') || text.includes('светло-коричневый') || text.includes('bronza') || text.includes('бронза')) return { name: 'Светло-коричневый', slug: 'light_brown', hex: '#8B5A2B' };
  if (text.includes('pesochnyj') || text.includes('песочный')) return { name: 'Песочный', slug: 'sand', hex: '#A07855' };
  if (text.includes('terrakot') || text.includes('терракот') || text.includes('krasnyj') || text.includes('красный')) return { name: 'Красный', slug: 'red', hex: '#8C3B2B' };
  if (text.includes('bezhevyj') || text.includes('бежевый')) return { name: 'Бежевый', slug: 'beige', hex: '#D4B36A' };
  if (text.includes('belyj') || text.includes('белый') || text.includes('slonovaja') || text.includes('слоновая')) return { name: 'Белый', slug: 'white', hex: '#E2E8F0' };

  return null;
}

function extractDimensionsFromHtml(html, defaultName, type) {
  const result = { length: null, width: null, height: null, mainImage: null };
  const fullText = defaultName + ' ' + html.substring(0, 15000);

  const match3D = /(\d{1,3})\s*[хxX*]\s*(\d{2,4})\s*[хxX*]\s*(\d{3,5})/i.exec(fullText);
  if (match3D) {
    result.height = parseInt(match3D[1]);
    result.width = parseInt(match3D[2]);
    result.length = parseInt(match3D[3]);
  } else {
    const match2D = /(\d{1,3})\s*[хxX*]\s*(\d{2,4})\s*мм/i.exec(fullText);
    if (match2D) {
      result.height = parseInt(match2D[1]);
      result.width = parseInt(match2D[2]);
      if (['terraceBoard', 'board', 'stepBoard', 'decorProducts'].includes(type)) {
        result.length = 2900;
      }
    }
  }

  if (type === 'brackets' || type === 'fasteners') {
    if (result.length === 2900) result.length = null;
  }

  const imgMatch = /<img[^>]+src=["']([^"']+\.(?:webp|jpg|png))["'][^>]*class=["'][^"']*(?:wp-post-image|main-img|attachment)[^"']*["']/i.exec(html)
                || /<img[^>]+src=["']([^"']+\.(?:webp|jpg|png))["']/i.exec(html);
  if (imgMatch) {
    result.mainImage = imgMatch[1].startsWith('http') ? imgMatch[1] : ('https://polivan.com' + imgMatch[1]);
  }

  return result;
}

function extractPriceFromHtml(html) {
  const priceRegexes = [
    /<span[^>]*class=["'][^"']*woocommerce-Price-amount[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /class=["'][^"']*price[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
    /(?:цена|стоимость)[:\s]*(\d[\d\s]{1,6})\s*(?:₽|руб)/i,
    /(\d[\d\s]{2,6})\s*(?:₽|руб)/i
  ];

  for (let r of priceRegexes) {
    const match = r.exec(html);
    if (match) {
      const cleanDigits = match[1].replace(/<[^>]+>/g, '').replace(/\D/g, '');
      const parsed = parseInt(cleanDigits);
      if (!isNaN(parsed) && parsed > 0 && parsed < 500000) {
        return parsed;
      }
    }
  }

  return null;
}

function generateModelCode(url, type, parentCode) {
  const cleanUrl = url.replace(/\/$/, '').split('/');
  let slug = cleanUrl[cleanUrl.length - 1].toLowerCase().replace(/[^a-z0-9_-]/g, '');

  slug = slug.replace(/^terrasnaja-doska-iz-dpk-/, '')
             .replace(/^terrasnaya-doska-/, '')
             .replace(/^stupen-iz-dpk-/, 'step-')
             .replace(/^ugolok-iz-dpk-/, 'corner-')
             .replace(/^universalnaja-doska-iz-dpk-/, 'uniboard-');

  if (type === 'brackets') {
    if (slug.includes('start')) {
      if (slug.includes('9-11') || slug.includes('9x11')) return 'clip_start_9x11';
      if (slug.includes('10-20') || slug.includes('10x20')) return 'clip_start_10x20';
      return 'clip_start_' + slug.substring(0, 15).replace(/-/g, '_');
    } else {
      if (slug.includes('plastik')) return 'clip_base_plastic_12x20';
      if (slug.includes('8-16') || slug.includes('8x16')) return 'clip_base_metal_8x16';
      if (slug.includes('12-20') || slug.includes('12x20')) return 'clip_base_metal_12x20';
      return 'clip_base_' + slug.substring(0, 15).replace(/-/g, '_');
    }
  }

  if (type === 'fasteners') return 'screw_35x20';
  if (type === 'joists') return slug.includes('singaraja') ? 'laga_singaraja_28x37' : 'laga_denpasar_28x37';

  if (type === 'decorProducts') {
    if (slug.includes('zaglushka') || slug.includes('заглушка')) return slug.includes('singaraja') ? 'plug_singaraja_22x146' : 'plug_denpasar_20x140';
    if (slug.includes('zabor') || slug.includes('забор')) return 'fence_board_coex_11x140';
    return 'corner_45x45_' + (parentCode ? parentCode.split('_')[0] : 'wpc');
  }

  if (type === 'board') {
    if (slug.includes('obramlen')) return 'framing_board_' + (parentCode ? parentCode.split('_')[0] : 'denpasar') + '_20x140';
    return 'uniboard_' + (parentCode ? parentCode.split('_')[0] : 'wpc') + '_11x140';
  }

  if (type === 'stepBoard') {
    const series = parentCode ? parentCode.split('_')[0] : 'wpc';
    if (slug.includes('3d') || slug.includes('wood')) return 'step_' + series + '_3d_wood';
    if (slug.includes('brushing') || slug.includes('shlif')) return 'step_' + series + '_brushing';
    return 'step_' + series;
  }

  return slug.substring(0, 30).replace(/-/g, '_');
}