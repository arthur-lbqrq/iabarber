-- Schema inicial multi-tenant do iabarber.
-- Toda tabela de negócio carrega barbearia_id, e RLS garante que cada barbeiro
-- (logado no painel web via Supabase Auth) só enxerga dados da própria barbearia.
-- O backend (webhook do WhatsApp) usa a service role key, que ignora RLS por padrão
-- do Supabase — a validação de tenant nesse caminho fica a cargo do código do backend.

create extension if not exists "btree_gist";

-- ---------------------------------------------------------------------------
-- barbearias
-- ---------------------------------------------------------------------------
create table barbearias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- barbeiros (cada um vinculado a uma conta do Supabase Auth pra logar no painel)
-- ---------------------------------------------------------------------------
create table barbeiros (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  nome text not null,
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_barbeiros_barbearia on barbeiros(barbearia_id);
create unique index idx_barbeiros_user on barbeiros(user_id) where user_id is not null;

-- Função auxiliar: barbearia do usuário logado no momento.
-- security definer pra poder ler a tabela barbeiros sem entrar em recursão de RLS.
create function barbearia_id_do_usuario_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select barbearia_id from barbeiros where user_id = auth.uid() limit 1;
$$;

-- ---------------------------------------------------------------------------
-- servicos (catálogo: corte, barba, combo etc.)
-- ---------------------------------------------------------------------------
create table servicos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,
  duracao_minutos int not null check (duracao_minutos > 0),
  preco_centavos int not null check (preco_centavos >= 0),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_servicos_barbearia on servicos(barbearia_id);

-- ---------------------------------------------------------------------------
-- horarios_disponiveis (janela semanal recorrente de trabalho de cada barbeiro;
-- os horários vagos de um dia específico são calculados em cima disso, descontando
-- os agendamentos já existentes)
-- ---------------------------------------------------------------------------
create table horarios_disponiveis (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6), -- 0 = domingo
  hora_inicio time not null,
  hora_fim time not null,
  created_at timestamptz not null default now(),
  check (hora_fim > hora_inicio)
);

create index idx_horarios_barbeiro on horarios_disponiveis(barbeiro_id, dia_semana);

-- ---------------------------------------------------------------------------
-- clientes (identificados pelo WhatsApp; o mesmo número pode ser cliente de
-- barbearias diferentes, por isso a unicidade é por barbearia + telefone)
-- ---------------------------------------------------------------------------
create table clientes (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  telefone text not null,
  nome text,
  created_at timestamptz not null default now(),
  unique (barbearia_id, telefone)
);

create index idx_clientes_barbearia on clientes(barbearia_id);

-- ---------------------------------------------------------------------------
-- agendamentos
-- ---------------------------------------------------------------------------
create table agendamentos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  servico_id uuid not null references servicos(id),
  inicio timestamptz not null,
  fim timestamptz not null,
  status text not null default 'confirmado'
    check (status in ('confirmado', 'cancelado', 'concluido', 'no_show')),
  criado_via text not null default 'whatsapp',
  created_at timestamptz not null default now(),
  check (fim > inicio),
  -- impede dois agendamentos confirmados sobrepostos pro mesmo barbeiro
  exclude using gist (
    barbeiro_id with =,
    tstzrange(inicio, fim) with &&
  ) where (status = 'confirmado')
);

create index idx_agendamentos_barbearia on agendamentos(barbearia_id);
create index idx_agendamentos_barbeiro_inicio on agendamentos(barbeiro_id, inicio);
create index idx_agendamentos_cliente on agendamentos(cliente_id);

-- ---------------------------------------------------------------------------
-- planos (definição dos planos de assinatura oferecidos pela barbearia)
-- ---------------------------------------------------------------------------
create table planos (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  nome text not null,
  preco_centavos int not null check (preco_centavos >= 0),
  periodicidade text not null default 'mensal'
    check (periodicidade in ('mensal', 'trimestral', 'anual')),
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_planos_barbearia on planos(barbearia_id);

-- ---------------------------------------------------------------------------
-- assinaturas (vínculo cliente <-> plano; sem cobrança automática no MVP,
-- só o registro de que o cliente está num plano)
-- ---------------------------------------------------------------------------
create table assinaturas (
  id uuid primary key default gen_random_uuid(),
  barbearia_id uuid not null references barbearias(id) on delete cascade,
  cliente_id uuid not null references clientes(id) on delete cascade,
  plano_id uuid not null references planos(id),
  status text not null default 'ativa'
    check (status in ('ativa', 'cancelada', 'expirada')),
  inicio date not null default current_date,
  fim date,
  created_at timestamptz not null default now(),
  check (fim is null or fim >= inicio)
);

create index idx_assinaturas_barbearia on assinaturas(barbearia_id);
create index idx_assinaturas_cliente on assinaturas(cliente_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — leitura/escrita restrita à própria barbearia do
-- barbeiro logado no painel web. O backend do WhatsApp usa a service role key
-- (bypassa RLS por padrão) porque ele mesmo resolve qual barbearia atender
-- a partir do número de WhatsApp de destino.
-- ---------------------------------------------------------------------------
alter table barbearias enable row level security;
alter table barbeiros enable row level security;
alter table servicos enable row level security;
alter table horarios_disponiveis enable row level security;
alter table clientes enable row level security;
alter table agendamentos enable row level security;
alter table planos enable row level security;
alter table assinaturas enable row level security;

create policy "barbearia: só a própria" on barbearias
  for all using (id = barbearia_id_do_usuario_atual());

create policy "barbeiros: só da própria barbearia" on barbeiros
  for all using (barbearia_id = barbearia_id_do_usuario_atual());

create policy "servicos: só da própria barbearia" on servicos
  for all using (barbearia_id = barbearia_id_do_usuario_atual());

create policy "horarios_disponiveis: só da própria barbearia" on horarios_disponiveis
  for all using (barbearia_id = barbearia_id_do_usuario_atual());

create policy "clientes: só da própria barbearia" on clientes
  for all using (barbearia_id = barbearia_id_do_usuario_atual());

create policy "agendamentos: só da própria barbearia" on agendamentos
  for all using (barbearia_id = barbearia_id_do_usuario_atual());

create policy "planos: só da própria barbearia" on planos
  for all using (barbearia_id = barbearia_id_do_usuario_atual());

create policy "assinaturas: só da própria barbearia" on assinaturas
  for all using (barbearia_id = barbearia_id_do_usuario_atual());
