// One-off generator: renders nucleo-flags React components to raw SVG markup
// and writes mobile/lib/nucleo-flags.ts keyed by ISO 3166-1 alpha-2 code.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import React from "react"
import ReactDOMServer from "react-dom/server"
import * as NucleoFlags from "nucleo-flags"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const countryServiceSrc = readFileSync(path.join(__dirname, "../mobile/lib/country-service.ts"), "utf8")

const countryRe = /\{\s*code:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)"/g
const countries = []
let m
while ((m = countryRe.exec(countryServiceSrc))) {
  countries.push({ code: m[1], name: m[2] })
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\band\b/g, "")
    .replace(/[^a-z]/g, "")
}

const iconNames = Object.keys(NucleoFlags).filter((k) => k.startsWith("Icon") && k !== "Icon")
const byNormalized = new Map(iconNames.map((n) => [normalize(n.slice(4)), n]))

// Manual overrides for names nucleo-flags spells differently than our country list.
const OVERRIDES = {
  US: "IconUnitedStates",
  GB: "IconUnitedKingdom",
  KR: "IconSouthKorea",
  KP: "IconNorthKorea",
  CI: "IconIvoryCoast",
  CD: "IconDemocraticRepublicCongo",
  CG: "IconRepublicCongo",
  CZ: "IconCzechia",
  ST: "IconSaoTomePrincipe",
  VA: "IconVaticanCity",
  TL: "IconEastTimor",
  LA: "IconLaos",
  SY: "IconSyria",
  RU: "IconRussia",
  FR: "IconFrance",
  ES: "IconSpain",
  MK: "IconNorthMacedonia",
  MD: "IconMoldova",
  TZ: "IconTanzania",
  VE: "IconVenezuela",
  BO: "IconBolivia",
  IR: "IconIran",
  BN: "IconBrunei",
  FM: "IconMicronesia",
  MZ: "IconMozanbique",
  VC: "IconSaintVincentGrenadines",
}

const found = {}
const missing = []
for (const { code, name } of countries) {
  const override = OVERRIDES[code]
  const key = override || byNormalized.get(normalize(name))
  if (key && NucleoFlags[key]) {
    found[code] = key
  } else {
    missing.push({ code, name })
  }
}

console.log(`Matched ${Object.keys(found).length}/${countries.length}`)
if (missing.length) {
  console.log("Missing:", missing.map((c) => `${c.code}:${c.name}`).join(", "))
}

const svgByCode = {}
for (const [code, key] of Object.entries(found)) {
  const Comp = NucleoFlags[key]
  const markup = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp))
  svgByCode[code] = markup
}

const out = [
  "// GENERATED FILE — do not edit by hand. Regenerate with scripts/gen-nucleo-flags.mjs",
  "// Source: nucleo-flags (https://nucleoapp.com/svg-flag-icons), rendered to raw SVG markup",
  "// so it can be drawn natively via react-native-svg's SvgXml.",
  "",
  "export const NUCLEO_FLAGS: Record<string, string> = {",
  ...Object.entries(svgByCode).map(([code, svg]) => `  ${code}: ${JSON.stringify(svg)},`),
  "}",
  "",
].join("\n")

writeFileSync(path.join(__dirname, "../mobile/lib/nucleo-flags.ts"), out)
console.log("Wrote mobile/lib/nucleo-flags.ts")
