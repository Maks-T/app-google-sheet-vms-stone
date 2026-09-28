/**
 * Exporter.js — Экспорт полного пакета каталога в import_data.json для платформы VMS-NC
 * Контракт полностью синхронизирован со схемой отраслевого пакета WPC и калькулятором.
 */

/**
 * Главная функция экспорта полного файла import_data.json
 */
function exportFullCatalogJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Сборка продуктов со всех самодостаточных листов
  const productsResult = collectAllProductsFromSheets(ss);
  if (productsResult.products.length === 0) {
    SpreadsheetApp.getUi().alert('Каталог пуст. Сначала выполните парсинг товаров на листах.');
    return;
  }

  // 2. Сборка связей калькулятора (binding_rules)
  const bindingRules = collectAllBindingRules(ss);

  // 3. Формирование динамических опций атрибутов (бренды и цвета)
  const attributesSection = buildDynamicAttributesSection(productsResult.usedBrands, productsResult.usedColors);

  // 4. Формирование итогового объекта import_data.json
  const importData = {
    languages: ["ru", "en"],
    currencies: [
      {
        code: "KZT",
        symbol: "₸",
        symbol_native: { ru: "тенге", en: "₸" },
        name: { ru: "Казахстанский тенге", en: "Kazakhstani Tenge" },
        rate: 1,
        is_default: true,
        is_active: true
      }
    ],
    price_types: [
      {
        slug: "retail",
        currency_code: "KZT",
        is_default: true,
        name: { ru: "Цена продажи", en: "Retail" },
        description: {
          ru: "Розничная цена с сайта greendecks.kz",
          en: "Retail price from greendecks.kz"
        }
      }
    ],
    families: [
      {
        external_code: "fam_decking_systems",
        code: "decking_system",
        name: { ru: "Террасный настил", en: "Terrace Decking Systems" }
      }
    ],
    types: getStandardProductTypesDefinition(),
    attributes: attributesSection,
    products: productsResult.products,
    pipelines: [getTerracePipelineDefinition(), getJoistPipelineDefinition()],
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

/**
 * Сбор товаров со всех самодостаточных листов каталога
 */
function collectAllProductsFromSheets(ss) {
  const sheetsToScan = [
    { sheetName: '1. Доски', type: 'terraceBoard' },
    { sheetName: '2. Ступени', type: 'stepBoard' },
    { sheetName: '3. Уголки и декор', type: 'decorProducts' },
    { sheetName: '4. Универсальная доска (зашивка)', altName: '4. Доска обрамления', type: 'board' },
    { sheetName: '5. Лаги', type: 'joist' },
    { sheetName: '6. Кляймеры и крепеж', type: 'brackets' }
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
      const brand = String(data[r][4] || '').trim() || 'opt_brand_greendecks';
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
      const sourceUrl = cleanProductUrl(rawSourceUrl);

      if (!productCode || !sku) continue;

      // Определение типа: саморезы на Листе 6 относим к type_fasteners
      let actualProductTypeExt = defaultProductTypeExt;
      if (typeKey === 'brackets') {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('саморез') || lowerName.includes('шуруп') || sku.toLowerCase().includes('screw')) {
          actualProductTypeExt = 'type_fasteners';
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

      // Базовый продукт (Product)
      if (!productsMap.has(productCode)) {
        const cleanBaseName = name.replace(/\s*\([^)]*\)\s*/g, '').trim();
        const baseSlug = productCode.replace(/_/g, '-').replace(/^gdk-/, '');

        const eav = {
          material: material,
          brand: brand
        };

        if (calcCategory) eav.product_calc_category = calcCategory;
        if (lengthMm) eav.length_mm = lengthMm;
        if (widthMm) eav.width_mm = widthMm;
        if (thicknessMm) eav.thickness_mm = thicknessMm;

        if (colorSlug && usedColors.has(colorSlug)) {
          eav.color = usedColors.get(colorSlug).option_code;
        }

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

      // Модификация (ProductVariant / SKU)
      const variantPayload = {
        external_code: sku,
        sku: sku,
        name: { ru: name, en: name },
        price_group_external_code: null,
        stock: null,
        is_default: isDefault,
        is_manual_pricing: false,
        cost_price: costPrice,
        currency: "KZT",
        price: priceRetail,
        eav: [],
        is_active: true
      };

      currentProduct.variants.push(variantPayload);
    }
  });

  // Внедрение системного крепежа по умолчанию (саморезы для лаг и зашивки)
  ensureDefaultFasteners(productsMap);

  return {
    products: Array.from(productsMap.values()),
    usedBrands: Array.from(usedBrands),
    usedColors: usedColors
  };
}

/**
 * Сборка правил связей (binding_rules) с листа связей
 */
function collectAllBindingRules(ss) {
  const sheet = getPipelineSheet(ss);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const data = sheet.getDataRange().getValues();
  const rules = [];
  const seenRuleCodes = new Set();

  for (let i = 1; i < data.length; i++) {
    const parentSku = String(data[i][0]).trim();
    if (!parentSku) continue;

    const parentName = String(data[i][1] || parentSku).substring(0, 45);
    const joist = String(data[i][2] || '').trim();
    const startClip = String(data[i][3] || '').trim();
    const baseClip = String(data[i][4] || '').trim();
    const corner = String(data[i][5] || '').trim();
    const universalBoardsRaw = String(data[i][6] || '').trim();
    const stepBoardsRaw = String(data[i][7] || '').trim();
    const fixing = String(data[i][8] || '').trim();
    const noseSize = data[i][9] || 20;
    const holes = data[i][10] || 1;

    // 1. Монтажная лага (joist -> fixing в пайплайне pl_joist)
    if (joist) {
      const screwSku = fixing || 'sku_00124';
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_joist', 'fixing', joist, screwSku, 10, `Крепление лаги (саморез): ${joist}`));
    }

    // 2. Стартовый кляймер (startClip) + параметр holes
    if (startClip) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'startClip', parentSku, startClip, 10, `Связь startClip: ${parentName}`));
      addHolesParam(rules, seenRuleCodes, startClip, holes);
    }

    // 3. Рядовой кляймер (baseClip) + параметр holes
    if (baseClip) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'baseClip', parentSku, baseClip, 20, `Связь baseClip: ${parentName}`));
      addHolesParam(rules, seenRuleCodes, baseClip, holes);
    }

    // 4. Декоративный уголок (corner) — окантовка периметра
    if (corner) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'corner', parentSku, corner, 30, `Связь corner: ${parentName}`, false));
    }

    // 5. Универсальные доски (universalBoards) — вертикальная зашивка цоколя
    if (universalBoardsRaw) {
      const items = universalBoardsRaw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      items.forEach(childSku => {
        addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'universalBoards', parentSku, childSku, 40, `Связь universalBoards: ${parentName}`, false));
        if (fixing) {
          addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'fixing', childSku, fixing, 10, `Связь Крепление доски (саморез): ${childSku}`, true));
        }
      });
    }

    // 6. Ступени (stepBoards) — окантовка периметра с носиком + параметр noseSize
    if (stepBoardsRaw) {
      const items = stepBoardsRaw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      items.forEach(childSku => {
        addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'stepBoards', parentSku, childSku, 35, `Связь stepBoards: ${parentName}`, false));
        addNoseSizeParam(rules, seenRuleCodes, childSku, noseSize);
      });
    }
  }

  return rules;
}

/**
 * Определение стандартных типов товаров VMS-NC
 */
function getStandardProductTypesDefinition() {
  return [
    {
      external_code: "type_terraceBoard",
      family_external_code: "fam_decking_systems",
      code: "terraceBoard",
      name: { ru: "Террасная доска", en: "Terrace Board" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_board",
      family_external_code: "fam_decking_systems",
      code: "board",
      name: { ru: "Доска универсальная (зашивка)", en: "Universal Board" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_stepBoard",
      family_external_code: "fam_decking_systems",
      code: "stepBoard",
      name: { ru: "Ступень", en: "Step Board" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_brackets",
      family_external_code: "fam_decking_systems",
      code: "brackets",
      name: { ru: "Кляймеры и кронштейны", en: "Clips and Brackets" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_fasteners",
      family_external_code: "fam_decking_systems",
      code: "fasteners",
      name: { ru: "Крепеж и саморезы", en: "Fasteners and Screws" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_decorProducts",
      family_external_code: "fam_decking_systems",
      code: "decorProducts",
      name: { ru: "Декоративные изделия (уголки)", en: "Decorative Corners" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_joist",
      family_external_code: "fam_decking_systems",
      code: "joist",
      name: { ru: "Лага монтажная (подконструкция)", en: "Substructure Joist" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false }
      ]
    }
  ];
}

/**
 * Динамическое формирование секции attributes с опциями брендов и цветов
 */
function buildDynamicAttributesSection(usedBrands, usedColorsMap) {
  const brandOptions = [
    { external_code: "opt_brand_legro", slug: "legro", value: { ru: "Legro", en: "Legro" }, param: "legro" },
    { external_code: "opt_brand_easydecking", slug: "easydecking", value: { ru: "EasyDecking", en: "EasyDecking" }, param: "easydecking" },
    { external_code: "opt_brand_greendecks", slug: "greendecks", value: { ru: "Greendecks", en: "Greendecks" }, param: "greendecks" },
    { external_code: "opt_brand_timber-essential", slug: "timber-essential", value: { ru: "Timber Essential", en: "Timber Essential" }, param: "timber-essential" },
    { external_code: "opt_brand_welltouch", slug: "welltouch", value: { ru: "Welltouch", en: "Welltouch" }, param: "welltouch" },
    { external_code: "opt_brand_pudeck", slug: "pudeck", value: { ru: "PUDECK", en: "PUDECK" }, param: "pudeck" },
    { external_code: "opt_brand_greenwood", slug: "greenwood", value: { ru: "GreenWOOD", en: "GreenWOOD" }, param: "greenwood" },
    { external_code: "opt_brand_aludeck", slug: "aludeck", value: { ru: "AluDeck", en: "AluDeck" }, param: "aludeck" },
    { external_code: "opt_brand_prestige", slug: "prestige", value: { ru: "Prestige", en: "Prestige" }, param: "prestige" },
    { external_code: "opt_brand_titan", slug: "titan", value: { ru: "Titan", en: "Titan" }, param: "titan" },
    { external_code: "opt_brand_polyrootd", slug: "polyrootd", value: { ru: "PolyrootD", en: "PolyrootD" }, param: "polyrootd" },
    { external_code: "opt_brand_master", slug: "master", value: { ru: "Master", en: "Master" }, param: "master" },
    { external_code: "opt_brand_robust", slug: "robust", value: { ru: "Robust", en: "Robust" }, param: "robust" },
    { external_code: "opt_brand_nauticprime", slug: "nauticprime", value: { ru: "NauticPrime", en: "NauticPrime" }, param: "nauticprime" },
    { external_code: "opt_brand_select", slug: "select", value: { ru: "Select", en: "Select" }, param: "select" },
    { external_code: "opt_brand_crown", slug: "crown", value: { ru: "Crown", en: "Crown" }, param: "crown" },
    { external_code: "opt_brand_hilst", slug: "hilst", value: { ru: "HILST", en: "HILST" }, param: "hilst" },
    { external_code: "opt_brand_holzhof", slug: "holzhof", value: { ru: "Holzhof", en: "Holzhof" }, param: "holzhof" },
    { external_code: "opt_brand_3d-wood", slug: "3d-wood", value: { ru: "3D WOOD", en: "3D WOOD" }, param: "3d-wood" },
    { external_code: "opt_brand_brushing-mix", slug: "brushing-mix", value: { ru: "Brushing Mix", en: "Brushing Mix" }, param: "brushing-mix" }
  ];

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

  const colorOptions = [
    { external_code: "opt_venge", slug: "wenge", value: { ru: "Венге", en: "Wenge" }, param: "wenge", meta: { hex: "#3B2219" } },
    { external_code: "opt_dub", slug: "oak", value: { ru: "Дуб", en: "Oak" }, param: "oak", meta: { hex: "#C4A77D" } },
    { external_code: "opt_seryi", slug: "grey", value: { ru: "Серый", en: "Grey" }, param: "grey", meta: { hex: "#808080" } },
    { external_code: "opt_grafit", slug: "graphite", value: { ru: "Графит", en: "Graphite" }, param: "graphite", meta: { hex: "#4A5568" } },
    { external_code: "opt_antracit", slug: "black_wood", value: { ru: "Черное дерево", en: "Black Wood" }, param: "black_wood", meta: { hex: "#1A1A1A" } },
    { external_code: "opt_koricnevyi", slug: "brown", value: { ru: "Коричневый", en: "Brown" }, param: "brown", meta: { hex: "#654321" } },
    { external_code: "opt_temno-koricnevyi", slug: "dark_brown", value: { ru: "Темно-коричневый", en: "Dark Brown" }, param: "dark_brown", meta: { hex: "#3B2219" } },
    { external_code: "opt_gdk_natural", slug: "natural", value: { ru: "Натураль", en: "Natural" }, param: "natural", meta: { hex: "#C4A77D" } },
    { external_code: "opt_gdk_korichnevyy_temno", slug: "korichnevyy_temno", value: { ru: "Коричневый/Тёмно-коричневый", en: "Brown / Dark Brown" }, param: "korichnevyy_temno", meta: { hex: "#654321" } },
    { external_code: "opt_gdk_serebristyy", slug: "silver", value: { ru: "Серебристый", en: "Silver" }, param: "silver", meta: { hex: "#C0C0C0" } },
    { external_code: "opt_gdk_dvukhtsvetnaya", slug: "bicolor", value: { ru: "Двухцветная", en: "Bi-color" }, param: "bicolor", meta: { hex: "#654321" } },
    { external_code: "opt_belyi", slug: "white", value: { ru: "Белый", en: "White" }, param: "white", meta: { hex: "#F0EBE0" } }
  ];

  usedColorsMap.forEach((info, slug) => {
    if (!colorOptions.some(opt => opt.slug === slug || opt.external_code === info.option_code)) {
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
    }
  ];
}

/**
 * Определение пайплайна pl_terrace в строгом соответствии с отраслевой схемой калькулятора
 */
function getTerracePipelineDefinition() {
  return {
    external_code: "pl_terrace",
    code: "pl_terrace",
    slug: "terrace",
    name: {
      ru: "Конфигуратор террасного настила (ДПК) — Greendecks",
      en: "Terrace Decking Configurator — Greendecks"
    },
    is_active: true,
    sort_order: 10,
    ui_state: [],
    schema: {
      terraceBoard: {
        startClip: {
          label_key: { ru: "Стартовый кляймер", en: "Start Clip" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        baseClip: {
          label_key: { ru: "Рядовой кляймер", en: "Base Clip" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        corner: {
          label_key: { ru: "Уголок декоративный (периметр)", en: "Decorative Corner" },
          target_type: "product_type",
          target_code: "decorProducts",
          is_required: false,
          is_multiple: false
        },
        universalBoards: {
          label_key: { ru: "Универсальная доска (зашивка)", en: "Universal Board" },
          target_type: "product_type",
          target_code: "board",
          is_required: false,
          is_multiple: false
        },
        stepBoards: {
          label_key: { ru: "Ступени (периметр)", en: "Step Boards" },
          target_type: "product_type",
          target_code: "stepBoard",
          is_required: false,
          is_multiple: true
        }
      },
      board: {
        fixing: {
          label_key: { ru: "Крепление доски (саморез)", en: "Board Fastener" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      },
      stepBoard: {
        noseSize: {
          label_key: { ru: "Размер носика", en: "Nose Size" },
          target_type: "scalar",
          target_code: null,
          is_required: true,
          is_multiple: false
        }
      },
      brackets: {
        holes: {
          label_key: { ru: "Количество отверстий", en: "Holes" },
          target_type: "scalar",
          target_code: null,
          is_required: true,
          is_multiple: false
        }
      }
    }
  };
}

/**
 * Определение пайплайна pl_joist (подсистема и лаги)
 */
function getJoistPipelineDefinition() {
  return {
    external_code: "pl_joist",
    code: "pl_joist",
    slug: "joist",
    name: {
      ru: "Конфигуратор подсистемы и лаг (ДПК / Алюминий)",
      en: "Substructure and Joist Configurator"
    },
    is_active: true,
    sort_order: 30,
    ui_state: [],
    schema: {
      joist: {
        fixing: {
          label_key: { ru: "Крепление лаги (саморез)", en: "Joist Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      }
    }
  };
}

/**
 * Гарантированное внедрение системных саморезов по умолчанию для работы калькулятора
 */
function ensureDefaultFasteners(productsMap) {
  if (!productsMap.has('prod_00124')) {
    productsMap.set('prod_00124', {
      external_code: "prod_00124",
      product_type_external_code: "type_fasteners",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "samorez-5-120",
      name: { ru: "Саморез 5*120", en: "Screw 5*120" },
      code: "00124",
      is_active: true,
      eav: { brand: "opt_brand_greendecks", material: "Металл" },
      variants: [{
        external_code: "sku_00124",
        sku: "00124",
        name: { ru: "Саморез 5*120", en: "Screw 5*120" },
        price_group_external_code: null,
        stock: 1000,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 30,
        currency: "KZT",
        price: 60,
        eav: [],
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }
}