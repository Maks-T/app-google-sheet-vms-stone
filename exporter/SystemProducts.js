/**
 * exporter/SystemProducts.js — Системные складские позиции основания и крепежа
 */

function ensureDefaultSystemItems(productsMap) {
  // 1. Саморезы для лаг 5*120
  if (!productsMap.has('prod_00124')) {
    productsMap.set('prod_00124', {
      external_code: "prod_00124",
      product_type_external_code: "type_fasteners",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "samorez-5-120",
      name: { ru: "Саморез 5*120 (крепление лаг)", en: "Screw 5*120" },
      code: "00124",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Металл" },
      variants: [{
        external_code: "00124",
        sku: "00124",
        name: { ru: "Саморез 5*120 (крепление лаг)", en: "Screw 5*120" },
        price_group_external_code: null,
        stock: 1000,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 35,
        currency: "RUB",
        price: 60,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 2. Винтовая свая СВС-89*2000 мм
  if (!productsMap.has('prod_pile_89_2000')) {
    productsMap.set('prod_pile_89_2000', {
      external_code: "prod_pile_89_2000",
      product_type_external_code: "type_screw_pile",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "svaya-vintovaya-svs-89-2000",
      name: { ru: "Свая винтовая СВС-89х2000 мм", en: "Screw Pile 89x2000 mm" },
      code: "pile_89_2000",
      is_active: true,
      eav: {
        brand: "opt_brand_oliverdeck",
        material: "Сталь",
        diameter_mm: 89,
        width_mm: 89,
        length_mm: 2000,
        blade_diameter_mm: 250,
        wall_thickness_mm: 3.5,
        has_head: false
      },
      variants: [{
        external_code: "CBO-89-2000",
        sku: "CBO-89-2000",
        name: { ru: "Свая винтовая СВС-89х2000 мм", en: "Screw Pile 89x2000 mm" },
        price_group_external_code: null,
        stock: 500,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 1750,
        currency: "RUB",
        price: 2450,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 3. Оголовок свайный 150*150 мм
  if (!productsMap.has('prod_pile_cap_150')) {
    productsMap.set('prod_pile_cap_150', {
      external_code: "prod_pile_cap_150",
      product_type_external_code: "type_pile_cap",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "ogolovok-svajnyj-150-150",
      name: { ru: "Оголовок свайный усиленный 150х150 мм", en: "Pile Cap 150x150 mm" },
      code: "pile_cap_150",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Сталь", width_mm: 150, length_mm: 150 },
      variants: [{
        external_code: "OG-150-150",
        sku: "OG-150-150",
        name: { ru: "Оголовок свайный усиленный 150х150 мм", en: "Pile Cap 150x150 mm" },
        price_group_external_code: null,
        stock: 500,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 320,
        currency: "RUB",
        price: 450,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 4. ЦПС М-300 мешок 25 кг
  if (!productsMap.has('prod_cps_m300')) {
    productsMap.set('prod_cps_m300', {
      external_code: "prod_cps_m300",
      product_type_external_code: "type_fasteners",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "peskobeton-cps-m300-25kg",
      name: { ru: "Пескобетон ЦПС М-300 (мешок 25 кг)", en: "Dry Mix M-300 (25 kg)" },
      code: "cps_m300_25kg",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "ЦПС" },
      variants: [{
        external_code: "CPS-M300-25",
        sku: "CPS-M300-25",
        name: { ru: "Пескобетон ЦПС М-300 (мешок 25 кг)", en: "Dry Mix M-300 (25 kg)" },
        price_group_external_code: null,
        stock: 1000,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 230,
        currency: "RUB",
        price: 320,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 5. Арматура рифленая d10 мм
  if (!productsMap.has('prod_rebar_d10')) {
    productsMap.set('prod_rebar_d10', {
      external_code: "prod_rebar_d10",
      product_type_external_code: "type_rebar",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "armatura-riflenaya-a500c-d10",
      name: { ru: "Арматура рифленая А500С d10 мм (пруток)", en: "Rebar A500C d10 mm" },
      code: "rebar_d10",
      is_active: true,
      eav: {
        brand: "opt_brand_oliverdeck",
        material: "Сталь",
        diameter_mm: 10,
        width_mm: 10,
        thickness_mm: 10,
        length_mm: 6000
      },
      variants: [{
        external_code: "REBAR-D10",
        sku: "REBAR-D10",
        name: { ru: "Арматура рифленая А500С d10 мм", en: "Rebar A500C d10 mm" },
        price_group_external_code: null,
        stock: 500,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 45,
        currency: "RUB",
        price: 65,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }
}