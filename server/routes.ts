import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClassSchema, insertClassFormSchema, insertTeamSchema, insertRoundSchema, insertMarketEventSchema, insertMarketingMixSchema, updateTeamIdentitySchema, updateTeamLogoSchema, updateTeamLeaderSchema, updateClassMarketSchema, updateTeamBudgetSchema, insertSwotSchema, insertPorterSchema, insertBcgSchema, insertPestelSchema } from "@shared/schema";
import session from "express-session";
import bcrypt from "bcryptjs";
import createMemoryStore from "memorystore";
import { calculateResults, calculateMarketingSpend, applyStrategicImpacts, applyAlignmentPenalties } from "./calculator";
import { consolidateKpis, type ResultCoreMetrics } from "./utils/consolidateKpis";
import { marketSectors, targetAudiences, businessTypes, competitionLevels } from "./data/marketData";
import { z } from "zod";
import { generateMarketEvents, type EventGenerationParams } from "./services/aiEventGenerator";
import { emailService } from "./services/email";
import { sendTeamEmail } from "./email-service";
import { randomUUID } from "crypto";
import { getAlignmentScoreLevel } from "@shared/alignmentUtils";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getEnv, getAuthorizedProfessorEmails } from "./config";

const MemoryStore = createMemoryStore(session);

// Função para gerar código de recuperação no formato R7K9-2LQ8-ZX1A
function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem I, O, 0, 1 para evitar confusão
  const generateBlock = () => {
    let block = '';
    for (let i = 0; i < 4; i++) {
      block += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return block;
  };
  return `${generateBlock()}-${generateBlock()}-${generateBlock()}`;
}

// Percentual de impacto no orçamento por produto adicional/removido entre rodadas.
const PRODUCT_COUNT_BUDGET_IMPACT = 0.10;

// Quando a quantidade de produtos da turma muda de uma rodada para outra,
// ajusta o orçamento de todas as equipes da turma: -10% por produto adicional
// (e o inverso, proporcional, caso a quantidade diminua).
async function applyProductCountBudgetAdjustment(
  classId: string,
  previousProductCount: number,
  newProductCount: number
): Promise<void> {
  if (previousProductCount === newProductCount) return;

  const delta = newProductCount - previousProductCount;
  const multiplier = delta > 0
    ? 1 - PRODUCT_COUNT_BUDGET_IMPACT * delta
    : 1 / (1 - PRODUCT_COUNT_BUDGET_IMPACT * Math.abs(delta));

  const classTeams = await storage.getTeamsByClass(classId);
  for (const team of classTeams) {
    const adjustedBudget = Math.max(0, Math.round(team.budget * multiplier));
    await storage.updateTeam(team.id, { budget: adjustedBudget });
  }
}

// Determina a quantidade de produtos válida para uma nova rodada da turma:
// usa o valor pedido pelo professor (limitado entre 1 e o total de produtos
// do setor), ou repete a quantidade da rodada anterior caso nada seja informado.
async function resolveRoundProductCount(
  classId: string,
  sector: string | null,
  requestedProductCount: unknown
): Promise<{ productCount: number; previousProductCount: number }> {
  const classRounds = await storage.getRoundsByClass(classId);
  const previousRound = classRounds.sort((a, b) => b.roundNumber - a.roundNumber)[0];
  const previousProductCount = previousRound?.productCount ?? 1;

  const sectorProducts = sector ? await storage.getProductsBySector(sector) : [];
  const maxProducts = sectorProducts.length > 0 ? sectorProducts.length : 1;

  let productCount = typeof requestedProductCount === "number" && Number.isFinite(requestedProductCount)
    ? Math.round(requestedProductCount)
    : previousProductCount;

  productCount = Math.min(Math.max(productCount, 1), maxProducts);

  return { productCount, previousProductCount };
}

const appEnv = getEnv();
const defaultProfessorEmails = ['guandalini@gmail.com', 'alexandre.bossa@iffarroupilha.edu.br'];
const configuredEmails = getAuthorizedProfessorEmails(appEnv);
const authorizedProfessorEmails = new Set<string>(
  (configuredEmails.length > 0 ? configuredEmails : defaultProfessorEmails)
    .map(e => e.trim().toLowerCase())
);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const isProduction = appEnv.NODE_ENV === 'production';
  
  app.use(
    session({
      name: "simulamarketing.sid",
      secret: appEnv.SESSION_SECRET || "marketing-sim-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000,
      }),
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
        sameSite: isProduction ? 'none' : 'lax',
      },
    })
  );

  // Configuração do multer para upload de logomarcas
  const logosDir = path.join(process.cwd(), 'attached_assets', 'logos');
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
  }

  const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, logosDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'logo-' + uniqueSuffix + ext);
    }
  });

  const uploadLogo = multer({
    storage: logoStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas (JPG, PNG, GIF, WEBP, SVG)'));
      }
    }
  });

  // Servir arquivos estáticos da pasta de logos
  app.use('/attached_assets/logos', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });
  app.use('/attached_assets/logos', express.static(logosDir));

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const emailNormalized = data.email.trim().toLowerCase();
      
      if (data.role === "professor") {
        return res.status(403).json({ error: "Apenas alunos podem se cadastrar. Professores devem entrar em contato com o administrador." });
      }
      
      const existing = await storage.getUserByEmail(emailNormalized);
      if (existing) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Verifica se é email institucional (case-insensitive)
      const isInstitutionalEmail = 
        emailNormalized.endsWith("@iffarroupilha.edu.br") || 
        emailNormalized.endsWith("@aluno.iffar.edu.br") ||
        emailNormalized.endsWith("@aluno.iffarroupilha.edu.br");
      const status = isInstitutionalEmail ? "approved" : "pending";

      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // Gera código de recuperação para alunos
      const recoveryCode = generateRecoveryCode();
      const recoveryCodeHash = await bcrypt.hash(recoveryCode, 10);
      
      const user = await storage.createUser({ 
        ...data, 
        email: emailNormalized,
        password: hashedPassword, 
        role: "equipe",
        status,
        recoveryCodeHash
      });

      if (status === "pending") {
        await emailService.sendUserPendingEmail(user.email, user.name);
        await emailService.sendProfessorNewPendingUserEmail(user.name, user.email);
        
        return res.json({ 
          status: "pending",
          message: "Cadastro realizado! Como você usou um email não-institucional, aguarde a aprovação do professor. Você receberá um email quando for aprovado.",
          recoveryCode // Retorna o código para o aluno anotar
        });
      }

      req.session.userId = user.id;
      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        status: user.status,
        recoveryCode // Retorna o código para o aluno anotar
      });
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const emailNormalized = String(email || "").trim().toLowerCase();
      
      const user = await storage.getUserByEmail(emailNormalized);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      if (user.role === "professor" && !authorizedProfessorEmails.has(emailNormalized)) {
        return res.status(403).json({ error: "Professor não autorizado. Entre em contato com o administrador." });
      }
      
      let isValidLogin = false;
      let usingTemporaryPassword = false;

      // Verifica primeiro se existe senha temporária válida
      if (user.temporaryPassword && user.temporaryPasswordExpiry) {
        const now = new Date();
        if (now <= user.temporaryPasswordExpiry) {
          // Senha temporária ainda não expirou, verifica se é a senha fornecida
          const validTempPassword = await bcrypt.compare(password, user.temporaryPassword);
          if (validTempPassword) {
            isValidLogin = true;
            usingTemporaryPassword = true;
          }
        } else {
          // Senha temporária expirou, limpa do banco
          await storage.clearTemporaryPassword(user.id);
        }
      }

      // Se não logou com senha temporária, tenta senha normal
      if (!isValidLogin) {
        const validPassword = await bcrypt.compare(password, user.password);
        if (validPassword) {
          isValidLogin = true;
        }
      }

      if (!isValidLogin) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      req.session.userId = user.id;
      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        status: user.status,
        mustChangePassword: usingTemporaryPassword || user.mustChangePassword
      });
    } catch (error) {
      res.status(400).json({ error: "Erro no login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Por segurança, retorna sucesso mesmo se usuário não existir
        return res.json({ 
          success: true, 
          message: "✅ Se o email estiver cadastrado, você receberá um link de recuperação em instantes. Verifique sua caixa de entrada e spam.",
          userExists: false
        });
      }

      const resetToken = randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      
      const emailSent = await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
      
      if (!emailSent) {
        console.log(`🔗 [DEV] Link de recuperação: ${process.env.REPLIT_DEV_DOMAIN || "http://localhost:5000"}/reset-password?token=${resetToken}`);
      }
      
      res.json({ 
        success: true, 
        message: "✅ Email de recuperação enviado! Verifique sua caixa de entrada e também a pasta de spam. O link expira em 1 hora.",
        userExists: true,
        // Em desenvolvimento, retorna o token para facilitar testes
        ...(process.env.NODE_ENV !== 'production' && { resetToken, resetUrl: `/reset-password?token=${resetToken}` })
      });
    } catch (error) {
      console.error("Erro em forgot-password:", error);
      res.status(500).json({ error: "Erro ao processar solicitação de recuperação de senha" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
      }

      const resetToken = await storage.getPasswordResetTokenByToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Token inválido ou expirado" });
      }

      if (new Date() > resetToken.expiresAt) {
        await storage.deletePasswordResetToken(token);
        return res.status(400).json({ error: "Token expirado" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.deletePasswordResetToken(token);
      
      res.json({ success: true, message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Erro em reset-password:", error);
      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  });

  // Endpoint para recuperação de senha usando código de recuperação (sem email)
  app.post("/api/auth/recover-with-code", async (req, res) => {
    try {
      const { email, recoveryCode, newPassword } = req.body;
      
      if (!email || !recoveryCode || !newPassword) {
        return res.status(400).json({ error: "Email, código de recuperação e nova senha são obrigatórios" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(400).json({ error: "Email ou código de recuperação inválido" });
      }

      // Verifica se o usuário é aluno (equipe)
      if (user.role !== "equipe") {
        return res.status(400).json({ error: "Recuperação por código disponível apenas para alunos" });
      }

      // Verifica se o usuário tem código de recuperação
      if (!user.recoveryCodeHash) {
        return res.status(400).json({ error: "Este usuário não possui código de recuperação configurado" });
      }

      // Normaliza o código (remove espaços, converte para maiúsculas)
      const normalizedCode = recoveryCode.trim().toUpperCase();

      // Valida o código de recuperação
      const isValidCode = await bcrypt.compare(normalizedCode, user.recoveryCodeHash);
      
      if (!isValidCode) {
        return res.status(400).json({ error: "Email ou código de recuperação inválido" });
      }

      // Atualiza a senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ success: true, message: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Erro em recover-with-code:", error);
      res.status(500).json({ error: "Erro ao redefinir senha" });
    }
  });

  app.post("/api/auth/change-password", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A nova senha deve ter no mínimo 6 caracteres" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro em change-password:", error);
      res.status(500).json({ error: "Erro ao alterar senha" });
    }
  });

  app.post("/api/auth/change-temporary-password", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ error: "Nova senha é obrigatória" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (!user.mustChangePassword) {
        return res.status(400).json({ error: "Você não precisa trocar a senha" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updatePasswordAndClearTemporary(user.id, hashedPassword);
      
      res.json({ success: true, message: "Senha definida com sucesso! Faça login novamente." });
    } catch (error) {
      console.error("Erro em change-temporary-password:", error);
      res.status(500).json({ error: "Erro ao definir nova senha" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, status: user.status });
  });

  app.post("/api/admin/create-professor", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || currentUser.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    if (!authorizedProfessorEmails.has(currentUser.email.trim().toLowerCase())) {
      return res.status(403).json({ error: "Apenas professores autorizados podem criar novos professores" });
    }
    
    try {
      const { email, name, password } = req.body;
      
      if (!email || !name || !password) {
        return res.status(400).json({ error: "Email, nome e senha são obrigatórios" });
      }
      
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const newProfessor = await storage.createUser({
        email,
        name,
        password: hashedPassword,
        role: "professor",
        status: "approved"
      });
      
      res.json({
        success: true,
        message: "Professor criado com sucesso",
        professor: {
          id: newProfessor.id,
          email: newProfessor.email,
          name: newProfessor.name,
          role: newProfessor.role
        }
      });
    } catch (error) {
      console.error("Erro ao criar professor:", error);
      res.status(500).json({ error: "Erro ao criar professor" });
    }
  });

  app.get("/api/admin/authorized-professors", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || currentUser.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    res.json({
      authorizedEmails: Array.from(authorizedProfessorEmails),
      isAuthorized: authorizedProfessorEmails.has(currentUser.email.trim().toLowerCase())
    });
  });

  app.get("/api/manual/professor", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado. Apenas professores podem acessar este recurso." });
    }
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const manualPath = path.join(process.cwd(), 'server', 'manual-professor.md');
      const manualContent = await fs.readFile(manualPath, 'utf-8');
      
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Manual_Professor_Simula.md"');
      res.send(manualContent);
    } catch (error) {
      console.error("Erro ao servir manual do professor:", error);
      res.status(500).json({ error: "Erro ao carregar manual" });
    }
  });

  app.get("/api/manual/aluno/pdf", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    try {
      const { generateManualAlunoPDF } = await import('./services/manualAlunoPDF');
      const pdfStream = generateManualAlunoPDF();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Manual_Aluno_Simula_v1.0.pdf"');
      
      pdfStream.pipe(res);
    } catch (error) {
      console.error("Erro ao gerar PDF do manual do aluno:", error);
      res.status(500).json({ error: "Erro ao gerar manual em PDF" });
    }
  });

  app.get("/api/guia-midias/pdf", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    try {
      const path = await import('path');
      const fs = await import('fs');
      
      const pdfPath = path.join(process.cwd(), 'attached_assets', 'GUIA DE MIDIA SIMULA+_1763564911908.pdf');
      
      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ error: "PDF do Guia de Mídias não encontrado" });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Guia_Midias_Simula.pdf"');
      
      const fileStream = fs.createReadStream(pdfPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Erro ao servir PDF do guia de mídias:", error);
      res.status(500).json({ error: "Erro ao carregar guia de mídias" });
    }
  });

  app.get("/api/classes", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    if (user.role === "professor") {
      const classes = await storage.getClassesByProfessor(user.id);
      res.json(classes);
    } else {
      const team = await storage.getTeamByUser(user.id);
      if (!team) {
        return res.json([]);
      }
      const classData = await storage.getClass(team.classId);
      res.json(classData ? [classData] : []);
    }
  });

  app.post("/api/classes", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    console.log("[POST /api/classes] User:", user ? { id: user.id, role: user.role, status: user.status } : null);
    if (!user || user.role !== "professor") {
      console.log("[POST /api/classes] Access denied - user role check failed");
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    try {
      const data = insertClassFormSchema.parse({ ...req.body, professorId: user.id });
      const newClass = await storage.createClass(data);
      res.json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Erro de validação ao criar turma:", error.errors);
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
        });
      }
      console.error("Erro ao criar turma:", error);
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.get("/api/classes/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    const classData = await storage.getClass(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (user.role === "professor") {
      if (classData.professorId !== user.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }
    } else {
      const team = await storage.getTeamByUser(user.id);
      if (!team || team.classId !== req.params.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }
    }
    
    res.json(classData);
  });

  app.delete("/api/classes/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const classData = await storage.getClass(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para excluir esta turma" });
    }
    
    const deleted = await storage.deleteClass(req.params.id);
    if (deleted) {
      res.json({ message: "Turma excluída com sucesso" });
    } else {
      res.status(500).json({ error: "Erro ao excluir turma" });
    }
  });

  app.get("/api/classes/:classId/students", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para acessar esta turma" });
    }
    
    const students = await storage.getStudentsByClass(req.params.classId);
    res.json(students);
  });

  app.post("/api/classes/:classId/students", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para gerenciar esta turma" });
    }
    
    try {
      const { studentId } = req.body;
      if (!studentId) {
        return res.status(400).json({ error: "ID do aluno é obrigatório" });
      }
      
      await storage.addStudentToClass(req.params.classId, studentId);
      res.json({ message: "Aluno matriculado com sucesso" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Erro ao matricular aluno" });
    }
  });

  app.delete("/api/classes/:classId/students/:studentId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para gerenciar esta turma" });
    }
    
    try {
      await storage.removeStudentFromClass(req.params.classId, req.params.studentId);
      res.json({ message: "Aluno removido da turma com sucesso" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Erro ao remover aluno" });
    }
  });

  app.get("/api/professor/students/all", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    try {
      const professorClasses = await storage.getClassesByProfessor(req.session.userId);
      const allStudentsWithClasses = [];
      
      for (const classData of professorClasses) {
        const students = await storage.getStudentsByClass(classData.id);
        for (const student of students) {
          allStudentsWithClasses.push({
            ...student,
            className: classData.name,
            classId: classData.id,
          });
        }
      }
      
      res.json(allStudentsWithClasses);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao buscar alunos" });
    }
  });

  // Endpoint para professor cadastrar aluno diretamente
  app.post("/api/professor/students", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Apenas professores podem cadastrar alunos" });
    }
    
    try {
      const { name, email, password, classId } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Nome, email e senha são obrigatórios" });
      }
      
      // Verificar se o email já existe
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Este email já está cadastrado no sistema" });
      }
      
      // Se classId foi fornecido, verificar se a turma existe e pertence ao professor
      if (classId) {
        const classData = await storage.getClass(classId);
        if (!classData) {
          return res.status(404).json({ error: "Turma não encontrada" });
        }
        if (classData.professorId !== user.id) {
          return res.status(403).json({ error: "Você não tem permissão para adicionar alunos a esta turma" });
        }
      }
      
      // Criar o aluno com status aprovado
      const hashedPassword = await bcrypt.hash(password, 10);
      const newStudent = await storage.createUser({
        name,
        email,
        password: hashedPassword,
        role: "equipe",
        status: "approved"
      });
      
      // Se classId foi fornecido, matricular o aluno na turma
      if (classId) {
        await storage.addStudentToClass(classId, newStudent.id);
      }
      
      res.json({
        success: true,
        message: classId 
          ? "Aluno cadastrado e matriculado com sucesso!" 
          : "Aluno cadastrado com sucesso!",
        student: {
          id: newStudent.id,
          name: newStudent.name,
          email: newStudent.email,
          role: newStudent.role,
          status: newStudent.status
        }
      });
    } catch (error: any) {
      console.error("Erro ao cadastrar aluno:", error);
      res.status(500).json({ error: error.message || "Erro ao cadastrar aluno" });
    }
  });

  app.get("/api/student/class", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    const studentClass = await storage.getClassByStudent(req.session.userId);
    if (!studentClass) {
      return res.json(null);
    }
    
    res.json(studentClass);
  });

  app.get("/api/classes/:classId/teams", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const teams = await storage.getTeamsByClass(req.params.classId);
    res.json(teams);
  });

  app.post("/api/classes/:classId/teams", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    try {
      const data = insertTeamSchema.parse({
        ...req.body,
        classId: req.params.classId,
      });
      
      const classData = await storage.getClass(data.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }
      
      const team = await storage.createTeam({
        name: data.name,
        classId: data.classId,
        memberIds: [req.session.userId],
        leaderId: req.session.userId,
        initialBudget: classData.defaultBudget,
        budget: classData.defaultBudget,
        companyName: null,
        slogan: null,
        logoUrl: null,
        productCategory: null,
        targetAudienceClass: null,
        targetAudienceAge: null,
        targetAudienceProfile: null,
      });
      res.json(team);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Apenas professores podem excluir equipes" });
    }
    
    const team = await storage.getTeam(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    const classData = await storage.getClass(team.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para excluir equipes desta turma" });
    }
    
    const deleted = await storage.deleteTeam(req.params.id);
    if (deleted) {
      res.json({ message: "Equipe excluída com sucesso" });
    } else {
      res.status(500).json({ error: "Erro ao excluir equipe" });
    }
  });

  app.patch("/api/teams/:id/budget", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Apenas professores podem ajustar orçamentos" });
    }
    
    const team = await storage.getTeam(req.params.id);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    const classData = await storage.getClass(team.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para ajustar orçamentos desta turma" });
    }
    
    try {
      const data = updateTeamBudgetSchema.parse(req.body);
      const updated = await storage.updateTeam(req.params.id, { budget: data.budget });
      if (updated) {
        res.json(updated);
      } else {
        res.status(500).json({ error: "Erro ao atualizar orçamento" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      res.status(400).json({ error: "Erro ao atualizar orçamento" });
    }
  });

  app.get("/api/rounds", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const team = await storage.getTeamByUser(user.id);
    if (!team) {
      return res.json([]);
    }
    const rounds = await storage.getRoundsByClass(team.classId);
    res.json(rounds);
  });

  app.get("/api/rounds/:classId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    if (user.role === "professor") {
      const classData = await storage.getClass(req.params.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }
      if (classData.professorId !== user.id) {
        return res.status(403).json({ error: "Você não tem permissão para acessar esta turma" });
      }
    } else {
      const team = await storage.getTeamByUser(user.id);
      if (!team || team.classId !== req.params.classId) {
        return res.status(403).json({ error: "Você não tem permissão para acessar esta turma" });
      }
    }

    const rounds = await storage.getRoundsByClass(req.params.classId);
    res.json(rounds);
  });

  app.post("/api/rounds/:classId/start", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    const currentActive = await storage.getCurrentRound(req.params.classId);
    if (currentActive) {
      return res.status(400).json({ error: "Já existe uma rodada ativa" });
    }

    const nextRoundNumber = classData.currentRound + 1;
    if (nextRoundNumber > classData.maxRounds) {
      return res.status(400).json({ error: "Número máximo de rodadas atingido" });
    }

    const { productCount, previousProductCount } = await resolveRoundProductCount(
      req.params.classId,
      classData.sector ?? null,
      req.body?.productCount
    );

    const round = await storage.createRound({
      classId: req.params.classId,
      roundNumber: nextRoundNumber,
      status: "active",
      productCount,
    });

    await storage.updateRound(round.id, { startedAt: new Date() });
    await storage.updateClass(req.params.classId, { currentRound: nextRoundNumber });
    await applyProductCountBudgetAdjustment(req.params.classId, previousProductCount, productCount);

    // Gerar análises estratégicas mínimas automaticamente para todas as equipes
    // APENAS nas primeiras 3 rodadas (conforme regras do sistema)
    // Executa em background (assíncrono) para não bloquear resposta
    if (nextRoundNumber <= 3) {
      (async () => {
        try {
          console.log(`[ROUND-START] Iniciando geração automática de análises mínimas para rodada ${round.roundNumber} (rodada <= 3)`);
          const { autoGenerateMinimalAnalysesForAllTeams } = await import("./services/autoStrategicGeneration");
          const result = await autoGenerateMinimalAnalysesForAllTeams(storage, round.id);
          
          if (result.success) {
            console.log(`[ROUND-START] ✓ Análises mínimas geradas: ${result.successCount}/${result.totalTeams} equipes`);
          } else {
            console.warn(`[ROUND-START] ⚠ Falha na geração automática de análises mínimas`);
          }
        } catch (error: any) {
          console.error("[ROUND-START] Erro na geração automática de análises:", error);
          // Não falha a criação da rodada - apenas loga o erro
        }
      })();
    } else {
      console.log(`[ROUND-START] Rodada ${nextRoundNumber}: sem geração automática (rodada > 3)`);
    }

    res.json(round);
  });

  app.post("/api/classes/:classId/rounds", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    const currentActive = await storage.getCurrentRound(req.params.classId);
    if (currentActive) {
      return res.status(400).json({ error: "Já existe uma rodada ativa" });
    }

    const nextRoundNumber = classData.currentRound + 1;
    if (nextRoundNumber > classData.maxRounds) {
      return res.status(400).json({ error: "Número máximo de rodadas atingido" });
    }

    const { productCount, previousProductCount } = await resolveRoundProductCount(
      req.params.classId,
      classData.sector ?? null,
      req.body?.productCount
    );

    const round = await storage.createRound({
      classId: req.params.classId,
      roundNumber: nextRoundNumber,
      status: "active",
      productCount,
    });

    await storage.updateRound(round.id, { startedAt: new Date() });
    await storage.updateClass(req.params.classId, { currentRound: nextRoundNumber });
    await applyProductCountBudgetAdjustment(req.params.classId, previousProductCount, productCount);

    // Gerar análises estratégicas mínimas automaticamente para todas as equipes
    // APENAS nas primeiras 3 rodadas (conforme regras do sistema)
    // Executa em background (assíncrono) para não bloquear resposta
    if (nextRoundNumber <= 3) {
      (async () => {
        try {
          console.log(`[ROUND-CREATE] Iniciando geração automática de análises mínimas para rodada ${round.roundNumber} (rodada <= 3)`);
          const { autoGenerateMinimalAnalysesForAllTeams } = await import("./services/autoStrategicGeneration");
          const result = await autoGenerateMinimalAnalysesForAllTeams(storage, round.id);
          
          if (result.success) {
            console.log(`[ROUND-CREATE] ✓ Análises mínimas geradas: ${result.successCount}/${result.totalTeams} equipes`);
          } else {
            console.warn(`[ROUND-CREATE] ⚠ Falha na geração automática de análises mínimas`);
          }
        } catch (error: any) {
          console.error("[ROUND-CREATE] Erro na geração automática de análises:", error);
          // Não falha a criação da rodada - apenas loga o erro
        }
      })();
    } else {
      console.log(`[ROUND-CREATE] Rodada ${nextRoundNumber}: sem geração automática (rodada > 3)`);
    }

    res.json(round);
  });

  app.post("/api/rounds/:roundId/end", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    try {
      const { processRoundCompletion } = await import("./services/roundCompletion");
      const result = await processRoundCompletion(storage, req.params.roundId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Erro ao processar encerramento" });
      }

      const updated = await storage.getRound(req.params.roundId);
      res.json(updated);
    } catch (error: any) {
      console.error("[ROUND_END] Erro ao encerrar rodada:", error);
      res.status(500).json({ error: error.message || "Erro ao encerrar rodada" });
    }
  });

  // Adicionar nova rodada (incrementar maxRounds e criar rodada locked)
  app.post("/api/classes/:classId/rounds/add", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Get all existing rounds
    const existingRounds = await storage.getRoundsByClass(req.params.classId);
    const newRoundNumber = existingRounds.length + 1;
    
    // Create new locked round
    const round = await storage.createRound({
      classId: req.params.classId,
      roundNumber: newRoundNumber,
      status: "locked",
    });

    // Update maxRounds if needed
    if (newRoundNumber > classData.maxRounds) {
      await storage.updateClass(req.params.classId, { maxRounds: newRoundNumber });
    }

    res.json({ 
      success: true, 
      round, 
      message: `Rodada ${newRoundNumber} adicionada com sucesso`,
      newMaxRounds: Math.max(classData.maxRounds, newRoundNumber)
    });
  });

  // Remover última rodada (somente se locked e sem dados)
  app.delete("/api/classes/:classId/rounds/:roundNumber", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    const roundNumber = parseInt(req.params.roundNumber);
    if (isNaN(roundNumber)) {
      return res.status(400).json({ error: "Número de rodada inválido" });
    }

    // Get all rounds and find the one to delete
    const allRounds = await storage.getRoundsByClass(req.params.classId);
    const roundToDelete = allRounds.find(r => r.roundNumber === roundNumber);
    
    if (!roundToDelete) {
      return res.status(404).json({ error: "Rodada não encontrada" });
    }

    // Only allow deleting the last round
    const maxRoundNumber = Math.max(...allRounds.map(r => r.roundNumber));
    if (roundNumber !== maxRoundNumber) {
      return res.status(400).json({ error: "Apenas a última rodada pode ser removida" });
    }

    // Check if round is locked (not active or completed)
    if (roundToDelete.status !== "locked") {
      return res.status(400).json({ 
        error: `Não é possível remover uma rodada ${roundToDelete.status === "active" ? "ativa" : "concluída"}` 
      });
    }

    // Cannot delete if it's the current round or below
    if (roundNumber <= classData.currentRound) {
      return res.status(400).json({ error: "Não é possível remover rodadas já iniciadas ou abaixo da rodada atual" });
    }

    // Check for dependencies
    const dependencies = await storage.getRoundDependencies(roundToDelete.id);
    if (dependencies.hasDependencies) {
      return res.status(400).json({ 
        error: "Rodada possui dados associados", 
        details: dependencies.details 
      });
    }

    // Delete the round
    await storage.deleteRound(roundToDelete.id);

    // Update maxRounds
    const newMaxRounds = allRounds.length - 1;
    await storage.updateClass(req.params.classId, { maxRounds: newMaxRounds });

    res.json({ 
      success: true, 
      message: `Rodada ${roundNumber} removida com sucesso`,
      newMaxRounds
    });
  });

  // Verificar dependências de uma rodada
  app.get("/api/rounds/:roundId/dependencies", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const round = await storage.getRound(req.params.roundId);
    if (!round) {
      return res.status(404).json({ error: "Rodada não encontrada" });
    }

    const dependencies = await storage.getRoundDependencies(req.params.roundId);
    res.json(dependencies);
  });

  // Log de acesso a uma rodada (estudante ou professor)
  app.post("/api/classes/:classId/log-access", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const { roundId, action } = req.body;
    if (!roundId || !action) {
      return res.status(400).json({ error: "roundId e action são obrigatórios" });
    }

    try {
      await storage.logRoundAccess(roundId, req.params.classId, req.session.userId, user.role, action);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao registrar log:", error);
      res.status(500).json({ error: "Erro ao registrar log" });
    }
  });

  // Relatório de Acessos às Rodadas
  app.get("/api/classes/:classId/round-access-logs", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para acessar este relatório" });
    }

    const logs = await storage.getRoundAccessLogs(req.params.classId);
    res.json(logs);
  });

  // Enviar email para equipes
  app.post("/api/classes/:classId/send-email", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para enviar emails nesta turma" });
    }

    const { teamIds, subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: "Assunto e mensagem são obrigatórios" });
    }

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: "Selecione pelo menos uma equipe" });
    }

    try {
      const results: { teamId: string; teamName: string; success: boolean; error?: string }[] = [];

      // Função auxiliar para delay (respeitar rate limit do Resend: 2 req/sec)
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (const teamId of teamIds) {
        const team = await storage.getTeam(teamId);
        if (!team) {
          results.push({ teamId, teamName: "Desconhecida", success: false, error: "Equipe não encontrada" });
          continue;
        }

        // Get team members emails
        const teamMembers = team.memberIds || [];
        const memberEmails: string[] = [];
        
        for (const memberId of teamMembers) {
          const member = await storage.getUser(memberId);
          if (member && member.email) {
            memberEmails.push(member.email);
          }
        }

        if (memberEmails.length === 0) {
          results.push({ teamId, teamName: team.name, success: false, error: "Nenhum email encontrado" });
          continue;
        }

        const result = await sendTeamEmail(
          memberEmails,
          user.email,
          subject,
          message,
          team.name,
          classData.name
        );

        results.push({ 
          teamId, 
          teamName: team.name, 
          success: result.success, 
          error: result.error 
        });

        // Adiciona delay de 1000ms entre envios para evitar rate limit (Resend limite é 2/s)
        if (teamIds.indexOf(teamId) < teamIds.length - 1) {
          await delay(1000);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      res.json({
        success: successCount > 0,
        message: `Email enviado para ${successCount} equipe(s)${failCount > 0 ? `, ${failCount} falha(s)` : ''}`,
        results
      });
    } catch (error: any) {
      console.error("Erro ao enviar emails:", error);
      res.status(500).json({ error: error.message || "Erro ao enviar emails" });
    }
  });

  app.post("/api/rounds/:roundId/schedule", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    try {
      const round = await storage.getRound(req.params.roundId);
      if (!round) {
        return res.status(404).json({ error: "Rodada não encontrada" });
      }

      const { scheduledStartAt, scheduledEndAt } = req.body;

      if (!scheduledStartAt && !scheduledEndAt) {
        return res.status(400).json({ error: "Pelo menos uma data de agendamento deve ser fornecida" });
      }

      const startDate = scheduledStartAt ? new Date(scheduledStartAt) : null;
      const endDate = scheduledEndAt ? new Date(scheduledEndAt) : null;

      if (startDate && endDate && startDate >= endDate) {
        return res.status(400).json({ error: "A data de início deve ser anterior à data de encerramento" });
      }

      if (startDate && isNaN(startDate.getTime())) {
        return res.status(400).json({ error: "Data de início inválida" });
      }

      if (endDate && isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Data de encerramento inválida" });
      }

      const updates: any = {};
      if (startDate) updates.scheduledStartAt = startDate;
      if (endDate) updates.scheduledEndAt = endDate;

      const updated = await storage.updateRound(req.params.roundId, updates);
      res.json(updated);
    } catch (error: any) {
      console.error("Erro ao agendar rodada:", error);
      res.status(500).json({ error: error.message || "Erro ao agendar rodada" });
    }
  });

  app.post("/api/rounds/:roundId/process", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    try {
      const round = await storage.getRound(req.params.roundId);
      if (!round) {
        return res.status(404).json({ error: "Rodada não encontrada" });
      }

      const classData = await storage.getClass(round.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      const teams = await storage.getTeamsByClass(round.classId);
      const marketEvents = await storage.getMarketEventsByRound(req.params.roundId);
      const activeEvents = marketEvents.filter(event => event.active);

      let processedTeams = 0;
      let processedProducts = 0;

      for (const team of teams) {
        const submittedMixes = await storage.getMarketingMixesByTeamAndRound(team.id, req.params.roundId);
        const submittedProducts = submittedMixes.filter(mix => mix.submittedAt !== null);

        if (submittedProducts.length === 0) {
          continue;
        }

        const existingResult = await storage.getResult(team.id, req.params.roundId);
        if (existingResult) {
          continue;
        }

        const swot = await storage.getSwotAnalysis(team.id, req.params.roundId);
        const porter = await storage.getPorterAnalysis(team.id, req.params.roundId);
        const bcgList = await storage.getBcgAnalyses(team.id, req.params.roundId);
        const pestel = await storage.getPestelAnalysis(team.id, req.params.roundId);

        const analyses = {
          swot: swot || null,
          porter: porter || null,
          bcg: bcgList.length > 0 ? bcgList : null,
          pestel: pestel || null,
        };

        const productKpisList: ResultCoreMetrics[] = [];

        for (const productMix of submittedProducts) {
          const productBudget = productMix.estimatedCost || calculateMarketingSpend(productMix);
          
          const productKPIs = calculateResults({
            marketingMix: productMix,
            marketEvents: activeEvents,
            teamBudget: productBudget,
            totalTeamsInRound: teams.length,
            classData: {
              sector: classData.sector ?? undefined,
              businessType: classData.businessType ?? undefined,
              marketSize: classData.marketSize ?? undefined,
              marketGrowthRate: classData.marketGrowthRate ?? undefined,
              competitionLevel: classData.competitionLevel ?? undefined,
              numberOfCompetitors: classData.numberOfCompetitors ?? undefined,
              marketConcentration: classData.marketConcentration ?? undefined,
              competitorStrength: classData.competitorStrength ?? undefined,
              targetConsumers: classData.targetConsumers ?? undefined,
            },
          });

          const adjustedProductKPIs = applyStrategicImpacts(productKPIs, analyses, productMix.priceValue);
          
          productKpisList.push(adjustedProductKPIs);

          await storage.createProductResult({
            teamId: team.id,
            roundId: req.params.roundId,
            productId: productMix.productId ?? 'default',
            ...adjustedProductKPIs,
            budgetBefore: productBudget,
            profitImpact: adjustedProductKPIs.profit,
            budgetAfter: productBudget + adjustedProductKPIs.profit,
            alignmentScore: null,
            alignmentIssues: [],
          });

          processedProducts++;
        }

        const consolidatedKPIs = consolidateKpis(productKpisList);

        const firstProduct = submittedProducts[0];
        const { kpis: finalKPIs, alignmentScore, alignmentIssues } = applyAlignmentPenalties(
          consolidatedKPIs,
          firstProduct,
          swot,
          porter,
          bcgList.length > 0 ? bcgList[0] : null,
          pestel,
          round.aiAssistanceLevel ?? 1,
          firstProduct.priceValue
        );

        const budgetBefore = team.budget;
        const profitImpact = finalKPIs.profit;
        const budgetAfter = Math.max(0, budgetBefore + profitImpact);

        await storage.createResult({
          teamId: team.id,
          roundId: req.params.roundId,
          ...finalKPIs,
          budgetBefore,
          profitImpact,
          budgetAfter,
          alignmentScore,
          alignmentIssues,
        });

        await storage.updateTeam(team.id, { budget: budgetAfter });
        processedTeams++;
      }

      await storage.updateRound(req.params.roundId, {
        status: "completed",
        endedAt: new Date(),
      });

      res.json({
        success: true,
        processedTeams,
        processedProducts,
        message: `Rodada processada com sucesso! ${processedTeams} equipes e ${processedProducts} produtos calculados.`,
      });
    } catch (error: any) {
      console.error("[PROCESS-ROUND] Error:", error);
      res.status(500).json({ error: error.message || "Erro ao processar rodada" });
    }
  });

  app.get("/api/classes/available", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const allClasses = await storage.getAllClasses();
    res.json(allClasses);
  });

  app.get("/api/teams/class/:classId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const classId = req.params.classId;
    const classData = await storage.getClass(classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    const teams = await storage.getTeamsByClass(classId);
    res.json(teams);
  });

  app.post("/api/teams/create", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem criar equipes" });
    }
    
    if (user.status !== "approved") {
      return res.status(403).json({ error: "Sua conta ainda não foi aprovada pelo professor. Aguarde a aprovação para criar equipes." });
    }
    
    const existingTeam = await storage.getTeamByUser(req.session.userId);
    if (existingTeam) {
      return res.status(400).json({ error: "Você já está em uma equipe" });
    }
    
    const studentClass = await storage.getClassByStudent(req.session.userId);
    if (!studentClass) {
      return res.status(403).json({ error: "Você não está matriculado em nenhuma turma" });
    }
    
    try {
      const data = insertTeamSchema.parse(req.body);
      
      const team = await storage.createTeam({
        name: data.name,
        classId: studentClass.id,
        memberIds: [req.session.userId],
        leaderId: req.session.userId,
        initialBudget: studentClass.defaultBudget,
        budget: studentClass.defaultBudget,
        companyName: null,
        slogan: null,
        logoUrl: null,
        productCategory: null,
        targetAudienceClass: null,
        targetAudienceAge: null,
        targetAudienceProfile: null,
      });
      res.json(team);
    } catch (error) {
      res.status(400).json({ error: "Erro ao criar equipe" });
    }
  });

  app.post("/api/teams/join", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem entrar em equipes" });
    }
    
    if (user.status !== "approved") {
      return res.status(403).json({ error: "Sua conta ainda não foi aprovada pelo professor. Aguarde a aprovação para entrar em equipes." });
    }
    
    const existingTeam = await storage.getTeamByUser(req.session.userId);
    if (existingTeam) {
      return res.status(400).json({ error: "Você já está em uma equipe" });
    }
    
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ error: "ID da equipe não fornecido" });
    }
    
    const team = await storage.getTeam(teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    const studentClass = await storage.getClassByStudent(req.session.userId);
    if (!studentClass) {
      return res.status(403).json({ error: "Você não está matriculado em nenhuma turma" });
    }
    
    if (studentClass.id !== team.classId) {
      return res.status(403).json({ error: "Você só pode entrar em equipes da mesma turma em que está matriculado" });
    }
    
    try {
      const updatedTeam = await storage.addMemberToTeam(teamId, req.session.userId);
      res.json(updatedTeam);
    } catch (error) {
      res.status(400).json({ error: "Erro ao entrar na equipe" });
    }
  });

  app.get("/api/teams/:teamId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const team = await storage.getTeam(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    res.json(team);
  });

  app.get("/api/teams/:teamId/members", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const team = await storage.getTeam(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    const members = await Promise.all(
      team.memberIds.map(id => storage.getUser(id))
    );
    
    res.json(members.filter(m => m !== undefined));
  });

  app.post("/api/teams/:teamId/members", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Apenas professores podem adicionar membros" });
    }
    
    const team = await storage.getTeam(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    const classData = await storage.getClass(team.classId);
    if (!classData || classData.professorId !== req.session.userId) {
      return res.status(403).json({ error: "Você não tem permissão para gerenciar esta equipe" });
    }
    
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email do membro é obrigatório" });
    }
    
    const member = await storage.getUserByEmail(email);
    if (!member) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    if (member.role !== "equipe") {
      return res.status(400).json({ error: "Apenas alunos podem ser adicionados a equipes" });
    }
    
    const existingTeam = await storage.getTeamByUser(member.id);
    if (existingTeam) {
      return res.status(400).json({ error: "Este usuário já está em uma equipe" });
    }
    
    const memberClass = await storage.getClassByStudent(member.id);
    if (!memberClass) {
      return res.status(400).json({ error: "Este aluno não está matriculado em nenhuma turma" });
    }
    
    if (memberClass.id !== team.classId) {
      return res.status(400).json({ error: "Este aluno não está matriculado na mesma turma desta equipe" });
    }
    
    const updatedTeam = await storage.addMemberToTeam(req.params.teamId, member.id);
    res.json(updatedTeam);
  });

  app.delete("/api/teams/:teamId/members/:userId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Apenas professores podem remover membros" });
    }
    
    const team = await storage.getTeam(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    const classData = await storage.getClass(team.classId);
    if (!classData || classData.professorId !== req.session.userId) {
      return res.status(403).json({ error: "Você não tem permissão para gerenciar esta equipe" });
    }
    
    const memberToRemove = await storage.getUser(req.params.userId);
    if (!memberToRemove) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    if (!team.memberIds.includes(req.params.userId)) {
      return res.status(400).json({ error: "Este usuário não está nesta equipe" });
    }
    
    const updatedTeam = await storage.removeMemberFromTeam(req.params.teamId, req.params.userId);
    res.json(updatedTeam);
  });

  app.get("/api/team/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem acessar equipes" });
    }
    
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Você não está em uma equipe" });
    }
    
    res.json(team);
  });

  app.get("/api/team/current-round-status", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem acessar este recurso" });
    }
    
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.json({
        teamId: null,
        roundNumber: null,
        hasSwot: false,
        hasPorter: false,
        hasBcg: false,
        hasPestel: false,
        hasMarketingMixDraft: false,
        isSubmitted: false,
        hasResults: false,
        progress: 0,
        nextAction: null,
        noTeam: true
      });
    }

    const currentRound = await storage.getCurrentRound(team.classId);
    if (!currentRound) {
      return res.status(404).json({ error: "Nenhuma rodada ativa encontrada" });
    }

    const [swotList, porterList, bcgList, pestelList, mixList, result] = await Promise.all([
      storage.getSwotAnalysesByTeamAndRound(team.id, currentRound.id),
      storage.getPorterAnalysesByTeamAndRound(team.id, currentRound.id),
      storage.getBcgAnalyses(team.id, currentRound.id),
      storage.getPestelAnalysesByTeamAndRound(team.id, currentRound.id),
      storage.getMarketingMixesByTeamAndRound(team.id, currentRound.id),
      storage.getResult(team.id, currentRound.id)
    ]);

    const hasSwot = swotList.length > 0;
    const hasPorter = porterList.length > 0;
    const hasBcg = bcgList.length > 0;
    const hasPestel = pestelList.length > 0;
    const hasMarketingMixDraft = mixList.length > 0;
    const isSubmitted = mixList.some(m => m.submittedAt !== null);
    const hasResults = result !== undefined;

    const weights = { swot: 15, porter: 15, bcg: 15, pestel: 15, mix: 20, submit: 10, results: 10 };
    let progress = 0;
    if (hasSwot) progress += weights.swot;
    if (hasPorter) progress += weights.porter;
    if (hasBcg) progress += weights.bcg;
    if (hasPestel) progress += weights.pestel;
    if (hasMarketingMixDraft) progress += weights.mix;
    if (isSubmitted) progress += weights.submit;
    if (hasResults) progress += weights.results;

    type NextActionKey = "swot" | "porter" | "bcg" | "pestel" | "mix" | "submit" | "results";
    interface NextAction {
      key: NextActionKey;
      title: string;
      description: string;
      href: string;
    }

    let nextAction: NextAction;
    if (!hasSwot) {
      nextAction = { key: "swot", title: "Análise SWOT", description: "Identifique forças, fraquezas, oportunidades e ameaças.", href: "/analises" };
    } else if (!hasPorter) {
      nextAction = { key: "porter", title: "Forças de Porter", description: "Analise as 5 forças competitivas do mercado.", href: "/analises" };
    } else if (!hasBcg) {
      nextAction = { key: "bcg", title: "Matriz BCG", description: "Classifique seus produtos no portfólio.", href: "/analises" };
    } else if (!hasPestel) {
      nextAction = { key: "pestel", title: "Análise PESTEL", description: "Avalie fatores externos que impactam o negócio.", href: "/analises" };
    } else if (!hasMarketingMixDraft) {
      nextAction = { key: "mix", title: "Decisões 4Ps", description: "Defina produto, preço, praça e promoção.", href: "/decisoes" };
    } else if (!isSubmitted) {
      nextAction = { key: "submit", title: "Submeter Rodada", description: "Envie suas decisões para processamento.", href: "/decisoes" };
    } else {
      nextAction = { key: "results", title: "Ver Resultados", description: "Confira o desempenho da sua equipe.", href: "/" };
    }

    res.json({
      teamId: team.id,
      roundNumber: currentRound.roundNumber,
      hasSwot,
      hasPorter,
      hasBcg,
      hasPestel,
      hasMarketingMixDraft,
      isSubmitted,
      hasResults,
      progress,
      nextAction
    });
  });

  app.patch("/api/team/identity", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem atualizar identidade da empresa" });
    }
    
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Você não está em uma equipe" });
    }
    
    const { companyName, slogan } = req.body;
    if (!companyName || !slogan) {
      return res.status(400).json({ error: "Nome da empresa e slogan são obrigatórios" });
    }
    
    const updatedTeam = await storage.updateTeam(team.id, {
      companyName,
      slogan,
    });
    
    res.json(updatedTeam);
  });

  app.post("/api/team/logo", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem atualizar logo" });
    }
    
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Você não está em uma equipe" });
    }
    
    const { logoUrl } = req.body;
    if (!logoUrl) {
      return res.status(400).json({ error: "URL do logo é obrigatória" });
    }
    
    const updatedTeam = await storage.updateTeam(team.id, {
      logoUrl,
    });
    
    res.json(updatedTeam);
  });

  app.post("/api/team/logo/upload", (req, res) => {
    uploadLogo.single('logo')(req, res, async (err) => {
      let dbUpdateSucceeded = false;

      // Helper para limpar arquivo enviado (apenas se DB não foi atualizado)
      const cleanupUploadedFile = async () => {
        if (!dbUpdateSucceeded && req.file?.path) {
          try {
            await fs.promises.unlink(req.file.path);
          } catch (cleanupErr) {
            console.error('Erro ao limpar arquivo enviado:', cleanupErr);
          }
        }
      };

      try {
        // Trata erros do multer (validação de arquivo)
        if (err) {
          await cleanupUploadedFile();
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({ error: "Arquivo muito grande. O tamanho máximo é 5MB." });
            }
            return res.status(400).json({ error: `Erro no upload: ${err.message}` });
          }
          return res.status(400).json({ error: err.message });
        }

        if (!req.session.userId) {
          await cleanupUploadedFile();
          return res.status(401).json({ error: "Não autenticado" });
        }
        
        const user = await storage.getUser(req.session.userId);
        if (!user || user.role !== "equipe") {
          await cleanupUploadedFile();
          return res.status(403).json({ error: "Apenas alunos podem fazer upload de logo" });
        }
        
        const team = await storage.getTeamByUser(req.session.userId);
        if (!team) {
          await cleanupUploadedFile();
          return res.status(404).json({ error: "Você não está em uma equipe" });
        }
        
        if (!req.file) {
          return res.status(400).json({ error: "Nenhum arquivo foi enviado" });
        }

        // Remove logo anterior APENAS se for arquivo local (não URL remota)
        if (team.logoUrl && team.logoUrl.startsWith('/attached_assets/logos/')) {
          const relativePath = team.logoUrl.startsWith('/') ? team.logoUrl.slice(1) : team.logoUrl;
          const oldLogoPath = path.join(process.cwd(), relativePath);
          const logosDirectory = path.join(process.cwd(), 'attached_assets', 'logos');
          
          const normalizedPath = path.normalize(oldLogoPath);
          if (normalizedPath.startsWith(logosDirectory) && fs.existsSync(normalizedPath)) {
            await fs.promises.unlink(normalizedPath);
          }
        }

        // Gera a URL pública do arquivo
        const logoUrl = `/attached_assets/logos/${req.file.filename}`;
        
        // Atualiza o banco de dados
        const updatedTeam = await storage.updateTeam(team.id, { logoUrl });
        dbUpdateSucceeded = true;
        
        res.json(updatedTeam);
      } catch (error: any) {
        console.error('Erro no upload:', error);
        await cleanupUploadedFile();
        res.status(500).json({ error: error.message || "Erro ao fazer upload do logo" });
      }
    });
  });

  app.patch("/api/team/market", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem configurar o mercado" });
    }
    
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Você não está em uma equipe" });
    }
    
    const { productCategory, targetAudienceClass, targetAudienceAge, targetAudienceProfile } = req.body;
    
    const updatedTeam = await storage.updateTeam(team.id, {
      productCategory,
      targetAudienceClass,
      targetAudienceAge,
      targetAudienceProfile,
    });
    
    res.json(updatedTeam);
  });

  app.patch("/api/team/leader", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Apenas alunos podem definir o líder" });
    }
    
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Você não está em uma equipe" });
    }
    
    try {
      const { leaderId } = updateTeamLeaderSchema.parse(req.body);
      
      if (!team.memberIds.includes(leaderId)) {
        return res.status(400).json({ error: "O líder deve ser um membro da equipe" });
      }
      
      const updatedTeam = await storage.updateTeamLeader(team.id, leaderId);
      res.json(updatedTeam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      throw error;
    }
  });

  app.get("/api/team/members", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Você não está em uma equipe" });
    }
    
    const members = await Promise.all(
      team.memberIds.map(async (memberId) => {
        const user = await storage.getUser(memberId);
        if (!user) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      })
    );
    
    res.json(members.filter(Boolean));
  });

  app.get("/api/market/sectors", async (req, res) => {
    res.json(marketSectors);
  });

  app.get("/api/market/sectors/:id", async (req, res) => {
    const sector = marketSectors.find(s => s.id === req.params.id);
    if (!sector) {
      return res.status(404).json({ error: "Setor não encontrado" });
    }
    res.json(sector);
  });

  app.get("/api/market/audiences", async (req, res) => {
    res.json(targetAudiences);
  });

  app.get("/api/market/business-types", async (req, res) => {
    res.json(businessTypes);
  });

  app.get("/api/market/competition-levels", async (req, res) => {
    res.json(competitionLevels);
  });

  app.patch("/api/classes/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classId = req.params.id;
    const classData = await storage.getClass(classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para editar esta turma" });
    }
    
    try {
      const { maxRounds } = req.body;
      if (maxRounds !== undefined) {
        if (!Number.isInteger(maxRounds) || maxRounds < 1 || maxRounds > 20) {
          return res.status(400).json({ error: "maxRounds deve ser um número inteiro entre 1 e 20" });
        }
        if (maxRounds < classData.currentRound) {
          return res.status(400).json({ error: `maxRounds não pode ser menor que a rodada atual (${classData.currentRound})` });
        }
      }
      
      const updateData: any = {};
      if (maxRounds !== undefined) updateData.maxRounds = maxRounds;
      
      const updated = await storage.updateClass(classId, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar turma:", error);
      res.status(400).json({ error: "Erro ao atualizar turma" });
    }
  });

  app.patch("/api/classes/:id/market", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const classId = req.params.id;
    const classData = await storage.getClass(classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para editar esta turma" });
    }
    
    try {
      const data = updateClassMarketSchema.parse(req.body);
      const updated = await storage.updateClass(classId, data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }
      res.status(400).json({ error: "Erro ao atualizar configurações de mercado" });
    }
  });

  app.get("/api/rounds/active/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      // Return a structured response even when no team exists
      return res.json({
        round: null,
        decisionsAllowed: false,
        reason: "no_team",
        message: "Você ainda não está em uma equipe. Entre em contato com seu professor."
      });
    }
    
    const activeRound = await storage.getCurrentRound(team.classId);
    
    if (!activeRound) {
      // No active round - check if there are any rounds at all
      const allRounds = await storage.getRoundsByClass(team.classId);
      const hasCompletedRounds = allRounds.some(r => r.status === "completed");
      const hasLockedRounds = allRounds.some(r => r.status === "locked");
      
      return res.json({
        round: null,
        decisionsAllowed: false,
        reason: "no_active_round",
        message: hasCompletedRounds 
          ? "Nenhuma rodada ativa no momento. Aguarde o professor iniciar a próxima rodada."
          : hasLockedRounds
            ? "A próxima rodada ainda não foi iniciada. Aguarde o professor ativar a rodada."
            : "Nenhuma rodada configurada para esta turma. Aguarde o professor configurar as rodadas."
      });
    }
    
    // Round is active - decisions are allowed
    // Clean canonical shape without legacy top-level fields
    res.json({
      round: activeRound,
      decisionsAllowed: true,
      reason: "round_active",
      message: `Rodada ${activeRound.roundNumber} está ativa. Você pode tomar suas decisões.`
    });
  });

  app.get("/api/event-templates", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado. Apenas professores podem acessar templates de eventos." });
    }
    
    try {
      const { eventGenerator } = await import("./services/eventGenerator");
      const typeParam = req.query.type as string | undefined;
      
      if (typeParam) {
        if (!["economico", "tecnologico", "social", "competitivo", "regulatorio"].includes(typeParam)) {
          return res.status(400).json({ error: "Tipo de evento inválido" });
        }
        const templates = eventGenerator.getEventTemplatesByType(typeParam as any);
        res.json(templates);
      } else {
        const templates = eventGenerator.getAllEventTemplates();
        res.json(templates);
      }
    } catch (error) {
      console.error("Erro ao buscar templates de eventos:", error);
      res.status(500).json({ error: "Erro ao buscar templates de eventos" });
    }
  });

  app.get("/api/events/class/:classId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (user.role === "equipe") {
      const team = await storage.getTeamByUser(req.session.userId);
      if (!team || team.classId !== req.params.classId) {
        return res.status(403).json({ error: "Você não tem acesso aos eventos desta turma" });
      }
    } else if (user.role === "professor" && classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem acesso aos eventos desta turma" });
    }
    
    const allEvents = await storage.getAllMarketEvents();
    const classEvents = allEvents.filter(e => e.classId === req.params.classId);
    
    if (user.role === "professor") {
      res.json(classEvents);
    } else {
      const activeEvents = classEvents.filter(e => e.active);
      res.json(activeEvents);
    }
  });

  app.get("/api/market-events/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    const events = await storage.getMarketEventsByRound(req.params.roundId);
    
    if (user.role === "professor") {
      res.json(events);
    } else {
      const activeEvents = events.filter(e => e.active);
      res.json(activeEvents);
    }
  });

  app.post("/api/market-events", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    try {
      const data = insertMarketEventSchema.parse(req.body);
      
      const classData = await storage.getClass(data.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }
      if (classData.professorId !== user.id) {
        return res.status(403).json({ error: "Você não tem permissão para criar eventos nesta turma" });
      }
      
      const round = await storage.getRound(data.roundId);
      if (!round) {
        return res.status(404).json({ error: "Rodada não encontrada" });
      }
      if (round.classId !== data.classId) {
        return res.status(403).json({ error: "A rodada não pertence a esta turma" });
      }
      
      const event = await storage.createMarketEvent(data);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.patch("/api/market-events/:eventId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    try {
      const existingEvent = await storage.getMarketEvent(req.params.eventId);
      if (!existingEvent) {
        return res.status(404).json({ error: "Evento não encontrado" });
      }
      
      const classData = await storage.getClass(existingEvent.classId);
      if (!classData || classData.professorId !== user.id) {
        return res.status(403).json({ error: "Você não tem permissão para atualizar este evento" });
      }
      
      if (req.body.roundId || req.body.classId) {
        return res.status(403).json({ error: "Não é permitido alterar a turma ou rodada do evento após criação" });
      }
      
      const { classId, roundId, ...allowedUpdates } = req.body;
      
      const updated = await storage.updateMarketEvent(req.params.eventId, allowedUpdates);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Erro ao atualizar evento" });
    }
  });

  // PATCH: Salva rascunho do marketing mix (sem submittedAt) - permite múltiplas edições
  app.patch("/api/marketing-mix/draft", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    if (team.leaderId && team.leaderId !== req.session.userId) {
      return res.status(403).json({ error: "Apenas o líder da equipe pode editar decisões de marketing mix" });
    }
    
    const activeRound = await storage.getCurrentRound(team.classId);
    if (!activeRound) {
      return res.status(400).json({ error: "Não há rodada ativa para salvar decisões" });
    }

    // ⚠️ VALIDAÇÃO OBRIGATÓRIA: Verificar se todas as análises estratégicas foram completadas
    const [swot, porter, bcgList, pestel] = await Promise.all([
      storage.getSwotAnalysis(team.id, activeRound.id),
      storage.getPorterAnalysis(team.id, activeRound.id),
      storage.getBcgAnalyses(team.id, activeRound.id),
      storage.getPestelAnalysis(team.id, activeRound.id),
    ]);

    const missingAnalyses = [];
    if (!swot) missingAnalyses.push("Análise SWOT");
    if (!porter) missingAnalyses.push("5 Forças de Porter");
    if (!bcgList || bcgList.length === 0) missingAnalyses.push("Matriz BCG");
    if (!pestel) missingAnalyses.push("Análise PESTEL");

    if (missingAnalyses.length > 0) {
      return res.status(400).json({ 
        error: "⚠️ ETAPA OBRIGATÓRIA: Complete todas as Análises Estratégicas primeiro!",
        details: `Você deve completar as seguintes análises antes de configurar o Marketing Mix: ${missingAnalyses.join(", ")}.`,
        missingAnalyses,
        nextStep: "Acesse 'Análises Estratégicas' no menu e complete todas as 4 ferramentas: SWOT, Porter, BCG e PESTEL."
      });
    }
    
    // Verifica se já foi submetida (não pode editar após submissão)
    const existing = await storage.getMarketingMix(team.id, activeRound.id);
    if (existing?.submittedAt) {
      return res.status(400).json({ 
        error: "Decisão já submetida",
        details: "Não é possível editar decisões após a submissão final. Aguarde a próxima rodada."
      });
    }
    
    try {
      const data = insertMarketingMixSchema.parse({
        ...req.body,
        teamId: team.id,
        roundId: activeRound.id,
      });
      
      const classData = await storage.getClass(team.classId);
      const sector = classData?.sector ? marketSectors.find(s => s.id === classData.sector) : undefined;
      
      const estimatedCost = calculateMarketingSpend(
        data as any,
        sector?.averageMargin
      );
      
      let result;
      if (existing) {
        // Atualiza rascunho existente (sem submittedAt)
        result = await storage.updateMarketingMix(existing.id, {
          ...data,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
        });
      } else {
        // Cria novo rascunho (sem submittedAt)
        result = await storage.createMarketingMix({
          ...data,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
        });
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  // POST: Submete decisão final do marketing mix (adiciona submittedAt e bloqueia edições)
  app.post("/api/marketing-mix/submit", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    if (team.leaderId && team.leaderId !== req.session.userId) {
      return res.status(403).json({ error: "Apenas o líder da equipe pode submeter decisões de marketing mix" });
    }
    
    const activeRound = await storage.getCurrentRound(team.classId);
    if (!activeRound) {
      return res.status(400).json({ error: "Não há rodada ativa para submeter decisões" });
    }
    
    const existing = await storage.getMarketingMix(team.id, activeRound.id);
    if (!existing) {
      return res.status(400).json({ 
        error: "Nenhum rascunho encontrado",
        details: "Salve suas decisões antes de submeter."
      });
    }
    
    if (existing.submittedAt) {
      return res.status(400).json({ 
        error: "Decisão já submetida",
        details: "Esta decisão já foi enviada anteriormente."
      });
    }
    
    try {
      const classData = await storage.getClass(team.classId);
      const sector = classData?.sector ? marketSectors.find(s => s.id === classData.sector) : undefined;
      
      const estimatedCost = calculateMarketingSpend(
        existing as any,
        sector?.averageMargin
      );
      
      // Validação de orçamento na submissão final
      if (estimatedCost > team.budget) {
        return res.status(400).json({ 
          error: "Orçamento insuficiente",
          details: `Esta decisão custaria aproximadamente R$ ${estimatedCost.toFixed(2)}, mas você tem apenas R$ ${team.budget.toFixed(2)} disponível. Ajuste suas decisões para reduzir custos.`,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
          availableBudget: Math.round(team.budget * 100) / 100
        });
      }
      
      // Validação OBRIGATÓRIA de Ferramentas Estratégicas
      const [swot, porter, bcgList, pestel] = await Promise.all([
        storage.getSwotAnalysis(team.id, activeRound.id),
        storage.getPorterAnalysis(team.id, activeRound.id),
        storage.getBcgAnalyses(team.id, activeRound.id),
        storage.getPestelAnalysis(team.id, activeRound.id),
      ]);
      
      const missingTools: string[] = [];
      
      // SWOT: Exigir pelo menos 1 item em CADA categoria
      if (!swot || 
          swot.strengths.length < 1 || 
          swot.weaknesses.length < 1 || 
          swot.opportunities.length < 1 || 
          swot.threats.length < 1) {
        missingTools.push("SWOT (mínimo 1 item por categoria: Forças, Fraquezas, Oportunidades, Ameaças)");
      }
      
      // Porter: Exigir que pelo menos UMA nota válida (>15 caracteres, não placeholder)
      const isValidPorterNote = (note: string | null): boolean => {
        if (!note) return false;
        const trimmed = note.trim();
        if (trimmed.length < 15) return false;
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) return false;
        if (trimmed.toLowerCase().includes("analise") && trimmed.length < 25) return false;
        return true;
      };
      
      const hasValidPorterNotes = porter && (
        isValidPorterNote(porter.rivalryNotes) ||
        isValidPorterNote(porter.supplierNotes) ||
        isValidPorterNote(porter.buyerNotes) ||
        isValidPorterNote(porter.substitutesNotes) ||
        isValidPorterNote(porter.newEntryNotes)
      );
      
      if (!porter || !hasValidPorterNotes) {
        missingTools.push("Porter (mínimo 1 nota válida em qualquer força)");
      }
      
      // BCG: Exigir nome do produto e notas válidas
      const hasValidBcg = bcgList && bcgList.length > 0 && bcgList.some(bcg => {
        if (!bcg.productName || bcg.productName.trim().length === 0) return false;
        if (bcg.productName.toLowerCase() === "seu produto") return false;
        if (!bcg.notes) return false;
        const trimmedNotes = bcg.notes.trim();
        if (trimmedNotes.length < 15) return false;
        if (trimmedNotes.startsWith("[") && trimmedNotes.endsWith("]")) return false;
        if (trimmedNotes.toLowerCase().includes("justifique") && trimmedNotes.length < 25) return false;
        return true;
      });
      
      if (!hasValidBcg) {
        missingTools.push("BCG (mínimo 1 produto com nome e justificativa válida)");
      }
      
      // PESTEL: Exigir pelo menos 1 item válido em CADA categoria
      const isValidPestelArray = (arr: string[]): boolean => {
        if (arr.length < 1) return false;
        return arr.some(item => {
          const trimmed = item.trim();
          return trimmed.length > 5 && !trimmed.startsWith("[") && !trimmed.endsWith("]");
        });
      };
      
      if (!pestel || 
          !isValidPestelArray(pestel.political) ||
          !isValidPestelArray(pestel.economic) ||
          !isValidPestelArray(pestel.social) ||
          !isValidPestelArray(pestel.technological) ||
          !isValidPestelArray(pestel.environmental) ||
          !isValidPestelArray(pestel.legal)) {
        missingTools.push("PESTEL (mínimo 1 item válido em cada categoria)");
      }
      
      if (missingTools.length > 0) {
        return res.status(400).json({ 
          error: "Ferramentas estratégicas obrigatórias não preenchidas",
          details: `As ferramentas estratégicas (SWOT, Porter, BCG e PESTEL) são obrigatórias. Cada tópico deve ter pelo menos 1 informação. A falta de preenchimento gera penalização automática de -10% no desempenho da rodada. Complete as seguintes ferramentas: ${missingTools.join(", ")}`,
          missingTools: missingTools,
          warning: "⚠️ Ferramentas incompletas resultam em -10% de penalização no desempenho final"
        });
      }
      
      // Adiciona submittedAt para bloquear edições futuras
      const result = await storage.updateMarketingMix(existing.id, {
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        submittedAt: new Date(),
      });

      // Envia email de confirmação
      const leader = await storage.getUser(req.session.userId);
      if (leader && leader.email && result) {
        await emailService.sendDecisionSubmittedEmail(
          team.name,
          activeRound.roundNumber,
          leader.email,
          existing.productQuality || "medio",
          existing.priceValue,
          existing.distributionChannels,
          existing.promotionMix,
          Math.round(estimatedCost * 100) / 100
        );
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Erro ao submeter decisão" });
    }
  });

  // Mantém POST legado para compatibilidade (redireciona para draft)
  app.post("/api/marketing-mix", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    if (team.leaderId && team.leaderId !== req.session.userId) {
      return res.status(403).json({ error: "Apenas o líder da equipe pode enviar decisões de marketing mix" });
    }
    
    const activeRound = await storage.getCurrentRound(team.classId);
    if (!activeRound) {
      return res.status(400).json({ error: "Não há rodada ativa para enviar decisões" });
    }
    
    try {
      const data = insertMarketingMixSchema.parse({
        ...req.body,
        teamId: team.id,
        roundId: activeRound.id,
      });
      
      const classData = await storage.getClass(team.classId);
      const sector = classData?.sector ? marketSectors.find(s => s.id === classData.sector) : undefined;
      
      const estimatedCost = calculateMarketingSpend(
        data as any,
        sector?.averageMargin
      );
      
      const existing = await storage.getMarketingMix(team.id, activeRound.id);
      
      let result;
      if (existing) {
        result = await storage.updateMarketingMix(existing.id, {
          ...data,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
          submittedAt: new Date(),
        } as any);
      } else {
        result = await storage.createMarketingMix({
          ...data,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
          submittedAt: new Date(),
        } as any);
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Dados inválidos" });
    }
  });

  app.get("/api/marketing-mix/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }
    
    const activeRound = await storage.getCurrentRound(team.classId);
    if (!activeRound) {
      return res.json(null);
    }
    
    const mix = await storage.getMarketingMix(team.id, activeRound.id);
    res.json(mix || null);
  });

  app.get("/api/classes/:classId/marketing-mixes", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Apenas professores podem acessar" });
    }
    
    const { classId } = req.params;
    const targetClass = await storage.getClass(classId);
    
    if (!targetClass) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }
    
    if (targetClass.professorId !== req.session.userId) {
      return res.status(403).json({ error: "Você não tem permissão para acessar esta turma" });
    }
    
    const mixes = await storage.getMarketingMixesByClass(classId);
    const teams = await storage.getTeamsByClass(classId);
    const rounds = await storage.getRoundsByClass(classId);
    
    const mixesWithDetails = mixes.map(mix => {
      const team = teams.find(t => t.id === mix.teamId);
      const round = rounds.find(r => r.id === mix.roundId);
      return {
        ...mix,
        teamName: team?.name,
        roundNumber: round?.roundNumber,
      };
    });
    
    res.json(mixesWithDetails);
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    // Buscar alunos das turmas do professor E alunos disponíveis (não matriculados em nenhuma turma)
    const enrolledStudents = await storage.getStudentsByProfessorClasses(req.session.userId);
    const availableStudents = await storage.getAvailableStudentsForEnrollment();
    
    // Combinar ambas as listas, removendo duplicatas
    const allStudentsMap = new Map<string, any>();
    [...enrolledStudents, ...availableStudents].forEach(u => {
      if (!allStudentsMap.has(u.id)) {
        allStudentsMap.set(u.id, {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
        });
      }
    });
    
    // Ordenar alfabeticamente por nome
    const sanitized = Array.from(allStudentsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(sanitized);
  });
  
  // Endpoint para limpeza manual de duplicatas (apenas professor autorizado)
  app.post("/api/admin/clean-duplicates", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    
    try {
      await storage.removeDuplicateUsers();
      res.json({ message: "Duplicatas removidas com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: "Erro ao remover duplicatas: " + error.message });
    }
  });

  app.delete("/api/admin/users/:userId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || currentUser.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado. Apenas professores podem excluir usuários." });
    }
    
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "ID do usuário não fornecido" });
    }
    
    if (userId === req.session.userId) {
      return res.status(400).json({ error: "Você não pode excluir a si mesmo" });
    }
    
    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    
    if (targetUser.role === "professor") {
      if (authorizedProfessorEmails.has(targetUser.email.trim().toLowerCase())) {
        return res.status(400).json({ error: "Não é permitido excluir professores autorizados" });
      }
      
      if (!authorizedProfessorEmails.has(currentUser.email.trim().toLowerCase())) {
        return res.status(403).json({ error: "Apenas professores autorizados podem excluir outros professores" });
      }
    }
    
    const userClasses = await storage.getClassesByProfessor(userId);
    if (userClasses.length > 0) {
      return res.status(400).json({ error: "Este professor possui turmas e não pode ser excluído" });
    }
    
    const deleted = await storage.deleteUser(userId);
    if (!deleted) {
      return res.status(500).json({ error: "Erro ao excluir usuário" });
    }
    
    res.status(204).send();
  });

  app.get("/api/admin/teams", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const teams = await storage.getAllTeams();
    res.json(teams);
  });

  app.get("/api/admin/rounds", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const rounds = await storage.getAllRounds();
    res.json(rounds);
  });

  app.get("/api/admin/marketing-mixes", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const mixes = await storage.getAllMarketingMixes();
    res.json(mixes);
  });

  app.get("/api/admin/market-events", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const events = await storage.getAllMarketEvents();
    res.json(events);
  });

  app.get("/api/results/round/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const results = await storage.getResultsByRound(req.params.roundId);
    
    const resultsWithTeams = await Promise.all(
      results.map(async (result) => {
        const team = await storage.getTeam(result.teamId);
        return {
          ...result,
          teamName: team?.name || "Equipe Desconhecida",
          companyName: team?.companyName,
        };
      })
    );

    const ranked = resultsWithTeams.sort((a, b) => b.profit - a.profit);

    if (user.role === "professor") {
      res.json(ranked);
    } else {
      const userTeam = await storage.getTeamByUser(req.session.userId);
      if (!userTeam) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }
      
      const teamResult = ranked.find(r => r.teamId === userTeam.id);
      if (!teamResult) {
        return res.status(404).json({ error: "Resultado não encontrado para esta rodada" });
      }
      
      res.json([teamResult]);
    }
  });

  app.get("/api/results/team/:teamId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    const team = await storage.getTeam(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    if (user?.role === "equipe") {
      const userTeam = await storage.getTeamByUser(req.session.userId);
      if (!userTeam || userTeam.id !== req.params.teamId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
    }

    const allResults = await storage.getAllResults();
    const teamResults = allResults.filter(r => r.teamId === req.params.teamId);

    res.json(teamResults);
  });

  app.get("/api/results/team/:teamId/round/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    const team = await storage.getTeam(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    if (user?.role === "equipe") {
      const userTeam = await storage.getTeamByUser(req.session.userId);
      if (!userTeam || userTeam.id !== req.params.teamId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
    }

    const result = await storage.getResult(req.params.teamId, req.params.roundId);
    
    if (!result) {
      return res.status(404).json({ error: "Resultado não encontrado para esta rodada" });
    }

    res.json(result);
  });

  app.get("/api/alignment/score/:teamId/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    const team = await storage.getTeam(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    if (user?.role === "equipe") {
      const userTeam = await storage.getTeamByUser(req.session.userId);
      if (!userTeam || userTeam.id !== req.params.teamId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
    }

    const result = await storage.getResult(req.params.teamId, req.params.roundId);
    
    if (!result) {
      return res.status(404).json({ error: "Resultado não encontrado para esta rodada" });
    }

    res.json({
      teamId: result.teamId,
      roundId: result.roundId,
      alignmentScore: result.alignmentScore ?? null,
      alignmentIssues: result.alignmentIssues ?? [],
      calculatedAt: result.calculatedAt,
    });
  });

  app.get("/api/alignment/class/:classId/round/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    
    if (user?.role !== "professor") {
      return res.status(403).json({ error: "Apenas professores podem acessar este recurso" });
    }

    const classData = await storage.getClass(req.params.classId);
    
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    const round = await storage.getRound(req.params.roundId);
    
    if (!round) {
      return res.status(404).json({ error: "Rodada não encontrada" });
    }

    const allTeams = await storage.getTeamsByClass(req.params.classId);
    const teamResults = await storage.getResultsByClassAndRound(req.params.classId, req.params.roundId);
    
    const resultsMap = new Map(teamResults.map(({ result, team }) => [team.id, result]));

    const response = allTeams.map(team => {
      const result = resultsMap.get(team.id);
      const score = result?.alignmentScore ?? null;
      const scoreLevel = score !== null ? getAlignmentScoreLevel(score) : null;
      
      const hasSwot = result ? true : false;
      const hasMarketingMix = result ? true : false;
      
      return {
        teamId: team.id,
        teamName: team.name,
        alignmentScore: score,
        scoreLevel: scoreLevel?.label ?? null,
        alignmentIssues: result?.alignmentIssues ?? [],
        calculatedAt: result?.calculatedAt ?? null,
        hasSubmission: !!result,
      };
    });

    response.sort((a, b) => {
      if (a.alignmentScore === null && b.alignmentScore === null) return 0;
      if (a.alignmentScore === null) return -1;
      if (b.alignmentScore === null) return 1;
      return a.alignmentScore - b.alignmentScore;
    });

    res.json(response);
  });

  function calculateStringSimilarity(original: string, edited: string): number {
    if (!original || !edited) return 0;
    if (original === edited) return 100;

    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const origNorm = normalize(original);
    const editNorm = normalize(edited);

    if (origNorm === editNorm) return 100;

    const levenshtein = (a: string, b: string): number => {
      const matrix: number[][] = [];
      
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[b.length][a.length];
    };

    const distance = levenshtein(origNorm, editNorm);
    const maxLength = Math.max(origNorm.length, editNorm.length);
    const similarity = maxLength > 0 ? ((maxLength - distance) / maxLength) * 100 : 0;

    return Math.max(0, Math.min(100, Math.round(similarity)));
  }

  function calculateContentSimilarity(original: any, edited: any): number {
    const origStr = JSON.stringify(original);
    const editStr = JSON.stringify(edited);
    return calculateStringSimilarity(origStr, editStr);
  }

  app.post("/api/strategic-tools/track-edits", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const { toolType, teamId, roundId, originalContent, editedContent } = req.body;

    if (!toolType || !teamId || !roundId) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const team = await storage.getTeam(teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    const userTeam = await storage.getTeamByUser(req.session.userId);
    if (!userTeam || userTeam.id !== teamId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    let updateData: any = {
      editedByUser: true,
    };

    if (originalContent && editedContent) {
      const aiGeneratedPercentage = calculateContentSimilarity(originalContent, editedContent);
      
      updateData.aiGeneratedPercentage = Math.max(0, Math.min(100, aiGeneratedPercentage));
      updateData.originalAIContent = originalContent;
    }

    try {
      let analysisFound = false;

      if (toolType === "swot") {
        const existing = await storage.getSwotAnalysis(teamId, roundId);
        if (!existing) {
          return res.status(404).json({ error: "Análise SWOT não encontrada para esta equipe/rodada" });
        }
        await storage.updateSwotAnalysis(existing.id, updateData);
        analysisFound = true;
      } else if (toolType === "porter") {
        const existing = await storage.getPorterAnalysis(teamId, roundId);
        if (!existing) {
          return res.status(404).json({ error: "Análise de Porter não encontrada para esta equipe/rodada" });
        }
        await storage.updatePorterAnalysis(existing.id, updateData);
        analysisFound = true;
      } else if (toolType === "bcg") {
        const existing = await storage.getBcgAnalyses(teamId, roundId);
        if (existing.length === 0) {
          return res.status(404).json({ error: "Análise BCG não encontrada para esta equipe/rodada" });
        }
        for (const bcgItem of existing) {
          await storage.updateBcgAnalysis(bcgItem.id, updateData);
        }
        analysisFound = true;
      } else if (toolType === "pestel") {
        const existing = await storage.getPestelAnalysis(teamId, roundId);
        if (!existing) {
          return res.status(404).json({ error: "Análise PESTEL não encontrada para esta equipe/rodada" });
        }
        await storage.updatePestelAnalysis(existing.id, updateData);
        analysisFound = true;
      } else {
        return res.status(400).json({ error: "Tipo de ferramenta inválido. Use: swot, porter, bcg, ou pestel" });
      }

      if (analysisFound) {
        res.json({ success: true, message: "Edição rastreada com sucesso" });
      }
    } catch (error) {
      console.error("Erro ao rastrear edição:", error);
      res.status(500).json({ error: "Erro ao rastrear edição" });
    }
  });

  app.get("/api/insights/market/:teamId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    const team = await storage.getTeam(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    if (user?.role === "equipe") {
      const userTeam = await storage.getTeamByUser(req.session.userId);
      if (!userTeam || userTeam.id !== req.params.teamId) {
        return res.status(403).json({ error: "Acesso negado" });
      }
    }

    const classData = await storage.getClass(team.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    const sector = marketSectors.find(s => s.id === classData.sector);
    if (!sector) {
      return res.status(404).json({ error: "Setor não encontrado" });
    }

    const allResults = await storage.getAllResults();
    const teamResults = allResults.filter(r => r.teamId === team.id).sort((a, b) => 
      new Date(a.calculatedAt).getTime() - new Date(b.calculatedAt).getTime()
    );
    
    if (teamResults.length === 0) {
      return res.json(null);
    }

    const latestResult = teamResults[teamResults.length - 1];

    const profitabilityLevel = 
      latestResult.margin >= sector.averageMargin * 1.2 ? "excelente" :
      latestResult.margin >= sector.averageMargin ? "bom" :
      latestResult.margin >= sector.averageMargin * 0.7 ? "regular" : "baixo";

    const efficiencyLevel =
      latestResult.roi >= 60 ? "excelente" :
      latestResult.roi >= 40 ? "bom" :
      latestResult.roi >= 20 ? "regular" : "baixo";

    const customerEngagementLevel =
      latestResult.nps >= 50 ? "excelente" :
      latestResult.nps >= 20 ? "bom" :
      latestResult.nps >= 0 ? "regular" : "baixo";

    const marketPositionLevel =
      latestResult.marketShare >= 30 ? "excelente" :
      latestResult.marketShare >= 20 ? "bom" :
      latestResult.marketShare >= 10 ? "regular" : "baixo";

    const marketSharePosition =
      latestResult.marketShare >= 30 ? "Líder de mercado" :
      latestResult.marketShare >= 20 ? "Forte presença" :
      latestResult.marketShare >= 10 ? "Presença moderada" : "Entrada no mercado";

    const avgTicket = sector.categories[0]?.averagePrice || 100;
    const pricePositioning =
      latestResult.ticketMedio >= avgTicket * 1.3 ? "Premium" :
      latestResult.ticketMedio >= avgTicket * 0.9 ? "Competitivo" : "Penetração";

    const brandStrength =
      latestResult.brandPerception >= 80 ? "Muito forte" :
      latestResult.brandPerception >= 60 ? "Forte" :
      latestResult.brandPerception >= 40 ? "Moderada" : "Fraca";

    // Buscar eventos de mercado relevantes
    const rounds = await storage.getRoundsByClass(classData.id);
    const latestRound = rounds
      .sort((a, b) => b.roundNumber - a.roundNumber)
      .find(r => r.id === latestResult.roundId);
    
    const marketEvents = latestRound 
      ? await storage.getMarketEventsByRound(latestRound.id)
      : [];

    // Gerar recomendações com IA
    let recommendations: any[] = [];
    let usedFallback = false;
    
    try {
      const { generateRecommendations } = await import("./services/aiRecommendations");
      const aiRecs = await generateRecommendations({
        result: latestResult,
        classData,
        teamData: team,
        marketEvents,
        previousResults: teamResults.slice(0, -1), // Todos menos o último
      });
      
      recommendations = aiRecs.map(rec => ({
        priority: rec.priority,
        category: rec.category,
        title: rec.title,
        description: rec.description,
        actionableSteps: rec.actionableSteps,
        expectedImpact: rec.expectedImpact,
      }));
    } catch (error) {
      console.error("Erro ao gerar recomendações com IA, usando fallback:", error);
      usedFallback = true;
    }
    
    // Se IA falhou ou retornou vazio, usar fallback baseado em regras
    if (usedFallback || recommendations.length === 0) {
      if (recommendations.length === 0) {
        console.warn("IA retornou array vazio, usando fallback");
      }
      
      // Fallback para recomendações baseadas em regras
      if (latestResult.margin < sector.averageMargin * 0.8) {
        recommendations.push({
          priority: "alta",
          category: "Lucratividade",
          title: "Melhorar margem de lucro",
          description: `Sua margem (${latestResult.margin.toFixed(1)}%) está abaixo da média do setor (${sector.averageMargin}%). Considere revisar custos operacionais ou ajustar precificação.`,
          actionableSteps: ["Analisar custos operacionais", "Revisar estratégia de precificação"],
          expectedImpact: "Aumento da margem de lucro"
        });
      }

      if (latestResult.razaoLtvCac < 3) {
        recommendations.push({
          priority: "alta",
          category: "Eficiência",
          title: "Otimizar aquisição de clientes",
          description: `Razão LTV/CAC de ${latestResult.razaoLtvCac.toFixed(2)} está abaixo do ideal (>3). Reduza CAC ou aumente LTV através de fidelização.`,
          actionableSteps: ["Otimizar campanhas de marketing", "Implementar programa de fidelidade"],
          expectedImpact: "Melhoria na razão LTV/CAC"
        });
      }

      if (latestResult.nps < 20) {
        recommendations.push({
          priority: "alta",
          category: "Satisfação",
          title: "Aumentar satisfação do cliente",
          description: `NPS de ${latestResult.nps.toFixed(0)} indica baixa lealdade. Foque em melhorar qualidade do produto e atendimento.`,
          actionableSteps: ["Melhorar qualidade do produto", "Aprimorar atendimento ao cliente"],
          expectedImpact: "Aumento do NPS e retenção"
        });
      }

      if (recommendations.length === 0) {
        recommendations.push({
          priority: "baixa",
          category: "Manutenção",
          title: "Manter performance",
          description: "Sua equipe está performando bem! Continue monitorando KPIs e ajustando estratégias conforme necessário.",
          actionableSteps: ["Monitorar KPIs regularmente", "Ajustar estratégias conforme necessário"],
          expectedImpact: "Manutenção da performance"
        });
      }
    }

    const insights = {
      sectorInfo: {
        name: sector.name,
        description: sector.description,
        averageMargin: sector.averageMargin,
        growthTrend: sector.growthRate >= 7 ? "Alto crescimento" : sector.growthRate >= 4 ? "Crescimento moderado" : "Crescimento estável",
        mainChallenges: sector.challenges,
        opportunities: sector.opportunities,
      },
      teamPerformance: {
        profitabilityLevel,
        efficiencyLevel,
        customerEngagementLevel,
        marketPositionLevel,
      },
      competitiveAnalysis: {
        marketSharePosition,
        pricePositioning,
        brandStrength,
      },
      recommendations: recommendations.slice(0, 5),
    };

    res.json(insights);
  });

  app.get("/api/professor/analytics/:classId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    if (classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para acessar esta turma" });
    }

    // Buscar dados da turma
    const teams = await storage.getTeamsByClass(req.params.classId);
    const rounds = await storage.getRoundsByClass(req.params.classId);
    const completedRounds = rounds.filter(r => r.status === "completed");
    const allResults = await storage.getAllResults();
    
    // Filtrar resultados desta turma
    const classResults = allResults.filter(result => 
      teams.some(team => team.id === result.teamId)
    );

    // Métricas gerais da turma
    const totalTeams = teams.length;
    const totalStudents = teams.reduce((sum, team) => sum + team.memberIds.length, 0);
    const averageBudget = teams.length > 0 
      ? teams.reduce((sum, team) => sum + team.budget, 0) / teams.length 
      : 0;

    // Evolução temporal dos KPIs (por rodada)
    const kpiEvolution = completedRounds.map(round => {
      const roundResults = classResults.filter(r => r.roundId === round.id);
      
      if (roundResults.length === 0) {
        return {
          roundNumber: round.roundNumber,
          roundId: round.id,
          avgProfit: 0,
          avgRevenue: 0,
          avgMarketShare: 0,
          avgNPS: 0,
          avgROI: 0,
          teamsSubmitted: 0,
        };
      }

      return {
        roundNumber: round.roundNumber,
        roundId: round.id,
        avgProfit: roundResults.reduce((sum, r) => sum + r.profit, 0) / roundResults.length,
        avgRevenue: roundResults.reduce((sum, r) => sum + r.revenue, 0) / roundResults.length,
        avgMarketShare: roundResults.reduce((sum, r) => sum + r.marketShare, 0) / roundResults.length,
        avgNPS: roundResults.reduce((sum, r) => sum + r.nps, 0) / roundResults.length,
        avgROI: roundResults.reduce((sum, r) => sum + r.roi, 0) / roundResults.length,
        teamsSubmitted: roundResults.length,
      };
    });

    // Rankings das equipes (baseado na última rodada completa)
    const lastCompletedRound = completedRounds[completedRounds.length - 1];
    let rankings = {
      byProfit: [] as any[],
      byMarketShare: [] as any[],
      byNPS: [] as any[],
      byROI: [] as any[],
    };

    if (lastCompletedRound) {
      const lastRoundResults = classResults
        .filter(r => r.roundId === lastCompletedRound.id)
        .map(result => {
          const team = teams.find(t => t.id === result.teamId);
          return {
            teamId: result.teamId,
            teamName: team?.name || "Equipe Desconhecida",
            companyName: team?.companyName,
            profit: result.profit,
            marketShare: result.marketShare,
            nps: result.nps,
            roi: result.roi,
            revenue: result.revenue,
            margin: result.margin,
          };
        });

      rankings.byProfit = [...lastRoundResults].sort((a, b) => b.profit - a.profit).slice(0, 10);
      rankings.byMarketShare = [...lastRoundResults].sort((a, b) => b.marketShare - a.marketShare).slice(0, 10);
      rankings.byNPS = [...lastRoundResults].sort((a, b) => b.nps - a.nps).slice(0, 10);
      rankings.byROI = [...lastRoundResults].sort((a, b) => b.roi - a.roi).slice(0, 10);
    }

    // Indicadores de engajamento
    const engagementMetrics = await Promise.all(
      teams.map(async (team) => {
        const teamRounds = completedRounds.length;
        const marketingMixes = await Promise.all(
          completedRounds.map(round => storage.getMarketingMix(team.id, round.id))
        );
        
        const submittedMixes = marketingMixes.filter(mix => mix && mix.submittedAt).length;
        const submissionRate = teamRounds > 0 ? (submittedMixes / teamRounds) * 100 : 0;

        // Checar conclusão de ferramentas estratégicas na última rodada
        let toolsCompleted = 0;
        if (lastCompletedRound) {
          const [swot, porter, bcg, pestel] = await Promise.all([
            storage.getSwotAnalysis(team.id, lastCompletedRound.id),
            storage.getPorterAnalysis(team.id, lastCompletedRound.id),
            storage.getBcgAnalyses(team.id, lastCompletedRound.id),
            storage.getPestelAnalysis(team.id, lastCompletedRound.id),
          ]);
          
          if (swot) toolsCompleted++;
          if (porter) toolsCompleted++;
          if (bcg && bcg.length > 0) toolsCompleted++;
          if (pestel) toolsCompleted++;
        }

        return {
          teamId: team.id,
          teamName: team.name,
          submissionRate,
          strategicToolsCompleted: toolsCompleted,
          totalMembers: team.memberIds.length,
        };
      })
    );

    const avgSubmissionRate = engagementMetrics.length > 0
      ? engagementMetrics.reduce((sum, m) => sum + m.submissionRate, 0) / engagementMetrics.length
      : 0;

    const avgToolsCompleted = engagementMetrics.length > 0
      ? engagementMetrics.reduce((sum, m) => sum + m.strategicToolsCompleted, 0) / engagementMetrics.length
      : 0;

    const analytics = {
      classInfo: {
        id: classData.id,
        name: classData.name,
        sector: classData.sector,
        totalTeams,
        totalStudents,
        totalRounds: rounds.length,
        completedRounds: completedRounds.length,
        averageBudget,
      },
      kpiEvolution,
      rankings,
      engagement: {
        overall: {
          avgSubmissionRate,
          avgToolsCompleted,
        },
        byTeam: engagementMetrics,
      },
    };

    res.json(analytics);
  });

  // Endpoint para professor visualizar análises estratégicas de uma equipe específica
  app.get("/api/professor/strategy/team/:teamId/round/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    const { teamId, roundId } = req.params;

    // Verificar se a equipe existe e pertence a uma turma do professor
    const team = await storage.getTeam(teamId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    const classData = await storage.getClass(team.classId);
    if (!classData || classData.professorId !== user.id) {
      return res.status(403).json({ error: "Você não tem permissão para acessar esta equipe" });
    }

    const [swot, porter, bcgList, pestel] = await Promise.all([
      storage.getSwotAnalysis(teamId, roundId),
      storage.getPorterAnalysis(teamId, roundId),
      storage.getBcgAnalyses(teamId, roundId),
      storage.getPestelAnalysis(teamId, roundId),
    ]);

    res.json({ swot, porter, bcg: bcgList, pestel });
  });

  app.get("/api/admin/results", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }
    const results = await storage.getAllResults();
    res.json(results);
  });

  app.get("/api/strategy/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    const [swot, porter, bcgList, pestel] = await Promise.all([
      storage.getSwotAnalysis(team.id, req.params.roundId),
      storage.getPorterAnalysis(team.id, req.params.roundId),
      storage.getBcgAnalyses(team.id, req.params.roundId),
      storage.getPestelAnalysis(team.id, req.params.roundId),
    ]);

    res.json({ swot, porter, bcg: bcgList, pestel });
  });

  app.post("/api/strategy/swot", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    try {
      const data = insertSwotSchema.parse(req.body);
      const existing = await storage.getSwotAnalysis(team.id, data.roundId);
      
      let swot;
      if (existing) {
        swot = await storage.updateSwotAnalysis(existing.id, data);
      } else {
        swot = await storage.createSwotAnalysis({ ...data, teamId: team.id });
      }

      res.json(swot);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/strategy/porter", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    try {
      const data = insertPorterSchema.parse(req.body);
      const existing = await storage.getPorterAnalysis(team.id, data.roundId);
      
      let porter;
      if (existing) {
        porter = await storage.updatePorterAnalysis(existing.id, data);
      } else {
        porter = await storage.createPorterAnalysis({ ...data, teamId: team.id });
      }

      res.json(porter);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/strategy/bcg", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    try {
      const data = insertBcgSchema.parse(req.body);
      const bcg = await storage.createBcgAnalysis({ ...data, teamId: team.id });
      res.json(bcg);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/strategy/bcg/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    const bcg = await storage.getBcgAnalysisById(req.params.id);
    if (!bcg) {
      return res.status(404).json({ error: "Análise não encontrada" });
    }

    if (bcg.teamId !== team.id) {
      return res.status(403).json({ error: "Você não tem permissão para deletar esta análise" });
    }

    const deleted = await storage.deleteBcgAnalysis(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Análise não encontrada" });
    }

    res.json({ success: true });
  });

  app.post("/api/strategy/pestel", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    try {
      const data = insertPestelSchema.parse(req.body);
      const existing = await storage.getPestelAnalysis(team.id, data.roundId);
      
      let pestel;
      if (existing) {
        pestel = await storage.updatePestelAnalysis(existing.id, data);
      } else {
        pestel = await storage.createPestelAnalysis({ ...data, teamId: team.id });
      }

      res.json(pestel);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/economic/latest", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { economicService } = await import("./services/economic");
      let economicData = await storage.getLatestEconomicData();
      const now = Date.now();
      const oneHour = 3600000;

      if (!economicData || now - economicData.createdAt.getTime() > oneHour) {
        const freshData = await economicService.fetchLatestData();
        economicData = await storage.createEconomicData(freshData);
      }

      const analysis = economicService.analyzeEconomicCondition(economicData);
      res.json({ ...economicData, analysis });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/economic/history", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const history = await storage.getAllEconomicData(limit);
    res.json(history);
  });

  app.get("/api/auto-events/config/:classId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const classData = await storage.getClass(req.params.classId);
    if (!classData) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    if (user.role === "professor" && classData.professorId !== user.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const config = await storage.getAutoEventConfig(req.params.classId);
    res.json(config || { enabled: false, classId: req.params.classId });
  });

  app.post("/api/auto-events/config", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado" });
    }

    try {
      const { insertAutoEventConfigSchema } = await import("@shared/schema");
      const data = insertAutoEventConfigSchema.parse(req.body);

      const classData = await storage.getClass(data.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (classData.professorId !== user.id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const existing = await storage.getAutoEventConfig(data.classId);
      let config;
      if (existing) {
        config = await storage.updateAutoEventConfig(data.classId, data);
      } else {
        config = await storage.createAutoEventConfig(data);
      }

      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/ai/generate-events", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    try {
      const schema = z.object({
        classId: z.string(),
        quantity: z.number().min(1).max(10).optional().default(5),
      });

      const { classId, quantity } = schema.parse(req.body);

      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (classData.professorId !== user.id) {
        return res.status(403).json({ error: "Acesso negado - não é sua turma" });
      }

      if (!classData.sector || classData.sector.trim() === "") {
        return res.status(400).json({ error: "Configure o setor da turma antes de gerar eventos" });
      }

      const rounds = await storage.getRoundsByClass(classId);
      const activeRound = rounds.find(r => r.status === "active");
      if (!activeRound) {
        return res.status(400).json({ error: "Crie pelo menos uma rodada ativa antes de gerar eventos" });
      }

      const teams = await storage.getTeamsByClass(classId);
      const sampleTeam = teams[0];
      
      const params: EventGenerationParams = {
        sectorId: classData.sector,
        productCategory: sampleTeam?.productCategory || undefined,
        businessType: classData.businessType || "B2C",
        marketSize: classData.marketSize || undefined,
        competitionLevel: classData.competitionLevel || undefined,
        numberOfEvents: quantity,
      };

      const generatedEvents = await generateMarketEvents(params);
      
      const savedEvents = [];
      for (const event of generatedEvents) {
        const eventData = {
          classId,
          roundId: activeRound.id,
          type: event.type,
          title: event.title,
          description: event.description,
          impact: event.impact,
          severity: event.severity,
          active: true,
        };
        const savedEvent = await storage.createMarketEvent(eventData);
        savedEvents.push(savedEvent);
      }

      res.json({ 
        count: savedEvents.length, 
        events: savedEvents 
      });
    } catch (error: any) {
      console.error("Erro ao gerar eventos com IA:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar eventos" });
    }
  });

  app.post("/api/ai/generate-strategic-analyses/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    try {
      const round = await storage.getRound(req.params.roundId);
      if (!round) {
        return res.status(404).json({ error: "Rodada não encontrada" });
      }

      const classData = await storage.getClass(round.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (classData.professorId !== user.id) {
        return res.status(403).json({ error: "Acesso negado - não é sua turma" });
      }

      if (!classData.sector || classData.sector.trim() === "") {
        return res.status(400).json({ error: "Configure o setor da turma antes de gerar análises estratégicas" });
      }

      const teams = await storage.getTeamsByClass(round.classId);
      if (teams.length === 0) {
        return res.status(400).json({ error: "Não há equipes nesta turma" });
      }

      const { generateStrategicAnalyses } = await import("./services/aiStrategy");
      
      const results = [];
      for (const team of teams) {
        try {
          const analyses = await generateStrategicAnalyses({
            classData,
            teamData: team,
            roundNumber: round.roundNumber
          });

          const existingSwot = await storage.getSwotAnalysis(team.id, round.id);
          if (existingSwot) {
            await storage.updateSwotAnalysis(existingSwot.id, {
              strengths: analyses.swot.strengths,
              weaknesses: analyses.swot.weaknesses,
              opportunities: analyses.swot.opportunities,
              threats: analyses.swot.threats,
            });
          } else {
            await storage.createSwotAnalysis({
              teamId: team.id,
              roundId: round.id,
              strengths: analyses.swot.strengths,
              weaknesses: analyses.swot.weaknesses,
              opportunities: analyses.swot.opportunities,
              threats: analyses.swot.threats,
            });
          }

          const existingPorter = await storage.getPorterAnalysis(team.id, round.id);
          if (existingPorter) {
            await storage.updatePorterAnalysis(existingPorter.id, {
              competitiveRivalry: analyses.porter.competitiveRivalry,
              supplierPower: analyses.porter.supplierPower,
              buyerPower: analyses.porter.buyerPower,
              threatOfSubstitutes: analyses.porter.threatOfSubstitutes,
              threatOfNewEntry: analyses.porter.threatOfNewEntry,
              rivalryNotes: analyses.porter.rivalryNotes,
              supplierNotes: analyses.porter.supplierNotes,
              buyerNotes: analyses.porter.buyerNotes,
              substitutesNotes: analyses.porter.substitutesNotes,
              newEntryNotes: analyses.porter.newEntryNotes,
            });
          } else {
            await storage.createPorterAnalysis({
              teamId: team.id,
              roundId: round.id,
              competitiveRivalry: analyses.porter.competitiveRivalry,
              supplierPower: analyses.porter.supplierPower,
              buyerPower: analyses.porter.buyerPower,
              threatOfSubstitutes: analyses.porter.threatOfSubstitutes,
              threatOfNewEntry: analyses.porter.threatOfNewEntry,
              rivalryNotes: analyses.porter.rivalryNotes,
              supplierNotes: analyses.porter.supplierNotes,
              buyerNotes: analyses.porter.buyerNotes,
              substitutesNotes: analyses.porter.substitutesNotes,
              newEntryNotes: analyses.porter.newEntryNotes,
            });
          }

          const existingBcg = await storage.getBcgAnalyses(team.id, round.id);
          if (existingBcg.length > 0) {
            for (const bcg of existingBcg) {
              await storage.deleteBcgAnalysis(bcg.id);
            }
          }
          for (const bcgItem of analyses.bcg) {
            await storage.createBcgAnalysis({
              teamId: team.id,
              roundId: round.id,
              productName: bcgItem.productName,
              marketGrowth: bcgItem.marketGrowth,
              relativeMarketShare: bcgItem.relativeMarketShare,
              quadrant: bcgItem.quadrant,
              notes: bcgItem.notes,
            });
          }

          const existingPestel = await storage.getPestelAnalysis(team.id, round.id);
          if (existingPestel) {
            await storage.updatePestelAnalysis(existingPestel.id, {
              political: analyses.pestel.political,
              economic: analyses.pestel.economic,
              social: analyses.pestel.social,
              technological: analyses.pestel.technological,
              environmental: analyses.pestel.environmental,
              legal: analyses.pestel.legal,
            });
          } else {
            await storage.createPestelAnalysis({
              teamId: team.id,
              roundId: round.id,
              political: analyses.pestel.political,
              economic: analyses.pestel.economic,
              social: analyses.pestel.social,
              technological: analyses.pestel.technological,
              environmental: analyses.pestel.environmental,
              legal: analyses.pestel.legal,
            });
          }

          const existingRecommendations = await storage.getStrategicRecommendations(team.id, round.id);
          if (existingRecommendations) {
            await storage.updateStrategicRecommendations(existingRecommendations.id, {
              product: analyses.recommendations.product,
              price: analyses.recommendations.price,
              place: analyses.recommendations.place,
              promotion: analyses.recommendations.promotion,
            });
          } else {
            await storage.createStrategicRecommendations({
              teamId: team.id,
              roundId: round.id,
              product: analyses.recommendations.product,
              price: analyses.recommendations.price,
              place: analyses.recommendations.place,
              promotion: analyses.recommendations.promotion,
            });
          }

          results.push({
            teamId: team.id,
            teamName: team.name,
            success: true,
            recommendations: analyses.recommendations
          });
        } catch (teamError: any) {
          console.error(`Erro ao gerar análises para equipe ${team.name}:`, teamError);
          results.push({
            teamId: team.id,
            teamName: team.name,
            success: false,
            error: teamError.message
          });
        }
      }

      res.json({
        roundId: round.id,
        roundNumber: round.roundNumber,
        totalTeams: teams.length,
        successCount: results.filter(r => r.success).length,
        results
      });
    } catch (error: any) {
      console.error("Erro ao gerar análises estratégicas:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar análises estratégicas" });
    }
  });

  app.get("/api/ai/strategic-recommendations/current", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "equipe") {
      return res.status(403).json({ error: "Acesso negado - apenas alunos" });
    }

    try {
      const team = await storage.getTeamByUser(user.id);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const rounds = await storage.getRoundsByClass(team.classId);
      const activeRound = rounds.find(r => r.status === "active");
      
      if (!activeRound) {
        return res.json(null);
      }

      const recommendations = await storage.getStrategicRecommendations(team.id, activeRound.id);
      
      if (!recommendations) {
        return res.json(null);
      }

      res.json({
        product: recommendations.product,
        price: recommendations.price,
        place: recommendations.place,
        promotion: recommendations.promotion,
        updatedAt: recommendations.updatedAt
      });
    } catch (error: any) {
      console.error("Erro ao buscar recomendações estratégicas:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar recomendações" });
    }
  });

  app.get("/api/users/pending", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    const pendingUsers = await storage.getPendingUsers();
    res.json(pendingUsers);
  });

  app.post("/api/users/:userId/approve", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    const targetUser = await storage.getUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (targetUser.status !== "pending") {
      return res.status(400).json({ error: "Usuário não está pendente" });
    }

    await storage.updateUserStatus(req.params.userId, "approved");
    await emailService.sendUserApprovedEmail(targetUser.email, targetUser.name);

    res.json({ success: true });
  });

  app.post("/api/users/:userId/reject", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    const targetUser = await storage.getUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (targetUser.status !== "pending") {
      return res.status(400).json({ error: "Usuário não está pendente" });
    }

    await storage.updateUserStatus(req.params.userId, "rejected");

    res.json({ success: true });
  });

  app.post("/api/users/:userId/generate-temporary-password", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores" });
    }

    const targetUser = await storage.getUser(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (targetUser.role !== "equipe") {
      return res.status(400).json({ error: "Senha temporária só pode ser gerada para alunos" });
    }

    // Gera senha temporária simples e legível (8 caracteres: letras e números)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem caracteres confusos (0,O,1,I)
    let tempPassword = '';
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
    const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await storage.setTemporaryPassword(req.params.userId, hashedTempPassword, expiryDate);

    res.json({ 
      success: true,
      temporaryPassword: tempPassword,
      expiresAt: expiryDate,
      userName: targetUser.name,
      userEmail: targetUser.email,
      message: `Senha temporária gerada para ${targetUser.name}. Expira em 1 hora.`
    });
  });

  app.post("/api/feedback/generate/:teamId/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "professor") {
      return res.status(403).json({ error: "Acesso negado - apenas professores podem gerar feedback" });
    }

    try {
      const { teamId, roundId } = req.params;

      const existingFeedback = await storage.getAiFeedback(teamId, roundId);
      if (existingFeedback) {
        await storage.deleteAiFeedback(teamId, roundId);
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const round = await storage.getRound(roundId);
      if (!round) {
        return res.status(404).json({ error: "Rodada não encontrada" });
      }

      if (round.status !== "completed") {
        return res.status(400).json({ error: "A rodada ainda não foi encerrada" });
      }

      const classData = await storage.getClass(team.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      const marketingMix = await storage.getMarketingMix(teamId, roundId);
      if (!marketingMix) {
        return res.status(404).json({ error: "Nenhuma decisão de marketing mix encontrada para esta rodada" });
      }

      const result = await storage.getResult(teamId, roundId);
      if (!result) {
        return res.status(404).json({ error: "Resultados não encontrados para esta rodada" });
      }

      const marketEvents = await storage.getMarketEventsByRound(roundId);
      
      const allResults = await storage.getAllResults();
      const teamResults = allResults.filter(r => r.teamId === teamId);
      
      const previousResults = [];
      for (const r of teamResults) {
        const resultRound = await storage.getRound(r.roundId);
        if (resultRound && resultRound.roundNumber < round.roundNumber) {
          previousResults.push(r);
        }
      }
      
      previousResults.sort((a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime());

      const { generateFeedback } = await import("./services/aiFeedback");
      const analysis = await generateFeedback({
        marketingMix,
        result,
        classData,
        teamData: team,
        marketEvents: marketEvents.filter(e => e.active),
        previousResults,
      });

      const savedFeedback = await storage.createAiFeedback({
        teamId,
        roundId,
        overallAnalysis: analysis.overallAnalysis,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        literatureRecommendations: analysis.literatureRecommendations,
      });

      res.json(savedFeedback);
    } catch (error: any) {
      console.error("Erro ao gerar feedback:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar feedback com IA" });
    }
  });

  app.get("/api/feedback/:teamId/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId, roundId } = req.params;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      if (user.role === "equipe" && !team.memberIds.includes(req.session.userId)) {
        return res.status(403).json({ error: "Você não faz parte desta equipe" });
      }

      const feedback = await storage.getAiFeedback(teamId, roundId);
      if (!feedback) {
        return res.status(404).json({ error: "Feedback não encontrado" });
      }

      res.json(feedback);
    } catch (error: any) {
      console.error("Erro ao buscar feedback:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar feedback" });
    }
  });

  app.get("/api/feedback/:teamId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId } = req.params;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      if (user.role === "equipe" && !team.memberIds.includes(req.session.userId)) {
        return res.status(403).json({ error: "Você não faz parte desta equipe" });
      }

      const feedbacks = await storage.getAiFeedbacksByTeam(teamId);
      res.json(feedbacks);
    } catch (error: any) {
      console.error("Erro ao buscar feedbacks:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar feedbacks" });
    }
  });

  // Deterministic Feedback - Gerado automaticamente sem LLM
  app.get("/api/deterministic-feedback/:teamId/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId, roundId } = req.params;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      if (user.role === "equipe" && !team.memberIds.includes(req.session.userId)) {
        return res.status(403).json({ error: "Você não faz parte desta equipe" });
      }

      let feedback = await storage.getDeterministicFeedback(teamId, roundId);
      
      // Se não existe, gera automaticamente
      if (!feedback) {
        const round = await storage.getRound(roundId);
        if (!round || round.status !== "completed") {
          // Retorna null em vez de 404 para o fetcher padrão do TanStack Query
          return res.json(null);
        }

        const result = await storage.getResult(teamId, roundId);
        if (!result) {
          // Retorna null em vez de 404 para o fetcher padrão do TanStack Query
          return res.json(null);
        }

        // Busca resultado anterior se existir
        const previousResult = await storage.getPreviousRoundResult(teamId, roundId);

        const { generateRoundFeedback, generateFallbackFeedback } = await import("./feedback/feedbackEngine");
        
        let generatedFeedback;
        
        if (result.simulationBreakdown || result.competitorResponse || result.eventImpacts) {
          generatedFeedback = generateRoundFeedback({
            previousResult: previousResult || null,
            currentResult: result,
            simulationBreakdown: result.simulationBreakdown as any,
            competitorResponse: result.competitorResponse as any,
            eventImpacts: result.eventImpacts as any[],
            roundNumber: round.roundNumber,
            teamName: team.name,
          });
        } else {
          generatedFeedback = generateFallbackFeedback(result, round.roundNumber, team.name);
        }

        feedback = await storage.createDeterministicFeedback({
          teamId,
          roundId,
          summary: generatedFeedback.summary,
          whatHappened: generatedFeedback.whatHappened,
          whyItHappened: generatedFeedback.whyItHappened,
          recommendations: generatedFeedback.recommendations,
          engineVersion: generatedFeedback.engineVersion,
        });
      }

      res.json(feedback);
    } catch (error: any) {
      console.error("Erro ao buscar feedback determinístico:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar feedback" });
    }
  });

  // Endpoint para professor visualizar todos os feedbacks de uma rodada
  app.get("/api/deterministic-feedback/round/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "professor") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { roundId } = req.params;
      const feedbacks = await storage.getDeterministicFeedbacksByRound(roundId);
      res.json(feedbacks);
    } catch (error: any) {
      console.error("Erro ao buscar feedbacks da rodada:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar feedbacks" });
    }
  });

  // Endpoint para regenerar feedback determinístico
  app.post("/api/deterministic-feedback/regenerate/:teamId/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId, roundId } = req.params;
      
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const round = await storage.getRound(roundId);
      if (!round || round.status !== "completed") {
        return res.status(404).json({ error: "Resultados não disponíveis para esta rodada" });
      }

      const result = await storage.getResult(teamId, roundId);
      if (!result) {
        return res.status(404).json({ error: "Resultados não encontrados" });
      }

      const previousResult = await storage.getPreviousRoundResult(teamId, roundId);

      const { generateRoundFeedback, generateFallbackFeedback } = await import("./feedback/feedbackEngine");
      
      let generatedFeedback;
      
      if (result.simulationBreakdown || result.competitorResponse || result.eventImpacts) {
        generatedFeedback = generateRoundFeedback({
          previousResult: previousResult || null,
          currentResult: result,
          simulationBreakdown: result.simulationBreakdown as any,
          competitorResponse: result.competitorResponse as any,
          eventImpacts: result.eventImpacts as any[],
          roundNumber: round.roundNumber,
          teamName: team.name,
        });
      } else {
        generatedFeedback = generateFallbackFeedback(result, round.roundNumber, team.name);
      }

      const feedback = await storage.createDeterministicFeedback({
        teamId,
        roundId,
        summary: generatedFeedback.summary,
        whatHappened: generatedFeedback.whatHappened,
        whyItHappened: generatedFeedback.whyItHappened,
        recommendations: generatedFeedback.recommendations,
        engineVersion: generatedFeedback.engineVersion,
      });

      res.json(feedback);
    } catch (error: any) {
      console.error("Erro ao regenerar feedback:", error);
      res.status(500).json({ error: error.message || "Erro ao regenerar feedback" });
    }
  });

  app.get("/api/products/class/:classId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const classData = await storage.getClass(req.params.classId);
      if (!classData) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (user.role === "professor") {
        if (classData.professorId !== user.id) {
          return res.status(403).json({ error: "Acesso negado - não é sua turma" });
        }
      } else {
        const userTeam = await storage.getTeamByUser(req.session.userId);
        if (!userTeam || userTeam.classId !== req.params.classId) {
          return res.status(403).json({ error: "Acesso negado - você não está nesta turma" });
        }
      }

      if (!classData.sector) {
        return res.status(400).json({ error: "Turma não possui setor configurado" });
      }

      // Buscar produtos do banco de dados pelo setor da turma
      const sectorProducts = await storage.getProductsBySector(classData.sector);
      const orderedProducts = [...sectorProducts].sort((a, b) => a.orderIndex - b.orderIndex);

      // Se a requisição informar a rodada, limita aos N produtos liberados
      // nela (productCount definido pelo professor ao iniciar a rodada).
      const roundId = typeof req.query.roundId === "string" ? req.query.roundId : undefined;
      if (roundId) {
        const round = await storage.getRound(roundId);
        if (round && round.classId === req.params.classId) {
          res.json(orderedProducts.slice(0, round.productCount));
          return;
        }
      }

      res.json(orderedProducts);
    } catch (error: any) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar produtos" });
    }
  });

  app.get("/api/midias", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const midias = await storage.getAllMidias();
      res.json(midias);
    } catch (error: any) {
      console.error("Erro ao buscar mídias:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar mídias" });
    }
  });

  app.get("/api/team-products/:teamId/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId, roundId } = req.params;
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      if (user.role === "professor") {
        const classData = await storage.getClass(team.classId);
        if (!classData || classData.professorId !== user.id) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      } else {
        if (!team.memberIds.includes(req.session.userId)) {
          return res.status(403).json({ error: "Acesso negado" });
        }
      }

      const teamProducts = await storage.getTeamProductsByTeamAndRound(teamId, roundId);
      res.json(teamProducts);
    } catch (error: any) {
      console.error("Erro ao buscar produtos da equipe:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar produtos" });
    }
  });

  app.post("/api/team-products", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const team = await storage.getTeamByUser(req.session.userId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const { roundId, productId, productName, productDescription, targetAudienceClass, targetAudienceAge, targetAudienceProfile, isDraft } = req.body;

      // SEGURANÇA: Derivar teamId da sessão, não confiar no body
      const teamId = team.id;

      const round = await storage.getRound(roundId);
      if (!round) {
        return res.status(404).json({ error: "Rodada não encontrada" });
      }

      if (round.status !== "active") {
        return res.status(400).json({ error: "Rodada não está ativa" });
      }

      const existing = await storage.getTeamProduct(teamId, roundId, productId);

      if (existing && existing.submittedAt && isDraft === false) {
        return res.status(400).json({ error: "Este produto já foi submetido e não pode mais ser alterado nesta rodada" });
      }

      const data = {
        teamId,
        roundId,
        productId,
        productName,
        productDescription,
        targetAudienceClass,
        targetAudienceAge,
        targetAudienceProfile,
        submittedAt: isDraft === false ? new Date() : undefined,
      };

      let result;
      if (existing) {
        result = await storage.updateTeamProduct(existing.id, data);
      } else {
        result = await storage.createTeamProduct(data);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao salvar produto da equipe:", error);
      res.status(400).json({ error: error.message || "Erro ao salvar produto" });
    }
  });

  // Reset all team decisions for a round (professor only)
  app.delete("/api/team-decisions/:teamId/:roundId", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "professor") {
        return res.status(403).json({ error: "Apenas professores podem resetar decisões" });
      }

      const { teamId, roundId } = req.params;

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      const classData = await storage.getClass(team.classId);
      if (!classData || classData.professorId !== user.id) {
        return res.status(403).json({ error: "Acesso negado - esta equipe não é de uma turma sua" });
      }

      const result = await storage.resetTeamDecisions(teamId, roundId);

      res.json({
        success: true,
        message: `Decisões resetadas: ${result.deletedAnalyses} análises, ${result.deletedMixes} mixes, ${result.deletedProducts} produtos`,
        ...result
      });
    } catch (error: any) {
      console.error("Erro ao resetar decisões:", error);
      res.status(500).json({ error: error.message || "Erro ao resetar decisões" });
    }
  });

  app.get("/api/marketing-mix/team/:teamId/round/:roundId/products", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId, roundId } = req.params;
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      if (user.role === "professor") {
        const classData = await storage.getClass(team.classId);
        if (!classData || classData.professorId !== user.id) {
          return res.status(403).json({ error: "Acesso negado - não é sua turma" });
        }
      } else {
        if (!team.memberIds.includes(req.session.userId)) {
          return res.status(403).json({ error: "Acesso negado - você não está nesta equipe" });
        }
      }

      const marketingMixes = await storage.getMarketingMixesByTeamAndRound(teamId, roundId);
      res.json(marketingMixes);
    } catch (error: any) {
      console.error("Erro ao buscar marketing mixes por produto:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar decisões" });
    }
  });

  app.post("/api/marketing-mix/product", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const team = await storage.getTeamByUser(req.session.userId);
    if (!team) {
      return res.status(404).json({ error: "Equipe não encontrada" });
    }

    if (team.leaderId && team.leaderId !== req.session.userId) {
      return res.status(403).json({ error: "Apenas o líder da equipe pode enviar decisões de marketing mix" });
    }

    try {
      const { productId, roundId, isDraft, ...mixData } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "productId é obrigatório" });
      }

      if (!roundId) {
        return res.status(400).json({ error: "roundId é obrigatório" });
      }

      // ⚠️ VALIDAÇÃO OBRIGATÓRIA: Verificar se todas as análises estratégicas foram completadas
      const [swot, porter, bcgList, pestel] = await Promise.all([
        storage.getSwotAnalysis(team.id, roundId),
        storage.getPorterAnalysis(team.id, roundId),
        storage.getBcgAnalyses(team.id, roundId),
        storage.getPestelAnalysis(team.id, roundId),
      ]);

      const missingAnalyses = [];
      if (!swot) missingAnalyses.push("Análise SWOT");
      if (!porter) missingAnalyses.push("5 Forças de Porter");
      if (!bcgList || bcgList.length === 0) missingAnalyses.push("Matriz BCG");
      if (!pestel) missingAnalyses.push("Análise PESTEL");

      if (missingAnalyses.length > 0) {
        return res.status(400).json({ 
          error: "⚠️ ETAPA OBRIGATÓRIA: Complete todas as Análises Estratégicas primeiro!",
          details: `Você deve completar as seguintes análises antes de configurar qualquer produto: ${missingAnalyses.join(", ")}.`,
          missingAnalyses,
          nextStep: "Acesse 'Análises Estratégicas' no menu e complete todas as 4 ferramentas: SWOT, Porter, BCG e PESTEL."
        });
      }

      const data = insertMarketingMixSchema.parse({
        ...mixData,
        teamId: team.id,
        roundId,
        productId,
      });

      // Validar valores mínimos das mídias selecionadas (se houver promotionBudgets)
      if (data.promotionBudgets && typeof data.promotionBudgets === 'object') {
        const midiaIds = Object.keys(data.promotionBudgets);
        if (midiaIds.length > 0) {
          const midiasValidation = await Promise.all(
            midiaIds.map(midiaId => storage.getMidia(midiaId))
          );
          
          const invalidMidias: string[] = [];
          midiasValidation.forEach((midia, index) => {
            if (midia) {
              const budgets = data.promotionBudgets as Record<string, number>;
              const budgetValue = budgets[midiaIds[index]];
              const minValue = midia.custoUnitarioMinimo || 0;
              if (budgetValue > 0 && budgetValue < minValue) {
                invalidMidias.push(
                  `${midia.formato || midia.nome}: valor de R$ ${budgetValue.toFixed(2)} é menor que o mínimo de R$ ${minValue.toFixed(2)}`
                );
              }
            }
          });
          
          if (invalidMidias.length > 0) {
            return res.status(400).json({
              error: "Valores abaixo do mínimo permitido",
              details: "As seguintes mídias têm valores abaixo do mínimo exigido:",
              invalidMidias,
            });
          }
        }
      }

      const classData = await storage.getClass(team.classId);
      const sector = classData?.sector ? marketSectors.find(s => s.id === classData.sector) : undefined;

      const estimatedCost = calculateMarketingSpend(
        data as any,
        sector?.averageMargin
      );

      const existing = await storage.getMarketingMix(team.id, roundId, productId);

      let result;
      if (existing) {
        result = await storage.updateMarketingMix(existing.id, {
          ...data,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
          submittedAt: isDraft === false ? new Date() : undefined,
        } as any);
      } else {
        result = await storage.createMarketingMix({
          ...data,
          estimatedCost: Math.round(estimatedCost * 100) / 100,
          submittedAt: isDraft === false ? new Date() : undefined,
        } as any);
      }

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao salvar marketing mix do produto:", error);
      res.status(400).json({ error: error.message || "Dados inválidos" });
    }
  });

  app.get("/api/results/team/:teamId/round/:roundId/products", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId, roundId } = req.params;

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      if (user.role === "professor") {
        const classData = await storage.getClass(team.classId);
        if (!classData || classData.professorId !== user.id) {
          return res.status(403).json({ error: "Acesso negado - não é sua turma" });
        }
      } else {
        const userTeam = await storage.getTeamByUser(req.session.userId);
        if (!userTeam || userTeam.id !== teamId) {
          return res.status(403).json({ error: "Acesso negado - você não está nesta equipe" });
        }
      }

      const productResults = await storage.getProductResultsByTeamAndRound(teamId, roundId);
      res.json(productResults);
    } catch (error: any) {
      console.error("Erro ao buscar resultados por produto:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar resultados" });
    }
  });

  app.get("/api/results/team/:teamId/round/:roundId/consolidated", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    try {
      const { teamId, roundId } = req.params;

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Equipe não encontrada" });
      }

      if (user.role === "professor") {
        const classData = await storage.getClass(team.classId);
        if (!classData || classData.professorId !== user.id) {
          return res.status(403).json({ error: "Acesso negado - não é sua turma" });
        }
      } else {
        const userTeam = await storage.getTeamByUser(req.session.userId);
        if (!userTeam || userTeam.id !== teamId) {
          return res.status(403).json({ error: "Acesso negado - você não está nesta equipe" });
        }
      }

      const result = await storage.getResult(teamId, roundId);
      if (!result) {
        return res.status(404).json({ error: "Resultado consolidado não encontrado" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Erro ao buscar resultado consolidado:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar resultado" });
    }
  });

  const httpServer = createServer(app);
  
  const { createRoundScheduler } = await import("./services/roundScheduler");
  const roundScheduler = createRoundScheduler(storage);
  roundScheduler.startScheduler(60000);
  
  return httpServer;
}
