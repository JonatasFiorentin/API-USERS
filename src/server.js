const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

const app = express()
app.use(express.json())
app.use(cors())
app.use(bodyParser.json())

app.listen(3000, () => {
  console.log('Servidor Rodando Na Porta 3000')
})

app.get('/', (req, res) => {
  res.send('Hello, Express!')
})

app.post('/register', async (req, res) => {
  const { email, password } = req.body

  const UsuarioExiste = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  )

  if (UsuarioExiste.rows.length > 0) {
    return res.status(400).json({ error: 'Este email já existe' })
  }

  const hashedSenha = await bcrypt.hash(password, 10)

  const novoUsuario = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
    [email, hashedSenha]
  )

  res.status(201).json(novoUsuario.rows[0])
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body

  const usuario = await pool.query('SELECT * FROM users WHERE email = $1', [
    email,
  ])

  if (usuario.rows.length === 0) {
    return res.status(400).json({ error: 'Usuário ou senha inválidos' })
  }

  const senhaValida = await bcrypt.compare(password, usuario.rows[0].password)
  if (!senhaValida) {
    return res.status(400).json({ error: 'Usuário ou senha inválidos' })
  }
  res.json({ token, message: 'Login Realizado' })
})

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params

  try {
    const resultado = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    )

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    res.json({
      message: 'Usuário removido com sucesso',
      user: resultado.rows[0],
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao remover usuário' })
  }
})
