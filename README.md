# Sumaré Hip Hop Festival — Site + Inscrições

Site do evento com formulário de inscrição embutido, controle real de vagas,
dashboard administrativo e exportação de dados. Pronto para publicar no Netlify.

**Stack:** React + Vite + TypeScript no front-end, Supabase (Postgres) como banco
de dados e autenticação.

**Por que Supabase:** tem plano gratuito generoso, Postgres real (não é
LocalStorage), permite controle de vagas 100% seguro contra concorrência
(usando trava de linha `FOR UPDATE` dentro de uma função de banco), e resolve
autenticação do admin sem precisar montar um backend à parte.

**Como o controle de vagas funciona:** toda inscrição passa por uma função
(`register_for_workshop`) que roda dentro de uma transação no banco. Essa
função trava a linha da oficina, conta quantas inscrições confirmadas já
existem e só libera a inserção se ainda houver vaga. Se duas pessoas
tentarem pegar a última vaga ao mesmo tempo, a segunda é bloqueada pelo
próprio banco — não depende do front-end.

**Como a área admin é protegida:** login por e-mail/senha via Supabase Auth.
Só usuários cadastrados na tabela `admins` conseguem ler a lista de inscritos
ou alterar oficinas — isso é garantido por Row Level Security (RLS) no banco,
não apenas pela tela de login.

---

## 1. Passo a passo — criar o banco no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto
   (escolha uma senha forte para o banco e guarde-a).
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql)
   deste projeto, cole no editor e clique em **Run**.
   Isso cria as tabelas, a view pública, as funções de inscrição/cancelamento,
   as regras de segurança (RLS) e já cadastra as 8 oficinas de exemplo.
4. Em **Project Settings → API**, copie:
   - **Project URL** → vai virar `VITE_SUPABASE_URL`
   - **anon public key** → vai virar `VITE_SUPABASE_ANON_KEY`

Essas duas informações são públicas por design (é assim que o Supabase
funciona) — a segurança real vem das políticas de RLS que já estão no
`schema.sql`, não da chave em si.

## 2. Criar seu usuário administrador

1. No Supabase, vá em **Authentication → Users → Add user** e crie seu
   usuário com e-mail e senha (marque "Auto Confirm User").
2. Copie o **UUID** desse usuário (aparece na lista de usuários).
3. Volte ao **SQL Editor** e rode:
   ```sql
   insert into admins (user_id) values ('COLE_O_UUID_AQUI');
   ```
4. Pronto — esse e-mail/senha agora acessa `/admin` no site.

Repita o passo 3 para cada pessoa que precisar acessar o dashboard.

## 3. Rodar localmente

```bash
npm install
cp .env.example .env
# edite o .env com sua URL e anon key do Supabase
npm run dev
```

Acesse `http://localhost:5173`. A área administrativa fica em
`http://localhost:5173/admin`.

## 4. Publicar no Netlify

1. Suba este projeto para um repositório no GitHub.
2. No Netlify: **Add new site → Import an existing project** → conecte o
   repositório.
3. Configurações de build (o `netlify.toml` já traz isso pronto):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Em **Site settings → Environment variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Clique em **Deploy site**.

O link gerado (ex: `sumare-hiphop.netlify.app`) é o que vai para o Instagram.
A página de inscrição fica em `/inscricao`.

## 5. Como editar as oficinas (sem mexer em código)

Acesse `/admin/oficinas` logado como administrador. Você pode:
- editar nome, professor(a), data, horário, duração e número de vagas;
- ativar/desativar inscrições de uma oficina específica;
- cadastrar novas oficinas caso a programação mude.

Tudo reflete no site imediatamente, sem precisar publicar de novo.

## 6. Como acompanhar e exportar as inscrições

Em `/admin/inscritos` você tem busca (nome, CPF, e-mail, telefone), filtros
por oficina e status, check-in no dia do evento, cancelamento (que libera a
vaga automaticamente) e reativação.

O botão **Exportar inscrições (CSV)** exporta exatamente o que está
filtrado na tela — então dá para exportar tudo ou só uma oficina específica
(filtre pela oficina e use "Exportar só esta oficina"). O CSV abre
corretamente no Excel, com acentuação preservada.

## 7. Regra de uma pessoa por aula (e como mudar no futuro)

Hoje a regra é: mesmo CPF não pode se inscrever duas vezes na **mesma**
oficina, mas pode se inscrever em oficinas diferentes, se houver vaga. Essa
regra está centralizada na função `register_for_workshop` no
`schema.sql` (no trecho que verifica `JA_INSCRITO`). Se no futuro vocês
quiserem limitar a "1 oficina por pessoa" ou "1 por dia", é só ajustar essa
função — não precisa mexer no front-end.

## 8. Sobre envio de confirmação por e-mail/WhatsApp

A estrutura já está pronta para isso (o código de inscrição e os dados do
participante ficam salvos), mas o envio automático não está implementado
neste primeiro momento, como combinado — evita depender de um serviço pago
antes de validar o fluxo principal. Quando quiserem adicionar, a forma mais
simples é criar uma Netlify Function que dispara ao término da função
`register_for_workshop` (via um Postgres Webhook do Supabase) chamando um
provedor de e-mail (Resend, SendGrid) ou WhatsApp (Twilio, Z-API).

## 9. Estrutura do projeto

```
src/
  pages/            Home, Inscricao, Confirmacao
  pages/admin/       Login, Dashboard, Inscritos, Oficinas
  components/        Header, Footer, WorkshopCard
  utils/             validação de CPF/e-mail, formatação, CSV
  supabaseClient.ts  cliente único do Supabase
supabase/
  schema.sql         schema completo do banco (rode uma vez no Supabase)
```

## 10. Segurança — o que já está garantido

- CPF, telefone e e-mail dos inscritos só são legíveis por administradores
  (RLS bloqueia leitura da tabela `registrations` para qualquer outro
  usuário, inclusive anônimo).
- A chave usada no front-end é a `anon key`, pública por design — ela não
  dá acesso a nada que as políticas de RLS não permitam.
- Inserção de inscrição só acontece pela função `register_for_workshop`,
  então não existe caminho para alguém escrever direto na tabela e burlar
  o limite de vagas.
- Nenhuma chave privada (`service_role`) é usada no front-end.
