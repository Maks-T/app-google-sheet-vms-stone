/**
 * sheets/Bindings.js — Листы привязок: по одному на каждый пайплайн
 */

var BINDING_ROWS = 2000;
var LIST_LIMIT = 500;

function setupBindingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const catalog = buildCatalogIndex(ss);
  getAllPipelineDefinitions().forEach(pipeline => {
    const sheet = getOrCreateSheet(ss, getBindingSheetName(pipeline));
    setupBindingSheetLayout(sheet);
    refreshBindingDropdowns(sheet, pipeline, catalog);
  });
  ss.toast('Листы привязок готовы.', 'Готово', 3);
}

function setupBindingSheetLayout(sheet) {
  applyHeaderStyles(sheet, BINDING_COLUMNS, BINDING_COLUMN_NOTES);

  const widths = [300, 260, 130, 300, 260, 80, 110, 90, 80, 160, 260, 260, 320];
  widths.forEach((w, i) => sheet.setColumnWidth(i + 1, w));
  [BC.PARENT_NAME, BC.CHILD_NAME, BC.CHECK].forEach(c => {
    sheet.getRange(2, c + 1, BINDING_ROWS - 1, 1).setFontColor('#64748B');
  });

  // ошибки красным
  const checkRange = sheet.getRange(2, BC.CHECK + 1, BINDING_ROWS - 1, 1);
  const rules = sheet.getConditionalFormatRules().filter(r => {
    const ranges = r.getRanges();
    return !(ranges.length === 1 && ranges[0].getColumn() === BC.CHECK + 1);
  });
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextStartsWith('Ошибка')
    .setFontColor('#B91C1C')
    .setRanges([checkRange])
    .build());
  sheet.setConditionalFormatRules(rules);
}

function refreshBindingDropdowns(sheet, pipeline, catalog) {
  const parentTypes = Object.keys(pipeline.schema);
  const childTypes = [];
  parentTypes.forEach(t => {
    Object.values(pipeline.schema[t]).forEach(slot => {
      if (slot.target_type === 'product_type' && !childTypes.includes(slot.target_code)) {
        childTypes.push(slot.target_code);
      }
    });
  });

  const parents = [];
  const children = [];
  catalog.forEach((item, sku) => {
    if (parentTypes.includes(item.type)) parents.push(sku);
    if (childTypes.includes(item.type)) children.push(sku);
  });

  const col = c => {
    const letter = String.fromCharCode(65 + c);
    return `${letter}2:${letter}${BINDING_ROWS}`;
  };
  setColumnValidation(sheet, col(BC.PARENT), parents.length <= LIST_LIMIT ? parents : [], true);
  setColumnValidation(sheet, col(BC.CHILD), children.length <= LIST_LIMIT ? children : [], true);
  setColumnValidation(sheet, col(BC.ROLE), getPipelineRoleList(pipeline), true);
  setColumnValidation(sheet, col(BC.REQUIRED), ['TRUE', 'FALSE'], true);
}

function validateBindingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = collectAllBindingRules(ss, true);
  const catalog = buildCatalogIndex(ss);
  getAllPipelineDefinitions().forEach(pipeline => {
    const sheet = ss.getSheetByName(getBindingSheetName(pipeline));
    if (sheet) refreshBindingDropdowns(sheet, pipeline, catalog);
  });

  const lines = result.report.map(r => `${r.pipeline}: правил ${r.rules}, ошибок ${r.errors}`);
  SpreadsheetApp.getUi().alert('Проверка привязок', lines.join('\n') || 'Листов привязок нет. Выполните пункт 5.', SpreadsheetApp.getUi().ButtonSet.OK);
}
