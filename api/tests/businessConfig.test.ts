import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BusinessConfigValidationError,
  getBusinessConfig,
  loadBusinessConfig,
} from "../src/config/businessConfig";
import { $config } from "../config/config";

const validBusinessConfig = {
  owner: {
    name: "Guilherme Brecailo",
    role: "Desenvolvedor / CEO",
  },
  company: {
    name: "ChurchApp",
    website: "https://churchapp.site/comece",
    instagramHandle: "app_church",
    whatsappUrl: "https://wa.me/5543996644544",
    product: "Gestor de Igrejas",
  },
  offer: {
    pitch:
      "O ChurchApp é uma plataforma de gestão para igrejas. O cadastro pode ser feito online, com 3 meses grátis; depois, há um plano gratuito e o plano Pro por R$49,90.",
    howItWorks:
      "A igreja se cadastra online, usa 3 meses grátis e, depois, pode permanecer no plano gratuito ou contratar o plano Pro.",
    freeTrialMonths: 3,
    freePlanAvailable: true,
    proPlan: {
      name: "Pro",
      price: 49.9,
      currency: "BRL",
    },
  },
  verifiedClaims: [
    "ChurchApp é uma plataforma de gestão para igrejas",
    "o cadastro pode ser feito online",
    "novos cadastros têm 3 meses grátis",
    "após o período grátis existe um plano gratuito e o plano Pro pago",
    "mais de 30 usuários usando",
    "notificações automáticas",
  ],
  unverifiedClaims: [],
  idealCustomerProfile: {
    segments: ["igrejas", "pastores", "gestores de igrejas"],
    keywords: ["igreja", "culto", "ministério", "pastor", "congregação"],
    geography: ["Brasil"],
  },
  affiliates: {
    groupUrl: null,
    topics: [],
  },
};

function writeConfigFile(value: unknown) {
  const directory = mkdtempSync(join(tmpdir(), "churchapp-business-config-"));
  const filePath = join(directory, "business.json");
  writeFileSync(filePath, JSON.stringify(value), "utf8");

  return {
    filePath,
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

describe("business configuration", () => {
  it("loads the commercial configuration with typed business data", () => {
    const file = writeConfigFile(validBusinessConfig);

    try {
      const config = loadBusinessConfig(file.filePath);

      expect(config.company.name).toBe("ChurchApp");
      expect(config.offer.proPlan.price).toBe(49.9);
      expect(config.verifiedClaims).toContain("notificações automáticas");
      expect(config.affiliates.groupUrl).toBeNull();
    } finally {
      file.cleanup();
    }
  });

  it("rejects a configuration with an invalid offer or missing claims", () => {
    const invalidConfig = {
      ...validBusinessConfig,
      offer: {
        ...validBusinessConfig.offer,
        proPlan: {
          ...validBusinessConfig.offer.proPlan,
          price: 0,
        },
      },
      verifiedClaims: undefined,
    };
    const file = writeConfigFile(invalidConfig);

    try {
      expect(() => loadBusinessConfig(file.filePath)).toThrow(
        BusinessConfigValidationError,
      );
    } finally {
      file.cleanup();
    }
  });

  it("loads the repository configuration by default and exposes it centrally", () => {
    const config = getBusinessConfig();

    expect(config.company.name).toBe("ChurchApp");
    expect($config.BUSINESS.company.website).toBe(
      "https://churchapp.site/comece",
    );
  });
});
