/**
 * Converte automaticamente um link de COMPARTILHAMENTO do Google Drive
 * (ex: https://drive.google.com/file/d/ID/view?usp=sharing) para um link
 * direto de imagem, que é o formato que o <img> do navegador consegue exibir.
 *
 * Se a URL já for um link direto (de outro serviço, ou já no formato certo),
 * retorna sem alterar.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null

  if (trimmed.includes('drive.google.com')) {
    // formato .../file/d/FILE_ID/view...
    const fileMatch = trimmed.match(/\/file\/d\/([^/]+)/)
    if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`

    // formato .../open?id=FILE_ID ou .../uc?...&id=FILE_ID
    try {
      const parsed = new URL(trimmed)
      const id = parsed.searchParams.get('id')
      if (id) return `https://lh3.googleusercontent.com/d/${id}`
    } catch {
      // URL malformada — cai no retorno padrão abaixo
    }
  }

  return trimmed
}
