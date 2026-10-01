/**
 * Menu.js — Главное меню и инициализация книги каталога OliverDeck для VMS-NC
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Каталог OliverDeck')
    .addItem('0. Настроить мастер-лист "Входные ссылки"', 'setupInboxLinksSheet')
    .addItem('0.1 Распределить ссылки по листам категорий', 'distributeInboxLinksToSheets')
    .addSeparator()
    .addItem('1. Пересоздать и упорядочить все листы каталога', 'setupAllSheets')
    .addSeparator()
    .addItem('2. Спарсить Доски со всеми цветами и ценами (Лист 1)', 'parseBoardsToFullCatalog')
    .addItem('3. Спарсить все Комплектующие и Основание (Листы 2–8)', 'parseAllComponentSheets')
    .addItem('4. Спарсить только текущий открытый лист комплектующих', 'parseActiveComponentSheet')
    .addSeparator()
    .addItem('5. Сгенерировать матрицу связей калькулятора (Лист 9)', 'autoGenerateRelationsFromSheets')
    .addItem('6. Синхронизировать выпадающие списки связей', 'syncDropdowns')
    .addSeparator()
    .addItem('7. Экспорт полного пакета import_data.json (VMS-NC)', 'exportFullCatalogJson')
    .addItem('8. Экспорт только binding_rules JSON', 'exportBindingRulesJson')
    .addToUi();
}

/**
 * Инициализация и упорядочивание всех листов книги по стандарту GreenDecks VMS-NC
 */
function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Инициализация каталога OliverDeck',
    'Развернуть каноническую структуру книги? Все ваши ссылки на листах будут сохранены, устаревшие дубли листов будут удалены, а вкладки выстроены по порядку.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  // 1. Настройка Мастер-листа входящих ссылок
  setupInboxLinksSheet();

  // 2. Лист Инструкции
  const sheetGuide = getOrCreateSheet(ss, '0. Инструкция');
  setupGuideSheet(sheetGuide);

  // 3. Лист 1: Доски
  setupBoardsSheet();

  // 4. Листы 2–8: Комплектующие и Основание (Ступени, Уголки, Зашивка, Лаги, Крепеж, Опоры, Каркас)
  setupAllComponentSheets();

  // 5. Лист 9: Связи калькулятора
  const sheetPipeline = getPipelineSheet(ss);
  setupPipelineSheet(sheetPipeline);

  // 6. Удаление устаревших листов от прошлых версий
  const obsoleteNames = [
    'Лист1',
    'Sheet1',
    '1. Доски (Входные ссылки)',
    '2. Обнаруженные комплектующие',
    '3. Каталог товаров и SKU',
    '4. Связи калькулятора',
    '4. Доска обрамления' // заменена на "4. Универсальная доска (зашивка)"
  ];

  obsoleteNames.forEach(name => {
    const oldSheet = ss.getSheetByName(name);
    // Удаляем только если это не единственный лист и существует канонический аналог
    if (oldSheet && ss.getSheets().length > 8) {
      try { ss.deleteSheet(oldSheet); } catch (e) {}
    }
  });

  // 7. Упорядочивание вкладок в строгой логической последовательности
  const canonicalOrder = [
    'Входные ссылки',
    '0. Инструкция',
    '1. Доски',
    '2. Ступени',
    '3. Уголки и декор',
    '4. Универсальная доска (зашивка)',
    '5. Лаги',
    '6. Кляймеры и крепеж',
    '7. Регулируемые опоры',
    '8. Каркас и балки',
    '9. Связи калькулятора'
  ];

  canonicalOrder.forEach((sheetName, index) => {
    const target = ss.getSheetByName(sheetName);
    if (target) {
      try {
        target.activate();
        ss.moveActiveSheet(index + 1);
      } catch (e) {}
    }
  });

  // Переходим на мастер-лист «Входные ссылки»
  const inboxSheet = getInboxSheet(ss);
  ss.setActiveSheet(inboxSheet);
  ss.toast('Каталог OliverDeck приведен к эталонной структуре.', 'Готово', 4);
}

/**
 * Оформление листа «0. Инструкция»
 */
function setupGuideSheet(sheet) {
  sheet.clear();

  const content = [
    ['ИНСТРУКЦИЯ ПО РАБОТЕ С КАТАЛОГОМ OLIVERDECK (VMS-NC)', ''],
    ['1. Единый ввод ссылок', 'Откройте лист "Входные ссылки". Внесите все ссылки на товары в колонку B и выберите категорию в колонке A из выпадающего списка.'],
    ['2. Авто-распределение', 'В меню нажмите "0.1 Распределить ссылки по листам категорий". Скрипт очистит URL от мусорных меток (?srsltid=...), проверит на дубликаты и автоматически разложит ссылки по целевым листам 1–6 со статусом "В очереди".'],
    ['3. Сбор параметров и цен', 'В меню нажмите:\n• "2. Спарсить Доски" — развернет каждую доску в торговые предложения (SKU) по цветам с индивидуальными фото и ценами в RUB;\n• "3. Спарсить все Комплектующие" — заполнит характеристики, цвета и цены комплектующих, регулируемых опор и балок.'],
    ['4. Построение матрицы связей', 'В меню нажмите "5. Сгенерировать матрицу связей калькулятора". Скрипт автоматически сопоставит каждую доску с подходящей лагой, кляймерами, уголком, доской вертикальной зашивки и ступенями по бренду и цвету.'],
    ['5. Корректировка связей', 'На листе "9. Связи калькулятора" при необходимости можно скорректировать любой связанный товар через выпадающие списки.'],
    ['6. Экспорт в VMS-NC', 'В меню нажмите "7. Экспорт полного пакета import_data.json". Скопируйте сформированный JSON в файл import/import_data.json вашего репозитория платформы VMS.'],
    ['', ''],
    ['ТИП ТОВАРА VMS-NC', 'НАЗНАЧЕНИЕ В КАЛЬКУЛЯТОРЕ (СЛОТ ПАЙПЛАЙНА pl_terrace)'],
    ['type_terraceBoard', 'Террасная доска (корневой товар конфигуратора)'],
    ['type_joist', 'Монтажная лага (слот joist)'],
    ['type_brackets', 'Стартовый и рядовой кляймеры (слоты startClip, baseClip, скалярный параметр holes)'],
    ['type_fasteners', 'Саморез для вертикальной зашивки универсальной доски (слот fixing)'],
    ['type_decorProducts', 'Уголок декоративный для окантовки периметра (слот corner)'],
    ['type_board', 'Универсальная доска для вертикальной зашивки цоколя (слот universalBoards)'],
    ['type_stepBoard', 'Ступени для окантовки горизонтального периметра доской с носиком (слот stepBoards, скаляр noseSize)'],
    ['type_adjustable_pedestal', 'Регулируемые винтовые опоры Level/Kronex (подсистема Бетон/Опоры)'],
    ['type_foundation_beam', 'Балки обвязки и силовой металлокаркас 80х80х3, 40х40х2 (подсистемы Земля/Сваи и Бетон/Арматура)'],
    ['type_screw_pile', 'Винтовые сваи СВС-76/89/108 мм (подсистема Земля/Сваи)']
  ];

  sheet.getRange(1, 1, content.length, 2).setValues(content);
  sheet.getRange('A1:B1').merge().setBackground('#273007').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange('A9:B9').setBackground('#F1F5F9').setFontWeight('bold');
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 680);
}