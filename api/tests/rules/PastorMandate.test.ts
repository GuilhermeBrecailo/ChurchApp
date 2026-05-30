import { PastorMandate } from "../../src/domain/value-objects/PastorMandate";

const validPastorMandateProps = () => ({
  pastorId: "550e8400-e29b-41d4-a716-446655440000",
  pastorName: "Pastor João",
  startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
});

describe("PastorMandate Value Object", () => {
  it("Deve criar um mandato pastoral ativo", () => {
    const props = validPastorMandateProps();
    const mandate = PastorMandate.create(props);

    expect(mandate.pastorId).toBe(props.pastorId);
    expect(mandate.pastorName).toBe(props.pastorName);
    expect(mandate.startDate).toBe(props.startDate);
    expect(mandate.endDate).toBeNull();
    expect(mandate.isActive).toBe(true);
  });

  it("Deve finalizar um mandato retornando uma nova instância", () => {
    const props = validPastorMandateProps();
    const mandate = PastorMandate.create(props);
    const endDate = new Date(props.startDate.getTime() + 24 * 60 * 60 * 1000);

    const finishedMandate = mandate.finish(endDate);

    expect(mandate.isActive).toBe(true);
    expect(finishedMandate.isActive).toBe(false);
    expect(finishedMandate.endDate).toBe(endDate);
    expect(finishedMandate).not.toBe(mandate);
  });

  it("Deve comparar mandatos pelos valores", () => {
    const props = validPastorMandateProps();
    const mandate = PastorMandate.create(props);
    const sameMandate = PastorMandate.create(props);
    const anotherMandate = PastorMandate.create({
      ...props,
      pastorId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(mandate.equals(sameMandate)).toBe(true);
    expect(mandate.equals(anotherMandate)).toBe(false);
  });

  it("Deve lançar erro se id do pastor for inválido", () => {
    expect(() => {
      PastorMandate.create({
        ...validPastorMandateProps(),
        pastorId: "id_invalido",
      });
    }).toThrow(/ID do pastor inválido/);
  });

  it("Deve lançar erro se nome do pastor estiver vazio", () => {
    expect(() => {
      PastorMandate.create({
        ...validPastorMandateProps(),
        pastorName: "",
      });
    }).toThrow(/O nome do pastor é obrigatório/);
  });

  it("Deve lançar erro se data de início for passada", () => {
    expect(() => {
      PastorMandate.create({
        ...validPastorMandateProps(),
        startDate: new Date("2024-01-01"),
      });
    }).toThrow(/A data de início é obrigatória/);
  });

  it("Deve lançar erro se data de término for anterior à data de início", () => {
    const props = validPastorMandateProps();

    expect(() => {
      PastorMandate.create({
        ...props,
        endDate: new Date(props.startDate.getTime() - 24 * 60 * 60 * 1000),
      });
    }).toThrow("A data de término não pode ser anterior à data de início.");
  });

  it("Deve lançar erro ao finalizar mandato já finalizado", () => {
    const props = validPastorMandateProps();
    const endDate = new Date(props.startDate.getTime() + 24 * 60 * 60 * 1000);
    const mandate = PastorMandate.create({ ...props, endDate });

    expect(() => {
      mandate.finish(new Date(endDate.getTime() + 24 * 60 * 60 * 1000));
    }).toThrow("Este mandato pastoral já foi finalizado.");
  });
});
