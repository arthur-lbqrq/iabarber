// Enquanto só existe uma barbearia (a do seed), a barbearia é fixa. Barbeiro e
// serviço, porém, NÃO são mais fixos pro caminho da IA (ai/tools.ts resolve por
// nome, já que agora existem 2 barbeiros — Igor e Tinho). Os valores abaixo servem
// só de fallback pro motor de regras antigo (regras/motor.ts, dormente), que nunca
// aprendeu a perguntar "com qual barbeiro?" — ele sempre agenda com o primeiro
// (Igor) usando o serviço mais parecido com o que existia antes (Corte de cabelo).
export const BARBEARIA_PADRAO = {
  barbeariaId: '00000000-0000-0000-0000-000000000001',
  barbeiroId: '00000000-0000-0000-0000-000000000010', // Igor
  servicoPadraoId: '00000000-0000-0000-0000-000000000024', // Corte de cabelo
};
