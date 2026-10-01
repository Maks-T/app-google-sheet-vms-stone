/**
 * Exporter.js — Экспорт полного пакета каталога в import_data.json для платформы VMS-NC
 * Контракт полностью синхронизирован со схемой отраслевого пакета WPC и калькулятором oliver-deck.
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
      GDK_CONFIG.FAMILIES.HARDWARE_ACCESSORY
    ],
    types: getStandardProductTypesDefinition(),
    attributes: attributesSection,
    complex_dictionaries: getComplexDictionariesDefinition(),
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
    { sheetName: '6. Кляймеры и крепеж', type: 'brackets' },
    { sheetName: '7. Регулируемые опоры', type: 'adjustable_pedestal' },
    { sheetName: '8. Каркас и балки', altName: '8. Балки и сваи', type: 'foundation_beam' }
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
      const sourceUrl = cleanProductUrl(rawSourceUrl);

      if (!productCode || !sku) continue;

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

      // Модификация (ProductVariant / SKU)
      const variantEav = {};
      const effectiveColorSlug = colorSlug || (['terraceBoard', 'stepBoard', 'decorProducts'].includes(typeKey) ? 'natural' : null);
      if (effectiveColorSlug && usedColors.has(effectiveColorSlug)) {
        variantEav.color = usedColors.get(effectiveColorSlug).option_code;
      }

      const variantPayload = {
        external_code: sku,
        sku: sku,
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

  // Внедрение системных складских позиций (сваи, оголовки, ЦПС, арматура, крепеж)
  ensureDefaultSystemItems(productsMap);

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
    const fixing = String(data[i][8] || '').trim() || '00124';
    const noseSize = data[i][9] || 20;
    const holes = data[i][10] || 1;

    // 1. Монтажная лага (joist -> fixing в пайплайне pl_joist)
    if (joist) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_joist', 'fixing', joist, fixing, 10, `Крепление лаги (саморез): ${joist}`));
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
        addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'fixing', childSku, fixing, 10, `Связь Крепление доски (саморез): ${childSku}`, true));
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

function addHolesParam(rules, seenRuleCodes, clipSku, holes) {
  const holesRuleCode = `rule_holes_${clipSku}`;
  if (!seenRuleCodes.has(holesRuleCode)) {
    seenRuleCodes.add(holesRuleCode);
    rules.push({
      "pipeline_external_code": "pl_terrace",
      "external_code": holesRuleCode,
      "name": `Параметр Количество отверстий: ${clipSku}`,
      "role": "holes",
      "parent_type_key": "product_variant",
      "parent_external_code": clipSku,
      "child_type_key": null,
      "child_external_code": null,
      "conditions": null,
      "static_meta": { "holes": String(holes) },
      "quantity_formula": "1",
      "is_required": true,
      "sort_order": 10
    });
  }
}

function addNoseSizeParam(rules, seenRuleCodes, stepSku, noseSize) {
  const noseRuleCode = `rule_nose_${stepSku}`;
  if (!seenRuleCodes.has(noseRuleCode)) {
    seenRuleCodes.add(noseRuleCode);
    rules.push({
      "pipeline_external_code": "pl_terrace",
      "external_code": noseRuleCode,
      "name": `Параметр Размер носика: ${stepSku}`,
      "role": "noseSize",
      "parent_type_key": "product_variant",
      "parent_external_code": stepSku,
      "child_type_key": null,
      "child_external_code": null,
      "conditions": null,
      "static_meta": { "noseSize": String(noseSize) },
      "quantity_formula": "1",
      "is_required": true,
      "sort_order": 10
    });
  }
}

function makeRule(pipeline, role, parentSku, childSku, sortOrder, customName, isRequired) {
  return {
    "pipeline_external_code": pipeline,
    "external_code": `rule_${role}_${parentSku}_${childSku}`.replace(/[^a-zA-Z0-9_]/g, '_'),
    "name": customName || ("Связь " + role),
    "role": role,
    "parent_type_key": "product_variant",
    "parent_external_code": parentSku,
    "child_type_key": "product_variant",
    "child_external_code": childSku,
    "conditions": null,
    "static_meta": null,
    "quantity_formula": "1",
    "is_required": isRequired !== undefined ? isRequired : true,
    "sort_order": sortOrder
  };
}

function addRuleIfUnique(rulesArray, seenSet, ruleObj) {
  if (!seenSet.has(ruleObj.external_code)) {
    seenSet.add(ruleObj.external_code);
    rulesArray.push(ruleObj);
  }
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
        { code: "height_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
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
        { code: "height_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
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
        { code: "height_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_brackets",
      family_external_code: "fam_hardware_accessories",
      code: "brackets",
      name: { ru: "Кляймеры и кронштейны", en: "Clips and Brackets" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_fasteners",
      family_external_code: "fam_hardware_accessories",
      code: "fasteners",
      name: { ru: "Крепеж и саморезы", en: "Fasteners and Screws" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "product_calc_category", is_variant_only: false }
      ]
    },
    {
      external_code: "type_decorProducts",
      family_external_code: "fam_hardware_accessories",
      code: "decorProducts",
      name: { ru: "Декоративные изделия (уголки)", en: "Decorative Corners" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
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
        { code: "source_url", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false }
      ]
    },
    {
      external_code: "type_adjustable_pedestal",
      family_external_code: "fam_decking_systems",
      code: "adjustable_pedestal",
      name: { ru: "Регулируемые винтовые опоры", en: "Adjustable Pedestals" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "height_min", is_variant_only: false },
        { code: "height_max", is_variant_only: false },
        { code: "max_load_kg", is_variant_only: false },
        { code: "source_url", is_variant_only: false },
        { code: "color", is_variant_only: true }
      ]
    },
    {
      external_code: "type_foundation_beam",
      family_external_code: "fam_decking_systems",
      code: "foundation_beam",
      name: { ru: "Балка обвязки металлокаркаса", en: "Foundation Beam" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "height_mm", is_variant_only: false },
        { code: "thickness_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false },
        { code: "source_url", is_variant_only: false }
      ]
    },
    {
      external_code: "type_rebar",
      family_external_code: "fam_decking_systems",
      code: "rebar",
      name: { ru: "Арматура монтажная", en: "Rebar" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false }
      ]
    },
    {
      external_code: "type_screw_pile",
      family_external_code: "fam_hardware_accessories",
      code: "screw_pile",
      name: { ru: "Винтовые сваи", en: "Screw Piles" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false }
      ]
    },
    {
      external_code: "type_pile_cap",
      family_external_code: "fam_hardware_accessories",
      code: "pile_cap",
      name: { ru: "Оголовки свай", en: "Pile Caps" },
      attached_attributes: [
        { code: "brand", is_variant_only: false },
        { code: "width_mm", is_variant_only: false },
        { code: "length_mm", is_variant_only: false }
      ]
    }
  ];
}

/**
 * Динамическое формирование секции attributes с опциями брендов и цветов
 */
function buildDynamicAttributesSection(usedBrands, usedColorsMap) {
  const brandOptions = [
    { external_code: "opt_brand_oliverdeck", slug: "oliverdeck", value: { ru: "OliverDeck", en: "OliverDeck" }, param: "oliverdeck" },
    { external_code: "opt_brand_level", slug: "level", value: { ru: "Level", en: "Level" }, param: "level" },
    { external_code: "opt_brand_kronex", slug: "kronex", value: { ru: "Kronex", en: "Kronex" }, param: "kronex" },
    { external_code: "opt_brand_terrapol", slug: "terrapol", value: { ru: "Terrapol", en: "Terrapol" }, param: "terrapol" },
    { external_code: "opt_brand_woodvex", slug: "woodvex", value: { ru: "Woodvex", en: "Woodvex" }, param: "woodvex" },
    { external_code: "opt_brand_cm_decking", slug: "cm-decking", value: { ru: "CM Decking", en: "CM Decking" }, param: "cm-decking" },
    { external_code: "opt_brand_outdoor", slug: "outdoor", value: { ru: "Outdoor", en: "Outdoor" }, param: "outdoor" },
    { external_code: "opt_brand_bruggan", slug: "bruggan", value: { ru: "Bruggan", en: "Bruggan" }, param: "bruggan" },
    { external_code: "opt_brand_unodeck", slug: "unodeck", value: { ru: "UnoDeck", en: "UnoDeck" }, param: "unodeck" },
    { external_code: "opt_brand_legro", slug: "legro", value: { ru: "Legro", en: "Legro" }, param: "legro" },
    { external_code: "opt_brand_easydecking", slug: "easydecking", value: { ru: "EasyDecking", en: "EasyDecking" }, param: "easydecking" },
    { external_code: "opt_brand_greendecks", slug: "greendecks", value: { ru: "Greendecks", en: "Greendecks" }, param: "greendecks" }
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
    { external_code: "opt_gdk_serebristyy", slug: "silver", value: { ru: "Серебристый", en: "Silver" }, param: "silver", meta: { hex: "#C0C0C0" } },
    { external_code: "opt_belyi", slug: "white", value: { ru: "Белый", en: "White" }, param: "white", meta: { hex: "#F0EBE0" } },
    { external_code: "opt_chocolate", slug: "chocolate", value: { ru: "Шоколад", en: "Шоколад" }, param: "chocolate", meta: { hex: "#3B2219" } },
    { external_code: "opt_sand", slug: "sand", value: { ru: "Песочный", en: "Песочный" }, param: "sand", meta: { hex: "#A07855" } },
    { external_code: "opt_bronze", slug: "bronze", value: { ru: "Бронза", en: "Бронза" }, param: "bronze", meta: { hex: "#8B5A2B" } },
    { external_code: "opt_beige", slug: "beige", value: { ru: "Бежевый", en: "Бежевый" }, param: "beige", meta: { hex: "#C4A77D" } },
    { external_code: "opt_anthracite", slug: "anthracite", value: { ru: "Антрацит", en: "Антрацит" }, param: "anthracite", meta: { hex: "#2D3748" } },
    { external_code: "opt_terracotta", slug: "terracotta", value: { ru: "Терракот", en: "Терракот" }, param: "terracotta", meta: { hex: "#8C3B2B" } },
    { external_code: "opt_teak", slug: "teak", value: { ru: "Тик", en: "Тик" }, param: "teak", meta: { hex: "#B57C48" } }
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

/**
 * Определение пайплайна pl_terrace
 */
function getTerracePipelineDefinition() {
  return {
    external_code: "pl_terrace",
    code: "pl_terrace",
    slug: "terrace",
    name: {
      ru: "Конфигуратор террасного настила (ДПК) — OliverDeck",
      en: "Terrace Decking Configurator — OliverDeck"
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
 * Определение пайплайна pl_joist
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
 * Гарантированное внедрение системных складских позиций для подсистемы основания и крепежа
 */
function ensureDefaultSystemItems(productsMap) {
  // 1. Саморезы для лаг 5*120
  if (!productsMap.has('prod_00124')) {
    productsMap.set('prod_00124', {
      external_code: "prod_00124",
      product_type_external_code: "type_fasteners",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "samorez-5-120",
      name: { ru: "Саморез 5*120 (крепление лаг)", en: "Screw 5*120" },
      code: "00124",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Металл" },
      variants: [{
        external_code: "00124",
        sku: "00124",
        name: { ru: "Саморез 5*120 (крепление лаг)", en: "Screw 5*120" },
        price_group_external_code: null,
        stock: 1000,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 35,
        currency: "RUB",
        price: 60,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 2. Винтовая свая СВС-89*2000 мм
  if (!productsMap.has('prod_pile_89_2000')) {
    productsMap.set('prod_pile_89_2000', {
      external_code: "prod_pile_89_2000",
      product_type_external_code: "type_screw_pile",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "svaya-vintovaya-svs-89-2000",
      name: { ru: "Свая винтовая СВС-89х2000 мм", en: "Screw Pile 89x2000 mm" },
      code: "pile_89_2000",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Сталь", width_mm: 89, length_mm: 2000 },
      variants: [{
        external_code: "CBO-89-2000",
        sku: "CBO-89-2000",
        name: { ru: "Свая винтовая СВС-89х2000 мм", en: "Screw Pile 89x2000 mm" },
        price_group_external_code: null,
        stock: 500,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 1750,
        currency: "RUB",
        price: 2450,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 3. Оголовок свайный 150*150 мм
  if (!productsMap.has('prod_pile_cap_150')) {
    productsMap.set('prod_pile_cap_150', {
      external_code: "prod_pile_cap_150",
      product_type_external_code: "type_pile_cap",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "ogolovok-svajnyj-150-150",
      name: { ru: "Оголовок свайный усиленный 150х150 мм", en: "Pile Cap 150x150 mm" },
      code: "pile_cap_150",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Сталь", width_mm: 150, length_mm: 150 },
      variants: [{
        external_code: "OG-150-150",
        sku: "OG-150-150",
        name: { ru: "Оголовок свайный усиленный 150х150 мм", en: "Pile Cap 150x150 mm" },
        price_group_external_code: null,
        stock: 500,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 320,
        currency: "RUB",
        price: 450,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 4. ЦПС М-300 мешок 25 кг
  if (!productsMap.has('prod_cps_m300')) {
    productsMap.set('prod_cps_m300', {
      external_code: "prod_cps_m300",
      product_type_external_code: "type_fasteners",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "peskobeton-cps-m300-25kg",
      name: { ru: "Пескобетон ЦПС М-300 (мешок 25 кг)", en: "Dry Mix M-300 (25 kg)" },
      code: "cps_m300_25kg",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "ЦПС" },
      variants: [{
        external_code: "CPS-M300-25",
        sku: "CPS-M300-25",
        name: { ru: "Пескобетон ЦПС М-300 (мешок 25 кг)", en: "Dry Mix M-300 (25 kg)" },
        price_group_external_code: null,
        stock: 1000,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 230,
        currency: "RUB",
        price: 320,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 5. Арматура рифленая d10 мм (чистый тип type_rebar)
  if (!productsMap.has('prod_rebar_d10')) {
    productsMap.set('prod_rebar_d10', {
      external_code: "prod_rebar_d10",
      product_type_external_code: "type_rebar",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "armatura-riflenaya-a500c-d10",
      name: { ru: "Арматура рифленая А500С d10 мм (пруток)", en: "Rebar A500C d10 mm" },
      code: "rebar_d10",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Сталь", width_mm: 10, thickness_mm: 10, length_mm: 6000 },
      variants: [{
        external_code: "REBAR-D10",
        sku: "REBAR-D10",
        name: { ru: "Арматура рифленая А500С d10 мм", en: "Rebar A500C d10 mm" },
        price_group_external_code: null,
        stock: 500,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 45,
        currency: "RUB",
        price: 65,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }
}