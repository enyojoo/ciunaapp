export const COUNTRY_CODES = ["RU","CN","NG","GH","KE","UG","TZ","ZA","CM","SN","CI","ET","EG","MA","DZ","TN","CD","AO","RW","ZW","ZM","BR","MX","CO","PE","AR","CL","VE","EC","CU","IN","PK","BD","LK","NP","UZ","KZ","KG","TJ","TM","AZ","AM","GE","TR","VN","TH","ID","PH","KR","JP","SY","IQ","IR","AF","UA","BY","MD","DE","FR","ES","PT","IT","GB","US","AE"] as const

export function countryName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code
  } catch {
    return code
  }
}

export function countryOptions(locale: string) {
  return COUNTRY_CODES.map((c) => ({ code: c, name: countryName(c, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale))
}
