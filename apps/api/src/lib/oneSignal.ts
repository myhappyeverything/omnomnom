export class OneSignalError extends Error {}

export async function sendPushNotification(
  appId: string,
  restApiKey: string,
  playerId: string,
  title: string,
  message: string,
): Promise<void> {
  if (!appId || !restApiKey) {
    throw new OneSignalError('OneSignal is not configured')
  }

  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${restApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      include_player_ids: [playerId],
      headings: { en: title },
      contents: { en: message },
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new OneSignalError(`OneSignal request failed (${response.status}): ${body.slice(0, 500)}`)
  }
}
