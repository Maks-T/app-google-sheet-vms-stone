/**
 * parser/ColorExtractor.js — Извлечение цветовых вариаций и модификаций SKU
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

function mapColorNameToOption(colorTitle) {
  const lower = colorTitle.toLowerCase().trim();

  if (lower.includes('венге') || lower.includes('wenge')) return { name: 'Венге', slug: 'wenge', option_code: 'opt_wenge', hex: '#3B2219' };
  if (lower.includes('шоколад')) return { name: 'Шоколад', slug: 'chocolate', option_code: 'opt_chocolate', hex: '#3B2219' };
  if (lower.includes('черн') || lower.includes('black')) return { name: 'Черное дерево', slug: 'black_wood', option_code: 'opt_black_wood', hex: '#1A1A1A' };
  if (lower.includes('антрацит')) return { name: 'Антрацит', slug: 'anthracite', option_code: 'opt_anthracite', hex: '#2D3748' };
  if (lower.includes('графит')) return { name: 'Графит', slug: 'graphite', option_code: 'opt_graphite', hex: '#4A5568' };
  if (lower.includes('серый') || lower.includes('серая') || lower.includes('дым')) return { name: 'Серый', slug: 'grey', option_code: 'opt_grey', hex: '#808080' };
  if (lower.includes('орех') || lower.includes('милано')) return { name: 'Орех', slug: 'walnut', option_code: 'opt_walnut', hex: '#5A3D28' };
  if (lower.includes('дуб') || lower.includes('севиль')) return { name: 'Дуб', slug: 'oak', option_code: 'opt_oak', hex: '#C4A77D' };
  if (lower.includes('тик')) return { name: 'Тик', slug: 'teak', option_code: 'opt_teak', hex: '#B57C48' };
  if (lower.includes('ясен')) return { name: 'Ясень', slug: 'ashwood', option_code: 'opt_ashwood', hex: '#CDB286' };
  if (lower.includes('жемчуг') || lower.includes('белый') || lower.includes('бело')) return { name: 'Белый', slug: 'white', option_code: 'opt_white', hex: '#F0EBE0' };
  if (lower.includes('какао') || lower.includes('коричнев') || lower.includes('кофе')) return { name: 'Коричневый', slug: 'brown', option_code: 'opt_brown', hex: '#654321' };
  if (lower.includes('песоч') || lower.includes('песок')) return { name: 'Песочный', slug: 'sand', option_code: 'opt_sand', hex: '#A07855' };
  if (lower.includes('бронз')) return { name: 'Бронза', slug: 'bronze', option_code: 'opt_bronze', hex: '#8B5A2B' };
  if (lower.includes('бежев') || lower.includes('оникс')) return { name: 'Бежевый', slug: 'beige', option_code: 'opt_beige', hex: '#C4A77D' };
  if (lower.includes('терракот') || lower.includes('красн')) return { name: 'Терракот', slug: 'terracotta', option_code: 'opt_terracotta', hex: '#8C3B2B' };
  if (lower.includes('махагон')) return { name: 'Махагон', slug: 'mahogany', option_code: 'opt_mahogany', hex: '#4A151B' };

  const translit = transliterate(lower).replace(/[^a-z0-9_]/gi, '_').substring(0, 15);
  return {
    name: colorTitle,
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