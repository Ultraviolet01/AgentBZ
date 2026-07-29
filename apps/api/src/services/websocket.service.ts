import Pusher from "pusher";

let pusher: Pusher | null = null;

/**
 * Initializes Pusher with environment variables.
 * In a serverless environment, this is called on demand.
 */
export const initSocket = () => {
  if (!pusher) {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER || "mt1";

    if (!appId || !key || !secret || appId.startsWith("mock_")) {
      console.warn("⚠️ Pusher is not fully configured (using mock/missing credentials). Websockets broadcast disabled.");
      return null;
    }

    pusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }
  return pusher;
};

export const getIO = () => {
  return initSocket();
};

/**
 * Broadcasts an alert to a specific project channel using Pusher.
 */
export const broadcastAlert = async (projectId: string, alert: any) => {
  const p = getIO();
  if (!p) return;
  
  try {
    await p.trigger(`project_${projectId}`, "newAlert", alert);
    console.log(`📡 Pusher alert broadcasted for project ${projectId}`);
  } catch (error) {
    console.error("❌ Pusher broadcast failed:", error);
  }
};

