// Repertório do Louvor. Hinos tradicionais em domínio público e canções
// fictícias do "Ministério Esperança" (letras escritas para a demo).

export interface SeedSong {
  key: string;
  title: string;
  artist: string;
  songKey: string;
  bpm: string;
  songCategory: string;
  mediaLink?: string;
  notes?: string;
  lyrics: string;
  chords: string;
}

export const SEED_SONGS: SeedSong[] = [
  {
    key: "santo",
    title: "Santo, Santo, Santo",
    artist: "Hino tradicional (R. Heber)",
    songKey: "D",
    bpm: "72",
    songCategory: "Adoração",
    notes: "Abertura do culto. Entrar só com teclado na 1ª estrofe.",
    lyrics: `[Estrofe 1]
Santo! Santo! Santo! Deus onipotente!
Cedo de manhã cantaremos teu louvor.
Santo! Santo! Santo! Justo e compassivo!
És Deus triúno, excelso Criador!

[Estrofe 2]
Santo! Santo! Santo! Todos os remidos
Juntos com os anjos proclamam teu louvor.
Antes de formar-se o firmamento e a terra,
Eras, és e sempre hás de ser, Senhor!`,
    chords: `[Estrofe 1]
D        A/C#   Bm      G     D
Santo! Santo! Santo! Deus onipotente!
G          D           E7         A
Cedo de manhã cantaremos teu louvor.
D        A/C#   Bm      G      D
Santo! Santo! Santo! Justo e compassivo!
G       D      Em   A7     D
És Deus triúno, excelso Criador!

[Estrofe 2]
D        A/C#   Bm      G     D
Santo! Santo! Santo! Todos os remidos
G         D          E7        A
Juntos com os anjos proclamam teu louvor.
D          A/C#    Bm       G       D
Antes de formar-se o firmamento e a terra,
G      D      Em      A7     D
Eras, és e sempre hás de ser, Senhor!`,
  },
  {
    key: "castelo",
    title: "Castelo Forte",
    artist: "Hino tradicional (M. Lutero)",
    songKey: "C",
    bpm: "84",
    songCategory: "Celebração",
    lyrics: `[Estrofe]
Castelo forte é nosso Deus,
Espada e bom escudo;
Com seu poder defende os seus
Em todo transe agudo.

Com fúria pertinaz
Persegue Satanás,
Com ânimo cruel;
Astuto e mui rebel,
Igual não há na terra.`,
    chords: `[Estrofe]
C        G      Am   F   C
Castelo forte é nosso Deus,
F     G     C
Espada e bom escudo;
C        G      Am   F    C
Com seu poder defende os seus
F    G    C
Em todo transe agudo.

Am     E
Com fúria pertinaz
F      C
Persegue Satanás,
G        C
Com ânimo cruel;
F       C
Astuto e mui rebel,
F    G     C
Igual não há na terra.`,
  },
  {
    key: "mais-perto",
    title: "Mais Perto Quero Estar",
    artist: "Hino tradicional (S. Adams)",
    songKey: "G",
    bpm: "66",
    songCategory: "Ceia",
    notes: "Usar na Santa Ceia, voz e violão.",
    lyrics: `[Estrofe]
Mais perto quero estar,
Meu Deus, de ti,
Inda que seja a dor
Que me una a ti.

[Coro]
Sempre hei de suplicar:
Mais perto quero estar,
Mais perto quero estar,
Meu Deus, de ti!`,
    chords: `[Estrofe]
G       C     G
Mais perto quero estar,
D7     G
Meu Deus, de ti,
G      C      G
Inda que seja a dor
D7      G
Que me una a ti.

[Coro]
C            G
Sempre hei de suplicar:
D           G
Mais perto quero estar,
C          G
Mais perto quero estar,
D7     G
Meu Deus, de ti!`,
  },
  {
    key: "esperanca-viva",
    title: "Esperança Viva",
    artist: "Ministério Esperança",
    songKey: "E",
    bpm: "128",
    songCategory: "Celebração",
    // Música fictícia da igreja de exemplo: sem link de vídeo (um link real
    // apontaria para uma música de outra pessoa).
    notes: "Música tema da igreja. Final com a ponte repetida 2x.",
    lyrics: `[Verso 1]
Quando a noite parecia não ter fim
Tua voz chamou meu nome e me ergueu
O que estava em pedaços dentro de mim
Foi refeito pelo amor que me escolheu

[Refrão]
Há uma esperança viva em mim
Que não se apaga, não tem fim
Cristo vive, e eu vivo também
Minha esperança tem nome: Jesus

[Ponte]
Nada vai me separar
Do amor que me alcançou
Nada vai me separar
Ele venceu, Ele venceu`,
    chords: `[Intro]
E  B  C#m  A

[Verso 1]
E                     B
Quando a noite parecia não ter fim
C#m                    A
Tua voz chamou meu nome e me ergueu
E                       B
O que estava em pedaços dentro de mim
C#m                  A
Foi refeito pelo amor que me escolheu

[Refrão]
A           E
Há uma esperança viva em mim
B              C#m
Que não se apaga, não tem fim
A                E
Cristo vive, e eu vivo também
B                       E
Minha esperança tem nome: Jesus

[Ponte]
A       B
Nada vai me separar
C#m        E
Do amor que me alcançou
A       B
Nada vai me separar
C#m          B
Ele venceu, Ele venceu`,
  },
  {
    key: "graca",
    title: "Graça que Alcança",
    artist: "Ministério Esperança",
    songKey: "A",
    bpm: "74",
    songCategory: "Adoração",
    lyrics: `[Verso]
Eu não mereço, mas tu vens a mim
Teu favor me cerca, teu perdão não tem fim
Onde eu caí, tua mão me encontrou
Graça que alcança, graça que salvou

[Refrão]
Graça, graça, eu canto
Teu amor me fez de novo
Graça, graça, eu canto
Sou teu filho, sou teu povo`,
    chords: `[Verso]
A                 E/G#
Eu não mereço, mas tu vens a mim
F#m              D
Teu favor me cerca, teu perdão não tem fim
A                E/G#
Onde eu caí, tua mão me encontrou
F#m          D        E
Graça que alcança, graça que salvou

[Refrão]
D      A
Graça, graça, eu canto
E               F#m
Teu amor me fez de novo
D      A
Graça, graça, eu canto
E              A
Sou teu filho, sou teu povo`,
  },
  {
    key: "rio",
    title: "Rio da Vida",
    artist: "Ministério Esperança",
    songKey: "G",
    bpm: "118",
    songCategory: "Celebração",
    lyrics: `[Verso]
Há um rio que alegra a cidade de Deus
Suas águas correm para os que têm sede
Quem beber dessa fonte não volta atrás
Encontra descanso, encontra paz

[Refrão]
Corre, rio da vida, corre em mim
Lava, renova, me faz florescer
Corre, rio da vida, corre em mim
Onde o rio chegar, tudo vai viver`,
    chords: `[Verso]
G                 D/F#
Há um rio que alegra a cidade de Deus
Em                  C
Suas águas correm para os que têm sede
G                D/F#
Quem beber dessa fonte não volta atrás
Em          C        D
Encontra descanso, encontra paz

[Refrão]
C          G
Corre, rio da vida, corre em mim
D               Em
Lava, renova, me faz florescer
C          G
Corre, rio da vida, corre em mim
D                     G
Onde o rio chegar, tudo vai viver`,
  },
  {
    key: "luz",
    title: "Luz da Manhã",
    artist: "Ministério Esperança",
    songKey: "D",
    bpm: "96",
    songCategory: "Abertura",
    lyrics: `[Verso]
Antes do sol nascer, eu busco a ti
No silêncio da manhã, eu te ouço aqui
Tua misericórdia se renova em mim
Cada novo dia é um recomeço, enfim

[Refrão]
Tu és a luz da manhã
Brilhando sobre mim
Tu és a luz da manhã
Que nunca tem fim`,
    chords: `[Verso]
D                A
Antes do sol nascer, eu busco a ti
Bm                G
No silêncio da manhã, eu te ouço aqui
D                    A
Tua misericórdia se renova em mim
Bm             G         A
Cada novo dia é um recomeço, enfim

[Refrão]
G        D
Tu és a luz da manhã
A          Bm
Brilhando sobre mim
G        D
Tu és a luz da manhã
A          D
Que nunca tem fim`,
  },
  {
    key: "firme",
    title: "Firme Fundamento",
    artist: "Ministério Esperança",
    songKey: "C",
    bpm: "70",
    songCategory: "Adoração",
    lyrics: `[Verso]
Sobre a rocha eu vou construir
Ventos virão, mas não vou cair
Minha casa firmada em ti está
Tua palavra não passará

[Refrão]
Firme fundamento, meu Senhor
Âncora da alma, meu Salvador
Tudo pode passar, tu não passarás
Firme fundamento, eterna paz`,
    chords: `[Verso]
C              G/B
Sobre a rocha eu vou construir
Am             F
Ventos virão, mas não vou cair
C               G/B
Minha casa firmada em ti está
Am        F       G
Tua palavra não passará

[Refrão]
F         C
Firme fundamento, meu Senhor
G              Am
Âncora da alma, meu Salvador
F                 C
Tudo pode passar, tu não passarás
G            C
Firme fundamento, eterna paz`,
  },
];
