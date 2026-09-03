-- Move pra dentro do banco (editável por uma tela) o que hoje está fixo no código
-- ou em variável de ambiente: nome/tom de voz da IA, liga-desliga da automação de
-- retenção, template da mensagem de retenção + janela de dias, e horário de
-- atendimento. Tudo com um default que preserva o comportamento atual (24/7,
-- "Bento", retenção desligada) — ninguém muda de comportamento só por causa desta
-- migration, só passa a poder mudar sem precisar mexer em código.

alter table barbearias
  add column ia_nome text not null default 'Bento',
  add column ia_tom_voz text,
  add column retencao_automatica_ativa boolean not null default false,
  add column retencao_mensagem_template text,
  add column retencao_janela_dias int not null default 2,
  add column atendimento_24h boolean not null default true,
  add column atendimento_hora_inicio time not null default '08:00',
  add column atendimento_hora_fim time not null default '20:00';

comment on column barbearias.ia_tom_voz is
  'Instrução extra de tom de voz, injetada no prompt do sistema. Livre, opcional.';
comment on column barbearias.retencao_mensagem_template is
  'Template da mensagem de retenção automática. Aceita {nome} e {barbearia}. Nulo = usa o texto padrão.';
