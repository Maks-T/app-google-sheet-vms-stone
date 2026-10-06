/**
 * exporter/Exporter.js — Экспорт полного пакета каталога в import_data.json для платформы VMS-NC
 */

function exportFullCatalogJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const productsResult = collectAllProductsFromSheets(ss);
  if (productsResult.products.length === 0) {
    SpreadsheetApp.getUi().alert('Каталог пуст. Сначала выполните парсинг товаров на листах.');
    return;
  }

  const bindingRules = collectAllBindingRules(ss);
  const attributesSection = buildDynamicAttributesSection(productsResult.usedBrands, productsResult.usedColors);

  const importData = {
    languages: ["ru", "en"],
    currencies: [
      {
        code: "RUB",
        symbol: "₽",
        symbol_native: { ru: "руб.", en: "rub." },
        name: { ru: "Российский рубль", en: "Russian Ruble" },
        rate: 1,
        is_default: true,
        is_active: true
      }
    ],
    price_types: [
      {
        slug: "retail",
        currency_code: "RUB",
        is_default: true,
        name: { ru: "Цена продажи", en: "Retail" },
        description: {
          ru: "Розничная цена с сайта oliverdeck.ru",
          en: "Retail price from oliverdeck.ru"
        }
      }
    ],
    families: [
      GDK_CONFIG.FAMILIES.DECKING_SYSTEM,
      GDK_CONFIG.FAMILIES.FENCE_SYSTEM,
      GDK_CONFIG.FAMILIES.HARDWARE_ACCESSORY
    ],
    types: getStandardProductTypesDefinition(),
    attributes: attributesSection,
    complex_dictionaries: getComplexDictionariesDefinition(),
    products: productsResult.products,
    pipelines: [getTerracePipelineDefinition(), getJoistPipelineDefinition(), getFencePipelineDefinition()],
    binding_rules: bindingRules
  };

  const jsonString = JSON.stringify(importData, null, 2);

  const htmlOutput = HtmlService.createHtmlOutput(
    `<div style="font-family:sans-serif;padding:5px;">` +
    `<p style="margin:0 0 10px 0;font-size:13px;">` +
    `Сформирован полный файл <b>import_data.json</b>.<br>` +
    `Товаров (моделей): <b>${productsResult.products.length}</b> | ` +
    `Связей калькулятора: <b>${bindingRules.length}</b>` +
    `</p>` +
    `<textarea style="width:100%;height:380px;font-family:monospace;font-size:11px;padding:8px;" readonly onClick="this.select();">${jsonString}</textarea>` +
    `</div>`
  ).setWidth(780).setHeight(500);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Экспорт import_data.json (VMS-NC)');
}

function collectAllProductsFromSheets(ss) {
  const sheetsToScan = [
    { sheetName: '1. Доски', type: 'terraceBoard' },
    { sheetName: '2. Ступени', type: 'stepBoard' },
    { sheetName: '3. Уголки и декор', type: 'decorProducts' },
    { sheetName: '4. Универсальная доска (зашивка)', altName: '4. Доска обрамления', type: 'board' },
    { sheetName: '5. Лаги', type: 'joist' },
    { sheetName: '6. Кляймеры и крепеж', type: 'brackets' },
    { sheetName: '7. Регулируемые опоры', type: 'adjustable_pedestal' },
    { sheetName: '8. Каркас и балки', altName: '8. Балки и сваи', type: 'foundation_beam' },
    { sheetName: '10. Столбы', type: 'pillar' },
    { sheetName: '11. Перила', type: 'rail' },
    { sheetName: '12. Балясины', type: 'baluster' },
    { sheetName: '13. Заборный профиль и рейка', type: 'fenceProfile' },
    { sheetName: '14. Аксессуары ограждения', type: 'accessories' }
  ];

  const productsMap = new Map();
  const usedBrands = new Set();
  const usedColors = new Map();

  sheetsToScan.forEach(scanMeta => {
    let sheet = ss.getSheetByName(scanMeta.sheetName);
    if (!sheet && scanMeta.altName) {
      sheet = ss.getSheetByName(scanMeta.altName);
    }
    if (!sheet || sheet.getLastRow() < 2) return;

    const data = sheet.getDataRange().getValues();
    const typeKey = scanMeta.type;
    let defaultProductTypeExt = GDK_CONFIG.PRODUCT_TYPES[typeKey] || 'type_terraceBoard';
    const calcCategory = GDK_CONFIG.CALC_CATEGORIES[typeKey] || null;

    for (let r = 1; r < data.length; r++) {
      const productCode = String(data[r][1] || '').trim();
      const sku = String(data[r][2] || '').trim();
      const name = String(data[r][3] || '').trim();
      const brand = String(data[r][4] || '').trim() || 'opt_brand_oliverdeck';
      const material = String(data[r][5] || '').trim() || 'ДПК (Древесно-полимерный композит)';
      const colorName = String(data[r][6] || '').trim();
      const colorSlug = String(data[r][7] || '').trim().toLowerCase();
      const colorHex = String(data[r][8] || '').trim();
      const lengthMm = parseFloat(data[r][9]) || null;
      const widthMm = parseFloat(data[r][10]) || null;
      const thicknessMm = parseFloat(data[r][11]) || null;
      const priceRetail = parseFloat(data[r][12]) || 0;
      const costPrice = parseFloat(data[r][13]) || (priceRetail > 0 ? Math.round(priceRetail * 0.7) : null);
      const imageUrl = String(data[r][14] || '').trim() || null;
      const rawSourceUrl = String(data[r][15] || '').trim() || null;
      let sourceUrl = cleanProductUrl(rawSourceUrl);
      if (!sourceUrl || sourceUrl.length < 12 || (!sourceUrl.startsWith('http://') && !sourceUrl.startsWith('https://'))) {
        sourceUrl = (rawSourceUrl && rawSourceUrl.length > 10 && rawSourceUrl.startsWith('http')) ? rawSourceUrl : null;
      }

      if (!productCode || !sku) continue;

      let actualProductTypeExt = defaultProductTypeExt;
      if (typeKey === 'brackets') {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('саморез') || lowerName.includes('шуруп') || sku.toLowerCase().includes('screw')) {
          actualProductTypeExt = 'type_fasteners';
        }
      }
      if (typeKey === 'fenceProfile') {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('рейк') || sku.toLowerCase().includes('lath')) {
          actualProductTypeExt = 'type_lath';
        }
      }

      usedBrands.add(brand);
      if (colorSlug && !usedColors.has(colorSlug)) {
        usedColors.set(colorSlug, {
          name: colorName || colorSlug,
          hex: colorHex || '#808080',
          option_code: 'opt_' + colorSlug.replace(/[^a-z0-9_]/g, '_')
        });
      }

      if (!productsMap.has(productCode)) {
        const cleanBaseName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
        const baseSlug = productCode.replace(/_/g, '-').replace(/^odk-/, '').replace(/^gdk-/, '');

        const eav = {
          material: material,
          brand: brand
        };

        if (calcCategory) eav.product_calc_category = calcCategory;

        if (typeKey === 'adjustable_pedestal') {
          if (lengthMm) eav.height_min = lengthMm;
          if (widthMm) eav.height_max = widthMm;
          if (thicknessMm) eav.max_load_kg = thicknessMm;
        } else {
          if (lengthMm) eav.length_mm = lengthMm;
          if (widthMm) eav.width_mm = widthMm;
          if (thicknessMm) {
            eav.thickness_mm = thicknessMm;
            eav.height_mm = thicknessMm;
          }
        }
        if (typeKey === 'foundation_beam') {
          if (widthMm) eav.profile_width_mm = widthMm;
          if (thicknessMm) eav.profile_height_mm = thicknessMm;
          const wallMatch = /(?:x|х)\s*(\d{1,2})(?:\s*мм|$)/i.exec(cleanBaseName);
          eav.wall_thickness_mm = wallMatch ? parseFloat(wallMatch[1]) : (widthMm >= 80 ? 3 : 2);
        }
        if (typeKey === 'rebar' && widthMm) eav.diameter_mm = widthMm;
        if (sourceUrl) eav.source_url = sourceUrl;

        productsMap.set(productCode, {
          external_code: productCode,
          product_type_external_code: actualProductTypeExt,
          category_external_code: null,
          catalog_type: "product",
          unit_code: "pcs",
          slug: baseSlug,
          name: { ru: cleanBaseName, en: cleanBaseName },
          code: productCode,
          is_active: true,
          eav: eav,
          variants: [],
          preview_picture: imageUrl,
          source_url: sourceUrl
        });
      }

      const currentProduct = productsMap.get(productCode);
      const isDefault = currentProduct.variants.length === 0;
      if (!currentProduct.preview_picture && imageUrl) {
        currentProduct.preview_picture = imageUrl;
      }

      const variantEav = {};
      const effectiveColorSlug = colorSlug || (['terraceBoard', 'stepBoard', 'decorProducts'].includes(typeKey) ? 'natural' : null);
      if (effectiveColorSlug) {
        const cleanSlug = effectiveColorSlug.replace(/[^a-z0-9_]/g, '_');
        variantEav.color = 'opt_' + cleanSlug;

        if (!usedColors.has(cleanSlug)) {
          usedColors.set(cleanSlug, {
            name: colorName || cleanSlug,
            hex: colorHex || '#808080',
            option_code: 'opt_' + cleanSlug
          });
        }
      }

      let uniqueSku = sku;
      if (currentProduct.variants.some(v => v.sku === uniqueSku)) {
        const noMatch = /(?:№|no\.?|номер|_no)\s*(\d+)/i.exec(name);
        if (noMatch && !uniqueSku.includes('no' + noMatch[1])) {
          uniqueSku += '_no' + noMatch[1];
        } else {
          uniqueSku += '_' + (currentProduct.variants.length + 1);
        }
      }

      const variantPayload = {
        external_code: uniqueSku,
        sku: uniqueSku,
        name: { ru: name, en: name },
        price_group_external_code: null,
        stock: null,
        is_default: isDefault,
        is_manual_pricing: false,
        cost_price: costPrice,
        currency: "RUB",
        price: priceRetail,
        preview_picture: imageUrl,
        eav: variantEav,
        is_active: true
      };

      currentProduct.variants.push(variantPayload);
    }
  });

  ensureDefaultSystemItems(productsMap);

  return {
    products: Array.from(productsMap.values()),
    usedBrands: Array.from(usedBrands),
    usedColors: usedColors
  };
}

function buildDynamicAttributesSection(usedBrands, usedColorsMap) {
  const brandOptions = getDefaultBrandOptions();

  usedBrands.forEach(bCode => {
    if (!brandOptions.some(opt => opt.external_code === bCode)) {
      const cleanSlug = bCode.replace(/^opt_brand_/, '');
      brandOptions.push({
        external_code: bCode,
        slug: cleanSlug,
        value: { ru: cleanSlug.toUpperCase(), en: cleanSlug.toUpperCase() },
        param: cleanSlug
      });
    }
  });

  const colorOptions = getDefaultColorOptions();

  usedColorsMap.forEach((info, slug) => {
    if (!colorOptions.some(opt => opt.external_code === info.option_code)) {
      colorOptions.push({
        external_code: info.option_code,
        slug: slug,
        value: { ru: info.name, en: info.name },
        param: slug,
        meta: { hex: info.hex }
      });
    }
  });

  return [
    {
      external_code: "3c8dc722-9471-11f0-0a80-0155001d3915",
      code: "brand",
      type: "dictionary",
      name: { ru: "Бренд", en: "Brand" },
      is_multiple: false,
      options: brandOptions
    },
    {
      external_code: "69b39e1b-9460-11f0-0a80-1430001abae1",
      code: "width_mm",
      type: "numeric",
      name: { ru: "Ширина, мм", en: "Width, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "69b39bff-9460-11f0-0a80-1430001abae0",
      code: "length_mm",
      type: "numeric",
      name: { ru: "Длина, мм", en: "Length, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "69b3a01b-9460-11f0-0a80-1430001abae4",
      code: "thickness_mm",
      type: "numeric",
      name: { ru: "Толщина, мм", en: "Thickness, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_height_mm",
      code: "height_mm",
      type: "numeric",
      name: { ru: "Высота, мм", en: "Height, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_height_min",
      code: "height_min",
      type: "numeric",
      name: { ru: "Мин. высота регулировки, мм", en: "Min Height, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_height_max",
      code: "height_max",
      type: "numeric",
      name: { ru: "Макс. высота регулировки, мм", en: "Max Height, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_max_load_kg",
      code: "max_load_kg",
      type: "numeric",
      name: { ru: "Несущая способность, кг", en: "Max Load, kg" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_diameter_mm",
      code: "diameter_mm",
      type: "numeric",
      name: { ru: "Диаметр, мм", en: "Diameter, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_blade_diameter_mm",
      code: "blade_diameter_mm",
      type: "numeric",
      name: { ru: "Диаметр лопасти, мм", en: "Blade Diameter, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_wall_thickness_mm",
      code: "wall_thickness_mm",
      type: "numeric",
      name: { ru: "Толщина стенки, мм", en: "Wall Thickness, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_profile_width_mm",
      code: "profile_width_mm",
      type: "numeric",
      name: { ru: "Ширина профиля, мм", en: "Profile Width, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_profile_height_mm",
      code: "profile_height_mm",
      type: "numeric",
      name: { ru: "Высота профиля, мм", en: "Profile Height, mm" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_has_head",
      code: "has_head",
      type: "boolean",
      name: { ru: "Наличие оголовка", en: "Has Head" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_material",
      code: "material",
      type: "string",
      name: { ru: "Материал", en: "Material" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "0ae4e30b-a75c-11f0-0a80-15e400210259",
      code: "product_calc_category",
      type: "dictionary",
      name: { ru: "Категория товара (Калькулятор)", en: "Product Category (Calculator)" },
      is_multiple: false,
      options: []
    },
    {
      external_code: "attr_color",
      code: "color",
      type: "dictionary",
      name: { ru: "Цвет", en: "Color" },
      is_multiple: false,
      options: colorOptions
    },
    {
      external_code: "attr_source_url",
      code: "source_url",
      type: "string",
      name: { ru: "Ссылка на товар", en: "Product URL" },
      is_multiple: false,
      options: []
    }
  ];
}

function exportBindingRulesJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getPipelineSheet(ss);
  if (!sheet) return;

  const rules = collectAllBindingRules(ss);

  const jsonOutput = JSON.stringify(rules, null, 2);
  const htmlOutput = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif;margin-bottom:8px;">Сформировано правил связей: <b>' + rules.length + '</b>. Скопируйте этот массив в раздел <code>"binding_rules": [...]</code> вашего файла <b>import/import_data.json</b>:</p>' +
    '<textarea style="width:100%;height:370px;font-family:monospace;font-size:11px;" readonly onClick="this.select();">' + jsonOutput + '</textarea>'
  ).setWidth(720).setHeight(490);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Экспорт массива binding_rules');
}