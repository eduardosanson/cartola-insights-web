const MAX_LENGTH = 100
const TAG_HTML = /<[^>]*>?/g

function ehCaractereDeControle(codigo: number): boolean {
  return codigo <= 0x1f || codigo === 0x7f
}

/**
 * Sanitização defensiva de texto livre de busca no frontend (issue #10).
 * Remove tags HTML e caracteres de controle antes que o valor alimente
 * estado/filtro — o React já escapa o texto renderizado, então isto é
 * uma camada extra contra injeção, não a única defesa. Letras Unicode
 * (acentos), apóstrofo e hífen são preservados para não prejudicar a
 * busca por nomes reais.
 */
export function sanitizeSearchInput(valor: string): string {
  const semTags = valor.replace(TAG_HTML, '')
  let resultado = ''
  for (const caractere of semTags) {
    const codigo = caractere.codePointAt(0) ?? 0
    if (!ehCaractereDeControle(codigo)) resultado += caractere
  }
  return resultado.slice(0, MAX_LENGTH)
}
