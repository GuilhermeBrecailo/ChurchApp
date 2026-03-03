import { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { DomainToken } from "../../domain/value-objects/utils/DomainToken";

type ControllerFn<T = unknown> = (
  request: FastifyRequest,
  reply: FastifyReply,
) => Promise<T>;

export const controllerHandler = (controllerFn: ControllerFn) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await controllerFn(request, reply);

      return reply.code(200).send({ data: result, status: 200 });
    } catch (err) {
      if (err instanceof DomainError) {
        return reply.code(200).send({ error: err.message, status: 409 });
      }
      if (err instanceof DomainToken) {
        return reply.code(403).send({ error: err.message, status: 403 });
      }

      if (err instanceof ZodError) {
        return reply.code(200).send({
          error:
            err.issues.length > 0 ? err.issues[0].message : "Erro de validação",
          status: 409,
        });
      }

      console.error(err);
      return reply
        .code(500)
        .send({ error: "Erro interno do servidor.", status: 500 });
    }
  };
};
