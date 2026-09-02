import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="footer-landing">
      <div className="container">
        <div className="marca">
          <Logo tamanho={22} corTraco="#6E7681" corAcento="#6E7681" />
          Corte Certo
        </div>
        <nav className="links">
          <a href="#como">Como funciona</a>
          <a href="#painel">O painel</a>
          <a href="#contato">Contato</a>
          <a href="#contato">Falar com gente de verdade</a>
        </nav>
        <span className="assinatura">Feito no Brasil para barbearias brasileiras.</span>
      </div>
    </footer>
  );
}
