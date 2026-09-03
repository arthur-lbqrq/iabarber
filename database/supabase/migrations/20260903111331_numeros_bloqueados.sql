-- Lista de números que a Bento nunca deve responder (ex.: contatos pessoais do
-- número ainda não-dedicado, spam, engano de número). Checado no webhook antes de
-- chamar a IA — mensagem é ignorada silenciosamente, sem gastar chamada nenhuma
-- à Anthropic nem mandar resposta nenhuma de volta.
create table numeros_bloqueados (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  telefone text not null,
  motivo text,
  created_at timestamptz not null default now(),
  unique (barbearia_id, telefone)
);

create index idx_numeros_bloqueados_barbearia on numeros_bloqueados(barbearia_id, telefone);

alter table numeros_bloqueados enable row level security;

create policy "numeros_bloqueados: só da própria barbearia" on numeros_bloqueados
  for all using (barbearia_id = barbearia_id_do_usuario_atual());
