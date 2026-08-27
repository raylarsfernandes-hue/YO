/**
 * Componente global para os logos institucionais (Prefeitura de Sumaré, Secretaria etc).
 *
 * Como usar quando os logos oficiais chegarem:
 * 1. Salve os arquivos em src/assets/institucional/ (ex: prefeitura.png, secretaria.png).
 * 2. Importe cada um no topo deste arquivo:
 *      import prefeitura from '../assets/institucional/prefeitura.png'
 * 3. Substitua os objetos do array LOGOS abaixo por { src: prefeitura, alt: 'Prefeitura de Sumaré' }.
 *
 * Este componente é usado em Home, Oficinas, Inscricao, Confirmacao (via Footer) —
 * atualizar aqui reflete automaticamente em todas as páginas públicas.
 */

interface InstitutionalLogo {
  src: string | null
  alt: string
}

const LOGOS: InstitutionalLogo[] = [
  { src: null, alt: 'Prefeitura de Sumaré' },
  { src: null, alt: 'Secretaria de Cultura' },
]

export default function InstitutionalBar() {
  return (
    <div className="institutional-strip">
      <div className="container">
        <span className="label">Realização / apoio institucional</span>
        <div className="logo-slots">
          {LOGOS.map((logo, i) =>
            logo.src ? (
              <img key={i} src={logo.src} alt={logo.alt} style={{ height: 44, width: 'auto' }} />
            ) : (
              <div key={i} className="logo-slot-placeholder">{logo.alt}</div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
