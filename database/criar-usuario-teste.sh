#!/usr/bin/env bash
# Recria o usuário de teste do painel web (login do barbeiro "Igor" do seed) e vincula
# ao registro em `barbeiros`. Necessário depois de todo `supabase db reset`, porque o
# reset recria o schema `auth` do zero (o vínculo em `barbeiros.user_id` some junto,
# mesmo a linha do barbeiro continuando a existir via seed.sql).
set -euo pipefail
cd "$(dirname "$0")"

SERVICE_KEY=$(npx supabase status -o json | python3 -c "import json,sys; print(json.load(sys.stdin)['SERVICE_ROLE_KEY'])")
API_URL=$(npx supabase status -o json | python3 -c "import json,sys; print(json.load(sys.stdin)['API_URL'])")

EMAIL="igor@barbeariapiloto.local"
SENHA="iabarber123"
BARBEIRO_ID="00000000-0000-0000-0000-000000000010"

USER_ID=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$SENHA\",\"email_confirm\":true}" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")

docker exec -i supabase_db_database psql -U postgres -d postgres -c \
  "update barbeiros set user_id = '$USER_ID' where id = '$BARBEIRO_ID';"

echo "Login do painel web pronto: $EMAIL / $SENHA"
