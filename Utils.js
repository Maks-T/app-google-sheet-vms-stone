/**
 * Generates a clean URL slug from text using transliteration.
 *
 * @param {string} text Input text.
 * @return {string} Generated slug.
 * @customfunction
 */
function generateSlug(text) {
  if (Array.isArray(text)) {
    return text.map(row => Array.isArray(row) ? row.map(generateSlug) : generateSlug(row));
  }
  return transliterate(text).replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * Generates a unique external code with a custom prefix.
 *
 * @param {string} prefix Code prefix.
 * @param {string} text Base text.
 * @return {string} Unique code.
 * @customfunction
 */
function getExtCode(prefix, text) {
  if (Array.isArray(text)) {
    return text.map(row => Array.isArray(row) ? row.map(t => getExtCode(prefix, t)) : getExtCode(prefix, row));
  }
  return prefix + '_' + generateSlug(text).substring(0, 30) + '_' + Math.floor(Math.random() * 1000);
}

/**
 * Generates a structured SKU from article, name, and dimensions.
 *
 * @param {string} article Supplier article.
 * @param {string} name Product name.
 * @param {number} [length] Product length.
 * @param {number} [width] Product width.
 * @param {number} [thickness] Product thickness.
 * @return {string} Concatenated SKU.
 * @customfunction
 */
function GENERATE_SKU(article, name, length, width, thickness) {
  if (Array.isArray(article)) {
    return article.map((row, rIdx) => {
      const art = getValFromMatrix(article, rIdx, 0);
      const nm = getValFromMatrix(name, rIdx, 0);
      const l = getValFromMatrix(length, rIdx, 0);
      const w = getValFromMatrix(width, rIdx, 0);
      const t = getValFromMatrix(thickness, rIdx, 0);
      return buildSimpleSku(art, nm, l, w, t);
    });
  }
  
  return buildSimpleSku(article, name, length, width, thickness);
}

function cleanUrl(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, '');
  const normalized = str.replace(/[\s\u00A0]+/g, '');
  if (/^(https?:\/*)?$/i.test(normalized)) {
    return null;
  }
  return str;
}

function cleanSlug(slug) {
  if (slug === null || slug === undefined) return "default";
  return String(slug).replace(/#/g, '').replace(/^[\s\u00A0]+|[\s\u00A0]+$/g, '').toLowerCase();
}

function transliterate(text) {
  if (!text) return '';
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '_': '-', '.': '', ',': '', ':': '', ';': '', '?': '', '!': ''
  };
  return text.toString().toLowerCase().split('').map(char => translitMap[char] || char).join('');
}

function getRowReader(sheet) {
  if (!sheet) return null;
  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return null;
  
  const headers = values[0].map(h => String(h).trim().toLowerCase());
  
  return {
    rows: values.slice(1),
    getVal: function(row, code) {
      const idx = headers.indexOf(code.toLowerCase());
      return idx !== -1 ? row[idx] : null;
    }
  };
}

function buildSimpleSku(article, name, length, width, thickness) {
  const parts = [];
  
  if (article && String(article).trim() !== "") {
    parts.push(generateSlug(String(article).trim()));
  }
  
  if (name && String(name).trim() !== "") {
    parts.push(generateSlug(String(name).trim()));
  }
  
  if (length && parseFloat(length) > 0) parts.push(String(length).trim());
  if (width && parseFloat(width) > 0) parts.push(String(width).trim());
  if (thickness && parseFloat(thickness) > 0) parts.push(String(thickness).trim());
  
  return parts.join("-").toLowerCase();
}

function getValFromMatrix(arg, rowIndex, colIndex) {
  if (Array.isArray(arg)) {
    const row = arg[rowIndex] !== undefined ? arg[rowIndex] : arg[0];
    if (Array.isArray(row)) {
      return row[colIndex] !== undefined ? row[colIndex] : row[0];
    }
    return row;
  }
  return arg;
}