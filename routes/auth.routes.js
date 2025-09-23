const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth.middleware');
const optionalAuthMiddleware = require('../middleware/optionalAuth.middleware');

const prisma = new PrismaClient();

router.get('/login', (req, res) => {
  const returnTo = req.query.returnTo || '/';
  res.render('auth/login', { returnTo });
});

// Rota para verificar se o usuário está logado (mantida para compatibilidade)
router.get('/check', (req, res) => {
  const token = req.cookies && req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ loggedIn: false });
  }
  
  try {
    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const decoded = jwt.verify(token, jwtSecret);
    res.json({ loggedIn: true, userId: decoded.userId });
  } catch (err) {
    res.status(401).json({ loggedIn: false });
  }
});

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validação básica
    if (!name || !email || !password) {
      return res.render('auth/register', { error: 'Todos os campos são obrigatórios' });
    }
    
    if (password.length < 6) {
      return res.render('auth/register', { error: 'A senha deve ter pelo menos 6 caracteres' });
    }
    
    // Verificar se email já existe (com fallback para banco indisponível)
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      });
    } catch (dbError) {
      console.warn("⚠️ Banco de dados indisponível para verificação de email:", dbError.message);
      return res.render('auth/register', { error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.' });
    }
    
    if (existingUser) {
      return res.render('auth/register', { error: 'Este email já está cadastrado' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      });
    } catch (dbError) {
      console.error("❌ Erro ao criar usuário:", dbError.message);
      return res.render('auth/register', { error: 'Erro ao criar conta. Tente novamente mais tarde.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.redirect('/');
  } catch (error) {
    console.error('Erro no registro:', error);
    
    // Mensagens de erro mais específicas
    if (error.code === 'P2002') {
      return res.render('auth/register', { error: 'Este email já está cadastrado' });
    }
    
    if (error.message && error.message.includes('Invalid email')) {
      return res.render('auth/register', { error: 'Email inválido' });
    }
    
    res.render('auth/register', { error: 'Erro interno do servidor. Tente novamente.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, returnTo } = req.body;
    
    // Validação básica
    if (!email || !password) {
      return res.render('auth/login', { error: 'Email e senha são obrigatórios', returnTo });
    }
    
    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render('auth/login', { error: 'Formato de email inválido', returnTo });
    }
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email }
      });
    } catch (dbError) {
      console.warn("⚠️ Banco de dados indisponível para login:", dbError.message);
      return res.render('auth/login', { error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.', returnTo });
    }

    if (!user) {
      return res.render('auth/login', { error: 'Email não encontrado. Verifique se digitou corretamente.', returnTo });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.render('auth/login', { error: 'Senha incorreta. Tente novamente.', returnTo });
    }

    const jwtSecret = process.env.JWT_SECRET || 'transcriptus_secret_key_2024_development';
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // Redireciona para a página de origem ou para a home
    const redirectUrl = returnTo && returnTo !== '/' ? returnTo : '/';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Erro no login:', error);
    res.render('auth/login', { error: 'Erro interno do servidor. Tente novamente.', returnTo: req.body.returnTo });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.redirect('/login');
});

// Rota do perfil (requer autenticação)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Busca dados atualizados do usuário (com fallback para banco indisponível)
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, name: true, email: true, createdAt: true }
      });
    } catch (dbError) {
      console.warn("⚠️ Banco de dados indisponível para perfil:", dbError.message);
      return res.render('profile', { 
        user: { 
          id: req.userId, 
          name: 'Usuário', 
          email: 'email@exemplo.com', 
          createdAt: new Date() 
        },
        error: 'Dados do perfil temporariamente indisponíveis'
      });
    }
    
    if (!user) {
      req.flash('error', 'Usuário não encontrado');
      return res.redirect('/login');
    }
    
    res.render('profile', { user });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    req.flash('error', 'Erro ao carregar perfil');
    res.redirect('/');
  }
});

module.exports = router; 