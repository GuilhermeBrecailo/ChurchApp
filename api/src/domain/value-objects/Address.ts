import { DomainError } from "./utils/DomainError";
import { z } from "zod";

export const addressSchema = z.object({
  city: z.string().min(3, "Nome da cidade muito curto").max(100).trim(),
  number: z
    .string()
    .max(10, "Número muito longo")
    .trim()
    .optional()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? "S/N" : val)),
  road: z.string().min(5, "Endereço deve ser mais detalhado").max(150).trim(),
  localZipCode: z
    .string()
    .min(8, "CEP incompleto")
    .max(9, "CEP inválido")
    .regex(/^\d{5}-?\d{3}$/, "Formato de CEP inválido")
    .transform((val) => val.replace(/\D/g, "")),
  state: z
    .string()
    .length(2, "Use a sigla do estado (ex: SP)")
    .transform((val) => val.toUpperCase())
    .refine((val) => {
      const ufs = [
        "AC",
        "AL",
        "AP",
        "AM",
        "BA",
        "CE",
        "DF",
        "ES",
        "GO",
        "MA",
        "MT",
        "MS",
        "MG",
        "PA",
        "PB",
        "PR",
        "PE",
        "PI",
        "RJ",
        "RN",
        "RS",
        "RO",
        "RR",
        "SC",
        "SP",
        "SE",
        "TO",
      ];
      return ufs.includes(val);
    }, "UF inválida"),
  description: z
    .string()
    .max(255, "A descrição deve ser breve")
    .trim()
    .optional(),
  complement: z
    .string()
    .max(100, "Complemento muito longo")
    .trim()
    .optional()
    .or(z.literal("")),
});
export type AddressDTO = z.infer<typeof addressSchema>;

export class Address {
  private city: string = "";
  private number?: string = "";
  private road: string = "";
  private localZipCode: string = "";
  private state: string = "";
  private complement?: string = "";
  private description?: string = "";

  constructor(props: AddressDTO) {
    this.setCity(props.city);
    this.setRoad(props.road);
    this.setLocalZipCode(props.localZipCode);
    this.setState(props.state);
    this.setDescription(props.description);
    if (props.complement) this.setComplement(props.complement);
    if (props.number) this.setNumber(props.number);
  }

  static create(props: AddressDTO): Address {
    const data = addressSchema.parse(props);
    return new Address(data);
  }

  // RESTORE
  static restore(props: AddressDTO): Address {
    const data = addressSchema.parse(props);

    return new Address(data);
  }

  public getCity() {
    return this.city;
  }

  public getNumber() {
    return this.number;
  }

  public getComplement() {
    return this.complement;
  }

  public getRoad() {
    return this.road;
  }

  public getLocalZipCode() {
    return this.localZipCode;
  }

  public getState() {
    return this.state;
  }

  public getDescription() {
    return this.description;
  }

  public setCity(value: string) {
    if (!value?.toString().trim()) throw new DomainError("Cidade não é válida");

    this.city = value;
  }

  public setComplement(value: string) {
    if (!value?.toString().trim())
      throw new DomainError("Complemento não é válido");

    this.complement = value;
  }

  public setNumber(value: string) {
    if (!value?.toString().trim()) throw new DomainError("Número não é válido");

    this.number = value;
  }

  public setRoad(value: string) {
    if (!value?.toString().trim()) throw new DomainError("Rua não é válida");

    this.road = value;
  }

  public setLocalZipCode(value: string) {
    const cepFormatted = value.replace(/-/g, "");

    if (!cepFormatted?.toString().trim())
      throw new DomainError("Cep da empresa não é válido");

    if (cepFormatted === "00000000")
      throw new DomainError("Cep da empresa não pode ser 00000-000");

    this.localZipCode = cepFormatted;
  }

  public setState(value: string) {
    if (!value?.toString().trim()) throw new DomainError("Estado não é válido");

    const stateVality = [
      "AC",
      "AL",
      "AP",
      "AM",
      "BA",
      "CE",
      "DF",
      "ES",
      "GO",
      "MA",
      "MT",
      "MS",
      "MG",
      "PA",
      "PB",
      "PR",
      "PE",
      "PI",
      "RJ",
      "RN",
      "RS",
      "RO",
      "RR",
      "SC",
      "SP",
      "SE",
      "TO",
    ];

    if (!stateVality.includes(value))
      throw new DomainError("Estado não existe");

    this.state = value;
  }

  public setDescription(value?: string) {
    this.description = value;
  }
}
