```markdown
# OliverDeck & VMS-NC — Каталог и модуль экспорта для Google Таблиц

Проект автоматизации сбора каталога террасных систем с сайта **oliverdeck.ru** (Shop2 CMS / MegaGroup), управления связями калькулятора и формирования эталонных пакетов `import_data.json` и `import_settings.json` для платформы **VMS-NC** (Nicole Core).

---

## 1. Архитектурная структура проекта

Проект разделен на изолированные доменные слои и развертывается через `@google/clasp` в единую глобальную область видимости Google Apps Script (V8 runtime):

```text
app-google-sheet-vms-stone/
├── config/
│   ├── Config.js                  # Системные константы GDK_CONFIG (валюта RUB, URL, схема 17 колонок)
│   ├── BrandOptions.js            # Реестр брендов (OliverDeck, Level, Kronex, Terrapol и др.)
│   └── ColorOptions.js            # Канонические опции цветов opt_{slug} и HEX-коды
│
├── core/
│   ├── Menu.js                    # Меню «Каталог OliverDeck» и оркестратор книги setupAllSheets()
│   └── Utils.js                   # Хелперы разметки, стилизации, валидации и генерации odk_...
│
├── parser/
│   ├── Parser.js                  # parseOliverDeckProductPage() — точка входа разбора товара
│   ├── DimensionsExtractor.js     # Извлечение 3D/2D, труб, толщины стенки wall_thickness_mm, опор
│   ├── PriceExtractor.js          # Извлечение цен с пересчетом пог.м в штуки
│   ├── ColorExtractor.js          # Разбор .shop2-color-ext-list, текстур и суффиксов _no7/_no9
│   └── AttributeDetector.js       # Определение брендов, материалов и оригинальных фото /d/
│
├── sheets/
│   ├── Inbox.js                   # Лист «Входные ссылки»: дедупликация и авто-распределение
│   ├── Boards.js                  # Лист «1. Доски»: развертывание торговых предложений (SKU)
│   ├── Components.js              # Листы 2–8: Ступени, Уголки, Зашивка, Лаги, Крепеж, Опоры, Каркас
│   └── Pipeline.js                # Лист «9. Связи калькулятора»: авто-подбор пар, syncDropdowns()
│
├── dictionaries/
│   ├── Dictionaries.js            # getComplexDictionariesDefinition() — точка сборки
│   ├── CalculatorSettings.js      # getCalculatorSettingsDictionary() — 26 инженерных настроек
│   ├── FoundationSpans.js         # getFoundationSpansDictionary() — матрица пролетов основания
│   └── CalculatorLayouts.js       # getCalculatorLayoutsDictionary() — 312 формул раскладки 500–16000 мм
│
├── exporter/
│   ├── Exporter.js                # exportFullCatalogJson() — сборка полного import_data.json
│   ├── ProductTypesSchema.js      # getStandardProductTypesDefinition() — 12 типов товаров
│   ├── PipelineSchemas.js         # Схемы пайплайнов pl_terrace и pl_joist
│   ├── BindingRulesCollector.js   # collectAllBindingRules() — правила связей лаг, крепежа, свай
│   ├── SystemProducts.js          # ensureDefaultSystemItems() — саморезы 00124, сваи, оголовки, ЦПС, арматура
│   └── SettingsExporter.js        # exportImportSettingsJson() — генератор import_settings.json
│
├── .clasp.json                    # Конфигурация привязки к Google Apps Script
├── appsscript.json                # Манифест среды выполнения V8
└── package.json                   # Зависимости и npm-скрипты
```

---

## 2. Быстрый старт и локальная разработка

### Требования
* Node.js >= 18.x
* npm >= 9.x
* Установленный `@google/clasp` глобально: `npm install -g @google/clasp`

### Установка зависимостей
```bash
npm install
```

### Авторизация в Google
```bash
clasp login
```

### Отправка изменений в Google Таблицу
```bash
# Разовая отправка
npm run push
# или: clasp push

# Режим отслеживания и автоматической отправки при сохранении
npm run watch
# или: clasp push -w
```

---

## 3. Регламент работы в Google Таблице

Пользовательское меню **«Каталог OliverDeck»** автоматизирует полный жизненный цикл данных:

```text
[0. Настроить мастер-лист] ──> [0.1 Распределить ссылки] ──> [1. Пересоздать листы]
                                                                    │
┌───────────────────────────────────────────────────────────────────┘
▼
[2. Спарсить Доски] ──> [3. Спарсить Комплектующие 2–8] ──> [5. Сгенерировать связи (Лист 9)]
                                                                    │
┌───────────────────────────────────────────────────────────────────┘
▼
[6. Синхронизировать списки] ──> [7. Экспорт import_data.json] ──> [9. Экспорт import_settings.json]
```

### Описание пунктов меню:
* **`0. Настроить мастер-лист "Входные ссылки"`** — создает лист со строгими выпадающими списками категорий (1–8) и защитой от дублей.
* **`0.1 Распределить ссылки по листам категорий`** — очищает ссылки от мусорных UTM-хвостов, проверяет на дубликаты и раскладывает по целевым листам 1–8 со статусом *«В очереди»*.
* **`1. Пересоздать и упорядочить все листы каталога`** — выстраивает эталонный порядок вкладок от Листа 1 до Листа 9 с удалением устаревших дублей.
* **`2. Спарсить Доски со всеми цветами и ценами (Лист 1)`** — обходит карточки досок Shop2 CMS, разворачивает цвета в SKU с оригинальными фото высокого разрешения `/d/` и пересчитывает цены за штуку из цен за пог.м.
* **`3. Спарсить все Комплектующие и Основание (Листы 2–8)`** — пакетно наполняет листы ступеней, уголков, зашивки, лаг, регулируемых опор LEVEL и профильных труб.
* **`4. Спарсить только текущий открытый лист комплектующих`** — точечный сбор для активной вкладки.
* **`5. Сгенерировать матрицу связей калькулятора (Лист 9)`** — автоматически сопоставляет каждую доску с подходящей лагой, кляймерами, уголком, доской зашивки и ступенями по бренду и цвету. Колонку `board_fixing` автоматически заполняет системным саморезом `00124`.
* **`6. Синхронизировать выпадающие списки связей`** — актуализирует валидацию ячеек на Листе 9 по спарсенным SKU.
* **`7. Экспорт полного пакета import_data.json (VMS-NC)`** — генерирует валидный JSON с каталогом, типами, атрибутами, словарями и связями.
* **`8. Экспорт только binding_rules JSON`** — выгрузка только массива правил связей.
* **`9. Экспорт файла настроек import_settings.json (VMS-NC)`** — выгрузка мета-схем каналов `widget` и `catalog` для платформы Nicole Core.

---

## 4. Спецификация подсистемы «Основание» (Foundation)

В каталоге реализована поддержка 3 инженерных типов фундамента в семействе `fam_decking_systems`:

| Тип в каталоге (`product_type`) | Семейство | Назначение в калькуляторе | Ключевые атрибуты EAV |
| :--- | :--- | :--- | :--- |
| **`adjustable_pedestal`** | `decking_system` | Регулируемые винтовые опоры под лаги | `height_min`, `height_max`, `max_load_kg` (1000 кг), `material`, `brand` |
| **`screw_pile`** | `decking_system` | Винтовые сваи (СВС-89х2000 мм) | `diameter_mm` (89), `length_mm` (2000), `blade_diameter_mm` (250), `wall_thickness_mm` (3.5), `has_head` (false) |
| **`foundation_beam`** | `decking_system` | Профильные трубы обвязки свай и каркаса | `profile_width_mm`, `profile_height_mm`, `wall_thickness_mm` (2/3 мм), `length_mm` (6000 мм), `material` |
| **`rebar`** | `decking_system` | Арматурные стойки под бетонирование | `diameter_mm` (10 мм), `length_mm` (6000 мм), `material` |
| **`pile_cap`** | `hardware_accessory` | Оголовки свай (150х150 мм) | `width_mm` (150), `length_mm` (150), связь `pile_head` со сваей |

### Инженерные константы в `calculator_settings`:
* `pedestalMaxStep` = 500 мм (максимальный шаг между опорами);
* `pedestalEdgeOffset` = 80 мм (отступ крайних опор от концов лаги);
* `rebarMaxStep` = 800 мм (максимальный шаг арматурных стоек);
* `rebarEdgeOffset` = 80 мм (отступ крайних стоек от концов лаги);
* `rebarEmbedDepth` = 150 мм (заглубление прута в бетонное основание);
* `rebarCutMargin` = 100 мм (технологический запас прута на срез и приварку);
* `pileEdgeOffset` = 200 мм (отступ свай от внешнего контура террасы);
* `minTerraceHeightPile` = 250 мм (минимальная строительная высота террасы на сваях).

---

## 5. Интеграция с бэкендом VMS-NC (Nicole Core)

### Команда импорта каталога:
```bash
php artisan vms:import packages/box/valerie/industry-wpc/database/data/import_data.json
```

### Команда импорта настроек каналов:
```bash
php artisan vms:import packages/box/valerie/industry-wpc/database/data/import_settings.json
```

### Сброс кэша приложения:
```bash
php artisan cache:clear
```
