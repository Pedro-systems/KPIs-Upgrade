/**
 * Configuração do Pool de Conexões PostgreSQL com SSH Tunnel
 * Utiliza variáveis de ambiente do arquivo .env
 */

const { Pool } = require('pg');
const { Client: SSHClient } = require('ssh2');
const fs = require('fs');
const net = require('net');
require('dotenv').config();

// Variáveis globais para o pool e túnel
let pool = null;
let sshClient = null;
let server = null;
let localPort = null;

/**
 * Cria o túnel SSH e configura o pool de conexões
 */
const createSSHTunnel = () => {
  return new Promise((resolve, reject) => {
    // Se não usar SSH, conecta diretamente
    if (process.env.USE_SSH_TUNNEL !== 'true') {
      console.log('🔌 Conexão direta ao PostgreSQL (sem SSH tunnel)');
      pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      return resolve();
    }

    console.log('🔐 Iniciando conexão SSH tunnel...');

    sshClient = new SSHClient();

    // Configuração SSH
    const sshConfig = {
      host: process.env.SSH_HOST,
      port: parseInt(process.env.SSH_PORT) || 22,
      username: process.env.SSH_USER,
    };

    // Autenticação: chave privada ou senha
    if (process.env.SSH_PRIVATE_KEY_PATH) {
      try {
        sshConfig.privateKey = fs.readFileSync(process.env.SSH_PRIVATE_KEY_PATH);
        if (process.env.SSH_PASSPHRASE) {
          sshConfig.passphrase = process.env.SSH_PASSPHRASE;
        }
        console.log('🔑 Usando autenticação por chave privada');
      } catch (err) {
        console.error('❌ Erro ao ler chave privada:', err.message);
        return reject(err);
      }
    } else if (process.env.SSH_PASSWORD) {
      sshConfig.password = process.env.SSH_PASSWORD;
      console.log('🔑 Usando autenticação por senha');
    } else {
      return reject(new Error('Nenhum método de autenticação SSH configurado (chave ou senha)'));
    }

    sshClient.on('ready', () => {
      console.log('✅ Conexão SSH estabelecida');

      // Criar servidor local que faz forward para o PostgreSQL remoto
      server = net.createServer((localSocket) => {
        sshClient.forwardOut(
          '127.0.0.1', // bind address local
          0, // bind port local (0 = automático)
          process.env.DB_HOST_REMOTE || '127.0.0.1', // host do PostgreSQL na VPS
          parseInt(process.env.DB_PORT_REMOTE) || 5432, // porta do PostgreSQL na VPS
          (err, stream) => {
            if (err) {
              console.error('❌ Erro no forward:', err.message);
              localSocket.end();
              return;
            }
            // Pipe bidirecional entre o socket local e o stream SSH
            localSocket.pipe(stream);
            stream.pipe(localSocket);
          }
        );
      });

      // Escutar em uma porta local aleatória
      server.listen(0, '127.0.0.1', () => {
        localPort = server.address().port;
        console.log(`🚇 Túnel SSH estabelecido: localhost:${localPort} -> ${process.env.DB_HOST_REMOTE || '127.0.0.1'}:${process.env.DB_PORT_REMOTE || 5432}`);

        // Criar pool conectando à porta local do túnel
        pool = new Pool({
          host: '127.0.0.1',
          port: localPort,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000, // Timeout maior para túnel
        });

        resolve();
      });

      server.on('error', (err) => {
        console.error('❌ Erro no servidor local do túnel:', err.message);
        reject(err);
      });
    });

    sshClient.on('error', (err) => {
      console.error('❌ Erro na conexão SSH:', err.message);
      reject(err);
    });

    sshClient.on('close', () => {
      console.log('⚠️ Conexão SSH fechada');
    });

    // Conectar SSH
    sshClient.connect(sshConfig);
  });
};

/**
 * Encerra o túnel SSH e o pool de conexões
 */
const closeTunnel = async () => {
  if (pool) {
    await pool.end();
    console.log('✅ Pool de conexões PostgreSQL encerrado');
  }
  if (server) {
    server.close();
    console.log('✅ Servidor local do túnel encerrado');
  }
  if (sshClient) {
    sshClient.end();
    console.log('✅ Conexão SSH encerrada');
  }
};

// Evento para monitorar erros no pool
const setupPoolEvents = () => {
  if (pool) {
    pool.on('error', (err, client) => {
      console.error('❌ Erro inesperado no cliente do pool:', err);
    });
  }
};

/**
 * Testa a conexão com o banco
 */
const testConnection = async () => {
  try {
    // Primeiro criar o túnel se necessário
    await createSSHTunnel();
    setupPoolEvents();

    // Testar conexão
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, current_database() as database');
    console.log(`✅ Conexão com PostgreSQL estabelecida com sucesso!`);
    console.log(`   📊 Banco: ${result.rows[0].database}`);
    console.log(`   🕐 Hora do servidor: ${result.rows[0].time}`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com PostgreSQL:', error.message);
    return false;
  }
};

/**
 * Executa queries com prepared statements
 */
const query = async (text, params) => {
  if (!pool) {
    throw new Error('Pool de conexões não inicializado. Execute testConnection() primeiro.');
  }
  
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Query executada:', { 
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
        duration: `${duration}ms`, 
        rows: result.rowCount 
      });
    }
    return result;
  } catch (error) {
    console.error('Erro na query:', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
};

/**
 * Obtém um cliente do pool (para transações)
 */
const getClient = async () => {
  if (!pool) {
    throw new Error('Pool de conexões não inicializado.');
  }
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = () => {
    client.release();
  };
  return { client, query: originalQuery, release };
};

/**
 * Retorna o pool atual
 */
const getPool = () => pool;

/**
 * Executa o arquivo de migração de views SQL
 * Uso: node -e "require('./config/db').runViewMigration()"
 */
const runViewMigration = async () => {
  try {
    console.log('🔄 Iniciando migração de views SQL...');
    
    // Conectar ao banco
    await createSSHTunnel();
    setupPoolEvents();
    
    // Ler arquivo SQL
    const path = require('path');
    const sqlPath = path.join(__dirname, '../sql/views.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Dividir por CREATE OR REPLACE VIEW e executar cada bloco
    const statements = sql
      .split(/(?=CREATE OR REPLACE VIEW)/i)
      .filter(s => s.trim() && !s.trim().startsWith('/**') && !s.trim().startsWith('--'));
    
    console.log(`📄 Encontrados ${statements.length} views para criar/atualizar`);
    
    for (const stmt of statements) {
      try {
        await pool.query(stmt);
        const nameMatch = stmt.match(/VIEW\s+(\S+)/i);
        const viewName = nameMatch ? nameMatch[1] : 'unknown';
        console.log(`✅ View criada/atualizada: ${viewName}`);
      } catch (err) {
        console.error(`❌ Erro ao criar view:`, err.message);
        console.error(`   Statement:`, stmt.substring(0, 100) + '...');
      }
    }
    
    console.log('✅ Migração de views concluída com sucesso!');
    await closeTunnel();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração de views:', error.message);
    await closeTunnel();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando aplicação...');
  await closeTunnel();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando aplicação...');
  await closeTunnel();
  process.exit(0);
});

module.exports = {
  query,
  getClient,
  getPool,
  testConnection,
  closeTunnel,
  createSSHTunnel,
  runViewMigration,
};
