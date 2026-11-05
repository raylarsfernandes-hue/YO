import InstitutionalBar from './InstitutionalBar'
import { useEventSettings } from '../hooks/useEventSettings'

export default function Footer() {
  const { settings } = useEventSettings()
  return (
    <>
      <InstitutionalBar />
      <footer className="site-footer">
        <div className="container">
          Encontro de Danças Urbanas de Sumaré — {settings.location_name}, {settings.location_address}.
          <br />
          Evento cultural gratuito, realizado em parceria com a Prefeitura de Sumaré.
        </div>
      </footer>
    </>
  )
}
