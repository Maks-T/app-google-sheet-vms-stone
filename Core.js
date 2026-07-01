function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('VMS Каталог')
    .addItem('1. Инициализировать базовые настройки', 'bootstrapConfigSheets')
    .addItem('2. Создать/Обновить рабочие листы товаров', 'setupWorkingSheets')
    .addSeparator()
    .addItem('3. Синхронизировать новые опции', 'syncNewDataFromWorkingSheets')
    .addSeparator()
    .addItem('4. Экспортировать данные в JSON', 'exportCatalogJson')
    .addToUi();
}

function onEdit(e) {
}

function bootstrapConfigSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configDefs = getConfigDefs();

  Object.keys(configDefs).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    sheet.clear();
    sheet.getRange(1, 1, configDefs[sheetName].length, configDefs[sheetName][0].length).setValues(configDefs[sheetName]);
    sheet.autoResizeColumns(1, configDefs[sheetName][0].length);
    sheet.getRange(1, 1, 1, configDefs[sheetName][0].length).setBackground('#004d20').setFontColor('#ffffff').setFontWeight('bold');
  });

  ['ref_lists', 'ref_mappings'].forEach(name => {
    let s = ss.getSheetByName(name);
    if (s) ss.deleteSheet(s);
  });

  applyConfigValidations(ss);
  SpreadsheetApp.getUi().alert('Инициализация', 'Таблицы успешно подготовлены! На листе cfg_types теперь доступна матрица чекбоксов.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function getDropdownData(ss) {
  const dropdowns = { 'category': [], '_AllAttributes': [] };
  
  const catReader = getRowReader(ss.getSheetByName('cfg_categories'));
  if (catReader) {
    catReader.rows.forEach(row => {
      const nameRu = catReader.getVal(row, 'name_ru');
      if (nameRu) dropdowns['category'].push(String(nameRu));
    });
  }
  
  const optReader = getRowReader(ss.getSheetByName('cfg_options'));
  if (optReader) {
    optReader.rows.forEach(row => {
      const code = optReader.getVal(row, 'attribute_code');
      const val = optReader.getVal(row, 'value_ru');
      if (code && val) {
        if (!dropdowns[code]) dropdowns[code] = [];
        dropdowns[code].push(String(val));
      }
    });
  }

  const complexReader = getRowReader(ss.getSheetByName('cfg_complex_dicts'));
  if (complexReader) {
    complexReader.rows.forEach(row => {
      const code = complexReader.getVal(row, 'dict_code');
      const val = complexReader.getVal(row, 'name_ru');
      if (code && val) {
        if (!dropdowns[code]) dropdowns[code] = [];
        dropdowns[code].push(String(val));
      }
    });
  }

  const pgReader = getRowReader(ss.getSheetByName('cfg_price_groups'));
  if (pgReader) {
    dropdowns['price_group'] = [];
    pgReader.rows.forEach(row => {
      const nameRu = pgReader.getVal(row, 'name_ru');
      if (nameRu) dropdowns['price_group'].push(String(nameRu));
    });
  }
  
  const attrReader = getRowReader(ss.getSheetByName('cfg_attributes'));
  if (attrReader) {
    attrReader.rows.forEach(row => {
      const code = attrReader.getVal(row, 'code');
      if (code) dropdowns['_AllAttributes'].push(String(code));
    });
  }
  
  return dropdowns;
}

function applyConfigValidations(ss) {
  const dropdowns = getDropdownData(ss);
  const getRule = (list, soft = true) => {
    if (!list || list.length === 0) return null;
    const uniqueList = [...new Set(list)].filter(String).slice(0, 500);
    return uniqueList.length > 0 ? SpreadsheetApp.newDataValidation().requireValueInList(uniqueList, true).setAllowInvalid(soft).build() : null;
  };

  const boolRule = getRule(['TRUE', 'FALSE'], false);
  const typeRule = getRule(['string', 'numeric', 'boolean', 'dictionary', 'complex_reference'], false);

  const attrSheet = ss.getSheetByName('cfg_attributes');
  if (attrSheet) {
    if (typeRule) attrSheet.getRange(2, 4, 1000, 1).setDataValidation(typeRule);
    if (boolRule) {
      attrSheet.getRange(2, 5, 1000, 1).setDataValidation(boolRule);
      attrSheet.getRange(2, 6, 1000, 1).setDataValidation(boolRule);
    }
  }

  const typesSheet = ss.getSheetByName('cfg_types');
  if (typesSheet) {
    const lastCol = typesSheet.getLastColumn();
    const lastRow = typesSheet.getLastRow();
    if (lastCol >= 5 && lastRow > 1) {
      const checkboxRange = typesSheet.getRange(2, 5, lastRow - 1, lastCol - 4);
      checkboxRange.clearDataValidations();
      const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
      checkboxRange.setDataValidation(checkboxRule);
    }
  }
}

function getSortedColumnList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('cfg_column_order');
  const orderMap = {};
  
  if (sheet) {
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      const code = String(rows[i][0]).trim();
      const order = parseFloat(rows[i][1]);
      if (code && !isNaN(order)) {
        orderMap[code] = order;
      }
    }
  }
  return orderMap;
}

function setupWorkingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const typesSheet = ss.getSheetByName('cfg_types');
  const attrSheet = ss.getSheetByName('cfg_attributes');
  
  if (!typesSheet || !attrSheet) {
    SpreadsheetApp.getUi().alert('Ошибка', 'Сначала выполните шаг 1.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  applyConfigValidations(ss); 
  const dropdowns = getDropdownData(ss);
  const orderMap = getSortedColumnList();

  const attrRows = attrSheet.getDataRange().getValues();
  const attrMap = {};
  for (let i = 1; i < attrRows.length; i++) attrMap[attrRows[i][0]] = { nameRu: attrRows[i][1], type: attrRows[i][3] };

  const typeRows = typesSheet.getDataRange().getValues();
  const typeHeaders = typeRows[0];

  for (let i = 1; i < typeRows.length; i++) {
    const typeCode = typeRows[i][0];
    const typeName = typeRows[i][2];
    if (!typeCode || !typeName) continue;

    const attachedAttrs = [];
    for (let col = 4; col < typeHeaders.length; col++) {
      const attrCode = typeHeaders[col];
      const isChecked = typeRows[i][col] === true || String(typeRows[i][col]).toUpperCase() === 'TRUE';
      if (isChecked && attrCode) {
        attachedAttrs.push(attrCode);
      }
    }

    let sheet = ss.getSheetByName(typeName);
    let existingData = [];
    if (sheet) {
      existingData = sheet.getDataRange().getValues();
    } else {
      sheet = ss.insertSheet(typeName);
    }

    const activeColumns = [...BASE_FIELDS];
    attachedAttrs.forEach(attrCode => {
      if (!activeColumns.includes(attrCode)) {
        activeColumns.push(attrCode);
      }
    });

    activeColumns.sort((a, b) => {
      const orderA = orderMap[a] !== undefined ? orderMap[a] : 99999;
      const orderB = orderMap[b] !== undefined ? orderMap[b] : 99999;
      return orderA - orderB;
    });

    const labelsMap = {
      'base_ext_code': 'ID Базового Товара',
      'base_name': 'Название (Заполнять 1 раз на товар)',
      'base_slug': 'ЧПУ (Slug)',
      'base_category': 'Категория',
      'base_image': 'Картинка товара (URL)',
      'sku_code': 'Артикул модификации (SKU)',
      'sku_image': 'Картинка модификации (URL)',
      'sku_cost': 'Себестоимость',
      'sku_currency': 'Валюта',
      'sku_default': 'По умолчанию',
      'sku_stock': 'Остаток',
      'sku_manual': 'Ручная цена',
      'price_group': 'Ценовая категория'
    };

    const targetHeaders = activeColumns;
    const targetLabels = targetHeaders.map(code => {
      if (labelsMap[code]) return labelsMap[code];
      return attrMap[code] ? attrMap[code].nameRu : code;
    });

    let mappedDataRows = [];
    if (existingData.length > 2) {
      const currentSysHeaders = existingData[0].map(s => String(s).trim());
      const currentDataRows = existingData.slice(2);

      mappedDataRows = currentDataRows.map(row => {
        const newRow = new Array(targetHeaders.length).fill('');
        targetHeaders.forEach((header, newIdx) => {
          const oldIdx = currentSysHeaders.indexOf(header);
          if (oldIdx !== -1) {
            newRow[newIdx] = row[oldIdx];
          }
        });
        return newRow;
      });
    }

    sheet.clear();
    sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearDataValidations();
    
    sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
    sheet.getRange(2, 1, 1, targetLabels.length).setValues([targetLabels]);
    
    if (mappedDataRows.length > 0) {
      sheet.getRange(3, 1, mappedDataRows.length, targetHeaders.length).setValues(mappedDataRows);
    }
    
    sheet.getRange(1, 1, 1, targetHeaders.length).setBackground('#f3f4f6').setFontColor('#9ca3af').setFontWeight('normal');
    sheet.getRange(2, 1, 1, targetLabels.length).setBackground('#000033').setFontColor('#ffffff').setFontWeight('bold');
    
    sheet.setFrozenRows(2);

    const validations = [];
    const addVal = (code, list, listKey) => {
      const colIdx = targetHeaders.indexOf(code);
      if (colIdx !== -1) {
        validations.push({ col: colIdx + 1, list: list, listKey: listKey });
      }
    };

    addVal('base_category', null, 'category');
    addVal('sku_currency', ['RUB', 'USD', 'BYN'], null);
    addVal('sku_default', ['TRUE', 'FALSE'], null);
    addVal('sku_manual', ['TRUE', 'FALSE'], null);
    addVal('price_group', null, 'price_group');

    attachedAttrs.forEach(attrCode => {
      if (!attrMap[attrCode]) return;
      const colIdx = targetHeaders.indexOf(attrCode);
      if (colIdx !== -1) {
        if (attrMap[attrCode].type === 'dictionary' || attrMap[attrCode].type === 'complex_reference') {
          validations.push({ col: colIdx + 1, listKey: attrCode });
        } else if (attrMap[attrCode].type === 'boolean') {
          validations.push({ col: colIdx + 1, list: ['TRUE', 'FALSE'] });
        }
      }
    });

    validations.forEach(cfg => {
      const cellRange = sheet.getRange(3, cfg.col, 1000, 1);
      const listData = cfg.list || dropdowns[cfg.listKey] || [];
      if (listData && listData.length > 0) {
        const uniqueList = [...new Set(listData)].filter(String).slice(0, 500);
        if (uniqueList.length > 0) {
          const rule = SpreadsheetApp.newDataValidation().requireValueInList(uniqueList, true).setAllowInvalid(true).build();
          cellRange.setDataValidation(rule);
        }
      }
    });
    
    sheet.autoResizeColumns(1, targetHeaders.length);
  }
}

function syncNewDataFromWorkingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const catSheet = ss.getSheetByName('cfg_categories');
  const attrSheet = ss.getSheetByName('cfg_attributes');
  const optSheet = ss.getSheetByName('cfg_options');
  const typesSheet = ss.getSheetByName('cfg_types');
  const pgSheet = ss.getSheetByName('cfg_price_groups');
  
  if (!catSheet || !attrSheet || !optSheet || !typesSheet) {
    SpreadsheetApp.getUi().alert('Ошибка', 'Один из листов конфигурации отсутствует.', SpreadsheetApp.getUi().ButtonSet.OK);
    return;
  }

  const knownCategories = new Set(catSheet.getRange(2, 4, Math.max(1, catSheet.getLastRow() - 1), 1).getValues().flat().filter(String));
  const knownAttrs = new Set(attrSheet.getRange(2, 1, Math.max(1, attrSheet.getLastRow() - 1), 1).getValues().flat().filter(String));
  
  const attrRows = attrSheet.getDataRange().getValues();
  const attrTypeMap = {};
  for (let i = 1; i < attrRows.length; i++) {
    if (attrRows[i][0]) {
      attrTypeMap[attrRows[i][0]] = String(attrRows[i][3]).toLowerCase().trim();
    }
  }

  const knownOptions = new Set();
  const optRows = optSheet.getDataRange().getValues();
  for(let i = 1; i < optRows.length; i++) {
    if (optRows[i][0] && optRows[i][3]) {
      knownOptions.add(optRows[i][0] + ':' + String(optRows[i][3]).trim());
    }
  }

  const knownPriceGroups = new Set();
  if (pgSheet) {
    const pgRows = pgSheet.getDataRange().getValues();
    for (let i = 1; i < pgRows.length; i++) {
      if (pgRows[i][2]) {
        knownPriceGroups.add(cleanSlug(pgRows[i][2]));
      }
    }
  }

  let newCat = 0, newAttr = 0, newOpt = 0, newPg = 0;
  const typeRows = typesSheet.getDataRange().getValues();
  const typeHeaders = typeRows[0];

  for (let tIdx = 1; tIdx < typeRows.length; tIdx++) {
    const typeCode = typeRows[tIdx][0];
    const familyCode = typeRows[tIdx][1];
    const typeName = typeRows[tIdx][2];
    if (!typeCode) continue;

    const sheet = ss.getSheetByName(typeName);
    if (!sheet) continue;

    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) continue;

    const sysHeaders = rows[0].map(s => String(s).trim());
    const lblHeaders = rows[1];

    const getVal = (code, row) => {
      const idx = sysHeaders.indexOf(code);
      return idx !== -1 ? row[idx] : null;
    };

    for (let c = 0; c < sysHeaders.length; c++) {
      const attrCode = sysHeaders[c];
      const attrNameRu = String(lblHeaders[c]).trim();
      if (!attrCode || BASE_FIELDS.includes(attrCode)) continue;

      if (!knownAttrs.has(attrCode)) {
        attrSheet.appendRow([attrCode, attrNameRu, transliterate(attrNameRu), 'dictionary', 'FALSE', 'FALSE']);
        knownAttrs.add(attrCode);
        attrTypeMap[attrCode] = 'dictionary';
        newAttr++;
      }

      let colIdx = typeHeaders.indexOf(attrCode);
      if (colIdx === -1) {
        const newColNum = typeHeaders.length + 1;
        typesSheet.getRange(1, newColNum).setValue(attrCode);
        
        const lastRow = typesSheet.getLastRow();
        const checkboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
        typesSheet.getRange(2, newColNum, lastRow - 1, 1).setDataValidation(checkboxRule);
        
        typeHeaders.push(attrCode);
        colIdx = typeHeaders.indexOf(attrCode);

        const colOrderSheet = ss.getSheetByName('cfg_column_order');
        if (colOrderSheet) {
          const lastRowOrder = colOrderSheet.getLastRow();
          const lastVal = parseFloat(colOrderSheet.getRange(lastRowOrder, 2).getValue()) || 200;
          colOrderSheet.appendRow([attrCode, lastVal + 10]);
        }
      }
      
      typesSheet.getRange(tIdx + 1, colIdx + 1).setValue(true);
    }

    for (let r = 2; r < rows.length; r++) {
      const pgVal = String(getVal('price_group', rows[r])).trim();
      if (pgVal !== '' && pgVal !== 'null') {
        const pgSlug = cleanSlug(pgVal);
        if (!knownPriceGroups.has(pgSlug) && pgSheet) {
          pgSheet.appendRow([
            familyCode,           
            'pg_' + pgSlug,       
            pgVal,                
            pgVal,                
            pgVal,                
            0,                    
            'USD',                
            30,                   
            10                    
          ]);
          knownPriceGroups.add(pgSlug);
          newPg++;
        }
      }

      const catVal = getVal('base_category', rows[r]);
      if (catVal && !knownCategories.has(catVal)) {
        catSheet.appendRow([getExtCode('cat', catVal), '', generateSlug(catVal), catVal, transliterate(catVal)]);
        knownCategories.add(catVal);
        newCat++;
      }

      for (let c = 0; c < sysHeaders.length; c++) {
        const attrCode = sysHeaders[c];
        if (!attrCode || BASE_FIELDS.includes(attrCode)) continue;

        const attrType = attrTypeMap[attrCode];
        if (attrType === 'dictionary') {
          const cellVal = String(rows[r][c]).trim();
          if (cellVal !== '') {
            const checkKey = attrCode + ':' + cellVal;
            if (!knownOptions.has(checkKey)) {
              optSheet.appendRow([attrCode, getExtCode('opt_' + attrCode, cellVal), generateSlug(cellVal), cellVal, transliterate(cellVal), '', '']);
              knownOptions.add(checkKey);
              newOpt++;
            }
          }
        }
      }
    }
  }

  setupWorkingSheets();
  SpreadsheetApp.getUi().alert('Синхронизация завершена', `Новых категорий: ${newCat}\nНовых колонок: ${newAttr}\nНовых опций: ${newOpt}\nНовых ценовых групп: ${newPg}\n\nСписки успешно обновлены!`, SpreadsheetApp.getUi().ButtonSet.OK);
}