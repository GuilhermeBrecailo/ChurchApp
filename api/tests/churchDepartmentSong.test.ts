const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  mediaItem: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userSongPreference: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: { sendToUsers: jest.fn(), sendPublicChurchContent: jest.fn() },
}));

const mockExtractPdfPages = jest.fn();
const mockExtractSongsFromPages = jest.fn();

jest.mock("../src/application/Services/Department/PdfSongExtraction", () => ({
  extractPdfPages: (...args: unknown[]) => mockExtractPdfPages(...args),
  extractSongsFromPages: (...args: unknown[]) => mockExtractSongsFromPages(...args),
}));

import { FastifyRequest } from "fastify";
import { ChurchDepartmentAdapters } from "../src/interfaces/adapters/churchDepartmentAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  role?: string;
  hasFeature?: boolean;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  file?: () => Promise<
    { filename: string; mimetype: string; toBuffer: () => Promise<Buffer> } | undefined
  >;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature ?? true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
    file: options.file,
  } as unknown as FastifyRequest;
}

const departmentRow = {
  id: "dept-1",
  name: "Louvor",
  type: "WORSHIP",
  isActive: true,
  modules: ["SONGS"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Lider", email: "lider@igreja.com" },
  _count: { members: 0, schedules: 0, tasks: 0 },
  mediaItems: [],
};

const songRow = {
  id: "song-1",
  title: "Grande e o Senhor",
  url: "",
  category: "MUSIC",
  metadata: { artist: "", key: "", bpm: "", songCategory: "Louvor", notes: "", lyrics: "", chords: "" },
  departmentId: "dept-1",
};

describe("ChurchDepartmentAdapters - musicas", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(departmentRow);
  });

  describe("createChurchDepartmentSong", () => {
    it("rejeita titulo vazio", async () => {
      await expect(
        adapters.createChurchDepartmentSong(
          makeRequest({ params: { id: "dept-1" }, body: { title: "  " } }),
        ),
      ).rejects.toThrow("Titulo da musica e obrigatorio");
    });

    it("rejeita titulo duplicado no mesmo ministerio", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue({ id: "song-existing" });

      await expect(
        adapters.createChurchDepartmentSong(
          makeRequest({ params: { id: "dept-1" }, body: { title: "Grande e o Senhor" } }),
        ),
      ).rejects.toThrow("Ja existe uma musica com esse nome neste ministerio");
    });

    it("rejeita tom invalido", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(null);

      await expect(
        adapters.createChurchDepartmentSong(
          makeRequest({
            params: { id: "dept-1" },
            body: { title: "Nova musica", key: "X#" },
          }),
        ),
      ).rejects.toThrow("Tom invalido");
    });

    it("cria musica com metadata normalizada", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(null);
      mockPrismaClient.mediaItem.create.mockResolvedValue(songRow);

      const result = await adapters.createChurchDepartmentSong(
        makeRequest({
          params: { id: "dept-1" },
          body: { title: "Grande e o Senhor", key: "g" },
        }),
      );

      expect(result.id).toBe("song-1");
      expect(mockPrismaClient.mediaItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: "MUSIC" }),
        }),
      );
    });
  });

  describe("mixChurchDepartmentSongs", () => {
    const primarySong = {
      id: "song-1",
      title: "Grande e o Senhor",
      metadata: { key: "G", lyrics: "Letra A", chords: "Cifra A" },
    };
    const secondarySong = {
      id: "song-2",
      title: "Ao Deus Que Habita em Mim",
      metadata: { key: "A", lyrics: "Letra B", chords: "" },
    };

    it("rejeita titulo vazio", async () => {
      await expect(
        adapters.mixChurchDepartmentSongs(
          makeRequest({
            params: { id: "dept-1" },
            body: { title: "  ", primaryMediaItemId: "song-1", secondaryMediaItemId: "song-2" },
          }),
        ),
      ).rejects.toThrow("Titulo do mix e obrigatorio");
    });

    it("rejeita escolher a mesma musica duas vezes", async () => {
      await expect(
        adapters.mixChurchDepartmentSongs(
          makeRequest({
            params: { id: "dept-1" },
            body: { title: "Mix", primaryMediaItemId: "song-1", secondaryMediaItemId: "song-1" },
          }),
        ),
      ).rejects.toThrow("Escolha duas musicas diferentes pro mix");
    });

    it("rejeita quando uma das musicas nao existe no ministerio", async () => {
      mockPrismaClient.mediaItem.findFirst
        .mockResolvedValueOnce(primarySong)
        .mockResolvedValueOnce(null);

      await expect(
        adapters.mixChurchDepartmentSongs(
          makeRequest({
            params: { id: "dept-1" },
            body: { title: "Mix", primaryMediaItemId: "song-1", secondaryMediaItemId: "song-2" },
          }),
        ),
      ).rejects.toThrow("Uma das musicas escolhidas nao foi encontrada neste ministerio");
    });

    it("rejeita titulo de mix duplicado", async () => {
      mockPrismaClient.mediaItem.findFirst
        .mockResolvedValueOnce(primarySong)
        .mockResolvedValueOnce(secondarySong)
        .mockResolvedValueOnce({ id: "outro-song" });

      await expect(
        adapters.mixChurchDepartmentSongs(
          makeRequest({
            params: { id: "dept-1" },
            body: {
              title: "Grande e o Senhor",
              primaryMediaItemId: "song-1",
              secondaryMediaItemId: "song-2",
            },
          }),
        ),
      ).rejects.toThrow("Ja existe uma musica com esse nome neste ministerio");
    });

    it("cria o mix juntando letra/cifra, ignorando campo ausente nos dois lados", async () => {
      mockPrismaClient.mediaItem.findFirst
        .mockResolvedValueOnce(primarySong)
        .mockResolvedValueOnce(secondarySong)
        .mockResolvedValueOnce(null);
      mockPrismaClient.mediaItem.create.mockResolvedValue({ ...songRow, id: "mix-1" });

      const result = await adapters.mixChurchDepartmentSongs(
        makeRequest({
          params: { id: "dept-1" },
          body: {
            title: "Grande e o Senhor + Ao Deus Que Habita em Mim",
            primaryMediaItemId: "song-1",
            secondaryMediaItemId: "song-2",
          },
        }),
      );

      expect(result.id).toBe("mix-1");
      expect(mockPrismaClient.mediaItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: "MUSIC",
            title: "Grande e o Senhor + Ao Deus Que Habita em Mim",
            departmentId: "dept-1",
            metadata: expect.objectContaining({
              key: "G",
              lyrics: "Letra A\n\n[Segunda música: Ao Deus Que Habita em Mim]\n\nLetra B",
              chords: "Cifra A\n\n[Segunda música: Ao Deus Que Habita em Mim]\n\n",
              keyboardChords: "",
              mixSources: ["Grande e o Senhor", "Ao Deus Que Habita em Mim"],
            }),
          }),
        }),
      );
    });
  });

  describe("updateChurchDepartmentSong", () => {
    it("rejeita quando o recurso encontrado nao e categoria MUSIC", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue({ ...songRow, category: "ACTIVITY" });

      await expect(
        adapters.updateChurchDepartmentSong(
          makeRequest({
            params: { departmentId: "dept-1", songId: "song-1" },
            body: { title: "Novo titulo" },
          }),
        ),
      ).rejects.toThrow("Musica nao encontrada");
    });

    it("valida titulo unico ao renomear", async () => {
      mockPrismaClient.mediaItem.findFirst
        .mockResolvedValueOnce(songRow)
        .mockResolvedValueOnce({ id: "outro-song" });

      await expect(
        adapters.updateChurchDepartmentSong(
          makeRequest({
            params: { departmentId: "dept-1", songId: "song-1" },
            body: { title: "Nome ja usado" },
          }),
        ),
      ).rejects.toThrow("Ja existe uma musica com esse nome neste ministerio");
    });
  });

  describe("deleteChurchDepartmentSong", () => {
    it("rejeita apagar quando categoria nao e MUSIC", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue({ ...songRow, category: "ACTIVITY" });

      await expect(
        adapters.deleteChurchDepartmentSong(
          makeRequest({ params: { departmentId: "dept-1", songId: "song-1" } }),
        ),
      ).rejects.toThrow("Musica nao encontrada");
    });

    it("apaga musica valida", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(songRow);

      const result = await adapters.deleteChurchDepartmentSong(
        makeRequest({ params: { departmentId: "dept-1", songId: "song-1" } }),
      );

      expect(result).toEqual({ success: true });
    });
  });

  describe("preferencia pessoal de musica", () => {
    it("getChurchSongPreference retorna default quando nao ha preferencia salva", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue({ id: "song-1" });
      mockPrismaClient.userSongPreference.findUnique.mockResolvedValue(null);

      const result = await adapters.getChurchSongPreference(
        makeRequest({ params: { songId: "song-1" } }),
      );

      expect(result).toEqual({ id: null, personalKey: "", chords: "", notes: "", updatedAt: null });
    });

    it("getChurchSongPreference rejeita musica de outra igreja", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue(null);

      await expect(
        adapters.getChurchSongPreference(makeRequest({ params: { songId: "song-x" } })),
      ).rejects.toThrow("Musica nao encontrada nesta igreja");
    });

    it("updateChurchSongPreference faz upsert com dados aparados", async () => {
      mockPrismaClient.mediaItem.findFirst.mockResolvedValue({ id: "song-1" });
      mockPrismaClient.userSongPreference.upsert.mockResolvedValue({
        id: "pref-1",
        personalKey: "D",
        chords: "D G A",
        updatedAt: new Date(),
      });

      const result = await adapters.updateChurchSongPreference(
        makeRequest({ params: { songId: "song-1" }, body: { personalKey: "  D  ", chords: "D G A" } }),
      );

      expect(result.personalKey).toBe("D");
    });
  });

  describe("importCifraClubSong", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("bloqueia no plano FREE", async () => {
      await expect(
        adapters.importCifraClubSong(
          makeRequest({ hasFeature: false, params: { id: "dept-1" }, body: { url: "https://www.cifraclub.com.br/a/b" } }),
        ),
      ).rejects.toThrow("Importar música do Cifra Club está disponível apenas no plano Pro");
    });

    it("rejeita link que nao e do Cifra Club", async () => {
      await expect(
        adapters.importCifraClubSong(
          makeRequest({ params: { id: "dept-1" }, body: { url: "https://google.com" } }),
        ),
      ).rejects.toThrow("Informe um link valido do Cifra Club");
    });

    it("rejeita quando a pagina retorna erro", async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

      await expect(
        adapters.importCifraClubSong(
          makeRequest({
            params: { id: "dept-1" },
            body: { url: "https://www.cifraclub.com.br/artista/musica" },
          }),
        ),
      ).rejects.toThrow("Musica nao encontrada no Cifra Club");
    });

    it("extrai cifra, tom e link do youtube da pagina", async () => {
      const html = `
        <title>Musica Boa - Artista X - Cifra Club</title>
        <link rel="canonical" href="https://www.cifraclub.com.br/artista-x/musica-boa/" />
        <pre>[Intro] G D Em C\nLinha da letra aqui</pre>
        <span id="cifra_tom">G</span>
        https://www.youtube.com/watch?v=abc123
      `;
      global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => html }) as unknown as typeof fetch;

      const result = await adapters.importCifraClubSong(
        makeRequest({
          params: { id: "dept-1" },
          body: { url: "https://www.cifraclub.com.br/artista-x/musica-boa/" },
        }),
      );

      expect(result.source).toBe("cifraclub");
      expect(result.title).toBe("Musica Boa");
      expect(result.artist).toBe("Artista X");
      expect(result.key).toBe("G");
      expect(result.youtubeUrl).toBe("https://www.youtube.com/watch?v=abc123");
    });
  });

  describe("previewSongsFromPdf / importSongsFromPdf", () => {
    it("previewSongsFromPdf bloqueia no plano FREE", async () => {
      await expect(
        adapters.previewSongsFromPdf(makeRequest({ hasFeature: false, params: { id: "dept-1" } })),
      ).rejects.toThrow("Importar músicas via PDF está disponível apenas no plano Pro");
    });

    it("previewSongsFromPdf rejeita quando nao ha arquivo", async () => {
      await expect(
        adapters.previewSongsFromPdf(
          makeRequest({ params: { id: "dept-1" }, file: async () => undefined }),
        ),
      ).rejects.toThrow("Arquivo PDF não enviado");
    });

    it("previewSongsFromPdf rejeita mimetype que nao e PDF", async () => {
      await expect(
        adapters.previewSongsFromPdf(
          makeRequest({
            params: { id: "dept-1" },
            file: async () => ({
              filename: "foto.png",
              mimetype: "image/png",
              toBuffer: async () => Buffer.from("x"),
            }),
          }),
        ),
      ).rejects.toThrow("Envie um arquivo PDF válido");
    });

    it("previewSongsFromPdf rejeita quando nao extrai nenhuma musica", async () => {
      mockExtractPdfPages.mockResolvedValue(["pagina 1"]);
      mockExtractSongsFromPages.mockReturnValue([]);

      await expect(
        adapters.previewSongsFromPdf(
          makeRequest({
            params: { id: "dept-1" },
            file: async () => ({
              filename: "repertorio.pdf",
              mimetype: "application/pdf",
              toBuffer: async () => Buffer.from("conteudo"),
            }),
          }),
        ),
      ).rejects.toThrow("Não foi possível extrair texto deste PDF");
    });

    it("previewSongsFromPdf retorna musicas extraidas", async () => {
      mockExtractPdfPages.mockResolvedValue(["pagina 1"]);
      mockExtractSongsFromPages.mockReturnValue([{ title: "Musica 1", lyrics: "letra" }]);

      const result = await adapters.previewSongsFromPdf(
        makeRequest({
          params: { id: "dept-1" },
          file: async () => ({
            filename: "repertorio.pdf",
            mimetype: "application/pdf",
            toBuffer: async () => Buffer.from("conteudo"),
          }),
        }),
      );

      expect(result).toEqual({ songs: [{ title: "Musica 1", lyrics: "letra" }] });
    });

    it("importSongsFromPdf bloqueia no plano FREE", async () => {
      await expect(
        adapters.importSongsFromPdf(
          makeRequest({ hasFeature: false, params: { id: "dept-1" }, body: { songs: [] } }),
        ),
      ).rejects.toThrow("Importar músicas via PDF está disponível apenas no plano Pro");
    });

    it("importSongsFromPdf rejeita quando a lista fica vazia apos filtrar sem titulo", async () => {
      await expect(
        adapters.importSongsFromPdf(
          makeRequest({
            params: { id: "dept-1" },
            body: { songs: [{ title: "  " }] },
          }),
        ),
      ).rejects.toThrow("Nenhuma música para importar");
    });

    it("importSongsFromPdf cria as musicas revisadas numa transacao", async () => {
      mockPrismaClient.$transaction.mockResolvedValue([songRow]);

      const result = await adapters.importSongsFromPdf(
        makeRequest({
          params: { id: "dept-1" },
          body: { songs: [{ title: "Grande e o Senhor", lyrics: "letra" }] },
        }),
      );

      expect(result).toEqual({ songs: [songRow] });
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });
  });
});
