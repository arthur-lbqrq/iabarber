-- Evolui as tabelas `planos`/`assinaturas` que já existiam desde a migration inicial
-- (criadas pensando nisso desde o início, mas incompletas): adiciona os estados que a
-- gestão manual de assinatura precisa, os campos que um gateway de pagamento futuro vai
-- usar (sem implementar a integração agora — só a coluna, como pedido), e o vínculo
-- entre plano e os serviços que ele inclui.

-- `assinaturas.status`: state set antigo (ativa/cancelada/expirada) não cobria os
-- estados que o controle manual precisa distinguir (atrasada = pagamento não veio na
-- data mas a assinatura ainda não foi cancelada; pendente = assinatura criada mas
-- ainda não confirmada). Não existiam linhas reais usando o valor antigo 'expirada',
-- então redefinir o conjunto é seguro.
alter table assinaturas drop constraint assinaturas_status_check;
alter table assinaturas add constraint assinaturas_status_check
  check (status in ('ativa', 'atrasada', 'cancelada', 'pendente'));

-- Campos pra plugar um gateway de pagamento depois, sem integração nenhuma agora —
-- só estrutura. `metodo_pagamento` fica livre (texto) de propósito: qual gateway vai
-- ser usado, e que valores esse campo aceita, é decisão de quando a integração
-- existir de verdade.
alter table assinaturas add column metodo_pagamento text;
alter table assinaturas add column id_transacao_externa text;
alter table assinaturas add column proximo_vencimento date;

comment on column assinaturas.metodo_pagamento is
  'Livre por enquanto (ex.: "pix", "cartao") — sem gateway integrado ainda, é só a estrutura pronta pra quando existir.';
comment on column assinaturas.id_transacao_externa is
  'ID da transação no gateway de pagamento, quando existir integração. Nulo enquanto o controle é manual.';
comment on column assinaturas.proximo_vencimento is
  'Data em que a próxima cobrança é esperada — usado pelo admin pra decidir quando marcar como atrasada.';

-- Vínculo plano <-> serviços inclusos (times N pra N: um plano pode incluir vários
-- serviços). Tabela própria em vez de array/coluna solta, mesmo padrão relacional já
-- usado no resto do schema (ex.: horarios_disponiveis é tabela própria, não array).
create table plano_servicos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  plano_id uuid not null references planos(id) on delete cascade,
  servico_id uuid not null references servicos(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (plano_id, servico_id)
);

create index idx_plano_servicos_plano on plano_servicos(plano_id);

alter table plano_servicos enable row level security;

create policy "plano_servicos: só da própria barbearia" on plano_servicos
  for all using (barbearia_id = barbearia_id_do_usuario_atual());
