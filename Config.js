const CATALOG_JSON = {
  "families": [
    {"external_code": "fam_stone", "code": "stone", "name": {"ru": "Искусственный камень", "en": "Artificial stone"}},
    {"external_code": "fam_sink", "code": "sink", "name": {"ru": "Кухонные мойки", "en": "Kitchen sinks"}},
    {"external_code": "fam_faucet", "code": "faucet", "name": {"ru": "Смесители и дозаторы", "en": "Mixers and dispensers"}},
    {"external_code": "fam_bowl", "code": "bowl", "name": {"ru": "Раковины для ванной", "en": "Bathroom sinks"}},
    {"external_code": "fam_accessory", "code": "accessory", "name": {"ru": "Комплектующие и бортики", "en": "Accessories and sides"}},
    {"external_code": "fam_natural_stone", "code": "natural-stone", "name": {"ru": "Натуральный камень", "en": ""}}
  ],
  "types": [
    {
      "external_code": "type_acrylic_stone", "family_external_code": "fam_stone", "code": "acrylic_stone", "name": {"ru": "Акриловый камень", "en": "Acrylic stone"},
      "attached_attributes": [
        {"code": "supplier_article", "is_variant_only": true}, {"code": "effect_akril", "is_variant_only": false},
        {"code": "is_bend", "is_variant_only": false}, {"code": "texture", "is_variant_only": false},
        {"code": "inclusions_akril", "is_variant_only": false}, {"code": "brand", "is_variant_only": false},
        {"code": "color", "is_variant_only": true}, {"code": "collection", "is_variant_only": false},
        {"code": "length", "is_variant_only": false}, {"code": "width", "is_variant_only": false},
        {"code": "height", "is_variant_only": false}, {"code": "cutting_groups", "is_variant_only": false}
      ]
    },
    {
      "external_code": "type_quartz_stone", "family_external_code": "fam_stone", "code": "quartz_stone", "name": {"ru": "Кварцевый агломерат", "en": "Quartz agglomerate"},
      "attached_attributes": [
        {"code": "supplier_article", "is_variant_only": true}, {"code": "texture", "is_variant_only": false},
        {"code": "polishing_quartz", "is_variant_only": false}, {"code": "brand", "is_variant_only": false},
        {"code": "color", "is_variant_only": true}, {"code": "collection", "is_variant_only": false},
        {"code": "length", "is_variant_only": false}, {"code": "width", "is_variant_only": false},
        {"code": "height", "is_variant_only": false}, {"code": "cutting_groups", "is_variant_only": false}
      ]
    },
    {
      "external_code": "type_marble_stone", "family_external_code": "fam_stone", "code": "marble_stone", "name": {"ru": "Мрамор", "en": "Marble"},
      "attached_attributes": [
        {"code": "supplier_article", "is_variant_only": true}, {"code": "texture", "is_variant_only": false},
        {"code": "polishing_quartz", "is_variant_only": false}, {"code": "brand", "is_variant_only": false},
        {"code": "color", "is_variant_only": true}, {"code": "collection", "is_variant_only": false},
        {"code": "length", "is_variant_only": false}, {"code": "width", "is_variant_only": false},
        {"code": "height", "is_variant_only": false}, {"code": "cutting_groups", "is_variant_only": false}
      ]
    },
    {
      "external_code": "type_terrazzo_stone", "family_external_code": "fam_stone", "code": "terrazzo_stone", "name": {"ru": "Терраццо", "en": "Terrazzo"},
      "attached_attributes": [
        {"code": "color", "is_variant_only": true}, {"code": "supplier_article", "is_variant_only": true},
        {"code": "cutting_groups", "is_variant_only": false}, {"code": "texture", "is_variant_only": false}, {"code": "collection", "is_variant_only": false},
        {"code": "polishing_quartz", "is_variant_only": false}, {"code": "length", "is_variant_only": false}, {"code": "width", "is_variant_only": false},
        {"code": "height", "is_variant_only": false}, {"code": "cutting_groups", "is_variant_only": false}
      ]
    },
    {
      "external_code": "type_volcanic_stone", "family_external_code": "fam_stone", "code": "volcanic_stone", "name": {"ru": "Вулканический камень", "en": "Volcanic stone"},
      "attached_attributes": [
        {"code": "color", "is_variant_only": true}, {"code": "supplier_article", "is_variant_only": true},
        {"code": "cutting_groups", "is_variant_only": false}, {"code": "texture", "is_variant_only": false}, {"code": "collection", "is_variant_only": false},
        {"code": "polishing_quartz", "is_variant_only": false}, {"code": "length", "is_variant_only": false}, {"code": "width", "is_variant_only": false},
        {"code": "height", "is_variant_only": false}, {"code": "cutting_groups", "is_variant_only": false}
      ]
    },
    {
      "external_code": "type_kitchen_sink", "family_external_code": "fam_sink", "code": "kitchen_sink", "name": {"ru": "Кухонная мойка", "en": "Kitchen sink"},
      "attached_attributes": [
        {"code": "supplier_article", "is_variant_only": true}, {"code": "brand", "is_variant_only": false},
        {"code": "set_sink", "is_variant_only": false}, {"code": "material", "is_variant_only": false},
        {"code": "steel_thickness_sink", "is_variant_only": false}, {"code": "min_cab_width", "is_variant_only": false},
        {"code": "color", "is_variant_only": true}, {"code": "size_inner_sink", "is_variant_only": false}
      ]
    },
    {
      "external_code": "type_faucet", "family_external_code": "fam_faucet", "code": "faucet", "name": {"ru": "Смеситель", "en": "Mixer"},
      "attached_attributes": [
        {"code": "supplier_article", "is_variant_only": true}, {"code": "brand", "is_variant_only": false},
        {"code": "features_faucet", "is_variant_only": false}, {"code": "type_faucet", "is_variant_only": false},
        {"code": "color", "is_variant_only": true}
      ]
    },
    {
      "external_code": "type_dispenser", "family_external_code": "fam_faucet", "code": "dispenser", "name": {"ru": "Дозатор", "en": "Dispenser"},
      "attached_attributes": [
        {"code": "supplier_article", "is_variant_only": true}, {"code": "brand", "is_variant_only": false},
        {"code": "type_faucet", "is_variant_only": false}, {"code": "color", "is_variant_only": true}
      ]
    },
    {
      "external_code": "type_bathroom_sink", "family_external_code": "fam_bowl", "code": "bathroom_sink", "name": {"ru": "Раковина для ванной", "en": "Bathroom sink"},
      "attached_attributes": [
        {"code": "supplier_article", "is_variant_only": true}, {"code": "brand", "is_variant_only": false},
        {"code": "set_sink", "is_variant_only": false}, {"code": "material", "is_variant_only": false},
        {"code": "color", "is_variant_only": true}, {"code": "size_inner_sink", "is_variant_only": false}
      ]
    },
    {
      "external_code": "type_edge", "family_external_code": "fam_accessory", "code": "edge", "name": {"ru": "Кромка (п.м.)", "en": "Edge (rm)"},
      "attached_attributes": [ {"code": "supplier_article", "is_variant_only": true}, {"code": "color", "is_variant_only": true} ]
    },
    {
      "external_code": "type_skirting", "family_external_code": "fam_accessory", "code": "skirting", "name": {"ru": "Бортик (п.м.)", "en": "Side (p.m.)"},
      "attached_attributes": [ {"code": "supplier_article", "is_variant_only": true}, {"code": "color", "is_variant_only": true} ]
    }
  ],
  "categories": [
    {"external_code": "artificial-stone", "parent_external_code": null, "slug": "artificial-stone", "name": {"ru": "Искусственный камень", "en": "Artificial stone"}},
    {"external_code": "sinks", "parent_external_code": null, "slug": "sinks", "name": {"ru": "Мойки и раковины", "en": "Sinks and sinks"}},
    {"external_code": "faucets-and-dispensers", "parent_external_code": null, "slug": "faucets-and-dispensers", "name": {"ru": "Смесители и дозаторы", "en": "Mixers and dispensers"}},
    {"external_code": "edges-and-sides", "parent_external_code": null, "slug": "edges-and-sides", "name": {"ru": "Кромки и бортики", "en": "Edges and sides"}},
    {"external_code": "acrylic", "parent_external_code": "artificial-stone", "slug": "acrylic", "name": {"ru": "Акриловый камень", "en": "Acrylic stone"}},
    {"external_code": "quartz", "parent_external_code": "artificial-stone", "slug": "quartz", "name": {"ru": "Кварцевый агломерат", "en": "Quartz agglomerate"}},
    {"external_code": "kitchen-sinks", "parent_external_code": "sinks", "slug": "kitchen-sinks", "name": {"ru": "Мойки для кухни", "en": "Kitchen sinks"}},
    {"external_code": "bathroom-sinks", "parent_external_code": "sinks", "slug": "bathroom-sinks", "name": {"ru": "Раковины для ванной", "en": "Bathroom sinks"}},
    {"external_code": "faucets", "parent_external_code": "faucets-and-dispensers", "slug": "faucets", "name": {"ru": "Смесители", "en": "Faucets"}},
    {"external_code": "dispensers", "parent_external_code": "faucets-and-dispensers", "slug": "dispensers", "name": {"ru": "Дозаторы", "en": "Dispensers"}},
    {"external_code": "sides", "parent_external_code": "edges-and-sides", "slug": "sides", "name": {"ru": "Бортики", "en": "Sides"}},
    {"external_code": "leading-edges", "parent_external_code": "edges-and-sides", "slug": "leading-edges", "name": {"ru": "Передние кромки", "en": "Leading edges"}}
  ],
  "price_groups": [],
  "complex_dictionaries": [
    {
      "code": "cutting_groups", "name": {"ru": "Группы раскроя", "en": "Cutting groups"},
      "records": [
        {"external_code": "rec_cutting_groups_1", "slug": "1", "name": {"ru": "Раскрой: Раздельный | Шов: Разрешен"}, "meta": {"rotate": true, "cut": true}},
        {"external_code": "rec_cutting_groups_2", "slug": "2", "name": {"ru": "Раскрой: Совместный | Шов: Разрешен"}, "meta": {"rotate": true, "cut": false}},
        {"external_code": "rec_cutting_groups_3", "slug": "3", "name": {"ru": "Раскрой: Раздельный | Шов: Запрещен"}, "meta": {"rotate": false, "cut": true}},
        {"external_code": "rec_cutting_groups_4", "slug": "4", "name": {"ru": "Раскрой: Совместный | Шов: Запрещен"}, "meta": {"rotate": false, "cut": false}}
      ]
    }
  ],
  "attributes": [
    {
      "code": "supplier_article", "type": "string", "name": {"ru": "Артикул поставщика", "en": "Supplier article"}, "is_multiple": false, "options": []
    },
    {
      "code": "effect_akril", "type": "dictionary", "name": {"ru": "Эффект", "en": "Effect"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_effect_akril_no_effects", "slug": "no_effects", "value": {"ru": "Без эффектов", "en": "No effects"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_effect_akril_sequins_effects", "slug": "sequins_effects", "value": {"ru": "С блестками", "en": "With glitter"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_effect_akril_light-permeable_effects", "slug": "light-permeable_effects", "value": {"ru": "Светопроницаемые", "en": "Translucent"}, "meta": {"hex": null, "image": null}}
      ]
    },
    { "code": "is_bend", "type": "boolean", "name": {"ru": "Термоформинг", "en": "Thermoforming"}, "is_multiple": false, "options": [] },
    {
      "code": "texture", "type": "dictionary", "name": {"ru": "Текстура", "en": "Texture"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_texture_solid_texture", "slug": "solid_texture", "value": {"ru": "Однотонные", "en": "Plain"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_texture_monochrome_texture", "slug": "monochrome_texture", "value": {"ru": "Однородные вкрапления", "en": "Homogeneous inclusions"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_texture_marble_texture", "slug": "marble_texture", "value": {"ru": "Под мрамор", "en": "Marbled"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_texture_wood_texture", "slug": "wood_texture", "value": {"ru": "Под дерево", "en": "Under the tree"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_texture_concrete_texture", "slug": "concrete_texture", "value": {"ru": "Под бетон", "en": "Under concrete"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_texture_loft_style_texture", "slug": "loft_style_texture", "value": {"ru": "В стиле лофт", "en": "Loft style"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_texture_travertine_texture", "slug": "travertine_texture", "value": {"ru": "Под травертин", "en": "Under travertine"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_texture_onyx_texture", "slug": "onyx_texture", "value": {"ru": "Под оникс", "en": "Under onyx"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "inclusions_akril", "type": "dictionary", "name": {"ru": "Вкрапления", "en": "Interspersed"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_inclusions_akril_without_inclusions", "slug": "without_inclusions", "value": {"ru": "Без вкраплений", "en": "No inclusions"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_inclusions_akril_small_inclusions", "slug": "small_inclusions", "value": {"ru": "Мелкие вкрапления", "en": "Small inclusions"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_inclusions_akril_medium_inclusions", "slug": "medium_inclusions", "value": {"ru": "Средние вкрапления", "en": "Medium inclusions"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_inclusions_akril_large_inclusions", "slug": "large_inclusions", "value": {"ru": "Крупные вкрапления", "en": "Large inclusions"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "marketing_tags", "type": "dictionary", "name": {"ru": "Теги", "en": "Tags"}, "is_multiple": true,
      "options": [
        {"external_code": "opt_marketing_tags_new", "slug": "new", "value": {"ru": "new", "en": "new"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_marketing_tags_hit", "slug": "hit", "value": {"ru": "хит", "en": "hit"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_marketing_tags_sale", "slug": "sale", "value": {"ru": "sale", "en": "sale"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "polishing_quartz", "type": "dictionary", "name": {"ru": "Поверхность", "en": "Surface"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_polishing_quartz_glossy_ polishing", "slug": "glossy_ polishing", "value": {"ru": "Полированная", "en": "Polished"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_polishing_quartz_matte_ polishing", "slug": "matte_ polishing", "value": {"ru": "Матовая", "en": "Matte"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_polishing_quartz_textured_ polishing", "slug": "textured_ polishing", "value": {"ru": "Фактурная", "en": "Фактурная"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "brand", "type": "dictionary", "name": {"ru": "Производитель", "en": "Manufacturer"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_brand_omoikiri_brand", "slug": "omoikiri_brand", "value": {"ru": "Omoikiri", "en": "Omoikiri"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_brand_akrilika_brand", "slug": "akrilika_brand", "value": {"ru": "Akrilika", "en": "Akrilika"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_brand_grandex_brand", "slug": "grandex_brand", "value": {"ru": "Grandex", "en": "Grandex"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "set_sink", "type": "dictionary", "name": {"ru": "Тип монтажа", "en": "Installation type"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_set_sink_under_set", "slug": "under_set", "value": {"ru": "Подстольный", "en": "Podstolny"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_set_sink_above_set", "slug": "above_set", "value": {"ru": "Надстольный", "en": "Over-the-table"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "material", "type": "dictionary", "name": {"ru": "Материал", "en": "Material"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_material_stainless_steel", "slug": "stainless_steel", "value": {"ru": "Нержавеющая сталь", "en": "Stainless steel"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_material_composite", "slug": "composite", "value": {"ru": "Искусственный гранит", "en": "Artificial granite"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_material_acrylic", "slug": "acrylic", "value": {"ru": "Акрил", "en": "Acrylic"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_material_metal_bottom", "slug": "metal_bottom", "value": {"ru": "Акрил + мет.дно", "en": "Acrylic + metal bottom"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_material_ceramic", "slug": "ceramic", "value": {"ru": "Керамика", "en": "Ceramics"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "steel_thickness_sink", "type": "dictionary", "name": {"ru": "Толщина стали", "en": "Steel thickness"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_steel_thickness_sink_th-8", "slug": "th-8", "value": {"ru": "0,8 мм", "en": "0.8 mm"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_steel_thickness_sink_th-9", "slug": "th-9", "value": {"ru": "0,9 мм", "en": "0.9 mm"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_steel_thickness_sink_th-10", "slug": "th-10", "value": {"ru": "1 мм", "en": "1 mm"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_steel_thickness_sink_th-12", "slug": "th-12", "value": {"ru": "1,2 мм", "en": "1.2 mm"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "min_cab_width", "type": "dictionary", "name": {"ru": "Мин. ширина шкафа, мм", "en": "Min. cabinet width, mm"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_min_cab_width_cb_w_450", "slug": "cb_w_450", "value": {"ru": "450", "en": "450"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_300", "slug": "cb_w_300", "value": {"ru": "300", "en": "300"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_400", "slug": "cb_w_400", "value": {"ru": "400", "en": "400"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_500", "slug": "cb_w_500", "value": {"ru": "500", "en": "500"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_600", "slug": "cb_w_600", "value": {"ru": "600", "en": "600"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_800", "slug": "cb_w_800", "value": {"ru": "800", "en": "800"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_550", "slug": "cb_w_550", "value": {"ru": "550", "en": "550"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_250", "slug": "cb_w_250", "value": {"ru": "250", "en": "250"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_700", "slug": "cb_w_700", "value": {"ru": "700", "en": "700"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_900", "slug": "cb_w_900", "value": {"ru": "900", "en": "900"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_min_cab_width_cb_w_1200", "slug": "cb_w_1200", "value": {"ru": "1200", "en": "1200"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "features_faucet", "type": "dictionary", "name": {"ru": "Особенности", "en": "Peculiarities"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_features_faucet_single_lever", "slug": "single_lever", "value": {"ru": "Однорычажный", "en": "Single lever"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_features_faucet_double_lever", "slug": "double_lever", "value": {"ru": "Двухрычажный", "en": "Double wishbone"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_features_faucet_exhaust_hose", "slug": "exhaust_hose", "value": {"ru": "С вытяжным шлангом", "en": "With exhaust hose"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_features_faucet_2-in-1", "slug": "2-in-1", "value": {"ru": "2-в-1 (с фильтром)", "en": "2-in-1 (with filter)"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_features_faucet_3-in-1", "slug": "3-in-1", "value": {"ru": "3-в-1 (фильтр+лейка)", "en": "3-in-1 (filter+watering can)"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_features_faucet_window", "slug": "window", "value": {"ru": "Под окно", "en": "Under the window"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_features_faucet_shower_button", "slug": "shower_button", "value": {"ru": "Кнопка струя/душ", "en": "Jet/shower button"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "type_faucet", "type": "dictionary", "name": {"ru": "Тип продукта", "en": "Product type"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_type_faucet_faucet", "slug": "faucet", "value": {"ru": "Смеситель", "en": "Mixer"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_type_faucet_dispenser", "slug": "dispenser", "value": {"ru": "Дозатор", "en": "Dispenser"}, "meta": {"hex": null, "image": null}}
      ]
    },
    {
      "code": "color", "type": "dictionary", "name": {"ru": "Цвет", "en": "Color"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_color_beige-sa", "slug": "beige-sa", "value": {"ru": "Бежевый SA", "en": "Beige SA"}, "meta": {"hex": "#e0cfb0", "image": "/upload/uf/311/a5yf0lv9z8jst3pklz8ltl6l1xjk96iy.jpg"}},
        {"external_code": "opt_color_white-wh", "slug": "white-wh", "value": {"ru": "Белый WH", "en": "White WH"}, "meta": {"hex": "#cfc9bd", "image": "/upload/uf/1c4/gkecn6abh241kdi7tsaz1y56v7wp6o6i.jpg"}},
        {"external_code": "opt_color_white", "slug": "white", "value": {"ru": "Белый", "en": "White"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_grey", "slug": "grey", "value": {"ru": "Серый", "en": "Grey"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_black", "slug": "black", "value": {"ru": "Черный", "en": "Black"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_stainless-steel-bn", "slug": "stainless-steel-bn", "value": {"ru": "Нержавеющая сталь (BN)", "en": "Stainless Steel (BN)"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_gold-pvd", "slug": "gold-pvd", "value": {"ru": "Золото (PVD)", "en": "Gold (PVD)"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_black-pvd", "slug": "black-pvd", "value": {"ru": "Черный (PVD)", "en": "Black (PVD)"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_white-a101", "slug": "white-a101", "value": {"ru": "Белый A101", "en": "White A101"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_acrylic-without-veins", "slug": "acrylic-without-veins", "value": {"ru": "Акрил без прожилок", "en": "Acrylic without veins"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_acrylic-with-veins", "slug": "acrylic-with-veins", "value": {"ru": "Акрил с прожилками", "en": "Acrylic with veins"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_beige", "slug": "beige", "value": {"ru": "Бежевый", "en": "Beige"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_color_belyj-mramor_880", "slug": "belyj-mramor", "value": {"ru": "Белый мрамор", "en": "belyj-mramor"}, "meta": {"hex": "#FAFAFA", "image": null}},
        {"external_code": "opt_color_nerzhaveyushchaya-stalь-(bn)_977", "slug": "nerzhaveyushchaya-stalь-(bn)", "value": {"ru": "Нержавеющая сталь (BN)", "en": "nerzhaveyushchaya-stalь-(bn)"}, "meta": {"hex": "#A2A6A8", "image": null}},
        {"external_code": "opt_color_bezhevyj-sa_856", "slug": "bezhevyj-sa", "value": {"ru": "Бежевый SA", "en": "bezhevyj-sa"}, "meta": {"hex": "#E0CFB0", "image": null}},
        {"external_code": "opt_color_zoloto-(pvd)_120", "slug": "zoloto-(pvd)", "value": {"ru": "Золото (PVD)", "en": "zoloto-(pvd)"}, "meta": {"hex": "#D4B36A", "image": null}},
        {"external_code": "opt_color_belyj_308", "slug": "belyj", "value": {"ru": "Белый", "en": "belyj"}, "meta": {"hex": "#FFFFFF", "image": null}},
        {"external_code": "opt_color_chernyj_960", "slug": "chernyj", "value": {"ru": "Черный", "en": "chernyj"}, "meta": {"hex": "#1A1A1A", "image": null}}
      ]
    },
    {
      "code": "collection", "type": "dictionary", "name": {"ru": "Коллекция", "en": "Collection"}, "is_multiple": false,
      "options": [
        {"external_code": "opt_collection_solid_collection", "slug": "solid_collection", "value": {"ru": "Solid", "en": "Solid"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_intense_collection", "slug": "intense_collection", "value": {"ru": "Intense", "en": "Intense"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_pure_collection", "slug": "pure_collection", "value": {"ru": "Pure", "en": "Pure"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_sand_collection", "slug": "sand_collection", "value": {"ru": "Sand", "en": "Sand"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_design_collection", "slug": "design_collection", "value": {"ru": "Design", "en": "Design"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_architectural_collection", "slug": "architectural_collection", "value": {"ru": "Architectural", "en": "Architectural"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_jewel_collection", "slug": "jewel_collection", "value": {"ru": "Jewel", "en": "Jewel"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_e-series_collection", "slug": "e-series_collection", "value": {"ru": "E Series", "en": "E Series"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_m-series_collection", "slug": "m-series_collection", "value": {"ru": "M Series", "en": "M Series"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_c-series_collection", "slug": "c-series_collection", "value": {"ru": "C Series", "en": "C Series"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_send-pearl_collection", "slug": "send-pearl_collection", "value": {"ru": "Send&Pearl", "en": "Send&Pearl"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_granite_collection", "slug": "granite_collection", "value": {"ru": "Granite", "en": "Granite"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_lucia_collection", "slug": "lucia_collection", "value": {"ru": "Lucia", "en": "Lucia"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_marmo_collection", "slug": "marmo_collection", "value": {"ru": "Marmo", "en": "Marmo"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_calacatta_collection", "slug": "calacatta_collection", "value": {"ru": "Calacatta", "en": "Calacatta"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_terrazzo_collection", "slug": "terrazzo_collection", "value": {"ru": "Terrazzo", "en": "Terrazzo"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_volcanics_collection", "slug": "volcanics_collection", "value": {"ru": "Volcanics", "en": "Volcanics"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_grandex_adventur_collection", "slug": "adventur_collection", "value": {"ru": "Adventur", "en": "Adventur"}, "meta": {"hex": null, "image": null}},
        {"external_code": "opt_collection_calisco_calisco_collection", "slug": "calisco_collection", "value": {"ru": "Calisco", "en": "Calisco"}, "meta": {"hex": null, "image": null}}
      ]
    },
    { "code": "length", "type": "numeric", "name": {"ru": "Длина", "en": "Length"}, "is_multiple": false, "options": [] },
    { "code": "width", "type": "numeric", "name": {"ru": "Ширина", "en": "Width"}, "is_multiple": false, "options": [] },
    { "code": "height", "type": "numeric", "name": {"ru": "Толщина", "en": "Thickness"}, "is_multiple": false, "options": [] },
    { "code": "size_inner_sink", "type": "string", "name": {"ru": "Размер (внутренний)", "en": "Inner Size"}, "is_multiple": false, "options": [] },
    {
      "code": "cutting_groups", "type": "complex_reference", "name": {"ru": "Группа раскроя", "en": "Cutting Group"}, "is_multiple": false, "options": []
    }
  ],
  "products": [] 
};

/**
 * Динамический генератор структуры листов. Настраивает cfg_types в виде удобной матрицы чекбоксов.
 */
function getConfigDefs() {
  const attrCodes = [];
  if (CATALOG_JSON.attributes) {
    CATALOG_JSON.attributes.forEach(a => { 
      if (a.code && a.code !== 'price_group' && !attrCodes.includes(a.code)) {
        attrCodes.push(a.code); 
      }
    });
  }
  if (CATALOG_JSON.complex_dictionaries) {
    CATALOG_JSON.complex_dictionaries.forEach(cd => { 
      if (cd.code && cd.code !== 'price_group' && !attrCodes.includes(cd.code)) {
        attrCodes.push(cd.code); 
      }
    });
  }

  const cfgTypesHeader = ['code', 'family_code', 'name_ru', 'name_en'].concat(attrCodes);
  const cfgTypesRows = [cfgTypesHeader];

  if (CATALOG_JSON.types) {
    CATALOG_JSON.types.forEach(t => {
      let familyCode = t.family_external_code || '';
      if (familyCode.startsWith('fam_')) {
          familyCode = familyCode.replace('fam_', '');
      }

      const row = [
        t.code || '', 
        familyCode, 
        t.name?.ru || '', 
        t.name?.en || ''
      ];

      const attached = (t.attached_attributes || []).map(a => a.code);
      attrCodes.forEach(code => {
        row.push(attached.includes(code));
      });

      cfgTypesRows.push(row);
    });
  }

  const baseFields = [
    'base_ext_code', 'base_name', 'base_slug', 'base_category', 
    'base_image', 'sku_code', 'sku_image', 'sku_cost', 
    'sku_currency', 'sku_default', 'sku_stock', 'sku_manual', 'price_group'
  ];
  
  const defaultMeta = {
    'base_ext_code': { name: 'Внешний код', desc: 'Уникальный внешний идентификатор базового товара. Заполняется один раз на товар.' },
    'base_name': { name: 'Название товара', desc: 'Полноценное название товара. Заполняется один раз на товар.' },
    'base_slug': { name: 'ЧПУ (Slug)', desc: 'Адрес страницы товара на сайте (URL). Заполняется один раз на товар.' },
    'base_category': { name: 'Категория', desc: 'Раздел каталога, в который будет помещен товар. Выбирается из списка.' },
    'base_image': { name: 'Картинка товара (URL)', desc: 'Основная ссылка на изображение товара.' },
    'sku_code': { name: 'Артикул модификации (SKU)', desc: 'Уникальный артикул конкретной модификации (вариации).' },
    'sku_image': { name: 'Картинка модификации (URL)', desc: 'Ссылка на изображение конкретной модификации.' },
    'sku_cost': { name: 'Себестоимость', desc: 'Стоимость закупки или базовая цена модификации.' },
    'sku_currency': { name: 'Валюта', desc: 'Валюта себестоимости (USD, RUB, BYN).' },
    'sku_default': { name: 'По умолчанию', desc: 'Указывает, является ли эта вариация основной (TRUE/FALSE).' },
    'sku_stock': { name: 'Остаток', desc: 'Доступное количество товара на складе.' },
    'sku_manual': { name: 'Ручная цена', desc: 'Включить ручное управление розничной ценой (TRUE/FALSE).' },
    'supplier_article': { name: 'Артикул поставщика', desc: 'Оригинальный артикул от завода-изготовителя.' },
    'price_group': { name: 'Ценовая категория', desc: 'Связанная финансовая категория для расчета стоимости.' },
    'cutting_groups': { name: 'Группа раскроя', desc: 'Техническая группа для раскроя и швов.' }
  };

  const cfgColOrderRows = [['column_code', 'sort_order', 'display_name', 'description']];
  
  baseFields.forEach((col, idx) => {
    const meta = defaultMeta[col] || { name: '', desc: '' };
    cfgColOrderRows.push([col, (idx + 1) * 10, meta.name, meta.desc]);
  });

  let attrIdx = 0;
  attrCodes.forEach(col => {
    let order;
    if (col === 'supplier_article') {
      order = 25;
    } else {
      order = 130 + (attrIdx * 10);
      attrIdx++;
    }
    const meta = defaultMeta[col] || { name: '', desc: '' };
    cfgColOrderRows.push([col, order, meta.name, meta.desc]);
  });

  const defs = {
    "cfg_families": [
      ['code', 'external_code', 'name_ru', 'name_en', 'meta_schema']
    ],
    "cfg_categories": [
      ['external_code', 'parent_external_code', 'slug', 'name_ru', 'name_en']
    ],
    "cfg_types": cfgTypesRows,
    "cfg_column_order": cfgColOrderRows,
    "cfg_attributes": [
      ['code', 'name_ru', 'name_en', 'type', 'is_multiple', 'is_variant_only']
    ],
    "cfg_options": [
      ['attribute_code', 'external_code', 'slug', 'value_ru', 'value_en', 'hex', 'image']
    ],
    "cfg_price_groups": [
      ['family_code', 'external_code', 'slug', 'name_ru', 'name_en', 'purchase_cost', 'purchase_currency', 'markup_retail', 'markup_dealer']
    ],
    "cfg_complex_dicts": [
      ['dict_code', 'external_code', 'slug', 'name_ru', 'name_en', 'cost_price', 'markup', 'k1', 'v1', 'k2', 'v2', 'k3', 'v3']
    ]
  };

  if (CATALOG_JSON.price_groups) {
    CATALOG_JSON.price_groups.forEach(pg => {
      let familyCode = pg.product_family_external_code || '';
      if (familyCode.startsWith('fam_')) {
          familyCode = familyCode.replace('fam_', '');
      }
      defs.cfg_price_groups.push([
        familyCode,
        pg.external_code || '',
        pg.slug || '',
        pg.name?.ru || '',
        pg.name?.en || '',
        pg.meta?.purchase_cost || 0,
        pg.meta?.purchase_currency || 'USD',
        pg.meta?.markup_retail || 0,
        pg.meta?.markup_dealer || 0
      ]);
    });
  }

  if (CATALOG_JSON.families) {
    CATALOG_JSON.families.forEach(f => {
      const metaSchemaStr = f.meta_schema ? JSON.stringify(f.meta_schema) : '';
      defs.cfg_families.push([
        f.code || '', 
        f.external_code || '', 
        f.name?.ru || '', 
        f.name?.en || '',
        metaSchemaStr
      ]);
    });
  }

  if (CATALOG_JSON.categories) {
    CATALOG_JSON.categories.forEach(c => {
      defs.cfg_categories.push([
        c.external_code || '', 
        c.parent_external_code || '', 
        c.slug || '', 
        c.name?.ru || '', 
        c.name?.en || ''
      ]);
    });
  }

  const variantOnlyMap = {};
  if (CATALOG_JSON.types) {
    CATALOG_JSON.types.forEach(t => {
      const attached = t.attached_attributes || [];
      attached.forEach(a => {
        if (a.is_variant_only) variantOnlyMap[a.code] = true;
      });
    });
  }

  if (CATALOG_JSON.attributes) {
    CATALOG_JSON.attributes.forEach(a => {
      if (a.code === 'price_group') return;
      
      const isVariantOnly = variantOnlyMap[a.code] ? 'TRUE' : 'FALSE';
      const isMultiple = a.is_multiple ? 'TRUE' : 'FALSE';
      
      defs.cfg_attributes.push([
        a.code || '', 
        a.name?.ru || '', 
        a.name?.en || '', 
        a.type || 'string', 
        isMultiple, 
        isVariantOnly
      ]);

      if (a.options && a.options.length > 0) {
        a.options.forEach(o => {
          defs.cfg_options.push([
            a.code,
            o.external_code || '',
            o.slug || '',
            o.value?.ru || '',
            o.value?.en || '',
            o.meta?.hex || '',
            o.meta?.image || ''
          ]);
        });
      }
    });
  }

  if (CATALOG_JSON.complex_dictionaries) {
    CATALOG_JSON.complex_dictionaries.forEach(cd => {
      if (cd.code === 'price_group') return;
      
      if (cd.records && cd.records.length > 0) {
        cd.records.forEach(rec => {
          const costPrice = rec.meta?.cost_price !== undefined ? rec.meta.cost_price : '';
          const markup = rec.meta?.cost_price_markup_retail !== undefined ? rec.meta.cost_price_markup_retail : '';
          
          const nameRu = typeof rec.name === 'object' ? (rec.name?.ru || '') : (rec.name || '');
          const nameEn = typeof rec.name === 'object' ? (rec.name?.en || '') : '';

          let k1 = '', v1 = '', k2 = '', v2 = '', k3 = '', v3 = '';
                if (cd.code === 'cutting_groups') {
                  k1 = 'rotate'; v1 = rec.meta?.rotate !== undefined ? String(rec.meta.rotate).toUpperCase() : '';
                  k2 = 'cut'; v2 = rec.meta?.cut !== undefined ? String(rec.meta.cut).toUpperCase() : '';
                } else if (cd.code === 'thicknesses') {
                  k1 = 'material_code'; v1 = rec.meta?.material_code || '';
                  k2 = 'thickness'; v2 = rec.meta?.thickness !== undefined ? String(rec.meta.thickness) : '';
                  k3 = 'coefficient'; v3 = rec.meta?.coefficient !== undefined ? String(rec.meta.coefficient) : '';
          }

          defs.cfg_complex_dicts.push([
            cd.code,
            rec.external_code || '',
            rec.slug || '',
            nameRu,
            nameEn,
            costPrice,
            markup,
            k1, v1, k2, v2
          ]);

        });
      }
    });
  }

  return defs;
}

