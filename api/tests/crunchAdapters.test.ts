const mockPrismaClient = {
  crunch: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { CrunchAdapters } from "../src/interfaces/adapters/crunchAdapters";

function makeRequest(body: Record<string, unknown>): FastifyRequest {
  return { body } as unknown as FastifyRequest;
}

const validCreateBody = {
  name: "Igreja Central",
  logo: "https://example.com/logo.png",
  userMainId: "pastor-1",
  isActive: true,
  city: "São Paulo",
  road: "Rua das Flores",
  number: "100",
  localZipCode: "01234-567",
  state: "SP",
  complement: "",
  document: { documento: "12345678900" },
  departaments: [{ id: "dept-1", name: "Louvor", leaderId: "user-1" }],
  users: [{ id: "user-1", name: "Fulano", email: "fulano@example.com", phone: "11999998888" }],
};

function dbCrunchRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "church-1",
    name: "Igreja Central",
    slug: "igreja-central",
    logo: "https://example.com/logo.png",
    accentColor: null,
    userMainId: "pastor-1",
    document: "11144477735",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    city: "São Paulo",
    road: "Rua das Flores",
    number: "100",
    localZipCode: "01234567",
    state: "SP",
    complement: "",
    users: [],
    departments: [],
    ...overrides,
  };
}

describe("CrunchAdapters", () => {
  let adapters: CrunchAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new CrunchAdapters();
    mockPrismaClient.crunch.findUnique.mockResolvedValue(null); // slug uniqueness check: free by default
  });

  describe("createCrunch", () => {
    it("creates the church with a slug derived from the name and returns its id", async () => {
      mockPrismaClient.crunch.create.mockImplementation(async ({ data }: { data: { id: string } }) => ({
        id: data.id,
      }));

      const result = await adapters.createCrunch(makeRequest(validCreateBody));

      expect(typeof result.id).toBe("string");
      expect(mockPrismaClient.crunch.create).toHaveBeenCalledTimes(1);
      const createArgs = mockPrismaClient.crunch.create.mock.calls[0][0];
      expect(createArgs.data.slug).toBe("igreja-central");
      expect(createArgs.data.id).toBe(result.id);
    });

    it("appends a numeric suffix when the slug is already taken", async () => {
      mockPrismaClient.crunch.findUnique
        .mockResolvedValueOnce({ id: "other-church" }) // "igreja-central" taken
        .mockResolvedValueOnce(null); // "igreja-central-2" free
      mockPrismaClient.crunch.create.mockImplementation(async ({ data }: { data: { id: string } }) => ({
        id: data.id,
      }));

      await adapters.createCrunch(makeRequest(validCreateBody));

      const createArgs = mockPrismaClient.crunch.create.mock.calls[0][0];
      expect(createArgs.data.slug).toBe("igreja-central-2");
    });
  });

  describe("deleteCrunch", () => {
    it("throws when no id is provided", async () => {
      await expect(adapters.deleteCrunch(makeRequest({}))).rejects.toThrow(
        "O ID da Igreja (Crunch) não foi enviado no corpo da requisição",
      );
    });

    it("deletes the church by id", async () => {
      mockPrismaClient.crunch.delete.mockResolvedValue({ id: "church-1" });

      await adapters.deleteCrunch(makeRequest({ id: "church-1" }));

      expect(mockPrismaClient.crunch.delete).toHaveBeenCalledWith({
        where: { id: "church-1" },
      });
    });
  });

  describe("getAllCrunchs", () => {
    it("returns the mapped list of churches", async () => {
      mockPrismaClient.crunch.findMany.mockResolvedValue([dbCrunchRow()]);

      const result = await adapters.getAllCrunchs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("church-1");
    });
  });

  describe("getCrunchById", () => {
    it("throws when no id is provided", async () => {
      await expect(adapters.getCrunchById(makeRequest({}))).rejects.toThrow(
        "O ID não foi enviado no corpo da requisição",
      );
    });

    it("throws when the church does not exist", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(null);
      await expect(adapters.getCrunchById(makeRequest({ id: "missing" }))).rejects.toThrow(
        "Registro não encontrado",
      );
    });

    it("returns the church when found", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(dbCrunchRow());

      const result = await adapters.getCrunchById(makeRequest({ id: "church-1" }));

      expect(result?.id).toBe("church-1");
    });
  });

  describe("updateCrunch", () => {
    const updateBody = { ...validCreateBody, id: "church-1", slug: "igreja-central" };

    it("throws when no id is provided", async () => {
      await expect(
        adapters.updateCrunch(makeRequest({ ...validCreateBody, id: undefined })),
      ).rejects.toThrow("O ID é obrigatório para realizar a atualização.");
    });

    it("throws when the church to update does not exist", async () => {
      mockPrismaClient.crunch.findUnique
        .mockResolvedValueOnce({ id: "church-1" }) // assertChurchSlugAvailable: slug belongs to this same church
        .mockResolvedValueOnce(null); // getCrunchByIdUseCase lookup: not found

      await expect(adapters.updateCrunch(makeRequest(updateBody))).rejects.toThrow(
        "Não existe nenhuma Igreja (Crunch) com este ID",
      );
    });

    it("updates an existing church", async () => {
      mockPrismaClient.crunch.findUnique
        .mockResolvedValueOnce({ id: "church-1" }) // assertChurchSlugAvailable
        .mockResolvedValueOnce(dbCrunchRow()); // getCrunchByIdUseCase lookup
      mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1" });

      await adapters.updateCrunch(makeRequest(updateBody));

      expect(mockPrismaClient.crunch.update).toHaveBeenCalledTimes(1);
      const updateArgs = mockPrismaClient.crunch.update.mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: "church-1" });
    });
  });
});
