/**
 * config/Config.js — Системные константы и схемы листов каталога
 */

var GDK_CONFIG = {
  CURRENCY: 'RUB',
  BASE_URL: 'https://oliverdeck.ru',

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
    'comment'
  ],

  COLUMN_NOTES: [
    'Статус: В очереди / Готов / Ошибка',
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
    'Результат и логи'
  ]
};