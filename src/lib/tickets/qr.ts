import "server-only";
import QRCode from "qrcode";

/** Data-URL PNG for emails and the confirmation page. Encodes only the ticket code. */
export async function ticketQrDataUrl(code: string): Promise<string> {
  return QRCode.toDataURL(code, { errorCorrectionLevel: "M", margin: 1, width: 280, color: { dark: "#161411", light: "#F7F3EB" } });
}
