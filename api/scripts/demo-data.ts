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

  return { louvor, jovens };
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
      assignees: [demoUserId, memberIds[0]],
      songIndexes: [0, 1, 2],
    },
    {
      description: "Culto Quarta",
      date: makeDate(10, 19, 30),
      assignees: [demoUserId, memberIds[1]],
      songIndexes: [2, 3],
    },
    {
      description: "Ensaio Especial",
      date: makeDate(14, 15, 0),
      assignees: memberIds,
      songIndexes: [0, 3, 4],
    },
  ];

  for (const s of scheduleData) {
    const schedule = await $prismaClient.schedule.create({
      data: {
        id: crypto.randomUUID(),
        description: s.description,
        date: s.date,
        departmentId,
        assignments: {
          create: s.assignees.map((userId) => ({
            id: crypto.randomUUID(),
            role: userId === demoUserId ? "Cantor(a)" : "Músico",
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
