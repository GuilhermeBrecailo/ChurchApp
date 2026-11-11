// Textos de conteúdo da igreja: avisos, versículos, devocionais, posts e
// pedidos de oração. Datas em dias relativos a hoje.

export const ANNOUNCEMENTS = [
  {
    id: "an-ceia",
    title: "Santa Ceia no próximo domingo",
    body: "No culto da manhã celebraremos a Ceia do Senhor. Venha com o coração preparado. Diáconos, chegada às 9h15.",
    pinned: true,
    publishedDaysAgo: 1,
    expiresInDays: 12,
    isPublic: true,
    kind: "ANNOUNCEMENT" as const,
  },
  {
    id: "an-retiro",
    title: "Retiro de Jovens 2026 — inscrições abertas",
    body: "De 4 a 6 de dezembro na Chácara Recanto da Paz, em Campo Largo. Valor: R$ 280 (parcelado em até 3x). Inscrições com a Larissa depois dos cultos.",
    pinned: false,
    publishedDaysAgo: 3,
    expiresInDays: 20,
    isPublic: true,
    kind: "ANNOUNCEMENT" as const,
  },
  {
    id: "an-agasalho",
    title: "Campanha do Agasalho",
    body: "Estamos recebendo cobertores e roupas de frio até o fim do mês. Deixe as doações na mesa da recepção.",
    pinned: false,
    publishedDaysAgo: 6,
    expiresInDays: 18,
    isPublic: false,
    kind: "ANNOUNCEMENT" as const,
  },
  {
    id: "an-pastor",
    title: "Uma palavra do pastor",
    body: "Querida igreja, obrigado por cada um que tem servido nos ministérios. Neste mês vamos meditar juntos em Filipenses — leia um capítulo por semana e traga suas perguntas para a quarta-feira. Com carinho, Pr. Marcos.",
    pinned: false,
    publishedDaysAgo: 2,
    expiresInDays: null,
    isPublic: true,
    kind: "PASTOR_MESSAGE" as const,
  },
  {
    id: "an-oracao",
    title: "Oremos pela família Duarte",
    body: "O irmão Kleber está em busca de recolocação profissional. Vamos sustentar a família em oração e, quem souber de vagas na área administrativa, fale com o pastor.",
    pinned: false,
    publishedDaysAgo: 4,
    expiresInDays: 10,
    isPublic: false,
    kind: "PRAYER" as const,
  },
];

export const DAILY_VERSES = [
  { text: "Porque sou eu que conheço os planos que tenho para vocês, diz o Senhor, planos de fazê-los prosperar e não de causar dano, planos de dar a vocês esperança e um futuro.", reference: "Jeremias 29:11", commentary: "Deus não perdeu o controle da sua história. Entregue hoje a Ele o que te tira o sono." },
  { text: "O Senhor é o meu pastor; de nada terei falta.", reference: "Salmos 23:1", commentary: "Antes de pedir qualquer coisa hoje, agradeça pelo cuidado que você já recebeu." },
  { text: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13", commentary: null },
  { text: "Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.", reference: "1 Pedro 5:7", commentary: "Ansiedade não é falta de fé — é convite para lançar o peso em quem pode carregá-lo." },
  { text: "Venham a mim, todos os que estão cansados e sobrecarregados, e eu darei descanso a vocês.", reference: "Mateus 11:28", commentary: null },
  { text: "A tua palavra é lâmpada que ilumina os meus passos e luz que clareia o meu caminho.", reference: "Salmos 119:105", commentary: "Separe 10 minutos hoje para ler um capítulo dos Salmos." },
  { text: "Sejam fortes e corajosos. Não tenham medo, pois o Senhor, o seu Deus, estará com vocês por onde forem.", reference: "Josué 1:9", commentary: null },
];

export const DEVOTIONALS = [
  {
    id: "dv-fundamentos",
    title: "Fundamentos da Fé",
    description: "Cinco dias para revisitar o essencial do evangelho. Ideal para novos membros e para quem quer recomeçar.",
    publishedDaysAgo: 12,
    isPublic: true,
    chapters: [
      { title: "Dia 1 — Deus nos ama primeiro", bibleRef: "1 João 4:9-19", content: "Antes de qualquer coisa que façamos, Deus já tomou a iniciativa. O amor dEle não é recompensa pelo nosso bom comportamento; é a fonte de onde tudo começa.\n\nLeia o texto devagar e sublinhe quantas vezes aparece a palavra \"amor\". Depois, escreva uma frase de gratidão.\n\nOração: Senhor, obrigado por me amar quando eu ainda não te conhecia." },
      { title: "Dia 2 — A graça que salva", bibleRef: "Efésios 2:1-10", content: "Paulo descreve nossa condição sem Cristo e, logo depois, o \"mas Deus\" que muda tudo. Graça é favor imerecido: não há nada que possamos acrescentar.\n\nPergunta para reflexão: em que área você ainda tenta \"merecer\" o amor de Deus?" },
      { title: "Dia 3 — Uma nova vida", bibleRef: "2 Coríntios 5:14-21", content: "Em Cristo somos nova criação. O passado não define mais quem somos. Isso não significa ausência de luta, mas uma nova identidade para lutar.\n\nDesafio: compartilhe com alguém hoje uma coisa que Deus mudou em você." },
      { title: "Dia 4 — A igreja como família", bibleRef: "Atos 2:42-47", content: "A primeira igreja perseverava no ensino, na comunhão, no partir do pão e nas orações. Ninguém foi feito para seguir Jesus sozinho.\n\nQue tal se envolver em um ministério ou pequeno grupo neste mês?" },
      { title: "Dia 5 — Enviados", bibleRef: "Mateus 28:16-20", content: "Jesus termina o Evangelho de Mateus com uma missão e uma promessa: \"estou com vocês todos os dias\". A missão é grande, mas não estamos sós.\n\nOração: Senhor, usa a minha vida onde eu estiver — em casa, no trabalho e na igreja." },
    ],
  },
  {
    id: "dv-salmos",
    title: "Salmos para dias difíceis",
    description: "Quatro salmos que ensinam a orar com honestidade quando a vida aperta.",
    publishedDaysAgo: 4,
    isPublic: false,
    chapters: [
      { title: "Salmo 13 — Até quando?", bibleRef: "Salmos 13", content: "Davi começa perguntando \"até quando?\" e termina cantando. Entre a pergunta e o louvor, ele escolhe confiar.\n\nVocê pode levar suas perguntas a Deus. Ele não se ofende com a sua sinceridade." },
      { title: "Salmo 42 — A alma abatida", bibleRef: "Salmos 42", content: "\"Por que você está assim tão triste, ó minha alma?\" O salmista conversa consigo mesmo e se lembra de quem Deus é.\n\nExercício: escreva três verdades sobre Deus para lembrar nos dias difíceis." },
      { title: "Salmo 46 — Deus é o nosso refúgio", bibleRef: "Salmos 46", content: "Mesmo que a terra trema, há um lugar seguro. \"Aquietem-se e saibam que eu sou Deus.\"\n\nSepare cinco minutos em silêncio hoje, sem celular." },
      { title: "Salmo 121 — De onde vem o socorro", bibleRef: "Salmos 121", content: "O Senhor não dorme nem cochila. Ele guarda a sua saída e a sua entrada.\n\nOração: Senhor, eu descanso porque tu continuas acordado." },
    ],
  },
];

export const POSTS = [
  { id: "po-batismo", title: "Batismos do mês", body: "Domingo passado celebramos o batismo de quatro irmãos. Que alegria ver a família crescendo!", publishedDaysAgo: 10, isPublic: true, pinned: true },
  { id: "po-acao", title: "Ação social no Parolin", body: "Mais de 120 cestas básicas entregues com a ajuda de 30 voluntários. Obrigado, igreja!", publishedDaysAgo: 17, isPublic: true, pinned: false },
  { id: "po-ebd", title: "Nova turma de EBD", body: "A partir de domingo, turma de Novos Convertidos com a irmã Helena, às 9h, na sala 2.", publishedDaysAgo: 5, isPublic: false, pinned: false },
];

export const PRAYERS = [
  { id: "pr-cida", userId: "u-patricia", title: "Saúde da Dona Cida", body: "A Dona Cida fez uma cirurgia no quadril e está em recuperação em casa. Oremos por uma recuperação tranquila.", isAnonymous: false, isAnswered: false, status: "APPROVED" as const, daysAgo: 2 },
  { id: "pr-emprego", userId: "u-pastor", title: "Recolocação do Kleber", body: "Pela porta de emprego para o irmão Kleber e pelo sustento da família Duarte.", isAnonymous: false, isAnswered: false, status: "APPROVED" as const, daysAgo: 4 },
  { id: "pr-vestibular", userId: "u-larissa", title: "Vestibular", body: "Faço a prova da UFPR no próximo domingo. Peço oração por calma e clareza.", isAnonymous: false, isAnswered: false, status: "APPROVED" as const, daysAgo: 5 },
  { id: "pr-casamento", userId: "u-daniel", title: "Restauração de um casamento", body: "Por um casal amigo que está passando por uma crise. Que Deus traga reconciliação.", isAnonymous: true, isAnswered: false, status: "APPROVED" as const, daysAgo: 7 },
  { id: "pr-viagem", userId: "u-lucas", title: "Viagem da família", body: "Agradeço a Deus porque meus pais chegaram bem da viagem ao Nordeste!", isAnonymous: false, isAnswered: true, status: "APPROVED" as const, daysAgo: 14 },
  { id: "pr-pend-1", userId: "u-mariana", title: "Ansiedade no trabalho", body: "Tenho tido crises de ansiedade com a pressão no trabalho. Peço oração.", isAnonymous: false, isAnswered: false, status: "PENDING" as const, daysAgo: 0 },
  { id: "pr-pend-2", userId: "u-vinicius", title: "Pela minha avó", body: "Minha avó foi internada ontem com pneumonia.", isAnonymous: false, isAnswered: false, status: "PENDING" as const, daysAgo: 1 },
];

export const MESSAGE_TEMPLATES = [
  { id: "mt-visitante", name: "Boas-vindas ao visitante", body: "Olá, {nome}! Foi uma alegria ter você conosco na Igreja Batista Esperança. Se precisar de algo, é só responder esta mensagem. Até domingo!", suggestionKey: "visitor_welcome" },
  { id: "mt-lembrete", name: "Lembrete de culto", body: "Oi, {nome}! Lembrando do nosso culto hoje às 19h. Te esperamos!", suggestionKey: "service_notice" },
  { id: "mt-aniversario", name: "Feliz aniversário", body: "Feliz aniversário, {nome}! Que o Senhor te abençoe ricamente neste novo ano de vida. Com carinho, Igreja Batista Esperança.", suggestionKey: "birthday" },
];
