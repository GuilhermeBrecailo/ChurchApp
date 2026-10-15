const configModulePath = "../src/application/Services/Department/DepartmentScheduleConfig";

async function loadScheduleConfigModule() {
  try {
    return await import(configModulePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") return null;
    throw error;
  }
}

describe("department schedule config", () => {
  it("resolves WORSHIP and legacy MUSIC to the existing worship workflow", async () => {
    const module = await loadScheduleConfigModule();
    const worship = module?.resolveDepartmentScheduleConfig?.(null, "WORSHIP");
    const legacyMusic = module?.resolveDepartmentScheduleConfig?.(undefined, "MUSIC");

    expect(worship).toEqual({
      version: 1,
      fields: {
        arrival: false,
        rehearsal: true,
        songs: true,
        materials: true,
        roles: true,
        checklist: false,
      },
      roles: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
      checklistItems: [],
      communion: { enabled: false, roles: [], checklistItems: [] },
    });
    expect(legacyMusic).toEqual(worship);
  });

  it("resolves the deaconate preset with arrival, no rehearsal and existing responsibilities", async () => {
    const module = await loadScheduleConfigModule();

    expect(module?.resolveDepartmentScheduleConfig?.(null, "DEACONATE")).toEqual({
      version: 1,
      fields: {
        arrival: true,
        rehearsal: false,
        songs: false,
        materials: false,
        roles: true,
        checklist: true,
      },
      roles: ["Dízimo", "Recepção", "Apoio"],
      checklistItems: [
        { templateKey: "TEAM_CONFIRMATION", title: "Confirmar equipe e escala" },
        { templateKey: "WATER_AND_CUPS", title: "Conferir água e copos" },
      ],
      communion: {
        enabled: true,
        roles: [],
        checklistItems: [{ templateKey: "COMMUNION_PREPARATION", title: "Preparar a Santa Ceia" }],
      },
    });
  });

  it.each([
    ["unknown version", { version: 9 }],
    ["non-boolean field", { version: 1, fields: { arrival: "yes" } }],
    ["too many roles", { version: 1, roles: Array.from({ length: 41 }, (_, index) => `Função ${index}`) }],
    ["blank checklist title", { version: 1, checklistItems: [{ templateKey: "TASK", title: "  " }] }],
    ["oversized checklist title", { version: 1, checklistItems: [{ templateKey: "TASK", title: "x".repeat(181) }] }],
    ["duplicate checklist keys", { version: 1, checklistItems: [
      { templateKey: "TASK", title: "Uma tarefa" },
      { templateKey: "TASK", title: "Outra tarefa" },
    ] }],
  ])("rejects %s in a saved configuration", async (_label, invalidConfig) => {
    const module = await loadScheduleConfigModule();

    expect(() => module?.parseDepartmentScheduleConfig?.(invalidConfig)).toThrow();
  });
});
