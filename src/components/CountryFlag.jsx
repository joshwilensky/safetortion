// Lightweight country flag via emoji. Works with a 2-letter code or a country name.
// If you pass a name, we resolve via a common-name map and fall back to 🌐.

const NAME_TO_CODE = {
  "United States": "US",
  "United Kingdom": "GB",
  Canada: "CA",
  Mexico: "MX",
  Brazil: "BR",
  Argentina: "AR",
  Chile: "CL",
  Colombia: "CO",
  Peru: "PE",
  Venezuela: "VE",
  Ecuador: "EC",
  France: "FR",
  Germany: "DE",
  Spain: "ES",
  Italy: "IT",
  Portugal: "PT",
  Netherlands: "NL",
  Belgium: "BE",
  Luxembourg: "LU",
  Switzerland: "CH",
  Austria: "AT",
  Poland: "PL",
  Czechia: "CZ",
  "Czech Republic": "CZ",
  Slovakia: "SK",
  Hungary: "HU",
  Romania: "RO",
  Bulgaria: "BG",
  Greece: "GR",
  Turkey: "TR",
  Ukraine: "UA",
  Russia: "RU",
  Norway: "NO",
  Sweden: "SE",
  Denmark: "DK",
  Finland: "FI",
  Iceland: "IS",
  Estonia: "EE",
  Latvia: "LV",
  Lithuania: "LT",
  Ireland: "IE",
  Australia: "AU",
  "New Zealand": "NZ",
  Japan: "JP",
  "South Korea": "KR",
  "Korea, Republic of": "KR",
  China: "CN",
  "Hong Kong": "HK",
  Taiwan: "TW",
  India: "IN",
  Pakistan: "PK",
  Bangladesh: "BD",
  "Sri Lanka": "LK",
  Nepal: "NP",
  Indonesia: "ID",
  Malaysia: "MY",
  Singapore: "SG",
  Thailand: "TH",
  Vietnam: "VN",
  Philippines: "PH",
  Cambodia: "KH",
  Laos: "LA",
  Myanmar: "MM",
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  Israel: "IL",
  Egypt: "EG",
  "South Africa": "ZA",
  Nigeria: "NG",
  Kenya: "KE",
  Ghana: "GH",
  Ethiopia: "ET",
  Morocco: "MA",
  Algeria: "DZ",
  Tunisia: "TN",
};

function nameToCode(name) {
  if (!name) return "";
  const exact = NAME_TO_CODE[name];
  if (exact) return exact;
  // lenient match (case-insensitive)
  const key = Object.keys(NAME_TO_CODE).find(
    (k) => k.toLowerCase() === String(name).toLowerCase()
  );
  return key ? NAME_TO_CODE[key] : "";
}

function codeToEmoji(alpha2) {
  const cc = String(alpha2 || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🌐";
  const A = 0x1f1e6; // Regional Indicator Symbol Letter A
  const first = A + (cc.charCodeAt(0) - 65);
  const second = A + (cc.charCodeAt(1) - 65);
  return String.fromCodePoint(first, second);
}

export default function CountryFlag({
  country,
  code,
  size = 16,
  className = "",
}) {
  const resolved = (code || nameToCode(country) || "").toUpperCase();
  const emoji = codeToEmoji(resolved);
  return (
    <span
      className={`flag ${className}`}
      style={{
        fontSize: size,
        lineHeight: 1,
        width: size,
        display: "inline-block",
        textAlign: "center",
      }}
      aria-hidden='true'>
      {emoji}
    </span>
  );
}
