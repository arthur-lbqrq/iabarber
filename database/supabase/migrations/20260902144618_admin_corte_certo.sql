-- Suporte ao painel de admin "Corte Certo" (novo app separado, painel-admin/), que
-- enxerga TODAS as barbearias cadastradas — diferente do painel do barbeiro, que só
-- vê a própria (via barbeiro_id_do_usuario_atual()). Esse painel novo fala com o
-- backend (rota /api/admin/*), que usa a service role key — por isso não precisamos
-- de policies de RLS liberando leitura/escrita cross-tenant pra ninguém: a tabela
-- abaixo fica com RLS ligado e nenhuma policy, bloqueando por padrão qualquer acesso
-- direto via anon/authenticated key (só o service role do backend passa).

create table admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create unique index idx_admins_user on admins(user_id) where user_id is not null;

alter table admins enable row level security;

-- Barbearias podem ser desativadas pelo admin (sem apagar, mesmo padrão de
-- "cancelado"/"ativo" já usado no resto do schema em vez de delete).
alter table barbearias add column ativo boolean not null default true;

-- auditoria_admin (criada pra registrar ações do modo admin via WhatsApp) passa a
-- registrar também ações feitas pelo admin do Corte Certo no painel novo — por isso
-- barbeiro_id vira opcional (uma ação do admin do Corte Certo não tem barbeiro) e
-- ganha a coluna admin_id.
alter table auditoria_admin alter column barbeiro_id drop not null;
alter table auditoria_admin add column admin_id uuid references admins(id) on delete set null;
