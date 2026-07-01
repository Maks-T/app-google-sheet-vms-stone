function exportCatalogJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  syncNewDataFromWorkingSheets();

  const typesSheet = ss.getSheetByName('cfg_types');
  const attrSheet = ss.getSheetByName('cfg_attributes');
  const optSheet = ss.getSheetByName('cfg_options');
  const catSheet = ss.getSheetByName('cfg_categories');
  const complexSheet = ss.getSheetByName('cfg_complex_dicts');
  const familiesSheet = ss.getSheetByName('cfg_families');
  const pgSheet = ss.getSheetByName('cfg_price_groups');

  const mappings = {};

  const catReader = getRowReader(catSheet);
  if (catReader) {
    catReader.rows.forEach(row => {
      const extCode = catReader.getVal(row, 'external_code');
      const nameRu = catReader.getVal(row, 'name_ru');
      if (extCode && nameRu) mappings['category:' + nameRu] = extCode;
    });
  }

  const optReader = getRowReader(optSheet);
  if (optReader) {
    optReader.rows.forEach(row => {
      const attrCode = optReader.getVal(row, 'attribute_code');
      const valRu = optReader.getVal(row, 'value_ru');
      const extCode = optReader.getVal(row, 'external_code');
      if (attrCode && valRu && extCode) {
        mappings[attrCode + ':' + valRu] = extCode;
      }
    });
  }

  const compReader = getRowReader(complexSheet);
  if (compReader) {
    compReader.rows.forEach(row => {
      const dictCode = compReader.getVal(row, 'dict_code');
      const nameRu = compReader.getVal(row, 'name_ru');
      const extCode = compReader.getVal(row, 'external_code');
      if (dictCode && nameRu && extCode) {
        mappings[dictCode + ':' + nameRu] = extCode;
      }
    });
  }

  const pgReader = getRowReader(pgSheet);
  if (pgReader) {
    pgReader.rows.forEach(row => {
      const extCode = pgReader.getVal(row, 'external_code');
      const slug = pgReader.getVal(row, 'slug');
      const nameRu = pgReader.getVal(row, 'name_ru');
      if (extCode) {
        // Оптимизировано: Приводим ключи карты к нижнему регистру для регистронезависимого поиска [1]
        if (slug) mappings['price_group:' + String(slug).toLowerCase().trim()] = extCode;
        if (nameRu) mappings['price_group:' + String(nameRu).toLowerCase().trim()] = extCode;
      }
    });
  }

  const attrConfig = {};
  const attrReader2 = getRowReader(attrSheet);
  if (attrReader2) {
    attrReader2.rows.forEach(row => {
      const code = attrReader2.getVal(row, 'code');
      if (code) {
        attrConfig[code] = {
          isVariantOnly: String(attrReader2.getVal(row, 'is_variant_only')).toUpperCase() === 'TRUE',
          type: String(attrReader2.getVal(row, 'type')).toLowerCase()
        };
      }
    });
  }

  const formatEavValue = (attrCode, rawVal) => {
    if (rawVal === null || rawVal === '') return undefined;
    const config = attrConfig[attrCode];
    if (!config) return rawVal;

    const lowerType = config.type.toLowerCase();

    if (lowerType === 'boolean') {
      return String(rawVal).toUpperCase() === 'TRUE' || rawVal === true;
    }
    if (lowerType === 'numeric') {
      const num = parseFloat(rawVal);
      return isNaN(num) ? rawVal : num;
    }
    if (lowerType === 'string') {
      return String(rawVal);
    }

    return mappings[attrCode + ':' + rawVal] ?? rawVal;
  };

  const outputProducts = [];
  const typeRows = typesSheet ? typesSheet.getDataRange().getValues() : [];
  const typeHeaders = typeRows[0];

  for (let tIdx = 1; tIdx < typeRows.length; tIdx++) {
    const typeCode = typeRows[tIdx][0];
    const typeName = typeRows[tIdx][2];
    if (!typeCode || !typeName) continue;

    const sheet = ss.getSheetByName(typeName);
    if (!sheet) continue;

    const rows = sheet.getDataRange().getValues();
    if (rows.length < 3) continue;

    const sysHeaders = rows[0].map(s => String(s).trim());
    const productsMap = {};
    let lastProductExtCode = null;

    const attachedAttrsArray = [];
    for (let col = 4; col < typeHeaders.length; col++) {
      const attrCode = typeHeaders[col];
      const isChecked = typeRows[tIdx][col] === true || String(typeRows[tIdx][col]).toUpperCase() === 'TRUE';
      if (isChecked && attrCode) {
        attachedAttrsArray.push(attrCode);
      }
    }

    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      const getVal = (code) => {
        const colIndex = sysHeaders.indexOf(code);
        return colIndex !== -1 ? row[colIndex] : null;
      };

      const rawExtCode = getVal('base_ext_code');
      const rawName = getVal('base_name');
      let sku = getVal('sku_code');
      const skuCost = getVal('sku_cost');

      const hasAnyData = row.some(cell => cell !== null && cell !== "");
      if (!hasAnyData) continue;

      let currentProductExtCode = lastProductExtCode;

      if (rawExtCode || rawName) {
        let prodSlug = getVal('base_slug') || generateSlug(rawName);
        currentProductExtCode = rawExtCode ? String(rawExtCode).trim() : ('prod_' + prodSlug);
        lastProductExtCode = currentProductExtCode;

        if (!productsMap[currentProductExtCode]) {
          const catName = getVal('base_category');
          productsMap[currentProductExtCode] = {
            "external_code": currentProductExtCode,
            "product_type_external_code": "type_" + typeCode,
            "category_external_code": mappings['category:' + catName] || null,
            "catalog_type": "product",
            "unit_code": "pcs",
            "slug": prodSlug,
            "name": { "ru": rawName, "en": transliterate(rawName) },
            "preview_picture": cleanUrl(getVal('base_image')),
            "detail_picture": null,
            "eav": {},
            "variants": []
          };

          for (let c = 0; c < sysHeaders.length; c++) {
            const attrCode = sysHeaders[c];
            if (!attrCode || BASE_FIELDS.includes(attrCode)) continue;
            if (attrConfig[attrCode] && attrConfig[attrCode].isVariantOnly) continue;
            if (attrCode === 'price_group') continue;

            const cellVal = row[c];
            const formatted = formatEavValue(attrCode, cellVal);
            if (formatted !== undefined) {
              productsMap[currentProductExtCode].eav[attrCode] = formatted;
            }
          }
        }
      }

      if (currentProductExtCode && productsMap[currentProductExtCode]) {
        const prodSlug = productsMap[currentProductExtCode].slug;
        const variantEav = {};
        let hasVariantAttr = false;
        let priceGroupExtCode = null;

        // ИСПРАВЛЕНО: Считываем ценовую группу как системное базовое поле напрямую [1]
        const rawPriceGroup = getVal('price_group');
        if (rawPriceGroup) {
          const cleanKey = String(rawPriceGroup).toLowerCase().trim();
          priceGroupExtCode = mappings['price_group:' + cleanKey] || ('pg_' + generateSlug(rawPriceGroup));
        }

        for (let c = 0; c < sysHeaders.length; c++) {
          const attrCode = sysHeaders[c];
          if (!attrCode || BASE_FIELDS.includes(attrCode)) continue;
          if (!attrConfig[attrCode] || !attrConfig[attrCode].isVariantOnly) continue;

          const cellVal = row[c];
          const formatted = formatEavValue(attrCode, cellVal);
          if (formatted !== undefined) {
            variantEav[attrCode] = formatted;
            hasVariantAttr = true;
          }
        }

        const isDefaultStr = String(getVal('sku_default')).toUpperCase();
        const hasSkuData = sku || skuCost || isDefaultStr === 'TRUE' || isDefaultStr === 'FALSE' || hasVariantAttr || priceGroupExtCode;

        if (hasSkuData) {
          if (!sku) {
            let variantParts = [];
            for (let key in variantEav) {
              const val = variantEav[key];
              variantParts.push(generateSlug(val));
            }
            if (variantParts.length > 0) {
              sku = prodSlug + '-' + variantParts.join('-');
            } else {
              sku = prodSlug + '-var-' + r;
            }
          }

          const costPrice = parseFloat(skuCost) || 0;
          const isManualPricing = String(getVal('sku_manual')).toUpperCase() === 'TRUE';
          const stock = parseFloat(getVal('sku_stock')) || 10.0;

          const variantObj = {
            "external_code": "sku_" + sku,
            "sku": sku,
            "price_group_external_code": priceGroupExtCode,
            "stock": stock,
            "is_default": isDefaultStr === 'TRUE',
            "preview_picture": cleanUrl(getVal('sku_image')),
            "detail_picture": null,
            "eav": variantEav,
            "is_manual_pricing": isManualPricing,
            "cost_price": costPrice,
            "currency": getVal('sku_currency') || 'RUB'
          };

          if (isManualPricing) {
            variantObj.price = costPrice * 1.3;
          }

          productsMap[currentProductExtCode].variants.push(variantObj);
        }
      }
    }

    Object.keys(productsMap).forEach(key => outputProducts.push(productsMap[key]));
  }

  const jsonExport = {
    "languages": [],
    "families": [],
    "types": [],
    "categories": [],
    "price_groups": [],
    "complex_dictionaries": [],
    "attributes": [],
    "products": outputProducts
  };

  if (pgReader) {
    pgReader.rows.forEach(row => {
      const extCode = pgReader.getVal(row, 'external_code');
      if (!extCode) return;

      jsonExport.price_groups.push({
        "external_code": extCode,
        "product_family_external_code": pgReader.getVal(row, 'family_code') ? ("fam_" + pgReader.getVal(row, 'family_code')) : null,
        "slug": String(pgReader.getVal(row, 'slug')),
        "name": {
          "ru": pgReader.getVal(row, 'name_ru'),
          "en": pgReader.getVal(row, 'name_en') || undefined
        },
        "meta": {
          "purchase_cost": parseFloat(pgReader.getVal(row, 'purchase_cost')) || 0,
          "purchase_currency": pgReader.getVal(row, 'purchase_currency') || 'USD',
          "markup_retail": parseFloat(pgReader.getVal(row, 'markup_retail')) || 0
        }
      });
    });
  }

  const familiesReader = getRowReader(familiesSheet);
  if (familiesReader) {
    familiesReader.rows.forEach(row => {
      const code = familiesReader.getVal(row, 'code');
      if (!code) return;

      jsonExport.families.push({
        "external_code": familiesReader.getVal(row, 'external_code') || ("fam_" + code),
        "code": code,
        "name": {
          "ru": familiesReader.getVal(row, 'name_ru'),
          "en": familiesReader.getVal(row, 'name_en')
        },
        "meta_schema": familiesReader.getVal(row, 'meta_schema') ? JSON.parse(familiesReader.getVal(row, 'meta_schema')) : undefined
      });
    });
  }

  if (typesSheet) {
    const tRows = typesSheet.getDataRange().getValues();
    for (let i = 1; i < tRows.length; i++) {
      if (!tRows[i][0]) continue;

      const attached = [];
      for (let col = 4; col < typeHeaders.length; col++) {
        const attrCode = typeHeaders[col];
        const isChecked = tRows[i][col] === true || String(tRows[i][col]).toUpperCase() === 'TRUE';
        if (isChecked && attrCode) {
          attached.push({
            "code": attrCode,
            "is_variant_only": attrConfig[attrCode] ? attrConfig[attrCode].isVariantOnly : false
          });
        }
      }

      let meta = {};
      let pricingMode = "manual";
      let pricingAttrCode = null;
      let pricingField = null;

      if (tRows[i][0] === 'acrylic_stone') {
        meta = { "step": 0.5, "maxStack": 1, "axisX": true, "minPart": 12, "is_separate": false, "corner_add_length": 920, "corner_add_width": 760 };
        pricingMode = "complex_dictionary";
        pricingField = "purchase_cost";
      } else if (tRows[i][0] === 'quartz_stone') {
        meta = { "step": 1, "maxStack": 1, "axisX": false, "minPart": 20, "is_separate": true, "corner_add_length": 750, "corner_add_width": 700 };
        pricingMode = "complex_dictionary";
        pricingField = "purchase_cost";
      }

      jsonExport.types.push({
        "external_code": "type_" + tRows[i][0],
        "family_external_code": "fam_" + tRows[i][1],
        "code": tRows[i][0],
        "name": { "ru": tRows[i][2], "en": tRows[i][3] },
        "meta": meta,
        "attached_attributes": attached,
        "pricing_mode": pricingMode,
        "pricing_attr_code": pricingAttrCode,
        "pricing_field": pricingField
      });
    }
  }

  if (catReader) {
    catReader.rows.forEach(row => {
      const extCode = catReader.getVal(row, 'external_code');
      if (!extCode) return;

      jsonExport.categories.push({
        "external_code": extCode,
        "parent_external_code": catReader.getVal(row, 'parent_external_code') || null,
        "slug": catReader.getVal(row, 'slug'),
        "name": {
          "ru": catReader.getVal(row, 'name_ru'),
          "en": catReader.getVal(row, 'name_en')
        }
      });
    });
  }

  if (compReader) {
    const complexDictsMap = {};
    compReader.rows.forEach(row => {
      const dictCode = compReader.getVal(row, 'dict_code');
      if (!dictCode || dictCode === 'price_group') return;

      if (!complexDictsMap[dictCode]) {
        let dictName = { "ru": dictCode, "en": dictCode };
        let metaSchema = [];
        if (dictCode === 'cutting_groups') {
          dictName = { "ru": "Группы раскроя", "en": "Cutting groups" };
          metaSchema = [
            { "key": "rotate", "type": "boolean", "label": { "ru": "Повтор рисунка", "en": "Pattern Repeat" } },
            { "key": "cut", "type": "boolean", "label": { "ru": "Раздельный раскрой", "en": "Separate Cutting" } }
          ];
        } else if (dictCode === 'thicknesses') {
          dictName = { "ru": "Коэффициенты толщин", "en": "Thickness Coefficients" };
          metaSchema = [
            { "key": "material_code", "type": "text", "label": { "ru": "Системный код материала", "en": "Material Code" } },
            { "key": "thickness", "type": "number", "label": { "ru": "Толщина (мм)", "en": "Thickness (mm)" } },
            { "key": "coefficient", "type": "number", "label": { "ru": "Коэффициент наценки", "en": "Coefficient" } }
          ];
        }

        complexDictsMap[dictCode] = {
          "external_code": "dict_" + dictCode,
          "code": dictCode,
          "name": dictName,
          "meta_schema": metaSchema,
          "records": []
        };
      }

      const recMeta = {};

      const k1 = compReader.getVal(row, 'k1');
      const v1 = compReader.getVal(row, 'v1');
      const k2 = compReader.getVal(row, 'k2');
      const v2 = compReader.getVal(row, 'v2');
      const k3 = compReader.getVal(row, 'k3');
      const v3 = compReader.getVal(row, 'v3');

      const parseValue = (val) => {
        if (val === 'TRUE' || val === true) return true;
        if (val === 'FALSE' || val === false) return false;
        if (val === '') return undefined;
        const num = parseFloat(val);
        return isNaN(num) ? val : num;
      };

      if (k1) recMeta[k1] = parseValue(v1);
      if (k2) recMeta[k2] = parseValue(v2);
      if (k3) recMeta[k3] = parseValue(v3);

      complexDictsMap[dictCode].records.push({
        "external_code": compReader.getVal(row, 'external_code'),
        "slug": String(compReader.getVal(row, 'slug')),
        "name": {
          "ru": compReader.getVal(row, 'name_ru'),
          "en": compReader.getVal(row, 'name_en') || undefined
        },
        "meta": recMeta
      });
    });

    jsonExport.complex_dictionaries = Object.values(complexDictsMap);
  }

  const attributesMap = {};
  // ИСПРАВЛЕНО: Заменен вызов неопределенной переменной attrRowsData на валидный attrReader2.rows [1]
  if (attrReader2) {
    attrReader2.rows.forEach(row => {
      const code = attrReader2.getVal(row, 'code');
      if (!code || code === 'price_group') return;
      attributesMap[code] = {
        "external_code": "attr_" + code,
        "code": code,
        "type": attrReader2.getVal(row, 'type'),
        "name": {
          "ru": attrReader2.getVal(row, 'name_ru'),
          "en": attrReader2.getVal(row, 'name_en')
        },
        "is_multiple": String(attrReader2.getVal(row, 'is_multiple')).toUpperCase() === 'TRUE',
        "options": []
      };
    });
  }

  if (optReader) {
    optReader.rows.forEach(row => {
      const code = optReader.getVal(row, 'attribute_code');
      if (!code || !attributesMap[code] || code === 'price_group') return;

      attributesMap[code].options.push({
        "external_code": optReader.getVal(row, 'external_code'),
        "slug": optReader.getVal(row, 'slug'),
        "value": {
          "ru": optReader.getVal(row, 'value_ru'),
          "en": optReader.getVal(row, 'value_en')
        },
        "meta": {
          "hex": optReader.getVal(row, 'hex') || null,
          "image": cleanUrl(optReader.getVal(row, 'image'))
        }
      });
    });
  }
  jsonExport.attributes = Object.values(attributesMap);

  const jsonString = JSON.stringify(jsonExport, null, 2);
  const htmlOutput = HtmlService.createHtmlOutput(
    `<p>Скопируйте JSON и сохраните его в файл <b>import_ready_filtered.json</b>:</p>
     <textarea style="width: 100%; height: 350px;" readonly onClick="this.select();">${jsonString}</textarea>`
  ).setWidth(600).setHeight(450);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Экспорт завершен');
}