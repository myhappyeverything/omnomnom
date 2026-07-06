// OmNomNom — Health Score (Medium)
// Reads the widget token saved by "OmNomNom Widget Setup" from Keychain,
// fetches today's score, and shows the mascot, score, macro progress bars,
// and a short message.
//
// Variables used by Scriptable.
// icon-color: deep-orange; icon-glyph: heartbeat;

const API_BASE = "https://omnomnom-api.wasim-811.workers.dev"
const APP_URL = "https://omnomnom.pages.dev"
const MASCOT_URL = "https://omnomnom.pages.dev/mascot.png"
const KEYCHAIN_KEY = "omnomnom_widget_token"

const TRACK_WIDTH = 150
const TRACK_HEIGHT = 8

const COLORS = {
  primary: new Color("#d97745"),
  accent: new Color("#91a98a"),
  warning: new Color("#c9a642"),
  background: Color.dynamic(new Color("#fcfbf8"), new Color("#1c1816")),
  foreground: Color.dynamic(new Color("#25221f"), new Color("#f7f4f1")),
  muted: Color.dynamic(new Color("#7a726a"), new Color("#b3a89e")),
  track: Color.dynamic(new Color("#f2ece3"), new Color("#2b2521")),
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

function progressRow(parentStack, label, consumed, target, color, unit) {
  const row = parentStack.addStack()
  row.layoutHorizontally()
  row.centerAlignContent()

  const labelStack = row.addStack()
  labelStack.size = new Size(56, 14)
  const labelText = labelStack.addText(label)
  labelText.font = Font.mediumSystemFont(11)
  labelText.textColor = COLORS.foreground
  labelText.lineLimit = 1

  row.addSpacer(6)

  const track = row.addStack()
  track.size = new Size(TRACK_WIDTH, TRACK_HEIGHT)
  track.backgroundColor = COLORS.track
  track.cornerRadius = TRACK_HEIGHT / 2
  track.layoutHorizontally()

  const percent = target > 0 ? Math.min(Math.max(consumed / target, 0), 1) : 0
  const fillWidth = percent > 0 ? Math.max(Math.round(TRACK_WIDTH * percent), 6) : 0
  if (fillWidth > 0) {
    const fill = track.addStack()
    fill.size = new Size(Math.min(fillWidth, TRACK_WIDTH), TRACK_HEIGHT)
    fill.backgroundColor = color
    fill.cornerRadius = TRACK_HEIGHT / 2
  }
  track.addSpacer()

  row.addSpacer(6)

  const valueStack = row.addStack()
  valueStack.size = new Size(56, 14)
  const valueText = valueStack.addText(`${Math.round(consumed)}/${Math.round(target)}${unit}`)
  valueText.font = Font.mediumSystemFont(10)
  valueText.textColor = COLORS.muted
  valueText.rightAlignText()

  parentStack.addSpacer(6)
}

function buildMediumWidget(summary, mascotImage) {
  const moodColor = MOOD_COLOR[summary.mascotMood] || COLORS.primary

  const widget = new ListWidget()
  widget.url = APP_URL
  widget.backgroundColor = COLORS.background
  widget.setPadding(14, 16, 14, 16)

  const header = widget.addStack()
  header.layoutHorizontally()
  header.centerAlignContent()

  if (mascotImage) {
    const img = header.addImage(mascotImage)
    img.imageSize = new Size(30, 30)
    header.addSpacer(8)
  }

  const healthLine = header.addText(`Health ${summary.score}`)
  healthLine.font = Font.boldSystemFont(16)
  healthLine.textColor = COLORS.foreground

  header.addSpacer()

  const badge = header.addText(summary.label)
  badge.font = Font.semiboldSystemFont(11)
  badge.textColor = moodColor

  widget.addSpacer(12)

  progressRow(
    widget,
    "Calories",
    summary.macros.calories.consumed,
    summary.macros.calories.target,
    COLORS.primary,
    "",
  )
  progressRow(
    widget,
    "Protein",
    summary.macros.protein.consumed,
    summary.macros.protein.target,
    COLORS.accent,
    "g",
  )
  progressRow(widget, "Fat", summary.macros.fat.consumed, summary.macros.fat.target, COLORS.warning, "g")

  widget.addSpacer()

  const messageText = widget.addText(summary.message)
  messageText.font = Font.mediumSystemFont(12)
  messageText.textColor = moodColor
  messageText.lineLimit = 1
  messageText.minimumScaleFactor = 0.8

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
      widget = buildMediumWidget(summary, mascotImage)
    } catch (error) {
      widget = errorWidget(`Couldn't load OmNomNom: ${error.message}`)
    }
  }

  widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000)

  if (config.runsInWidget) {
    Script.setWidget(widget)
  } else {
    await widget.presentMedium()
  }
  Script.complete()
}

await run()
