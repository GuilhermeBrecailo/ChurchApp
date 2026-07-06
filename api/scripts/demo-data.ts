/**
 * Funções de criação de dados demo — compartilhadas entre seed e reset.
 */
import { $prismaClient } from "../config/database.ts";

export const DEMO_EMAIL = "demo@appquadrangular.com";
export const DEMO_PASTOR_EMAIL = "pastor-demo@appquadrangular.com";

const songs = [
  {
    title: "Grande és Tu",
    artist: "Carl Boberg / Stuart K. Hine",
    key: "G",
    bpm: "72",
    songCategory: "Adoração",
    lyrics: `[Verso 1]
Ó Senhor meu Deus, quando eu maravilhado
Contemplo o céu estrelado que Tu fizeste
As florestas, montes, o mar encantado
O universo e tudo que neles existe

[Refrão]
Grande és Tu, grande és Tu
Grande és Tu, grande és Tu

[Verso 2]
E quando eu penso que Deus, o Seu Filho
Não poupou, mas entregou por mim a vida
Com que alegria ao céu serei levado
E prostrado adorarei a Deus que é vida`,
    chords: `[Verso 1]
G                    D
Ó Senhor meu Deus, quando eu maravilhado
G              C          G
Contemplo o céu estrelado que Tu fizeste

[Refrão]
G    D    G
Grande és Tu, grande és Tu`,
  },
  {
    title: "Majestade",
    artist: "Jack Hayford",
    key: "A",
    bpm: "68",
    songCategory: "Adoração",
    lyrics: `[Verso 1]
Majestade, honra e glória ao Rei dos reis
Majestade, curvo-me diante de Ti

[Refrão]
Majestade, Deus exaltado
Majestade, eterno Senhor
Majestade, que reinas na glória
E em majestade governas, ó Deus

[Verso 2]
Majestade, oferto minha vida a Ti
Majestade, quero Te glorificar`,
    chords: `[Verso 1]
A           E          A
Majestade, honra e glória ao Rei dos reis
A           D          E
Majestade, curvo-me diante de Ti

[Refrão]
A    E    F#m    D
Majestade, Deus exaltado`,
  },
  {
    title: "Quão Grande és Tu",
    artist: "Carl Boberg",
    key: "Bb",
    bpm: "76",
    songCategory: "Louvor",
    lyrics: `[Verso 1]
Senhor, meu Deus, ao contemplar os céus
As estrelas, o poder do trovão
Vejo o Teu poder em toda a criação
E meu coração Te adora em canção

[Refrão]
Quão grande és Tu, quão grande és Tu
Quão grande és Tu, quão grande és Tu

[Ponte]
Que dia glorioso quando Cristo vier
E nos levar para a mansão celestial
Com que alegria ao Som da Sua voz
Prostrados, adoraremos ao Senhor`,
    chords: `[Verso 1]
Bb            F          Bb
Senhor, meu Deus, ao contemplar os céus
Bb            Eb         F
As estrelas, o poder do trovão

[Refrão]
Bb   F   Gm   Eb
Quão grande és Tu, quão grande és Tu`,
  },
  {
    title: "Te Agradeço",
    artist: "Ministério Ipiranga",
    key: "D",
    bpm: "80",
    songCategory: "Gratidão",
    lyrics: `[Verso 1]
Te agradeço por tudo que fizeste
Por tudo que estás fazendo em mim
Por cada promessa que me deste
E pelo amor que não tem fim

[Refrão]
Te agradeço, Senhor
Te agradeço, meu Deus
Por cada graça derramada
E pela vida que me deus

[Verso 2]
Te agradeço pelas duras provações
Que me fizeram mais forte em Ti
Por cada lágrima e cada oração
Que me trouxe mais perto de Ti`,
    chords: `[Verso 1]
D              A           Bm
Te agradeço por tudo que fizeste
G              D
Por tudo que estás fazendo em mim

[Refrão]
D   A   G   D
Te agradeço, Senhor`,
  },
  {
    title: "Hosana",
    artist: "Brooke Fraser",
    key: "E",
    bpm: "90",
    songCategory: "Louvor",
    lyrics: `[Verso 1]
Estou aqui diante de Ti
Com meu coração em adoração
Que Tua glória preencha este lugar
E Tua presença venha transformar

[Refrão]
Hosana, hosana
Hosana nas alturas
Hosana, hosana
Hosana ao Rei dos reis

[Verso 2]
Cura as nossas feridas, ó Senhor
Liberta-nos do medo e da dor
Que possamos ver Teu glorioso amor
E proclamar que Tu és o Senhor`,
    chords: `[Verso 1]
E              B          C#m
Estou aqui diante de Ti
A              E
Com meu coração em adoração

[Refrão]
E   B   C#m   A
Hosana, hosana`,
  },
];

export async function createDemoDepartments(crunchId: string, leaderId: string) {
  const louvor = await $prismaClient.department.create({
    data: {
      id: crypto.randomUUID(),
      name: "Louvor",
      type: "MUSIC",
      crunchId,
      leaderId,
    },
  });

  const jovens = await $prismaClient.department.create({
    data: {
      id: crypto.randomUUID(),
      name: "Jovens",
      type: "OTHER",
      crunchId,
      leaderId,
    },
  });

  const diaconato = await $prismaClient.department.create({
    data: {
      id: crypto.randomUUID(),
      name: "Diaconato",
      type: "OTHER",
      crunchId,
      leaderId,
    },
  });

  const midia = await $prismaClient.department.create({
    data: {
      id: crypto.randomUUID(),
      name: "Mídia",
      type: "MEDIA",
      crunchId,
      leaderId,
    },
  });

  return { louvor, jovens, diaconato, midia };
}

export async function createDemoSongs(departmentId: string) {
  const created = [];
  for (const song of songs) {
    const item = await $prismaClient.mediaItem.create({
      data: {
        id: crypto.randomUUID(),
        title: song.title,
        url: "",
        category: "MUSIC",
        departmentId,
        metadata: {
          artist: song.artist,
          key: song.key,
          bpm: song.bpm,
          songCategory: song.songCategory,
          lyrics: song.lyrics,
          chords: song.chords,
        },
      },
    });
    created.push(item);
  }
  return created;
}

export async function createDemoSchedules(
  departmentId: string,
  demoUserId: string,
  memberIds: string[],
  songIds: string[],
) {
  const now = new Date();

  const makeDate = (daysAhead: number, hour: number, minute: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const scheduleData = [
    {
      description: "Culto Domingo",
      date: makeDate(7, 9, 0),
      rehearsalAt: makeDate(6, 16, 0),
      rehearsalNotes: "Ensaio geral com passagem de repertório e alinhamento da equipe.",
      assignees: [demoUserId, memberIds[0]],
      songIndexes: [0, 1, 2],
    },
    {
      description: "Culto Quarta",
      date: makeDate(10, 19, 30),
      rehearsalAt: makeDate(10, 18, 30),
      rehearsalNotes: "Chegar com 1h de antecedência para passagem de som.",
      assignees: [demoUserId, memberIds[1]],
      songIndexes: [2, 3],
    },
    {
      description: "Ensaio Especial",
      date: makeDate(14, 15, 0),
      rehearsalAt: makeDate(13, 15, 0),
      rehearsalNotes: "Preparação especial para domingo de celebração.",
      assignees: memberIds,
      songIndexes: [0, 3, 4],
    },
  ];

  for (const s of scheduleData) {
    await $prismaClient.schedule.create({
      data: {
        id: crypto.randomUUID(),
        description: s.description,
        date: s.date,
        rehearsalAt: s.rehearsalAt,
        rehearsalNotes: s.rehearsalNotes,
        departmentId,
        assignments: {
          create: s.assignees.map((userId, index) => ({
            id: crypto.randomUUID(),
            role: userId === demoUserId ? "Cantor(a)" : "Músico",
            confirmationStatus: index === 0 ? "CONFIRMED" : "PENDING",
            confirmedAt: index === 0 ? new Date() : null,
            userId,
          })),
        },
        mediaItems: {
          create: s.songIndexes.map((idx) => ({
            id: crypto.randomUUID(),
            mediaItemId: songIds[idx],
          })),
        },
      },
    });
  }
}

export async function createDemoDepartmentResources(
  departments: {
    louvor: { id: string };
    jovens: { id: string };
    diaconato: { id: string };
    midia: { id: string };
  },
) {
  await $prismaClient.mediaItem.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        title: "Ordem do Culto - Domingo",
        url: "https://example.com/demo/ordem-culto.pdf",
        category: "RESOURCE",
        departmentId: departments.louvor.id,
        metadata: {
          description: "Roteiro demonstrativo com abertura, louvor, palavra e encerramento.",
          pdf: {
            url: "https://example.com/demo/ordem-culto.pdf",
            fileName: "ordem-culto-demo.pdf",
            mimeType: "application/pdf",
            size: 128000,
          },
        },
      },
      {
        id: crypto.randomUUID(),
        title: "Checklist da Recepção",
        url: "https://example.com/demo/checklist-recepcao.pdf",
        category: "RESOURCE",
        departmentId: departments.diaconato.id,
        metadata: {
          description: "Checklist para recepção, organização de assentos e apoio aos visitantes.",
        },
      },
      {
        id: crypto.randomUUID(),
        title: "Identidade Visual do Culto",
        url: "https://example.com/demo/artes-culto.zip",
        category: "RESOURCE",
        departmentId: departments.midia.id,
        metadata: {
          description: "Pacote demonstrativo com artes, telões e chamadas para redes sociais.",
        },
      },
      {
        id: crypto.randomUUID(),
        title: "Roteiro da Reunião de Jovens",
        url: "https://example.com/demo/roteiro-jovens.pdf",
        category: "RESOURCE",
        departmentId: departments.jovens.id,
        metadata: {
          description: "Dinâmica, palavra e atividades para a célula de jovens.",
        },
      },
    ],
  });
}

export async function createDemoTasks(
  departments: {
    louvor: { id: string };
    jovens: { id: string };
    diaconato: { id: string };
    midia: { id: string };
  },
  assigneeIds: string[],
) {
  const now = new Date();
  const dueDate = (daysAhead: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(18, 0, 0, 0);
    return d;
  };

  await $prismaClient.departmentTask.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        title: "Confirmar repertório do domingo",
        description: "Validar tonalidades, cifras e ordem das músicas com a equipe.",
        status: "OPEN",
        priority: "HIGH",
        dueDate: dueDate(2),
        departmentId: departments.louvor.id,
        assigneeId: assigneeIds[0],
      },
      {
        id: crypto.randomUUID(),
        title: "Separar equipe de recepção",
        description: "Definir posições de porta, estacionamento e apoio aos visitantes.",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        dueDate: dueDate(3),
        departmentId: departments.diaconato.id,
        assigneeId: assigneeIds[1],
      },
      {
        id: crypto.randomUUID(),
        title: "Publicar chamada da reunião de jovens",
        description: "Criar arte e publicar nos canais da igreja.",
        status: "DONE",
        priority: "LOW",
        dueDate: dueDate(1),
        departmentId: departments.jovens.id,
        assigneeId: assigneeIds[2],
      },
      {
        id: crypto.randomUUID(),
        title: "Testar transmissão ao vivo",
        description: "Conferir áudio, câmera, internet e slides antes do culto.",
        status: "OPEN",
        priority: "HIGH",
        dueDate: dueDate(4),
        departmentId: departments.midia.id,
        assigneeId: assigneeIds[0],
      },
    ],
  });
}

export async function createDemoContent(
  crunchId: string,
  authorId: string,
  memberIds: string[],
) {
  const now = new Date();
  const publishedAt = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(8, 0, 0, 0);
    return d;
  };

  await $prismaClient.dailyVerse.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        text: "O Senhor é o meu pastor; nada me faltará.",
        reference: "Salmos 23:1",
        commentary: "Uma lembrança simples de cuidado, direção e provisão para começar o dia.",
        publishedAt: publishedAt(0),
        crunchId,
        authorId,
      },
      {
        id: crypto.randomUUID(),
        text: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.",
        reference: "Salmos 37:5",
        commentary: "Convite para confiar a rotina, a família e o serviço cristão ao Senhor.",
        publishedAt: publishedAt(1),
        crunchId,
        authorId,
      },
      {
        id: crypto.randomUUID(),
        text: "Sede fortes e corajosos; não temais.",
        reference: "Deuteronômio 31:6",
        commentary: "Coragem bíblica nasce da presença de Deus conosco.",
        publishedAt: publishedAt(2),
        crunchId,
        authorId,
      },
    ],
  });

  await $prismaClient.announcement.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        title: "Santa Ceia neste domingo",
        body: "Teremos Santa Ceia no culto da manhã. Convide sua família e chegue alguns minutos antes.",
        pinned: true,
        publishedAt: publishedAt(0),
        expiresAt: null,
        crunchId,
        authorId,
      },
      {
        id: crypto.randomUUID(),
        title: "Reunião de líderes",
        body: "Sábado às 16h teremos alinhamento com líderes de ministério.",
        pinned: false,
        publishedAt: publishedAt(1),
        expiresAt: null,
        crunchId,
        authorId,
      },
    ],
  });

  const devotional = await $prismaClient.devotional.create({
    data: {
      id: crypto.randomUUID(),
      title: "Semana de Comunhão",
      description: "Devocional demonstrativo com três leituras curtas para incentivar comunhão e serviço.",
      publishedAt: publishedAt(0),
      crunchId,
      authorId,
      chapters: {
        create: [
          {
            id: crypto.randomUUID(),
            title: "Dia 1 - Permanecer em Cristo",
            content:
              "A vida cristã começa e amadurece na permanência em Cristo. Antes de servir, precisamos ouvir, orar e deixar a Palavra organizar nossas prioridades.",
            bibleRef: "João 15:5",
            order: 1,
          },
          {
            id: crypto.randomUUID(),
            title: "Dia 2 - Servir com alegria",
            content:
              "Servir não é apenas preencher uma escala. É responder com gratidão ao amor de Deus e cuidar das pessoas com excelência e simplicidade.",
            bibleRef: "Colossenses 3:23",
            order: 2,
          },
          {
            id: crypto.randomUUID(),
            title: "Dia 3 - Caminhar em unidade",
            content:
              "A igreja se fortalece quando cada pessoa entende seu lugar no corpo. Unidade não apaga diferenças; ela direciona dons diferentes para um mesmo propósito.",
            bibleRef: "Efésios 4:16",
            order: 3,
          },
        ],
      },
    },
    include: {
      chapters: { orderBy: { order: "asc" } },
    },
  });

  if (devotional.chapters[0]) {
    await $prismaClient.devotionalProgress.create({
      data: {
        id: crypto.randomUUID(),
        userId: memberIds[0],
        devotionalId: devotional.id,
        lastChapterId: devotional.chapters[0].id,
        crunchId,
      },
    });
  }

  await $prismaClient.prayerRequest.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        title: "Famílias da igreja",
        body: "Ore pelas famílias, reconciliação nos lares e fortalecimento espiritual.",
        isAnonymous: false,
        isAnswered: false,
        crunchId,
        userId: memberIds[0],
      },
      {
        id: crypto.randomUUID(),
        title: "Direção para novos projetos",
        body: "Pedido anônimo por sabedoria em decisões importantes nesta semana.",
        isAnonymous: true,
        isAnswered: false,
        crunchId,
        userId: memberIds[1],
      },
      {
        id: crypto.randomUUID(),
        title: "Gratidão por uma resposta",
        body: "Agradecimento por uma porta de emprego aberta depois de semanas de oração.",
        isAnonymous: false,
        isAnswered: true,
        crunchId,
        userId: memberIds[2],
      },
    ],
  });
}

export async function createDemoUserState(
  demoUserId: string,
  memberIds: string[],
  songIds: string[],
  departmentIds: string[],
) {
  const unavailableDate = new Date();
  unavailableDate.setDate(unavailableDate.getDate() + 12);
  unavailableDate.setHours(0, 0, 0, 0);

  await $prismaClient.userUnavailableDate.create({
    data: {
      id: crypto.randomUUID(),
      userId: demoUserId,
      date: unavailableDate,
      reason: "Viagem em família",
    },
  });

  await $prismaClient.userSongPreference.createMany({
    data: songIds.slice(0, 2).map((mediaItemId, index) => ({
      id: crypto.randomUUID(),
      userId: demoUserId,
      mediaItemId,
      personalKey: index === 0 ? "A" : "D",
      chords: index === 0 ? "Versão simplificada para ensaio demo" : "Preferência de tom para voz masculina",
    })),
  });

  await $prismaClient.userDepartmentMembership.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        userId: demoUserId,
        departmentId: departmentIds[0],
        function: "Vocal",
        isPrimary: true,
      },
      {
        id: crypto.randomUUID(),
        userId: memberIds[0],
        departmentId: departmentIds[1],
        function: "Recepção",
        isPrimary: true,
      },
      {
        id: crypto.randomUUID(),
        userId: memberIds[1],
        departmentId: departmentIds[2],
        function: "Comunicação",
        isPrimary: true,
      },
    ],
  });

  await $prismaClient.appNotification.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        userId: demoUserId,
        title: "Você foi escalado",
        body: "Você está na escala do Culto Domingo como Cantor(a).",
        type: "schedule-assigned",
        url: "/scale",
      },
      {
        id: crypto.randomUUID(),
        userId: demoUserId,
        title: "Novo aviso publicado",
        body: "Confira o aviso sobre a Santa Ceia deste domingo.",
        type: "announcement",
        url: "/content",
      },
    ],
  });
}

export async function createDemoMembers(crunchId: string) {
  const members = [
    { name: "Ana Silva", email: "ana.demo@appquadrangular.com" },
    { name: "Beatriz Costa", email: "beatriz.demo@appquadrangular.com" },
    { name: "Carlos Mendes", email: "carlos.demo@appquadrangular.com" },
  ];

  const created = [];
  for (const m of members) {
    const user = await $prismaClient.user.create({
      data: {
        id: crypto.randomUUID(),
        name: m.name,
        email: m.email,
        role: "MEMBER",
        crunchId,
        isDemoUser: false,
      },
    });
    created.push(user);
  }
  return created;
}
