// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const { PrismaClient } = require("@prisma/client");

// Configuração do Prisma com tratamento de erro de conexão
let prisma;
try {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
  
  // Testa a conexão
  prisma.$connect().then(() => {
    console.log('✅ Conexão com banco de dados estabelecida');
  }).catch((error) => {
    console.warn('⚠️ Aviso: Banco de dados não disponível:', error.message);
    console.log('📝 Aplicação continuará funcionando sem persistência de dados');
  });
} catch (error) {
  console.error('❌ Erro ao inicializar Prisma:', error.message);
  // Cria um mock do Prisma para evitar erros
  prisma = {
    user: {
      findUnique: () => Promise.resolve(null),
      create: () => Promise.resolve({}),
    },
    search: {
      create: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    },
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
  };
}

const geminiRoutes = require('./routes/gemini.routes');
const routerSave = require("./routes/wordDetails.routes");
const routerTranslator = require("./routes/translator.routes");
const routerApp = require("./routes/app.routes");
const routeContext = require("./routes/context.routes");
const authRoutes = require("./routes/auth.routes");
const historyRoutes = require("./routes/history.routes");

const port = process.env.PORT || 3000;

// Session and Flash messages
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'transcriptus_session_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(flash());

// define view engine to ejs and bodyParser
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// define path of static files and routes
app.use(express.static("public"));

app.use(async (req, res, next) => {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    res.locals.user = null;
    return next();
  }
  try {
    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const decoded = jwt.verify(token, jwtSecret);
    
    // Tenta buscar o usuário, mas não falha se o banco estiver indisponível
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true },
      });
      res.locals.user = user || null;
    } catch (dbError) {
      console.warn('⚠️ Banco indisponível para autenticação, usando dados do token');
      // Usa dados básicos do token se o banco estiver indisponível
      res.locals.user = { 
        id: decoded.userId, 
        name: 'Usuário', 
        email: 'user@example.com' 
      };
    }
  } catch (err) {
    console.warn('⚠️ Token inválido:', err.message);
    res.locals.user = null;
  }
  next();
});

app.use("/", routerApp);
app.use(routerSave, routerTranslator, routeContext);
app.use("/", authRoutes);
app.use("/", historyRoutes);
app.use('/api/gemini', geminiRoutes);

app.listen(port, (err) => {
  if (err) console.log(err);
  console.log("Server listening on PORT", port);
  console.log("http://localhost:3000");
});
