/**
 * exporter/BindingRulesCollector.js — Сборка binding_rules с листов привязок пайплайнов
 */

var BINDING_COLUMNS = [
  'parent_sku',
  'parent_name',
  'role',
  'child_sku',
  'child_name',
  'value',
  'quantity_formula',
  'is_required',
  'sort_order',
  'conditions',
  'rule_code',
  'rule_name',
  'check'
];

var BINDING_COLUMN_NOTES = [
  'SKU родителя (вариант товара). Тип родителя должен быть в схеме пайплайна',
  'Заполняется при проверке',
  'Роль (слот) из схемы пайплайна',
  'SKU дочернего товара. Пусто для скалярной роли (noseSize, holes)',
  'Заполняется при проверке',
  'Значение скалярной роли → static_meta {role: value}',
  'Формула расхода, по умолчанию 1',
  'TRUE / FALSE. Пусто — из схемы пайплайна',
  'Порядок, по умолчанию 10',
  'JSON условий, необязательно',
  'external_code правила. Пусто — сгенерируется',
  'Название правила. Пусто — сгенерируется',
  'Результат проверки'
];

var BC = {
  PARENT: 0, PARENT_NAME: 1, ROLE: 2, CHILD: 3, CHILD_NAME: 4, VALUE: 5,
  FORMULA: 6, REQUIRED: 7, SORT: 8, CONDITIONS: 9, CODE: 10, NAME: 11, CHECK: 12
};

function getBindingSheetName(pipeline) {
  return 'Привязки ' + pipeline.code;
}

function getPipelineRoleList(pipeline) {
  const roles = [];
  Object.keys(pipeline.schema).forEach(parentType => {
    Object.keys(pipeline.schema[parentType]).forEach(role => {
      if (!roles.includes(role)) roles.push(role);
    });
  });
  return roles;
}

function parseBool(value, fallback) {
  if (value === true || value === false) return value;
  const s = String(value || '').trim().toLowerCase();
  if (!s) return fallback;
  return ['true', 'да', '1', 'yes', 'истина'].includes(s);
}

function sanitizeRuleCode(code) {
  return String(code).replace(/[^a-zA-Z0-9_]/g, '_');
}

// строка листа → правило; catalog: Map sku → {type, name}
function bindingRuleFromRow(row, pipeline, catalog) {
  const parentSku = String(row[BC.PARENT] || '').trim();
  const role = String(row[BC.ROLE] || '').trim();
  const childSku = String(row[BC.CHILD] || '').trim();
  const value = String(row[BC.VALUE] === 0 ? '0' : (row[BC.VALUE] || '')).trim();

  const result = { rule: null, error: null, parentName: '', childName: '' };

  if (!parentSku) {
    result.error = 'нет SKU родителя';
    return result;
  }
  const parent = catalog.get(parentSku);
  if (!parent) {
    result.error = 'SKU родителя нет в каталоге';
    return result;
  }
  result.parentName = parent.name;

  const slots = pipeline.schema[parent.type];
  if (!slots) {
    result.error = `тип ${parent.type} не является родителем в ${pipeline.code}`;
    return result;
  }
  const slot = slots[role];
  if (!slot) {
    result.error = `роль "${role}" недопустима для ${parent.type}. Доступно: ${Object.keys(slots).join(', ')}`;
    return result;
  }

  const isScalar = slot.target_type === 'scalar';
  let child = null;
  if (isScalar) {
    if (value === '') {
      result.error = 'не указано значение';
      return result;
    }
  } else {
    if (!childSku) {
      result.error = 'нет SKU дочернего товара';
      return result;
    }
    child = catalog.get(childSku);
    if (!child) {
      result.error = 'SKU дочернего товара нет в каталоге';
      return result;
    }
    result.childName = child.name;
    if (child.type !== slot.target_code) {
      result.error = `ожидается тип ${slot.target_code}, а у товара ${child.type}`;
      return result;
    }
  }

  let conditions = null;
  const condText = String(row[BC.CONDITIONS] || '').trim();
  if (condText) {
    try {
      conditions = JSON.parse(condText);
    } catch (e) {
      result.error = 'conditions: неверный JSON';
      return result;
    }
  }

  const label = (slot.label_key && slot.label_key.ru) || role;
  const code = String(row[BC.CODE] || '').trim() || sanitizeRuleCode(
    isScalar ? `rule_${role}_${pipeline.code}_${parentSku}` : `rule_${role}_${parentSku}_${childSku}`
  );
  const name = String(row[BC.NAME] || '').trim() || (isScalar
    ? `Параметр ${label}: ${parent.name}`
    : `${label}: ${parent.name}`);

  const sortRaw = row[BC.SORT];
  const sortOrder = sortRaw === '' || sortRaw === null || isNaN(Number(sortRaw)) ? 10 : Number(sortRaw);

  const staticMeta = isScalar ? {} : null;
  if (isScalar) staticMeta[role] = value;

  result.rule = {
    pipeline_external_code: pipeline.code,
    external_code: code,
    name: name,
    role: role,
    parent_type_key: 'product_variant',
    parent_external_code: parentSku,
    child_type_key: isScalar ? null : 'product_variant',
    child_external_code: isScalar ? null : childSku,
    conditions: conditions,
    static_meta: staticMeta,
    quantity_formula: String(row[BC.FORMULA] || '').trim() || '1',
    is_required: parseBool(row[BC.REQUIRED], slot.is_required),
    sort_order: sortOrder
  };
  return result;
}

// правило → строка листа
function bindingRowFromRule(rule, catalog) {
  const row = new Array(BINDING_COLUMNS.length).fill('');
  const parent = catalog ? catalog.get(rule.parent_external_code) : null;
  const child = catalog && rule.child_external_code ? catalog.get(rule.child_external_code) : null;
  let value = '';
  if (rule.static_meta) {
    value = rule.static_meta[rule.role] !== undefined
      ? rule.static_meta[rule.role]
      : Object.values(rule.static_meta)[0];
  }
  row[BC.PARENT] = rule.parent_external_code || '';
  row[BC.PARENT_NAME] = parent ? parent.name : '';
  row[BC.ROLE] = rule.role || '';
  row[BC.CHILD] = rule.child_external_code || '';
  row[BC.CHILD_NAME] = child ? child.name : '';
  row[BC.VALUE] = value === undefined || value === null ? '' : String(value);
  row[BC.FORMULA] = rule.quantity_formula || '1';
  row[BC.REQUIRED] = rule.is_required === undefined ? '' : !!rule.is_required;
  row[BC.SORT] = rule.sort_order === undefined || rule.sort_order === null ? '' : rule.sort_order;
  row[BC.CONDITIONS] = rule.conditions ? JSON.stringify(rule.conditions) : '';
  row[BC.CODE] = rule.external_code || '';
  row[BC.NAME] = rule.name || '';
  return row;
}

// все строки листа → { rules, checks[], errors }
function bindingRulesFromRows(rows, pipeline, catalog) {
  const rules = [];
  const checks = [];
  const seenCodes = new Set();
  const singleRoles = new Map();
  let errors = 0;

  rows.forEach(row => {
    const isEmpty = !String(row[BC.PARENT] || '').trim()
      && !String(row[BC.ROLE] || '').trim()
      && !String(row[BC.CHILD] || '').trim();
    if (isEmpty) {
      checks.push({ status: '', parentName: '', childName: '' });
      return;
    }

    const res = bindingRuleFromRow(row, pipeline, catalog);
    let status = res.error ? 'Ошибка: ' + res.error : 'OK';

    if (res.rule) {
      const parentType = catalog.get(res.rule.parent_external_code).type;
      const slot = pipeline.schema[parentType][res.rule.role];
      const key = res.rule.parent_external_code + '|' + res.rule.role;

      if (seenCodes.has(res.rule.external_code)) {
        status = 'Ошибка: дубль rule_code ' + res.rule.external_code;
      } else if (!slot.is_multiple && singleRoles.has(key)) {
        status = 'Ошибка: роль не множественная, уже задана выше';
      } else {
        seenCodes.add(res.rule.external_code);
        singleRoles.set(key, true);
        rules.push(res.rule);
      }
    }

    if (status !== 'OK') errors++;
    checks.push({ status: status, parentName: res.parentName, childName: res.childName });
  });

  return { rules: rules, checks: checks, errors: errors };
}

function readBindingRows(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, BINDING_COLUMNS.length).getValues();
}

// writeChecks: записать имена и статус обратно на листы
function collectAllBindingRules(ss, writeChecks) {
  const catalog = buildCatalogIndex(ss);
  const allRules = [];
  const report = [];

  getAllPipelineDefinitions().forEach(pipeline => {
    const sheet = ss.getSheetByName(getBindingSheetName(pipeline));
    if (!sheet) return;
    const rows = readBindingRows(sheet);
    const res = bindingRulesFromRows(rows, pipeline, catalog);
    allRules.push.apply(allRules, res.rules);
    report.push({ pipeline: pipeline.code, rules: res.rules.length, errors: res.errors });

    if (writeChecks && rows.length > 0) {
      const names = res.checks.map((c, i) => [c.parentName || rows[i][BC.PARENT_NAME] || '']);
      const childNames = res.checks.map((c, i) => [c.childName || rows[i][BC.CHILD_NAME] || '']);
      const statuses = res.checks.map(c => [c.status]);
      sheet.getRange(2, BC.PARENT_NAME + 1, rows.length, 1).setValues(names);
      sheet.getRange(2, BC.CHILD_NAME + 1, rows.length, 1).setValues(childNames);
      sheet.getRange(2, BC.CHECK + 1, rows.length, 1).setValues(statuses);
    }
  });

  return { rules: allRules, report: report };
}
