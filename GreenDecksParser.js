/**
 * GreenDecksParser.js — Модуль парсинга страниц товаров Bitrix24 магазина GreenDecks (greendecks.kz)
 * Поддерживает извлечение уникальных фото слайдера под каждый цвет, чистые латинские слаги и нормализацию URL.
 */

/**
 * Главная точка разбора HTML страницы товара GreenDecks
 *
 * @param {string} html Сырой HTML-код страницы
 * @param {string} url URL-адрес страницы
 * @param {string} defaultType Тип товара (terraceBoard, stepBoard, joist, brackets и др.)
 * @returns {object} Структурированные данные о товаре и его торговых предложениях
 */
function parseGreenDecksProductPage(html, url, defaultType) {
  const cleanUrl = cleanProductUrl(url);

  // 1. Изолируем только карточку товара, полностью отсекая блок рекомендаций
  const mainHtml = isolateMainProductHtml(html);

  const name = extractGreenDecksTitle(mainHtml, cleanUrl);
  const dims = extractGreenDecksDimensions(mainHtml, name, cleanUrl);
  const material = extractGreenDecksMaterial(mainHtml, name);
  const brand = detectGreenDecksBrand(mainHtml, name, cleanUrl);
  const price = extractGreenDecksPrice(mainHtml);

  // 2. Извлекаем главное фото из главного слайдера (/iblock/...)
  const mainImage = extractGreenDecksMainSliderImage(mainHtml);

  // 3. Извлекаем торговые предложения (SKU) с привязкой УНИКАЛЬНЫХ фото каждого цвета из слайдера
  const colorVariants = extractGreenDecksOffers(mainHtml, name, cleanUrl, mainImage, price);

  return {
    name: name,
    url: cleanUrl,
    type: defaultType || 'terraceBoard',
    brand: brand,
    material: material,
    length_mm: dims.length,
    width_mm: dims.width,
    thickness_mm: dims.thickness,
    price_retail: price,
    main_image: mainImage,
    variants: colorVariants
  };
}

/**
 * Очистка URL от рекламных меток (?srsltid=...), параметров языка и корзины
 */
function cleanProductUrl(url) {
  if (!url) return '';
  const clean = url.split('?')[0].replace(/\/+$/, '') + '/';
  return clean;
}

/**
 * Изоляция HTML-кода карточки товара от блоков кросс-сейла и подвала
 */
function isolateMainProductHtml(html) {
  if (!html) return '';

  const cutoffRegex = /<h[1-6][^>]*>\s*С этим товаром покупают[\s\S]*$/i;
  let isolated = html.replace(cutoffRegex, '');

  const blockCatalogIdx = isolated.indexOf('block-store-catalog-list');
  if (blockCatalogIdx !== -1) {
    isolated = isolated.substring(0, blockCatalogIdx);
  }

  const elementStartIdx = isolated.indexOf('bx-catalog-element');
  if (elementStartIdx !== -1) {
    isolated = isolated.substring(elementStartIdx);
  }

  return isolated;
}

/**
 * 1. Извлечение названия товара из <h1>
 */
function extractGreenDecksTitle(mainHtml, url) {
  const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(mainHtml);
  if (h1Match) {
    return h1Match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  const cleanSlug = url.replace(/\/$/, '').split('/').pop();
  return cleanSlug.replace(/_/g, ' ');
}

/**
 * 2. Извлечение розничной цены в тенге (KZT)
 */
function extractGreenDecksPrice(mainHtml) {
  const metaPriceMatch = /<meta[^>]+itemprop=["']price["'][^>]+content=["'](\d+[\.\d]*)["']/i.exec(mainHtml);
  if (metaPriceMatch) {
    const val = parseFloat(metaPriceMatch[1]);
    if (!isNaN(val) && val > 0) return val;
  }

  const classPriceMatch = /class=["'][^"']*product-item-detail-price-current[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(mainHtml);
  if (classPriceMatch) {
    const digits = classPriceMatch[1].replace(/&nbsp;/g, '').replace(/[^\d]/g, '');
    const val = parseInt(digits, 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

/**
 * 3. Извлечение габаритов (ширина, толщина, длина)
 */
function extractGreenDecksDimensions(mainHtml, title, url) {
  const result = { width: null, thickness: null, length: null };
  const combined = (title + ' ' + url + ' ' + mainHtml.substring(0, 8000)).toLowerCase();

  const dimRowMatch = /<tr[^>]*>[\s\S]*?<td[^>]*>[\s\S]*?(?:размер|габарит)[\s\S]*?<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/i.exec(mainHtml);
  if (dimRowMatch) {
    const rawDimText = dimRowMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
    parseDimensionString(rawDimText, result);
  }

  if (!result.width || !result.thickness) {
    const normalized = (title + ' ' + url)
      .replace(/(\d+)kh(\d+)/gi, '$1x$2')
      .replace(/(\d+)mm[_-](\d+)mm/gi, '$1x$2');

    parseDimensionString(normalized, result);
  }

  if (!result.length) {
    const lengthMatch = /(?:3000|4000|3600|3010|2440|2200|2900)\s*мм/i.exec(combined)
      || /(\d{4})\s*(?:мм|mm)/i.exec(combined);
    if (lengthMatch) {
      result.length = parseInt(lengthMatch[1] || lengthMatch[0], 10);
    } else {
      result.length = 2900;
    }
  }

  return result;
}

function parseDimensionString(text, result) {
  const match3D = /(\d{2,3})\s*[хxX*]\s*(\d{2,3})\s*[хxX*]\s*(\d{3,4})/i.exec(text);
  if (match3D) {
    const n1 = parseInt(match3D[1], 10);
    const n2 = parseInt(match3D[2], 10);
    const n3 = parseInt(match3D[3], 10);
    result.width = Math.max(n1, n2);
    result.thickness = Math.min(n1, n2);
    result.length = n3;
    return;
  }

  const match2D = /(\d{2,3})\s*[хxX*]\s*(\d{2,3})/i.exec(text);
  if (match2D) {
    const n1 = parseInt(match2D[1], 10);
    const n2 = parseInt(match2D[2], 10);
    result.width = Math.max(n1, n2);
    result.thickness = Math.min(n1, n2);
  }
}

/**
 * 4. Определение материала
 */
function extractGreenDecksMaterial(mainHtml, title) {
  const text = (title + ' ' + mainHtml.substring(0, 8000)).toLowerCase();
  if (text.includes('дпк') || text.includes('декинг') || text.includes('композит') || text.includes('wood') || text.includes('vud')) {
    return 'ДПК (Древесно-полимерный композит)';
  }
  if (text.includes('алюминий') || text.includes('алюминиев')) return 'Алюминий';
  if (text.includes('полиуретан') || text.includes('welltouch') || text.includes('pudeck')) return 'Полиуретан';
  if (text.includes('металл') || text.includes('сталь')) return 'Металл';
  if (text.includes('пвх')) return 'ПВХ';
  return 'ДПК (Древесно-полимерный композит)';
}

/**
 * 5. Определение бренда
 */
function detectGreenDecksBrand(mainHtml, title, url) {
  const text = (title + ' ' + url + ' ' + mainHtml.substring(0, 8000)).toLowerCase();

  if (text.includes('legro')) return 'opt_brand_legro';
  if (text.includes('easydecking') || text.includes('edecking')) return 'opt_brand_easydecking';
  if (text.includes('welltouch')) return 'opt_brand_welltouch';
  if (text.includes('timber essential') || text.includes('timber_essential')) return 'opt_brand_timber-essential';
  if (text.includes('timbertech')) return 'opt_brand_3d-wood';
  if (text.includes('pudeck')) return 'opt_brand_pudeck';
  if (text.includes('greenwood')) return 'opt_brand_greenwood';
  if (text.includes('aludeck')) return 'opt_brand_aludeck';
  if (text.includes('prestige')) return 'opt_brand_prestige';
  if (text.includes('titan')) return 'opt_brand_titan';
  if (text.includes('polyrootd')) return 'opt_brand_polyrootd';
  if (text.includes('master')) return 'opt_brand_master';
  if (text.includes('robust')) return 'opt_brand_robust';
  if (text.includes('nauticprime')) return 'opt_brand_nauticprime';
  if (text.includes('select')) return 'opt_brand_select';
  if (text.includes('crown')) return 'opt_brand_crown';
  if (text.includes('hilst')) return 'opt_brand_hilst';
  if (text.includes('holzhof') || text.includes('deckron')) return 'opt_brand_holzhof';
  if (text.includes('brushing mix') || text.includes('brushing-mix')) return 'opt_brand_brushing-mix';

  return 'opt_brand_greendecks';
}

/**
 * 6. Извлечение БОЛЬШОГО фото из главного слайдера карточки товара (/iblock/...)
 */
function extractGreenDecksMainSliderImage(mainHtml) {
  const sliderImgMatch = /<div[^>]*class=["'][^"']*product-item-detail-slider-image[^"']*["'][^>]*>\s*<img[^>]+src=["']([^"']+\/iblock\/[^"']+)["']/i.exec(mainHtml);
  if (sliderImgMatch) return sliderImgMatch[1];

  const anyIblockMatch = /<div[^>]*class=["'][^"']*product-item-detail-slider-block[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+\/iblock\/[^"']+)["']/i.exec(mainHtml);
  if (anyIblockMatch) return anyIblockMatch[1];

  const ogMatch = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(mainHtml);
  if (ogMatch) return ogMatch[1];

  return null;
}

/**
 * 7. Извлечение торговых предложений (SKU модификаций) с УНИКАЛЬНЫМИ фото каждого цвета из слайдера
 */
function extractGreenDecksOffers(mainHtml, title, url, defaultMainImage, defaultPrice) {
  const variants = [];
  const seenSlugs = new Set();

  // Собираем точную карту фотографий предложений по ID цвета и по блокам слайдера
  const offerImagesMap = buildOfferImageMap(mainHtml);

  // Сканируем цветовую палитру Битрикс внутри изолированной карточки
  const colorBlockMatch = /<div[^>]+data-entity=["']sku-line-block["'][^>]*>[\s\S]*?Цвет[\s\S]*?<\/ul>/i.exec(mainHtml);
  const colorAreaHtml = colorBlockMatch ? colorBlockMatch[0] : '';

  if (colorAreaHtml) {
    const colorRegex = /<li[^>]+class=["'][^"']*product-item-scu-item-color-container[^"']*["'][^>]+title=["']([^"']+)["'][^>]+data-onevalue=["']([^"']+)["'][^>]*>/gi;
    let match;
    let colorIdx = 0;

    while ((match = colorRegex.exec(colorAreaHtml)) !== null) {
      const rawColorTitle = match[1].trim();
      const colorValueId = match[2].trim();
      if (!rawColorTitle || rawColorTitle === '-') continue;

      // 1. Ищем фото по прямому ID цвета (colorValueId)
      // 2. Если нет — по индексу соответствующего контейнера слайдера в DOM
      // 3. Если нет — фоллбэк на главное фото слайдера
      let colorImage = offerImagesMap[colorValueId]
        || (offerImagesMap._domSliderImages && offerImagesMap._domSliderImages[colorIdx])
        || defaultMainImage;

      const colorInfo = mapColorNameToOption(rawColorTitle);
      if (!seenSlugs.has(colorInfo.slug)) {
        seenSlugs.add(colorInfo.slug);
        variants.push({
          name: rawColorTitle,
          slug: colorInfo.slug,
          option_code: colorInfo.option_code,
          hex: colorInfo.hex,
          image_url: colorImage,
          price: defaultPrice
        });
      }
      colorIdx++;
    }
  }

  // Если у товара НЕТ переключателя цветов на странице
  if (variants.length === 0) {
    const detectedColor = detectColorFromTitleOrUrl(title, url);
    variants.push({
      name: detectedColor.name,
      slug: detectedColor.slug,
      option_code: detectedColor.option_code,
      hex: detectedColor.hex,
      image_url: defaultMainImage,
      price: defaultPrice
    });
  }

  return variants;
}

/**
 * Извлечение уникальных фото слайдера под каждый цвет:
 * 1. Через парсинг JS массива OFFERS (сопоставление PROP_130 -> DETAIL_PICTURE)
 * 2. Через парсинг DOM контейнеров slider_cont_<OFFER_ID>
 */
function buildOfferImageMap(mainHtml) {
  const map = {};
  const domSliderImages = [];

  // А. Парсим JS блок OFFERS по изолированным чанкам
  const offersIdx = mainHtml.indexOf("'OFFERS':");
  if (offersIdx !== -1) {
    const offersEndIdx = mainHtml.indexOf("'OFFER_SELECTED'", offersIdx);
    const offersBlock = offersEndIdx !== -1
      ? mainHtml.substring(offersIdx, offersEndIdx)
      : mainHtml.substring(offersIdx, offersIdx + 25000);

    const offerChunks = offersBlock.split(/'ID':\s*'(\d+)'/);
    for (let i = 1; i < offerChunks.length; i += 2) {
      const offerId = offerChunks[i];
      const chunk = offerChunks[i + 1] || '';

      const propMatch = /'PROP_130':\s*'(\d+)'/i.exec(chunk);
      const imgMatch = /'(?:DETAIL_PICTURE|PREVIEW_PICTURE)':\s*\{[^}]*'SRC':\s*'([^']+)'/i.exec(chunk)
        || /'SLIDER':\s*\[\s*\{[^}]*'SRC':\s*'([^']+)'/i.exec(chunk);

      if (propMatch && imgMatch) {
        map[propMatch[1]] = imgMatch[1];
        map['offer_' + offerId] = imgMatch[1];
      }
    }
  }

  // Б. Парсим DOM-контейнеры элементов управления слайдером: slider_cont_<OFFER_ID>
  const sliderBlockRegex = /id=["'][^"']*slider_cont_(\d+)["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  let sMatch;
  while ((sMatch = sliderBlockRegex.exec(mainHtml)) !== null) {
    const offerId = sMatch[1];
    const blockContent = sMatch[2];
    const imgMatch = /<img[^>]+src=["']([^"']+\/iblock\/[^"']+)["']/i.exec(blockContent);
    if (imgMatch) {
      map['offer_' + offerId] = imgMatch[1];
      if (!domSliderImages.includes(imgMatch[1])) {
        domSliderImages.push(imgMatch[1]);
      }
    }
  }

  map._domSliderImages = domSliderImages;
  return map;
}

/**
 * Определение цвета из названия товара или URL (для товаров с 1 цветом на странице)
 */
function detectColorFromTitleOrUrl(title, url) {
  const text = (title + ' ' + url).toLowerCase();

  if (text.includes('венге') || text.includes('wenge')) return { name: 'Венге', slug: 'wenge', hex: '#3B2219', option_code: 'opt_venge' };
  if (text.includes('черное дерево') || text.includes('черный') || text.includes('black')) return { name: 'Черное дерево', slug: 'black_wood', hex: '#1A1A1A', option_code: 'opt_antracit' };
  if (text.includes('антрацит') || text.includes('anthracite')) return { name: 'Антрацит', slug: 'anthracite', hex: '#2D3748', option_code: 'opt_antracit' };
  if (text.includes('темно') && text.includes('коричнев')) return { name: 'Темно-коричневый', slug: 'dark_brown', hex: '#3B2219', option_code: 'opt_temno-koricnevyi' };
  if (text.includes('шоколад')) return { name: 'Шоколад', slug: 'chocolate', hex: '#3B2219', option_code: 'opt_sokolad' };
  if (text.includes('grey') || text.includes('серый')) return { name: 'Серый', slug: 'grey', hex: '#808080', option_code: 'opt_seryi' };
  if (text.includes('graphite') || text.includes('графит')) return { name: 'Графит', slug: 'graphite', hex: '#4A5568', option_code: 'opt_grafit' };
  if (text.includes('walnut') || text.includes('орех')) return { name: 'Грецкий Орех', slug: 'walnut', hex: '#5A3D28', option_code: 'opt_gdk_natural' };
  if (text.includes('dub') || text.includes('дуб') || text.includes('oak')) return { name: 'Дуб', slug: 'oak', hex: '#C4A77D', option_code: 'opt_dub' };
  if (text.includes('teak') || text.includes('тик')) return { name: 'Тик', slug: 'teak', hex: '#B57C48', option_code: 'opt_gdk_natural' };
  if (text.includes('chestnut') || text.includes('каштан')) return { name: 'Каштан', slug: 'chestnut', hex: '#8B4513', option_code: 'opt_terrakot' };
  if (text.includes('brown') || text.includes('коричнев')) return { name: 'Коричневый', slug: 'brown', hex: '#654321', option_code: 'opt_koricnevyi' };
  if (text.includes('natural') || text.includes('натураль')) return { name: 'Натуральный', slug: 'natural', hex: '#C4A77D', option_code: 'opt_gdk_natural' };
  if (text.includes('bicolor') || text.includes('двухцвет')) return { name: 'Двухцветная', slug: 'bicolor', hex: '#654321', option_code: 'opt_gdk_dvukhtsvetnaya' };
  if (text.includes('silver') || text.includes('серебрист')) return { name: 'Серебристый', slug: 'silver', hex: '#C0C0C0', option_code: 'opt_gdk_serebristyy' };
  if (text.includes('white') || text.includes('белый') || text.includes('пломбир')) return { name: 'Белый', slug: 'white', hex: '#F0EBE0', option_code: 'opt_belyi' };

  return { name: 'Натуральный', slug: 'natural', hex: '#A07855', option_code: 'opt_gdk_natural' };
}

/**
 * 8. Сопоставление названия цвета со словарем VMS-NC (только латинские слаги и точный HEX)
 */
function mapColorNameToOption(colorTitle) {
  const lower = colorTitle.toLowerCase().trim();

  if (lower.includes('венге') || lower.includes('wenge'))
    return { slug: 'wenge', option_code: 'opt_venge', hex: '#3B2219' };

  if (lower.includes('черное дерево') || lower.includes('black wood') || lower.includes('черный') || lower.includes('black'))
    return { slug: 'black_wood', option_code: 'opt_antracit', hex: '#1A1A1A' };

  if (lower.includes('антрацит') || lower.includes('anthracite'))
    return { slug: 'anthracite', option_code: 'opt_antracit', hex: '#2D3748' };

  if (lower.includes('темно') && lower.includes('коричнев') || lower.includes('dark brown'))
    return { slug: 'dark_brown', option_code: 'opt_temno-koricnevyi', hex: '#3B2219' };

  if (lower.includes('светло') && lower.includes('коричнев') || lower.includes('light brown'))
    return { slug: 'light_brown', option_code: 'opt_svetlo-koricnevyi', hex: '#8B5A2B' };

  if (lower.includes('шоколад') || lower.includes('chocolate'))
    return { slug: 'chocolate', option_code: 'opt_sokolad', hex: '#3B2219' };

  if (lower.includes('орех') || lower.includes('walnut'))
    return { slug: 'walnut', option_code: 'opt_gdk_natural', hex: '#5A3D28' };

  if (lower.includes('клен') || lower.includes('maple'))
    return { slug: 'maple', option_code: 'opt_gdk_natural', hex: '#CDB286' };

  if (lower.includes('тик') || lower.includes('teak'))
    return { slug: 'teak', option_code: 'opt_gdk_natural', hex: '#B57C48' };

  if (lower.includes('базальт') || lower.includes('basalt'))
    return { slug: 'basalt', option_code: 'opt_antracit', hex: '#3E3E3E' };

  if (lower.includes('серый') || lower.includes('grey') || lower.includes('gray'))
    return { slug: 'grey', option_code: 'opt_seryi', hex: '#808080' };

  if (lower.includes('графит') || lower.includes('graphite'))
    return { slug: 'graphite', option_code: 'opt_grafit', hex: '#4A5568' };

  if (lower.includes('дуб') || lower.includes('oak'))
    return { slug: 'oak', option_code: 'opt_dub', hex: '#C4A77D' };

  if (lower.includes('каштан') || lower.includes('chestnut'))
    return { slug: 'chestnut', option_code: 'opt_terrakot', hex: '#8B4513' };

  if (lower.includes('старый амбар') || lower.includes('дрифтвуд') || lower.includes('barnwood'))
    return { slug: 'barnwood', option_code: 'opt_seryi', hex: '#696969' };

  if (lower.includes('серебрист') || lower.includes('silver'))
    return { slug: 'silver', option_code: 'opt_gdk_serebristyy', hex: '#C0C0C0' };

  if (lower.includes('двухцветн') || lower.includes('dual') || lower.includes('bicolor'))
    return { slug: 'bicolor', option_code: 'opt_gdk_dvukhtsvetnaya', hex: '#654321' };

  if (lower.includes('коричнев') || lower.includes('brown'))
    return { slug: 'brown', option_code: 'opt_koricnevyi', hex: '#654321' };

  if (lower.includes('пломбир') || lower.includes('белый') || lower.includes('white'))
    return { slug: 'white', option_code: 'opt_belyi', hex: '#F0EBE0' };

  if (lower.includes('терракот') || lower.includes('terracotta') || lower.includes('красный'))
    return { slug: 'terracotta', option_code: 'opt_terrakot', hex: '#8C3B2B' };

  if (lower.includes('песочный') || lower.includes('sand') || lower.includes('бронза'))
    return { slug: 'sand', option_code: 'opt_pesocnyi', hex: '#A07855' };

  const translitSlug = transliterate(lower).replace(/[^a-z0-9_]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 15);
  return {
    slug: translitSlug || 'natural',
    option_code: 'opt_' + (translitSlug || 'natural'),
    hex: '#A07855'
  };
}

/**
 * Простая транслитерация кириллицы в латиницу для исключения русских букв в слагах
 */
function transliterate(word) {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  return word.split('').map(letter => ru[letter] || letter).join('');
}