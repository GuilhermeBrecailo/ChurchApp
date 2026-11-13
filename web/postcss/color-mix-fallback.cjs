/**
 * Cor de reserva para `color-mix()` em iPhones antigos.
 *
 * `color-mix()` só existe a partir do Safari/iOS 16.2. O Vuetify 4 já exige
 * iOS 15.4 (por causa de @layer), então quem está entre 15.4 e 16.1
 * (iPhone 6s/7/SE de 1ª geração, ou iPhones que não atualizaram) perderia
 * trilhos, bordas e o contorno de foco.
 *
 * Para cada declaração com `color-mix(in srgb, A P%, B)` este plugin troca o
 * valor por um equivalente sem `color-mix`, usando as próprias variáveis do
 * tema (então continua certo no claro e no escuro):
 *   - mistura com cor sólida: usa a cor que pesa mais (A se P ≥ 50%, senão B);
 *   - mistura com `transparent`:
 *       contorno, sombra e borda → A (o foco continua visível); borda
 *       terracota fraquinha → terracota claro do tema;
 *       fundo → cinza translúcido neutro (o "preenchimento" do iOS).
 * O valor original (com `color-mix`) vai num `@supports (color: color-mix(...))`
 * logo depois da regra: navegador novo usa ele; o antigo ignora o bloco e
 * fica com a reserva. (Vale também para propriedades customizadas, que
 * aceitariam qualquer texto e ficariam inválidas só na hora do uso.)
 */
const SUPPORTS = "(color: color-mix(in srgb, red 50%, blue))";
const NEUTRAL_FILL = "rgba(120, 120, 128, 0.12)";

function splitTopLevel(text) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  return parts;
}

function splitColorAndPercent(part) {
  const match = part.match(/^(.*?)\s+(\d+(?:\.\d+)?)%$/s);
  return match ? { color: match[1].trim(), percent: Number(match[2]) } : { color: part.trim(), percent: null };
}

function fallbackFor(args, prop) {
  const [, first, second] = splitTopLevel(args);
  if (!first || !second) return null;
  const a = splitColorAndPercent(first);
  const b = splitColorAndPercent(second);
  const p = a.percent ?? (b.percent != null ? 100 - b.percent : 50);
  if (b.color === "transparent") {
    // Borda terracota fraquinha: o terracota claro do tema chega mais perto
    // do que a cor cheia (o contorno de foco continua com a cor cheia).
    if (/^border/.test(prop) && a.color === "var(--app-color-accent)" && p < 50) return "var(--app-color-accent-tint)";
    if (/^(outline|box-shadow|border|--)/.test(prop) || /shadow|ring|outline|border/.test(prop)) return a.color;
    if (/^(background|fill)/.test(prop)) return NEUTRAL_FILL;
    return a.color;
  }
  return p >= 50 ? a.color : b.color;
}

function replaceColorMix(value, prop) {
  let output = "";
  let index = 0;
  while (index < value.length) {
    const start = value.indexOf("color-mix(", index);
    if (start === -1) {
      output += value.slice(index);
      break;
    }
    output += value.slice(index, start);
    let depth = 0;
    let end = start + "color-mix".length;
    for (; end < value.length; end += 1) {
      if (value[end] === "(") depth += 1;
      if (value[end] === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const inner = value.slice(start + "color-mix(".length, end);
    const fallback = fallbackFor(replaceColorMix(inner, prop), prop);
    if (fallback == null) return null;
    output += fallback;
    index = end + 1;
  }
  return output;
}

module.exports = () => {
  const { AtRule } = require("postcss");
  return {
    postcssPlugin: "color-mix-fallback",
    // Para cada regra: a reserva fica no lugar da declaração, e o color-mix
    // original vai num `@supports` logo depois da regra (mesma
    // especificidade, vem depois, então ganha onde é suportado). Em blocos
    // separados o minificador não apaga a reserva achando que é repetida.
    Rule(rule) {
      if (rule.__colorMixDone) return;
      const originals = [];
      rule.each((node) => {
        if (node.type !== "decl" || !node.value.includes("color-mix(")) return;
        const fallback = replaceColorMix(node.value, node.prop);
        if (fallback == null) return;
        originals.push(node.clone());
        node.value = fallback;
      });
      if (!originals.length) return;
      const supported = rule.clone({ nodes: [] });
      supported.__colorMixDone = true;
      originals.forEach((decl) => supported.append(decl));
      const atRule = new AtRule({ name: "supports", params: SUPPORTS });
      atRule.append(supported);
      rule.after(atRule);
    },
  };
};
module.exports.postcss = true;
