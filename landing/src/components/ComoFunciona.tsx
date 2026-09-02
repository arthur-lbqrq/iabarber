const PASSOS = [
  {
    numero: '01',
    titulo: 'Conecta o seu WhatsApp',
    corpo: 'Você lê um código na tela e pronto. Mesmo número, mesma foto, mesma conversa de sempre — só que agora ela responde.',
  },
  {
    numero: '02',
    titulo: 'Atende na hora que chegar',
    corpo: 'Mensagem às 23h é respondida às 23h. Ele oferece só os horários que estão livres de verdade e já marca na agenda do profissional certo.',
  },
  {
    numero: '03',
    titulo: 'Confirma na véspera, lembra no dia',
    corpo: 'Quem confirma, aparece. Quem não responde até a manhã, libera a cadeira — e o horário volta pra fila de quem estava esperando.',
    destaque: true,
  },
  {
    numero: '04',
    titulo: 'Pergunta como foi',
    corpo: 'Depois do corte ele puxa o feedback com jeito. Você lê tudo num lugar só e sabe qual profissional tá indo bem.',
  },
];

export function ComoFunciona() {
  return (
    <section id="como" className="secao-como">
      <div className="container grade">
        <div className="coluna-esquerda">
          <span className="kicker">Como funciona</span>
          <h2>Liga numa tarde, trabalha pra sempre.</h2>
          <p className="sub">Nada pra instalar, nada pra treinar. Depois de conectado, ele só trabalha.</p>
        </div>

        <div className="trilho">
          {PASSOS.map((passo) => (
            <div key={passo.numero} className={`passo-trilho ${passo.destaque ? 'destaque' : ''}`}>
              <span className="ponto-trilho" />
              <span className="numero">{passo.numero}</span>
              <div>
                <div className="titulo">{passo.titulo}</div>
                <p className="corpo">{passo.corpo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
