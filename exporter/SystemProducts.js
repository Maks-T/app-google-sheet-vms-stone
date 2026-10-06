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

  // 6. Саморезы для кронштейнов ограждения 3.5*20
  if (!productsMap.has('prod_00127')) {
    productsMap.set('prod_00127', {
      external_code: "prod_00127",
      product_type_external_code: "type_fasteners",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "samorezy-3520",
      name: { ru: "Саморезы 3,5*20 (крепление кронштейнов)", en: "Screws 3.5*20" },
      code: "00127",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Металл", length_mm: 20, product_calc_category: "es6fD7XEi4GyfO6L13Ply3" },
      variants: [{
        external_code: "00127",
        sku: "00127",
        name: { ru: "Саморезы 3,5*20", en: "Screws 3.5*20" },
        price_group_external_code: null,
        stock: 5000,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 1.15,
        currency: "RUB",
        price: 3,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 7. Кронштейн столба ДПК 100х100 (стакан усиленный)
  if (!productsMap.has('prod_bracket_pillar_100')) {
    productsMap.set('prod_bracket_pillar_100', {
      external_code: "prod_bracket_pillar_100",
      product_type_external_code: "type_brackets",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "kronstein-dlya-stolba-dpk-100",
      name: { ru: "Кронштейн для столба ДПК 100х100", en: "Pillar Bracket 100x100" },
      code: "00112",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Сталь", width_mm: 100, length_mm: 100, product_calc_category: "7-ZHjGVRi90X2pkVocJLo1" },
      variants: [{
        external_code: "00112",
        sku: "00112",
        name: { ru: "Кронштейн для столба ДПК 100х100", en: "Pillar Bracket 100x100" },
        price_group_external_code: null,
        stock: 200,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 2200,
        currency: "RUB",
        price: 3950,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 8. Крепеж перила прямой
  if (!productsMap.has('prod_bracket_rail_direct')) {
    productsMap.set('prod_bracket_rail_direct', {
      external_code: "prod_bracket_rail_direct",
      product_type_external_code: "type_brackets",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "krepezh-perila-pryamoj",
      name: { ru: "Крепеж перила прямой", en: "Rail Bracket Direct" },
      code: "00204",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Металл", width_mm: 85, height_mm: 39, length_mm: 48, product_calc_category: "7-ZHjGVRi90X2pkVocJLo1" },
      variants: [{
        external_code: "00204",
        sku: "00204",
        name: { ru: "Крепеж перила прямой", en: "Rail Bracket Direct" },
        price_group_external_code: null,
        stock: 500,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 382,
        currency: "RUB",
        price: 630,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 9. Крепеж для балясины пластиковый 40х40 / 45х45
  if (!productsMap.has('prod_bracket_baluster_plastic')) {
    productsMap.set('prod_bracket_baluster_plastic', {
      external_code: "prod_bracket_baluster_plastic",
      product_type_external_code: "type_brackets",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "krepezh-dlya-balyasiny-plastikovyj",
      name: { ru: "Крепеж для балясины пластиковый", en: "Baluster Bracket Plastic" },
      code: "00177",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "Пластик", width_mm: 40, height_mm: 30, length_mm: 40, product_calc_category: "7-ZHjGVRi90X2pkVocJLo1" },
      variants: [{
        external_code: "00177",
        sku: "00177",
        name: { ru: "Крепеж для балясины пластиковый", en: "Baluster Bracket Plastic" },
        price_group_external_code: null,
        stock: 2000,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 25,
        currency: "RUB",
        price: 42,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 10. Крышка для столба 100х100
  if (!productsMap.has('prod_cap_pillar_100')) {
    productsMap.set('prod_cap_pillar_100', {
      external_code: "prod_cap_pillar_100",
      product_type_external_code: "type_accessories",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "kryshka-dlya-stolba-100-100",
      name: { ru: "Крышка для столба 100х100 мм ДПК", en: "Pillar Cap 100x100 mm" },
      code: "00230",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "ДПК", width_mm: 120, height_mm: 43, length_mm: 120, product_calc_category: "9SyNj-0fgsfUajCqxkAEu1" },
      variants: [{
        external_code: "00230",
        sku: "00230",
        name: { ru: "Крышка для столба 100х100 мм ДПК", en: "Pillar Cap 100x100 mm" },
        price_group_external_code: null,
        stock: 300,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 477,
        currency: "RUB",
        price: 788,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }

  // 11. Юбка для столба 100х100
  if (!productsMap.has('prod_skirt_pillar_100')) {
    productsMap.set('prod_skirt_pillar_100', {
      external_code: "prod_skirt_pillar_100",
      product_type_external_code: "type_accessories",
      category_external_code: null,
      catalog_type: "product",
      unit_code: "pcs",
      slug: "yubka-dlya-stolba-100-100",
      name: { ru: "Юбка для столба 100х100 мм ДПК", en: "Pillar Skirt 100x100 mm" },
      code: "00367",
      is_active: true,
      eav: { brand: "opt_brand_oliverdeck", material: "ДПК", width_mm: 158, height_mm: 18, length_mm: 158, product_calc_category: "9SyNj-0fgsfUajCqxkAEu1" },
      variants: [{
        external_code: "00367",
        sku: "00367",
        name: { ru: "Юбка для столба 100х100 мм ДПК", en: "Pillar Skirt 100x100 mm" },
        price_group_external_code: null,
        stock: 300,
        is_default: true,
        is_manual_pricing: true,
        cost_price: 477,
        currency: "RUB",
        price: 788,
        eav: {},
        is_active: true
      }],
      preview_picture: null,
      source_url: null
    });
  }
}