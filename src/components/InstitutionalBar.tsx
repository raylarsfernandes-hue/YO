import regua from '../assets/regua_institucional.webp'

/**
 * Régua oficial de logos institucionais (Prefeitura de Sumaré, Secretaria de
 * Cultura e Turismo, Sistema Nacional de Cultura, Política Nacional Aldir
 * Blanc e Ministério da Cultura) — arquivo fornecido pronto pela organização.
 *
 * Não recortar, não recolorir, não distorcer — é aplicado como veio.
 * Usado em Home (via seção própria) e em todas as páginas públicas via Footer.
 */
export default function InstitutionalBar() {
  return (
    <div className="institutional-strip">
      <div className="container">
        <img src={regua} alt="Prefeitura de Sumaré, Secretaria de Cultura e Turismo, Sistema Nacional de Cultura, Política Nacional Aldir Blanc, Ministério da Cultura" className="regua" />
      </div>
    </div>
  )
}
