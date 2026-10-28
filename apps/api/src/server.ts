import 'dotenv/config'
import cors from 'cors'
import express, { type Response } from 'express'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'
import nodemailer from 'nodemailer'
import { createHash, randomInt } from 'node:crypto'

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json({ limit: '1mb' }))

const database = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  ssl: { minVersion: 'TLSv1.2' },
  waitForConnections: true,
  connectionLimit: 10,
})

const mailer = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  })
  : null

type Module = {
  id: string
  title: string
  description: string
  icon: string
  status: 'available' | 'coming_soon'
  href: string
}

const modules: Module[] = [
  { id: 'locations', title: 'Area & location', description: 'Explore agricultural information by state, district, and local area.', icon: '⌖', status: 'available', href: '/explore' },
  { id: 'crops', title: 'Crops', description: 'Learn about crops, seasons, cultivation, and regional growing patterns.', icon: '◒', status: 'available', href: '/crops' },
  { id: 'seeds', title: 'Seeds', description: 'Compare seed varieties with clear source and verification details.', icon: '✦', status: 'available', href: '/seeds' },
  { id: 'soils', title: 'Soils', description: 'Understand soil types, characteristics, and measured observations.', icon: '▰', status: 'available', href: '/soils' },
  { id: 'farmland', title: 'Farmland', description: 'Keep your farm records private and organized in one place.', icon: '⌂', status: 'coming_soon', href: '/farmland' },
  { id: 'maps', title: 'Geographical maps', description: 'View useful maps and imagery with source and date labels.', icon: '◇', status: 'coming_soon', href: '/maps' },
  { id: 'soil-health', title: 'Soil health', description: 'Track soil tests over time without guessing missing measurements.', icon: '♡', status: 'coming_soon', href: '/soil-health' },
]

const sampleLocations = [
  { id: 'in-tn', name: 'Tamil Nadu', type: 'state', parentId: null, source: 'Primary Key development dataset' },
  { id: 'in-tn-mdu', name: 'Madurai', type: 'district', parentId: 'in-tn', source: 'Primary Key development dataset' },
  { id: 'in-ka', name: 'Karnataka', type: 'state', parentId: null, source: 'Primary Key development dataset' },
]

const response = <T>(res: Response, data: T, meta?: Record<string, unknown>) =>
  res.json({ data, meta: meta ?? null, error: null })

const usernamePattern = /^(?=.{6,}$)(?=.*\d)[A-Za-z0-9]+$/

app.post('/api/auth/signup', async (req, res) => {
  const { username, firstName, lastName, email, password, repeatPassword } = req.body as Record<string, unknown>
  if (typeof username !== 'string' || !usernamePattern.test(username)) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_USERNAME', message: 'Username must be at least 6 characters, contain a number, and use only letters and numbers.' } })
    return
  }
  if (typeof firstName !== 'string' || !firstName.trim() || typeof lastName !== 'string' || !lastName.trim()) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_NAME', message: 'First name and last name are required.' } })
    return
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_EMAIL', message: 'Enter a valid email address.' } })
    return
  }
  if (typeof password !== 'string' || password.length < 8 || password !== repeatPassword) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_PASSWORD', message: 'Password must be at least 8 characters and both password fields must match.' } })
    return
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    await database.execute(
      'INSERT INTO users (username, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?)',
      [username, firstName.trim(), lastName.trim(), email.trim().toLowerCase(), passwordHash],
    )
    const [rows] = await database.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, first_name, last_name, email, role FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()],
    )
    const user = rows[0]
    res.status(201).json({
      data: { id: user.id, username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, message: 'Account created successfully.' },
      meta: null,
      error: null,
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ data: null, meta: null, error: { code: 'ACCOUNT_EXISTS', message: 'That username or email is already registered.' } })
      return
    }
    console.error('Signup database error:', error)
    res.status(503).json({ data: null, meta: null, error: { code: 'DATABASE_UNAVAILABLE', message: 'Signup is temporarily unavailable. Check the API database configuration.' } })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body as Record<string, unknown>
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_LOGIN', message: 'Email and password are required.' } })
    return
  }
  try {
    const [rows] = await database.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, first_name, last_name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()],
    )
    const user = rows[0]
    if (!user || !(await bcrypt.compare(password, user.password_hash as string))) {
      res.status(401).json({ data: null, meta: null, error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } })
      return
    }
    res.json({
      data: { id: user.id, username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role },
      meta: null,
      error: null,
    })

  } catch (error) {
    console.error('Login database error:', error)
    res.status(503).json({ data: null, meta: null, error: { code: 'DATABASE_UNAVAILABLE', message: 'Login is temporarily unavailable. Check the API database configuration.' } })
  }
})

app.put('/api/auth/profile', async (req, res) => {
  const { id, username, firstName, lastName, email } = req.body as Record<string, unknown>
  if (!Number.isInteger(id) || typeof username !== 'string' || !usernamePattern.test(username) ||
      typeof firstName !== 'string' || !firstName.trim() ||
      typeof lastName !== 'string' || !lastName.trim() ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_PROFILE', message: 'Enter a valid username, name, and email address.' } })
    return
  }
  const profileId = id as number
  const profileUsername = username as string
  const profileFirstName = firstName as string
  const profileLastName = lastName as string
  const profileEmail = email as string
  try {
    await database.execute(
      'UPDATE users SET username = ?, first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [profileUsername, profileFirstName.trim(), profileLastName.trim(), profileEmail.trim().toLowerCase(), profileId],
    )
    const [rows] = await database.execute<mysql.RowDataPacket[]>(
      'SELECT id, username, first_name, last_name, email, role FROM users WHERE id = ? LIMIT 1',
      [profileId],
    )
    const user = rows[0]
    if (!user) {
      res.status(404).json({ data: null, meta: null, error: { code: 'PROFILE_NOT_FOUND', message: 'Profile was not found.' } })
      return
    }
    res.json({
      data: { id: user.id, username: user.username, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role },
      meta: null,
      error: null,
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ data: null, meta: null, error: { code: 'ACCOUNT_EXISTS', message: 'That username or email is already registered.' } })
      return
    }
    console.error('Profile update database error:', error)
    res.status(503).json({ data: null, meta: null, error: { code: 'DATABASE_UNAVAILABLE', message: 'Profile updates are temporarily unavailable.' } })
  }
})

app.post('/api/auth/password-reset/request', async (req, res) => {
  const { email } = req.body as Record<string, unknown>
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_EMAIL', message: 'Enter a valid email address.' } })
    return
  }
  if (!mailer) {
    res.status(503).json({ data: null, meta: null, error: { code: 'EMAIL_NOT_CONFIGURED', message: 'Password reset email is not configured on the API.' } })
    return
  }
  try {
    const [rows] = await database.execute<mysql.RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()])
    const user = rows[0]
    if (!user) {
      res.json({ data: { message: 'If that email is registered, an OTP has been sent.' }, meta: null, error: null })
      return
    }
    const otp = String(randomInt(100000, 1000000))
    const otpHash = createHash('sha256').update(otp).digest('hex')
    await database.execute('UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [user.id])
    await database.execute(
      'INSERT INTO password_reset_otps (user_id, otp_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
      [user.id, otpHash],
    )
    await mailer.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: email.trim().toLowerCase(),
      subject: 'Primary Key password reset OTP',
      text: `Your Primary Key password reset OTP is ${otp}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    })
    res.json({ data: { message: 'If that email is registered, an OTP has been sent.' }, meta: null, error: null })
  } catch (error) {
    console.error('Password reset email error:', error)
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'EAUTH') {
      res.status(503).json({ data: null, meta: null, error: { code: 'SMTP_AUTH_FAILED', message: 'The API could not authenticate with the email provider. Check the SMTP username and SMTP key in apps/api/.env.' } })
      return
    }
    res.status(503).json({ data: null, meta: null, error: { code: 'PASSWORD_RESET_UNAVAILABLE', message: 'We could not send the OTP right now.' } })
  }
})

app.post('/api/auth/password-reset/verify', async (req, res) => {
  const { email, otp } = req.body as Record<string, unknown>
  if (typeof email !== 'string' || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_OTP', message: 'Enter the six-digit OTP sent to your email.' } })
    return
  }
  try {
    const [rows] = await database.execute<mysql.RowDataPacket[]>(
      `SELECT reset.id, reset.otp_hash, reset.attempts
       FROM password_reset_otps reset
       JOIN users user_record ON user_record.id = reset.user_id
       WHERE user_record.email = ? AND reset.used_at IS NULL AND reset.expires_at > NOW()
       ORDER BY reset.created_at DESC LIMIT 1`,
      [email.trim().toLowerCase()],
    )
    const reset = rows[0]
    if (!reset || Number(reset.attempts) >= 5 || createHash('sha256').update(otp).digest('hex') !== reset.otp_hash) {
      if (reset) await database.execute('UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?', [reset.id])
      res.status(401).json({ data: null, meta: null, error: { code: 'INVALID_OTP', message: 'The OTP is invalid or expired.' } })
      return
    }
    await database.execute('UPDATE password_reset_otps SET used_at = NOW() WHERE id = ?', [reset.id])
    res.json({ data: { message: 'OTP verified. You can continue to the main page.' }, meta: null, error: null })
  } catch (error) {
    console.error('Password reset verification error:', error)
    res.status(503).json({ data: null, meta: null, error: { code: 'PASSWORD_RESET_UNAVAILABLE', message: 'Password reset is temporarily unavailable.' } })
  }
})

app.get('/health', (_req, res) => response(res, { status: 'ok', service: 'primary-key-api' }))

app.get('/api/modules', (_req, res) => response(res, modules, { source: 'Primary Key API', asOf: new Date().toISOString() }))

app.get('/api/integrations/status', (_req, res) => response(res, {
  mapbox: Boolean(process.env.MAPBOX_ACCESS_TOKEN),
  weather: Boolean(process.env.WEATHER_API_KEY) || process.env.WEATHER_PROVIDER === 'open-meteo',
}, { note: 'Credentials are never returned by this endpoint.' }))

app.get('/api/locations', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : ''
  const results = query
    ? sampleLocations.filter((location) => location.name.toLowerCase().includes(query))
    : sampleLocations
  response(res, results, { source: 'Primary Key development dataset', query })
})

app.get('/api/explore', (req, res) => {
  const location = typeof req.query.location === 'string' ? req.query.location.trim() : ''
  if (!location) {
    res.status(400).json({ data: null, meta: null, error: { code: 'LOCATION_REQUIRED', message: 'Provide a location query.' } })
    return
  }

  response(res, {
    location,
    availability: {
      locations: 'available',
      crops: 'available',
      seeds: 'available',
      soils: 'available',
      farmland: 'unavailable_without_authentication',
      maps: 'coming_soon',
      soilHealth: 'coming_soon',
    },
    notice: 'This development response contains no live agricultural measurements. Records will include source, date, and verification status when the database is connected.',
  })
})

app.get('/api/weather', async (req, res) => {
  const latitude = Number(req.query.latitude)
  const longitude = Number(req.query.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    res.status(400).json({ data: null, meta: null, error: { code: 'INVALID_COORDINATES', message: 'Valid latitude and longitude are required.' } })
    return
  }
  const provider = process.env.WEATHER_PROVIDER ?? 'openweather'
  if (provider === 'openweather' && !process.env.WEATHER_API_KEY) {
    res.status(503).json({ data: null, meta: { status: 'unavailable', source: 'OpenWeather' }, error: { code: 'WEATHER_NOT_CONFIGURED', message: 'Configure WEATHER_API_KEY for the selected weather provider.' } })
    return
  }

  try {
    const url = provider === 'openweather'
      ? new URL('https://api.openweathermap.org/data/2.5/weather')
      : new URL('https://api.open-meteo.com/v1/forecast')
    if (provider === 'openweather') {
      url.searchParams.set('lat', String(latitude))
      url.searchParams.set('lon', String(longitude))
      url.searchParams.set('appid', process.env.WEATHER_API_KEY ?? '')
      url.searchParams.set('units', 'metric')
    } else {
      url.searchParams.set('latitude', String(latitude))
      url.searchParams.set('longitude', String(longitude))
      url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m')
      url.searchParams.set('timezone', 'auto')
    }
    const upstream = await fetch(url)
    if (!upstream.ok) throw new Error(`${provider} returned ${upstream.status}`)
    const weather: unknown = await upstream.json()
    response(res, weather, { source: provider === 'openweather' ? 'OpenWeather' : 'Open-Meteo', retrievedAt: new Date().toISOString(), status: 'available' })
  } catch {
    res.status(502).json({ data: null, meta: { source: provider, status: 'unavailable' }, error: { code: 'WEATHER_UPSTREAM_ERROR', message: 'Weather data is temporarily unavailable.' } })
  }
})


app.post('/api/ai/ask', (req, res) => {
  const question = typeof req.body?.question === 'string'
    ? req.body.question.trim().toLowerCase()
    : ''

  if (!question || question.length > 2000) {
    res.status(400).json({
      data: null,
      meta: null,
      error: { code: 'INVALID_QUESTION', message: 'Enter a question of up to 2000 characters.' },
    })
    return
  }

  let answer: string

  if (question.includes('black soil')) {
    answer = 'Black soil (regur soil) occurs in parts of Tamil Nadu, especially areas with clay-rich soils. It retains moisture and can support cotton, pulses and other crops depending on local conditions. Not all of Tamil Nadu is dominated by black soil; red soil is widespread, and alluvial and coastal soils occur in other regions. Test soil pH and nutrients before choosing crops.'
  } else if (question.includes('soil') && (question.includes('tamil nadu') || question.includes('tamilnadu') || question.includes('type'))) {
    answer = 'Tamil Nadu has several soil types: red soil is widespread; black soil occurs in selected areas; alluvial soil is found in river plains and deltas; lateritic soil occurs in some locations; and coastal sandy soils occur near the coast. The dominant type depends on the district and location.'
  } else if (question.includes('soil health') || question.includes('improve soil')) {
    answer = 'To improve soil health: add well-decomposed compost or farmyard manure, grow legumes or cover crops, avoid unnecessary tillage, maintain crop residues where appropriate, and use fertilizers based on a soil test. Ensure drainage is suitable for your crop and local soil.'
  } else if (question.includes('irrigation') || question.includes('water')) {
    answer = 'Use irrigation based on crop stage, soil moisture and local weather. Drip irrigation can reduce water loss for suitable crops. Avoid waterlogging, check for leaks, and irrigate during cooler parts of the day when practical.'
  } else if (question.includes('pest') || question.includes('insect')) {
    answer = 'Inspect plants regularly and identify the pest before treatment. Use integrated pest management: remove affected plant material where appropriate, conserve beneficial insects, and consider approved controls only when needed. Follow the product label and consult your local agricultural extension officer for serious outbreaks.'
  } else if (question.includes('crop')) {
    answer = 'Crop selection depends on soil type, soil-test results, rainfall, irrigation availability, season and local market conditions. Share your district, soil type, water availability and season for more specific general guidance.'
  } else {
    answer = 'I can provide general agriculture guidance about Tamil Nadu soil types, soil health, crop selection, irrigation and pest management. Please ask a specific question and include your district or crop where relevant. These are predefined guidance responses, not live AI-generated advice.'
  }

  res.json({
    data: { answer, model: 'AgrInfo built-in agriculture guide' },
    meta: { source: 'AgrInfo knowledge fallback', generatedAt: new Date().toISOString() },
    error: null,
  })
})

app.use((_req, res) => {
  res.status(404).json({ data: null, meta: null, error: { code: 'NOT_FOUND', message: 'The requested API route does not exist.' } })
})

app.listen(port, () => {
  console.log(`Primary Key API listening on http://localhost:${port}`)
})
