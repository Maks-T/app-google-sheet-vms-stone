/**
 * GreenDecksParser.js (OliverDeckParser) — Универсальный парсер Shop2 CMS магазина OliverDeck (oliverdeck.ru)
 * Гарантированное извлечение габаритов (3D/2D), диапазонов высот опор и цен в RUB.
 */

/**
 * Главная точка разбора HTML страницы товара OliverDeck
 */
function parseGreenDecksProductPage(html, url, defaultType) {
  const cleanUrl = cleanProductUrl(url);

  const name = extractOliverDeckTitle(html, cleanUrl);
  const type = defaultType || detectProductTypeFromUrlOrTitle(cleanUrl, name);
  const dims = extractOliverDeckDimensions(html, name, cleanUrl, type);
  const material = extractOliverDeckMaterial(html, name, type);
  const brand = detectOliverDeckBrand(html, name, cleanUrl);
  const price = extractOliverDeckPrice(html, dims);
  const mainImage = extractOliverDeckMainImage(html);

  // Извлекаем модификации по цветам из .shop2-color-ext-list
  const variants = extractOliverDeckOffers(html, name, cleanUrl, mainImage, price, dims);

  return {
    name: name,
    url: cleanUrl,
    type: type,
    brand: brand,
    material: material,
    length_mm: dims.length,
    width_mm: dims.width,
    thickness_mm: dims.thickness,
    height_mm: dims.height_mm || dims.thickness,
    height_min: dims.height_min || null,
    height_max: dims.height_max || null,
    max_load_kg: dims.max_load_kg || null,
    wall_thickness_mm: dims.wall_thickness_mm || null,
    profile_width_mm: dims.profile_width_mm || null,
    profile_height_mm: dims.profile_height_mm || null,
    price_retail: price,
    main_image: mainImage,
    variants: variants
  };
}

const parseOliverDeckProductPage = parseGreenDecksProductPage;

/**
 * 1. Очистка URL
 */
function cleanProductUrl(url) {
  if (!url) return '';
  return url.split('?')[0].replace(/\/+$/, '') + '/';
}

/**
 * 2. Извлечение названия товара
 */
function extractOliverDeckTitle(html, url) {
  const nameMatch = /<div[^>]*class=["'][^"']*product_name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html)
    || /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);

  if (nameMatch) {
    return cleanHtmlText(nameMatch[1]);
  }

  const cleanSlug = url.replace(/\/+$/, '').split('/').pop();
  return cleanSlug.replace(/[-_]+/g, ' ');
}

/**
 * 3. Извлечение розничной цены (RUB) за штуку
 */
function extractOliverDeckPrice(html, dims) {
  // А. Цена за погонный метр -> умножаем на длину доски в метрах
  const pogonMatch = /<span>([\d\s]+)<\/span>[^<]*<span[^>]*>[^<]*<\/span>\s*\/\s*пог/i.exec(html)
    || /([\d\s]+)\s*(?:₽|руб)?\s*\/\s*пог/i.exec(html);

  if (pogonMatch) {
    const pricePogM = parseInt(pogonMatch[1].replace(/[^\d]/g, ''), 10);
    if (!isNaN(pricePogM) && pricePogM > 0) {
      const len = (dims && dims.length && dims.length >= 1000) ? dims.length : 3000;
      return Math.round(pricePogM * (len / 1000));
    }
  }

  // Б. Мета-цена schema.org
  const metaMatch = /<meta[^>]+itemprop=["']price["'][^>]+content=["'](\d+[\.\d]*)["']/i.exec(html);
  if (metaMatch) {
    const val = parseFloat(metaMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val);
  }

  // В. Блок цены .price-current strong
  const strongMatch = /class=["'][^"']*price-current[^"']*["'][^>]*>[\s\S]*?<strong>([\d\s]+)<\/strong>/i.exec(html);
  if (strongMatch) {
    const val = parseInt(strongMatch[1].replace(/[^\d]/g, ''), 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

/**
 * 4. Бронебойное извлечение габаритов с нормализацией символов x/х/×
 */
function extractOliverDeckDimensions(html, title, url, type) {
  const result = {
    length: null,
    width: null,
    thickness: null,
    height_mm: null,
    height_min: null,
    height_max: null,
    max_load_kg: null,
    wall_thickness_mm: null,
    profile_width_mm: null,
    profile_height_mm: null
  };

  const titleAndUrl = (title + ' ' + url).toLowerCase();

  // Сбор всех возможных источников строки с размером
  const candidateTexts = [];

  // 1. Извлечение текста из любого <div class="option_body">, содержащего цифры
  const optionBodyRegex = /<div[^>]*class=["'][^"']*option_body[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let obMatch;
  while ((obMatch = optionBodyRegex.exec(html)) !== null) {
    const textInside = cleanHtmlText(obMatch[1]);
    // Исключаем контейнеры цветов (в них есть li)
    if (textInside && /\d/.test(textInside) && !obMatch[1].includes('<li')) {
      candidateTexts.push(textInside);
    }
  }

  // 2. Извлечение строки размера из JSON shop2.init({"productRefs": ... "razmer": ...})
  const razmerJsonMatch = /"razmer"\s*:\s*\{\s*"([^"]+)"/i.exec(html);
  if (razmerJsonMatch) {
    candidateTexts.push(decodeUnicodeEscapes(razmerJsonMatch[1]));
  }

  // 3. Извлечение из характеристик (#tabs-16, #tabs-17)
  const charMatch = /(?:размер|габарит|диапазон\s*высот)[^:<]*:\s*([^<\n]+)/i.exec(html);
  if (charMatch) {
    candidateTexts.push(cleanHtmlText(charMatch[1]));
  }

  // 4. Название и URL товара
  candidateTexts.push(title);
  candidateTexts.push(url);

  // Объединяем и нормализуем все разделители в стандартный латинский 'x'
  const normalizedRaw = candidateTexts.join(' | ');
  const normalized = normalizeDimensionString(normalizedRaw);

  // -------------------------------------------------------------
  // А. РЕГУЛИРУЕМЫЕ ОПОРЫ (СТРОГО исключая лаги!)
  // -------------------------------------------------------------
  const isOpornLaga = titleAndUrl.includes('опорная') || titleAndUrl.includes('опорн') || titleAndUrl.includes('opornaya') || titleAndUrl.includes('laga') || titleAndUrl.includes('лаг');
  const isPedestal = (type === 'adjustable_pedestal')
    || (titleAndUrl.includes('опора') && !isOpornLaga)
    || (titleAndUrl.includes('opora') && !isOpornLaga)
    || (titleAndUrl.includes('level') && !isOpornLaga && !titleAndUrl.includes('frame') && !titleAndUrl.includes('flat') && !titleAndUrl.includes('lite'));

  if (isPedestal) {
    const rangeMatch = /(\d{2,3})\s*-\s*(\d{2,3})/i.exec(normalized);
    if (rangeMatch) {
      const h1 = parseInt(rangeMatch[1], 10);
      const h2 = parseInt(rangeMatch[2], 10);
      result.height_min = Math.min(h1, h2);
      result.height_max = Math.max(h1, h2);
      result.length = result.height_max;
      result.width = 200;
      result.thickness = result.height_min;
      result.height_mm = result.height_max;
    } else if (titleAndUrl.includes('level low') || normalized.includes('12')) {
      result.height_min = 12;
      result.height_max = 12;
      result.thickness = 12;
      result.height_mm = 12;
      result.length = 12;
      result.width = 150;
    }

    const loadMatch = /(?:несущая\s*мощность|нагрузк[а-я]|load)[:\s]*(\d{3,4})\s*кг/i.exec(html)
      || /(\d{3,4})\s*кг/i.exec(normalized);
    result.max_load_kg = loadMatch ? parseInt(loadMatch[1], 10) : 1000;

    return result;
  }

  // -------------------------------------------------------------
  // Б. ПРОФИЛЬНЫЕ ТРУБЫ И СИЛОВОЙ КАРКАС (80x80x3, 40x40x2, 40x20x2, 60x40x2)
  // -------------------------------------------------------------
  if (type === 'foundation_beam' || titleAndUrl.includes('труба') || titleAndUrl.includes('truba')) {
    const pipeMatch = /(\d{2,3})\s*x\s*(\d{2,3})\s*(?:x\s*(\d{1,2}))?/i.exec(normalized);
    if (pipeMatch) {
      const d1 = parseInt(pipeMatch[1], 10);
      const d2 = parseInt(pipeMatch[2], 10);
      const wall = pipeMatch[3] ? parseInt(pipeMatch[3], 10) : (d1 >= 80 ? 3 : 2);
      result.width = Math.max(d1, d2);
      result.thickness = Math.min(d1, d2);
      result.height_mm = result.thickness;
      result.length = 6000;
      result.profile_width_mm = result.width;
      result.profile_height_mm = result.thickness;
      result.wall_thickness_mm = wall;
      return result;
    }
  }

  // -------------------------------------------------------------
  // В. СТАНДАРТНЫЙ 3D ГАБАРИТ (толщина x ширина x длина):
  // 15x40x3000, 11x145x3000, 22x345x3000, 25x140x3000, 24x147x3000
  // -------------------------------------------------------------
  const match3D = /(\d{1,3})\s*x\s*(\d{2,4})\s*x\s*(\d{3,5})/i.exec(normalized);
  if (match3D) {
    const n1 = parseInt(match3D[1], 10);
    const n2 = parseInt(match3D[2], 10);
    const n3 = parseInt(match3D[3], 10);

    result.thickness = Math.min(n1, n2);
    result.width = Math.max(n1, n2);
    result.height_mm = result.thickness;
    result.length = n3;
    return result;
  }

  // -------------------------------------------------------------
  // Г. 2D ГАБАРИТ (толщина x ширина): 22x345, 11x145, 15x40, 28x40
  // -------------------------------------------------------------
  const match2D = /(\d{1,3})\s*x\s*(\d{2,4})/i.exec(normalized);
  if (match2D) {
    const n1 = parseInt(match2D[1], 10);
    const n2 = parseInt(match2D[2], 10);
    result.thickness = Math.min(n1, n2);
    result.width = Math.max(n1, n2);
    result.height_mm = result.thickness;
  }

  // Длина по умолчанию для декинга
  if (!result.length) {
    const lengthMatch = /(?:3000|4000|6000|2900|2200|5800)\s*мм/i.exec(normalized)
      || /(\d{4})\s*(?:мм|mm)/i.exec(normalized);
    result.length = lengthMatch ? parseInt(lengthMatch[1] || lengthMatch[0], 10) : 3000;
  }

  return result;
}

/**
 * Нормализатор: заменяет все типы разделителей (х/x/X/×/\u00D7/\u0445) на латинский 'x'
 */
function normalizeDimensionString(str) {
  if (!str) return '';
  return str
    .replace(/\\u0445/gi, 'x')
    .replace(/\\u00D7/gi, 'x')
    .replace(/\\u2013|\\u2014/gi, '-')
    .replace(/[хХxX*×\u00D7]/g, 'x')
    .replace(/[–—]/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function decodeUnicodeEscapes(str) {
  if (!str) return '';
  return str.replace(/\\u([0-9a-fA-F]{4})/g, function (match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  });
}

/**
 * 5. Определение бренда OliverDeck
 */
function detectOliverDeckBrand(html, title, url) {
  const text = (title + ' ' + url + ' ' + html.substring(0, 10000)).toLowerCase();

  if (text.includes('level') || text.includes('левел')) return 'opt_brand_level';
  if (text.includes('kronex') || text.includes('кронекс')) return 'opt_brand_kronex';
  if (text.includes('terrapol') || text.includes('террапол')) return 'opt_brand_terrapol';
  if (text.includes('woodvex') || text.includes('вудвикс')) return 'opt_brand_woodvex';
  if (text.includes('cm decking') || text.includes('vintage') || text.includes('robust')) return 'opt_brand_cm_decking';
  if (text.includes('outdoor')) return 'opt_brand_outdoor';
  if (text.includes('bruggan') || text.includes('брюган')) return 'opt_brand_bruggan';
  if (text.includes('legro') || text.includes('легро')) return 'opt_brand_legro';
  if (text.includes('unodeck')) return 'opt_brand_unodeck';

  return 'opt_brand_oliverdeck';
}

/**
 * 6. Определение материала
 */
function extractOliverDeckMaterial(html, title, type) {
  const text = (title + ' ' + html.substring(0, 10000)).toLowerCase();

  if (type === 'adjustable_pedestal') return 'Полипропилен';
  if (type === 'foundation_beam' && (text.includes('сталь') || text.includes('труба'))) return 'Сталь';
  if (text.includes('алюмин')) return 'Алюминий';
  if (text.includes('мпк') || text.includes('минерально')) return 'МПК (Минерально-полимерный композит)';
  if (text.includes('дпк') || text.includes('декинг') || text.includes('композит')) return 'ДПК (Древесно-полимерный композит)';
  if (text.includes('металл')) return 'Металл';

  return 'ДПК (Древесно-полимерный композит)';
}

/**
 * 7. Извлечение оригинального фото высокого разрешения (/d/filename.jpg)
 */
function extractOliverDeckMainImage(html) {
  const fullResMatch = /<a[^>]+href=["'](\/d\/[^"']+\.(?:webp|jpg|png|jpeg))["']/i.exec(html);
  if (fullResMatch) {
    return 'https://oliverdeck.ru' + fullResMatch[1];
  }

  const metaImgMatch = /<meta[^>]+itemprop=["']image["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (metaImgMatch && isValidImageUrl(metaImgMatch[1])) {
    return resolveFullImageUrl(metaImgMatch[1]);
  }

  const sliderMatch = /<div[^>]*class=["'][^"']*product_image[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i.exec(html);
  if (sliderMatch && isValidImageUrl(sliderMatch[1])) {
    return resolveFullImageUrl(sliderMatch[1]);
  }

  return '';
}

function resolveFullImageUrl(rawUrl) {
  if (!rawUrl) return '';
  const match = /\/d\/([^"'\s?]+\.(?:webp|jpg|png|jpeg))/i.exec(rawUrl);
  if (match) {
    return 'https://oliverdeck.ru/d/' + match[1];
  }
  return rawUrl.startsWith('http') ? rawUrl : ('https://oliverdeck.ru' + rawUrl);
}

function isValidImageUrl(url) {
  return url && !url.includes('no_photo') && !url.endsWith('.svg') && !url.includes('data:image');
}

/**
 * 8. Извлечение модификаций по цветам (.shop2-color-ext-list)
 */
function extractOliverDeckOffers(html, title, url, defaultMainImage, defaultPrice, dims) {
  const variants = [];
  const seenSlugs = new Set();

  const listMatch = /<ul[^>]*class=["'][^"']*shop2-color-ext-list[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i.exec(html);

  if (listMatch) {
    const listHtml = listMatch[1];
    const liRegex = /<li[^>]+data-kinds=["'](\d+)["'][^>]*>([\s\S]*?)<\/li>/gi;
    let match;

    while ((match = liRegex.exec(listHtml)) !== null) {
      const kindId = match[1].trim();
      const liBlock = match[2];

      const titleMatch = /data-title=["']([^"']+)["']/i.exec(liBlock)
        || /alt=["']([^"']+)["']/i.exec(liBlock);
      const rawColorName = titleMatch ? titleMatch[1].trim() : '';

      if (!rawColorName || rawColorName === '-') continue;

      const colorInfo = mapColorNameToOption(rawColorName);

      const bgMatch = /style=["'][^"']*background-image:\s*url\(([^)]+)\)/i.exec(liBlock);
      const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(liBlock);
      let colorImg = bgMatch ? bgMatch[1].replace(/['"]/g, '') : (imgMatch ? imgMatch[1] : defaultMainImage);
      colorImg = resolveFullImageUrl(colorImg);

      let variantSlug = colorInfo.slug;
      const noMatch = /(?:№|no\.?|номер|_no)\s*(\d+)/i.exec(title + ' ' + url);
      if (noMatch && !variantSlug.includes('no' + noMatch[1])) {
        variantSlug += '_no' + noMatch[1];
      }

      if (!seenSlugs.has(variantSlug)) {
        seenSlugs.add(variantSlug);
        variants.push({
          kind_id: kindId,
          name: rawColorName,
          slug: variantSlug,
          option_code: colorInfo.option_code,
          hex: colorInfo.hex,
          image_url: colorImg || defaultMainImage,
          price: defaultPrice
        });
      }
    }
  }

  // Если у товара нет выбора цветов (опоры, лаги, трубы, крепеж)
  if (variants.length === 0) {
    const detectedColor = detectColorFromTitleOrUrl(title, url);
    let variantSlug = detectedColor.slug;
    const noMatch = /(?:№|no\.?|номер|_no)\s*(\d+)/i.exec(title + ' ' + url);
    if (noMatch && !variantSlug.includes('no' + noMatch[1])) {
      variantSlug += '_no' + noMatch[1];
    }

    variants.push({
      kind_id: null,
      name: detectedColor.name + (noMatch ? ' (№' + noMatch[1] + ')' : ''),
      slug: variantSlug,
      option_code: detectedColor.option_code,
      hex: detectedColor.hex,
      image_url: defaultMainImage,
      price: defaultPrice
    });
  }

  return variants;
}

/**
 * 9. Сопоставление названия цвета со словарем VMS-NC
 */
function mapColorNameToOption(colorTitle) {
  const lower = colorTitle.toLowerCase().trim();

  if (lower.includes('венге') || lower.includes('wenge')) return { slug: 'wenge', option_code: 'opt_wenge', hex: '#3B2219' };
  if (lower.includes('шоколад')) return { slug: 'chocolate', option_code: 'opt_chocolate', hex: '#3B2219' };
  if (lower.includes('черн') || lower.includes('black')) return { slug: 'black_wood', option_code: 'opt_black_wood', hex: '#1A1A1A' };
  if (lower.includes('антрацит')) return { slug: 'anthracite', option_code: 'opt_anthracite', hex: '#2D3748' };
  if (lower.includes('графит')) return { slug: 'graphite', option_code: 'opt_graphite', hex: '#4A5568' };
  if (lower.includes('серый') || lower.includes('серая') || lower.includes('дым')) return { slug: 'grey', option_code: 'opt_grey', hex: '#808080' };
  if (lower.includes('орех') || lower.includes('милано')) return { slug: 'walnut', option_code: 'opt_walnut', hex: '#5A3D28' };
  if (lower.includes('дуб') || lower.includes('севиль')) return { slug: 'oak', option_code: 'opt_oak', hex: '#C4A77D' };
  if (lower.includes('тик')) return { slug: 'teak', option_code: 'opt_teak', hex: '#B57C48' };
  if (lower.includes('ясен')) return { slug: 'ashwood', option_code: 'opt_ashwood', hex: '#CDB286' };
  if (lower.includes('жемчуг') || lower.includes('белый') || lower.includes('бело')) return { slug: 'white', option_code: 'opt_white', hex: '#F0EBE0' };
  if (lower.includes('какао') || lower.includes('коричнев') || lower.includes('кофе')) return { slug: 'brown', option_code: 'opt_brown', hex: '#654321' };
  if (lower.includes('песоч') || lower.includes('песок')) return { slug: 'sand', option_code: 'opt_sand', hex: '#A07855' };
  if (lower.includes('бронз')) return { slug: 'bronze', option_code: 'opt_bronze', hex: '#8B5A2B' };
  if (lower.includes('бежев') || lower.includes('оникс')) return { slug: 'beige', option_code: 'opt_beige', hex: '#C4A77D' };
  if (lower.includes('терракот') || lower.includes('красн')) return { slug: 'terracotta', option_code: 'opt_terracotta', hex: '#8C3B2B' };
  if (lower.includes('махагон')) return { slug: 'mahogany', option_code: 'opt_mahogany', hex: '#4A151B' };

  const translit = transliterate(lower).replace(/[^a-z0-9_]/gi, '_').substring(0, 15);
  return {
    slug: translit || 'natural',
    option_code: 'opt_' + (translit || 'natural'),
    hex: '#A07855'
  };
}

function detectColorFromTitleOrUrl(title, url) {
  const text = (title + ' ' + url).toLowerCase();
  if (text.includes('опора') || text.includes('level') || text.includes('kronex')) {
    return { name: 'Черный', slug: 'black_wood', hex: '#1A1A1A', option_code: 'opt_black_wood' };
  }
  if (text.includes('труба') || text.includes('сталь') || text.includes('алюмин') || text.includes('laga')) {
    return { name: 'Серебристый', slug: 'silver', hex: '#C0C0C0', option_code: 'opt_silver' };
  }
  return mapColorNameToOption(title);
}

function detectProductTypeFromUrlOrTitle(url, title) {
  const text = (url + ' ' + title).toLowerCase();
  const isOpornLaga = text.includes('опорная') || text.includes('опорн') || text.includes('laga') || text.includes('лаг');

  if ((text.includes('опора') || text.includes('level')) && !isOpornLaga) return 'adjustable_pedestal';
  if (text.includes('труба') || text.includes('балк')) return 'foundation_beam';
  if (text.includes('ступен')) return 'stepBoard';
  if (text.includes('угол')) return 'decorProducts';
  if (text.includes('забор') || text.includes('обрамлен')) return 'board';
  if (text.includes('лага')) return 'joist';
  if (text.includes('кляймер') || text.includes('крепеж') || text.includes('клипса')) return 'brackets';
  return 'terraceBoard';
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