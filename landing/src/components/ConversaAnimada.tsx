import { useEffect, useState } from 'react';
import { Logo } from './Logo';

type Evento =
  | { ms: number; tipo: 'separador'; texto: string }
  | { ms: number; tipo: 'digitando' }
  | { ms: number; tipo: 'bolha'; autor: 'cliente' | 'marca'; texto: string; hora?: string }
  | { ms: number; tipo: 'chip'; texto: string };

const ROTEIRO: Evento[] = [
  { ms: 0, tipo: 'separador', texto: 'quinta-feira' },
  { ms: 500, tipo: 'bolha', autor: 'cliente', texto: 'Boa tarde, tem horário sábado?' },
  { ms: 1150, tipo: 'digitando' },
  {
    ms: 2050,
    tipo: 'bolha',
    autor: 'marca',
    texto: 'Boa tarde, Rafael! Sábado tenho **10h**, **14h30** e **16h**. Qual fica melhor?',
    hora: '14:41',
  },
  { ms: 2950, tipo: 'bolha', autor: 'cliente', texto: '14h30' },
  { ms: 3450, tipo: 'digitando' },
  {
    ms: 4250,
    tipo: 'bolha',
    autor: 'marca',
    texto: 'Fechado. Corte + barba, sábado 14h30 com o Diego.',
    hora: '14:42',
  },
  { ms: 4900, tipo: 'chip', texto: 'Agenda atualizada' },
  { ms: 6100, tipo: 'separador', texto: 'sábado' },
  {
    ms: 6100,
    tipo: 'bolha',
    autor: 'marca',
    texto: 'Bom dia, Rafael! Seu horário é hoje às 14h30. Tá de pé?',
    hora: '07:00',
  },
  { ms: 7100, tipo: 'bolha', autor: 'cliente', texto: 'Tô indo' },
];

const DURACAO_CICLO_MS = 12000;

function renderComNegrito(texto: string) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((parte, indice) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={indice}>{parte.slice(2, -2)}</strong>;
    }
    return parte;
  });
}

function prefereMovimentoReduzido() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function ConversaAnimada() {
  const [visiveis, setVisiveis] = useState<Evento[]>(
    prefereMovimentoReduzido() ? ROTEIRO.filter((e) => e.tipo !== 'digitando') : [],
  );

  useEffect(() => {
    if (prefereMovimentoReduzido()) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    function agendarCiclo() {
      setVisiveis([]);
      for (const evento of ROTEIRO) {
        timers.push(
          setTimeout(() => {
            setVisiveis((atual) =>
              evento.tipo === 'digitando' ? [...atual, evento] : [...atual, evento],
            );
          }, evento.ms),
        );
      }
    }

    agendarCiclo();
    const intervalo = setInterval(agendarCiclo, DURACAO_CICLO_MS);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(intervalo);
    };
  }, []);

  // some com "digitando" assim que a bolha real da marca seguinte aparece
  const itens = visiveis.filter((evento, indice) => {
    if (evento.tipo !== 'digitando') return true;
    const proximo = visiveis[indice + 1];
    return !(proximo?.tipo === 'bolha' && proximo.autor === 'marca');
  });

  return (
    <div className="conversa">
      <div className="conversa-cabecalho">
        <div className="avatar">
          <Logo tamanho={26} />
        </div>
        <div>
          <div className="nome">Barbearia Corte Alto</div>
          <div className="status">responde na hora</div>
        </div>
      </div>
      <div className="conversa-corpo">
        {itens.map((evento, indice) => {
          const key = `${evento.tipo}-${indice}`;
          if (evento.tipo === 'separador') {
            return (
              <span key={key} className="separador-data">
                {evento.texto}
              </span>
            );
          }
          if (evento.tipo === 'digitando') {
            return (
              <div key={key} className="digitando">
                <span />
                <span />
                <span />
              </div>
            );
          }
          if (evento.tipo === 'chip') {
            return (
              <span key={key} className="chip-central">
                {evento.texto}
              </span>
            );
          }
          return (
            <div key={key} className={`bolha ${evento.autor === 'cliente' ? 'recebida' : 'marca'}`}>
              {renderComNegrito(evento.texto)}
              {evento.hora && <span className="timestamp">{evento.hora} ✓✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
