import { useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';

interface Metrica {
  rotulo: string;
  alvo: number;
  sufixo: string;
  legenda: string;
  verde?: boolean;
}

const METRICAS: Metrica[] = [
  { rotulo: 'Horários hoje', alvo: 31, sufixo: '', legenda: 'agenda cheia até 13h' },
  { rotulo: 'Confirmados', alvo: 26, sufixo: '', legenda: 'responderam sozinhos', verde: true },
  { rotulo: 'Pendentes', alvo: 5, sufixo: '', legenda: 'lembrete sai às 9h' },
  { rotulo: 'Resposta média', alvo: 8, sufixo: 's', legenda: 'a qualquer hora do dia' },
];

const AGENDA = [
  { hora: '09:30', cliente: 'Rafael Marques', servico: 'Corte + barba · Diego', status: 'Confirmado' },
  { hora: '10:15', cliente: 'Tiago Bastos', servico: 'Degradê · Alan', status: 'Confirmado' },
  { hora: '11:00', cliente: 'Léo Andrade', servico: 'Corte · Diego', status: 'Aguardando' },
  { hora: '11:45', cliente: 'Marcos Vieira', servico: 'Barba · Alan', status: 'Confirmado' },
];

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

function useContadoresAnimados(alvos: number[], ativo: boolean, duracaoMs = 1300) {
  const [valores, setValores] = useState(() => alvos.map(() => 0));

  useEffect(() => {
    if (!ativo) return;
    let frame: number;
    const inicio = performance.now();

    function passo(agora: number) {
      const p = Math.min(1, (agora - inicio) / duracaoMs);
      const progresso = easeOutCubic(p);
      setValores(alvos.map((alvo) => Math.round(alvo * progresso)));
      if (p < 1) frame = requestAnimationFrame(passo);
    }

    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo]);

  return valores;
}

function prefereMovimentoReduzido() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function ProvaEmUso() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [emVista, setEmVista] = useState(prefereMovimentoReduzido());

  useEffect(() => {
    if (prefereMovimentoReduzido() || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setEmVista(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const valores = useContadoresAnimados(
    METRICAS.map((m) => m.alvo),
    emVista,
  );

  return (
    <section id="painel" className="secao-prova">
      <div className="container">
        <div className="cabecalho-prova">
          <h2>O sábado de uma barbearia comum, visto de dentro.</h2>
          <p className="nota-lateral">
            Dois profissionais, uma manhã. Você abre o painel só quando quiser olhar — o trabalho
            já aconteceu no WhatsApp.
          </p>
        </div>

        <div className="mockup-painel" ref={containerRef}>
          <aside className="mockup-sidebar">
            <div className="marca">
              <Logo tamanho={24} />
              <span>Corte Certo</span>
            </div>
            <nav className="mockup-nav">
              <span className="ativo">Agenda</span>
              <span>Conversas</span>
              <span>Clientes</span>
              <span>Equipe</span>
            </nav>
            <div className="mockup-pill-whatsapp">
              <span className="ponto" />
              WhatsApp conectado
            </div>
          </aside>

          <div className="mockup-conteudo">
            <header className="mockup-cabecalho">
              <div>
                <h3>Sábado, 5 de setembro</h3>
                <p className="subtitulo">Barbearia Corte Alto · Vila Madalena</p>
              </div>
              <button className="botao-primario botao-mockup">Novo agendamento</button>
            </header>

            <div className="mockup-metricas">
              {METRICAS.map((metrica, indice) => (
                <div key={metrica.rotulo} className="mockup-card-metrica">
                  <span className="rotulo">{metrica.rotulo}</span>
                  <span className={`numero ${metrica.verde ? 'verde' : ''}`}>
                    {valores[indice]}
                    {metrica.sufixo}
                  </span>
                  <span className="legenda">{metrica.legenda}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="mockup-cabecalho-lista">
                <h4>Próximos horários</h4>
                <a href="#contato">Ver dia inteiro</a>
              </div>
              <table className="mockup-tabela">
                <tbody>
                  {AGENDA.map((linha) => (
                    <tr key={linha.hora}>
                      <td className="hora">{linha.hora}</td>
                      <td className="cliente">{linha.cliente}</td>
                      <td className="servico">{linha.servico}</td>
                      <td>
                        <span className={`chip ${linha.status === 'Confirmado' ? 'verde' : 'aco'}`}>
                          <span className="ponto" />
                          {linha.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
