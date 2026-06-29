/**
 * Corrida Primavera Kids - Backend Server
 * Clube de Aventureiros Missão Alagoas
 * 
 * Este servidor gerencia as inscrições da Corrida Primavera Kids utilizando Express e SQLite,
 * com um fallback automático para um arquivo JSON em caso de falha de carregamento do SQLite.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Caminhos dos arquivos
const dbPath = path.join(__dirname, 'database.db');
const fallbackDbPath = path.join(__dirname, 'database_fallback.json');

// Interface genérica de banco de dados (para alternar entre SQLite e JSON de forma transparente)
let db = {
  isFallback: false,
  sqliteDb: null,
  
  // Inicialização
  init(callback) {
    try {
      const sqlite3 = require('sqlite3').verbose();
      console.log('Instanciando banco de dados SQLite...');
      
      this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Erro ao conectar ao SQLite, usando fallback JSON:', err.message);
          this.setupFallback(callback);
        } else {
          console.log('Conectado ao banco de dados SQLite com sucesso.');
          this.createTable(callback);
        }
      });
    } catch (e) {
      console.warn('Módulo sqlite3 não disponível ou falhou ao carregar. Usando fallback JSON...');
      this.setupFallback(callback);
    }
  },

  // Configuração do banco de dados fallback (JSON)
  setupFallback(callback) {
    this.isFallback = true;
    if (!fs.existsSync(fallbackDbPath)) {
      fs.writeFileSync(fallbackDbPath, JSON.stringify([], null, 2), 'utf8');
      console.log('Arquivo JSON de fallback criado com sucesso.');
    } else {
      console.log('Arquivo JSON de fallback existente carregado.');
    }
    callback(null);
  },

  // Criação da tabela SQLite
  createTable(callback) {
    const query = `
      CREATE TABLE IF NOT EXISTS inscricoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        responsavel_nome TEXT NOT NULL,
        responsavel_cpf TEXT NOT NULL,
        responsavel_telefone TEXT NOT NULL,
        responsavel_email TEXT NOT NULL,
        participante_nome TEXT NOT NULL,
        participante_nascimento TEXT NOT NULL,
        participante_idade INTEGER NOT NULL,
        participante_sexo TEXT NOT NULL,
        info_clube TEXT,
        info_igreja TEXT,
        info_cidade TEXT NOT NULL,
        info_alergias TEXT,
        info_restricoes TEXT,
        info_emergencia TEXT NOT NULL,
        data_inscricao TEXT NOT NULL
      )
    `;
    this.sqliteDb.run(query, (err) => {
      if (err) {
        console.error('Erro ao criar tabela SQLite. Alternando para JSON...', err.message);
        this.setupFallback(callback);
      } else {
        console.log('Tabela "inscricoes" pronta no SQLite.');
        callback(null);
      }
    });
  },

  // Obter todas as inscrições
  getAll(callback) {
    if (this.isFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf8'));
        callback(null, data);
      } catch (err) {
        callback(err);
      }
    } else {
      this.sqliteDb.all('SELECT * FROM inscricoes ORDER BY id DESC', [], (err, rows) => {
        callback(err, rows);
      });
    }
  },

  // Obter por ID
  getById(id, callback) {
    if (this.isFallback) {
      try {
        const data = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf8'));
        const item = data.find(i => i.id === parseInt(id));
        callback(null, item);
      } catch (err) {
        callback(err);
      }
    } else {
      this.sqliteDb.get('SELECT * FROM inscricoes WHERE id = ?', [id], (err, row) => {
        callback(err, row);
      });
    }
  },

  // Inserir nova inscrição
  insert(data, callback) {
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Maceio' });
    
    if (this.isFallback) {
      try {
        const fileData = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf8'));
        const newId = fileData.length > 0 ? Math.max(...fileData.map(i => i.id)) + 1 : 1;
        
        const record = {
          id: newId,
          responsavel_nome: data.responsavel_nome,
          responsavel_cpf: data.responsavel_cpf,
          responsavel_telefone: data.responsavel_telefone,
          responsavel_email: data.responsavel_email,
          participante_nome: data.participante_nome,
          participante_nascimento: data.participante_nascimento,
          participante_idade: parseInt(data.participante_idade),
          participante_sexo: data.participante_sexo,
          info_clube: data.info_clube || '',
          info_igreja: data.info_igreja || '',
          info_cidade: data.info_cidade,
          info_alergias: data.info_alergias || '',
          info_restricoes: data.info_restricoes || '',
          info_emergencia: data.info_emergencia,
          data_inscricao: timestamp
        };
        
        fileData.push(record);
        fs.writeFileSync(fallbackDbPath, JSON.stringify(fileData, null, 2), 'utf8');
        callback(null, newId);
      } catch (err) {
        callback(err);
      }
    } else {
      const query = `
        INSERT INTO inscricoes (
          responsavel_nome, responsavel_cpf, responsavel_telefone, responsavel_email,
          participante_nome, participante_nascimento, participante_idade, participante_sexo,
          info_clube, info_igreja, info_cidade, info_alergias, info_restricoes, info_emergencia,
          data_inscricao
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        data.responsavel_nome, data.responsavel_cpf, data.responsavel_telefone, data.responsavel_email,
        data.participante_nome, data.participante_nascimento, parseInt(data.participante_idade), data.participante_sexo,
        data.info_clube, data.info_igreja, data.info_cidade, data.info_alergias, data.info_restricoes, data.info_emergencia,
        timestamp
      ];

      this.sqliteDb.run(query, params, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null, this.lastID);
        }
      });
    }
  },

  // Atualizar inscrição
  update(id, data, callback) {
    if (this.isFallback) {
      try {
        const fileData = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf8'));
        const index = fileData.findIndex(i => i.id === parseInt(id));
        
        if (index === -1) {
          return callback(new Error('Inscrição não encontrada.'));
        }
        
        // Preserva a data de inscrição original
        const dataInscricaoOriginal = fileData[index].data_inscricao;
        
        fileData[index] = {
          id: parseInt(id),
          responsavel_nome: data.responsavel_nome,
          responsavel_cpf: data.responsavel_cpf,
          responsavel_telefone: data.responsavel_telefone,
          responsavel_email: data.responsavel_email,
          participante_nome: data.participante_nome,
          participante_nascimento: data.participante_nascimento,
          participante_idade: parseInt(data.participante_idade),
          participante_sexo: data.participante_sexo,
          info_clube: data.info_clube || '',
          info_igreja: data.info_igreja || '',
          info_cidade: data.info_cidade,
          info_alergias: data.info_alergias || '',
          info_restricoes: data.info_restricoes || '',
          info_emergencia: data.info_emergencia,
          data_inscricao: dataInscricaoOriginal
        };
        
        fs.writeFileSync(fallbackDbPath, JSON.stringify(fileData, null, 2), 'utf8');
        callback(null, true);
      } catch (err) {
        callback(err);
      }
    } else {
      const query = `
        UPDATE inscricoes SET
          responsavel_nome = ?, responsavel_cpf = ?, responsavel_telefone = ?, responsavel_email = ?,
          participante_nome = ?, participante_nascimento = ?, participante_idade = ?, participante_sexo = ?,
          info_clube = ?, info_igreja = ?, info_cidade = ?, info_alergias = ?, info_restricoes = ?, info_emergencia = ?
        WHERE id = ?
      `;
      
      const params = [
        data.responsavel_nome, data.responsavel_cpf, data.responsavel_telefone, data.responsavel_email,
        data.participante_nome, data.participante_nascimento, parseInt(data.participante_idade), data.participante_sexo,
        data.info_clube, data.info_igreja, data.info_cidade, data.info_alergias, data.info_restricoes, data.info_emergencia,
        id
      ];

      this.sqliteDb.run(query, params, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null, this.changes > 0);
        }
      });
    }
  },

  // Deletar inscrição
  delete(id, callback) {
    if (this.isFallback) {
      try {
        let fileData = JSON.parse(fs.readFileSync(fallbackDbPath, 'utf8'));
        const originalLength = fileData.length;
        fileData = fileData.filter(i => i.id !== parseInt(id));
        
        if (fileData.length === originalLength) {
          return callback(null, false);
        }
        
        fs.writeFileSync(fallbackDbPath, JSON.stringify(fileData, null, 2), 'utf8');
        callback(null, true);
      } catch (err) {
        callback(err);
      }
    } else {
      this.sqliteDb.run('DELETE FROM inscricoes WHERE id = ?', [id], function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null, this.changes > 0);
        }
      });
    }
  }
};

// Inicializar banco de dados
db.init((err) => {
  if (err) {
    console.error('Falha crítica ao inicializar banco de dados:', err);
    process.exit(1);
  }
  console.log('Banco de dados inicializado com sucesso (modo ' + (db.isFallback ? 'JSON Fallback' : 'SQLite') + ').');
});

// --- ROTAS DA API ---

// 1. Obter estatísticas rápidas para o painel administrativo
app.get('/api/inscricoes/stats', (req, res) => {
  db.getAll((err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estatísticas do banco de dados.' });
    }
    
    const total = rows.length;
    const meninos = rows.filter(r => r.participante_sexo === 'M').length;
    const meninas = rows.filter(r => r.participante_sexo === 'F').length;
    
    // Contagem de cidades únicas
    const cidades = [...new Set(rows.map(r => r.info_cidade))].length;
    // Contagem de clubes únicos
    const clubes = [...new Set(rows.map(r => r.info_clube).filter(c => c && c.trim() !== ''))].length;

    res.json({
      total,
      meninos,
      meninas,
      cidades,
      clubes
    });
  });
});

// 2. Obter todas as inscrições (com suporte a busca e filtros simples)
app.get('/api/inscricoes', (req, res) => {
  const { search } = req.query;
  
  db.getAll((err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar inscrições.' });
    }
    
    let result = rows;
    
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      result = rows.filter(row => {
        return (
          row.participante_nome.toLowerCase().includes(q) ||
          row.responsavel_nome.toLowerCase().includes(q) ||
          (row.info_clube && row.info_clube.toLowerCase().includes(q)) ||
          row.info_cidade.toLowerCase().includes(q) ||
          (row.info_igreja && row.info_igreja.toLowerCase().includes(q))
        );
      });
    }
    
    res.json(result);
  });
});

// 3. Obter uma única inscrição
app.get('/api/inscricoes/:id', (req, res) => {
  const { id } = req.params;
  db.getById(id, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar inscrição.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Inscrição não encontrada.' });
    }
    res.json(row);
  });
});

// 4. Criar nova inscrição (com validação robusta de campos)
app.post('/api/inscricoes', (req, res) => {
  const data = req.body;
  
  // Validações básicas obrigatórias no servidor
  const camposObrigatorios = [
    'responsavel_nome', 'responsavel_cpf', 'responsavel_telefone', 'responsavel_email',
    'participante_nome', 'participante_nascimento', 'participante_idade', 'participante_sexo',
    'info_cidade', 'info_emergencia'
  ];
  
  for (const campo of camposObrigatorios) {
    if (!data[campo] || (typeof data[campo] === 'string' && data[campo].trim() === '')) {
      return res.status(400).json({ error: `O campo '${campo}' é obrigatório.` });
    }
  }
  
  // Validação adicional de idade
  const idade = parseInt(data.participante_idade);
  if (isNaN(idade) || idade < 0) {
    return res.status(400).json({ error: 'Idade inválida para o participante.' });
  }

  db.insert(data, (err, newId) => {
    if (err) {
      console.error('Erro ao salvar no banco:', err.message);
      return res.status(500).json({ error: 'Erro interno ao salvar inscrição.' });
    }
    res.status(201).json({ 
      success: true, 
      id: newId, 
      message: 'Inscrição realizada com sucesso!' 
    });
  });
});

// 5. Atualizar uma inscrição
app.put('/api/inscricoes/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;

  // Validações básicas
  const camposObrigatorios = [
    'responsavel_nome', 'responsavel_cpf', 'responsavel_telefone', 'responsavel_email',
    'participante_nome', 'participante_nascimento', 'participante_idade', 'participante_sexo',
    'info_cidade', 'info_emergencia'
  ];
  
  for (const campo of camposObrigatorios) {
    if (!data[campo] || (typeof data[campo] === 'string' && data[campo].trim() === '')) {
      return res.status(400).json({ error: `O campo '${campo}' é obrigatório para atualização.` });
    }
  }

  db.update(id, data, (err, updated) => {
    if (err) {
      console.error('Erro ao atualizar no banco:', err.message);
      return res.status(500).json({ error: 'Erro interno ao atualizar inscrição.' });
    }
    if (!updated) {
      return res.status(404).json({ error: 'Inscrição não encontrada ou nenhum campo alterado.' });
    }
    res.json({ success: true, message: 'Inscrição atualizada com sucesso!' });
  });
});

// 6. Deletar inscrição (com proteção por senha/token se necessário, mas para o protótipo direto no endpoint)
app.delete('/api/inscricoes/:id', (req, res) => {
  const { id } = req.params;
  
  db.delete(id, (err, deleted) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao deletar inscrição.' });
    }
    if (!deleted) {
      return res.status(404).json({ error: 'Inscrição não encontrada.' });
    }
    res.json({ success: true, message: 'Inscrição excluída com sucesso!' });
  });
});

// Rota raiz informativa
app.get('/', (req, res) => {
  res.send('API da Corrida Primavera Kids está online! Use os endpoints apropriados.');
});

// Inicialização do servidor Express
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/api/inscricoes para ver os dados`);
  console.log(`Modo de persistência: ${db.isFallback ? 'Fallback JSON' : 'SQLite Database'}`);
  console.log(`====================================================`);
});
