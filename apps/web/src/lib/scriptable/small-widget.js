// OmNomNom — Health Score (Small)
// Reads the widget token saved by "OmNomNom Widget Setup" from Keychain,
// fetches today's score, and shows the mascot, score, and a short message.
//
// Variables used by Scriptable.
// icon-color: deep-orange; icon-glyph: heartbeat;

const API_BASE = "https://omnomnom-api.wasim-811.workers.dev"
const APP_URL = "https://omnomnom.pages.dev"
const MASCOT_URL = "https://omnomnom.pages.dev/mascot.png"
const KEYCHAIN_KEY = "omnomnom_widget_token"

const COLORS = {
  primary: new Color("#d97745"),
  accent: new Color("#91a98a"),
  warning: new Color("#c9a642"),
  background: Color.dynamic(new Color("#fcfbf8"), new Color("#1c1816")),
  foreground: Color.dynamic(new Color("#25221f"), new Color("#f7f4f1")),
  muted: Color.dynamic(new Color("#7a726a"), new Color("#b3a89e")),
}

const MOOD_COLOR = {
  excited: COLORS.primary,
  happy: COLORS.accent,
  neutral: COLORS.warning,
  sad: Color.dynamic(new Color("#c0442f"), new Color("#e0604a")),
}

function localDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

async function fetchSummary(token) {
  const now = new Date()
  const params = [
    `date=${localDateKey(now)}`,
    `from=${encodeURIComponent(startOfLocalDay(now).toISOString())}`,
    `to=${encodeURIComponent(endOfLocalDay(now).toISOString())}`,
    `tzOffsetMinutes=${now.getTimezoneOffset()}`,
  ].join("&")

  const req = new Request(`${API_BASE}/api/widget-summary?${params}`)
  req.headers = { Authorization: `Bearer ${token}` }
  const json = await req.loadJSON()
  if (req.response.statusCode !== 200) {
    throw new Error(json.error || `Request failed (${req.response.statusCode})`)
  }
  return json
}

async function loadMascotImage() {
  const fm = FileManager.local()
  const cachePath = fm.joinPath(fm.cacheDirectory(), "omnomnom-mascot.png")
  try {
    const req = new Request(MASCOT_URL)
    const image = await req.loadImage()
    fm.writeImage(cachePath, image)
    return image
  } catch {
    return fm.fileExists(cachePath) ? fm.readImage(cachePath) : null
  }
}

function errorWidget(message) {
  const widget = new ListWidget()
  widget.url = APP_URL
  widget.backgroundColor = COLORS.background
  widget.setPadding(16, 16, 16, 16)
  widget.addSpacer()
  const text = widget.addText(message)
  text.font = Font.mediumSystemFont(13)
  text.textColor = COLORS.muted
  text.centerAlignText()
  widget.addSpacer()
  return widget
}

function buildSmallWidget(summary, mascotImage) {
  const moodColor = MOOD_COLOR[summary.mascotMood] || COLORS.primary

  const widget = new ListWidget()
  widget.url = APP_URL
  widget.backgroundColor = COLORS.background
  widget.setPadding(14, 12, 14, 12)
  widget.addSpacer()

  if (mascotImage) {
    const img = widget.addImage(mascotImage)
    img.imageSize = new Size(44, 44)
    img.centerAlignImage()
    widget.addSpacer(6)
  }

  const scoreText = widget.addText(String(summary.score))
  scoreText.font = Font.boldSystemFont(32)
  scoreText.textColor = moodColor
  scoreText.centerAlignText()

  const labelText = widget.addText("HEALTH SCORE")
  labelText.font = Font.semiboldSystemFont(10)
  labelText.textColor = COLORS.muted
  labelText.centerAlignText()

  widget.addSpacer(6)

  const messageText = widget.addText(summary.message)
  messageText.font = Font.mediumSystemFont(12)
  messageText.textColor = COLORS.foreground
  messageText.centerAlignText()
  messageText.lineLimit = 2
  messageText.minimumScaleFactor = 0.7

  widget.addSpacer()
  return widget
}

async function run() {
  let widget

  if (!Keychain.contains(KEYCHAIN_KEY)) {
    widget = errorWidget("Run the OmNomNom Widget Setup script once to save your token.")
  } else {
    try {
      const token = Keychain.get(KEYCHAIN_KEY)
      const [summary, mascotImage] = await Promise.all([fetchSummary(token), loadMascotImage()])
      widget = buildSmallWidget(summary, mascotImage)
    } catch (error) {
      widget = errorWidget(`Couldn't load OmNomNom: ${error.message}`)
    }
  }

  widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000)

  if (config.runsInWidget) {
    Script.setWidget(widget)
  } else {
    await widget.presentSmall()
  }
  Script.complete()
}

await run()
