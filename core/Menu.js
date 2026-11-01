/**
 * core/Menu.js — Главное меню и инициализация книги каталога OliverDeck для VMS-NC
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
    .addItem('3. Спарсить все Комплектующие, Основание и Ограждения (Листы 2–18)', 'parseAllComponentSheets')
    .addItem('4. Спарсить только текущий открытый лист комплектующих', 'parseActiveComponentSheet')
    .addSeparator()
    .addItem('5. Заполнить привязки из каталога (добавить недостающие)', 'autoFillBindingSheets')
    .addItem('5.1 Пересоздать привязки из каталога (очистить и заполнить)', 'rebuildBindingSheets')
    .addItem('5.2 Обновить лист "Настройки автопривязок"', 'setupAutoBindingSettingsSheet')
    .addItem('6. Проверить привязки и обновить выпадающие списки', 'validateBindingSheets')
    .addItem('6.1 Загрузить привязки и товары из import_data.json', 'showImportJsonDialog')
    .addSeparator()
    .addItem('7. Экспорт полного пакета import_data.json (VMS-NC)', 'exportFullCatalogJson')
    .addItem('8. Экспорт только binding_rules JSON', 'exportBindingRulesJson')
    .addItem('9. Экспорт файла настроек import_settings.json (VMS-NC)', 'exportImportSettingsJson')
    .addToUi();
}

function setupAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    'Инициализация каталога OliverDeck',
    'Развернуть каноническую структуру книги? Ссылки и ручные позиции на листах каталога сохранятся, листы привязок не очищаются, вкладки выстроятся по порядку. Старый лист "9. Связи калькулятора" больше не используется, его можно удалить вручную.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  setupInboxLinksSheet();

  const sheetGuide = getOrCreateSheet(ss, '0. Инструкция');
  setupGuideSheet(sheetGuide);

  setupBoardsSheet();
  setupAllComponentSheets();

  setupBindingSheets();
  setupAutoBindingSettingsSheet();

  const obsoleteNames = [
    'Лист1',
    'Sheet1',
    '1. Доски (Входные ссылки)',
    '2. Обнаруженные комплектующие',
    '3. Каталог товаров и SKU',
    '4. Связи калькулятора',
    '4. Доска обрамления'
  ];

  obsoleteNames.forEach(name => {
    const oldSheet = ss.getSheetByName(name);
    if (oldSheet && ss.getSheets().length > 8) {
      try { ss.deleteSheet(oldSheet); } catch (e) {}
    }
  });

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
    '10. Столбы',
    '11. Перила',
    '12. Балясины',
    '13. Заборный профиль и рейка',
    '14. Аксессуары ограждения',
    '15. Саморезы и расходники',
    '16. Сваи',
    '17. Оголовки свай',
    '18. Арматура'
  ].concat(getAllPipelineDefinitions().map(getBindingSheetName), [AUTO_SETTINGS_SHEET]);

  canonicalOrder.forEach((sheetName, index) => {
    const target = ss.getSheetByName(sheetName);
    if (target) {
      try {
        target.activate();
        ss.moveActiveSheet(index + 1);
      } catch (e) {}
    }
  });

  const inboxSheet = getInboxSheet(ss);
  ss.setActiveSheet(inboxSheet);
  ss.toast('Каталог OliverDeck приведен к эталонной структуре.', 'Готово', 4);
}

function setupGuideSheet(sheet) {
  sheet.clear();

  const content = [
    ['ИНСТРУКЦИЯ ПО РАБОТЕ С КАТАЛОГОМ OLIVERDECK (VMS-NC)', ''],
    ['1. Ввод ссылок', 'Лист "Входные ссылки": ссылка в колонке B, категория в колонке A. Меню "0.1" распределит ссылки по листам категорий со статусом "В очереди".'],
    ['2. Парсинг', 'Меню "2" — доски, "3" — все комплектующие, "4" — текущий лист. Строки без ссылки (ручные позиции) парсер не трогает.'],
    ['3. Ручные позиции', 'Саморезы, сваи, оголовки, арматуру, ЦПС, кронштейны и т.п. добавляйте строкой на лист нужного типа (15–18 или 2–14): status "Ручной", product_code, sku, name, цены. Колонка extra_eav — доп. атрибуты: diameter_mm=89; blade_diameter_mm=250; wall_thickness_mm=3.5; has_head=false.'],
    ['4. Привязки', 'Меню "5" заполнит листы "Привязки pl_terrace / pl_joist / pl_fence / pl_stairs" из каталога: для каждого товара-родителя и каждой роли схемы подбирается товар нужного типа. Порядок подбора: тот же цвет → товар без цвета → любой; при равенстве тот же бренд. Существующие строки не трогаются, добавляются только недостающие. "5.1" очищает листы и строит заново.'],
    ['4.1 Настройки подбора', 'Лист "Настройки автопривязок": для каждой роли слова в названии (include / exclude, "+" = И, "|" = ИЛИ), значение по умолчанию для скаляров (noseSize = 20) и вкл/выкл. Скаляр из товара важнее: впишите в extra_eav кронштейна holes=4, в ступень noseSize=25.'],
    ['5. Проверка', 'Меню "6" проверит каждую строку по схеме пайплайна (тип родителя, роль, тип дочернего товара), подставит названия и обновит выпадающие списки. Строки с ошибками в экспорт не попадают.'],
    ['6. Перенос из файла', 'Меню "6.1": вставьте свой import_data.json — привязки разложатся по листам пайплайнов, а товары, которых нет на листах, добавятся строками "Ручной".'],
    ['7. Экспорт в VMS-NC', 'Меню "7" — полный import_data.json, "8" — только binding_rules, "9" — import_settings.json.'],
    ['', ''],
    ['ТИП ТОВАРА VMS-NC', 'ЛИСТ КАТАЛОГА'],
    ['type_terraceBoard', '1. Доски'],
    ['type_stepBoard', '2. Ступени'],
    ['type_decorProducts', '3. Уголки и декор'],
    ['type_board', '4. Универсальная доска (зашивка)'],
    ['type_joist', '5. Лаги'],
    ['type_brackets', '6. Кляймеры и крепеж (саморезы с этого листа уходят в type_fasteners)'],
    ['type_adjustable_pedestal', '7. Регулируемые опоры (length/width/thickness = мин. высота / макс. высота / нагрузка)'],
    ['type_foundation_beam', '8. Каркас и балки'],
    ['type_pillar', '10. Столбы'],
    ['type_rail', '11. Перила'],
    ['type_baluster', '12. Балясины'],
    ['type_fenceProfile / type_lath', '13. Заборный профиль и рейка (рейка определяется по названию)'],
    ['type_accessories', '14. Аксессуары ограждения'],
    ['type_fasteners', '15. Саморезы и расходники'],
    ['type_screw_pile', '16. Сваи'],
    ['type_pile_cap', '17. Оголовки свай'],
    ['type_rebar', '18. Арматура']
  ];

  sheet.getRange(1, 1, content.length, 2).setValues(content);
  sheet.getRange('A1:B1').merge().setBackground('#273007').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange('A11:B11').setBackground('#F1F5F9').setFontWeight('bold');
  sheet.setColumnWidth(1, 260);
  sheet.setColumnWidth(2, 680);
}