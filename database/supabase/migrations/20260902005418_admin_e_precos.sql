-- Suporte a preço "a partir de" nos serviços, e auditoria das ações que um
-- barbeiro/admin faz direto pelo WhatsApp (modo admin da Bento).

alter table servicos
  add column preco_variavel boolean not null default false;

comment on column servicos.preco_variavel is
  'true quando o preço é "a partir de" — o valor final pode mudar na hora do atendimento.';

create table auditoria_admin (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  acao text not null,
  detalhes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_auditoria_admin_barbearia on auditoria_admin(barbearia_id, created_at desc);

alter table auditoria_admin enable row level security;

create policy "auditoria_admin: só da própria barbearia" on auditoria_admin
  for all using (barbearia_id = barbearia_id_do_usuario_atual());
