import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="site-header">
      <div className="bar">
        <Link to="/" className="logo">
          <span>Sumaré<span style={{ color: 'var(--amarelo)' }}> Hip Hop</span> Festival</span>
        </Link>
        <nav>
          <a href="/#sobre">Sobre</a>
          <Link to="/oficinas">Oficinas</Link>
          <a href="/#local">Local</a>
          <Link to="/oficinas" className="btn-inscrever">Inscreva-se</Link>
        </nav>
      </div>
    </header>
  )
}
