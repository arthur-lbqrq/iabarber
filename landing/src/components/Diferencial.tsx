const COLUNAS = [
  {
    titulo: 'A conversa é a interface',
    corpo: 'Ninguém abre painel pra marcar horário. O cliente manda mensagem como sempre mandou, e a agenda se resolve sozinha do outro lado.',
  },
  {
    titulo: 'O problema é a cadeira vazia',
    corpo: 'Tem programa que mostra quanto você faturou no mês passado. Esse aqui trabalha antes disso: pra ninguém faltar neste sábado.',
  },
  {
    titulo: 'Ninguém precisa aprender nada',
    corpo: 'Seu cliente já sabe usar WhatsApp. Você também. Não tem treinamento, não tem app novo, não tem manual.',
  },
];

export function Diferencial() {
  return (
    <section className="banda-gelo secao-diferencial">
      <div className="container">
        <h2>Não é um sistema pra você usar. É um atendente que trabalha por você.</h2>
        <div className="grade-diferencial">
          {COLUNAS.map((coluna) => (
            <div key={coluna.titulo} className="coluna-diferencial">
              <h3>{coluna.titulo}</h3>
              <p>{coluna.corpo}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
