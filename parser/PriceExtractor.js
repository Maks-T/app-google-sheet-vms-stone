/**
 * parser/PriceExtractor.js — Извлечение цен с поддержкой пересчета за погонный метр
 */

function extractOliverDeckPrice(html, dims) {
  const pogonMatch = /<span>([\d\s]+)<\/span>[^<]*<span[^>]*>[^<]*<\/span>\s*\/\s*пог/i.exec(html)
    || /([\d\s]+)\s*(?:₽|руб)?\s*\/\s*пог/i.exec(html);

  if (pogonMatch) {
    const pricePogM = parseInt(pogonMatch[1].replace(/[^\d]/g, ''), 10);
    if (!isNaN(pricePogM) && pricePogM > 0) {
      const len = (dims && dims.length && dims.length >= 1000) ? dims.length : 3000;
      return Math.round(pricePogM * (len / 1000));
    }
  }

  const metaMatch = /<meta[^>]+itemprop=["']price["'][^>]+content=["'](\d+[\.\d]*)["']/i.exec(html);
  if (metaMatch) {
    const val = parseFloat(metaMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val);
  }

  const strongMatch = /class=["'][^"']*price-current[^"']*["'][^>]*>[\s\S]*?<strong>([\d\s]+)<\/strong>/i.exec(html);
  if (strongMatch) {
    const val = parseInt(strongMatch[1].replace(/[^\d]/g, ''), 10);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}