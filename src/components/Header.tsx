import { Link } from 'react-router-dom'
import logo from '../assets/logo_evento.webp'

export default function Header() {
  return (
    <header className="site-header">
      <div className="bar">
        <Link to="/" className="logo" aria-label="Encontro de Danças Urbanas de Sumaré — início">
          <img src={logo} alt="Encontro de Danças Urbanas de Sumaré" />
        </Link>
        <nav>
          <Link to="/">Início</Link>
          <Link to={{ pathname: '/', hash: '#programacao' }}>Programação</Link>
          <Link to={{ pathname: '/', hash: '#professores' }}>Professores</Link>
          <Link to="/inscricao">Inscrições</Link>
          <Link to={{ pathname: '/', hash: '#local' }}>Local</Link>
          <Link to="/inscricao" className="btn-inscrever">Inscreva-se</Link>
        </nav>
      </div>
    </header>
  )
}
