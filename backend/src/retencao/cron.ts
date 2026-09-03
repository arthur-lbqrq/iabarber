import cron from 'node-cron';
import { BARBEARIA_PADRAO } from '../config/barbearia.js';
import { buscarConfiguracaoIA } from '../config/configuracaoIA.js';
import { rodarJobRetencao } from './job.js';

// O cron em si sempre roda — quem decide se manda mensagem de verdade é o valor de
// `retencao_automatica_ativa` no banco (tela de Configurações), checado a cada
// disparo. Assim ligar/desligar pela tela funciona na hora, sem reiniciar o backend
// (diferente de antes, quando isso era uma variável de ambiente lida só no startup).
export function iniciarCronRetencao(): void {
  // Todo dia às 10h, horário do processo — depois do início do expediente, não de madrugada.
  cron.schedule('0 10 * * *', async () => {
    const config = await buscarConfiguracaoIA(BARBEARIA_PADRAO.barbeariaId);
    if (!config?.retencaoAutomaticaAtiva) {
      console.log('[retencao] automação desligada na configuração da barbearia — pulando execução.');
      return;
    }

    console.log('[retencao] iniciando execução agendada...');
    try {
      const resultado = await rodarJobRetencao();
      console.log('[retencao] concluído:', resultado);
    } catch (erro) {
      console.error('[retencao] erro na execução agendada:', erro);
    }
  });

  console.log('[retencao] cron agendado — roda todo dia às 10h (checa a configuração da barbearia antes de disparar).');
}
