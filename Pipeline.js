/**
 * Pipeline.js — Генерация матрицы связей калькулятора pl_terrace и экспорт binding_rules для VMS-NC
 * Полностью соответствует отраслевой схеме WpcPipelineRole (ступень с носиком, универсальная доска с саморезом).
 */

/**
 * Получение или создание листа связей калькулятора
 */
function getPipelineSheet(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('7. Связи калькулятора')
    || ss.getSheetByName('4. Связи калькулятора')
    || ss.getSheetByName('Связи калькулятора');
  if (!sheet) {
    sheet = ss.insertSheet('7. Связи калькулятора');
  }
  return sheet;
}

/**
 * Инициализация структуры колонок листа связей калькулятора
 */
function setupPipelineSheet(sheet) {
  sheet = sheet || getPipelineSheet();
  sheet.clear();

  const headers = [
    'board_sku',
    'board_name',
    'joist',
    'startClip',
    'baseClip',
    'corner',
    'universalBoards',
    'stepBoards',
    'board_fixing',
    'step_noseSize',
    'clip_holes'
  ];

  const notes = [
    'SKU модификации доски (родитель)',
    'Наименование доски',
    'Монтажная лага (type_joist, роль joist)',
    'Стартовый кляймер (type_brackets, роль startClip)',
    'Рядовой кляймер (type_brackets, роль baseClip)',
    'Уголок по периметру (type_decorProducts, роль corner)',
    'Универсальная доска для вертикальной зашивки (type_board, роль universalBoards)',
    'Ступень по периметру (type_stepBoard, роль stepBoards)',
    'Саморез для вертикальной зашивки (type_fasteners, роль fixing)',
    'Свес носика ступени, мм (скаляр noseSize, по умолчанию 20)',
    'Отверстий в кляймере (скаляр holes, по умолчанию 1)'
  ];

  applyHeaderStyles(sheet, headers, notes);
  sheet.getRange('J2:K2000').setNumberFormat('0');
  autoFitColumns(sheet, headers.length);
  sheet.setColumnWidth(2, 280);
}

/**
 * 1. Авто-генерация матрицы связей из самодостаточных листов
 */
function autoGenerateRelationsFromSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const boardsSheet = getBoardsSheet(ss);
  const stepsSheet = ss.getSheetByName('2. Ступени');
  const cornersSheet = ss.getSheetByName('3. Уголки и декор');
  const universalSheet = ss.getSheetByName('4. Универсальная доска (зашивка)') || ss.getSheetByName('4. Доска обрамления');
  const joistsSheet = ss.getSheetByName('5. Лаги');
  const clipsSheet = ss.getSheetByName('6. Кляймеры и крепеж');
  const pipelineSheet = getPipelineSheet(ss);

  if (!boardsSheet) {
    SpreadsheetApp.getUi().alert('Лист "1. Доски" не найден.');
    return;
  }

  // А. Загружаем все доски с Листа 1
  const boardData = boardsSheet.getDataRange().getValues();
  if (boardData.length < 2) {
    SpreadsheetApp.getUi().alert('Лист "1. Доски" пуст. Сначала выполните парсинг досок.');
    return;
  }

  // Б. Индексируем комплектующие по бренду и цвету
  const cornersByBrandAndColor = {};
  const cornersByColor = {};
  const stepsByBrandAndColor = {};
  const stepsByColor = {};
  const universalByBrandAndColor = {};
  const universalByColor = {};

  indexComponentSheet(cornersSheet, cornersByBrandAndColor, cornersByColor);
  indexComponentSheet(stepsSheet, stepsByBrandAndColor, stepsByColor);
  indexComponentSheet(universalSheet, universalByBrandAndColor, universalByColor);

  // В. Извлекаем лаги по умолчанию
  let defaultJoist = '';
  if (joistsSheet && joistsSheet.getLastRow() > 1) {
    const joistRows = joistsSheet.getRange(2, 3, joistsSheet.getLastRow() - 1, 1).getValues();
    for (let j = 0; j < joistRows.length; j++) {
      const sku = String(joistRows[j][0] || '').trim();
      if (sku) { defaultJoist = sku; break; }
    }
  }
  if (!defaultJoist) defaultJoist = 'gdk_joist_al_28_37_3000';

  // Г. Извлекаем кляймеры и саморезы
  let defaultStartClip = '';
  let defaultBaseClip = '';
  let defaultScrew = '';

  if (clipsSheet && clipsSheet.getLastRow() > 1) {
    const clipRows = clipsSheet.getRange(2, 3, clipsSheet.getLastRow() - 1, 2).getValues();
    for (let c = 0; c < clipRows.length; c++) {
      const sku = String(clipRows[c][0] || '').trim();
      const name = String(clipRows[c][1] || '').toLowerCase();
      if (!defaultStartClip && (name.includes('старт') || sku.toLowerCase().includes('start') || sku.includes('HS7'))) {
        defaultStartClip = sku;
      } else if (!defaultBaseClip && (name.includes('рядов') || sku.includes('H3D7') || name.includes('клипса') || name.includes('кляймер'))) {
        defaultBaseClip = sku;
      } else if (!defaultScrew && (name.includes('саморез') || name.includes('шуруп') || sku.includes('screw'))) {
        defaultScrew = sku;
      }
    }
  }
  if (!defaultStartClip) defaultStartClip = 'gdk_acc_HS7';
  if (!defaultBaseClip) defaultBaseClip = 'gdk_acc_H3D7';
  if (!defaultScrew) defaultScrew = 'screw_35x20';

  const pipelineRows = [];

  for (let b = 1; b < boardData.length; b++) {
    const sku = String(boardData[b][2] || '').trim();
    const name = String(boardData[b][3] || '').trim();
    const brand = String(boardData[b][4] || '').trim();
    const colorSlug = String(boardData[b][7] || '').trim().toLowerCase();

    if (!sku) continue;

    const key = `${brand}_${colorSlug}`;
    const cornerSku = cornersByBrandAndColor[key] || cornersByColor[colorSlug] || Object.values(cornersByColor)[0] || '';
    const uniboardSku = universalByBrandAndColor[key] || universalByColor[colorSlug] || Object.values(universalByColor)[0] || '';
    const stepSku = stepsByBrandAndColor[key] || stepsByColor[colorSlug] || Object.values(stepsByColor)[0] || '';

    pipelineRows.push([
      sku,
      name,
      defaultJoist,
      defaultStartClip,
      defaultBaseClip,
      cornerSku,
      uniboardSku,
      stepSku,
      defaultScrew,
      20, // step_noseSize
      1   // clip_holes
    ]);
  }

  if (pipelineRows.length > 0) {
    setupPipelineSheet(pipelineSheet);
    const lastRow = pipelineSheet.getLastRow();
    if (lastRow > 1) {
      pipelineSheet.getRange(2, 1, lastRow - 1, 11).clearContent();
    }
    pipelineSheet.getRange(2, 1, pipelineRows.length, 11).setValues(pipelineRows);
    syncDropdowns();
    ss.toast(`Сгенерировано связей для ${pipelineRows.length} досок.`, 'Готово', 3);
  }
}

function indexComponentSheet(sheet, byBrandAndColor, byColor) {
  if (!sheet || sheet.getLastRow() < 2) return;
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    const sku = String(data[r][2] || '').trim();
    const brand = String(data[r][4] || '').trim();
    const colorSlug = String(data[r][7] || '').trim().toLowerCase();

    if (!sku) continue;
    if (colorSlug) {
      byColor[colorSlug] = sku;
      if (brand) byBrandAndColor[`${brand}_${colorSlug}`] = sku;
    }
  }
}

/**
 * 2. Синхронизация выпадающих списков на листе связей
 */
function syncDropdowns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pipelineSheet = getPipelineSheet(ss);

  const boards = extractSkusFromSheet(getBoardsSheet(ss));
  const steps = extractSkusFromSheet(ss.getSheetByName('2. Ступени'));
  const corners = extractSkusFromSheet(ss.getSheetByName('3. Уголки и декор'));
  const uniboards = extractSkusFromSheet(ss.getSheetByName('4. Универсальная доска (зашивка)') || ss.getSheetByName('4. Доска обрамления'));
  const joists = extractSkusFromSheet(ss.getSheetByName('5. Лаги'));
  const clipsAndFasteners = extractSkusFromSheet(ss.getSheetByName('6. Кляймеры и крепеж'));

  setColumnValidation(pipelineSheet, 'A2:A1000', boards);
  setColumnValidation(pipelineSheet, 'C2:C1000', joists);
  setColumnValidation(pipelineSheet, 'D2:D1000', clipsAndFasteners);
  setColumnValidation(pipelineSheet, 'E2:E1000', clipsAndFasteners);
  setColumnValidation(pipelineSheet, 'F2:F1000', corners);
  setColumnValidation(pipelineSheet, 'G2:G1000', uniboards);
  setColumnValidation(pipelineSheet, 'H2:H1000', steps, true);
  setColumnValidation(pipelineSheet, 'I2:I1000', clipsAndFasteners);
}

function extractSkusFromSheet(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 3, sheet.getLastRow() - 1, 1).getValues();
  const skus = [];
  for (let i = 0; i < data.length; i++) {
    const val = String(data[i][0] || '').trim();
    if (val && !skus.includes(val)) skus.push(val);
  }
  return skus;
}

/**
 * 3. Экспорт связей калькулятора в JSON (массив binding_rules)
 */
function exportBindingRulesJson() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getPipelineSheet(ss);
  if (!sheet) return;

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

  const jsonOutput = JSON.stringify(rules, null, 2);
  const htmlOutput = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif;margin-bottom:8px;">Сформировано правил связей: <b>' + rules.length + '</b>. Скопируйте этот массив в раздел <code>"binding_rules": [...]</code> вашего файла <b>import/import_data.json</b>:</p>' +
    '<textarea style="width:100%;height:370px;font-family:monospace;font-size:11px;" readonly onClick="this.select();">' + jsonOutput + '</textarea>'
  ).setWidth(720).setHeight(490);

  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Экспорт массива binding_rules');
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