const DEVANAGARI_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

function convertDevanagariDigits(str) {
  return (str || '').replace(/[०-९]/g, (d) => DEVANAGARI_DIGITS[d] || d);
}

const NUMBER_MAP = [
  { words: ['आर्ट.', 'आर्ट', 'art', 'aart', 'आट', 'आथ', 'आठ', 'aath', 'aat', 'ath', 'eight', '८'], val: 8 },
  { words: ['एक', 'ek', 'eka', 'one', '१'], val: 1 },
  { words: ['दोन', 'don', 'dohn', 'dawn', 'दो', 'do', 'two', '२'], val: 2 },
  { words: ['तीन', 'teen', 'tin', 'three', '३'], val: 3 },
  { words: ['चार', 'char', 'chaar', 'four', '४'], val: 4 },
  { words: ['पाच', 'paach', 'pach', 'panch', 'paanch', 'पांच', 'five', '५'], val: 5 },
  { words: ['सहा', 'saha', 'sah', 'chhah', 'che', 'छह', 'six', '६'], val: 6 },
  { words: ['सात', 'saat', 'sat', 'साथ', 'seven', '७'], val: 7 },
  { words: ['नऊ', 'nau', 'nav', 'नौ', 'nine', '९'], val: 9 },
  { words: ['दहा', 'daha', 'das', 'dus', 'दस', 'ten', '१०'], val: 10 },
  { words: ['अकरा', 'akra', 'gyarah', 'ग्यारह', 'eleven', '११'], val: 11 },
  { words: ['बारा', 'bara', 'barah', 'बारह', 'twelve', '१२'], val: 12 },
  { words: ['तेरा', 'tera', 'terah', 'तेरह', 'thirteen', '१३'], val: 13 },
  { words: ['चौदा', 'chauda', 'chaudah', 'चौदह', 'fourteen', '१४'], val: 14 },
  { words: ['पंधरा', 'pandra', 'pandhra', 'pandrah', 'पंद्रह', 'fifteen', '१५'], val: 15 },
  { words: ['सोळा', 'sola', 'solah', 'सोलह', 'sixteen', '१६'], val: 16 },
  { words: ['सतरा', 'satra', 'satrah', 'सत्रह', 'seventeen', '१७'], val: 17 },
  { words: ['अठरा', 'athra', 'atharah', 'अठारह', 'eighteen', '१८'], val: 18 },
  { words: ['एकोणीस', 'ekonis', 'unnis', 'उन्नीस', 'nineteen', '१९'], val: 19 },
  { words: ['वीस', 'vis', 'vees', 'bees', 'बीस', 'twenty', '२०'], val: 20 },
  { words: ['पंचवीस', 'panchvis', 'pachhis', 'पच्चीस', 'twenty five', '२५'], val: 25 },
  { words: ['तीस', 'tis', 'tees', 'thirty', '३०'], val: 30 },
  { words: ['बत्तीस', 'battis', '32', '३२'], val: 32 },
  { words: ['पस्तीस', 'pastis', 'paintis', 'पैंतीस', '35', '३५'], val: 35 },
  { words: ['चाळीस', 'chalis', 'chaalis', 'चालीस', 'forty', '४०'], val: 40 },
  { words: ['पंचेचाळीस', 'panchechalis', 'paintalis', 'पैंतालीस', '45', '४५'], val: 45 },
  { words: ['पन्नास', 'pannas', 'pachaas', 'pachas', 'पचास', 'fifty', '५०'], val: 50 },
  { words: ['साठ', 'sath', 'saath', 'sixty', '६०'], val: 60 },
  { words: ['सत्तर', 'sattar', 'seventy', '७०'], val: 70 },
  { words: ['पाऊणशे', 'paunshe', 'panchhattar', 'पचहत्तर', '75', '७५'], val: 75 },
  { words: ['ऐंशी', 'aishi', 'assi', 'अस्सी', 'eighty', '८०'], val: 80 },
  { words: ['नव्वद', 'navvad', 'nabbe', 'नब्बे', 'ninety', '९०'], val: 90 },
  { words: ['शंभर', 'shambhar', 'sau', 'सौ', 'hundred', '१००'], val: 100 },
  { words: ['दीडशे', 'didshe', 'dedh sau', 'डेढ़ सौ', '150', '१५०'], val: 150 },
  { words: ['दोनशे', 'donshe', 'do sau', 'दो सौ', '200', '२००'], val: 200 },
];

function extractQuantity(heard) {
  if (!heard) return null;
  const raw = heard.trim();
  const converted = convertDevanagariDigits(raw);

  // 1. Check numbers/digits in text (e.g. '8', '8 quintal', '8.5', '८ क्विंटल')
  const digitMatch = converted.match(/[\d.]+/);
  if (digitMatch) {
    const val = parseFloat(digitMatch[0]);
    if (!isNaN(val) && val > 0) return val;
  }

  // 2. Check phrase matching in NUMBER_MAP
  const lower = converted.toLowerCase();
  const tokens = lower.split(/[\s,]+/);

  for (const item of NUMBER_MAP) {
    for (const w of item.words) {
      const cleanW = w.toLowerCase().replace(/[\.]/g, '');
      const cleanLower = lower.replace(/[\.]/g, '');
      if (
        cleanLower === cleanW ||
        tokens.some(t => t.replace(/[\.]/g, '') === cleanW) ||
        cleanLower.includes(cleanW)
      ) {
        return item.val;
      }
    }
  }

  return null;
}

const tests = [
  'आर्ट.',
  'आर्ट',
  'आठ',
  '8 क्विंटल',
  '८ क्विंटल',
  'माझ्याकडे आठ क्विंटल गहू आहे',
  'वीस',
  'चाळीस क्विंटल',
  'art',
  '50 क्विंटल',
  'दहा',
  'पंधरा क्विंटल',
];

for (const t of tests) {
  console.log(`[TEST] "${t}" => ${extractQuantity(t)}`);
}
