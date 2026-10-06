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

  // 0.2 Генерация графа связей ограждений (pl_fence) строго по Диаграмме 1
  generateFenceBindingRules(ss, rules, seenRuleCodes);

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

function addHolesParam(rules, seenRuleCodes, clipSku, holes, pipelineCode) {
  const pipeline = pipelineCode || "pl_terrace";
  const holesRuleCode = `rule_holes_${pipeline}_${clipSku}`.replace(/[^a-zA-Z0-9_]/g, '_');
  if (!seenRuleCodes.has(holesRuleCode)) {
    seenRuleCodes.add(holesRuleCode);
    rules.push({
      "pipeline_external_code": pipeline,
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
 * Автоматическая генерация графа связей ограждений pl_fence строго по Диаграмме 1
 */
function generateFenceBindingRules(ss, rules, seenRuleCodes) {
  // 1. Скалярные параметры отверстий для кронштейнов ограждения
  addHolesParam(rules, seenRuleCodes, '00112', '4', 'pl_fence');
  addHolesParam(rules, seenRuleCodes, '00204', '2', 'pl_fence');
  addHolesParam(rules, seenRuleCodes, '00177', '2', 'pl_fence');
  addHolesParam(rules, seenRuleCodes, '00129', '2', 'pl_fence');

  // 2. Сбор SKU с листов ограждений
  const pillars = extractSkusWithMeta(ss.getSheetByName('10. Столбы'));
  const rails = extractSkusWithMeta(ss.getSheetByName('11. Перила'));
  const balusters = extractSkusWithMeta(ss.getSheetByName('12. Балясины'));
  const profiles = extractSkusWithMeta(ss.getSheetByName('13. Заборный профиль и рейка'));
  const accessories = extractSkusWithMeta(ss.getSheetByName('14. Аксессуары ограждения'));

  // Дефолтные системные SKU, если листы еще не заполнены
  const defaultBaluster = balusters[0]?.sku || '00155';
  const defaultRail = rails[0]?.sku || '00280';
  const defaultPillarBracket = '00112';
  const defaultBalusterBracket = '00177';
  const defaultRailBracket = '00204';
  const defaultFastener = '00127';
  const defaultProfileBracket = '00129';

  // 3. Связи от корня столба (Pillar -> baluster, bracket, bracketFastener, fenceProfile, accessories)
  const activePillars = pillars.length > 0 ? pillars : [{ sku: '00337', name: 'Столб ДПК' }];
  activePillars.forEach(p => {
    const pSku = p.sku;
    const pName = p.name || pSku;

    // pillar -> baluster
    const matchedBaluster = balusters.find(b => b.color === p.color)?.sku || defaultBaluster;
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'baluster', pSku, matchedBaluster, 10, `Связь Балясина: ${pName}`, true));

    // pillar -> bracket (кронштейн столба)
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracket', pSku, defaultPillarBracket, 40, `Кронштейн столба: ${pName}`, true));

    // pillar -> bracketFastener (саморез кронштейна)
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracketFastener', pSku, defaultFastener, 50, `Саморез кронштейна: ${pName}`, true));

    // pillar -> fenceProfile
    if (profiles.length > 0) {
      const matchedProfile = profiles.find(pr => pr.color === p.color)?.sku || profiles[0].sku;
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'fenceProfile', pSku, matchedProfile, 20, `Заборный профиль: ${pName}`, false));
    }

    // pillar -> accessories (крышки и юбки)
    const matchedAccs = accessories.filter(a => a.color === p.color);
    const accsToUse = matchedAccs.length > 0 ? matchedAccs : [{ sku: '00230' }, { sku: '00367' }];
    accsToUse.forEach(a => {
      addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'accessories', pSku, a.sku, 30, `Аксессуар столба: ${pName}`, false));
    });
  });

  // 4. Связи балясины (Baluster -> rail, bracket, bracketFastener)
  const activeBalusters = balusters.length > 0 ? balusters : [{ sku: defaultBaluster, name: 'Балясина ДПК' }];
  activeBalusters.forEach(b => {
    const bSku = b.sku;
    const bName = b.name || bSku;
    const matchedRail = rails.find(r => r.color === b.color)?.sku || defaultRail;

    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'rail', bSku, matchedRail, 30, `Связь Перила: ${bName}`, true));
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracket', bSku, defaultBalusterBracket, 10, `Кронштейн балясины: ${bName}`, true));
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracketFastener', bSku, defaultFastener, 20, `Саморез кронштейна балясины: ${bName}`, true));
  });

  // 5. Связи перил (Rail -> bracket, bracketFastener)
  const activeRails = rails.length > 0 ? rails : [{ sku: defaultRail, name: 'Перила ДПК' }];
  activeRails.forEach(r => {
    const rSku = r.sku;
    const rName = r.name || rSku;

    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracket', rSku, defaultRailBracket, 10, `Кронштейн перил: ${rName}`, true));
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracketFastener', rSku, defaultFastener, 20, `Саморез кронштейна перил: ${rName}`, true));
  });

  // 6. Связи заборного профиля (FenceProfile -> bracket, bracketFastener, lath, lathFastener)
  profiles.forEach(pr => {
    const prSku = pr.sku;
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracket', prSku, defaultProfileBracket, 30, `Уголок профиля: ${prSku}`, true));
    addRuleIfUnique(rules, seenRuleCodes, makeRule('pl_fence', 'bracketFastener', prSku, defaultFastener, 40, `Саморез для уголка: ${prSku}`, true));
  });
}

function extractSkusWithMeta(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  const results = [];
  for (let i = 0; i < data.length; i++) {
    const sku = String(data[i][2] || '').trim();
    const name = String(data[i][3] || '').trim();
    const color = String(data[i][7] || '').trim().toLowerCase();
    if (sku && !results.some(r => r.sku === sku)) {
      results.push({ sku, name, color });
    }
  }
  return results;
}