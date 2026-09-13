const MAX_LENGTH = 100
const TAG_HTML = /<[^>]*>?/g

// Categoria Unicode "Cc" (Control) — cobre C0 (0x00-0x1F), DEL (0x7F) e C1
// (0x80-0x9F) num único critério semântico, em vez de listar ranges à mão.
function ehCaractereDeControle(caractere: string): boolean {
  return /\p{Cc}/u.test(caractere)
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
    if (!ehCaractereDeControle(caractere)) resultado += caractere
  }
  return resultado.slice(0, MAX_LENGTH)
}
