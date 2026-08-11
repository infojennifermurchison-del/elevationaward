import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

// Owner notification. Manus's notification service is gone; by default this
// just logs. If OWNER_NOTIFY_WEBHOOK is set (e.g. a Slack/Zapier/webhook URL),
// the payload is POSTed there as JSON. Always non-fatal — never blocks a
// submission. Returns true when delivered to a webhook.
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const title = (payload.title ?? "").trim();
  const content = (payload.content ?? "").trim();

  console.log(`[Notify] ${title} — ${content}`);

  if (!ENV.ownerNotifyWebhook) return false;

  try {
    const response = await fetch(ENV.ownerNotifyWebhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, content, text: `${title}\n${content}` }),
    });
    if (!response.ok) {
      console.warn(`[Notify] Webhook returned ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notify] Webhook error:", error);
    return false;
  }
}
