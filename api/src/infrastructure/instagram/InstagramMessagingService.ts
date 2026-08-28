import { InstagramIntegrationError } from "./InstagramBusinessLoginService";

export type InstagramSendTextInput = {
  accessToken: string;
  instagramUserId: string;
  recipientId: string;
  text: string;
};

export type InstagramSendTextResult = {
  recipientId: string;
  messageId: string;
};

type InstagramMessagingServiceOptions = {
  fetcher?: typeof fetch;
  graphApiVersion?: string;
};

type MetaMessageResponse = {
  recipient_id?: string | number;
  message_id?: string;
};

export class InstagramMessagingService {
  private readonly fetcher: typeof fetch;
  private readonly graphApiVersion: string;

  constructor(options: InstagramMessagingServiceOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.graphApiVersion =
      options.graphApiVersion || process.env.INSTAGRAM_GRAPH_API_VERSION || "v26.0";
  }

  async sendText(input: InstagramSendTextInput): Promise<InstagramSendTextResult> {
    const accessToken = input.accessToken.trim();
    const instagramUserId = input.instagramUserId.trim();
    const recipientId = input.recipientId.trim();
    const text = input.text.trim();

    if (!accessToken || !instagramUserId || !recipientId || !text) {
      throw new InstagramIntegrationError("Mensagem do Instagram inválida");
    }

    const url = new URL(
      `https://graph.instagram.com/${this.graphApiVersion}/${encodeURIComponent(instagramUserId)}/messages`,
    );
    const response = await this.fetcher(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    const body = (await response.json().catch(() => null)) as MetaMessageResponse | null;
    if (
      !response.ok ||
      !body?.message_id ||
      !body.recipient_id
    ) {
      throw new InstagramIntegrationError();
    }

    return {
      recipientId: String(body.recipient_id),
      messageId: body.message_id,
    };
  }
}
