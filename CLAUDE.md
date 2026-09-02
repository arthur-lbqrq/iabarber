# Projeto: iabarber — Sistema de agendamento via WhatsApp com IA (MVP)

## Contexto
MVP de um sistema de agendamento automático pra barbearias via WhatsApp, inspirado no
Cash.IA / CashBarber. O cliente manda mensagem no WhatsApp, uma IA (Claude) interpreta
o pedido, consulta a agenda do barbeiro certo e confirma o horário automaticamente.
Depois evolui pra incluir confirmação, lembrete e coleta de feedback.

Validação de mercado já feita: um barbeiro confirmou interesse real nesse tipo de
sistema. O objetivo agora é construir o MVP técnico, começando pela camada mais barata
e testável: rodar tudo localmente antes de gastar com hospedagem.

## Decisões já tomadas (não reabrir essas discussões)
- **WhatsApp:** Evolution API (open source, self-hosted), rodando via Docker.
- **Banco de dados:** Supabase, mas modelado **multi-tenant desde o início**
  (toda tabela relevante leva uma coluna `barbearia_id`), mesmo validando com 1 barbearia só.
- **Agenda:** cada barbeiro tem sua própria agenda/horários dentro da barbearia.
- **Escopo da IA:** agendamento + venda de planos + coleta de feedback.
- **Pagamento:** modelo-alvo é assinatura recorrente, mas **sem gateway de pagamento
  no MVP**. A estrutura de dados deve prever planos/assinaturas, sem cobrança automática ainda.
- **Painel do barbeiro:** interface web simples, construída por mim, com Supabase Auth.
- **Backend:** Node.js com TypeScript (Express). Escolhido pra unificar linguagem com o
  painel web (provavelmente React) e por ter os SDKs mais maduros de Supabase e Anthropic
  em TS. Não usar Python no backend, mesmo sendo linguagem que domino — decisão já tomada
  pra evitar duplicar contexto entre duas linguagens no mesmo projeto.
- **Hospedagem:** DigitalOcean (mês a mês, sem contrato longo), mas **etapas pagas ficam
  por último** — validar tudo local primeiro.
- **Estado atual:** ambiente 100% local (notebook Ubuntu agora, PC Windows depois).
  Nada em produção ainda.

## Prioridade de custos
Decisão explícita: construir o máximo possível sem gastar dinheiro, e isolar as etapas
pagas pro final, só quando o resto já estiver validado.

- **Grátis (fazer primeiro):** Evolution API local (Docker), Supabase (local via CLI,
  depois tier gratuito quando for pra nuvem), backend rodando local, painel web rodando
  local, toda a lógica de agendamento construída com regras simples (if/else / detecção
  de palavra-chave) no lugar da IA.
- **Pago (deixar por último, só ativar quando o resto já estiver funcionando):**
  chamadas reais à API da Anthropic (não tem tier gratuito, cobra desde a primeira
  chamada — ver custo estimado abaixo) e hospedagem na DigitalOcean (VPS).
- **Custo estimado da API da Anthropic:** pra volume de teste/MVP, tende a ficar na
  casa de centavos de dólar. Usar Haiku ou Sonnet 5 (não Opus) pra manter custo baixo.
  Configurar limite de gasto no console da Anthropic antes de ativar (ex.: US$5) como
  trava de segurança.

## Roteiro de construção (ordem)
1. Subir a Evolution API localmente via Docker, conectar um WhatsApp de teste, confirmar
   envio/recebimento de mensagem via webhook. **[Feito]**
2. Modelar o banco multi-tenant no Supabase (barbearias, barbeiros, servicos,
   horarios_disponiveis, agendamentos, clientes, planos, assinaturas) com Row Level
   Security. **[Feito, local via Supabase CLI]**
3. Construir o núcleo do backend com lógica SIMPLES (sem IA ainda): webhook recebe
   mensagem → regras básicas (palavra-chave/regex) decidem a ação → tools
   (consultar_horarios_disponiveis, criar_agendamento, cancelar_agendamento) executam
   contra o Supabase. Objetivo: validar o fluxo de dados de ponta a ponta sem custo.
4. Testar o fluxo de agendamento ponta a ponta com a lógica simples, incluindo casos de
   borda (horário ocupado, cancelamento, remarcação).
5. Construir o painel web básico do barbeiro (login, definir horários, ver agenda do dia).
6. Só depois de 1-5 estarem funcionando: trocar a lógica simples pela IA real (Claude
   com function calling), usando a API paga da Anthropic. Esta é a primeira etapa com
   custo real do projeto.
7. Adicionar confirmação automática, lembrete e feedback pós-atendimento (usando a IA
   já ativa).
8. Validar em produção com o barbeiro real por 2-4 semanas antes de pensar em escalar
   pra outras barbearias (só aí decidir sobre VPS/hospedagem paga — última etapa com custo).

## Estrutura de pastas do projeto
```
iabarber/
├── CLAUDE.md                      # este arquivo
├── README.md                      # visão geral pra uso futuro
├── .gitignore
│
├── evolution-api/
│   └── docker-compose.yml         # já criado
│
├── backend/                       # webhook + lógica da IA (Node.js + TypeScript)
│   ├── src/
│   │   ├── webhook/                 # recebe eventos da Evolution API
│   │   │   ├── whatsapp.ts            # rota que recebe messages.upsert e responde
│   │   │   └── evolutionClient.ts     # envia mensagem de volta via Evolution API
│   │   ├── tools/                   # funções que o Claude vai chamar via function calling
│   │   │   ├── consultarHorarios.ts   # calcula slots livres (janela - agendamentos)
│   │   │   ├── criarAgendamento.ts    # cria cliente se preciso + insere agendamento
│   │   │   └── cancelarAgendamento.ts
│   │   ├── ai/                      # integração com a API do Claude (Anthropic SDK)
│   │   │   └── claude.ts
│   │   ├── supabase/                # cliente do Supabase (service role, bypassa RLS)
│   │   │   └── client.ts
│   │   └── config/
│   │       └── env.ts                 # carrega e valida as variáveis de ambiente
│   ├── .env / .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── database/                      # tudo relacionado ao Supabase
│   ├── package.json                 # fixa a versão do Supabase CLI como dev dependency
│   └── supabase/                    # convenção do próprio Supabase CLI (`supabase init`)
│       ├── config.toml                # portas, versão do Postgres etc. (ambiente local)
│       ├── migrations/                # SQL versionado das tabelas (multi-tenant)
│       │   └── ..._schema_inicial.sql
│       └── seed.sql                   # dados de teste (barbearia fake, barbeiro fake)
│
├── painel-web/                    # frontend do barbeiro (React + TypeScript)
│   ├── src/
│   └── package.json
│
├── painel-admin/                  # painel do admin do Corte Certo (React + TypeScript)
│   ├── src/                         # cross-tenant: enxerga/gerencia TODAS as barbearias
│   └── package.json                 # fala com backend/src/api/admin.ts, nunca com o Supabase direto
│
├── landing/                       # landing page pública de marketing (React + TypeScript)
│   ├── src/
│   │   └── components/               # Nav, Hero, ConversaAnimada, ProvaEmUso, CtaFinal etc.
│   └── package.json
│
└── docs/
    └── decisoes.md                  # registro de decisões de arquitetura
```

`landing/` é um projeto separado de `painel-web` de propósito — é site público de marketing
(sem login), enquanto `painel-web` é a ferramenta autenticada do dono da barbearia. Mesma
stack (Vite + React + TS) e mesmos tokens de design, mas deploys/públicos diferentes faz
sentido no futuro (ex.: `cortecerto.com` vs `app.cortecerto.com`).

`painel-admin/` (criado em 2026-09-02) é um terceiro projeto separado, também de propósito:
`painel-web` é escopado a **uma** barbearia (o barbeiro logado só vê a própria, via RLS);
`painel-admin` é **cross-tenant** (você, dono do Corte Certo, vendo/gerenciando todas as
barbearias cadastradas). Justamente por enxergar tudo, ele não fala com o Supabase direto
como o `painel-web` faz — passa pelo `backend` (rotas `/api/admin/*`), que confirma que
quem está logado é mesmo um admin (tabela `admins`, separada de `barbeiros`) antes de usar
a service role key. Login separado do login de barbeiro-admin da Barbearia Piloto, de
propósito — são papéis diferentes.

**Nota:** a estrutura de `database/` acima é ligeiramente diferente do desenho original
deste arquivo — em vez de `database/migrations/` direto, ficou `database/supabase/migrations/`
porque é a convenção fixa do Supabase CLI (`supabase init`/`supabase start`/`supabase db reset`
esperam essa estrutura pra funcionar sem configuração extra). O motivo de usar o CLI em vez de
só escrever SQL solto: ele sobe o Postgres local com as mesmas extensões/comportamento do
Supabase de produção (auth.uid(), RLS, etc.), o que é necessário pra testar as políticas de
Row Level Security de verdade.

Esta pasta atual (`evolution-api-mvp` ou equivalente) deve ser renomeada/movida pra
`iabarber/evolution-api/`, com este `CLAUDE.md` subindo pra raiz do projeto (`iabarber/CLAUDE.md`).

## Nome da IA
**Bento** — nome humano, caloroso, fácil de lembrar, sem colidir com nomes dos barbeiros
cadastrados (Igor, Tinho). Usar esse nome no system prompt e nas mensagens de
apresentação ("Oi, eu sou o Bento, assistente da [nome da barbearia]...").

## Dados da barbearia piloto (seed inicial)
**Barbeiros:** Igor, Tinho

**Horário de funcionamento:**
- Segunda a sexta: 9h às 18h
- Sábado: 9h às 12h
- Domingo: fechado

**Serviços** (campo `preco_variavel` = true quando o valor é "a partir de", pois o
preço final pode mudar na hora do atendimento):
| Serviço | Preço | Duração | Preço variável |
|---|---|---|---|
| Barboterapia | R$20,00 | 30 min | não |
| Bigode | R$5,00 | 15 min | não |
| Botox | R$40,00 (a partir de) | 60 min | sim |
| Cabelo e Barba | R$40,00 | 60 min | não |
| Corte de cabelo | R$25,00 | 45 min | não |
| Hidratação | R$10,00 | 15 min | não |
| Limpeza de pele | R$15,00 | 15 min | não |
| Luzes | R$60,00 | 120 min | não |
| Pigmentação | R$30,00 (a partir de) | 30 min | sim |
| Platinado | R$100,00 (a partir de) | 150 min | sim |
| Progressiva | R$50,00 (a partir de) | 60 min | sim |
| Relaxamento | R$25,00 (a partir de) | 30 min | sim |
| Sobrancelha | R$10,00 | 15 min | não |

**[Ainda não aplicado ao banco]** — o seed atual em `database/supabase/seed.sql` continua
com os dados fictícios (`Barbearia Teste`, `Zé da Navalha`, 3 serviços). Trocar pelos dados
reais acima (2 barbeiros, 13 serviços, `preco_variavel` é uma coluna nova que não existe
ainda em `servicos`) é trabalho pendente — não fiz sozinho porque é uma mudança de dados
real que vale confirmar antes.

## Funcionalidade de admin via WhatsApp (dono/barbeiro fala direto com a IA)
Decisão de arquitetura: o dono/barbeiro pode gerenciar a barbearia direto pelo WhatsApp,
sem precisar abrir o painel web, falando com a mesma Bento — mas com um "modo" diferente.

- O backend reconhece o número de quem manda mensagem. Se for um número cadastrado como
  barbeiro/admin daquela barbearia, ativa o modo admin em vez do modo cliente.
- Modo admin tem tools próprias, separadas das tools de cliente:
  `consultar_agenda_completa`, `atualizar_horario_funcionamento`, `atualizar_servico`,
  `atualizar_valor_servico`. O modelo NUNCA deve ter acesso a essas tools quando o
  número não é de um admin cadastrado — a permissão é verificada no backend, não
  confiada ao comportamento do modelo.
- Ações sensíveis (mudar preço, fechar agenda) exigem uma etapa de confirmação explícita
  antes de gravar no banco.
- Toda alteração feita via IA no modo admin deve gerar um registro de auditoria
  (quem mudou, o quê, quando).

**[Ainda não implementado]** — nenhuma tool de admin, verificação de número ou tabela de
auditoria existe ainda no código. Fica pra quando você confirmar que quer construir isso
(é escopo grande: tools novas, tabela de auditoria nova, fluxo de confirmação).

## Migração futura: WhatsApp Business API oficial (antes do primeiro cliente pago)
Decisão: a Evolution API (não-oficial, via Baileys) é aceitável pro MVP e validação
com a barbearia piloto (baixo volume = baixo risco de ban). Mas **antes de vender o
sistema pra qualquer barbearia/cliente pagante de verdade**, migrar a integração de
WhatsApp pra API oficial da Meta (Cloud API) deixa de ser opcional.

**Motivo:** a Evolution API simula um cliente WhatsApp não-oficial, o que é
tecnicamente contra os termos de uso da Meta e carrega risco real de restrição/ban do
número — risco que não pode recair sobre o WhatsApp de um cliente pagante.

**Paridade funcional esperada ao migrar (não deve travar nenhuma feature core):**
- Toda conversa **iniciada por humano** (cliente pedindo agendamento, barbeiro em modo
  admin pedindo pra mudar serviço/valor/horário) continua 100% igual: texto livre
  gerado pela IA, function calling completo, sem restrição — abre uma janela de
  atendimento de 24h a partir da mensagem do humano.
- Só mensagens **proativas** (iniciadas pelo sistema, sem gatilho humano recente) mudam
  de formato: lembrete automático 24h antes do horário e pedido de feedback pós-
  atendimento precisam usar **templates pré-aprovados** pela Meta em vez de texto
  livre gerado na hora — mas os templates podem ter variáveis dinâmicas (nome do
  cliente, horário, serviço). Assim que o cliente responde ao template, a janela
  reabre e a conversa volta a ser 100% livre.

**O que a migração exige (documentar quando chegar a hora, não fazer agora):**
- Verificação de um Meta Business Manager (CNPJ)
- Registro de número dedicado especificamente pra API (não pode ser usado no app
  comum do WhatsApp depois)
- Criação e aprovação de templates de mensagem pra lembrete e feedback
- Ajuste de custo: cobrança por conversa após cota gratuita mensal (variável por
  categoria/país) — precisa entrar na conta de custos mensais recorrentes do projeto

## Número de WhatsApp e horário de funcionamento da IA
- **Número dedicado:** a Bento roda num número de WhatsApp **separado e dedicado**,
  divulgado como "WhatsApp de agendamento" — NUNCA o número principal/já estabelecido
  que a barbearia já usa pra falar com clientes. Motivo: se o número conectado via
  Evolution API sofrer qualquer restrição/ban, o impacto fica isolado no bot, sem
  derrubar a comunicação principal da barbearia com os clientes dela.
  **[Ainda não aplicado]** — o número de teste conectado hoje (`558193552338`) é o
  seu próprio WhatsApp pessoal, não um número dedicado novo. Trocar pra um número
  dedicado de verdade é decisão sua de quando fazer (precisa de um chip novo).
- Os barbeiros (Igor, Tinho) falam com a Bento em modo admin a partir dos próprios
  números pessoais deles — não precisam ser números "públicos" da barbearia.
- **Horário de funcionamento da IA:** revertido em 2026-09-02 — a IA responde 24/7 agora,
  sem restrição de horário (decisão original de 8h-20h ficou só um tempo, ver Log de
  progresso pro histórico de por que existiu e por que foi removida).

## Onde estamos agora
Passos 1 e 2 do roteiro feitos (Evolution API conectada a um WhatsApp real de teste;
banco multi-tenant modelado e testado local via Supabase CLI). Agora no passo 3:
construir o núcleo do backend com regras simples (sem IA/custo), usando as tools que já
existem e já foram testadas isoladamente.

## Sua tarefa agora
1. Implementar a camada de decisão por regras (palavra-chave/regex) em
   `backend/src/regras/`, ligando-a no webhook no lugar da chamada ao Claude (que fica
   guardada em `src/ai/claude.ts`, intocada, pro passo 6 quando a chave da Anthropic
   for ativada).
2. Testar o fluxo ponta a ponta com a lógica simples — incluindo os casos de borda do
   passo 4 do roteiro (horário ocupado, cancelamento) — sem precisar reconectar o
   WhatsApp real de novo (usar requisição sintética ao backend local é suficiente e
   mais seguro pra não mexer na sessão já conectada).
3. Se sobrar tempo/escopo, avançar pro passo 5 (painel web básico do barbeiro).
4. Ir documentando no "## Log de progresso" o que foi feito e o que falta, pra retomar
   de onde parou tanto por aqui quanto pelo Claude.ai.

## Log de progresso

### 2026-09-01
- **Estrutura de pastas criada** em `/home/art/iabarber/` seguindo exatamente o que está
  descrito acima (`backend/src/{webhook,tools,ai,supabase,config}`, `backend/tests`,
  `database/{migrations,seed}`, `painel-web/src`, `docs`, `evolution-api`). Os arquivos
  de código (package.json, tsconfig.json, migrations, etc.) ainda **não** existem —
  só as pastas. Isso fica pro passo 3 do roteiro (núcleo do webhook + IA).
- **Docker verificado:** Docker Engine 29.1.3 já estava instalado e funcionando
  (usuário `art` já no grupo `docker`, sem precisar de sudo pra usar).
- **Docker Compose corrigido:** o `docker-compose` v1 (`/usr/bin/docker-compose`, Python)
  estava quebrado — Python 3.12 removeu o módulo `distutils` que o v1 dependia, então
  todo comando falhava com `ModuleNotFoundError`. Como não havia o pacote
  `docker-compose-v2` do apt instalado e o `sudo apt-get install` pediu senha
  interativa (não disponível neste ambiente automatizado), instalei o plugin oficial
  `docker compose` v2 (v5.5.0) direto do GitHub releases em `~/.docker/cli-plugins/docker-compose`
  — é a forma oficial de instalar sem precisar de root, porque o Docker procura
  plugins de CLI tanto em `/usr/libexec/docker/cli-plugins` (todo o sistema) quanto em
  `~/.docker/cli-plugins` (por usuário). **Se você trocar de máquina/perfil, pode
  precisar repetir esse passo** (ou aí sim rodar `sudo apt-get install docker-compose-v2`
  com senha em mãos, que é a via mais "oficial" via pacote do sistema).
- **`evolution-api/docker-compose.yml` criado do zero** (não existia um anterior nesta
  pasta, ao contrário do que o texto acima do CLAUDE.md pressupunha). Baseado no
  compose oficial do repositório `EvolutionAPI/evolution-api`, mas simplificado pra
  uso local:
  - Removi a rede `dokploy-network` (externa, específica de quem hospeda via Dokploy —
    não existe localmente e faria o `up` falhar).
  - Removi o container `frontend` (evolution-manager separado): a própria Evolution API
    já serve um manager embutido em `http://localhost:8080/manager`
    (`SERVER_DISABLE_MANAGER=false`), então um segundo container pra isso seria redundante
    no MVP.
  - Postgres e Redis internos da Evolution API **não têm porta publicada no host**
    (só `expose`), evitando colisão com outros projetos seus que já usam a porta 5432
    (ex.: container `faro-test-pg` de outro projeto, que segue intocado).
  - Porta 8080 publicada só em `127.0.0.1:8080:8080` (não expõe pra rede, só localhost).
  - Nomes dos containers prefixados com `iabarber_` pra não colidir com os de outros
    projetos que você já tem rodando neste notebook.
  - Este Postgres é **interno da Evolution API** (guarda instâncias, mensagens, contatos
    do WhatsApp) — é totalmente separado do Supabase que vai guardar os dados do
    negócio (barbearias, agendamentos etc.), conforme decisão já tomada.
- **`.env` criado** em `evolution-api/.env` com:
  - `AUTHENTICATION_API_KEY` gerada com `openssl rand -hex 24` (valor real, não o
    placeholder `BQYHJGJHJ` do exemplo oficial).
  - Senha do Postgres interno gerada com `openssl rand -base64 24` (filtrada pra só
    caracteres alfanuméricos, pra evitar problema de escaping na connection string).
  - Integrações externas (Chatwoot, Typebot, OpenAI, S3, RabbitMQ etc.) todas desligadas
    — não precisamos delas agora.
  - `TELEMETRY_ENABLED=false` — desliguei o envio de telemetria anônima pra Evolution API,
    já que é ambiente de teste.
  - **Este arquivo tem credenciais reais e está no `.gitignore`** — não vai pro Git.
  - Criei também `evolution-api/.env.example` (sem segredos, com placeholders) pra
    versionar como referência de quais variáveis existem.
- **`.gitignore` criado** na raiz do projeto, cobrindo `node_modules`, `.env` (raiz e
  `evolution-api/.env`), builds e afins.
- **Containers no ar:** `docker compose up -d` rodou sem erros. As 3 imagens
  (`evoapicloud/evolution-api:latest`, `postgres:15-alpine`, `redis:7-alpine`) foram
  baixadas, as migrations do Prisma rodaram automaticamente no primeiro start
  ("All migrations have been successfully applied"), e os 3 containers estão `Up`:
  `iabarber_evolution_api`, `iabarber_evolution_postgres`, `iabarber_evolution_redis`.
- **API confirmada respondendo** em `http://localhost:8080`:
  - `GET /` → `{"status":200,"message":"Welcome to the Evolution API...","version":"2.3.7",...}`
  - `GET /instance/fetchInstances` sem header `apikey` → `401` (autenticação funcionando).
  - Mesmo endpoint com header `apikey: <a chave gerada>` → `200` com `[]` (lista vazia de
    instâncias, esperado — ainda não criamos nenhuma).
- **Parado aqui de propósito**, conforme instrução: nenhuma instância de WhatsApp foi
  criada, nenhum QR code foi gerado, nenhum número real foi conectado.

### Próximos passos (retomar daqui)
1. Você decide/confirma se quer conectar um WhatsApp de teste agora (vai gerar QR code
   real — passo que eu deixei pra você autorizar explicitamente).
2. Modelar o banco multi-tenant no Supabase (passo 1 do roteiro) — ainda não foi feito;
   as pastas `database/migrations` e `database/seed` estão criadas mas vazias.
3. Iniciar o `backend/` (package.json, tsconfig.json, cliente Supabase, integração
   Anthropic) — pastas já criadas, sem código ainda.

### 2026-09-01 (continuação) — tentativa de conectar WhatsApp real, sem sucesso ainda
Autorizado por você a criar uma instância de teste e conectar seu WhatsApp pessoal
(`5581993552338`), ciente do risco de banimento por API não-oficial.

- **Instância criada:** `iabarber-teste` (via `POST /instance/create`), integração
  `WHATSAPP-BAILEYS`.
- **QR code:** gerado e escaneado por você, mas o WhatsApp recusou com
  "não é possível conectar novos dispositivos nesse momento".
- **Pairing code (tentativa 2):** descobri que `/instance/connect` **ignora o parâmetro
  `number`** quando a instância já está em estado `connecting` (bug/comportamento da
  Evolution API — só usa o número se o estado for `close`). Fiz `DELETE /instance/logout`
  pra forçar o estado, e aí sim consegui gerar um pairing code de verdade (`YAQZ-9ATE`,
  número repassado corretamente pro Baileys, confirmado no log `Phone number: 5581993552338`).
- **Resultado do pairing code:** celular ficou preso em "conectando..." e não avançou.
  Aumentei o `LOG_LEVEL` do `.env` pra incluir `DEBUG,WEBSOCKET,DARK` (era só
  `ERROR,WARN,INFO`) e reiniciei o container da API pra capturar mais detalhe — os dados
  da instância não foram perdidos (ficam no Postgres, não no container).
- **Causa raiz encontrada nos logs:** entre a geração do pairing code e a desconexão, a
  biblioteca Baileys (que fala o protocolo do WhatsApp) lançou 4x o erro
  `Error: Invalid buffer` ao processar notificações recebidas (`messages-recv.js:740`,
  `toRequiredBuffer`) — erro de parsing do protocolo, não de rede. Segundos depois, o
  WhatsApp encerrou a conexão com **HTTP 401 "Connection Failure"**
  (`disconnectionReasonCode: 401` no banco). Ou seja: o pareamento nunca completou porque
  nosso lado não conseguiu processar corretamente as notificações que o WhatsApp mandou
  durante o handshake.
- **Diagnóstico da causa raiz:** a imagem `evoapicloud/evolution-api:latest` que estamos
  usando foi publicada em **06/05/2026** (quase 4 meses atrás, apesar do nome "latest").
  O código busca a versão *atual* do protocolo do WhatsApp Web dinamicamente
  (`fetchLatestWaWebVersion()`), mas a biblioteca Baileys `v7.0.0-rc.9` **compilada dentro
  da imagem** (também de maio) não sabe interpretar campos que o WhatsApp já mudou desde
  então — drift de protocolo.
- **Tentativa de correção — imagem `homolog`:** troquei a tag no `docker-compose.yml` pra
  `evoapicloud/evolution-api:homolog` (publicada 14/07/2026, mais recente). **Não
  funcionou:** essa imagem é a versão `2.4.0` e tem um bug real de empacotamento — a etapa
  de migração do Prisma falha com `Error: The datasource.url property is required in your
  Prisma config file when using prisma migrate deploy`, e o container ficou em
  **crash-loop** (reiniciando sem parar, API fora do ar). Não tentei consertar isso por
  dentro do container (seria remendar um build pré-lançamento de terceiros, frágil e fora
  de escopo pro MVP). **Revertido para `evoapicloud/evolution-api:latest`**, que voltou a
  responder normalmente e manteve os dados da instância intactos (Postgres não foi tocado
  em nenhum momento dessa troca de imagem).
- **Estado atual:** de volta à imagem `latest` (v2.3.7), API saudável, instância
  `iabarber-teste` existe mas com `connectionStatus: close` (não conectada). Nenhum
  WhatsApp real ficou vinculado.
- **Por que parei aqui:** já foram ~5 tentativas de vínculo (3 QR codes + 1 pairing code +
  a tentativa que falhou com 401) em menos de 30 minutos. Continuar tentando em sequência
  aumenta o risco de o WhatsApp marcar o número como suspeito por mais tempo — o "não é
  possível conectar novos dispositivos" que você viu na primeira tentativa já é, por si
  só, um sinal de bloqueio temporário do lado do WhatsApp, independente do bug de
  protocolo que achei depois.

### 2026-09-01 (conclusão) — CONECTADO com sucesso + ponte validada
Você optou por tentar mais uma vez no `latest` em vez de esperar. Deu certo:

- **Novo pairing code gerado** (`QK3638YT`) com a instância já em estado `close`
  (não precisou logout de novo). Você inseriu no celular e funcionou — sem repetir o
  bug do "Invalid buffer" dessa vez (confirma que era intermitente, ligado a qual
  notificação específica o WhatsApp manda durante aquele handshake específico).
- **Conexão confirmada via API** (não só pela tela do celular):
  - `GET /instance/connectionState/iabarber-teste` → `"state": "open"`
  - `GET /instance/fetchInstances` → `"connectionStatus": "open"`,
    `"ownerJid": "558193552338@s.whatsapp.net"`
  - Curiosidade: o WhatsApp normalizou o número — você digitou `5581993552338` (com o
    "9" extra do celular), mas o JID final ficou `558193552338` (sem o 9). É uma regra
    de numeração de celulares no Brasil que o próprio WhatsApp aplica; guarde essa forma
    sem o 9 se for usar esse número em chamadas futuras da API (`/message/sendText`, etc.).
  - **Contagem imediata após conectar:** `1567 contatos`, `312 chats`, `10438 mensagens`
    já sincronizados pro Postgres local — isso é comportamento padrão do protocolo
    multi-dispositivo do WhatsApp (sincroniza contatos/conversas recentes ao linkar um
    novo aparelho), não é nada que pedimos explicitamente. **Fique ciente:** a partir de
    agora, o Postgres em `iabarber_evolution_postgres` guarda uma cópia real do seu
    histórico de conversas do WhatsApp pessoal. Trate esse ambiente com o mesmo cuidado
    que trataria o próprio celular.
- **Teste de ponte (envio + recebimento) — feito uma única vez, como pedido:**
  - Subi um receptor de webhook **descartável** (container `python:3.12-alpine` rodando
    um servidor HTTP mínimo inline, na mesma rede Docker `evolution-api_evolution-net`)
    só pra capturar UM evento e confirmar que a ponte funciona — isso não é o backend
    real, é só uma ferramenta de diagnóstico temporária.
  - Configurei `WEBHOOK_GLOBAL_URL`/`WEBHOOK_GLOBAL_ENABLED=true` temporariamente no
    `.env`, recreei o container da API.
  - Enviei UMA mensagem de teste via `POST /message/sendText/iabarber-teste` pro seu
    próprio número (mensagem "pra você mesmo", não incomoda nenhum contato).
  - **Confirmado nos dois sentidos:**
    - Evento `send.message` chegou no webhook com o conteúdo exato da mensagem enviada
      (confirma o lado de **envio** da ponte).
    - Evento `messages.upsert` também chegou — mas essa foi uma mensagem **real**, de um
      grupo do WhatsApp que você participa (não foi gerada por nós). Isso confirma o
      lado de **recebimento** da ponte, só que com o efeito colateral de já ter
      capturado conteúdo real de uma conversa sua no log do container temporário.
  - **Reação imediata:** parei e removi o container receptor na hora
    (`docker rm -f iabarber_webhook_catcher`) assim que confirmei os dois eventos, pra
    não continuar capturando mais tráfego real. Voltei `WEBHOOK_GLOBAL_ENABLED=false` no
    `.env` e recriei o container da API — nenhum webhook está ativo agora.
  - **Ponto de atenção pra quando o backend de verdade for construído:** o
    `messages.upsert` vem com o payload completo (nome do contato/grupo, foto de perfil,
    conteúdo, mídia em base64/bytes) — o backend real vai precisar filtrar/tratar isso
    com cuidado (LGPD, dados de terceiros que nem são seus clientes ainda).
- **Estado final desta sessão:**
  - 3 containers `Up`, imagem `evoapicloud/evolution-api:latest` (v2.3.7).
  - Instância `iabarber-teste` com `connectionStatus: open`, WhatsApp pessoal
    (`558193552338`) vinculado e ativo.
  - Webhook desligado (`WEBHOOK_GLOBAL_ENABLED=false`) — nenhum evento está sendo
    entregue a lugar nenhum agora.
  - `LOG_LEVEL` do `.env` ficou em `ERROR,WARN,INFO,DEBUG,WEBSOCKET,DARK` (mais verboso
    do que o padrão original) — útil pra depuração, pode voltar a
    `ERROR,WARN,INFO` mais pra frente se o volume de log incomodar.
  - Instância de teste **não foi apagada** — se quiser recomeçar do zero mais tarde,
    é `DELETE /instance/delete/iabarber-teste` (apaga a sessão E o histórico
    sincronizado do Postgres).
- **Parado aqui de propósito, sem seguir pro backend:** confirmar a ponte funcionando
  era o objetivo deste passo. Próximo passo real do roteiro (passo 3: núcleo do
  webhook + Claude com function calling) só começa quando você confirmar.

### 2026-09-01 (continuação) — banco de dados + tools, enquanto a API key da Anthropic
não chegava. Você autorizou seguir com outras partes do projeto nesse meio-tempo, então
pulei pro **passo 1 do roteiro** (modelar o banco) e adiantei parte do passo 3 (as *tools*
que não dependem do Claude).

- **Supabase local (via CLI, sem precisar de conta/projeto na nuvem ainda):**
  - `database/package.json` fixa o Supabase CLI (`^2.116.0`) como dev dependency —
    rodar sempre via `npx supabase ...` dentro de `database/`, não precisa instalar global.
  - `npx supabase init` criou `database/supabase/` (config, pasta de migrations, seed) —
    ver a nota na seção "Estrutura de pastas" acima sobre por que ficou aninhado assim.
  - `npx supabase start` subiu a stack local inteira em Docker (Postgres 17 + Auth +
    PostgREST + Studio + Realtime + Storage + etc., ~11 containers, nomes
    `supabase_*_database`). Portas locais:
    - Postgres: `127.0.0.1:54322` (usuário/senha `postgres`/`postgres`)
    - API REST: `http://127.0.0.1:54321`
    - Studio (interface visual do banco): **http://127.0.0.1:54323** — útil pra você
      explorar as tabelas visualmente sem escrever SQL.
    - As chaves (`ANON_KEY`, `SERVICE_ROLE_KEY`) são os valores padrão de demo do
      Supabase local — os mesmos em qualquer projeto local, não são segredo.
  - Nenhuma dessas portas conflita com o Postgres da Evolution API (que não expõe porta
    pro host) nem com o `faro-test-pg` de outro projeto seu (porta 5432).
- **Migration inicial** (`database/supabase/migrations/..._schema_inicial.sql`): as 8
  tabelas do roteiro (`barbearias`, `barbeiros`, `servicos`, `horarios_disponiveis`,
  `clientes`, `agendamentos`, `planos`, `assinaturas`), todas com `barbearia_id` e RLS
  habilitado. Pontos de decisão que valem registrar:
  - **RLS:** política padrão em cada tabela restringe leitura/escrita à barbearia do
    usuário logado (via função `barbearia_id_do_usuario_atual()`, que resolve
    `auth.uid()` → `barbeiros.user_id` → `barbearia_id`). Isso protege o **painel web**
    (login do barbeiro). O **backend do WhatsApp usa a service role key**, que ignora
    RLS de propósito — ele mesmo decide qual barbearia atender a partir do número de
    destino, então RLS nesse caminho seria redundante.
  - **Trava anti-conflito de horário direto no banco:** constraint
    `exclude using gist (barbeiro_id with =, tstzrange(inicio, fim) with &&) where
    (status = 'confirmado')` (precisa da extensão `btree_gist`, já habilitada na
    migration). Testei manualmente: inserir dois agendamentos sobrepostos pro mesmo
    barbeiro **falha com erro do Postgres**, mesmo sem nenhuma validação no código —
    é a garantia mais forte possível contra overbooking (não depende do backend
    lembrar de checar).
  - `horarios_disponiveis` modela a **janela recorrente semanal** de cada barbeiro
    (dia da semana + hora início/fim), não horários avulsos — os horários vagos de um
    dia específico são calculados em cima disso na hora da consulta.
  - `database/supabase/seed.sql`: uma barbearia fake ("Barbearia Teste"), um barbeiro
    fake ("Zé da Navalha") trabalhando terça a sábado das 9h às 19h, 3 serviços
    (Corte/Barba/Corte+Barba) e 1 plano de exemplo.
- **As 3 tools do `backend/src/tools/` já têm lógica real** (antes eram só nomes na
  estrutura de pastas):
  - `consultarHorarios.ts`: pega a janela de trabalho do dia (por `dia_semana`), gera
    slots a cada 15 minutos, descarta os que colidem com agendamentos confirmados.
  - `criarAgendamento.ts`: acha ou cria o cliente (por `barbearia_id` + telefone),
    calcula o horário de fim a partir da duração do serviço, insere o agendamento.
    Se colidir com outro (a trava do banco descrita acima), retorna
    `{ ok: false, motivo: 'horario_ocupado' }` em vez de deixar a exceção estourar —
    o código Postgres da trava é `23P01` (exclusion_violation).
  - `cancelarAgendamento.ts`: marca `status = 'cancelado'` (não apaga a linha).
  - **Testei as três de ponta a ponta** com um script descartável (rodado e depois
    apagado): consultei horários livres, criei um agendamento às 10h, tentei criar
    outro sobreposto às 10h15 (rejeitado certo), confirmei que 10h e 9h45 sumiram da
    lista de livres e 10h30 continuou disponível, cancelei, e o 10h voltou a aparecer
    como livre. Tudo bateu com o esperado.
  - Depois do teste, rodei `supabase db reset` pra voltar o banco pro estado limpo do
    seed (sem o agendamento de teste).
- **`backend/src/supabase/client.ts` criado** (cliente do Supabase pro backend, usando
  a service role key). **Pegadinha encontrada:** Node 20 não tem `WebSocket` nativo, e o
  cliente do supabase-js exige um construtor de WebSocket mesmo sem usarmos recursos de
  realtime — instalei o pacote `ws` e passei como `transport` explícito
  (`realtime: { transport: WebSocket as never }` — o `as never` é porque os tipos do
  pacote `ws` não batem 100% com o que o supabase-js espera; é o workaround documentado
  pela própria comunidade do Supabase, não gambiarra minha).
- **`backend/.env`** ganhou `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (valores locais
  acima).
- **Ainda faltando (bloqueado pela API key da Anthropic):** ligar as tools no loop de
  function calling do Claude dentro de `src/ai/claude.ts` — hoje ele só manda uma
  mensagem simples pro Claude, sem nenhuma ferramenta disponível. Esse é o passo 6 do
  roteiro, deixado pra quando as etapas grátis (1-5) estiverem validadas.

### 2026-09-01 (continuação) — motor de regras (passo 3), sem IA, e webhook ligado ao vivo
Você editou este arquivo adicionando a seção "Prioridade de custos" e um roteiro
revisado: construir tudo com regras simples primeiro, só trocar pelo Claude depois de
validado (passo 6). Também limpei uma duplicação que tinha ficado neste `CLAUDE.md`
(o arquivo tinha o conteúdo inteiro colado duas vezes por engano).

- **`env.ts` ajustado:** `ANTHROPIC_API_KEY` deixou de ser obrigatória pra o backend
  subir — agora é opcional, porque o caminho ativo (`regras/motor.ts`) não depende dela.
  `src/ai/claude.ts` continua existindo intocado, só aguardando o passo 6.
- **`backend/src/config/barbearia.ts` criado:** como só existe uma barbearia/barbeiro
  (os do seed), as regras usam esses IDs fixos por enquanto. Quando houver mais de uma
  instância de WhatsApp, isso vira uma tabela de mapeamento "número de destino →
  barbearia_id" resolvida no início do webhook.
- **`backend/src/tools/buscarAgendamentoCliente.ts` criado:** busca o próximo
  agendamento confirmado de um cliente pelo telefone (usado pelo comando "cancelar").
- **`backend/src/regras/motor.ts` — o motor de decisão por palavra-chave/regex:**
  comandos reconhecidos: `servicos`, `horarios` / `horarios amanha`, `agendar DD/MM
  HH:MM`, `cancelar`; qualquer outra coisa cai no menu de ajuda. Ponto técnico que vale
  registrar: o cálculo de data usa um formatador de data **local** (não
  `toISOString().slice(0,10)`), porque `toISOString()` converte pra UTC e podia acertar
  o dia errado dependendo da hora (Brasil é UTC-3, então isso quebraria perto da meia-noite).
- **`backend/src/webhook/whatsapp.ts` religado:** trocou a chamada de `gerarResposta`
  (Claude) por `decidirResposta` (regras). O código do Claude não foi apagado, só
  desconectado do fluxo ativo.
- **Testado de duas formas:**
  1. Direto (`decidirResposta` chamado num script descartável): menu, serviços,
     horários, agendar, conflito de horário, cancelar, cancelar de novo — tudo bateu.
  2. **Ponta a ponta de verdade:** subi o backend (`npx tsx src/index.ts`, rodando em
     background na porta 3001) e mandei um payload sintético de `messages.upsert`
     direto pro endpoint HTTP do webhook — confirmei nos logs que ele processou e
     mandou a resposta de volta **pela Evolution API de verdade** (não é mock).
  3. Resetei o banco (`supabase db reset`) depois dos testes pra voltar ao seed limpo.
- **Webhook ligado ao vivo, com sua autorização explícita:** adicionei
  `extra_hosts: host.docker.internal:host-gateway` no `docker-compose.yml` da Evolution
  API (pra ela alcançar o backend rodando no seu host, fora do Docker). No
  `evolution-api/.env`: `WEBHOOK_GLOBAL_URL=http://host.docker.internal:3001/webhook/whatsapp`,
  `WEBHOOK_GLOBAL_ENABLED=true`, `WEBHOOK_EVENTS_MESSAGES_UPSERT=true`. Recriei o
  container, confirmei que ele alcança `host.docker.internal:3001/health` de dentro do
  Docker, e que a instância `iabarber-teste` segue `open`.
  - **Consequência ativa agora:** qualquer mensagem que chegar nesse WhatsApp (de
    qualquer contato, não só seu) recebe resposta automática do bot de regras. Você
    autorizou isso explicitamente pra poder testar pelo celular.
  - **O processo do backend (`npx tsx src/index.ts`) precisa continuar rodando** pra
    isso funcionar — se você reiniciar o notebook ou fechar o terminal, vai precisar
    subir de novo (`cd backend && npm run dev`) e o webhook vai parar de responder até lá
    (a Evolution API não vai dar erro pro cliente, a mensagem só fica sem resposta).
  - **Pra desligar:** `WEBHOOK_GLOBAL_ENABLED=false` no `evolution-api/.env` +
    `docker compose up -d --no-deps evolution-api` nessa pasta.

### 2026-09-01 (continuação) — painel web (passo 5), com autenticação real via Supabase Auth
Depois do motor de regras validado, segui direto pro passo 5, como você pediu
("finalizar o projeto inteiro" nas partes grátis).

- **Projeto criado com Vite** (`npm create vite@latest painel-web -- --template react-ts`),
  React 19 + TypeScript. Sem framework de rotas (`react-router`) de propósito — o painel
  é simples o bastante pra um estado local (`sessão logada?` → Login ou Dashboard;
  dentro do Dashboard, abas por `useState`) sem precisar de URL própria por tela ainda.
- **`src/lib/supabaseClient.ts`:** usa a **anon key** (não a service role) — é seguro
  expor no bundle do navegador por design, porque quem protege os dados é a RLS do
  banco, não o segredo da chave. Isso é importante: nunca colocar a service role key
  num projeto frontend.
- **Fluxo implementado:**
  - `Login.tsx`: e-mail/senha via `supabase.auth.signInWithPassword`.
  - `App.tsx`: observa a sessão (`onAuthStateChange`) e alterna Login/Dashboard.
  - `Dashboard.tsx`: busca a linha de `barbeiros` do usuário logado (`user_id =
    auth.uid()`), depois renderiza duas abas:
    - `AgendaHoje.tsx`: agendamentos do dia do barbeiro logado (cliente, serviço,
      horário, status), só leitura.
    - `MeusHorarios.tsx`: lista/adiciona/remove as janelas semanais de
      `horarios_disponiveis` do barbeiro logado.
- **Usuário de teste pro login:** criei um usuário real no Supabase Auth local
  (`ze@barbeariateste.local` / `iabarber123`) via API admin (service role key) e
  vinculei ao barbeiro do seed (`barbeiros.user_id`). **Atenção:** todo `supabase db
  reset` recria o schema `auth` do zero, o que apaga esse vínculo (a linha do barbeiro
  em si continua, só o `user_id` que some) — criei
  `database/criar-usuario-teste.sh` pra recriar isso com um comando só sempre que
  precisar resetar o banco.
- **Testado de verdade num navegador headless** (Playwright + Chromium, já que este
  ambiente não tem GUI — instalei só o binário do Chromium via `npx playwright install
  chromium`, sem precisar de root): login → dashboard → agenda do dia (testei com um
  agendamento inserido manualmente, apareceu certinho: cliente, serviço, horário,
  status) → aba "meus horários" (mostrou as 5 janelas do seed, terça a sábado). **Zero
  erros no console do navegador.** Corrigi um probleminha visual encontrado no teste
  (título "Olá, Zé da Navalha" encostando no botão "Sair" por causa da margem padrão
  do `<h1>`) antes de considerar pronto.
- **RLS confirmada também pela camada REST** (não só pelo painel): login como o
  barbeiro de teste → `GET /rest/v1/barbearias` retorna só a própria barbearia; a
  mesma consulta sem login → retorna vazio. A segurança é do banco, não do frontend.
- **Dev server:** `cd painel-web && npm run dev` (Vite, porta padrão 5173 ou a
  próxima livre — ficou rodando em **5174** nesta sessão, verifique no terminal onde
  subiu). Deixei rodando em background nesta sessão.
- **Banco resetado no final** pra tirar o agendamento de teste que inseri manualmente
  pra validar a tela — reset limpo, seed original intacto.
- **Não fiz (fora do escopo "grátis" claramente definido, ou não pedido ainda):**
  criação de novos barbeiros/barbearias pelo próprio painel (hoje só dá pra logar com
  quem já tem `user_id` vinculado manualmente — não tem fluxo de "criar minha
  barbearia" nem convite de barbeiro), edição de serviços/preços pelo painel, e
  qualquer tela de assinatura/plano. Também não criei rotas (`react-router`) — se o
  painel crescer (múltiplas telas com URL própria, ex. relatórios), vale considerar.

### 2026-09-01 (continuação) — bot de chat desativado
Você pediu pra desligar o bot por enquanto. `WEBHOOK_GLOBAL_ENABLED=false` de volta no
`evolution-api/.env`, container recriado. **WhatsApp continua conectado** (`state:
"open"`) — só a resposta automática foi desligada, ninguém mais recebe reply ao
mandar mensagem. O backend (porta 3001) e o painel web (porta 5174) continuam
rodando em background, só não tem mais nada chamando o backend a partir da Evolution
API. Pra religar: `WEBHOOK_GLOBAL_ENABLED=true` no `.env` + `docker compose up -d
--no-deps evolution-api` na pasta `evolution-api/`.

### 2026-09-01 (continuação) — identidade visual "Corte Certo" aplicada no painel
Você colocou a pasta `Identidade visual Corte Certo/` na raiz do projeto (handoff de
design em HTML — `design_handoff_corte_certo_identidade/`) e pediu pra eu executar as
ideias no painel.

- **O que é "Corte Certo":** é o nome/marca do *produto* (a plataforma que hoje
  chamamos internamente de "iabarber" no código) — não o nome de uma barbearia
  específica. No painel (onde o dono da barbearia usa o produto), a marca visível é
  "Corte Certo". Na conversa de WhatsApp, quem aparece pro cliente final é a barbearia
  do próprio dono (no nosso seed, "Barbearia Teste") — mantive essa distinção, não
  troquei o nome da barbearia do seed pra "Corte Certo" por engano.
- **Não renomeei a pasta/pacote técnico** `painel-web`/`iabarber` no código — só a
  marca *visível* na interface virou "Corte Certo" (título da aba, logo, textos da
  tela). Renomear pastas, `package.json`, containers Docker etc. seria uma mudança bem
  mais invasiva que não foi pedida.
- **Tokens de design** (cores, tipografia Sora+Inter, espaçamento, raio) extraídos do
  `README.md` do handoff e aplicados como CSS custom properties em
  `painel-web/src/App.css`. Troquei também o `index.css` — o scaffold do Vite trazia
  estilos (largura fixa 1126px, texto centralizado, h1 gigante) que quebrariam o
  layout do painel; substituí por um reset mínimo.
- **Logo:** `painel-web/src/components/Logo.tsx` — o mark SVG exato do handoff (bolha
  de conversa + checkmark), com a tabela de escala de traço por tamanho
  (o "parafuso" central some abaixo de 27px, o traço engrossa conforme encolhe).
- **Reestruturei o painel pra bater com a tela de referência do handoff** (sidebar +
  conteúdo, não mais duas abas soltas):
  - `components/Sidebar.tsx`: logo, nav (Agenda/Horários funcionam; Conversas/
    Clientes/Equipe aparecem desabilitados, "em breve" — são as telas do design que
    ainda não existem, não inventei funcionalidade pra elas), pill "WhatsApp
    conectado", botão Sair.
  - `pages/Agenda.tsx` (antes era `components/AgendaHoje.tsx`, virou página porque
    ganhou cabeçalho, métricas e o botão de novo agendamento): data de hoje formatada
    em português ("Terça, 1 de setembro" — sem o "-feira", igual ao handoff), nome da
    barbearia, 4 cards de métrica, lista "Próximos horários" com chips de status.
  - **2 dos 4 cards de métrica são reais** (Hoje = contagem de agendamentos do dia,
    Confirmados = contagem + %), calculados a partir dos dados de verdade. **Os outros
    2 do design ("Faltas evitadas", "Resposta média") não têm dado real ainda** — não
    inventei número, mostrei "—" com legenda "em breve" (faltas evitadas depende do
    sistema de lembrete do passo 7; resposta média depende de tracking que não existe).
  - **Chips de status:** o design usa 4 estados (Confirmado/Aguardando/Cancelado/
    Remarcou) mas nosso schema só tem `confirmado/cancelado/concluido/no_show` — não
    existe "aguardando" no nosso modelo (todo agendamento já nasce confirmado) nem
    "remarcou" como status separado. Mapeei: confirmado e concluído → verde (a regra do
    handoff é clara: "verde só informa: confirmado, concluído, conectado"); cancelado e
    não-compareceu → terracota. Não implementei o chip aço/"aguardando" porque nada no
    sistema hoje produz esse estado.
  - **"Novo agendamento" (botão azul do cabeçalho) — implementei de verdade**, não só
    visualmente: `components/NovoAgendamentoModal.tsx` insere cliente (upsert por
    telefone) + agendamento direto via Supabase (RLS já garante que só grava na própria
    barbearia). Testei os dois caminhos: criar com sucesso (aparece na lista e nos
    cards na hora) e tentar criar em cima de um horário já ocupado (a trava do banco
    devolve o erro, a tela mostra "Esse horário já está ocupado" em vez de quebrar).
  - `components/MeusHorarios.tsx`: mesma lógica de antes, só restyled pro tema escuro
    (não tem tela de referência explícita no handoff pra isso, usei os mesmos tokens
    por consistência).
- **Ajustes de acabamento que só apareceram testando de verdade** (Playwright +
  Chromium headless, já que este ambiente não tem GUI):
  - `text-transform: capitalize` no CSS estava deixando "Terça-Feira, 1 De Setembro"
    (cada palavra maiúscula) — o handoff pede só a primeira letra maiúscula, com "de"
    minúsculo. Corrigi formatando a data manualmente em vez de usar `Intl` +
    transformação CSS.
  - Eu tinha colocado "Próximos horários" dentro de um card com borda própria — no
    handoff essa seção não tem card, fica direto no fundo do painel (só a lista de
    métricas usa cards). Removi.
  - `color-scheme: dark` no body — sem isso, os campos nativos de data/hora do
    formulário de "Novo agendamento" renderizavam brancos (tema claro do navegador),
    destoando do resto.
- **Sobre a "aplicação de marca" (conversa de WhatsApp) do handoff:** essa segunda
  peça do design (seção 05, direita) é uma referência de **tom de voz**, não uma tela
  pra construir no painel — não existe (nem faz sentido existir agora) um visualizador
  de chat dentro do painel web. O que apliquei dali: removi o emoji 💈 (poste de
  barbeiro) do texto do bot em `backend/src/regras/motor.ts` — a marca proíbe
  explicitamente esse símbolo no visual, e mesmo sendo só o texto do bot, destoa do
  posicionamento "moderno, sem clichê de barbearia". Também corrigi esse arquivo pra
  buscar o nome da barbearia do banco em vez de ter "Barbearia Teste" fixo no código.
  Guardei a diretriz de tom de voz completa (frase curta, uma pergunta por vez, nunca
  fingir não ser bot) como comentário no `system prompt` de `backend/src/ai/claude.ts`,
  já que é lá que voz de marca vai importar de verdade — quando o passo 6 ligar a IA
  real, ela deve seguir essa voz numa conversa natural, o que o bot de regras de hoje
  (comandos exatos tipo "agendar DD/MM HH:MM") não tem como fazer.
- **Fontes:** Sora + Inter via Google Fonts (`index.html`) — o handoff já avisa que
  isso deve virar self-host em produção; deixei via CDN por enquanto (ambiente de
  dev/MVP).
- Reset do banco no final pra tirar os dados de teste que usei pra validar visualmente
  (agendamentos fake, clientes fake) — seed original intacto, login de teste recriado
  com `database/criar-usuario-teste.sh`.
- **Backend reiniciado com `tsx watch`** (antes rodava sem watch) — agora ele recarrega
  sozinho quando o código muda, não precisa mais eu reiniciar manualmente a cada ajuste.

### 2026-09-01 (continuação) — bug: sessão do painel ficava presa depois de `db reset`
Você reportou "não consigo acessar" o painel. Investiguei por um caminho errado
primeiro (rede/Firefox snap) antes de pedir a mensagem exata de erro — foi
`Erro ao carregar seu perfil: Cannot coerce the result to a single JSON object`,
que apontou pra causa real.

- **Causa raiz:** o Supabase JS guarda a sessão de login automaticamente no
  `localStorage` do navegador. Toda vez que rodei `supabase db reset` durante os
  testes de identidade visual, o schema `auth` foi recriado do zero — e
  `criar-usuario-teste.sh` gera um usuário novo (UUID novo) a cada execução. O
  navegador continuou usando a sessão antiga (assinada com o mesmo `JWT_SECRET` fixo
  do ambiente local, então ainda "válida" tecnicamente), só que apontando pra um
  `user_id` que não existe mais como barbeiro vinculado. A consulta
  `.eq('user_id', user.id).single()` em `Dashboard.tsx` não achava nenhuma linha e
  `.single()` estourava esse erro — e como isso acontecia **antes** de renderizar a
  Sidebar, nem o botão "Sair" ficava acessível pra escapar sozinho.
- **Correção em `painel-web/src/pages/Dashboard.tsx`:** troquei `.single()` por
  `.maybeSingle()` e, quando não acha nenhum barbeiro pro `user_id` da sessão atual,
  chama `supabase.auth.signOut()` automaticamente em vez de travar numa tela de erro
  sem saída — isso limpa a sessão obsoleta e volta pra tela de login sozinho.
  **Testado** simulando uma sessão com `user_id` incompatível via
  `localStorage` (Playwright): confirmado que agora volta pra tela de login sozinho.
- **Também religuei o Vite com `--host`** (antes só aceitava `localhost`) — não era a
  causa do problema neste caso (você estava no mesmo notebook), mas deixa o painel
  acessível por outros dispositivos na mesma rede Wi-Fi também (ex.: celular), caso
  precise no futuro. IP local: `192.168.0.208:5174` (pode mudar se a rede mudar) —
  **atenção:** se for acessar de outro dispositivo, o `.env` do painel aponta o
  Supabase pra `127.0.0.1:54321`, que só existe no notebook; nesse caso o login
  funcionaria mas nada mais carregaria. Ainda não ajustei isso porque não era o caso
  agora.
- **Lição pra não repetir:** depois de qualquer `supabase db reset` daqui pra frente,
  ou dar um refresh na aba do painel (com a correção acima, ele se autocorrige agora)
  ou simplesmente lembrar que login antigo pode ficar inconsistente.

### 2026-09-01 (continuação) — landing page ("Corte Certo — Landing.dc.html")
Você adicionou uma segunda pasta de handoff, `Identidade visual Corte Certo (2)/`, com
mais um arquivo: uma landing page completa (com animações). Pediu pra eu fazer.

- **Projeto novo `landing/`** (Vite + React + TS), separado do `painel-web` de
  propósito — é site público (sem autenticação), então não faz sentido morar dentro do
  painel autenticado. Ver nota na seção "Estrutura de pastas" acima.
- **Todas as seções do handoff implementadas:** nav sticky com blur, hero (H1 + CTAs +
  conversa animada), "O problema" (banda clara), "Como funciona" (trilho vertical
  numerado, passo 3 destacado), "Prova em uso" (o painel embutido com métricas
  animadas), "Diferencial" (3 colunas), CTA final (campo de telefone com máscara
  brasileira) e footer.
- **Conversa animada do hero** (`components/ConversaAnimada.tsx`): implementei o
  roteiro exato do handoff (11 eventos com timestamp em ms — mensagem do cliente,
  indicador de digitação, resposta da marca, chip "Agenda atualizada", lembrete do dia
  seguinte), com o ciclo reiniciando a cada 12s. Comparei lado a lado com o
  `.dc.html` original renderizado (Playwright) no mesmo instante do ciclo — bateu
  quase exatamente (mesmo texto "14:41" na mesma bolha, mesma disposição).
- **Contadores animados da seção "Prova em uso"** (`components/ProvaEmUso.tsx`):
  `IntersectionObserver` (threshold 0.35, dispara uma vez) + `requestAnimationFrame`
  com easing cúbico, exatamente como especificado, contando até 31/26/5/8s.
- **Máscara e validação de telefone** (`components/CtaFinal.tsx`): formata
  progressivamente pro padrão `(DD) D DDDD-DDDD` enquanto digita, valida 11 dígitos,
  mostra erro em terracota se incompleto. **Importante: isso ainda não envia pra
  lugar nenhum de verdade** — não existe CRM, e-mail ou webhook recebendo esses
  contatos ainda. O formulário só mostra a confirmação visual
  ("Recebemos seu número...") localmente; a pessoa que preencher não vai gerar
  nenhum lead real do outro lado até isso ser conectado a algo (mais um serviço
  externo, possivelmente pago, então deixei de fora por enquanto).
- **`prefers-reduced-motion: reduce` respeitado de verdade** (não só documentado): a
  conversa mostra todas as mensagens de uma vez, sem animação, e os contadores vão
  direto pro valor final — testei com `page.emulateMedia()` no Playwright.
- **Reaproveitei os tokens e o componente `Logo.tsx` do `painel-web`** (copiado, não
  importado entre projetos — são dois projetos/deploys independentes, então cada um
  tem sua própria cópia; se um dia isso incomodar, dá pra extrair um pacote
  compartilhado).
- **Favicon:** troquei o ícone padrão do Vite pela marca de verdade (o mesmo SVG do
  logo) em `landing/public/favicon.svg` e também no `painel-web` (que ainda estava
  com o favicon padrão do scaffold).
- **Testado com Playwright:** carregamento sem erro de console, scroll até o fim,
  fluxo completo do formulário de contato (número incompleto → erro; número completo
  → máscara certa → confirmação), e o modo de movimento reduzido.
- Dev server rodando em background nesta sessão, porta **5175**, com `--host` (mesma
  razão do painel: acessível também pela rede local se precisar).

### 2026-09-01 (continuação) — IA real ativada (passo 6, primeira etapa paga)
Você configurou a API key da Anthropic em `backend/.env` e pediu pra trocar o motor de
regras pela IA real com function calling.

- **Confirmado antes de mexer:** `backend/.env` não é rastreado por git (não existe
  `.git` neste projeto ainda) e a regra `.env` (sem barra) no `.gitignore` da raiz
  cobre qualquer `.env` em qualquer subpasta automaticamente.
- **Correção de modelo:** você pediu `claude-sonnet-4-6`, que não existe. Usei
  **`claude-sonnet-5`** (o Sonnet mais recente disponível) — mais barato que Opus,
  adequado pro tipo de decisão que essa IA toma (entender pedido, escolher tool,
  responder curto).
- **`backend/src/ai/tools.ts` (novo):** define as 3 tools no formato que o SDK da
  Anthropic espera (`consultar_horarios_disponiveis`, `criar_agendamento`,
  `cancelar_agendamento`) e a função `executarFerramenta()` que despacha pra lógica
  já existente em `tools/*.ts` — **não reescrevi a lógica de banco**, só troquei quem
  decide qual tool chamar (antes regra fixa em `regras/motor.ts`, agora o modelo).
  O telefone do cliente **não** é parâmetro que o modelo preenche — vem sempre do
  remetente real do WhatsApp, injetado pelo código; evita o modelo inventar/errar
  um número.
- **`backend/src/ai/claude.ts` reescrito:** loop de function calling (até 4 rodadas
  de trava de segurança contra loop infinito/custo), system prompt com nome real da
  barbearia (buscado do Supabase), data de hoje por extenso, e a diretriz de tom de
  voz do handoff "Corte Certo" que eu tinha deixado guardada em comentário — agora
  ativa de verdade, porque é aqui que voz de marca importa (conversa natural, ao
  contrário do bot de comandos exatos de antes).
- **`env.ts`:** `ANTHROPIC_API_KEY` voltou a ser obrigatória (estava opcional desde
  que adiamos a IA) — o backend agora recusa subir sem ela.
- **`webhook/whatsapp.ts` religado** pra chamar `gerarResposta` de `ai/claude.ts` em
  vez de `decidirResposta` de `regras/motor.ts`. **O motor de regras não foi apagado**
  — fica de reserva caso precise voltar por custo ou for debugar algo.
- **Bug que cometi e corrigi antes de qualquer teste:** na primeira tentativa de
  adicionar um log de qual tool foi chamada, deixei duas chamadas a
  `executarFerramenta()` pro mesmo bloco (uma delas morta, mas ainda executando) —
  teria rodado cada tool **duas vezes** por rodada. Vi o problema relendo o arquivo
  antes de testar e corrigi. A chamada real de teste (abaixo) já foi feita com o
  código corrigido.
- **Teste único, como pedido** (mensagem sintética simulando o webhook, sem custo de
  Evolution API): `"Oi! Queria marcar um corte pra amanhã de manhã, tem horário?"`
  - **Resposta real do modelo:** *"Tenho manhã livre sim! Que tal 9h, 10h ou 11h?"*
  - **Tool chamada:** `consultar_horarios_disponiveis` (inferido pelo conteúdo da
    resposta — só esse motivo explica ele sugerir horários reais; não confirmou nada,
    então corretamente **não** chamou `criar_agendamento`, seguindo a regra do
    system prompt de só agendar depois que o cliente confirmar). Resolveu "amanhã de
    manhã" pra `2026-09-02`, serviço "Corte", e filtrou os horários da manhã da lista
    real de livres.
  - **Como recuperei a resposta sem gastar outra chamada:** consultei
    `POST /chat/findMessages/iabarber-teste` na própria Evolution API (é grátis, só lê
    o banco dela) em vez de reprocessar a mensagem.
  - Adicionei `console.log` no loop de tools (sem custo) pra próximas vezes eu ver
    tool + input + resultado direto no log, sem precisar inferir.
- **Custo real gasto até agora:** 1 chamada ao `claude-sonnet-5`, mensagem curta,
  1 rodada de tool use. Provavelmente menos de US$0,01. Recomendo configurar um
  limite de gasto no console da Anthropic (ex.: US$5, que é seu crédito total) como
  trava de segurança, se ainda não tiver feito.
- **Ainda não testado:** o fluxo completo até `criar_agendamento` (cliente confirmando
  um horário específico) e `cancelar_agendamento` — cada teste adicional é uma chamada
  paga a mais, então deixei pra você decidir quando testar isso, dado o crédito
  limitado.

### 2026-09-01 (continuação) — novas decisões mescladas + Bento + horário de atendimento
Você colou no chat uma versão mais antiga deste `CLAUDE.md` (sem o Log de progresso),
mas com **decisões novas** que ainda não estavam registradas: nome da IA, dados reais
da barbearia piloto, modo admin via WhatsApp, plano de migração pra API oficial da
Meta, e política de número dedicado + horário de atendimento. Como o arquivo colado
não tinha nosso histórico, **mesclei** as seções novas no arquivo real (que já tinha
todo o log) em vez de sobrescrever — ficaram logo antes de "Onde estamos agora", na
mesma ordem em que você colou. Ver as seções novas acima: "Nome da IA", "Dados da
barbearia piloto", "Funcionalidade de admin via WhatsApp", "Migração futura: WhatsApp
Business API oficial", "Número de WhatsApp e horário de funcionamento da IA".

Dessas decisões, implementei as duas que eram instrução direta e de baixo risco:

- **Nome "Bento"** — `ai/claude.ts` (system prompt: "Você é o Bento...", instrução
  explícita de responder "Bento" se perguntarem o nome) e `regras/motor.ts` (menu do
  bot de regras, que fica de reserva) — os dois agora se apresentam com o mesmo nome.
- **Horário de atendimento da IA (8h-20h)** — `ai/horarioAtendimento.ts` (novo):
  checa a hora local antes de chamar o Claude; fora do horário, manda a mensagem
  padrão ("Nosso atendimento por aqui é das 8h às 20h...") **sem gastar nenhuma
  chamada de API**. Testei de graça: eram 21h37 no momento (fora do horário), mandei
  uma mensagem sintética e confirmei nos logs e no histórico da Evolution API que a
  resposta padrão saiu e o Claude não foi acionado.

**O que ficou documentado mas não implementado** (fica pra quando você confirmar,
são mudanças de escopo maior ou que envolvem dado real):
- **Trocar o seed fictício pelos dados reais da barbearia piloto** (Igor, Tinho, 13
  serviços com preços/durações reais, novo horário seg-sex 9h-18h + sáb 9h-12h). Isso
  também precisa de uma coluna nova (`preco_variavel`) na tabela `servicos`, que não
  existe ainda — seria uma migration nova.
- **Modo admin via WhatsApp** (Igor/Tinho gerenciando a barbearia pelo próprio
  WhatsApp): tools novas (`consultar_agenda_completa`, `atualizar_horario_funcionamento`,
  `atualizar_servico`, `atualizar_valor_servico`), verificação de número no backend
  (não confiar no modelo pra isso), fluxo de confirmação pra ação sensível, e uma
  tabela de auditoria nova no banco. Escopo grande, ainda não comecei.
- **Migração pra WhatsApp Business API oficial:** puramente documentação por
  enquanto, como você mesmo pediu ("documentar quando chegar a hora, não fazer agora").
- **Número de WhatsApp dedicado:** o número conectado hoje continua sendo o seu
  pessoal (`558193552338`), não um número dedicado novo — troca fica pra quando
  você tiver um chip específico pra isso.

### 2026-09-01/02 (continuação) — dados reais + modo admin (2 dos "3 primeiros")
Você pediu pra fazer os 3 primeiros itens pendentes. O 3º (migração pra API oficial da
Meta) já estava satisfeito — é só documentação, como o próprio texto original pedia
("documentar quando chegar a hora, não fazer agora"), e isso já tinha sido mesclado no
passo anterior. Os outros 2 exigiram código de verdade:

**1. Dados reais da barbearia piloto:**
- Nova migration `20260902005418_admin_e_precos.sql`: coluna `preco_variavel` em
  `servicos` (true = preço "a partir de") + tabela `auditoria_admin` (ver item 2).
- `seed.sql` reescrito: barbearia renomeada pra **"Barbearia Piloto"** (nenhum nome
  real foi passado — troque quando tiver o nome de verdade); removido o barbeiro
  fictício "Zé da Navalha"; **Igor e Tinho** no lugar, com telefones placeholder
  (`558100000010`/`558100000011` — **trocar pelos números reais deles antes de contar
  com o modo admin de verdade**, é por esse telefone que o sistema reconhece quem é
  admin); os 13 serviços reais com preço/duração/`preco_variavel` exatamente como você
  especificou; horário seg-sex 9h-18h + sáb 9h-12h pros dois barbeiros (domingo sem
  linha = fechado).
- **Implicação de arquitetura que isso expôs:** o sistema inteiro assumia **um
  barbeiro só** (hardcoded em `config/barbearia.ts`). Com 2 barbeiros reais, isso
  precisou mudar — ver item abaixo "resolução por nome".
- `database/criar-usuario-teste.sh` atualizado: login de teste agora é
  `igor@barbeariapiloto.local` / `iabarber123`, vinculado ao Igor de verdade.

**Resolução de barbeiro por nome (consequência direta do item 1):**
- `config/barbearia.ts`: `barbeiroId`/`servicoPadraoId` continuam existindo só como
  fallback do motor de regras antigo (dormente, nunca aprendeu a perguntar "qual
  barbeiro" — usa sempre Igor + Corte de cabelo se for reativado).
- `ai/tools.ts`: `consultar_horarios_disponiveis` ganhou parâmetro opcional
  `barbeiro` — se o cliente não especificar, consulta **os dois** e devolve os
  horários livres de cada um separadamente, pro modelo apresentar as opções.
  `criar_agendamento` ganhou `barbeiro` **obrigatório** (não dá pra marcar sem saber
  com quem). O system prompt do cliente agora menciona os dois nomes e instrui o
  Bento a perguntar quando não estiver claro.

**2. Modo admin via WhatsApp:**
- `tools/buscarBarbeiroPorTelefone.ts`: verificação de admin **no backend**, não no
  modelo — olha se o telefone de quem mandou mensagem bate com algum
  `barbeiros.telefone` ativo da barbearia.
- `tools/adminBarbearia.ts`: `consultarAgendaCompleta` (todos os agendamentos do dia,
  qualquer barbeiro/status — diferente de `consultarHorariosDisponiveis`, que só
  mostra vagas pro cliente), `atualizarHorarioFuncionamento` (muda ou fecha um dia),
  `atualizarServico` (nome/duração/ativo), `atualizarValorServico` (preço +
  `preco_variavel`). Toda mutação grava uma linha em `auditoria_admin`
  (quem/o quê/quando).
- **Trava de confirmação, com reforço no código (não só no prompt):** as 3 tools de
  mutação exigem `confirmado: boolean` no schema. Se vier `false`/ausente, a tool
  **recusa executar** e devolve `precisa_confirmar` — o modelo é instruído a só
  chamar de novo com `confirmado:true` depois que o admin confirmar por escrito. Isso
  é mais forte que só confiar no prompt: mesmo que o modelo "esqueça" a instrução, o
  código não deixa a mutação passar sem essa flag.
- `ai/claude.ts`: `gerarResposta` agora primeiro checa se o remetente é admin
  (`buscarBarbeiroPorTelefone`) e monta o contexto certo — prompt diferente ("Bento
  falando com o Igor, modo gestão") e o array de tools certo (`FERRAMENTAS_ADMIN` vs
  `FERRAMENTAS_CLIENTE`). Um cliente **nunca** recebe as tools de admin na chamada à
  API — não é "o modelo decide não usar", a Anthropic nem sabe que elas existem
  nessa conversa.
- **Testado 100% de graça**, sem tocar a API da Anthropic: chamei `executarFerramenta`
  direto (script descartável) simulando os dois papéis —
  - telefone do Igor → reconhecido como admin; telefone de cliente → não reconhecido;
  - consulta sem especificar barbeiro → trouxe Igor e Tinho separados;
  - criar agendamento especificando "Tinho" → foi pro Tinho certo;
  - `consultar_agenda_completa` (admin) → mostrou o agendamento do Tinho;
  - `atualizar_valor_servico` sem confirmado → recusou e não mudou nada no banco;
  - o mesmo com confirmado=true → mudou o preço de verdade, e apareceu certinho em
    `auditoria_admin` com os detalhes;
  - fechar domingo do Igor → removeu a linha de `horarios_disponiveis` certa.
  - Resetei o banco depois pra tirar os dados de teste (preço do Bigode, domingo
    fechado, agendamento fake) — seed real ficou intacto.
- **Não testei ainda com uma chamada de verdade ao Claude** (nem em modo cliente
  pedindo pra um barbeiro específico, nem em modo admin) — isso custaria mais do seu
  crédito, então deixei pra você decidir quando quer ver isso ao vivo.
- **Confirmei que o painel web continua funcionando** com os dados reais — login como
  Igor mostra o horário real dele (seg-sex 9h-18h, sáb 9h-12h) certinho.

### 2026-09-02 (continuação) — telas que faltavam no painel: Conversas, Clientes, Equipe, Serviços
As 3 abas que estavam desabilitadas ("em breve") no design não eram bug de acesso —
eram propositalmente não-clicáveis porque as telas nunca tinham sido construídas. Você
pediu pra fazer as 3 e acrescentar uma de Serviços também.

- **Clientes** (`pages/Clientes.tsx`): lista + busca por nome/telefone. Consulta direta
  ao Supabase, sem filtro explícito de `barbearia_id` no código — a RLS já cuida disso
  sozinha (é literalmente pra isso que ela existe).
- **Equipe** (`pages/Equipe.tsx`): lista os barbeiros da barbearia, com chip mostrando
  se já tem login configurado no painel. **De propósito não tem botão de "adicionar
  membro"** — criar um barbeiro novo envolve criar uma conta no Supabase Auth, que não
  dá pra fazer com segurança só com a anon key do frontend; continua sendo tarefa de
  script/admin (tipo o `criar-usuario-teste.sh`).
- **Serviços** (`pages/Servicos.tsx`): lista com edição inline (duração, preço,
  "a partir de", ativo/inativo) e formulário pra adicionar serviço novo. Essa é a
  versão "pelo painel" do que as tools de admin do WhatsApp (`atualizar_servico`,
  `atualizar_valor_servico`) já faziam por conversa — agora tem os dois caminhos.
  **Bug real que encontrei e corrigi:** o insert de serviço novo esqueceu de mandar
  `barbearia_id` — a RLS bloqueou certinho ("new row violates row-level security
  policy"), exatamente o comportamento esperado dela. Corrigido, testado de novo com
  sucesso.
- **Conversas** (`pages/Conversas.tsx` + backend novo): a mais complexa, porque o
  histórico de mensagens do WhatsApp não mora no nosso Supabase — mora no Postgres
  interno da Evolution API. Construí uma ponte de verdade em vez de deixar de fazer:
  - `backend/src/api/auth.ts`: middleware que exige um token de sessão válido do
    Supabase Auth **e** que a pessoa esteja cadastrada em `barbeiros` — mesmo
    requisito de logar no painel. Sem isso, `/api/conversas` ficaria aberto pra
    qualquer um que descobrisse a URL.
  - `backend/src/api/conversas.ts`: cruza os clientes cadastrados (Supabase) com os
    chats reais da Evolution API (`POST /chat/findChats`), filtra só conversa
    individual (`@s.whatsapp.net`, sem grupo) que bate com telefone de cliente
    conhecido, devolve última mensagem + quando.
  - **Por que filtrar só clientes conhecidos, e não "todas as conversas":** o número
    conectado hoje ainda é o seu WhatsApp pessoal (ver decisão de número dedicado) —
    mostrar a lista de chats crua exporia grupos e contatos pessoais seus no painel.
    Isso é uma proteção de privacidade, não só filtro de UX.
  - CORS mínimo adicionado no backend (sem dependência nova) só pra origens locais
    (`localhost`, `127.0.0.1`, rede local) — necessário porque agora o painel (porta
    5174) chama o backend (porta 3001), origens diferentes.
  - `painel-web/.env` ganhou `VITE_BACKEND_URL`.
  - Testado de verdade: mostrou "Cliente Teste — Sem mensagens ainda" corretamente
    (esse cliente fake nunca trocou mensagem real com o número conectado).
- Sidebar (`components/Sidebar.tsx`) e Dashboard reescritos pra rotear as 6 abas
  (Agenda, Conversas, Clientes, Equipe, Serviços, Horários) — nenhuma mais desabilitada.
- Corrigi também pluralização (“1 cadastrados” → “1 cadastrado”) nas 3 telas novas.
- **Testado com Playwright de novo:** login, as 4 telas carregando sem erro de console,
  edição de serviço de ponta a ponta (editar preço existente + criar um novo), reset
  do banco no final pra tirar os dados de teste.

### 2026-09-02 — migração pro PC Windows (Docker Desktop) + Supabase cloud + prep de deploy
Você trocou de máquina (notebook Ubuntu → PC Windows, `c:\Users\ArT\projetos\iabarber\iabarber`,
Docker Desktop) e pediu pra ir rumo ao deploy pra disponibilizar o sistema pra barbearia
piloto testar de verdade. Como isso mistura passos grátis/reversíveis com passos pagos/que
só você pode autorizar (contas novas, cartão de crédito), separei em 3 decisões antes de
mexer: **(1)** WhatsApp continua no seu número pessoal por enquanto (número dedicado fica
pra depois, como já estava documentado); **(2)** banco vai direto pra Supabase **cloud**
em vez de recriar o Supabase local aqui, já que o destino é produção mesmo; **(3)** conta
da DigitalOcean **ainda não existe** — isso envolve cartão de crédito, então é ação sua,
não fiz nem tentei fazer por você.

- **Confirmado que este PC começou com clone limpo do repo:** nenhum `.env` de nenhuma
  pasta veio (todos gitignored, como esperado), nem Supabase local, nem sessão do
  WhatsApp — tudo isso só existia no notebook Ubuntu. Docker Desktop já estava instalado
  e rodando (v29.7.2); havia um container `tino-postgres` de outro projeto seu ocupando a
  porta 5432 do host, que não toquei (o Postgres da Evolution API só usa `expose`, sem
  publicar porta, exatamente pra evitar esse tipo de colisão — já valeu a decisão de
  design de quando criamos o compose original).
- **Evolution API reerguida do zero neste PC:** `evolution-api/.env` recriado com
  `AUTHENTICATION_API_KEY` e senha do Postgres novas (geradas com `openssl rand`, que o
  Git Bash deste PC já tem via `/mingw64/bin/openssl` — não precisei instalar nada).
  `docker compose up -d` subiu os 3 containers de primeira, sem repetir nenhum dos
  problemas de imagem/versão que tinham aparecido no notebook.
- **WhatsApp reconectado com o mesmo número pessoal** (`558193552338`), via pairing code
  (fui direto por esse caminho — QR code expira rápido e da vez anterior pairing code deu
  mais certo). Precisei de um `DELETE /instance/logout` antes (mesma pegadinha de antes:
  `/instance/connect?number=...` só respeita o parâmetro `number` se o estado já estiver
  `close`). Confirmado `state: "open"` e `ownerJid` batendo. Como é vínculo de aparelho
  novo pro WhatsApp, ele resincronizou histórico de novo (contatos/chats/mensagens) pro
  Postgres interno deste PC — mesmo comportamento documentado da primeira vez, não é nada
  que pedimos explicitamente; esse Postgres local passa a ter uma cópia do seu WhatsApp
  pessoal de novo, mesmo tratamento de cuidado de antes se aplica.
- **`npm install` rodado em `backend/`, `painel-web/`, `landing/` e `database/`** — nenhum
  tinha `node_modules` ainda neste PC. Fixei a versão do Supabase CLI também aqui
  (`database/package.json`, mesma versão `^2.116.0` de antes).
- **Banco migrado pra Supabase cloud** (decisão 2 acima), em vez de recriar o local:
  - Você criou a conta e um projeto novo no dashboard do Supabase (ref
    `yfrmpxjgrdczyzthzrkh`) e gerou um Personal Access Token — o login interativo do CLI
    (`supabase login`) não funciona neste ambiente porque exige navegador/TTY, então usei
    o token direto (`SUPABASE_ACCESS_TOKEN=... npx supabase link --project-ref ...`), sem
    precisar de fluxo interativo.
  - `npx supabase db push` aplicou as 2 migrations existentes (schema inicial +
    admin/preços) direto no banco cloud, e `--include-seed` aplicou o `seed.sql` (dados
    reais da Barbearia Piloto, Igor, Tinho, 13 serviços) — tudo sem precisar de senha do
    Postgres, só o access token + project ref.
  - **Chaves de API:** o projeto novo já vem no formato novo do Supabase
    (`sb_publishable_...` no lugar de `anon`, `sb_secret_...` no lugar de `service_role`)
    — são compatíveis com o `@supabase/supabase-js` como substitutos diretos, usei
    normalmente como `SUPABASE_SERVICE_ROLE_KEY`/`VITE_SUPABASE_ANON_KEY`. Pegadinha que
    aconteceu no meio do caminho: você colou a mesma chave (`anon`) duas vezes por engano
    em vez de anon + secret — percebi decodificando o JWT localmente (`role: "anon"` nos
    dois) antes de tentar usar, e pedi só a que faltava.
  - `backend/.env` e `painel-web/.env` recriados apontando pro projeto cloud (URL
    `https://yfrmpxjgrdczyzthzrkh.supabase.co`) + `ANTHROPIC_API_KEY` (você recuperou a
    chave salva) + credenciais da Evolution API local.
  - **`database/criar-usuario-teste.sh` generalizado pra funcionar local OU cloud:**
    trocou o `docker exec ... psql` (que só existe no ambiente local, contra o container
    `supabase_db_database`) por um `PATCH` na REST API (PostgREST) usando a service key —
    funciona igual nos dois ambientes agora, sem depender de container específico. Rodei
    com `API_URL`/`SERVICE_KEY` do projeto cloud exportados: recriou o login
    `igor@barbeariapiloto.local` / `iabarber123` vinculado ao barbeiro real.
  - **Testado de ponta a ponta, sem gastar chamada da Anthropic:** script descartável
    conectando com a service key confirmou leitura de `barbearias`/`barbeiros` reais
    (apaguei o script depois). Testei também a RLS pela REST API pura: sem login → `[]`;
    logado como Igor → só a barbearia dele. Backend subiu (`npm run dev`) e respondeu
    `/health` normalmente. Painel web subiu (`npm run dev -- --host`, porta 5173) e
    serviu o HTML sem erro.
  - **Não instalei Playwright neste PC** só pra um teste pontual (não era dependência já
    presente aqui) — validei o fluxo de login/RLS direto pela API REST em vez de abrir
    navegador, que cobre o que importava (autenticação real + política de RLS real).
- **Preparação de deploy pra DigitalOcean (decisão 3 acima — sem depender da conta
  existir ainda), tudo novo em `deploy/`:**
  - `backend/Dockerfile` (build multi-stage, `tsc` → `node dist/index.js`),
    `painel-web/Dockerfile` e `landing/Dockerfile` (build Vite → serve estático via
    `nginx:1.27-alpine`, com `nginx.conf` de cada um fazendo fallback de SPA). As 3
    imagens **buildaram limpo e eu testei rodando** (painel/landing servindo HTML via
    `docker run` numa porta temporária, removidas depois; backend só buildado, já que
    rodar exigiria as env vars de produção que ainda não existem de verdade).
  - `deploy/docker-compose.prod.yml`: junta evolution-api + postgres/redis internos +
    backend + painel-web + landing + **Caddy** (reverse proxy com HTTPS automático via
    Let's Encrypt) numa rede Docker só, pensado pra rodar com um único
    `docker compose -f docker-compose.prod.yml --env-file .env up -d --build` no droplet.
    Evolution API **não** fica exposta publicamente no Caddy — só backend/painel/landing,
    pelos motivos já documentados (não precisa, e reduz superfície de ataque).
  - `deploy/Caddyfile`: 3 blocos (`$DOMAIN` → landing, `app.$DOMAIN` → painel-web,
    `api.$DOMAIN` → backend), domínio via variável de ambiente (`{$DOMAIN}`), já que você
    ainda não tem domínio comprado — isso é parametrizável, preenche quando tiver.
  - `deploy/.env.example`, `deploy/backend.env.example`, `deploy/evolution-api.env.example`
    criados como referência (sem segredos reais) — os arquivos reais (`deploy/.env`,
    `deploy/backend.env`, `deploy/evolution-api.env`) ficam de fora do git (adicionei as
    3 entradas no `.gitignore` da raiz, que antes só cobria `.env` exato e não pegava
    `backend.env`/`evolution-api.env` sem o ponto na frente).
  - **Mudança de código real que isso exigiu:** o CORS do backend
    (`backend/src/index.ts`) só liberava `localhost`/`127.0.0.1`/rede local — sem isso o
    painel web não teria como chamar o backend a partir de um domínio real. Adicionei
    `FRONTEND_ORIGIN` como variável de ambiente opcional (`backend/src/config/env.ts`) que
    estende a lista de origens permitidas — em produção aponta pra
    `https://app.SEUDOMINIO.com`. Testado: `tsc --noEmit` limpo, backend local continuou
    respondendo normalmente depois do hot-reload do `tsx watch`.
  - `WEBHOOK_GLOBAL_ENABLED=false` por padrão no `deploy/evolution-api.env.example`, na
    mesma linha de cautela usada localmente (ligar só depois de confirmar que o backend
    de produção está saudável, não de cara).
- **O que ainda falta pra ir ao ar de verdade com a barbearia piloto (nesta ordem):**
  1. Você criar a conta na DigitalOcean (cartão de crédito — ação sua) e um droplet.
  2. Comprar/decidir um domínio e apontar os 3 registros DNS (`SEUDOMINIO.com`,
     `app.SEUDOMINIO.com`, `api.SEUDOMINIO.com`) pro IP do droplet.
  3. Copiar os `.env.example` de `deploy/` pros arquivos reais no droplet, preenchidos
     com credenciais de produção (podem ser as mesmas do Supabase cloud e Anthropic já
     em uso, ou novas se preferir isolar).
  4. Subir a stack (`docker compose -f docker-compose.prod.yml --env-file .env up -d
     --build`), confirmar Caddy emitiu certificado HTTPS pros 3 domínios.
  5. Reconectar o WhatsApp nesse ambiente novo (vai pedir pairing code de novo, é
     comportamento normal de qualquer ambiente novo) e só então ligar
     `WEBHOOK_GLOBAL_ENABLED=true`.
  6. **Antes de considerar isso pronto pra cliente pagante de verdade** (não
     necessariamente pro teste piloto): trocar os telefones placeholder de Igor/Tinho no
     seed (`558100000010`/`11`) pelos números reais deles, senão o modo admin via
     WhatsApp não reconhece ninguém; e lembrar da migração pra WhatsApp Business API
     oficial antes de vender pra qualquer barbearia além da piloto (já documentada acima).
- Backend (porta 3001) e painel web (porta 5173, com `--host`) ficaram rodando em
  background nesta sessão, iguais ao padrão das sessões anteriores.

### 2026-09-02 (continuação) — validar antes de gastar: webhook local ligado + IA 24/7
Antes de criar a conta na DigitalOcean e assumir custo mensal, você quis confirmar que o
fluxo completo (WhatsApp real → IA → grava no Supabase cloud) funciona rodando só local.
Fez sentido — é exatamente o tipo de validação que a "Prioridade de custos" deste arquivo
pede (provar antes de pagar).

- **Liguei o webhook local com sua confirmação explícita** (mesma cautela das sessões
  anteriores — isso ativa resposta automática de verdade pra **qualquer pessoa** que
  mandar mensagem pro seu WhatsApp pessoal conectado, não só você): `WEBHOOK_GLOBAL_URL=
  http://host.docker.internal:3001/webhook/whatsapp` e `WEBHOOK_GLOBAL_ENABLED=true` no
  `evolution-api/.env`, container recriado. A primeira tentativa de recriar o container
  foi **bloqueada automaticamente** pelo classificador de permissões do Claude Code
  (reconheceu como ação de efeito real/público) — só segui depois de você confirmar
  "liga" explicitamente. Confirmado depois: instância reconectou sozinha
  (`state: "open"`) e o container da Evolution API alcança o backend
  (`host.docker.internal:3001/health` respondendo de dentro do container).
- **Removida a restrição de horário de atendimento (8h-20h)** — você pediu "abre pra
  funcionar 24/7". Como a frase era ambígua (podia significar só tirar a trava de
  horário do código, ou também deixar o bot de fato no ar sem parar), perguntei e você
  confirmou que era só o primeiro: tirar a trava de horário. Deixei claro que
  disponibilidade 24/7 *de verdade* (sem depender do PC ficar ligado, Docker Desktop
  aberto, terminal do backend não fechar) só vem depois do deploy de produção — rodando
  local, se o PC dormir/reiniciar ou você fechar o terminal do `npm run dev`, o bot para
  de responder até você subir tudo de novo.
  - `backend/src/ai/horarioAtendimento.ts` **apagado** (não só desativado — ficou sem
    nenhum outro uso depois de tirar a chamada do webhook, e o projeto prefere deletar
    código morto a comentar/guardar "pra manter"). `backend/src/webhook/whatsapp.ts`
    voltou a chamar `gerarResposta` direto, sem a checagem de horário antes.
  - `tsc --noEmit` limpo depois da remoção; backend recarregou sozinho (`tsx watch`) e
    continuou respondendo `/health` normalmente.
  - Documentação da decisão original (8h-20h) mantida no histórico deste log pra registrar
    o porquê ela existiu e por que foi revertida, mas a seção "Número de WhatsApp e
    horário de funcionamento da IA" acima já reflete o estado atual (sem restrição).
- **Próximo passo (retomar daqui):** você ainda vai mandar a mensagem de teste de verdade
  pro WhatsApp conectado pra validar o agendamento completo (criar via conversa real,
  conferir a linha em `agendamentos` no Supabase cloud/painel). Isso ainda não foi feito
  nesta sessão — parei aqui esperando você mandar a mensagem.
- **Lembrete de custo:** com o webhook ligado, toda mensagem real que chegar (de
  qualquer contato) aciona uma chamada paga à Anthropic. Pra um teste curto tudo bem;
  se for demorar pra testar, vale desligar de novo (`WEBHOOK_GLOBAL_ENABLED=false` +
  recriar o container) e religar só na hora de testar.
- **Webhook desligado de novo** a seu pedido logo depois ("desliga") —
  `WEBHOOK_GLOBAL_ENABLED=false`, container recriado, WhatsApp continuou conectado.

### 2026-09-02 (continuação) — bug real: a IA esquecia a conversa a cada mensagem
Você testou de verdade e reportou que "a IA está se esquecendo do que o cliente fala".
Bug confirmado direto no código, não achismo:

- **Causa raiz:** `gerarResposta()` em `backend/src/ai/claude.ts` montava o array de
  mensagens do zero em toda chamada (`const mensagens = [{ role: 'user', content:
  mensagemDoUsuario }]`) — cada mensagem nova do WhatsApp virava uma conversa inteiramente
  nova pro Claude, sem nenhum turno anterior. Não era comportamento sutil do modelo, era
  o código nunca ter guardado histórico nenhum.
- **Correção:** histórico de conversa por telefone guardado em memória do processo
  (`Map<telefone, MessageParam[]>`, até 20 mensagens por telefone, mais antigas descartadas
  pra não deixar o contexto/custo crescer sem limite). Ao gerar uma resposta, o histórico
  anterior daquele telefone é prependado antes da mensagem nova; ao final (resposta final
  em texto, ou quando bate o limite de rodadas de ferramenta), o histórico atualizado é
  salvo de volta.
  - **Limitação consciente, não escondida:** isso é em memória do processo, não no banco —
    se o backend reiniciar (crash, `tsx watch` recarregando por causa de outro arquivo,
    deploy novo), o histórico de todas as conversas em andamento some e o cliente começa
    "do zero" na próxima mensagem. Aceitável nesta fase de teste local; se isso incomodar
    depois de ir pra produção (backend reiniciando com frequência, cliente notando que o
    Bento "esquece"), o próximo passo seria persistir o histórico em uma tabela nova no
    Supabase em vez de em memória — não fiz isso agora pra não adicionar complexidade e
    uma tabela nova sem você ter pedido.
- **Testado de verdade** com um script descartável chamando `gerarResposta` direto (sem
  passar pelo WhatsApp/Evolution, mais barato): mensagem 1 "Meu nome é Arthur", mensagem 2
  "Você lembra meu nome?" → respondeu "Arthur" corretamente na segunda chamada. Script
  apagado depois do teste. `tsc --noEmit` limpo, backend recarregou saudável.

### 2026-09-02 (continuação) — Agenda do painel agora navega entre dias
Você pediu pra dar pra ver mais dias na Agenda, não só hoje (fazia sentido: um dos
agendamentos de teste que você criou pelo WhatsApp caiu num dia diferente de hoje e
não tinha como ver ele no painel antes disso).

- `painel-web/src/pages/Agenda.tsx`: adicionei navegação por dia no cabeçalho — botões
  `‹`/`›` (dia anterior/seguinte), um `<input type="date">` pra pular direto pra
  qualquer data, e um botão "Hoje" que só aparece quando você não está mais no dia
  atual (fica escondido quando já está nele, não faz sentido clicar em algo que não
  muda nada). A consulta ao Supabase passou a usar a data selecionada em vez de sempre
  "hoje" (`gte(dataSelecionada)/lte(fimDoDia(dataSelecionada))`).
  - **Pegadinha evitada de novo:** o `<input type="date">` usa formato `yyyy-mm-dd`
    local — usei um formatador manual (`paraInputDate`) em vez de
    `toISOString().slice(0,10)`, pela mesma razão já documentada no motor de regras
    (`toISOString()` converte pra UTC e acerta o dia errado perto da meia-noite no
    fuso de Brasília).
  - Card de métrica "Hoje" e a seção "Próximos horários" mudam de rótulo
    (`"Hoje"`/`"Nesse dia"`, `"Próximos horários"`/`"Horários"`) dependendo se o dia
    selecionado é hoje ou não — evita a mensagem ficar estranha quando você está
    olhando pra um dia passado ou futuro.
  - `NovoAgendamentoModal` ganhou uma prop opcional `dataInicial` — clicar em "Novo
    agendamento" enquanto navega por outro dia já pré-preenche a data certa no
    formulário, em vez de sempre sugerir hoje.
- **Testado com Playwright de verdade** (instalado temporariamente só pra esse teste
  com `npm install --no-save playwright`, sem alterar `package.json`/lockfile, e
  desinstalado depois): login real, screenshot do dia de hoje, clique em "próximo dia",
  confirma que o botão "Hoje" aparece/some corretamente ao navegar/voltar. O screenshot
  do dia seguinte (3 de setembro) mostrou de verdade um agendamento real que você tinha
  criado testando pelo WhatsApp (`558196311209`, Corte de cabelo, 15h, status
  Cancelado) — prova que a navegação funciona com dado real, não só mockado. Zero erros
  de console. `tsc -b` limpo.
- Não apaguei esse agendamento de teste do banco — é dado real seu, fica ao seu
  critério limpar ou manter.

### 2026-09-02 (continuação) — Agenda virou grade estilo Google Agenda, com todos os barbeiros
Você reportou que faltava o agendamento de "Sobrancelha" que também tinha testado.
Investiguei direto no banco antes de mexer em código: existiam sim 2 agendamentos reais
naquele dia — um do Igor (Corte de cabelo, cancelado) e um do Tinho (Sobrancelha,
cliente "Cami", confirmado). A `Agenda.tsx` só consultava
`.eq('barbeiro_id', barbeiro.id)` — ou seja, o barbeiro logado só via a própria agenda,
nunca a do colega. Confirmado o motivo antes de escrever qualquer linha.

Você também pediu mais informações (o barbeiro de cada agendamento) e um visual mais
parecido com o Google Agenda. As duas coisas empurravam pra mesma solução: mostrar a
barbearia inteira numa grade de horários, com uma coluna por profissional.

- `painel-web/src/pages/Agenda.tsx` reescrita:
  - A consulta de agendamentos passou a filtrar por `barbearia_id` (não mais
    `barbeiro_id`) — mostra os dois profissionais. Uma consulta nova busca os
    `barbeiros` ativos da barbearia pra virarem colunas.
  - Grade de horário fixa 8h-20h (mesmo intervalo que já era usado como "horário de
    atendimento" antes, cobre com folga o expediente real seg-sex 9h-18h/sáb 9h-12h),
    64px por hora, uma coluna por barbeiro com cabeçalho (nome + botão "+" pra criar
    agendamento direto naquela coluna) e os agendamentos posicionados/dimensionados
    por horário e duração real (`top`/`height` calculados a partir de `inicio`/`fim`).
    Linha vermelha horizontal marcando a hora atual, só quando o dia selecionado é hoje.
  - Cor do bloco por status, reaproveitando a mesma lógica de chip verde/terracota
    de antes (confirmado/concluído = verde, cancelado/não-compareceu = terracota),
    agora como cor de fundo + borda esquerda em vez de um chip de texto — mais perto
    da linguagem visual do Google Agenda. `title` no bloco mostra os detalhes completos
    no hover, já que blocos de serviço curto (ex.: 15min) não têm altura pra caber
    tudo por extenso.
  - **Bug de alinhamento pego e corrigido durante o teste visual:** o rótulo "08:00" do
    eixo de horas ficava sobreposto ao cabeçalho das colunas — a causa era usar
    `padding-top` no container pra "empurrar" os rótulos, mas o `top` de um elemento
    `position: absolute` é relativo à borda do container, não é afetado pelo padding
    dele. Troquei por somar a altura do cabeçalho (`37px`) direto no `top` calculado de
    cada rótulo, e a linha some do lugar certo.
  - `NovoAgendamentoModal` ganhou um campo "Profissional" (select) — antes o modal só
    criava agendamento pro barbeiro logado; agora aceita `barbeiros`/`barbeiroIdInicial`
    e deixa escolher, pré-selecionando o profissional da coluna onde o "+" foi clicado
    (ou o barbeiro logado, se veio do botão geral "Novo agendamento" do cabeçalho).
  - A tabela antiga (`.tabela-agenda`) foi removida do JSX e o CSS morto dela apagado
    junto — sem uso duplo de dois estilos de lista pra mesma informação.
- **Testado com Playwright de verdade de novo** (instalado/desinstalado temporariamente
  com `--no-save`, sem tocar `package.json`/lockfile): login real, screenshot do dia
  atual (grade vazia certinha), navegação pro dia com os 2 agendamentos reais — os dois
  apareceram nas colunas certas (Igor: Corte de cabelo cancelado; Tinho: Sobrancelha
  confirmado, cliente "Cami"), modal abrindo com o seletor de profissional funcionando.
  Encontrei e corrigi o bug do "08:00" sobreposto **durante** esse teste, antes de dar
  como pronto — não foi só rodar e aceitar o primeiro resultado.
- `tsc -b` limpo nos dois componentes alterados.

### 2026-09-02 (continuação) — sessão anterior caiu: processos locais mortos + bug real achado no log
Ao retomar, `backend` (porta 3001) e `painel-web` (porta 5173) não respondiam mais —
os processos em background da sessão anterior morreram junto com ela (os containers
Docker da Evolution API sobreviveram normalmente, porque são gerenciados pelo Docker
Desktop, não pelo processo do Claude Code). Subi os dois de novo
(`npm run dev` em cada pasta).

- **Bug real encontrado no log do backend antes de descartar o arquivo:** um erro 400
  real da Anthropic — `unexpected tool_use_id found in tool_result blocks... Each
  tool_result block must have a corresponding tool_use block in the previous message`.
  Causa: o corte de histórico por contagem (`slice(-20)`) que adicionei nesta mesma
  sessão pra corrigir a memória da conversa podia cortar bem no meio de um par
  `tool_use`/`tool_result` — a API da Anthropic exige que todo `tool_result` tenha o
  `tool_use` correspondente na mensagem anterior, senão rejeita a chamada inteira.
  **Corrigido em `backend/src/ai/claude.ts`:** depois de cortar pelas últimas 20
  mensagens, `salvarHistorico` agora descarta do início do array enquanto a primeira
  mensagem for um `tool_result` órfão (checado com `temToolResult`), garantindo que o
  histórico salvo sempre comece num ponto válido. `tsc --noEmit` limpo depois da
  correção.

### 2026-09-02 (continuação) — painel vai pro Vercel; backend/Evolution API continuam locais por enquanto
Você decidiu não criar a conta na DigitalOcean por enquanto — backend e Evolution API
continuam rodando aqui no Docker Desktop mesmo, e o painel web vai ser hospedado no
Vercel (grátis pro uso esperado, não depende de criar conta com cartão nem de comprar
domínio pra já ficar acessível de qualquer lugar).

- **`deploy/docker-compose.prod.yml`, `deploy/Caddyfile` e `deploy/.env.example`
  atualizados:** o serviço `painel-web` (e o build-arg `VITE_SUPABASE_*` que ele usava)
  foi removido de todos os três — ficaria conflitando com o deploy no Vercel, já que
  seria a mesma aplicação publicada em dois lugares diferentes. `backend`,
  `evolution-api` e `landing` continuam preparados do jeito que já estavam, pra quando
  você decidir criar a conta na DigitalOcean.
- **CORS do backend generalizado pra aceitar múltiplas origens:** `FRONTEND_ORIGIN`
  (em `backend/src/config/env.ts`) virou uma lista separada por vírgula
  (`frontendOrigins`) em vez de uma string única — importante porque o painel no
  Vercel vai ter uma origem diferente da rede local, e pode um dia ter mais de uma
  (domínio próprio, preview deployments). `backend/.env` ganhou a variável
  `FRONTEND_ORIGIN` vazia, com comentário lembrando de preencher com a URL real do
  Vercel assim que o deploy existir.
- **Limitação real, não escondida:** a aba "Conversas" do painel depende do backend
  (`/api/conversas`, que por sua vez lê o Postgres interno da Evolution API) — como o
  backend só roda local nesta máquina, essa aba **não vai funcionar** quando o painel
  for acessado do Vercel a partir de outro dispositivo (funciona só se você abrir o
  link do Vercel no navegador deste mesmo PC, já que aí `localhost`/CORS resolvem
  igual). O componente já trata isso de forma limpa (mostra "Não consegui falar com o
  backend... Ele está rodando?" em vez de quebrar a tela) — não precisei mudar nada
  pra isso não virar um erro feio. As outras abas (Agenda, Clientes, Equipe, Serviços,
  Horários) falam direto com o Supabase cloud, então funcionam normalmente de
  qualquer lugar.
- **Não criei o projeto no Vercel nem fiz o deploy** — isso exige conta/login que só
  você tem. Passo a passo pra você (ou peça pra eu fazer a parte que dá, tipo o
  commit/push):
  1. Garantir que o código está commitado e no GitHub (`git remote -v` confirma que o
     repo já é `github.com/arthur-lbqrq/iabarber`).
  2. Em vercel.com → **Add New → Project** → importar esse repositório.
  3. Como é um monorepo, definir **Root Directory = `painel-web`** na tela de
     configuração do projeto (o Vercel detecta Vite automaticamente a partir daí —
     build command e output directory não precisam de ajuste manual).
  4. Em **Environment Variables**, adicionar `VITE_SUPABASE_URL`,
     `VITE_SUPABASE_ANON_KEY` (os mesmos valores de `painel-web/.env`) e
     `VITE_BACKEND_URL` (aponte pra `http://localhost:3001` sabendo da limitação da
     aba Conversas acima, ou deixe em branco/aponte pra uma URL futura quando o
     backend for pra produção).
  5. Deploy. Depois, pegar a URL que o Vercel gerar e colar em `FRONTEND_ORIGIN` no
     `backend/.env` (e reiniciar o backend) pra liberar o CORS.

### 2026-09-02 (continuação) — commit/push + cloudflared instalado
- **Commit criado e enviado** (`40c45ae`, `git push` — bloqueado pelo classificador de
  permissão automático na primeira tentativa, mesmo com sua instrução explícita; você
  então avisou que tinha ativado o Remote Control e pediu pra eu tentar de novo, e aí
  sim funcionou). Cobre toda a migração pro PC Windows/Supabase cloud, a correção da
  memória da IA, a Agenda em grade e a preparação de deploy.
- **`cloudflared` instalado neste PC** (Windows), a seu pedido, via
  `winget install --id Cloudflare.cloudflared` — não estava presente antes
  (`cloudflared --version` não era reconhecido). Instalação limpa, versão
  `2026.8.3`. **Atenção:** o PATH do sistema foi atualizado pelo instalador, mas
  sessões de terminal já abertas antes da instalação não veem isso automaticamente —
  se `cloudflared` "não for reconhecido" num terminal já aberto, é só abrir um novo
  (ou reiniciar o PowerShell) que resolve.
- **Não criei nenhum túnel ainda** — só instalei o binário, como foi pedido
  especificamente. Provável próximo uso: expor o backend local (porta 3001) pra
  internet via Cloudflare Tunnel, o que resolveria a limitação da aba "Conversas" do
  painel no Vercel (documentada na entrada anterior) sem precisar de VPS paga — mas
  isso é hipótese minha, não fiz nada nessa direção até você pedir.

### 2026-09-02 (continuação) — login de administração pra você (Arthur)
Você pediu um login próprio pra administrar a barbearia, além do login de teste do
barbeiro que já existia.

- **Sem role de "dono" separada no schema hoje** — o painel só entende "barbeiro"
  (`barbeiros.user_id` vinculado a `auth.users`), e a barbearia inteira (Agenda,
  Clientes, Equipe, Serviços, Horários) já é visível pra qualquer barbeiro logado.
  Em vez de desenhar uma role nova (mudança de schema maior, não pedida), criei você
  como um barbeiro **com `ativo: false`** — dá login completo no painel, mas não
  aparece como coluna de profissional na grade da Agenda (você não presta serviço,
  só administra) nem teria como filho horários de trabalho fazendo sentido.
- **Criado via script descartável** (mesma técnica do `criar-usuario-teste.sh`: POST
  em `/auth/v1/admin/users` pra criar o login, depois insert em `barbeiros` linkado
  pelo `user_id`), rodado contra o Supabase cloud e apagado depois. Testado logando
  de verdade (POST `/auth/v1/token?grant_type=password`) antes de reportar pronto.
- **Seu login:** `arthur@barbeariapiloto.local` / `iabarber123` (mesma senha simples
  do login de teste do Igor — estamos em fase de teste local/piloto, sem stakes de
  segurança real ainda; troque antes de qualquer uso com cliente pagante de verdade).
- **Login de teste do barbeiro (já existia, não é novo):** `igor@barbeariapiloto.local`
  / `iabarber123`, recriável a qualquer momento com `database/criar-usuario-teste.sh`.

### 2026-09-02 (continuação) — painel web responsivo pra mobile
Você pediu pra deixar o painel bem trabalhado em celular — até aqui só tinha sido
testado/desenhado pra desktop (sidebar fixa de 196px, grade da Agenda com colunas
lado a lado, tabelas largas).

- **Navegação:** `Sidebar.tsx` ganhou um estado próprio de menu aberto/fechado.
  Abaixo de 860px de largura, a sidebar fixa vira um menu "drawer" (desliza da
  esquerda, `position: fixed` + `transform: translateX`), acionado por uma barra
  superior nova com botão hambúrguer + logo. Um fundo escurecido
  (`.fundo-menu-mobile`) fecha o menu ao tocar fora, e escolher qualquer aba já
  fecha o menu sozinho (`selecionar()` chama `onMudarAba` + fecha).
- **Cabeçalho das páginas (`cabecalho-painel`):** no mobile, quebra em várias
  linhas (`flex-wrap`) em vez de espremer título + navegação de data + botão numa
  linha só. Na Agenda, o bloco de navegação de data (`nav-data`) vira uma linha
  inteira própria, com o campo de data esticando pra ocupar o espaço.
- **Grade da Agenda (a parte mais arriscada pra mobile):** em vez de espremer as
  colunas dos barbeiros até ficarem ilegíveis, o quadro inteiro rola de lado
  (`overflow-x: auto`) com cada coluna mantendo uma largura mínima legível
  (200px) — mesmo comportamento de app de calendário de verdade em tela pequena.
  O eixo de horas (`eixo-horas`) fica `position: sticky` à esquerda, então as
  horas continuam visíveis mesmo rolando pros barbeiros mais à direita.
- **Tabelas** (`Clientes.tsx`, `Equipe.tsx`, `Servicos.tsx`): cada `<table
  className="tabela-lista">` foi envolvida num `<div className="tabela-scroll">`
  novo, que rola de lado em vez de quebrar o layout — a tabela em si ganhou
  `min-width: 480px` pra nunca comprimir as colunas a ponto de virar sopa de
  letrinha.
- **Modal "Novo agendamento" e tela de login:** larguras fixas (340px/320px)
  viraram `max-width` relativo à viewport (`max-width: 100%`/`88vw`), com
  padding no fundo do modal (`fundo-modal`) pra nunca encostar nas bordas da tela
  nem cortar em celulares bem estreitos.
- **Cards de métrica:** força 2 colunas no mobile (`grid-template-columns:
  repeat(2, 1fr)`) em vez do `auto-fit` que também funcionaria, mas por acaso
  ficava com proporção estranha em telas médias — 2x2 é o padrão mais comum de
  dashboard mobile mesmo.
- **Testado de verdade com Playwright** (instalado/desinstalado temporariamente
  de novo, sem tocar `package.json`): viewport de iPhone (375×812) logado de
  verdade, passando por Agenda, menu aberto, Clientes, Equipe, Serviços,
  Horários e o modal de novo agendamento — **zero scroll horizontal indevido na
  página** (`document.documentElement.scrollWidth === window.innerWidth`,
  conferido via `page.evaluate`, não só "parece bom" no screenshot) e zero erro
  de console. Rodei também um teste separado em viewport desktop (1400px) pra
  confirmar que nada regrediu (barra mobile continua escondida, layout idêntico
  a antes).
- `tsc -b` limpo em todos os arquivos alterados.

### 2026-09-02 (continuação) — painel no Vercel funcionando de verdade, celular incluso
Você testou pelo celular de verdade (Safari, iPhone) e achou dois problemas reais:

- **Primeiro teste foi num link antigo:** a URL que você tinha salva
  (`...4-arthurs-projects-bf401924.vercel.app`) era de um deploy específico de
  antes do ajuste de mobile — Vercel gera uma URL própria por deploy, então um
  link salvo não atualiza sozinho. Resolvido usando o domínio de produção
  (`iabarber-pearl.vercel.app`), que sempre aponta pro deploy mais recente.
- **Aba "Conversas" com "Não consegui falar com o backend (Load failed)":** causa
  real, confirmada por mim antes de mexer — `FRONTEND_ORIGIN` no `backend/.env`
  estava vazio (só um placeholder desde a sessão anterior), então mesmo com o
  túnel do Cloudflare no ar, o backend bloqueava a resposta por CORS pra
  qualquer origem que não fosse localhost/rede local. Corrigido: `FRONTEND_ORIGIN=
  https://iabarber-pearl.vercel.app`, backend reiniciado (matei o processo na
  porta 3001 e subi de novo, já que `.env` não recarrega sozinho com o
  `tsx watch`, só mudança de código). **Testado de verdade** com `curl -H
  "Origin: https://iabarber-pearl.vercel.app"` contra a URL do túnel, confirmando
  o header `Access-Control-Allow-Origin` certo antes de considerar resolvido.
- **Resultado:** painel funcionando 100% pelo celular, incluindo a aba
  Conversas (que depende do backend local via túnel) — confirmado por você
  ("Funcionando perfeitamente").
- **Fragilidade que vale registrar:** esse caminho (backend local + Evolution
  API local + túnel "quick" do Cloudflare sem conta) depende de 3 coisas
  continuarem de pé ao mesmo tempo neste PC: Docker Desktop, o processo do
  backend (`npm run dev`), e o processo do `cloudflared`. Se qualquer um cair
  (PC reiniciar, notebook dormir, terminal fechar), a Agenda/Clientes/Equipe/
  Serviços continuam funcionando (falam direto com o Supabase cloud), mas
  **Conversas** para de responder e a URL do túnel muda se o `cloudflared` for
  religado — precisaria atualizar `VITE_BACKEND_URL` no Vercel e redeployar de
  novo. Não é um problema agora (fase de validação), mas é a razão de existir o
  plano de deploy real na DigitalOcean documentado antes.

### 2026-09-02 (continuação) — painel-admin: novo app pra você administrar TODAS as barbearias
Você pediu um painel novo, separado do `painel-web` (que é escopado a uma barbearia
só, via barbeiro logado) — uma visão "por cima", cross-tenant, pra você como dono do
Corte Certo enxergar e gerenciar todas as barbearias cadastradas. Confirmei duas
decisões antes de começar (app novo e separado + já com gestão completa, não só
leitura), porque isso cria um nível de acesso novo no sistema.

- **Por que não dava pra fazer só com RLS (o jeito que o painel-web usa hoje):** RLS
  no `painel-web` restringe cada barbeiro à própria barbearia via
  `barbearia_id_do_usuario_atual()`. Um admin cross-tenant precisaria de policies
  novas em quase toda tabela, e a ação mais sensível (criar o **login** de um
  barbeiro novo) exige a Admin API do Supabase Auth, que só funciona com a service
  role key — nunca pode rodar no navegador. Por isso o `painel-admin` não fala com o
  Supabase direto: ele fala com o `backend` (rotas novas `/api/admin/*`), que aí sim
  usa a service role key, do mesmo jeito que `/api/conversas` já fazia pro
  painel-web.
- **Banco (`database/supabase/migrations/20260902144618_admin_corte_certo.sql`):**
  - Tabela `admins` nova (`user_id`, `nome`, `email`) — com RLS **ligado e sem
    nenhuma policy**, de propósito: bloqueia qualquer leitura/escrita direta via
    anon/authenticated key, só o service role do backend acessa. Separada da tabela
    `barbeiros` porque são conceitos diferentes (admin do produto vs. barbeiro de
    uma barbearia específica).
  - `barbearias` ganhou coluna `ativo` (não existia) — pra poder desativar uma
    barbearia sem apagar dado nenhum, mesmo padrão já usado em `servicos.ativo` e
    `agendamentos.status`.
  - `auditoria_admin` (já existia, criada pro modo admin do WhatsApp) passou a
    aceitar `admin_id` também, com `barbeiro_id` virando opcional — assim as ações
    feitas pelo painel novo entram no mesmo registro de auditoria das ações feitas
    pelo WhatsApp, em vez de duas tabelas de log separadas.
- **Backend (`backend/src/api/adminAuth.ts` + `backend/src/api/admin.ts`):** mesmo
  padrão do `exigirBarbeiroLogado` já existente, só que checando a tabela `admins`
  em vez de `barbeiros`. Rotas: listar barbearias (com contagem de barbeiros),
  criar barbearia, ver detalhe, editar/ativar/desativar, criar barbeiro dentro de
  uma barbearia (cria o login via Admin API **e** a linha em `barbeiros` — se um dos
  dois falhar, desfaz o outro pra não deixar login órfão sem barbeiro), ativar/
  desativar barbeiro. Toda mutação grava em `auditoria_admin`.
  - **Bug real pego durante o teste:** o middleware de CORS só liberava
    `GET,POST,OPTIONS` — as rotas de admin usam `PATCH`, e o primeiro teste real
    (Playwright) travou com erro de CORS no navegador antes de eu perceber e
    corrigir (`Access-Control-Allow-Methods` agora inclui `PATCH,DELETE` também).
- **App novo `painel-admin/`** (Vite + React + TS, mesmos tokens visuais do
  `painel-web` — Sora/Inter, mesma paleta escura, `Logo.tsx` copiado): tela de
  login própria, lista de barbearias com contagem de barbeiros e status, criar
  barbearia nova, abrir uma barbearia (dados, ativar/desativar, editar, lista de
  barbeiros com toggle ativo/inativo, adicionar barbeiro novo com login).
  - Isso também fecha uma lacuna que já estava documentada como bloqueada: a aba
    Equipe do `painel-web` sempre disse "novos membros... precisam ser cadastrados
    por quem administra o sistema — ainda não dá pra criar por aqui". Agora dá,
    pelo `painel-admin`.
  - **Testado de ponta a ponta com Playwright de verdade** (instalado/desinstalado
    temporariamente, sem tocar `package.json`): login como admin funciona; login
    com uma conta de barbeiro comum (Igor) é **rejeitado e desloga sozinho**
    (confirma que a rota `/api/admin/me` bloqueia quem não está na tabela `admins`,
    não é só o frontend escondendo botão); criar barbearia nova aparece na lista;
    abrir o detalhe, adicionar um barbeiro (criou login de verdade), desativar a
    barbearia inteira e o barbeiro individualmente — tudo confirmado via
    screenshot **e** conferindo os dados reais no banco depois (inclusive o
    registro em `auditoria_admin` de cada ação). Dados de teste apagados no fim
    (barbearia, barbeiro, e o usuário de auth órfão que a primeira tentativa
    falha tinha deixado pra trás).
- **Seu login do painel-admin:** `arthur@cortecerto.local` / `iabarber123`
  (identidade separada do seu login de barbeiro-admin da Barbearia Piloto,
  `arthur@barbeariapiloto.local` — são dois papéis diferentes, dois logins
  diferentes, de propósito).
- Rodando local em `http://localhost:5174` (`npm run dev -- --host` dentro de
  `painel-admin/`). **Não fiz deploy nem preparei Docker/Vercel pra esse app
  ainda** — não foi pedido, e a prioridade de custos deste projeto é validar antes
  de gastar/expandir escopo.
- **Ainda não commitado** — pasta nova inteira (`painel-admin/`) + migration nova
  + as 3 mudanças no `backend/` (CORS, `adminAuth.ts`, `admin.ts`, `index.ts`).

### Como usar a stack do Supabase local no dia a dia
```bash
cd /home/art/iabarber/database
npx supabase status       # ver se está no ar + reimprimir URLs/chaves
npx supabase stop         # desligar (libera memória/CPU quando não estiver usando)
npx supabase start        # ligar de novo
npx supabase db reset     # recriar o banco do zero a partir das migrations + seed.sql
npx supabase migration new nome_da_migration   # criar uma nova migration versionada
```
Studio (interface visual): http://127.0.0.1:54323

### Como conferir/subir o projeto inteiro
**Nota (2026-09-02): desde a migração pro PC Windows, o banco ativo é o Supabase
CLOUD** (`https://yfrmpxjgrdczyzthzrkh.supabase.co`), não mais o local — os comandos de
`npx supabase status`/`db reset` da seção acima seguem valendo se você quiser rodar um
Supabase local à parte pra experimentar algo sem afetar o banco de produção, mas o dia a
dia (`backend/.env`, `painel-web/.env`) aponta pro cloud.

```bash
# Evolution API (WhatsApp) — caminho é o deste PC (Windows, Docker Desktop)
cd c:/Users/ArT/projetos/iabarber/iabarber/evolution-api
docker compose ps && docker compose logs -f
curl http://localhost:8080

# Banco: Supabase cloud, não precisa "subir" nada — só aplicar migrations quando mudar
cd c:/Users/ArT/projetos/iabarber/iabarber/database
SUPABASE_ACCESS_TOKEN=<seu personal access token> npx supabase db push
# recriar login de teste (depois de qualquer mudança no projeto cloud que apague o vínculo):
API_URL=https://yfrmpxjgrdczyzthzrkh.supabase.co SERVICE_KEY=<secret key> ./criar-usuario-teste.sh

# Backend (webhook + IA) — precisa estar rodando pro WhatsApp responder
cd c:/Users/ArT/projetos/iabarber/iabarber/backend
npm run dev                  # porta 3001

# Painel web
cd c:/Users/ArT/projetos/iabarber/iabarber/painel-web
npm run dev -- --host        # porta 5173 (ou a próxima livre)
# login de teste: igor@barbeariapiloto.local / iabarber123

# Landing page (site público, sem login)
cd c:/Users/ArT/projetos/iabarber/iabarber/landing
npm run dev -- --host
```

### Como subir a stack de produção (droplet DigitalOcean, quando a conta existir)
```bash
cd deploy
cp .env.example .env                       # preencher DOMAIN, chaves do Supabase cloud
cp backend.env.example backend.env         # preencher Anthropic, Evolution, Supabase, FRONTEND_ORIGIN
cp evolution-api.env.example evolution-api.env   # preencher AUTHENTICATION_API_KEY, senha do Postgres
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
Ver o log de 2026-09-02 acima pra checklist completo antes de ir ao ar de verdade (conta
DO, domínio, DNS, reconectar WhatsApp nesse ambiente, ligar webhook por último).

## Preferências de trabalho
- Comunicação em português do Brasil.
- Prefiro entender o "porquê" de cada decisão técnica, não só o comando pronto.
- Sou desenvolvedor freelance com experiência em Linux, Git, Bash, Python e
  desenvolvimento web — pode ir direto ao ponto técnico, sem simplificar demais.
