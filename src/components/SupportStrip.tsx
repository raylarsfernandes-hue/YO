import regua from '../assets/regua_institucional.webp'

interface Props {
  className?: string
}

export default function SupportStrip({ className }: Props) {
  return (
    <div className={`support-strip ${className ?? ''}`}>
      <span className="support-label">Apoio</span>
      <img src={regua} alt="Prefeitura de Sumaré, Secretaria de Cultura e Turismo, Sistema Nacional de Cultura, Política Nacional Aldir Blanc, Ministério da Cultura" />
    </div>
  )
}
