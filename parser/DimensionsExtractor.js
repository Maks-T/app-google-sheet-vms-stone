/**
 * parser/DimensionsExtractor.js — Извлечение габаритов (3D/2D), диапазонов опор и профильных труб
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
  const candidateTexts = [];

  const optionBodyRegex = /<div[^>]*class=["'][^"']*option_body[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let obMatch;
  while ((obMatch = optionBodyRegex.exec(html)) !== null) {
    const textInside = cleanHtmlText(obMatch[1]);
    if (textInside && /\d/.test(textInside) && !obMatch[1].includes('<li')) {
      candidateTexts.push(textInside);
    }
  }

  const razmerJsonMatch = /"razmer"\s*:\s*\{\s*"([^"]+)"/i.exec(html);
  if (razmerJsonMatch) {
    candidateTexts.push(decodeUnicodeEscapes(razmerJsonMatch[1]));
  }

  const charMatch = /(?:размер|габарит|диапазон\s*высот)[^:<]*:\s*([^<\n]+)/i.exec(html);
  if (charMatch) {
    candidateTexts.push(cleanHtmlText(charMatch[1]));
  }

  candidateTexts.push(title);
  candidateTexts.push(url);

  const normalizedRaw = candidateTexts.join(' | ');
  const normalized = normalizeDimensionString(normalizedRaw);

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

  const match2D = /(\d{1,3})\s*x\s*(\d{2,4})/i.exec(normalized);
  if (match2D) {
    const n1 = parseInt(match2D[1], 10);
    const n2 = parseInt(match2D[2], 10);
    result.thickness = Math.min(n1, n2);
    result.width = Math.max(n1, n2);
    result.height_mm = result.thickness;
  }

  if (!result.length) {
    const lengthMatch = /(?:3000|4000|6000|2900|2200|5800)\s*мм/i.exec(normalized)
      || /(\d{4})\s*(?:мм|mm)/i.exec(normalized);
    result.length = lengthMatch ? parseInt(lengthMatch[1] || lengthMatch[0], 10) : 3000;
  }

  return result;
}