import { Logo } from './Logo';

export function Nav() {
  return (
    <nav className="nav-landing">
      <a href="#" className="marca">
        <Logo tamanho={28} />
        <span>Corte Certo</span>
      </a>
      <div className="links">
        <a href="#como">Como funciona</a>
        <a href="#painel">O painel</a>
        <a href="#contato" className="botao-primario botao-nav">
          Falar com a gente
        </a>
      </div>
    </nav>
  );
}
