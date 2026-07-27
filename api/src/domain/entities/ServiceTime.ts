import { z } from "zod";

export const serviceTimeSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1, "Rotulo do culto e obrigatorio"),
  weekday: z.number().int().min(0, "Dia da semana invalido").max(6, "Dia da semana invalido"),
  time: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horario invalido"),
  isActive: z.boolean().default(true),
  crunchId: z.string().uuid(),
});

export type ServiceTimeDTO = z.infer<typeof serviceTimeSchema>;

export class ServiceTime {
  private _id: string;
  private _label: string;
  private _weekday: number;
  private _time: string;
  private _isActive: boolean;
  private _crunchId: string;

  constructor(props: ServiceTimeDTO) {
    const data = serviceTimeSchema.parse(props);
    this._id = data.id;
    this._label = data.label;
    this._weekday = data.weekday;
    this._time = data.time;
    this._isActive = data.isActive;
    this._crunchId = data.crunchId;
  }

  get id() { return this._id; }
  get label() { return this._label; }
  get weekday() { return this._weekday; }
  get time() { return this._time; }
  get isActive() { return this._isActive; }
  get crunchId() { return this._crunchId; }

  set label(value: string) { this._label = value; }
  set weekday(value: number) { this._weekday = value; }
  set time(value: string) { this._time = value; }
  set isActive(value: boolean) { this._isActive = value; }
}