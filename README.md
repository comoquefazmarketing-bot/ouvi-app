# OUVI

Base estrutural do MVP da OUVI, uma rede social visual focada em interações por áudio.

## Visão geral

- Layout mobile-first, dark-first.
- Feed com dados mockados e navegação para posts.
- Autenticação social com Google via Supabase.
- Onboarding para definição de username.
- Páginas legais LGPD-ready.

## Estrutura de pastas

```
src/
  app/            # Rotas (App Router)
  components/     # Componentes reutilizáveis
  lib/            # Dados e utilitários
  types/          # Tipagens compartilhadas
supabase/
  migrations/     # Migrations SQL
```

## Rotas

- `/` → Feed
- `/p/[postId]` → Tela de Post
- `/login` → Login com Google
- `/auth/callback` → Callback OAuth
- `/onboarding` → Definir username
- `/terms` → Termos de Uso
- `/privacy` → Política de Privacidade
- `/data` → Solicitação de dados

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para ver o app.

## Configuração do Supabase

Crie um projeto no Supabase e configure as variáveis em `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Google Auth

1. No Supabase, habilite o provedor Google em **Authentication → Providers**.
2. Configure as credenciais OAuth (Client ID/Secret) do Google.
3. Adicione a URL de callback do Supabase no Google Console.
4. Em **URL Configuration**, defina o **Site URL** e os **Redirect URLs**. Para desenvolvimento local:
   - Site URL: `http://localhost:3000`
   - Redirect URL: `http://localhost:3000/auth/callback`

### Migrations

A migration inicial está em `supabase/migrations/001_create_profiles.sql`.

Aplicar no Supabase:

```sql
-- execute o conteúdo do arquivo acima
```

### Testar login localmente

1. Inicie o projeto com `npm run dev`.
2. Acesse `http://localhost:3000/login`.
3. Faça login com Google e finalize o onboarding em `/onboarding`.
