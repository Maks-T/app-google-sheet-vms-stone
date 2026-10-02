/**
 * parser/AttributeDetector.js — Определение брендов, материалов, картинок высокого разрешения и типов
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