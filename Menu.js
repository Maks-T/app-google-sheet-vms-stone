/**
 * Menu.js — Главное меню и инициализация книги каталога GreenDecks для VMS-NC
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Каталог GreenDecks')
    .addItem('1. Инициализировать все листы каталога', 'setupAllSheets')
    .addSeparator()
    .addItem('2. Спарсить Доски со всеми цветами и ценами (Лист 1)', 'parseBoardsToFullCatalog')
    .addItem('3. Спарсить все Комплектующие (Листы 2–6)', 'parseAllComponentSheets')
    .addItem('4. Спарсить только текущий открытый лист комплектующих', 'parseActiveComponentSheet')
    .addSeparator()
    .addItem('5. Сгенерировать матрицу связей калькулятора (Лист 7)', 'autoGenerateRelationsFromSheets')
    .addItem('6. Синхронизировать выпадающие списки связей', 'syncDropdowns')
    .addSeparator()
    .addItem('7. Экспорт полного пакета import_data.json (VMS-NC)', 'exportFullCatalogJson')
    .addItem('8. Экспорт только binding_rules JSON', 'exportBindingRulesJson')
    .addToUi();
}

/**
 * Инициализация всех листов книги по стандарту GreenDecks VMS-NC
 */
function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Инициализация каталога GreenDecks',
    'Разметить все листы книги по стандарту VMS-NC? Существующие ссылки в колонке P (product_url) будут сохранены и очищены от рекламных хвостов.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  // 1. Лист Инструкции
  const sheetGuide = getOrCreateSheet(ss, '0. Инструкция');
  setupGuideSheet(sheetGuide);

  // 2. Лист 1: Доски
  setupBoardsSheet();

  // 3. Листы 2–6: Комплектующие (Ступени, Уголки, Универсальная доска, Лаги, Кляймеры)
  setupAllComponentSheets();

  // 4. Лист 7: Связи калькулятора
  const sheetPipeline = getPipelineSheet(ss);
  setupPipelineSheet(sheetPipeline);

  // Удаляем дефолтный пустой Sheet1 / Лист1, если он остался
  const defaultSheet = ss.getSheetByName('Лист1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 7) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Переходим на Лист 1
  const boardsSheet = getBoardsSheet(ss);
  ss.setActiveSheet(boardsSheet);
  ss.toast('Все листы книги GreenDecks успешно инициализированы.', 'Готово', 4);
}

/**
 * Оформление листа «0. Инструкция»
 */
function setupGuideSheet(sheet) {
  sheet.clear();

  const content = [
    ['ИНСТРУКЦИЯ ПО РАБОТЕ С КАТАЛОГОМ GREENDECKS (VMS-NC)', ''],
    ['1. Вставка ссылок на доски', 'Откройте лист "1. Доски" и вставьте URL карточек досок в колонку P (product_url).'],
    ['2. Вставка ссылок на комплектующие', 'Откройте листы 2–6 и внесите соответствующие ссылки в колонку P (product_url):\n• Лист 2: Ступени (окантовка горизонтального периметра доской с носиком)\n• Лист 3: Уголки и декор (альтернативная окантовка горизонтального периметра уголком)\n• Лист 4: Универсальная доска (зашивка цоколя / вертикальных торцов без пазов)\n• Лист 5: Лаги монтажные (подконструкция)\n• Лист 6: Кляймеры и крепеж (стартовые/рядовые кляймеры и саморезы)'],
    ['3. Сбор параметров и цен', 'В меню "Каталог GreenDecks" нажмите:\n• "2. Спарсить Доски" — развернет каждую доску в торговые предложения (SKU) по цветам с индивидуальными фото из слайдера и ценами в KZT;\n• "3. Спарсить все Комплектующие" — заполнит характеристики, цвета и цены комплектующих со слайдеров.'],
    ['4. Построение матрицы связей', 'В меню нажмите "5. Сгенерировать матрицу связей калькулятора". Скрипт автоматически сопоставит каждую доску с подходящей лагой, кляймерами, уголком, доской зашивки и ступенями по бренду и цвету.'],
    ['5. Корректировка связей', 'На листе "7. Связи калькулятора" при необходимости можно скорректировать любой связанный товар через выпадающие списки.'],
    ['6. Экспорт в VMS-NC', 'В меню нажмите "7. Экспорт полного пакета import_data.json". Скопируйте сформированный JSON в файл import/import_data.json вашего репозитория платформы VMS.'],
    ['', ''],
    ['ТИП ТОВАРА VMS-NC', 'НАЗНАЧЕНИЕ В КАЛЬКУЛЯТОРЕ (СЛОТ ПАЙПЛАЙНА pl_terrace)'],
    ['type_terraceBoard', 'Террасная доска (корневой товар конфигуратора)'],
    ['type_joist', 'Монтажная лага (слот joist)'],
    ['type_brackets', 'Стартовый и рядовой кляймеры (слоты startClip, baseClip, скалярный параметр holes)'],
    ['type_fasteners', 'Саморез для вертикальной зашивки универсальной доски (слот fixing)'],
    ['type_decorProducts', 'Уголок декоративный для окантовки периметра (слот corner)'],
    ['type_board', 'Универсальная доска для вертикальной зашивки цоколя (слот universalBoards)'],
    ['type_stepBoard', 'Ступени для окантовки горизонтального периметра (слот stepBoards, скаляр noseSize)']
  ];

  sheet.getRange(1, 1, content.length, 2).setValues(content);
  sheet.getRange('A1:B1').merge().setBackground('#273007').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange('A9:B9').setBackground('#F1F5F9').setFontWeight('bold');
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 680);
}