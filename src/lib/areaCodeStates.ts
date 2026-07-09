// NANP area code → US state/territory lookup, used to show a state flag
// next to searchable phone numbers. Geographic US area codes each belong to
// exactly one state, so a single flag per code is sufficient; codes we don't
// recognize (Canadian, toll-free, unassigned, typos) return null and the UI
// simply renders no flag.
//
// Flags are served from FlagCDN (https://flagcdn.com), which hosts all 50
// US state flags under ISO 3166-2 codes ("us-ca", "us-tx", ...) plus the
// territories under their country codes ("pr", "vi", "gu", "as", "mp").
// FlagCDN has no DC flag, so DC area codes fall back to the US flag.

export interface AreaCodeRegion {
  /** Short region code, e.g. "CA", "TX", "PR", "DC" */
  abbr: string;
  /** Full region name, e.g. "California" */
  name: string;
  /** FlagCDN flag identifier, e.g. "us-ca" → https://flagcdn.com/us-ca.svg */
  flag: string;
}

const REGION_AREA_CODES: [AreaCodeRegion, string[]][] = [
  [{ abbr: "AL", name: "Alabama", flag: "us-al" }, ["205", "251", "256", "334", "659", "938"]],
  [{ abbr: "AK", name: "Alaska", flag: "us-ak" }, ["907"]],
  [{ abbr: "AZ", name: "Arizona", flag: "us-az" }, ["480", "520", "602", "623", "928"]],
  [{ abbr: "AR", name: "Arkansas", flag: "us-ar" }, ["327", "479", "501", "870"]],
  [{ abbr: "CA", name: "California", flag: "us-ca" }, ["209", "213", "279", "310", "323", "341", "350", "408", "415", "424", "442", "510", "530", "559", "562", "619", "626", "628", "650", "657", "661", "669", "707", "714", "747", "760", "805", "818", "820", "831", "837", "840", "858", "909", "916", "925", "949", "951"]],
  [{ abbr: "CO", name: "Colorado", flag: "us-co" }, ["303", "719", "720", "970", "983"]],
  [{ abbr: "CT", name: "Connecticut", flag: "us-ct" }, ["203", "475", "860", "959"]],
  [{ abbr: "DE", name: "Delaware", flag: "us-de" }, ["302"]],
  [{ abbr: "DC", name: "Washington, DC", flag: "us" }, ["202", "771"]],
  [{ abbr: "FL", name: "Florida", flag: "us-fl" }, ["239", "305", "321", "352", "386", "407", "448", "561", "645", "656", "689", "727", "754", "772", "786", "813", "850", "863", "904", "941", "954"]],
  [{ abbr: "GA", name: "Georgia", flag: "us-ga" }, ["229", "404", "470", "478", "678", "706", "762", "770", "912", "943"]],
  [{ abbr: "HI", name: "Hawaii", flag: "us-hi" }, ["808"]],
  [{ abbr: "ID", name: "Idaho", flag: "us-id" }, ["208", "986"]],
  [{ abbr: "IL", name: "Illinois", flag: "us-il" }, ["217", "224", "309", "312", "331", "447", "464", "618", "630", "708", "730", "773", "779", "815", "847", "872"]],
  [{ abbr: "IN", name: "Indiana", flag: "us-in" }, ["219", "260", "317", "463", "574", "765", "812", "930"]],
  [{ abbr: "IA", name: "Iowa", flag: "us-ia" }, ["319", "515", "563", "641", "712"]],
  [{ abbr: "KS", name: "Kansas", flag: "us-ks" }, ["316", "620", "785", "913"]],
  [{ abbr: "KY", name: "Kentucky", flag: "us-ky" }, ["270", "364", "502", "606", "859"]],
  [{ abbr: "LA", name: "Louisiana", flag: "us-la" }, ["225", "318", "337", "457", "504", "985"]],
  [{ abbr: "ME", name: "Maine", flag: "us-me" }, ["207"]],
  [{ abbr: "MD", name: "Maryland", flag: "us-md" }, ["227", "240", "301", "410", "443", "667"]],
  [{ abbr: "MA", name: "Massachusetts", flag: "us-ma" }, ["339", "351", "413", "508", "617", "774", "781", "857", "978"]],
  [{ abbr: "MI", name: "Michigan", flag: "us-mi" }, ["231", "248", "269", "313", "517", "586", "616", "679", "734", "810", "906", "947", "989"]],
  [{ abbr: "MN", name: "Minnesota", flag: "us-mn" }, ["218", "320", "507", "612", "651", "763", "952"]],
  [{ abbr: "MS", name: "Mississippi", flag: "us-ms" }, ["228", "601", "662", "769"]],
  [{ abbr: "MO", name: "Missouri", flag: "us-mo" }, ["314", "417", "557", "573", "636", "660", "816", "975"]],
  [{ abbr: "MT", name: "Montana", flag: "us-mt" }, ["406"]],
  [{ abbr: "NE", name: "Nebraska", flag: "us-ne" }, ["308", "402", "531"]],
  [{ abbr: "NV", name: "Nevada", flag: "us-nv" }, ["702", "725", "775"]],
  [{ abbr: "NH", name: "New Hampshire", flag: "us-nh" }, ["603"]],
  [{ abbr: "NJ", name: "New Jersey", flag: "us-nj" }, ["201", "551", "609", "640", "732", "848", "856", "862", "908", "973"]],
  [{ abbr: "NM", name: "New Mexico", flag: "us-nm" }, ["505", "575"]],
  [{ abbr: "NY", name: "New York", flag: "us-ny" }, ["212", "315", "332", "347", "363", "516", "518", "585", "607", "631", "646", "680", "716", "718", "838", "845", "914", "917", "929", "934"]],
  [{ abbr: "NC", name: "North Carolina", flag: "us-nc" }, ["252", "336", "472", "704", "743", "828", "910", "919", "980", "984"]],
  [{ abbr: "ND", name: "North Dakota", flag: "us-nd" }, ["701"]],
  [{ abbr: "OH", name: "Ohio", flag: "us-oh" }, ["216", "220", "234", "283", "326", "330", "380", "419", "440", "513", "567", "614", "740", "937"]],
  [{ abbr: "OK", name: "Oklahoma", flag: "us-ok" }, ["405", "539", "572", "580", "918"]],
  [{ abbr: "OR", name: "Oregon", flag: "us-or" }, ["458", "503", "541", "971"]],
  [{ abbr: "PA", name: "Pennsylvania", flag: "us-pa" }, ["215", "223", "267", "272", "412", "445", "484", "570", "582", "610", "717", "724", "814", "878"]],
  [{ abbr: "RI", name: "Rhode Island", flag: "us-ri" }, ["401"]],
  [{ abbr: "SC", name: "South Carolina", flag: "us-sc" }, ["803", "839", "843", "854", "864"]],
  [{ abbr: "SD", name: "South Dakota", flag: "us-sd" }, ["605"]],
  [{ abbr: "TN", name: "Tennessee", flag: "us-tn" }, ["423", "615", "629", "731", "865", "901", "931"]],
  [{ abbr: "TX", name: "Texas", flag: "us-tx" }, ["210", "214", "254", "281", "325", "346", "361", "409", "430", "432", "469", "512", "682", "713", "726", "737", "806", "817", "830", "832", "903", "915", "936", "940", "945", "956", "972", "979"]],
  [{ abbr: "UT", name: "Utah", flag: "us-ut" }, ["385", "435", "801"]],
  [{ abbr: "VT", name: "Vermont", flag: "us-vt" }, ["802"]],
  [{ abbr: "VA", name: "Virginia", flag: "us-va" }, ["276", "434", "540", "571", "703", "757", "804", "826", "948"]],
  [{ abbr: "WA", name: "Washington", flag: "us-wa" }, ["206", "253", "360", "425", "509", "564"]],
  [{ abbr: "WV", name: "West Virginia", flag: "us-wv" }, ["304", "681"]],
  [{ abbr: "WI", name: "Wisconsin", flag: "us-wi" }, ["262", "274", "353", "414", "534", "608", "715", "920"]],
  [{ abbr: "WY", name: "Wyoming", flag: "us-wy" }, ["307"]],
  [{ abbr: "PR", name: "Puerto Rico", flag: "pr" }, ["787", "939"]],
  [{ abbr: "VI", name: "U.S. Virgin Islands", flag: "vi" }, ["340"]],
  [{ abbr: "GU", name: "Guam", flag: "gu" }, ["671"]],
  [{ abbr: "AS", name: "American Samoa", flag: "as" }, ["684"]],
  [{ abbr: "MP", name: "Northern Mariana Islands", flag: "mp" }, ["670"]],
];

const AREA_CODE_TO_REGION: Record<string, AreaCodeRegion> = {};
for (const [region, codes] of REGION_AREA_CODES) {
  for (const code of codes) AREA_CODE_TO_REGION[code] = region;
}

/**
 * Look up the US state/territory for a 3-digit NANP area code.
 * Returns null for anything unrecognized (Canadian, toll-free, invalid).
 */
export function stateForAreaCode(areaCode: string): AreaCodeRegion | null {
  const ac = (areaCode || "").replace(/\D/g, "");
  if (ac.length !== 3) return null;
  return AREA_CODE_TO_REGION[ac] || null;
}
