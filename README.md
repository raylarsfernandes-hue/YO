# K-Pop Fest Sumaré 2026 — site, inscrições, painel e credenciamento

Site público + inscrições (competição e workshops) + painel administrativo +
credenciamento no dia do evento. React + TypeScript + Vite no front, Supabase
como banco/autenticação/storage, Netlify para hospedagem.

Esta é a primeira versão completa e revisável do projeto, conforme combinado —
não a versão final. A seção **10. O que ainda falta** lista tudo que está
pendente de decisão da organização ou de próxima etapa de desenvolvimento.

---

## 1. Arquitetura em resumo

```
src/
  pages/            → Home.tsx monta a página pública única; pages/home/
                       tem cada seção (Evento, Programação, Competições,
                       Workshops, Jurados, Regulamentos, FAQ); Inscrição na
                       competição e em workshop ficam em rotas próprias
  pages/admin/       → painel (login, dashboard, inscrições, workshops,
                       conteúdo do site, crachás, certificados, histórico,
                       equipe, credenciamento)
  components/        → Header, Footer, Section, StatusBadge, EmBreve
  lib/               → cliente Supabase, hooks de config/sessão, upload
  types/             → tipos TypeScript compartilhados
supabase/
  schema.sql         → tabelas base
  policies.sql       → Row Level Security (quem pode ler/escrever o quê)
  rpc.sql            → função original de inscrição na competição
  storage.sql        → políticas dos buckets de arquivo
  migration_02.sql   → crachás/QR, certificados, aprovação de figurino/cenário
  migration_03.sql   → vagas por categoria, faixas por dia, música, termo de menor
  rpc_v2.sql         → substitui a função de inscrição (vagas, abertura por
                       data, dia sugerido, análise de música)
  rpc_vagas.sql      → consulta pública de vagas por categoria (sem dado pessoal)
```

**O site é uma página única com âncoras**, seguindo o pedido mais recente: o
menu no topo (`O evento`, `Programação`, `Competições`, `Workshops`,
`Jurados`, `Regulamentos`, `FAQ`) rola suavemente até a seção correspondente
na Home e destaca qual está ativa. Links antigos para páginas separadas
(`/evento`, `/workshops` etc.) continuam funcionando — redirecionam para a
âncora certa.

**Distribuição visual do site público:** segue o brand board aprovado —
abertura em fundo escuro (Night `#07061B`), seções alternando rosa
(`#FF3FC7`), roxo (`#8A4DFF`) e azul (`#4B86FF`), com respiros escuros
(Night/Night-soft) entre blocos. Título em Inter 800, textos de interface
(tags, badges, protocolos) em JetBrains Mono, ecoando a estética "janela
digital" do board. Paleta em `src/styles/theme.css`, como variáveis CSS — se
os códigos oficiais mudarem, é um arquivo só para editar.

**Por que nada é hardcoded:** datas, endereço, prazos e regras de abertura de
inscrição, vagas e textos de "em breve" vivem no banco (`configuracao`,
`categorias_competicao`, `faixas_etarias`), editáveis pelo painel (aba
"Conteúdo do site"). Isso evita reabrir o código toda vez que uma informação
for confirmada.

---

## 2. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode nesta ordem:
   1. `supabase/schema.sql`
   2. `supabase/policies.sql`
   3. `supabase/rpc.sql`
   4. `supabase/migration_02.sql`
   5. `supabase/migration_03.sql`
   6. `supabase/rpc_v2.sql`
   7. `supabase/rpc_vagas.sql`
   8. `supabase/migration_04.sql`
   9. `supabase/migration_05.sql`
3. Em **Storage**, crie três buckets:
   - `midia-publica` → público
   - `documentos-privados` → **privado**
   - `regulamentos` → público
   Depois rode `supabase/storage.sql` no SQL Editor.
4. Em **Settings → API**, copie a `Project URL` e a `anon public key`.

## 3. Configurar o projeto localmente

```bash
cp .env.example .env.local
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

## 4. Criar o primeiro administrador (procedimento seguro)

Não existe cadastro público de administrador — é proposital, para não abrir
uma porta de escalonamento de privilégio.

1. No painel do Supabase: **Authentication → Users → Invite user**. Informe
   o e-mail da pessoa; ela recebe um link para definir a senha.
2. Copie o **UUID** desse usuário (aparece na lista de usuários).
3. No **SQL Editor**, rode (troque os valores):
   ```sql
   insert into equipe (id, nome, email, perfil)
   values ('COLE-O-UUID-AQUI', 'Nome da pessoa', 'email@exemplo.com', 'administrador');
   ```
4. A partir daí, novos membros da equipe podem ser adicionados direto pelo
   painel (`/admin/equipe`), repetindo o passo 1 e 2 para gerar o login.

## 5. Deploy no Netlify

1. Suba o projeto para um repositório no GitHub.
2. No Netlify: **Add new site → Import an existing project**, conecte o
   repositório.
3. Build command: `npm run build` · Publish directory: `dist` (já configurado
   em `netlify.toml`).
4. Em **Site settings → Environment variables**, adicione
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Deploy. O `netlify.toml` já redireciona todas as rotas para o
   `index.html`, necessário para o React Router funcionar em URLs diretas
   (ex: acessar `/programacao` direto, sem passar pela Home).

## 6. Uso do painel

Acesse `/admin/login`. Três perfis:

- **Administrador** — tudo: configuração do site, juradas/professoras,
  workshops, programação, regulamentos, equipe, inscrições e credenciamento.
- **Equipe de inscrições** — vê e analisa inscrições (competição e
  workshops), muda status, escreve observações internas.
- **Credenciamento** — só a tela de credenciamento.

Na aba **Inscrições**, cada card abre uma ficha com os dados da apresentação,
integrantes e um campo de observações internas; os botões de status
(recebida → em análise → confirmada, etc.) ficam ali mesmo.

## 7. Credenciamento no evento

Em `/admin/credenciamento`: leitura de QR Code pela câmera do celular ou
busca manual por nome/protocolo. Ao abrir uma apresentação, cada integrante
aparece com um botão "Registrar chegada" — a marcação é individual, não em
bloco, para grupos. Para participantes menores de idade, aparece também o
status do termo de responsabilidade (a conferir / conferido / pendência),
com o documento sendo apresentado fisicamente nesse momento — não é
coletado por upload na inscrição.

Os crachás com QR Code são gerados em `/admin/crachas`, a partir das
apresentações já confirmadas — o QR carrega só o id (uuid) do integrante,
sem nenhum dado pessoal.

## 8. Variáveis de ambiente

Veja `.env.example`. Nenhuma chave de administrador (service role) é usada
no frontend — só a chave anônima pública, protegida pelas políticas de Row
Level Security do banco.

## 9. Checklist dos fluxos principais

- [x] Inscrição na competição grava responsável + apresentação + integrantes
      numa transação só (`rpc inscrever_apresentacao`), valida categoria,
      vagas e prazo, e bloqueia duplicidade da mesma pessoa na mesma
      categoria.
- [x] Inscrição em workshop trava a linha do workshop durante o insert
      (`for update`) para não estourar capacidade em envios simultâneos, e
      cai em lista de espera automaticamente quando a turma enche.
- [x] Documentos pessoais vão para bucket privado, nunca público.
- [x] Painel exige login; RLS bloqueia leitura de dados de inscrição para
      quem não é da equipe.
- [x] Credenciamento impede duplicidade (índice único no banco) e preserva
      histórico de quem registrou o quê.
- [x] Vagas por categoria e abertura por data/hora são validadas no servidor
      (`rpc_v2.sql`), não só na interface — travando a linha da categoria
      durante a inscrição para evitar estourar vagas em envios simultâneos.
- [x] A consulta pública de vagas (`vagas_por_categoria`) devolve só
      contagens agregadas, nunca dados de inscrições individuais.
- [ ] Testar em produção com Supabase e Netlify reais — o que foi validado
      aqui foi o build (`npm run build`) e a checagem de tipos (`tsc -b`);
      o ambiente de desenvolvimento não tem acesso a um projeto Supabase
      real para testar as chamadas de rede fim a fim.

## 10. O que ainda falta

**Pendências de decisão da organização** (a maioria já está registrada como
comentário nas tabelas `configuracao` e nos campos do regulamento):

- Terceira jurada — nomes, fotos e biografias das confirmadas; títulos e
  conteúdo exatos de cada um dos seis workshops.
- Divergência de data: este site assume 31/10–01/11, mas o regulamento
  anexado ainda cita 30/10–01/11.
- Horário de encerramento dos dois dias — não foi definido, então não
  aparece em nenhuma tela.
- Regra de tolerância de 20% na média de idade dos grupos — não foi
  implementada como fórmula automática; a faixa etária sugerida na
  inscrição é sempre revisável pela equipe.
- Faixas de nota e tratamento do empate exato em 9,0 na classificação.
- Exigência (ou não) do responsável pela iluminação — campo mantido como
  configurável, com a inconsistência do regulamento registrada no formulário.
- Formato e tamanho máximo do arquivo de música — hoje o formulário aceita
  qualquer arquivo de áudio; a organização pode restringir isso depois.
- Vagas por categoria, por faixa etária e por dia — ficam em branco (sem
  limite) até a organização configurar em "Vagas e categorias" no painel.
- Horário exato de abertura das inscrições — hoje configurado para
  01/10/2026 00h00 (fuso de São Paulo) como você definiu; ajustável em
  Configuração geral.
- Endereço do Centro Esportivo e link do mapa — marcados como "em
  conferência" até a organização confirmar.
- Versão final dos três documentos (competição, workshops e termo de menor)
  — os arquivos anexados foram tratados como documentos de trabalho, e a
  minuta do termo de menor precisa de revisão jurídica antes de virar a
  versão vigente.

**Próximas etapas de desenvolvimento** (não implementadas ainda, para não
apresentar como pronto o que não está):

- Reenvio de comprovante por e-mail — não há serviço de e-mail configurado;
  hoje o comprovante fica só na tela após o envio, como avisado no formulário.
- Editor de configuração com campos dedicados (hoje a aba "Configuração
  geral" edita o JSON bruto — funcional, mas não é a interface mais amigável
  para quem não é técnico).
- Posicionamento configurável do nome no certificado (hoje é sempre
  centralizado no meio da página).
- Download dos certificados em lote como um único .zip — hoje cada PDF baixa
  separadamente.
- Capacidade de workshop e de competição cruzada com faixa etária e dia ao
  mesmo tempo — hoje é possível limitar por categoria (competição) e por
  sessão (workshop), mas não por faixa etária dentro da mesma categoria.
- Alerta de conflito de horário entre workshops na inscrição — hoje a
  inscrição permite mais de um workshop sem checar sobreposição de horário.
- Testar em produção com Supabase e Netlify reais — o que foi validado aqui
  foi o build (`npm run build`) e a checagem de tipos (`tsc -b`); o ambiente
  de desenvolvimento não tem acesso a um projeto Supabase real para testar
  as chamadas de rede fim a fim.
- O mapa do rodapé usa a URL pública `google.com/maps?...&output=embed`, que
  não exige chave de API mas pode exibir uma marca d'água de "apenas para
  desenvolvimento" dependendo da política atual do Google. Se isso aparecer
  em produção, a alternativa é gerar uma chave do Google Maps Embed API (tem
  cota gratuita) ou trocar por OpenStreetMap.

## 11. Histórico de mudanças

**2ª rodada** — crachás com QR Code (`/admin/crachas`), leitura de crachá no
credenciamento, desfazer credenciamento com motivo e histórico, presença em
workshops separada da inscrição, certificados em PDF a partir de modelo
(`/admin/certificados`), aprovação de figurino/cenário na ficha da
apresentação, tela de histórico de ações (`/admin/historico`).

**3ª rodada** — site convertido em página única com âncoras e menu com
rolagem suave; programação com os horários e distribuição de dias definidos;
seção de jurados com perfil completo (release, redes sociais, vídeo,
workshops ministrados); workshops com nível de aula; FAQ completa agrupada
por assunto; upload de música na inscrição com detecção real de duração e
sinalização (nunca rejeição automática) de casos fora da tolerância; vagas
configuráveis por categoria com contagem pública em tempo real; abertura das
inscrições por data/hora exata; termo de menor como documento versionado,
conferido fisicamente no credenciamento em vez de upload na inscrição.

**4ª rodada** — seção de jurados redesenhada: imagens grandes e retangulares
(sem corte, `object-fit` natural), release completo sempre visível (sem
botão "leia mais"), identificação "Professora e jurada"/"Jurada"/"Professora"
conforme o cadastro, só os links de rede social que existirem. Três colunas
no computador e uma por vez no celular, sem carrossel — removi o vídeo de
referência e a lista de workshops ministrados desse cartão para dar espaço
ao release completo, como pedido. No painel, `pessoas_convidadas` agora tem
edição completa (o formulário carrega os dados existentes e salva no mesmo
registro, incluindo troca de foto) e exclusão com confirmação: se a pessoa
estiver vinculada a algum workshop, o painel lista os workshops antes de
excluir e, se confirmado, desvincula (sem apagar o workshop ou inscrições)
antes de remover o cadastro. O rodapé ganhou um bloco de local com mapa
incorporado (Google Maps, sem precisar de chave de API) e botão "Como
chegar" com a rota direto pro endereço cadastrado; se a localização ainda
não foi confirmada pela organização, aparece um aviso discreto ao lado do
mapa.

**5ª rodada** — logo oficial e mascote Sori na hero (o título em texto virou
uma imagem, com `alt` mantendo o nome do evento acessível para leitores de
tela), mascote grande no espaço à direita, sem sobrepor textos ou botões, e
reorganização em sequência vertical no celular. Régua institucional (logos
da Prefeitura/Governo) preparada na hero e no rodapé, lendo de um campo
`regua_institucional` configurável no painel (aba Configuração geral) — o
componente simplesmente não aparece enquanto o arquivo não for enviado, sem
inventar um substituto (ver observação abaixo). Releases das juradas agora
preservam os parágrafos exatamente como digitados no painel (Enter duas
vezes separa parágrafo; Enter uma vez quebra linha dentro do parágrafo),
com alinhamento à esquerda e espaçamento confortável, nunca justificado.
Revisão de travessões nos textos públicos (home, seções, formulários de
inscrição e rodapé), substituídos por vírgula, ponto, dois-pontos ou
parênteses conforme o sentido de cada frase — hífens de "K-pop" e
"inscreva-se" preservados, nenhum link ou identificador alterado. A tela de
"inscrições ainda não abertas" ganhou a ilustração do mascote ao lado do
aviso, com botões de "Voltar ao início" e "Ver workshops".

**Observação sobre arquivos:** a régua de logos institucionais chegou na
rodada seguinte (6ª) e já está em uso — ver changelog abaixo.

O logo e o mascote oficiais foram redimensionados e convertidos para WebP
(mantendo transparência e qualidade visual) antes de entrar no projeto: o
logo caiu de 947KB para 46KB, e o mascote de 1,6MB para 52KB. Ficam em
`public/marca/logo.webp` e `public/marca/mascote.webp` (o mascote não está
mais aplicado em nenhuma tela desde a 6ª rodada, mas o arquivo continua no
projeto) — para trocar por uma versão oficial diferente no futuro, é só
substituir o arquivo (mesmo nome) e rodar o build de novo.

**6ª rodada** — mascote removido da hera e da tela de inscrição (arquivo
mantido no projeto, só sem aplicação nesses dois lugares); logo ampliado e
com uma versão de exibição sem as bordas vazias (`public/marca/logo-
exibicao.webp`, arquivo original preservado); régua institucional real
aplicada na hera e no rodapé, usando o arquivo oficial enviado (Prefeitura,
Secretaria de Cultura e Turismo, SNC, Política Nacional Aldir Blanc e
Ministério da Cultura) — as marcas do arquivo são brancas, pensadas para
fundo escuro, por isso o componente não usa mais um cartão de fundo claro
atrás; seção "O evento" com um ícone por caixa (recortados da própria folha
de ícones da identidade visual — dedinho coreano, bandeira da Coreia, fone
de ouvido, microfone) e cores rosa/roxo/azul distribuídas nas bordas e nos
fundos dos ícones dos cards; competições com uma cor de destaque por
categoria e etiquetas de faixa etária que não dependem só da cor; premiação
corrigida para R$ 1.000 (maior nota) e R$ 500 (segunda maior nota) — valor
centralizado em um único lugar no código; FAQ reorganizada em três grupos
recolhíveis (só um aberto por vez), com as perguntas dentro de cada grupo
também recolhíveis, sem perder nenhuma pergunta ou resposta.

**Pendência de arquivo desta rodada:** o regulamento em PDF publicado pelo
painel pode ainda conter os valores antigos (R$ 800 / R$ 200) — isso é um
documento que a equipe sobe pelo painel (Conteúdo do site → Regulamentos),
não algo gerado pelo código. Vale conferir e republicar uma versão
atualizada antes da divulgação final.

**7ª rodada** — hera reconstruída em duas colunas (logo grande à esquerda,
texto/tags/botões/régua institucional à direita), com os elementos
gráficos da identidade (corações, sparkle, nota musical, pontilhados e
linhas diagonais) posicionados nos cantos, como nas peças de Instagram do
festival — decorativos, sem informação, por isso saem da leitura de tela
e não capturam clique. Removida a etiqueta "data de planejamento" ao lado
da data do evento, já confirmada. No celular, a hera volta a uma coluna e
os elementos decorativos somem para não brigar com o conteúdo.

**8ª rodada** — bloqueio das inscrições (competição e workshops) até
01/10/2026 00h00 (horário de Brasília), e nova seção Random Play Dance.
Ver detalhes na seção 12 abaixo.

## 12. Bloqueio de inscrições até 01/10/2026

Todo botão e link do site que levava direto para `/inscricao` ou
`/inscricao-workshop` agora passa pelo componente `BotaoInscricao`
(`src/components/BotaoInscricao.tsx`), que decide sozinho, a cada
renderização, se a inscrição correspondente já está aberta:

- **Aberta:** funciona exatamente como antes — link normal para o
  formulário, com o texto original ("Quero competir", "Inscreva-se" etc.).
- **Fechada:** vira um botão com o texto **"Inscrições a partir de 01/10"**
  que, ao ser clicado, mostra um aviso flutuante com a mensagem *"As
  inscrições para as competições e os workshops serão abertas em 1º de
  outubro. Fique de olho!"* — sem navegar para lugar nenhum.

Isso cobre a Home (hera, seção "O evento", seção "Competições", cada card
de workshop com inscrição aberta) e o cabeçalho do site inteiro.

**Acesso direto por link** (alguém que já tenha o link `/inscricao` ou
`/inscricao-workshop` salvo, ou digite direto na barra de endereço): as
duas páginas de formulário verificam a mesma configuração antes de
mostrar qualquer campo. Enquanto fechado, mostram a mesma mensagem, com
botões para voltar à Home ou ver a seção correspondente — o formulário em
si nunca chega a renderizar.

**No servidor** (a camada que realmente importa — impede envio mesmo que
alguém contorne a interface): as duas funções do banco que processam
inscrição (`inscrever_apresentacao` e, a partir de `migration_05.sql`,
`inscrever_workshop` também) recusam o envio com um erro claro se a
configuração não estiver com `aberta: true` e a data/hora atual não tiver
passado de `abertura_prevista`. Isso significa que mesmo uma chamada
direta à API do Supabase (fora do site) é bloqueada.

**Onde mora a configuração:** tabela `configuracao`, chaves
`inscricao_competicao` e `inscricao_workshops`, campo `abertura_prevista`
(ISO 8601 com fuso, ex: `2026-10-01T00:00:00-03:00`) e campo `aberta`
(precisa ser `true` além da data já ter passado). A `migration_05.sql`
já deixa as duas configuradas para abrir sozinhas em 01/10/2026 à
meia-noite, horário de Brasília — **nenhuma ação manual é necessária**
nessa data. Para editar depois (adiar, antecipar ou pausar), é só entrar
em `/admin/conteudo` → aba "Configuração geral" e alterar o JSON dessas
duas chaves; ou, se preferir, direto no SQL Editor do Supabase.

**Dados preservados:** esta mudança só afeta a validação de novos envios.
Nenhuma inscrição (apresentação ou workshop) já registrada foi tocada,
alterada ou apagada.

## 13. Seção Random Play Dance

Nova seção na Home (`src/pages/home/RandomPlayDanceSection.tsx`), inserida
logo depois de Workshops e antes de Jurados — perto da programação, das
competições e dos workshops, como você pediu, mas com um cartão próprio
(fundo em degradê rosa/roxo/azul sutil, com dois ícones da identidade)
que a separa visualmente do bloco de competições.

Conteúdo: exatamente o título e o texto que você mandou, mais o aviso
"Em breve, vamos divulgar como vai funcionar o Random Play Dance no
festival. Fique de olho!" em destaque. Não incluí horário, duração,
playlist, regras, necessidade de inscrição nem qualquer indicação de
premiação ou caráter competitivo — nada disso foi mencionado no seu
pedido, e a seção não sugere nenhum desses detalhes.

Sem botão de inscrição, como pedido. A atividade "Random Play Dance" que
já existia na programação (16h–17h, nos dois dias, cadastrada desde uma
rodada anterior) não foi alterada.

## 14. Texto das juradas atualizado

Troquei o parágrafo da seção "Jurados" pelo texto exato que você mandou —
as três juradas confirmadas, os workshops ministradas por elas, e o aviso
de divulgação em breve nas redes.

Fui além do texto em si: como o parágrafo agora afirma que "as três
juradas já estão confirmadas", a seção passou a mostrar sempre 3 cartões,
não mais um por jurada publicada no painel. Antes, se só 2 estivessem
com `publicado: true`, a página mostrava só 2 cartões — o que contradiria
o novo texto. Agora, qualquer vaga sem cadastro publicado aparece com um
cartão "Divulgação em breve" (moldura tracejada, sem foto, com "Jurada" no
lugar do cargo), exatamente como você pediu para quando um nome ainda não
estiver pronto para publicação.

Não mexi em mais nada da seção — release completo, redes sociais,
imagem grande, tudo continua igual. As únicas outras menções a "jurados"
no site (na seção de workshops e na FAQ) já eram neutras, sem indicar
vaga em aberto, então não precisaram de ajuste.

## 15. Inscrições de verdade: armazenamento, vagas, dashboard e e-mail automático

Esta rodada tinha um objetivo simples de enunciar e grande de executar:
sair do "formulário aparece na tela" para um fluxo completo que salva,
controla vagas no servidor, aparece no painel e confirma por e-mail.
Abaixo, o que já existia (herdado de rodadas anteriores), o que foi
criado agora, e o que ainda depende de você.

### O que já existia e continua valendo
- Armazenamento real: as duas funções `inscrever_apresentacao` e
  `inscrever_workshop` sempre gravaram no Postgres, nunca só na tela.
- Controle de vagas no banco, com trava contra corrida (`for update`
  na linha da categoria/workshop): impossível duas inscrições simultâneas
  ocuparem a mesma última vaga.
- Distinção de status: `recebida` → `em_analise` → `confirmada` (ou
  `pendente`/`não_aprovada`/`cancelada`), tudo editável na ficha do painel.
- Painel com lista pesquisável/filtrável, ficha com download de
  figurino/música, observações internas, histórico de ações e exportação
  CSV (`/admin/inscricoes`).
- Acesso restrito: RLS já bloqueia qualquer leitura pública de dados de
  inscrição — só a equipe autenticada com perfil certo vê.

### O que foi construído agora (migration_06.sql + Edge Function)
- **E-mail automático de confirmação**, via Resend: nova Edge Function
  `supabase/functions/enviar-confirmacao`, chamada pelo site logo após
  salvar a inscrição (competição ou workshop). O texto muda conforme o
  status: "Inscrição recebida com sucesso — aguardando análise" quando
  depende de análise, nunca prometendo vaga confirmada antes da hora.
  Anexa o PDF do regulamento vigente e o termo de autorização para
  menores (ambos vindos do que estiver publicado em `/admin/conteudo` →
  Regulamentos), e traz protocolo, categoria/workshop, próximos passos,
  canal oficial de contato e link do Instagram.
- **Falha de envio nunca apaga a inscrição**: toda tentativa (sucesso ou
  erro) é gravada em `log_emails`, com status (`pendente`/`enviado`/
  `falha`) refletido na própria inscrição. O painel (ficha de competição
  e lista de workshops) mostra esse status e tem um botão **"Reenviar
  e-mail"**, disponível a qualquer momento.
- **Dashboard enriquecido** (`/admin`): agora mostra vagas ocupadas/
  disponíveis por categoria da competição e por workshop (com aviso de
  "limite não configurado" onde ainda não há número definido), inscrições
  por dia sugerido, e um bloco de status de envio de e-mail.
- **Formulários mais seguros**: campo de confirmação de e-mail (sem
  colar, para evitar erro de digitação) nos dois formulários; validação
  de formato e tamanho de arquivo com mensagem clara (figurino: JPG/PNG/
  WEBP até 8MB; música: MP3/WAV/M4A/OGG até 20MB — limites técnicos do
  site, não do regulamento); confirmação visual de arquivo recebido;
  trava contra envio duplicado por clique repetido (além do botão
  desabilitado durante o envio, agora também por uma trava interna que
  ignora cliques repetidos mesmo que o React re-renderize a tempo);
  dados preenchidos preservados em caso de erro (nada é limpo).
- **Aceite de comunicação promocional separado**: checkbox opcional,
  nunca misturado com o aceite obrigatório do regulamento, registrado à
  parte no banco.
- **Tela de confirmação completa**: protocolo, resumo, status atual,
  próximos passos, aviso de que o e-mail foi enviado (com status ao
  vivo) e lembrete para checar spam/lixo eletrônico.

### Regulamentos: o que a leitura desta rodada confirmou
Li o `Regulamento.docx` e o `Regulamento workhops.docx` mais recentes no
projeto antes de mexer em qualquer campo. Confirmações relevantes:
- A foto do figurino de referência já é exigida **no ato da inscrição**,
  para todas as categorias — o formulário já fazia isso certo.
- O regulamento em texto ainda cita **R$ 800/R$ 200** e **30/10 e 01/11**;
  o site usa os valores e datas corrigidos por você em rodadas
  anteriores (R$ 1.000/R$ 500, 31/10 e 01/11) — mantive assim, conforme
  sua confirmação nesta rodada. Fica registrado que o **documento em
  texto (Regulamento.docx) segue desatualizado nesses dois pontos** e
  precisa ser corrigido por você, já que o PDF publicado no site é
  gerado a partir do que for carregado no painel, não do .docx.
- Autorização de menor: confirmado que continua **só no credenciamento**
  (verificação física), não no upload da inscrição — mesmo o texto do
  regulamento listando isso como "documento obrigatório" de forma mais
  genérica. Decisão sua, registrada.

### Pendências que dependem de você (nada foi inventado)

1. **Número de vagas por categoria e por workshop.** O regulamento diz
   que as inscrições fecham "ao atingir o número máximo", mas não dá
   nenhum número, em nenhum dos dois documentos. Enquanto isso não for
   definido, o dashboard mostra "limite não configurado" e a modalidade
   fica **sem teto automático** (aceita inscrições até você definir e eu
   configurar `vagas_maximas`/`capacidade`). Preciso que você me passe:
   vagas de Solo, Duo, Trio e Grupo (é por categoria inteira, ou também
   quer separar por faixa etária/dia dentro da categoria?), e a
   capacidade de cada um dos workshops.
2. **Chave da API do Resend.** Você escolheu o Resend nesta rodada.
   Falta: criar a conta em resend.com, verificar um domínio de envio
   (ou usar o domínio de teste deles pra começar) e me passar a API key
   para eu configurar como secret da Edge Function
   (`RESEND_API_KEY` e `EMAIL_REMETENTE`). Sem isso, o e-mail não sai —
   mas a inscrição continua sendo salva normalmente, e o painel permite
   reenviar assim que a chave estiver configurada.
3. **PDFs para anexar.** A Edge Function só anexa o que estiver
   publicado como "vigente" em `/admin/conteudo` → Regulamentos (tipos
   competição, workshops e termo do menor). Hoje, confirme se os PDFs lá
   já são as versões finais — o regulamento em texto ainda tem os
   valores desatualizados citados acima. Se não houver nenhum PDF
   publicado num desses tipos, o e-mail sai sem anexo nesse ponto (sem
   travar o envio), então vale conferir antes da abertura.
4. **Canal de contato oficial e link do Instagram no e-mail.** Usei
   `contato@kpopfestsumare.com.br` e um link de Instagram de exemplo no
   template — preciso que você confirme os reais (e-mail oficial e
   handles de redes sociais) antes de ativar de verdade.
5. **Migração no Supabase real.** Você confirmou que já rodou a
   `migration_05.sql`. Falta rodar a `migration_06.sql` (novo arquivo
   desta rodada) no SQL Editor do seu projeto Supabase, e fazer o deploy
   da Edge Function (`supabase functions deploy enviar-confirmacao` via
   CLI, ou colar o código direto no painel do Supabase em Edge
   Functions → New Function).

### O que só dá para testar depois que os itens acima estiverem prontos
`tsc -b` e `npm run build` passam sem erro neste sandbox (não há projeto
Supabase real aqui para testar de ponta a ponta). Depois que a
migration_06, o deploy da função e a chave do Resend estiverem no ar,
o teste real com dados de teste (nome "TESTE — não contabilizar", e-mail
seu) deve cobrir: envio individual e em grupo, workshop, arquivo inválido/
grande demais, duas abas enviando ao mesmo tempo perto do limite de vagas
(depois de você definir os números), recebimento do e-mail com anexo, e
o botão de reenvio no painel.
