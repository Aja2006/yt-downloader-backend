import express from 'express'
import cors from 'cors'
import { v4 as uuid } from 'uuid'
import fs from 'fs'
import path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import ytdlp from 'yt-dlp-exec'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Serve downloads folder
app.use('/downloads', express.static(path.join(__dirname, 'downloads')))

// Create downloads folder if missing
if (!fs.existsSync('downloads')) {
  fs.mkdirSync('downloads')
}

// --- Video download ---
app.post('/api/download/video', async (req, res) => {
  try {
    const { url, format } = req.body
    const id = uuid()
    const output = `downloads/${id}.mp4`

    await ytdlp(url, { format, output })

    res.json({ file: `${id}.mp4` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Video download failed' })
  }
})

// --- Audio download ---
app.post('/api/download/audio', async (req, res) => {
  try {
    const { url, type } = req.body
    const id = uuid()
    const temp = `downloads/${id}.mp4`
    const out = `downloads/${id}.${type}`

    await ytdlp(url, { format: 'bestaudio', output: temp })

    ffmpeg(temp)
      .toFormat(type)
      .save(out)
      .on('end', () => {
        fs.unlinkSync(temp)
        res.json({ file: `${id}.${type}` })
      })
      .on('error', err => {
        console.error(err)
        res.status(500).json({ error: 'Audio conversion failed' })
      })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Audio download failed' })
  }
})

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
