import cron from 'node-cron';
import { env } from '../config/env.js';
import { rodarJobRetencao } from './job.js';

// Desligado por padrão (env.retencaoAutomaticaAtiva) — ver comentário em config/env.ts
// sobre por que isso exige ativação explícita, não fica ligado só por existir.
export function iniciarCronRetencao(): void {
  if (!env.retencaoAutomaticaAtiva) {
    console.log('[retencao] automação desligada (RETENCAO_AUTOMATICA_ATIVA != true) — nenhum cron agendado.');
    return;
  }

  // Todo dia às 10h, horário do processo — depois do início do expediente, não de madrugada.
  cron.schedule('0 10 * * *', async () => {
    console.log('[retencao] iniciando execução agendada...');
    try {
      const resultado = await rodarJobRetencao();
      console.log('[retencao] concluído:', resultado);
    } catch (erro) {
      console.error('[retencao] erro na execução agendada:', erro);
    }
  });

  console.log('[retencao] cron agendado — roda todo dia às 10h.');
}
