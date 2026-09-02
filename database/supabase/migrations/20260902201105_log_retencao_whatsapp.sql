-- Log das mensagens automáticas de retenção enviadas via WhatsApp (job da etapa 4 da
-- evolução CashBarber). Existe só pra não disparar mensagem duplicada pro mesmo
-- cliente em execuções seguidas do job — antes de mandar, o job confere se já
-- existe um envio recente pra aquele cliente.

create table mensagens_retencao_enviadas (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  enviado_em timestamptz not null default now()
);

create index idx_retencao_cliente on mensagens_retencao_enviadas(cliente_id, enviado_em desc);

alter table mensagens_retencao_enviadas enable row level security;

create policy "mensagens_retencao_enviadas: só da própria barbearia" on mensagens_retencao_enviadas
  for all using (barbearia_id = barbearia_id_do_usuario_atual());
