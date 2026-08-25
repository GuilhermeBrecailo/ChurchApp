declare module "qrcode" {
  export interface QRCodeToCanvasOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  const QRCode: {
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options?: QRCodeToCanvasOptions,
    ): void;
  };

  export default QRCode;
}
