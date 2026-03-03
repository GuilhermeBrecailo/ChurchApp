/* eslint-disable @typescript-eslint/no-explicit-any */
import { trace, SpanStatusCode, Span } from "@opentelemetry/api";

const tracer = trace.getTracer("ELOG-APP");

interface TraceableOptions {
  spanName?: string;
  hideArgs?: boolean;
  hideResult?: boolean;
  attributes?: Record<string, string | number | boolean>;
}

export function Traceable(options: TraceableOptions = {}): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const spanName =
        options.spanName || `${target.constructor.name}.${String(propertyKey)}`;

      return tracer.startActiveSpan(spanName, async (span: Span) => {
        const startTime = Date.now();

        try {
          // --- Atributos básicos ---
          span.setAttribute("class", target.constructor.name);
          span.setAttribute("method", String(propertyKey));

          // --- Atributos customizados ---
          if (options.attributes) {
            for (const [k, v] of Object.entries(options.attributes)) {
              span.setAttribute(`custom.${k}`, v);
            }
          }

          // --- Argumentos (somente se permitido) ---
          if (!options.hideArgs) {
            args.forEach((arg, index) => {
              span.setAttribute(`arg.${index}`, safeString(arg));
            });
          }

          // --- Execução real do método ---
          const result = await Promise.resolve(original.apply(this, args));

          // --- Retorno (somente se permitido) ---
          if (!options.hideResult) {
            span.setAttribute("result", safeString(result));
            span.setAttribute("result.type", typeof result);
          }

          // --- Métricas ---
          span.setAttribute("execution_ms", Date.now() - startTime);

          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          return result;
        } catch (err: any) {
          span.recordException(err);
          span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message });
          span.setAttribute("error_message", err?.message || "unknown");
          span.setAttribute("execution_ms", Date.now() - startTime);
          span.end();
          throw err;
        }
      });
    };

    return descriptor;
  };
}

// ========= Helper seguro para JSON =========
function safeString(value: unknown): string {
  try {
    if (value === undefined) return "undefined";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  } catch {
    return "[unserializable]";
  }
}

// @Traceable()
// async getUser(id: string) { ... }

// @Traceable({ hideArgs: true })
// async login(email: string, password: string) { ... }

// @Traceable({ hideResult: true })
// async generateToken(user) { ... }

// @Traceable({ hideArgs: true, hideResult: true })
// async processSensitivePayment(data) { ... }

// @Traceable({
//   spanName: "OrderService.Create",
//   hideArgs: true,
//   attributes: {
//     feature: "orders",
//     version: "1.0",
//   }
// })
// async createOrder(dto) { ... }
