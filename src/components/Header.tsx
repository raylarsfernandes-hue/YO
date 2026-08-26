import { Link } from 'react-router-dom'
import logo from '../assets/logo_cutout.webp'

export default function Header() {
  return (
    <header className="site-header">
      <div className="bar">
        <Link to="/" className="logo-link">
          <img src={logo} alt="Sumaré Hip Hop Festival" />
        </Link>
        <nav>
          <a className="nav-link" href="/#sobre">Sobre</a>
          <a className="nav-link" href="/#oficinas">Oficinas</a>
          <a className="nav-link" href="/#local">Local</a>
          <Link to="/inscricao" className="btn-inscrever"><span>Inscreva-se</span></Link>
        </nav>
      </div>
    </header>
  )
}
