// OmNomNom Widget Setup
// Run this once (tap the script in the Scriptable app — it doesn't need to
// be a widget) to save your widget token to this device's Keychain. The
// small/medium widget scripts read it from there; the token itself never
// lives in a script file, so it's safe to share these scripts or sync them
// via iCloud.
//
// Variables used by Scriptable.
// icon-color: deep-orange; icon-glyph: magic;

const KEYCHAIN_KEY = "omnomnom_widget_token"

async function run() {
  const hasToken = Keychain.contains(KEYCHAIN_KEY)

  const alert = new Alert()
  alert.title = "OmNomNom Widget Setup"
  alert.message = hasToken
    ? "A widget token is already saved on this device. Paste a new one to replace it, or remove it below."
    : "Paste the widget token from the app: Settings → Widget access → Generate."
  alert.addSecureTextField("Widget token")
  alert.addAction("Save")
  if (hasToken) {
    alert.addDestructiveAction("Remove saved token")
  }
  alert.addCancelAction("Cancel")

  const choice = await alert.presentAlert()

  if (choice === 0) {
    const token = alert.textFieldValue(0).trim()
    if (token.length === 0) {
      await notify("Nothing saved", "That field was empty, so nothing was changed.")
      return
    }
    Keychain.set(KEYCHAIN_KEY, token)
    await notify(
      "Saved",
      "Your widget token is stored securely in this device's Keychain. You can now add the OmNomNom widgets to your Home Screen.",
    )
  } else if (choice === 1 && hasToken) {
    Keychain.remove(KEYCHAIN_KEY)
    await notify("Removed", "The saved widget token was deleted from this device.")
  }
}

async function notify(title, message) {
  const alert = new Alert()
  alert.title = title
  alert.message = message
  alert.addAction("OK")
  await alert.presentAlert()
}

await run()
Script.complete()
