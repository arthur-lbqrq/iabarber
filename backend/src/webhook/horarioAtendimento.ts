// Checagem pura, testável sem I/O — recebe as horas já resolvidas da configuração
// da barbearia (não são mais fixas no código, ver config/configuracaoIA.ts).
export function dentroDoHorario(agora: Date, horaInicio: string, horaFim: string): boolean {
  const [horaI, minutoI] = horaInicio.split(':').map(Number);
  const [horaF, minutoF] = horaFim.split(':').map(Number);

  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const minutosInicio = horaI * 60 + minutoI;
  const minutosFim = horaF * 60 + minutoF;

  return minutosAgora >= minutosInicio && minutosAgora < minutosFim;
}

export function mensagemForaDoHorario(horaInicio: string, horaFim: string): string {
  const formatar = (h: string) => h.slice(0, 5);
  return `Nosso atendimento por aqui é das ${formatar(horaInicio)} às ${formatar(horaFim)}. Assim que abrir de novo eu te respondo — pode deixar sua mensagem que não se perde.`;
}
