/**
 * Currency utilities for converting currency codes to symbols and formatting
 */

// Маппинг валютных кодов на символы (только уникальные валюты)
const CURRENCY_SYMBOLS: Record<string, string> = {
  // Основные мировые валюты
  USD: "$", // US Dollar
  EUR: "€", // Euro
  GBP: "£", // British Pound
  JPY: "¥", // Japanese Yen
  CAD: "C$", // Canadian Dollar
  AUD: "A$", // Australian Dollar
  CHF: "CHF", // Swiss Franc
  CNY: "¥", // Chinese Yuan
  SEK: "kr", // Swedish Krona
  NOK: "kr", // Norwegian Krone
  DKK: "kr", // Danish Krone
  PLN: "zł", // Polish Zloty
  CZK: "Kč", // Czech Koruna
  HUF: "Ft", // Hungarian Forint
  RUB: "₽", // Russian Ruble
  BRL: "R$", // Brazilian Real
  INR: "₹", // Indian Rupee
  KRW: "₩", // South Korean Won
  SGD: "S$", // Singapore Dollar
  HKD: "HK$", // Hong Kong Dollar
  NZD: "NZ$", // New Zealand Dollar
  MXN: "$", // Mexican Peso
  ZAR: "R", // South African Rand
  TRY: "₺", // Turkish Lira
  ILS: "₪", // Israeli Shekel
  AED: "د.إ", // UAE Dirham
  SAR: "﷼", // Saudi Riyal
  THB: "฿", // Thai Baht
  MYR: "RM", // Malaysian Ringgit
  PHP: "₱", // Philippine Peso
  IDR: "Rp", // Indonesian Rupiah
  VND: "₫", // Vietnamese Dong
  EGP: "£", // Egyptian Pound
  NGN: "₦", // Nigerian Naira
  KES: "KSh", // Kenyan Shilling
  GHS: "₵", // Ghanaian Cedi
  MAD: "د.م.", // Moroccan Dirham
  TND: "د.ت", // Tunisian Dinar
  DZD: "د.ج", // Algerian Dinar
  LBP: "ل.ل", // Lebanese Pound
  JOD: "د.ا", // Jordanian Dinar
  KWD: "د.ك", // Kuwaiti Dinar
  BHD: "د.ب", // Bahraini Dinar
  QAR: "ر.ق", // Qatari Riyal
  OMR: "ر.ع.", // Omani Rial
  YER: "﷼", // Yemeni Rial
  IQD: "د.ع", // Iraqi Dinar
  AFN: "؋", // Afghan Afghani
  PKR: "₨", // Pakistani Rupee
  BDT: "৳", // Bangladeshi Taka
  LKR: "₨", // Sri Lankan Rupee
  MMK: "K", // Myanmar Kyat
  KHR: "៛", // Cambodian Riel
  LAK: "₭", // Lao Kip
  BND: "B$", // Brunei Dollar
  FJD: "FJ$", // Fijian Dollar
  PGK: "K", // Papua New Guinean Kina
  SBD: "SI$", // Solomon Islands Dollar
  VUV: "Vt", // Vanuatu Vatu
  WST: "WS$", // Samoan Tala
  TOP: "T$", // Tongan Paʻanga
  BTN: "Nu.", // Bhutanese Ngultrum
  MVR: "ރ.", // Maldivian Rufiyaa
  SCR: "₨", // Seychellois Rupee
  MUR: "₨", // Mauritian Rupee
  KMF: "CF", // Comorian Franc
  DJF: "Fdj", // Djiboutian Franc
  ETB: "Br", // Ethiopian Birr
  SOS: "S", // Somali Shilling
  TZS: "TSh", // Tanzanian Shilling
  UGX: "USh", // Ugandan Shilling
  RWF: "RF", // Rwandan Franc
  BIF: "FBu", // Burundian Franc
  MWK: "MK", // Malawian Kwacha
  ZMW: "ZK", // Zambian Kwacha
  BWP: "P", // Botswanan Pula
  SZL: "L", // Swazi Lilangeni
  LSL: "L", // Lesotho Loti
  NAD: "N$", // Namibian Dollar
  AOA: "Kz", // Angolan Kwanza
  MZN: "MT", // Mozambican Metical
  MGA: "Ar", // Malagasy Ariary
  CDF: "FC", // Congolese Franc
  XAF: "FCFA", // Central African CFA Franc
  XOF: "CFA", // West African CFA Franc
  GMD: "D", // Gambian Dalasi
  GNF: "FG", // Guinean Franc
  LRD: "L$", // Liberian Dollar
  SLL: "Le", // Sierra Leonean Leone
  CVE: "$", // Cape Verdean Escudo
  STN: "Db", // São Tomé and Príncipe Dobra
  ERN: "Nfk", // Eritrean Nakfa
  SDG: "ج.س.", // Sudanese Pound
  SSP: "£", // South Sudanese Pound
  LYD: "ل.د", // Libyan Dinar
  MRO: "UM", // Mauritanian Ouguiya
  MRU: "UM", // Mauritanian Ouguiya
  XPF: "₣", // CFP Franc
  NIO: "C$", // Nicaraguan Córdoba
  GTQ: "Q", // Guatemalan Quetzal
  HNL: "L", // Honduran Lempira
  SVC: "$", // Salvadoran Colón
  BZD: "BZ$", // Belize Dollar
  JMD: "J$", // Jamaican Dollar
  TTD: "TT$", // Trinidad and Tobago Dollar
  BBD: "Bds$", // Barbadian Dollar
  XCD: "$", // East Caribbean Dollar
  AWG: "ƒ", // Aruban Florin
  ANG: "ƒ", // Netherlands Antillean Guilder
  SRD: "$", // Surinamese Dollar
  GYD: "G$", // Guyanese Dollar
  VES: "Bs.S", // Venezuelan Bolívar
  COP: "$", // Colombian Peso
  PEN: "S/", // Peruvian Sol
  BOB: "Bs", // Bolivian Boliviano
  CLP: "$", // Chilean Peso
  ARS: "$", // Argentine Peso
  UYU: "$U", // Uruguayan Peso
  PYG: "₲", // Paraguayan Guarani
  FKP: "£", // Falkland Islands Pound
  GIP: "£", // Gibraltar Pound
  ISK: "kr", // Icelandic Króna
  RON: "lei", // Romanian Leu
  BGN: "лв", // Bulgarian Lev
  HRK: "kn", // Croatian Kuna
  RSD: "дин.", // Serbian Dinar
  MKD: "ден", // Macedonian Denar
  ALL: "L", // Albanian Lek
  BAM: "КМ", // Bosnia and Herzegovina Convertible Mark
  MDL: "L", // Moldovan Leu
  UAH: "₴", // Ukrainian Hryvnia
  BYN: "Br", // Belarusian Ruble
  AMD: "֏", // Armenian Dram
  GEL: "₾", // Georgian Lari
  AZN: "₼", // Azerbaijani Manat
  KZT: "₸", // Kazakhstani Tenge
  KGS: "с", // Kyrgyzstani Som
  TJS: "SM", // Tajikistani Somoni
  TMT: "T", // Turkmenistani Manat
  UZS: "лв", // Uzbekistani Som
  MNT: "₮", // Mongolian Tugrik
};

/**
 * Конвертирует валютный код в символ валюты
 * @param currencyCode - Код валюты (например, 'USD', 'EUR')
 * @returns Символ валюты или сам код, если символ не найден
 */
export function getCurrencySymbol(currencyCode: string): string {
  if (!currencyCode) return "";

  const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()];
  return symbol || currencyCode;
}

/**
 * Форматирует цену с символом валюты
 * @param amount - Сумма
 * @param currencyCode - Код валюты
 * @param options - Опции форматирования
 * @returns Отформатированная строка с ценой
 */
export function formatPrice(
  amount: string | number,
  currencyCode: string,
  options: {
    showSymbol?: boolean;
    symbolPosition?: "before" | "after";
    decimalPlaces?: number;
  } = {},
): string {
  const {
    showSymbol = true,
    symbolPosition = "before",
    decimalPlaces = 2,
  } = options;

  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) return "0";

  const formattedAmount = numericAmount.toFixed(decimalPlaces);

  if (!showSymbol) {
    return formattedAmount;
  }

  const symbol = getCurrencySymbol(currencyCode);

  if (symbolPosition === "after") {
    return `${formattedAmount} ${symbol}`;
  } else {
    return `${symbol}${formattedAmount}`;
  }
}

/**
 * Форматирует цену для отображения в виджете
 * @param amount - Сумма
 * @param currencyCode - Код валюты
 * @returns Отформатированная строка для виджета
 */
export function formatWidgetPrice(
  amount: string | number,
  currencyCode: string,
): string {
  return formatPrice(amount, currencyCode, {
    showSymbol: true,
    symbolPosition: "before",
    decimalPlaces: 2,
  });
}

/**
 * Получает список всех поддерживаемых валют
 * @returns Массив объектов с кодом и символом валюты
 */
export function getSupportedCurrencies(): Array<{
  code: string;
  symbol: string;
}> {
  return Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => ({
    code,
    symbol,
  }));
}

/**
 * Проверяет, поддерживается ли валюта
 * @param currencyCode - Код валюты
 * @returns true, если валюта поддерживается
 */
export function isCurrencySupported(currencyCode: string): boolean {
  return currencyCode.toUpperCase() in CURRENCY_SYMBOLS;
}
