const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Conexão com o banco de dados SQLite
const db = new sqlite3.Database('./messages.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Criação da tabela de mensagens
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Rota para enviar uma mensagem anônima
app.post('/messages', (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'O conteúdo da mensagem é obrigatório.' });
  }

  const query = `INSERT INTO messages (content) VALUES (?)`;
  db.run(query, [content], function (err) {
    if (err) {
      res.status(500).json({ error: 'Erro ao salvar a mensagem.' });
    } else {
      res.status(201).json({ id: this.lastID, content });
    }
  });
});

// Rota para listar todas as mensagens
app.get('/messages', (req, res) => {
  const query = `SELECT * FROM messages ORDER BY created_at DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao buscar as mensagens.' });
    } else {
      res.status(200).json(rows);
    }
  });
});

// Rota para apagar uma mensagem pelo ID
app.delete('/messages/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM messages WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      res.status(500).json({ error: 'Erro ao apagar a mensagem.' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Mensagem não encontrada.' });
    } else {
      res.status(200).json({ message: 'Mensagem apagada com sucesso.' });
    }
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
