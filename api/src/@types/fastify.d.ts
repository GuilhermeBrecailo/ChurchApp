import "fastify";
import { JwtDecoded } from "../application/use-cases/Auth/JwtValidationUseCase";

declare module "fastify" {
  // Isso adiciona user ao request
  interface FastifyRequest {
    user: Partial<JwtDecoded>;
  }

  // Se quiser tipar app.user globalmente, pode usar any por enquanto
  interface FastifyInstance {
    app: any;
  }
}
