import { Logo } from './Logo';
import { ConversaAnimada } from './ConversaAnimada';

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-mark-fundo">
        <Logo tamanho={620} corTraco="#F5F5F3" corAcento="#F5F5F3" />
      </div>

      <div className="hero-conteudo">
        <span className="pill-status">
          <span className="ponto" />
          Funciona no WhatsApp que você já usa
        </span>
        <h1>Seu cliente marca pelo WhatsApp. E aparece.</h1>
        <p className="sub">
          Ele atende, oferece os horários livres, confirma na véspera e lembra no dia. Você só
          corta.
        </p>
        <div className="hero-ctas">
          <a href="#contato" className="botao-primario">
            Ligar no meu WhatsApp
          </a>
          <a href="#como" className="botao-secundario">
            Ver como funciona
          </a>
        </div>
        <p className="micro">Sem instalar aplicativo. Sem trocar de número. Cinco minutos pra ligar.</p>
      </div>

      <ConversaAnimada />
    </section>
  );
}
