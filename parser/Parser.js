/**
 * parser/Parser.js — Главная оркестрация разбора HTML страницы товара OliverDeck
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

function extractOliverDeckTitle(html, url) {
  const nameMatch = /<div[^>]*class=["'][^"']*product_name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html)
    || /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);

  if (nameMatch) {
    return cleanHtmlText(nameMatch[1]);
  }

  const cleanSlug = url.replace(/\/+$/, '').split('/').pop();
  return cleanSlug.replace(/[-_]+/g, ' ');
}