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
4. Em seguida, rode também o arquivo [`supabase/migration_v2.sql`](./supabase/migration_v2.sql)
   (nova query, colar, Run). Ele adiciona: data de nascimento, autorização de uso de
   imagem, fluxo de menor de idade, a tabela `event_settings` (local/datas
   configuráveis) e reforça o cadastro das 8 oficinas caso alguma esteja faltando.
   **Se você já rodou o projeto antes só com o `schema.sql`, rode agora o
   `migration_v2.sql` — ele não apaga nada, só adiciona.**
5. Em **Project Settings → API**, copie:
   - **Project URL** → vai virar `VITE_SUPABASE_URL`
   - Na aba **API Keys**, dentro de **"Legacy anon, service_role API keys"**,
     copie a **anon key** (formato `eyJhbGciOiJIUzI1NiIs...`) → vai virar
     `VITE_SUPABASE_ANON_KEY`. Use essa, e não a "publishable key" nova
     (`sb_publishable_...`), pois a versão da biblioteca usada neste projeto
     espera o formato antigo.

Essas informações são públicas por design (é assim que o Supabase
funciona) — a segurança real vem das políticas de RLS que já estão no
`schema.sql`, não da chave em si.

## 2. Acessar a área administrativa

- **URL**: `/admin` (ex: `https://seu-site.netlify.app/admin`). Se você não estiver
  logado, ela redireciona automaticamente para `/admin/login`.
- **Como criar o usuário administrador**: no Supabase, vá em
  **Authentication → Users → Add user**, crie um e-mail e senha (marque
  "Auto Confirm User"). Copie o **UUID** desse usuário.
- Volte ao **SQL Editor** e rode:
  ```sql
  insert into admins (user_id) values ('COLE_O_UUID_AQUI');
  ```
  Sem esse passo, o login até funciona, mas o dashboard fica bloqueado com
  "Acesso não autorizado" — é a proteção por Row Level Security funcionando.
- Repita o passo do UUID para cada pessoa que precisar acessar o `/admin`.
- **Recuperar/trocar senha**: pelo próprio Supabase, em Authentication → Users,
  clique nos três pontinhos ao lado do usuário → "Send password recovery" ou
  edite diretamente. Não existe fluxo de "esqueci minha senha" na tela de
  login do site — isso é gerenciado direto no Supabase.

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

Tudo reflete no site imediatamente, sem precisar publicar de novo. A página
pública `/oficinas` mostra a mesma lista para quem está se inscrevendo.

## 5.1 Como editar o local, as datas e o PDF de autorização de menores

Acesse `/admin/configuracoes`. Esse painel edita a tabela `event_settings`
(uma única linha no banco) com:
- nome e endereço do local do evento;
- data de início e término (usada para calcular a idade dos participantes
  **na data do evento**, não na data da inscrição);
- link do PDF de autorização para menores de idade.

Como Home, Oficinas, Inscrição e Confirmação leem esses valores direto do
banco, mudar aqui atualiza o site inteiro de uma vez — não existe mais texto
de local "hardcoded" espalhado pelo código.

Para o PDF de autorização: hospede o arquivo em qualquer lugar acessível
publicamente (ex: um link do Google Drive com compartilhamento público, ou
suba o PDF nos Storage Buckets do próprio Supabase e use a URL pública
gerada) e cole o link nesse campo. Enquanto não houver link cadastrado, o
formulário mostra um aviso de que o modelo "será disponibilizado em breve".

## 6. Menores de idade

O formulário pede data de nascimento e calcula automaticamente se a pessoa
é menor de 18 anos **considerando a idade na data de início do evento**
(configurável em `/admin/configuracoes`), não a idade no dia da inscrição.

Se for menor:
- aparece um aviso com o link de download da autorização (se configurado);
- fica obrigatório o checkbox de ciência sobre a autorização do responsável;
- a inscrição é salva com `guardian_authorization_status = 'pendente'`.

No admin (`/admin/inscritos`), cada menor aparece com uma etiqueta "Menor" e
um seletor para marcar a autorização como "Pendente" ou "Confirmada" assim
que o papel assinado chegar fisicamente no dia do evento (ou por e-mail). Há
também um filtro "Só menores de idade" para localizar rapidamente esses
participantes, e um indicador no Dashboard mostrando quantos menores estão
inscritos e quantas autorizações já foram confirmadas.

O upload do PDF assinado pelo responsável não está implementado ainda (como
combinado, para não aumentar a complexidade neste momento), mas a estrutura
já está pronta: quando quiserem adicionar, basta um novo campo de arquivo no
formulário enviando para o Supabase Storage e salvando a URL numa nova coluna
em `registrations`.

## 7. Como cadastrar oficinas iniciais / repopular o banco

O `schema.sql` já cadastra as 8 oficinas do evento automaticamente (com 30
vagas cada, valores provisórios e totalmente editáveis depois). Se por
algum motivo elas não aparecerem no site (por exemplo, se o `schema.sql` foi
rodado parcialmente), rode o `migration_v2.sql` — ele verifica oficina por
oficina e insere só as que estiverem faltando, sem duplicar nada. Você
também pode sempre cadastrar manualmente pelo `/admin/oficinas`.

## 8. Como acompanhar e exportar as inscrições

Em `/admin/inscritos` você tem busca (nome, CPF, e-mail, telefone), filtros
por oficina e status, check-in no dia do evento, cancelamento (que libera a
vaga automaticamente) e reativação.

O botão **Exportar inscrições (CSV)** exporta exatamente o que está
filtrado na tela — então dá para exportar tudo ou só uma oficina específica
(filtre pela oficina e use "Exportar só esta oficina"). O CSV abre
corretamente no Excel, com acentuação preservada.

## 9. Regra de uma pessoa por aula (e como mudar no futuro)

Hoje a regra é: mesmo CPF não pode se inscrever duas vezes na **mesma**
oficina, mas pode se inscrever em oficinas diferentes, se houver vaga. Essa
regra está centralizada na função `register_for_workshop` no
`schema.sql` (no trecho que verifica `JA_INSCRITO`). Se no futuro vocês
quiserem limitar a "1 oficina por pessoa" ou "1 por dia", é só ajustar essa
função — não precisa mexer no front-end.

## 10. Sobre envio de confirmação por e-mail/WhatsApp

A estrutura já está pronta para isso (o código de inscrição e os dados do
participante ficam salvos), mas o envio automático não está implementado
neste primeiro momento, como combinado — evita depender de um serviço pago
antes de validar o fluxo principal. Quando quiserem adicionar, a forma mais
simples é criar uma Netlify Function que dispara ao término da função
`register_for_workshop` (via um Postgres Webhook do Supabase) chamando um
provedor de e-mail (Resend, SendGrid) ou WhatsApp (Twilio, Z-API).

## 11. Estrutura do projeto

```
src/
  pages/             Home, Oficinas, Inscricao, Confirmacao
  pages/admin/        Login, Dashboard, Inscritos, Oficinas, Configuracoes
  components/         Header, Footer, InstitutionalBar, WorkshopCard
  hooks/               useEventSettings (local/datas/PDF de autorização)
  utils/               validação de CPF/e-mail/data, cálculo de idade, CSV
  supabaseClient.ts   cliente único do Supabase
supabase/
  schema.sql          schema base (rode primeiro, uma vez)
  migration_v2.sql    campos novos: nascimento, imagem, menores, event_settings
```

## 12. Variáveis de ambiente necessárias no Netlify

Só estas duas, em Site settings → Environment variables:

- `VITE_SUPABASE_URL` — URL do projeto (Project Settings → API no Supabase)
- `VITE_SUPABASE_ANON_KEY` — a **anon key** no formato antigo (aba "Legacy
  anon, service_role API keys" em Project Settings → API Keys). Não use a
  `service_role` nem a `sb_publishable_...` nova.

Depois de criar ou editar essas variáveis, é sempre necessário rodar
**Deploys → Trigger deploy → Clear cache and deploy site** — só salvar a
variável não refaz o build sozinho.

## 13. Checklist de teste completo em produção

1. Abrir a home — conferir se aparece a faixa "Realização / apoio
   institucional" visível (não só no rodapé).
2. Clicar em "Oficinas" no menu → conferir se `/oficinas` lista as 8
   oficinas com vagas.
3. Clicar em "Quero me inscrever" numa oficina → deve cair em `/inscricao`
   já com aquela oficina selecionada.
4. Preencher nome, CPF, telefone, e-mail e uma data de nascimento que torne
   a pessoa maior de idade na data do evento → não deve aparecer o aviso de
   menor.
5. Testar de novo com uma data de nascimento que torne a pessoa menor de
   idade → deve aparecer o aviso vermelho com o checkbox extra obrigatório.
6. Marcar os checkboxes obrigatórios (uso de imagem + veracidade dos dados,
   e o de responsável se for o teste de menor) e enviar.
7. Conferir a tela de confirmação com o código gerado (`SHHF-...`).
8. Entrar em `/admin` com seu usuário administrador.
9. Em `/admin/inscritos`, localizar a inscrição de teste, conferir idade,
   status de autorização (se testou como menor) e a oficina certa.
10. Testar o filtro "Só menores de idade".
11. Exportar o CSV e conferir se as colunas novas (nascimento, idade,
    autorização) vieram preenchidas.
12. Em `/admin/configuracoes`, trocar o nome do local e salvar → voltar na
    home e na tela de confirmação e conferir se o texto mudou.

## 14. Inscrição em múltiplas oficinas, vagas e lista de espera (nova versão)

A partir desta atualização, o fluxo mudou de "uma inscrição por oficina" para
"um participante, várias oficinas, um único formulário":

- Em `/oficinas`, cada card tem um botão de seleção (não navega mais direto).
  A pessoa pode marcar quantas oficinas quiser, de qualquer dia.
- Uma barra fixa aparece no rodapé da tela mostrando as oficinas selecionadas,
  com botão **"Inscrever-se nas selecionadas"**.
- Em `/inscricao`, o formulário aparece uma única vez. Ao enviar, todas as
  oficinas selecionadas são registradas de uma vez, vinculadas ao mesmo CPF —
  não existem mais 3 cadastros separados para 3 oficinas.
- A tela de confirmação (`/confirmacao/:batchId`, note que a URL mudou de
  `:code` para `:batchId`) mostra todos os códigos do envio de uma vez.

**Rode `supabase/migration_v3.sql` no SQL Editor do Supabase** (depois do
`schema.sql` e do `migration_v2.sql`) para habilitar isso — ele muda o limite
de vagas para 150 por oficina, cria o status de lista de espera e a nova
função `register_for_workshops` (no plural) que o site agora usa.

### Lista de espera

Quando uma oficina atinge 150 inscrições **confirmadas**, qualquer nova
tentativa de inscrição nela entra automaticamente como **lista de espera**
em vez de travar a inscrição inteira — as outras oficinas do mesmo envio que
ainda tiverem vaga são confirmadas normalmente. A pessoa vê isso claramente
na tela de confirmação.

No admin (`/admin/inscritos`), inscrições na lista de espera aparecem com a
etiqueta "Lista de espera" e um botão **"Promover"**, que move a pessoa para
confirmado assim que surgir vaga (por exemplo, após um cancelamento). O
filtro de status inclui a opção "Lista de espera".

### Visão por participante

Em `/admin/inscritos`, marque "Agrupar por participante" para ver cada
pessoa uma única vez, com a lista de todas as oficinas em que ela está
inscrita (em vez de uma linha por oficina).

### Professores: foto e biografia

Em `/admin/oficinas`, cada oficina agora tem dois campos opcionais: **URL da
foto do professor** e **biografia/release**. Preenchendo isso, o card da
oficina mostra a foto (ou as iniciais, se não houver foto) e o botão
"Conheça o professor" abre um modal com a biografia completa.

## 15. Logos institucionais

A régua oficial de logos (Prefeitura de Sumaré, Secretaria de Cultura e
Turismo, Sistema Nacional de Cultura, Política Nacional Aldir Blanc e
Ministério da Cultura) já está aplicada como veio, sem recorte nem
recoloração, em `src/assets/regua_institucional.webp`. Ela aparece:
- na Home, em uma seção própria antes do rodapé;
- no rodapé de todas as páginas públicas (via componente `InstitutionalBar`,
  usado dentro de `Footer`).

Se a Prefeitura enviar uma versão atualizada da régua, basta substituir esse
arquivo (mantendo o mesmo nome) e o site inteiro atualiza sozinho.

## 16. Segurança — o que já está garantido

- CPF, telefone e e-mail dos inscritos só são legíveis por administradores
  (RLS bloqueia leitura da tabela `registrations` para qualquer outro
  usuário, inclusive anônimo).
- A chave usada no front-end é a `anon key`, pública por design — ela não
  dá acesso a nada que as políticas de RLS não permitam.
- Inserção de inscrição só acontece pela função `register_for_workshop`,
  então não existe caminho para alguém escrever direto na tabela e burlar
  o limite de vagas.
- Nenhuma chave privada (`service_role`) é usada no front-end.
