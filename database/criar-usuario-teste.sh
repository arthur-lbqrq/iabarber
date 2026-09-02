#!/usr/bin/env bash
# Recria o usuário de teste do painel web (login do barbeiro "Igor" do seed) e vincula
# ao registro em `barbeiros`. Necessário depois de todo `supabase db reset` local, porque
# o reset recria o schema `auth` do zero (o vínculo em `barbeiros.user_id` some junto,
# mesmo a linha do barbeiro continuando a existir via seed.sql).
#
# Funciona tanto local quanto no projeto cloud: por padrão lê URL/chave do `supabase
# status` local; pra rodar contra o cloud, exporte API_URL e SERVICE_KEY antes de chamar
# (ex.: API_URL=https://<ref>.supabase.co SERVICE_KEY=<service_role/secret key> ./criar-usuario-teste.sh).
# A atualização do vínculo usa a REST API (PostgREST) com a service key, que ignora RLS
# de propósito — não depende mais de `docker exec` num container Postgres específico.
set -euo pipefail
cd "$(dirname "$0")"

if [ -z "${API_URL:-}" ] || [ -z "${SERVICE_KEY:-}" ]; then
  API_URL=$(npx supabase status -o json | python3 -c "import json,sys; print(json.load(sys.stdin)['API_URL'])")
  SERVICE_KEY=$(npx supabase status -o json | python3 -c "import json,sys; print(json.load(sys.stdin)['SERVICE_ROLE_KEY'])")
fi

EMAIL="igor@barbeariapiloto.local"
SENHA="iabarber123"
BARBEIRO_ID="00000000-0000-0000-0000-000000000010"

USER_ID=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA\",\"email_confirm\":true}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

curl -s -X PATCH "$API_URL/rest/v1/barbeiros?id=eq.$BARBEIRO_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\"}" > /dev/null

echo "Login do painel web pronto: $EMAIL / $SENHA"
