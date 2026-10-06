/**
 * exporter/PipelineSchemas.js — Определение схем пайплайнов pl_terrace и pl_joist
 */

function getTerracePipelineDefinition() {
  return {
    external_code: "pl_terrace",
    code: "pl_terrace",
    slug: "terrace",
    name: {
      ru: "Конфигуратор террасного настила (ДПК) — OliverDeck",
      en: "Terrace Decking Configurator — OliverDeck"
    },
    is_active: true,
    sort_order: 10,
    ui_state: [],
    schema: {
      terraceBoard: {
        startClip: {
          label_key: { ru: "Стартовый кляймер", en: "Start Clip" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        baseClip: {
          label_key: { ru: "Рядовой кляймер", en: "Base Clip" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        corner: {
          label_key: { ru: "Уголок декоративный (периметр)", en: "Decorative Corner" },
          target_type: "product_type",
          target_code: "decorProducts",
          is_required: false,
          is_multiple: false
        },
        universalBoards: {
          label_key: { ru: "Универсальная доска (зашивка)", en: "Universal Board" },
          target_type: "product_type",
          target_code: "board",
          is_required: false,
          is_multiple: false
        },
        stepBoards: {
          label_key: { ru: "Ступени (периметр)", en: "Step Boards" },
          target_type: "product_type",
          target_code: "stepBoard",
          is_required: false,
          is_multiple: true
        }
      },
      board: {
        fixing: {
          label_key: { ru: "Крепление доски (саморез)", en: "Board Fastener" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      },
      stepBoard: {
        noseSize: {
          label_key: { ru: "Размер носика", en: "Nose Size" },
          target_type: "scalar",
          target_code: null,
          is_required: true,
          is_multiple: false
        }
      },
      brackets: {
        holes: {
          label_key: { ru: "Количество отверстий", en: "Holes" },
          target_type: "scalar",
          target_code: null,
          is_required: true,
          is_multiple: false
        }
      }
    }
  };
}

/**
 * Определение пайплайна pl_fence — Конфигуратор систем ограждений (ДПК)
 * Строго по Архитектурной диаграмме 1 и FencePipelineSchema
 */
function getFencePipelineDefinition() {
  return {
    external_code: "pl_fence",
    code: "pl_fence",
    slug: "fence",
    name: {
      ru: "Конфигуратор систем ограждений (ДПК)",
      en: "Fencing and Railing Configurator"
    },
    is_active: true,
    sort_order: 20,
    ui_state: [],
    schema: {
      pillar: {
        baluster: {
          label_key: { ru: "Балясина", en: "Baluster" },
          target_type: "product_type",
          target_code: "baluster",
          is_required: true,
          is_multiple: false
        },
        bracket: {
          label_key: { ru: "Кронштейн (для крепления столба)", en: "Pillar Bracket" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        bracketFastener: {
          label_key: { ru: "Саморез кронштейна", en: "Bracket Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        },
        fenceProfile: {
          label_key: { ru: "Заборный профиль", en: "Fence Profile" },
          target_type: "product_type",
          target_code: "fenceProfile",
          is_required: false,
          is_multiple: false
        },
        accessories: {
          label_key: { ru: "Аксессуары (для столба юбки, крышки, фонари и т.п.)", en: "Pillar Accessories" },
          target_type: "product_type",
          target_code: "accessories",
          is_required: false,
          is_multiple: true
        }
      },
      baluster: {
        rail: {
          label_key: { ru: "Перила", en: "Railing" },
          target_type: "product_type",
          target_code: "rail",
          is_required: true,
          is_multiple: false
        },
        bracket: {
          label_key: { ru: "Кронштейн (для крепления балясин)", en: "Baluster Bracket" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        bracketFastener: {
          label_key: { ru: "Саморез кронштейна", en: "Bracket Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      },
      rail: {
        bracket: {
          label_key: { ru: "Кронштейн перил (для крепления перил)", en: "Rail Bracket" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        bracketFastener: {
          label_key: { ru: "Саморез для кронштейна", en: "Bracket Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      },
      fenceProfile: {
        bracket: {
          label_key: { ru: "Уголок (для крепления заборного профиля)", en: "Profile Bracket" },
          target_type: "product_type",
          target_code: "brackets",
          is_required: true,
          is_multiple: false
        },
        bracketFastener: {
          label_key: { ru: "Саморезы для уголка", en: "Bracket Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        },
        lath: {
          label_key: { ru: "Рейка (для типов ограждения \"Сетка 1\" и \"Сетка 2\")", en: "Lath" },
          target_type: "product_type",
          target_code: "lath",
          is_required: false,
          is_multiple: false
        },
        lathFastener: {
          label_key: { ru: "Саморез для рейки (крепление рейки к заборному профилю)", en: "Lath to Profile Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: false,
          is_multiple: false
        }
      },
      lath: {
        lathFastener: {
          label_key: { ru: "Саморез для рейки (крепление реек между собой)", en: "Lath to Lath Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      },
      brackets: {
        holes: {
          label_key: { ru: "Количество отверстий", en: "Holes" },
          target_type: "scalar",
          target_code: null,
          is_required: true,
          is_multiple: false
        }
      }
    }
  };
}

function getJoistPipelineDefinition() {
  return {
    external_code: "pl_joist",
    code: "pl_joist",
    slug: "joist",
    name: {
      ru: "Конфигуратор подсистемы и лаг (ДПК / Алюминий)",
      en: "Substructure and Joist Configurator"
    },
    is_active: true,
    sort_order: 30,
    ui_state: [],
    schema: {
      joist: {
        fixing: {
          label_key: { ru: "Крепление лаги (саморез)", en: "Joist Screw" },
          target_type: "product_type",
          target_code: "fasteners",
          is_required: true,
          is_multiple: false
        }
      }
    }
  };
}