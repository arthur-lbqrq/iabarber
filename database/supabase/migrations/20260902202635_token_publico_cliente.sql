-- Token público por cliente, pra ele acessar a própria página (histórico de
-- agendamentos + assinatura atual) sem precisar de login — só de saber o link.
-- UUID aleatório de 128 bits como token: não é sequencial/adivinhável, suficiente
-- pra um link que só é compartilhado com o próprio cliente (não é um sistema
-- bancário). Default gen_random_uuid() já preenche todo cliente existente também,
-- não só os novos daqui pra frente.
alter table clientes add column token_publico uuid not null default gen_random_uuid() unique;
