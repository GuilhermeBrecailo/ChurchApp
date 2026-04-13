interface PastorMandateProps {
  pastorId: string;
  pastorName: string;
  startDate: Date;
  endDate?: Date | null;
}

export class PastorMandate {
  private readonly _pastorId: string;
  private readonly _pastorName: string;
  private readonly _startDate: Date;
  private readonly _endDate: Date | null;

  private constructor(props: PastorMandateProps) {
    if (props.endDate && props.endDate < props.startDate) {
      throw new Error(
        "A data de término não pode ser anterior à data de início.",
      );
    }

    this._pastorId = props.pastorId;
    this._pastorName = props.pastorName;
    this._startDate = props.startDate;
    this._endDate = props.endDate || null;
  }

  // Factory de criação
  static create(props: PastorMandateProps): PastorMandate {
    return new PastorMandate(props);
  }

  get pastorId() {
    return this._pastorId;
  }
  get pastorName() {
    return this._pastorName;
  }
  get startDate() {
    return this._startDate;
  }
  get endDate() {
    return this._endDate;
  }

  // Comportamento de domínio útil
  get isActive(): boolean {
    return this._endDate === null;
  }

  /**
   * Como o VO é imutável, para finalizar um mandato,
   * nós retornamos uma NOVA instância com a endDate preenchida.
   */
  public finish(endDate: Date = new Date()): PastorMandate {
    if (!this.isActive) {
      throw new Error("Este mandato pastoral já foi finalizado.");
    }
    return new PastorMandate({
      pastorId: this._pastorId,
      pastorName: this._pastorName,
      startDate: this._startDate,
      endDate: endDate,
    });
  }

  /**
   * VOs não têm ID. Eles são comparados pelos seus valores.
   */
  public equals(other: PastorMandate): boolean {
    return (
      this._pastorId === other.pastorId &&
      this._startDate.getTime() === other.startDate.getTime() &&
      this._endDate?.getTime() === other.endDate?.getTime()
    );
  }
}
