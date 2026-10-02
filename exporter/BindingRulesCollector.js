/**
 * exporter/BindingRulesCollector.js — Сборщик связей и правил калькулятора (binding_rules)
 */

function collectAllBindingRules(ss) {
  const sheet = getPipelineSheet(ss);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const data = sheet.getDataRange().getValues();
  const rules = [];
  const seenRuleCodes = new Set();

  // 0. Гарантированное добавление правил крепления (pl_joist -> fixing) для ВСЕХ лаг с Листа 5
  const joistsSheet = ss.getSheetByName('5. Лаги');
  if (joistsSheet && joistsSheet.getLastRow() > 1) {
    const joistData = joistsSheet.getRange(2, 3, joistsSheet.getLastRow() - 1, 1).getValues();
    for (let j = 0; j < joistData.length; j++) {
      const joistSku = String(joistData[j][0] || '').trim();
      if (joistSku) {
        addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_joist', 'fixing', joistSku, '00124', 10, `Крепление лаги (саморез): ${joistSku}`));
      }
    }
  }

  // 0.1 Связь винтовой сваи с оголовком (pile_head)
  addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_joist', 'pile_head', 'CBO-89-2000', 'OG-150-150', 20, 'Оголовок для сваи СВС-89 (150х150)', false));

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
    let fixing = String(data[i][8] || '').trim();
    if (!fixing || fixing === '124' || fixing === 'sku_00124') {
      fixing = '00124';
    }
    const noseSize = data[i][9] || 20;
    const holes = data[i][10] || 1;

    // 1. Монтажная лага
    if (joist) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_joist', 'fixing', joist, fixing, 10, `Крепление лаги (саморез): ${joist}`));
    }

    // 2. Стартовый кляймер + параметр holes
    if (startClip) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'startClip', parentSku, startClip, 10, `Связь startClip: ${parentName}`));
      addHolesParam(rules, seenRuleCodes, startClip, holes);
    }

    // 3. Рядовой кляймер + параметр holes
    if (baseClip) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'baseClip', parentSku, baseClip, 20, `Связь baseClip: ${parentName}`));
      addHolesParam(rules, seenRuleCodes, baseClip, holes);
    }

    // 4. Декоративный уголок
    if (corner) {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'corner', parentSku, corner, 30, `Связь corner: ${parentName}`, false));
    }

    // 5. Универсальные доски
    if (universalBoardsRaw) {
      const items = universalBoardsRaw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
      items.forEach(childSku => {
        addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'universalBoards', parentSku, childSku, 40, `Связь universalBoards: ${parentName}`, false));
        addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_terrace', 'fixing', childSku, fixing, 10, `Связь Крепление доски (саморез): ${childSku}`, true));
      });
    }

    // 6. Ступени + параметр noseSize
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