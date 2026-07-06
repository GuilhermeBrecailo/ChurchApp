import { FastifyReply, FastifyRequest } from "fastify";
import { controllerHandler } from "../src/interfaces/controllers/Handler";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

const createReply = () => {
  const reply = {
    code: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };

  return reply as unknown as FastifyReply & {
    code: jest.Mock;
    send: jest.Mock;
  };
};

describe("controllerHandler", () => {
  it("retorna sucesso com payload padronizado", async () => {
    const reply = createReply();
    const handler = controllerHandler(async () => ({ id: "schedule-id" }));

    await handler({} as FastifyRequest, reply);

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: { id: "schedule-id" },
      status: 200,
    });
  });

  it("retorna erro de dominio sem transformar em erro interno", async () => {
    const reply = createReply();
    const handler = controllerHandler(async () => {
      throw new DomainError("Data da escala inválida");
    });

    await handler({} as FastifyRequest, reply);

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      error: "Data da escala inválida",
      status: 409,
    });
  });

  it("mascara erro inesperado como erro interno", async () => {
    const reply = createReply();
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const handler = controllerHandler(async () => {
      throw new Error("database column missing");
    });

    await handler({} as FastifyRequest, reply);

    expect(reply.code).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: "Erro interno do servidor.",
      status: 500,
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
