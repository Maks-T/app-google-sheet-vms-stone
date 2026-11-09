/**
 * config/Config.js — Системные константы и схемы листов каталога
 */

var GDK_CONFIG = {
  CURRENCY: 'RUB',
  BASE_URL: 'https://oliverdeck.ru',

  // Картинки в import_data.json: 'url' → исходная ссылка (скачиваются отдельно),
  // 'local' → products/{имя}_{md5(путь)[:6]}.webp из import/export_images/products/
  IMAGES: {
    MODE: 'url',
    DIR: 'products',
    EXT: 'webp',
    // заглушки сайта, а не фото товара
    PLACEHOLDERS: ['/g/spacer.gif']
  },

  // Коды продуктовых семейств VMS-NC
  FAMILIES: {
    DECKING_SYSTEM: {
      external_code: 'fam_decking_systems',
      code: 'decking_system',
      name: { ru: 'Террасный настил', en: 'Terrace Decking Systems' }
    },
    FENCE_SYSTEM: {
      external_code: 'fam_fence_systems',
      code: 'fence_system',
      name: { ru: 'Системы ограждений', en: 'Fence and Railing Systems' }
    },
    HARDWARE_ACCESSORY: {
      external_code: 'fam_hardware_accessories',
      code: 'hardware_accessory',
      name: { ru: 'Комплектующие и крепеж', en: 'Hardware & Accessories' }
    }
  },

  // Точные коды типов товаров платформы VMS-NC
  PRODUCT_TYPES: {
    'terraceBoard': 'type_terraceBoard',
    'board': 'type_board',
    'stepBoard': 'type_stepBoard',
    'brackets': 'type_brackets',
    'fasteners': 'type_fasteners',
    'decorProducts': 'type_decorProducts',
    'joist': 'type_joist',
    'adjustable_pedestal': 'type_adjustable_pedestal',
    'foundation_beam': 'type_foundation_beam',
    'screw_pile': 'type_screw_pile',
    'pile_cap': 'type_pile_cap',
    'rebar': 'type_rebar',
    'pillar': 'type_pillar',
    'rail': 'type_rail',
    'baluster': 'type_baluster',
    'lath': 'type_lath',
    'fenceProfile': 'type_fenceProfile',
    'accessories': 'type_accessories'
  },

  // Системные UUID категорий калькулятора (из эталона import_data.json)
  CALC_CATEGORIES: {
    'terraceBoard': 'f094F3QohaIRmvFaEAmJe2',
    'board': 'DbCTg4CIhiUHCNZZ28u2Q3',
    'stepBoard': 'W3licD2wgMnrMppMVZ7Yo0',
    'brackets': '7-ZHjGVRi90X2pkVocJLo1',
    'decorProducts': '635W7TuejTCwFMGmOmgSQ2',
    'joist': '7-ZHjGVRi90X2pkVocJLo1',
    'pillar': 'kfLSCinmjwGZKK-0GYUUi3',
    'rail': '1SrmRBIcgp01VS1cRdKkz2',
    'baluster': 'zaURMDUsgbxgaXvKclKwd0',
    'fenceProfile': '03b84mRdhrNSKp99dNfTN1',
    'lath': 'wuu9Vga8iXZTzOsGwgSVN0',
    'accessories': '9SyNj-0fgsfUajCqxkAEu1'
  },

  // листы каталога: имя → тип товара
  CATALOG_SHEETS: [
    { sheetName: '1. Доски', type: 'terraceBoard', altNames: ['1. Доски (Входные ссылки)'] },
    { sheetName: '2. Ступени', type: 'stepBoard' },
    { sheetName: '3. Уголки и декор', type: 'decorProducts' },
    { sheetName: '4. Универсальная доска (зашивка)', type: 'board', altNames: ['4. Доска обрамления'] },
    { sheetName: '5. Лаги', type: 'joist' },
    { sheetName: '6. Кляймеры и крепеж', type: 'brackets' },
    { sheetName: '7. Регулируемые опоры', type: 'adjustable_pedestal' },
    { sheetName: '8. Каркас и балки', type: 'foundation_beam', altNames: ['8. Балки и сваи'] },
    { sheetName: '10. Столбы', type: 'pillar' },
    { sheetName: '11. Перила', type: 'rail' },
    { sheetName: '12. Балясины', type: 'baluster' },
    { sheetName: '13. Заборный профиль и рейка', type: 'fenceProfile' },
    { sheetName: '14. Аксессуары ограждения', type: 'accessories' },
    { sheetName: '15. Саморезы и расходники', type: 'fasteners' },
    { sheetName: '16. Сваи', type: 'screw_pile' },
    { sheetName: '17. Оголовки свай', type: 'pile_cap' },
    { sheetName: '18. Арматура', type: 'rebar' }
  ],

  STATUS_OPTIONS: ['В очереди', 'Готов', 'Ошибка', 'Ручной'],

  // Единая схема колонок для всех самодостаточных листов каталога
  SHEET_COLUMNS: [
    'status',
    'product_code',
    'sku',
    'name',
    'brand',
    'material',
    'color_name',
    'color_slug',
    'color_hex',
    'length_mm',
    'width_mm',
    'thickness_mm',
    'price_retail',
    'cost_price',
    'image_url',
    'product_url',
    'comment',
    'stock',
    'extra_eav'
  ],

  COLUMN_NOTES: [
    'Статус: В очереди / Готов / Ошибка / Ручной (позиция без ссылки, парсер её не трогает)',
    'Системный код товара (external_code: odk_...)',
    'Артикул модификации SKU',
    'Наименование товара',
    'Бренд (opt_brand_...)',
    'Материал изделия',
    'Наименование цвета',
    'Слаг цвета',
    'HEX-код цвета',
    'Длина, мм',
    'Ширина, мм',
    'Толщина, мм',
    'Розничная цена, RUB',
    'Себестоимость, RUB',
    'Ссылка на фото (CDN / оригинальное)',
    'URL страницы товара',
    'Результат и логи',
    'Остаток (stock), необязательно',
    'Доп. атрибуты EAV: diameter_mm=89; blade_diameter_mm=250; has_head=false'
  ]
};