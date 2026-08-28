import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Sobre() {
  return (
    <div>
      <Header />

      <section className="section dark">
        <div className="container">
          <div className="section-kicker">Sobre o projeto</div>
          <h2 style={{ marginBottom: 24 }}>Uma marca cultural própria.</h2>

          <p className="sobre-lead">
            O Sumaré Hip Hop Festival nasce como uma experiência gratuita de cultura Hip Hop,
            dança, formação e desenvolvimento social — com força para existir além da chancela
            institucional.
          </p>

          <div className="sobre-body">
            <p>
              Rua, movimento, cultura, encontro, formação e território. É dessa combinação que
              nasce a identidade do festival: uma cidade que recebe camadas, vozes, corpos e
              marcas — como um mural vivo que muda a cada intervenção.
            </p>
            <p>
              Ao longo de dois dias, oito oficinas gratuitas apresentam diferentes vertentes da
              cultura urbana — Hip Hop, Breaking, House, Popping, Dancehall, Jazz Funk e
              Discotecagem — ministradas por professores que vivem essa cena todos os dias.
              A proposta não é só ensinar passos: é abrir acesso à cultura para quem talvez nunca
              tenha tido a chance de participar de um workshop antes, criar pontes entre gerações
              e vertentes, e fortalecer a comunidade de dança e música de Sumaré e região.
            </p>
            <p>
              Formação e acesso à cultura caminham juntos aqui. Cada oficina é uma porta de
              entrada — para quem já dança, para quem quer começar, e para quem só quer
              experimentar de perto o que move essa cultura.
            </p>
            <p>
              O festival é realizado em parceria com a Prefeitura de Sumaré, mas nasce da cena:
              a intenção é que ele cresça a cada edição e se torne um ponto de encontro fixo no
              calendário cultural da cidade.
            </p>
          </div>

          <div style={{ marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/oficinas" className="btn-primary">Ver oficinas</Link>
            <Link to="/professores" className="btn-secondary">Conhecer os professores</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
