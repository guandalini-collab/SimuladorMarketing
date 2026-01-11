import {
  type User,
  type InsertUser,
  type Class,
  type InsertClass,
  type Team,
  type InsertTeam,
  type Round,
  type InsertRound,
  type Campaign,
  type InsertCampaign,
  type MarketingMix,
  type InsertMarketingMix,
  type MarketEvent,
  type InsertMarketEvent,
  type Result,
  type InsertResult,
  type SwotAnalysis,
  type InsertSwot,
  type PorterAnalysis,
  type InsertPorter,
  type BcgAnalysis,
  type InsertBcg,
  type PestelAnalysis,
  type InsertPestel,
  type EconomicData,
  type InsertEconomicData,
  type AutoEventConfig,
  type InsertAutoEventConfig,
  type AiFeedback,
  type InsertAiFeedback,
  type StrategicRecommendations,
  type InsertStrategicRecommendations,
  type Product,
  type InsertProduct,
  type ProductResult,
  type InsertProductResult,
  type Midia,
  type InsertMidia,
  type TeamProduct,
  type InsertTeamProduct,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface TeamResultData {
  result: Result;
  team: {
    id: string;
    name: string;
    classId: string;
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  getStudentsByProfessorClasses(professorId: string): Promise<User[]>;
  getAvailableStudentsForEnrollment(): Promise<User[]>;
  removeDuplicateUsers(): Promise<void>;
  updateUserStatus(userId: string, status: string): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<any>;
  getPasswordResetToken(token: string): Promise<any>;
  deletePasswordResetToken(token: string): Promise<void>;
  
  getClass(id: string): Promise<Class | undefined>;
  getAllClasses(): Promise<Class[]>;
  getClassesByProfessor(professorId: string): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, data: Partial<Class>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;
  
  addStudentToClass(classId: string, studentId: string): Promise<void>;
  removeStudentFromClass(classId: string, studentId: string): Promise<void>;
  getStudentsByClass(classId: string): Promise<User[]>;
  getClassByStudent(studentId: string): Promise<Class | undefined>;
  
  getTeam(id: string): Promise<Team | undefined>;
  getTeamsByClass(classId: string): Promise<Team[]>;
  getTeamByUser(userId: string): Promise<Team | undefined>;
  createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team>;
  addMemberToTeam(teamId: string, userId: string): Promise<Team | undefined>;
  removeMemberFromTeam(teamId: string, userId: string): Promise<Team | undefined>;
  updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined>;
  updateTeamLeader(teamId: string, leaderId: string): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<boolean>;
  getAllTeams(): Promise<Team[]>;
  
  getRound(id: string): Promise<Round | undefined>;
  getRoundsByClass(classId: string): Promise<Round[]>;
  getCurrentRound(classId: string): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: string, data: Partial<Round>): Promise<Round | undefined>;
  getAllRounds(): Promise<Round[]>;
  deleteRound(roundId: string): Promise<boolean>;
  getRoundDependencies(roundId: string): Promise<{ hasDependencies: boolean; details: string[] }>;
  logRoundAccess(roundId: string, classId: string, userId: string, userRole: string, action: string): Promise<void>;
  getRoundAccessLogs(classId: string): Promise<any[]>;
  
  getCampaign(id: string): Promise<Campaign | undefined>;
  getCampaignsByTeamAndRound(teamId: string, roundId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined>;
  getAllCampaigns(): Promise<Campaign[]>;
  
  getMarketingMix(teamId: string, roundId: string, productId?: string): Promise<MarketingMix | undefined>;
  getMarketingMixesByTeamAndRound(teamId: string, roundId: string): Promise<MarketingMix[]>;
  getMarketingMixesByClass(classId: string): Promise<MarketingMix[]>;
  createMarketingMix(mix: InsertMarketingMix): Promise<MarketingMix>;
  updateMarketingMix(id: string, data: Partial<MarketingMix>): Promise<MarketingMix | undefined>;
  getAllMarketingMixes(): Promise<MarketingMix[]>;
  
  getMarketEvent(id: string): Promise<MarketEvent | undefined>;
  getMarketEventsByRound(roundId: string): Promise<MarketEvent[]>;
  createMarketEvent(event: InsertMarketEvent): Promise<MarketEvent>;
  updateMarketEvent(id: string, data: Partial<MarketEvent>): Promise<MarketEvent | undefined>;
  getAllMarketEvents(): Promise<MarketEvent[]>;
  
  getResult(teamId: string, roundId: string): Promise<Result | undefined>;
  getResultsByRound(roundId: string): Promise<Result[]>;
  getResultsByClassAndRound(classId: string, roundId: string): Promise<TeamResultData[]>;
  getPreviousRoundResult(teamId: string, currentRoundId: string): Promise<Result | undefined>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: string, data: Partial<Result>): Promise<Result | undefined>;
  getAllResults(): Promise<Result[]>;
  
  getSwotAnalysis(teamId: string, roundId: string, productId?: string): Promise<SwotAnalysis | undefined>;
  getSwotAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<SwotAnalysis[]>;
  createSwotAnalysis(swot: InsertSwot & { teamId: string }): Promise<SwotAnalysis>;
  updateSwotAnalysis(id: string, data: Partial<SwotAnalysis>): Promise<SwotAnalysis | undefined>;
  
  getPorterAnalysis(teamId: string, roundId: string, productId?: string): Promise<PorterAnalysis | undefined>;
  getPorterAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<PorterAnalysis[]>;
  createPorterAnalysis(porter: InsertPorter & { teamId: string }): Promise<PorterAnalysis>;
  updatePorterAnalysis(id: string, data: Partial<PorterAnalysis>): Promise<PorterAnalysis | undefined>;
  
  getBcgAnalyses(teamId: string, roundId: string): Promise<BcgAnalysis[]>;
  getBcgAnalysis(teamId: string, roundId: string, productId?: string): Promise<BcgAnalysis | undefined>;
  getBcgAnalysisById(id: string): Promise<BcgAnalysis | undefined>;
  createBcgAnalysis(bcg: InsertBcg & { teamId: string }): Promise<BcgAnalysis>;
  updateBcgAnalysis(id: string, data: Partial<BcgAnalysis>): Promise<BcgAnalysis | undefined>;
  deleteBcgAnalysis(id: string): Promise<boolean>;
  
  getPestelAnalysis(teamId: string, roundId: string, productId?: string): Promise<PestelAnalysis | undefined>;
  getPestelAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<PestelAnalysis[]>;
  createPestelAnalysis(pestel: InsertPestel & { teamId: string }): Promise<PestelAnalysis>;
  updatePestelAnalysis(id: string, data: Partial<PestelAnalysis>): Promise<PestelAnalysis | undefined>;
  
  getLatestEconomicData(): Promise<EconomicData | undefined>;
  createEconomicData(data: InsertEconomicData): Promise<EconomicData>;
  getAllEconomicData(limit?: number): Promise<EconomicData[]>;
  
  getAutoEventConfig(classId: string): Promise<AutoEventConfig | undefined>;
  createAutoEventConfig(config: InsertAutoEventConfig): Promise<AutoEventConfig>;
  updateAutoEventConfig(classId: string, data: Partial<AutoEventConfig>): Promise<AutoEventConfig | undefined>;
  
  getAiFeedback(teamId: string, roundId: string): Promise<AiFeedback | undefined>;
  getAiFeedbacksByTeam(teamId: string): Promise<AiFeedback[]>;
  getAiFeedbacksByRound(roundId: string): Promise<AiFeedback[]>;
  createAiFeedback(feedback: InsertAiFeedback): Promise<AiFeedback>;
  deleteAiFeedback(teamId: string, roundId: string): Promise<boolean>;
  getAllAiFeedbacks(): Promise<AiFeedback[]>;
  
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  getPasswordResetTokenByToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;
  setTemporaryPassword(userId: string, hashedTempPassword: string, expiryDate: Date): Promise<void>;
  clearTemporaryPassword(userId: string): Promise<void>;
  updatePasswordAndClearTemporary(userId: string, newHashedPassword: string): Promise<void>;
  
  getStrategicRecommendations(teamId: string, roundId: string, productId?: string): Promise<StrategicRecommendations | undefined>;
  getStrategicRecommendationsByTeamAndRound(teamId: string, roundId: string): Promise<StrategicRecommendations[]>;
  createStrategicRecommendations(recommendations: InsertStrategicRecommendations & { teamId: string }): Promise<StrategicRecommendations>;
  updateStrategicRecommendations(id: string, data: Partial<StrategicRecommendations>): Promise<StrategicRecommendations | undefined>;
  
  getProduct(id: string): Promise<Product | undefined>;
  getProductsBySector(sectorId: string): Promise<Product[]>;
  getProductsByClass(classId: string): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  getProductResult(teamId: string, roundId: string, productId: string): Promise<ProductResult | undefined>;
  getProductResultsByTeamAndRound(teamId: string, roundId: string): Promise<ProductResult[]>;
  getProductResultsByRound(roundId: string): Promise<ProductResult[]>;
  createProductResult(result: InsertProductResult): Promise<ProductResult>;
  updateProductResult(id: string, data: Partial<ProductResult>): Promise<ProductResult | undefined>;
  getAllProductResults(): Promise<ProductResult[]>;
  
  getAllMidias(): Promise<Midia[]>;
  getMidiasByCategoria(categoria: string): Promise<Midia[]>;
  getMidia(id: string): Promise<Midia | undefined>;
  
  getTeamProduct(teamId: string, roundId: string, productId: string): Promise<TeamProduct | undefined>;
  getTeamProductsByTeamAndRound(teamId: string, roundId: string): Promise<TeamProduct[]>;
  createTeamProduct(teamProduct: InsertTeamProduct): Promise<TeamProduct>;
  updateTeamProduct(id: string, data: Partial<TeamProduct>): Promise<TeamProduct | undefined>;
  
  // Reset all team decisions for a round
  resetTeamDecisions(teamId: string, roundId: string): Promise<{ deletedAnalyses: number; deletedMixes: number; deletedProducts: number }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private classes: Map<string, Class>;
  private classStudentsByClass: Map<string, Set<string>>;
  private studentToClass: Map<string, string>;
  private teams: Map<string, Team>;
  private rounds: Map<string, Round>;
  private campaigns: Map<string, Campaign>;
  private marketingMixes: Map<string, MarketingMix>;
  private marketEvents: Map<string, MarketEvent>;
  private results: Map<string, Result>;
  private swotAnalyses: Map<string, SwotAnalysis>;
  private porterAnalyses: Map<string, PorterAnalysis>;
  private bcgAnalyses: Map<string, BcgAnalysis>;
  private pestelAnalyses: Map<string, PestelAnalysis>;
  private economicDataList: Map<string, EconomicData>;
  private autoEventConfigs: Map<string, AutoEventConfig>;
  private aiFeedbacks: Map<string, AiFeedback>;
  private passwordResetTokens: Map<string, { userId: string; expiresAt: Date }>;
  private strategicRecommendations: Map<string, StrategicRecommendations>;
  private products: Map<string, Product>;
  private productResults: Map<string, ProductResult>;
  private midias: Map<string, Midia>;
  private teamProducts: Map<string, TeamProduct>;
  private roundAccessLogs: Map<string, any[]>;
  private professorSeeded: Promise<void>;

  constructor() {
    this.users = new Map();
    this.classes = new Map();
    this.classStudentsByClass = new Map();
    this.studentToClass = new Map();
    this.teams = new Map();
    this.rounds = new Map();
    this.campaigns = new Map();
    this.marketingMixes = new Map();
    this.marketEvents = new Map();
    this.results = new Map();
    this.swotAnalyses = new Map();
    this.porterAnalyses = new Map();
    this.bcgAnalyses = new Map();
    this.pestelAnalyses = new Map();
    this.economicDataList = new Map();
    this.autoEventConfigs = new Map();
    this.aiFeedbacks = new Map();
    this.passwordResetTokens = new Map();
    this.strategicRecommendations = new Map();
    this.products = new Map();
    this.productResults = new Map();
    this.midias = new Map();
    this.teamProducts = new Map();
    this.roundAccessLogs = new Map();
    
    this.professorSeeded = this.seedData();
  }
  
  private async seedData() {
    const bcrypt = await import("bcryptjs");
    
    const professorId = randomUUID();
    const professorPassword = await bcrypt.hash("senhaSegura123", 10);
    
    const professor: User = {
      id: professorId,
      email: "alexandre.bossa@iffarroupilha.edu.br",
      password: professorPassword,
      name: "Prof Alexandre Bossa",
      role: "professor",
      status: "approved",
      temporaryPassword: null,
      temporaryPasswordExpiry: null,
      mustChangePassword: false,
      recoveryCodeHash: null,
    };
    
    this.users.set(professorId, professor);
    
    const defaultClassId = randomUUID();
    const defaultClass: Class = {
      id: defaultClassId,
      name: "Turma de Marketing 2025.1",
      professorId: professorId,
      currentRound: 0,
      maxRounds: 10,
      defaultBudget: 100000,
      sector: null,
      businessType: null,
      marketSize: null,
      marketGrowthRate: null,
      competitionLevel: null,
      numberOfCompetitors: null,
      marketConcentration: null,
      competitorStrength: null,
      targetConsumers: null,
      createdAt: new Date(),
    };
    
    this.classes.set(defaultClassId, defaultClass);
    
    const studentId = randomUUID();
    const studentPassword = await bcrypt.hash("aluno123", 10);
    
    const student: User = {
      id: studentId,
      email: "aluno.demo@iffarroupilha.edu.br",
      password: studentPassword,
      name: "Equipe Demonstração",
      role: "equipe",
      status: "approved",
      temporaryPassword: null,
      temporaryPasswordExpiry: null,
      mustChangePassword: false,
      recoveryCodeHash: null,
    };
    
    this.users.set(studentId, student);
    
    const teamId = randomUUID();
    const team: Team = {
      id: teamId,
      name: "Equipe Demonstração",
      classId: defaultClassId,
      memberIds: [studentId],
      leaderId: studentId,
      initialBudget: 100000,
      budget: 100000,
      companyName: null,
      slogan: null,
      logoUrl: null,
      productCategory: null,
      targetAudienceClass: null,
      targetAudienceAge: null,
      targetAudienceProfile: null,
      createdAt: new Date(),
    };
    
    this.teams.set(teamId, team);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.professorSeeded;
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      status: insertUser.status || "approved",
      temporaryPassword: insertUser.temporaryPassword ?? null,
      temporaryPasswordExpiry: insertUser.temporaryPasswordExpiry ?? null,
      mustChangePassword: insertUser.mustChangePassword ?? false,
      recoveryCodeHash: insertUser.recoveryCodeHash ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async getPasswordResetToken(token: string): Promise<any> {
    const data = this.passwordResetTokens.get(token);
    if (!data) return undefined;
    if (data.expiresAt < new Date()) {
      this.passwordResetTokens.delete(token);
      return undefined;
    }
    return { userId: data.userId, expiresAt: data.expiresAt };
  }

  async getClass(id: string): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getAllClasses(): Promise<Class[]> {
    return Array.from(this.classes.values());
  }

  async getClassesByProfessor(professorId: string): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      cls => cls.professorId === professorId
    );
  }

  async createClass(insertClass: InsertClass): Promise<Class> {
    const id = randomUUID();
    const classData: Class = {
      id,
      name: insertClass.name,
      professorId: insertClass.professorId,
      maxRounds: insertClass.maxRounds ?? 10,
      currentRound: 0,
      defaultBudget: insertClass.defaultBudget ?? 100000,
      sector: insertClass.sector ?? null,
      businessType: insertClass.businessType ?? null,
      marketSize: insertClass.marketSize ?? null,
      marketGrowthRate: insertClass.marketGrowthRate ?? null,
      competitionLevel: insertClass.competitionLevel ?? null,
      numberOfCompetitors: insertClass.numberOfCompetitors ?? null,
      marketConcentration: insertClass.marketConcentration ?? null,
      competitorStrength: insertClass.competitorStrength ?? null,
      targetConsumers: insertClass.targetConsumers ?? null,
      createdAt: new Date(),
    };
    this.classes.set(id, classData);
    return classData;
  }

  async updateClass(id: string, data: Partial<Class>): Promise<Class | undefined> {
    const existing = this.classes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.classes.set(id, updated);
    return updated;
  }

  async deleteClass(id: string): Promise<boolean> {
    const classData = this.classes.get(id);
    if (!classData) return false;
    
    const teams = Array.from(this.teams.values()).filter(t => t.classId === id);
    for (const team of teams) {
      await this.deleteTeam(team.id);
    }
    
    const rounds = Array.from(this.rounds.values()).filter(r => r.classId === id);
    for (const round of rounds) {
      this.rounds.delete(round.id);
    }
    
    const events = Array.from(this.marketEvents.values()).filter(e => e.classId === id);
    for (const event of events) {
      this.marketEvents.delete(event.id);
    }
    
    const studentIds = this.classStudentsByClass.get(id);
    if (studentIds) {
      for (const studentId of Array.from(studentIds)) {
        this.studentToClass.delete(studentId);
      }
      this.classStudentsByClass.delete(id);
    }
    
    this.classes.delete(id);
    return true;
  }

  async addStudentToClass(classId: string, studentId: string): Promise<void> {
    const classData = this.classes.get(classId);
    if (!classData) {
      throw new Error('Turma não encontrada');
    }
    
    const user = this.users.get(studentId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    if (user.role !== 'equipe') {
      throw new Error('Apenas alunos podem ser matriculados em turmas');
    }
    
    const currentClass = this.studentToClass.get(studentId);
    if (currentClass) {
      throw new Error('Aluno já está matriculado em outra turma. Remova-o primeiro.');
    }
    
    let students = this.classStudentsByClass.get(classId);
    if (!students) {
      students = new Set<string>();
      this.classStudentsByClass.set(classId, students);
    }
    
    if (students.has(studentId)) {
      throw new Error('Aluno já está matriculado nesta turma');
    }
    
    students.add(studentId);
    this.studentToClass.set(studentId, classId);
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const students = this.classStudentsByClass.get(classId);
    if (!students || !students.has(studentId)) {
      throw new Error('Aluno não está matriculado nesta turma');
    }
    
    const allTeams = Array.from(this.teams.values());
    for (const team of allTeams) {
      if (team.classId === classId && team.memberIds.includes(studentId)) {
        await this.removeMemberFromTeam(team.id, studentId);
      }
    }
    
    students.delete(studentId);
    this.studentToClass.delete(studentId);
    
    if (students.size === 0) {
      this.classStudentsByClass.delete(classId);
    }
  }

  async getStudentsByClass(classId: string): Promise<User[]> {
    const studentIds = this.classStudentsByClass.get(classId);
    if (!studentIds) {
      return [];
    }
    
    const users: User[] = [];
    for (const studentId of Array.from(studentIds)) {
      const user = this.users.get(studentId);
      if (user) {
        users.push(user);
      }
    }
    
    return users;
  }

  async getClassByStudent(studentId: string): Promise<Class | undefined> {
    const classId = this.studentToClass.get(studentId);
    if (!classId) {
      return undefined;
    }
    
    return this.classes.get(classId);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByClass(classId: string): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      team => team.classId === classId
    );
  }

  async getTeamByUser(userId: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(
      team => team.memberIds.includes(userId)
    );
  }

  async createTeam(insertTeam: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const id = randomUUID();
    const team: Team = {
      ...insertTeam,
      id,
      createdAt: new Date(),
    };
    this.teams.set(id, team);
    return team;
  }

  async addMemberToTeam(teamId: string, userId: string): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team) return undefined;
    
    if (!team.memberIds.includes(userId)) {
      team.memberIds = [...team.memberIds, userId];
      this.teams.set(teamId, team);
    }
    
    return team;
  }

  async removeMemberFromTeam(teamId: string, userId: string): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team) return undefined;
    
    // Remove o usuário dos membros
    team.memberIds = team.memberIds.filter(id => id !== userId);
    
    // Se o líder foi removido e ainda há membros, promove o próximo
    if (team.leaderId === userId && team.memberIds.length > 0) {
      team.leaderId = team.memberIds[0];
    }
    
    // Se não há mais membros, limpa o líder mas mantém a equipe
    if (team.memberIds.length === 0) {
      team.leaderId = null as any; // Mantém equipe vazia para preservar histórico
    }
    
    this.teams.set(teamId, team);
    return team;
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined> {
    const existing = this.teams.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.teams.set(id, updated);
    return updated;
  }

  async updateTeamLeader(teamId: string, leaderId: string): Promise<Team | undefined> {
    const team = this.teams.get(teamId);
    if (!team) return undefined;
    const updated = { ...team, leaderId };
    this.teams.set(teamId, updated);
    return updated;
  }

  async deleteTeam(id: string): Promise<boolean> {
    const team = this.teams.get(id);
    if (!team) return false;
    
    const mixes = Array.from(this.marketingMixes.values()).filter(m => m.teamId === id);
    for (const mix of mixes) {
      this.marketingMixes.delete(mix.id);
    }
    
    const campaigns = Array.from(this.campaigns.values()).filter(c => c.teamId === id);
    for (const campaign of campaigns) {
      this.campaigns.delete(campaign.id);
    }
    
    const results = Array.from(this.results.values()).filter(r => r.teamId === id);
    for (const result of results) {
      this.results.delete(result.id);
    }
    
    const swots = Array.from(this.swotAnalyses.values()).filter(s => s.teamId === id);
    for (const swot of swots) {
      this.swotAnalyses.delete(swot.id);
    }
    
    const porters = Array.from(this.porterAnalyses.values()).filter(p => p.teamId === id);
    for (const porter of porters) {
      this.porterAnalyses.delete(porter.id);
    }
    
    const bcgs = Array.from(this.bcgAnalyses.values()).filter(b => b.teamId === id);
    for (const bcg of bcgs) {
      this.bcgAnalyses.delete(bcg.id);
    }
    
    const pestels = Array.from(this.pestelAnalyses.values()).filter(p => p.teamId === id);
    for (const pestel of pestels) {
      this.pestelAnalyses.delete(pestel.id);
    }
    
    this.teams.delete(id);
    return true;
  }

  async getRound(id: string): Promise<Round | undefined> {
    return this.rounds.get(id);
  }

  async getRoundsByClass(classId: string): Promise<Round[]> {
    return Array.from(this.rounds.values())
      .filter(round => round.classId === classId)
      .sort((a, b) => a.roundNumber - b.roundNumber);
  }

  async getCurrentRound(classId: string): Promise<Round | undefined> {
    const rounds = await this.getRoundsByClass(classId);
    return rounds.find(r => r.status === "active");
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const id = randomUUID();
    const round: Round = {
      id,
      classId: insertRound.classId,
      roundNumber: insertRound.roundNumber,
      status: insertRound.status ?? "locked",
      startedAt: null,
      endedAt: null,
      scheduledStartAt: insertRound.scheduledStartAt ?? null,
      scheduledEndAt: insertRound.scheduledEndAt ?? null,
      aiAssistanceLevel: insertRound.aiAssistanceLevel ?? 1,
    };
    this.rounds.set(id, round);
    return round;
  }

  async updateRound(id: string, data: Partial<Round>): Promise<Round | undefined> {
    const existing = this.rounds.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.rounds.set(id, updated);
    return updated;
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaignsByTeamAndRound(teamId: string, roundId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      campaign => campaign.teamId === teamId && campaign.roundId === roundId
    );
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      id,
      teamId: insertCampaign.teamId,
      roundId: insertCampaign.roundId,
      name: insertCampaign.name,
      status: insertCampaign.status ?? "planejando",
      budget: insertCampaign.budget,
      channel: insertCampaign.channel,
      duration: insertCampaign.duration,
      targetAudience: insertCampaign.targetAudience,
      reach: 0,
      engagement: 0,
      roi: 0,
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined> {
    const existing = this.campaigns.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.campaigns.set(id, updated);
    return updated;
  }

  async getMarketingMix(teamId: string, roundId: string, productId?: string): Promise<MarketingMix | undefined> {
    const matches = Array.from(this.marketingMixes.values()).filter(
      mix => mix.teamId === teamId && mix.roundId === roundId &&
             (productId !== undefined ? mix.productId === productId : true)
    );
    return matches[0];
  }

  async getMarketingMixesByTeamAndRound(teamId: string, roundId: string): Promise<MarketingMix[]> {
    return Array.from(this.marketingMixes.values()).filter(
      mix => mix.teamId === teamId && mix.roundId === roundId
    );
  }

  async getMarketingMixesByClass(classId: string): Promise<MarketingMix[]> {
    const teams = Array.from(this.teams.values()).filter(t => t.classId === classId);
    const teamIds = teams.map(t => t.id);
    return Array.from(this.marketingMixes.values()).filter(
      mix => teamIds.includes(mix.teamId)
    );
  }

  async createMarketingMix(insertMix: InsertMarketingMix): Promise<MarketingMix> {
    const id = randomUUID();
    const mix: MarketingMix = {
      id,
      teamId: insertMix.teamId,
      roundId: insertMix.roundId,
      productId: insertMix.productId ?? null,
      productQuality: insertMix.productQuality ?? "medio",
      productFeatures: insertMix.productFeatures ?? "basico",
      brandPositioning: insertMix.brandPositioning ?? "qualidade",
      priceStrategy: insertMix.priceStrategy ?? "competitivo",
      priceValue: insertMix.priceValue ?? 50,
      distributionChannels: insertMix.distributionChannels ?? ["varejo"],
      distributionCoverage: insertMix.distributionCoverage ?? "regional",
      promotionMix: insertMix.promotionMix ?? ["digital"],
      promotionIntensity: insertMix.promotionIntensity ?? "medio",
      promotionBudgets: insertMix.promotionBudgets ?? null,
      estimatedCost: insertMix.estimatedCost ?? 0,
      submittedAt: null,
    };
    this.marketingMixes.set(id, mix);
    return mix;
  }

  async updateMarketingMix(id: string, data: Partial<MarketingMix>): Promise<MarketingMix | undefined> {
    const existing = this.marketingMixes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.marketingMixes.set(id, updated);
    return updated;
  }

  async getMarketEvent(id: string): Promise<MarketEvent | undefined> {
    return this.marketEvents.get(id);
  }

  async getMarketEventsByRound(roundId: string): Promise<MarketEvent[]> {
    return Array.from(this.marketEvents.values()).filter(
      event => event.roundId === roundId
    );
  }

  async createMarketEvent(insertEvent: InsertMarketEvent): Promise<MarketEvent> {
    const id = randomUUID();
    const event: MarketEvent = {
      id,
      classId: insertEvent.classId,
      roundId: insertEvent.roundId,
      type: insertEvent.type,
      title: insertEvent.title,
      description: insertEvent.description,
      impact: insertEvent.impact,
      severity: insertEvent.severity,
      active: insertEvent.active ?? false,
      autoGenerated: insertEvent.autoGenerated ?? false,
      createdAt: new Date(),
    };
    this.marketEvents.set(id, event);
    return event;
  }

  async updateMarketEvent(id: string, data: Partial<MarketEvent>): Promise<MarketEvent | undefined> {
    const existing = this.marketEvents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.marketEvents.set(id, updated);
    return updated;
  }

  async getAllUsers(): Promise<User[]> {
    await this.professorSeeded;
    return Array.from(this.users.values());
  }

  async getPendingUsers(): Promise<User[]> {
    await this.professorSeeded;
    return Array.from(this.users.values()).filter(user => user.status === "pending");
  }

  async getStudentsByProfessorClasses(professorId: string): Promise<User[]> {
    await this.professorSeeded;
    // Buscar classes do professor
    const professorClasses = Array.from(this.classes.values()).filter(c => c.professorId === professorId);
    if (professorClasses.length === 0) return [];
    
    const classIds = professorClasses.map(c => c.id);
    const studentIds = new Set<string>();
    
    // Para cada turma, buscar os alunos
    classIds.forEach(classId => {
      const students = this.classStudentsByClass.get(classId);
      if (students) {
        students.forEach(studentId => studentIds.add(studentId));
      }
    });
    
    // Buscar usuários e ordenar alfabeticamente
    const users = Array.from(studentIds)
      .map(id => this.users.get(id))
      .filter((u): u is User => u !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return users;
  }

  async getAvailableStudentsForEnrollment(): Promise<User[]> {
    await this.professorSeeded;
    
    // Coletar todos os IDs de alunos já matriculados em alguma turma
    const enrolledStudentIds = new Set<string>();
    this.classStudentsByClass.forEach((students) => {
      students.forEach(studentId => enrolledStudentIds.add(studentId));
    });
    
    // Buscar todos os alunos aprovados (role='equipe' e status='approved') que NÃO estão matriculados
    const availableStudents = Array.from(this.users.values())
      .filter(u => u.role === 'equipe' && u.status === 'approved' && !enrolledStudentIds.has(u.id))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return availableStudents;
  }

  async removeDuplicateUsers(): Promise<void> {
    await this.professorSeeded;
    
    // Agrupar por email
    const emailMap = new Map<string, User[]>();
    Array.from(this.users.values()).forEach(user => {
      if (!emailMap.has(user.email)) {
        emailMap.set(user.email, []);
      }
      emailMap.get(user.email)!.push(user);
    });
    
    // Coletar IDs referenciados
    const referencedIds = new Set<string>();
    
    // 1. Usuários em class_students
    this.classStudentsByClass.forEach((students, classId) => {
      students.forEach(studentId => referencedIds.add(studentId));
    });
    
    // 2. Usuários em teams
    Array.from(this.teams.values()).forEach(team => {
      team.memberIds.forEach((memberId: string) => referencedIds.add(memberId));
      if (team.leaderId) referencedIds.add(team.leaderId);
    });
    
    // 3. Professores donos de turmas
    Array.from(this.classes.values()).forEach(c => {
      referencedIds.add(c.professorId);
    });
    
    // Para cada email com duplicatas
    emailMap.forEach((userList, email) => {
      if (userList.length <= 1) return;
      
      // Separar referenciados e órfãos
      const active = userList.filter(u => referencedIds.has(u.id));
      
      // Determinar sobreviventes
      const survivors = new Set<string>();
      
      // Manter todos os ativos
      active.forEach(u => survivors.add(u.id));
      
      // Se nenhum ativo, escolher um deterministicamente
      if (survivors.size === 0) {
        const preferred = this.choosePreferredUser(userList);
        survivors.add(preferred.id);
      }
      
      // Deletar não sobreviventes
      userList.filter(u => !survivors.has(u.id)).forEach(user => {
        this.deleteUser(user.id);
      });
    });
  }
  
  private choosePreferredUser(users: User[]): User {
    // Priorizar: 1) professor, 2) menor ID
    const professors = users.filter(u => u.role === 'professor');
    if (professors.length > 0) {
      return professors.sort((a, b) => a.id.localeCompare(b.id))[0];
    }
    return users.sort((a, b) => a.id.localeCompare(b.id))[0];
  }

  async updateUserStatus(userId: string, status: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, status };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const allTeams = Array.from(this.teams.values());
    for (const team of allTeams) {
      if (team.memberIds.includes(userId)) {
        team.memberIds = team.memberIds.filter(id => id !== userId);
        
        if (team.leaderId === userId && team.memberIds.length > 0) {
          team.leaderId = team.memberIds[0];
        } else if (team.leaderId === userId && team.memberIds.length === 0) {
          team.leaderId = null as any;
        }
        
        this.teams.set(team.id, team);
      }
    }
    
    return this.users.delete(userId);
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getAllRounds(): Promise<Round[]> {
    return Array.from(this.rounds.values());
  }

  async deleteRound(roundId: string): Promise<boolean> {
    return this.rounds.delete(roundId);
  }

  async getRoundDependencies(roundId: string): Promise<{ hasDependencies: boolean; details: string[] }> {
    const details: string[] = [];
    
    const campaignCount = Array.from(this.campaigns.values()).filter(c => c.roundId === roundId).length;
    if (campaignCount > 0) details.push(`${campaignCount} campanhas`);
    
    const mixCount = Array.from(this.marketingMixes.values()).filter(m => m.roundId === roundId).length;
    if (mixCount > 0) details.push(`${mixCount} decisões de marketing mix`);
    
    const resultCount = Array.from(this.results.values()).filter(r => r.roundId === roundId).length;
    if (resultCount > 0) details.push(`${resultCount} resultados`);
    
    const eventCount = Array.from(this.marketEvents.values()).filter(e => e.roundId === roundId).length;
    if (eventCount > 0) details.push(`${eventCount} eventos de mercado`);
    
    const swotCount = Array.from(this.swotAnalyses.values()).filter(s => s.roundId === roundId).length;
    if (swotCount > 0) details.push(`${swotCount} análises SWOT`);
    
    const porterCount = Array.from(this.porterAnalyses.values()).filter(p => p.roundId === roundId).length;
    if (porterCount > 0) details.push(`${porterCount} análises Porter`);
    
    const bcgCount = Array.from(this.bcgAnalyses.values()).filter(b => b.roundId === roundId).length;
    if (bcgCount > 0) details.push(`${bcgCount} análises BCG`);
    
    const pestelCount = Array.from(this.pestelAnalyses.values()).filter(p => p.roundId === roundId).length;
    if (pestelCount > 0) details.push(`${pestelCount} análises PESTEL`);
    
    return { hasDependencies: details.length > 0, details };
  }

  async logRoundAccess(roundId: string, classId: string, userId: string, userRole: string, action: string): Promise<void> {
    const logs = this.roundAccessLogs.get(classId) || [];
    const round = await this.getRound(roundId);
    const user = await this.getUser(userId);
    const team = await this.getTeamByUser(userId);
    
    logs.push({
      id: randomUUID(),
      roundId,
      classId,
      userId,
      userRole,
      action,
      roundNumber: round?.roundNumber || 0,
      teamName: team?.name || user?.name || 'Desconhecido',
      timestamp: new Date().toISOString(),
    });
    
    this.roundAccessLogs.set(classId, logs);
  }

  async getRoundAccessLogs(classId: string): Promise<any[]> {
    return this.roundAccessLogs.get(classId) || [];
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values());
  }

  async getAllMarketingMixes(): Promise<MarketingMix[]> {
    return Array.from(this.marketingMixes.values());
  }

  async getAllMarketEvents(): Promise<MarketEvent[]> {
    return Array.from(this.marketEvents.values());
  }

  async getResult(teamId: string, roundId: string): Promise<Result | undefined> {
    return Array.from(this.results.values()).find(
      result => result.teamId === teamId && result.roundId === roundId
    );
  }

  async getResultsByRound(roundId: string): Promise<Result[]> {
    return Array.from(this.results.values()).filter(
      result => result.roundId === roundId
    );
  }

  async getResultsByClassAndRound(classId: string, roundId: string): Promise<TeamResultData[]> {
    const teamsInClass = await this.getTeamsByClass(classId);
    const teamIds = new Set(teamsInClass.map(t => t.id));
    
    const resultsInRound = Array.from(this.results.values()).filter(
      result => result.roundId === roundId && teamIds.has(result.teamId)
    );
    
    return resultsInRound.map(result => {
      const team = teamsInClass.find(t => t.id === result.teamId)!;
      return {
        result,
        team: {
          id: team.id,
          name: team.name,
          classId: team.classId,
        },
      };
    });
  }

  async getPreviousRoundResult(teamId: string, currentRoundId: string): Promise<Result | undefined> {
    const currentRound = await this.getRound(currentRoundId);
    if (!currentRound || currentRound.roundNumber <= 1) {
      return undefined;
    }

    const previousRoundNumber = currentRound.roundNumber - 1;
    const rounds = await this.getRoundsByClass(currentRound.classId);
    const previousRound = rounds.find(r => r.roundNumber === previousRoundNumber);
    
    if (!previousRound) {
      return undefined;
    }

    return this.getResult(teamId, previousRound.id);
  }

  async createResult(insertResult: InsertResult): Promise<Result> {
    const id = randomUUID();
    const result: Result = {
      id,
      teamId: insertResult.teamId,
      roundId: insertResult.roundId,
      revenue: insertResult.revenue ?? 0,
      costs: insertResult.costs ?? 0,
      profit: insertResult.profit ?? 0,
      margin: insertResult.margin ?? 0,
      marketShare: insertResult.marketShare ?? 0,
      roi: insertResult.roi ?? 0,
      brandPerception: insertResult.brandPerception ?? 50,
      customerSatisfaction: insertResult.customerSatisfaction ?? 50,
      customerLoyalty: insertResult.customerLoyalty ?? 50,
      cac: insertResult.cac ?? 0,
      ltv: insertResult.ltv ?? 0,
      taxaConversao: insertResult.taxaConversao ?? 0,
      ticketMedio: insertResult.ticketMedio ?? 0,
      razaoLtvCac: insertResult.razaoLtvCac ?? 0,
      nps: insertResult.nps ?? 0,
      tempoMedioConversao: insertResult.tempoMedioConversao ?? 0,
      margemContribuicao: insertResult.margemContribuicao ?? 0,
      receitaBruta: insertResult.receitaBruta ?? 0,
      receitaLiquida: insertResult.receitaLiquida ?? 0,
      budgetBefore: insertResult.budgetBefore ?? 0,
      profitImpact: insertResult.profitImpact ?? 0,
      budgetAfter: insertResult.budgetAfter ?? 0,
      alignmentScore: insertResult.alignmentScore ?? null,
      alignmentIssues: insertResult.alignmentIssues ?? [],
      financialBreakdown: insertResult.financialBreakdown ?? null,
      simulationBreakdown: insertResult.simulationBreakdown ?? null,
      competitorResponse: insertResult.competitorResponse ?? null,
      eventImpacts: insertResult.eventImpacts ?? null,
      engineVersion: insertResult.engineVersion ?? null,
      impostos: insertResult.impostos ?? 0,
      devolucoes: insertResult.devolucoes ?? 0,
      descontos: insertResult.descontos ?? 0,
      cpv: insertResult.cpv ?? 0,
      lucroBruto: insertResult.lucroBruto ?? 0,
      despesasVendas: insertResult.despesasVendas ?? 0,
      despesasAdmin: insertResult.despesasAdmin ?? 0,
      despesasFinanc: insertResult.despesasFinanc ?? 0,
      outrasDespesas: insertResult.outrasDespesas ?? 0,
      ebitda: insertResult.ebitda ?? 0,
      depreciacao: insertResult.depreciacao ?? 0,
      lair: insertResult.lair ?? 0,
      irCsll: insertResult.irCsll ?? 0,
      lucroLiquido: insertResult.lucroLiquido ?? 0,
      caixa: insertResult.caixa ?? 0,
      contasReceber: insertResult.contasReceber ?? 0,
      estoques: insertResult.estoques ?? 0,
      ativoCirculante: insertResult.ativoCirculante ?? 0,
      imobilizado: insertResult.imobilizado ?? 0,
      intangivel: insertResult.intangivel ?? 0,
      ativoNaoCirculante: insertResult.ativoNaoCirculante ?? 0,
      ativoTotal: insertResult.ativoTotal ?? 0,
      fornecedores: insertResult.fornecedores ?? 0,
      obrigFiscais: insertResult.obrigFiscais ?? 0,
      outrasObrig: insertResult.outrasObrig ?? 0,
      passivoCirculante: insertResult.passivoCirculante ?? 0,
      financiamentosLP: insertResult.financiamentosLP ?? 0,
      passivoNaoCirculante: insertResult.passivoNaoCirculante ?? 0,
      capitalSocial: insertResult.capitalSocial ?? 0,
      lucrosAcumulados: insertResult.lucrosAcumulados ?? 0,
      patrimonioLiquido: insertResult.patrimonioLiquido ?? 0,
      passivoPlTotal: insertResult.passivoPlTotal ?? 0,
      calculatedAt: new Date(),
    };
    this.results.set(id, result);
    return result;
  }

  async updateResult(id: string, data: Partial<Result>): Promise<Result | undefined> {
    const existing = this.results.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.results.set(id, updated);
    return updated;
  }

  async getAllResults(): Promise<Result[]> {
    return Array.from(this.results.values());
  }

  async getSwotAnalysis(teamId: string, roundId: string, productId?: string): Promise<SwotAnalysis | undefined> {
    const matches = Array.from(this.swotAnalyses.values()).filter(
      swot => swot.teamId === teamId && swot.roundId === roundId &&
              (productId !== undefined ? swot.productId === productId : true)
    );
    return matches[0];
  }

  async getSwotAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<SwotAnalysis[]> {
    return Array.from(this.swotAnalyses.values()).filter(
      swot => swot.teamId === teamId && swot.roundId === roundId
    );
  }

  async createSwotAnalysis(insertSwot: InsertSwot & { teamId: string }): Promise<SwotAnalysis> {
    const id = randomUUID();
    const swot: SwotAnalysis = {
      id,
      teamId: insertSwot.teamId,
      roundId: insertSwot.roundId,
      productId: insertSwot.productId ?? null,
      strengths: insertSwot.strengths ?? [],
      weaknesses: insertSwot.weaknesses ?? [],
      opportunities: insertSwot.opportunities ?? [],
      threats: insertSwot.threats ?? [],
      aiGeneratedPercentage: insertSwot.aiGeneratedPercentage ?? 0,
      originalAIContent: insertSwot.originalAIContent ?? null,
      editedByUser: insertSwot.editedByUser ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.swotAnalyses.set(id, swot);
    return swot;
  }

  async updateSwotAnalysis(id: string, data: Partial<SwotAnalysis>): Promise<SwotAnalysis | undefined> {
    const existing = this.swotAnalyses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.swotAnalyses.set(id, updated);
    return updated;
  }

  async getPorterAnalysis(teamId: string, roundId: string, productId?: string): Promise<PorterAnalysis | undefined> {
    const matches = Array.from(this.porterAnalyses.values()).filter(
      porter => porter.teamId === teamId && porter.roundId === roundId &&
                (productId !== undefined ? porter.productId === productId : true)
    );
    return matches[0];
  }

  async getPorterAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<PorterAnalysis[]> {
    return Array.from(this.porterAnalyses.values()).filter(
      porter => porter.teamId === teamId && porter.roundId === roundId
    );
  }

  async createPorterAnalysis(insertPorter: InsertPorter & { teamId: string }): Promise<PorterAnalysis> {
    const id = randomUUID();
    const porter: PorterAnalysis = {
      id,
      teamId: insertPorter.teamId,
      roundId: insertPorter.roundId,
      productId: insertPorter.productId ?? null,
      competitiveRivalry: insertPorter.competitiveRivalry ?? 5,
      supplierPower: insertPorter.supplierPower ?? 5,
      buyerPower: insertPorter.buyerPower ?? 5,
      threatOfSubstitutes: insertPorter.threatOfSubstitutes ?? 5,
      threatOfNewEntry: insertPorter.threatOfNewEntry ?? 5,
      rivalryNotes: insertPorter.rivalryNotes ?? null,
      supplierNotes: insertPorter.supplierNotes ?? null,
      buyerNotes: insertPorter.buyerNotes ?? null,
      substitutesNotes: insertPorter.substitutesNotes ?? null,
      newEntryNotes: insertPorter.newEntryNotes ?? null,
      aiGeneratedPercentage: insertPorter.aiGeneratedPercentage ?? 0,
      originalAIContent: insertPorter.originalAIContent ?? null,
      editedByUser: insertPorter.editedByUser ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.porterAnalyses.set(id, porter);
    return porter;
  }

  async updatePorterAnalysis(id: string, data: Partial<PorterAnalysis>): Promise<PorterAnalysis | undefined> {
    const existing = this.porterAnalyses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.porterAnalyses.set(id, updated);
    return updated;
  }

  async getBcgAnalyses(teamId: string, roundId: string): Promise<BcgAnalysis[]> {
    return Array.from(this.bcgAnalyses.values()).filter(
      bcg => bcg.teamId === teamId && bcg.roundId === roundId
    );
  }

  async getBcgAnalysis(teamId: string, roundId: string, productId?: string): Promise<BcgAnalysis | undefined> {
    const matches = Array.from(this.bcgAnalyses.values()).filter(
      bcg => bcg.teamId === teamId && bcg.roundId === roundId &&
             (productId !== undefined ? bcg.productId === productId : true)
    );
    return matches[0];
  }

  async getBcgAnalysisById(id: string): Promise<BcgAnalysis | undefined> {
    return this.bcgAnalyses.get(id);
  }

  async createBcgAnalysis(insertBcg: InsertBcg & { teamId: string }): Promise<BcgAnalysis> {
    const id = randomUUID();
    const bcg: BcgAnalysis = {
      id,
      teamId: insertBcg.teamId,
      roundId: insertBcg.roundId,
      productId: insertBcg.productId ?? null,
      productName: insertBcg.productName,
      marketGrowth: insertBcg.marketGrowth,
      relativeMarketShare: insertBcg.relativeMarketShare,
      quadrant: insertBcg.quadrant,
      notes: insertBcg.notes ?? null,
      aiGeneratedPercentage: insertBcg.aiGeneratedPercentage ?? 0,
      originalAIContent: insertBcg.originalAIContent ?? null,
      editedByUser: insertBcg.editedByUser ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.bcgAnalyses.set(id, bcg);
    return bcg;
  }

  async updateBcgAnalysis(id: string, data: Partial<BcgAnalysis>): Promise<BcgAnalysis | undefined> {
    const existing = this.bcgAnalyses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.bcgAnalyses.set(id, updated);
    return updated;
  }

  async deleteBcgAnalysis(id: string): Promise<boolean> {
    return this.bcgAnalyses.delete(id);
  }

  async getPestelAnalysis(teamId: string, roundId: string, productId?: string): Promise<PestelAnalysis | undefined> {
    const matches = Array.from(this.pestelAnalyses.values()).filter(
      pestel => pestel.teamId === teamId && pestel.roundId === roundId &&
                (productId !== undefined ? pestel.productId === productId : true)
    );
    return matches[0];
  }

  async getPestelAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<PestelAnalysis[]> {
    return Array.from(this.pestelAnalyses.values()).filter(
      pestel => pestel.teamId === teamId && pestel.roundId === roundId
    );
  }

  async createPestelAnalysis(insertPestel: InsertPestel & { teamId: string }): Promise<PestelAnalysis> {
    const id = randomUUID();
    const pestel: PestelAnalysis = {
      id,
      teamId: insertPestel.teamId,
      roundId: insertPestel.roundId,
      productId: insertPestel.productId ?? null,
      political: insertPestel.political ?? [],
      economic: insertPestel.economic ?? [],
      social: insertPestel.social ?? [],
      technological: insertPestel.technological ?? [],
      environmental: insertPestel.environmental ?? [],
      legal: insertPestel.legal ?? [],
      aiGeneratedPercentage: insertPestel.aiGeneratedPercentage ?? 0,
      originalAIContent: insertPestel.originalAIContent ?? null,
      editedByUser: insertPestel.editedByUser ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pestelAnalyses.set(id, pestel);
    return pestel;
  }

  async updatePestelAnalysis(id: string, data: Partial<PestelAnalysis>): Promise<PestelAnalysis | undefined> {
    const existing = this.pestelAnalyses.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.pestelAnalyses.set(id, updated);
    return updated;
  }

  async getLatestEconomicData(): Promise<EconomicData | undefined> {
    const allData = Array.from(this.economicDataList.values());
    if (allData.length === 0) return undefined;
    return allData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async createEconomicData(data: InsertEconomicData): Promise<EconomicData> {
    const id = randomUUID();
    const economicData: EconomicData = {
      id,
      date: data.date || new Date(),
      exchangeRateUSD: data.exchangeRateUSD,
      exchangeRateTrend: data.exchangeRateTrend || null,
      inflationRate: data.inflationRate || null,
      interestRate: data.interestRate || null,
      gdpGrowth: data.gdpGrowth || null,
      consumerConfidence: data.consumerConfidence || null,
      source: data.source || "api",
      createdAt: new Date(),
    };
    this.economicDataList.set(id, economicData);
    return economicData;
  }

  async getAllEconomicData(limit?: number): Promise<EconomicData[]> {
    const allData = Array.from(this.economicDataList.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? allData.slice(0, limit) : allData;
  }

  async getAutoEventConfig(classId: string): Promise<AutoEventConfig | undefined> {
    return Array.from(this.autoEventConfigs.values()).find(
      config => config.classId === classId
    );
  }

  async createAutoEventConfig(config: InsertAutoEventConfig): Promise<AutoEventConfig> {
    const id = randomUUID();
    const autoEventConfig: AutoEventConfig = {
      id,
      classId: config.classId,
      enabled: config.enabled ?? false,
      eventFrequency: config.eventFrequency ?? "every_round",
      minEventsPerRound: config.minEventsPerRound ?? 1,
      maxEventsPerRound: config.maxEventsPerRound ?? 3,
      economicWeight: config.economicWeight ?? 0.4,
      technologicalWeight: config.technologicalWeight ?? 0.2,
      socialWeight: config.socialWeight ?? 0.2,
      competitiveWeight: config.competitiveWeight ?? 0.2,
      updatedAt: new Date(),
    };
    this.autoEventConfigs.set(id, autoEventConfig);
    return autoEventConfig;
  }

  async updateAutoEventConfig(classId: string, data: Partial<AutoEventConfig>): Promise<AutoEventConfig | undefined> {
    const existing = await this.getAutoEventConfig(classId);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.autoEventConfigs.set(existing.id, updated);
    return updated;
  }

  async getAiFeedback(teamId: string, roundId: string): Promise<AiFeedback | undefined> {
    return Array.from(this.aiFeedbacks.values()).find(
      feedback => feedback.teamId === teamId && feedback.roundId === roundId
    );
  }

  async getAiFeedbacksByTeam(teamId: string): Promise<AiFeedback[]> {
    return Array.from(this.aiFeedbacks.values())
      .filter(feedback => feedback.teamId === teamId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAiFeedbacksByRound(roundId: string): Promise<AiFeedback[]> {
    return Array.from(this.aiFeedbacks.values())
      .filter(feedback => feedback.roundId === roundId);
  }

  async createAiFeedback(feedback: InsertAiFeedback): Promise<AiFeedback> {
    const id = randomUUID();
    const aiFeedback: AiFeedback = {
      id,
      teamId: feedback.teamId,
      roundId: feedback.roundId,
      overallAnalysis: feedback.overallAnalysis,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      suggestions: feedback.suggestions,
      literatureRecommendations: feedback.literatureRecommendations,
      createdAt: new Date(),
    };
    this.aiFeedbacks.set(id, aiFeedback);
    return aiFeedback;
  }

  async deleteAiFeedback(teamId: string, roundId: string): Promise<boolean> {
    const existing = await this.getAiFeedback(teamId, roundId);
    if (!existing) return false;
    return this.aiFeedbacks.delete(existing.id);
  }

  async getAllAiFeedbacks(): Promise<AiFeedback[]> {
    return Array.from(this.aiFeedbacks.values());
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    this.passwordResetTokens.set(token, { userId, expiresAt });
  }

  async getPasswordResetTokenByToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    return this.passwordResetTokens.get(token);
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    this.passwordResetTokens.delete(token);
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = hashedPassword;
      this.users.set(userId, user);
    }
  }

  async setTemporaryPassword(userId: string, hashedTempPassword: string, expiryDate: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.temporaryPassword = hashedTempPassword;
      user.temporaryPasswordExpiry = expiryDate;
      user.mustChangePassword = true;
      this.users.set(userId, user);
    }
  }

  async clearTemporaryPassword(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.temporaryPassword = null as any;
      user.temporaryPasswordExpiry = null as any;
      user.mustChangePassword = false;
      this.users.set(userId, user);
    }
  }

  async updatePasswordAndClearTemporary(userId: string, newHashedPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = newHashedPassword;
      user.temporaryPassword = null as any;
      user.temporaryPasswordExpiry = null as any;
      user.mustChangePassword = false;
      this.users.set(userId, user);
    }
  }

  async getStrategicRecommendations(teamId: string, roundId: string, productId?: string): Promise<StrategicRecommendations | undefined> {
    const matches = Array.from(this.strategicRecommendations.values()).filter(
      rec => rec.teamId === teamId && rec.roundId === roundId &&
             (productId !== undefined ? rec.productId === productId : true)
    );
    return matches[0];
  }

  async getStrategicRecommendationsByTeamAndRound(teamId: string, roundId: string): Promise<StrategicRecommendations[]> {
    return Array.from(this.strategicRecommendations.values()).filter(
      rec => rec.teamId === teamId && rec.roundId === roundId
    );
  }

  async createStrategicRecommendations(recommendations: InsertStrategicRecommendations & { teamId: string }): Promise<StrategicRecommendations> {
    const id = randomUUID();
    const strategicRec: StrategicRecommendations = {
      id,
      teamId: recommendations.teamId,
      roundId: recommendations.roundId,
      productId: recommendations.productId ?? null,
      product: recommendations.product ?? [],
      price: recommendations.price ?? [],
      place: recommendations.place ?? [],
      promotion: recommendations.promotion ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.strategicRecommendations.set(id, strategicRec);
    return strategicRec;
  }

  async updateStrategicRecommendations(id: string, data: Partial<StrategicRecommendations>): Promise<StrategicRecommendations | undefined> {
    const existing = this.strategicRecommendations.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.strategicRecommendations.set(id, updated);
    return updated;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsBySector(sectorId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.sector === sectorId
    );
  }

  async getProductsByClass(classId: string): Promise<Product[]> {
    const classData = this.classes.get(classId);
    if (!classData || !classData.sector) return [];
    return this.getProductsBySector(classData.sector);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = {
      id,
      name: product.name,
      sector: product.sector,
      slug: product.slug,
      description: product.description ?? null,
      orderIndex: product.orderIndex ?? 0,
      active: product.active ?? true,
      createdAt: new Date(),
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async getProductResult(teamId: string, roundId: string, productId: string): Promise<ProductResult | undefined> {
    return Array.from(this.productResults.values()).find(
      result => result.teamId === teamId && result.roundId === roundId && result.productId === productId
    );
  }

  async getProductResultsByTeamAndRound(teamId: string, roundId: string): Promise<ProductResult[]> {
    return Array.from(this.productResults.values()).filter(
      result => result.teamId === teamId && result.roundId === roundId
    );
  }

  async getProductResultsByRound(roundId: string): Promise<ProductResult[]> {
    return Array.from(this.productResults.values()).filter(
      result => result.roundId === roundId
    );
  }

  async createProductResult(result: InsertProductResult): Promise<ProductResult> {
    const id = randomUUID();
    const productResult: ProductResult = {
      id,
      teamId: result.teamId,
      roundId: result.roundId,
      productId: result.productId,
      revenue: result.revenue ?? 0,
      costs: result.costs ?? 0,
      profit: result.profit ?? 0,
      margin: result.margin ?? 0,
      marketShare: result.marketShare ?? 0,
      roi: result.roi ?? 0,
      brandPerception: result.brandPerception ?? 50,
      customerSatisfaction: result.customerSatisfaction ?? 50,
      customerLoyalty: result.customerLoyalty ?? 50,
      cac: result.cac ?? 0,
      ltv: result.ltv ?? 0,
      taxaConversao: result.taxaConversao ?? 0,
      ticketMedio: result.ticketMedio ?? 0,
      razaoLtvCac: result.razaoLtvCac ?? 0,
      nps: result.nps ?? 0,
      tempoMedioConversao: result.tempoMedioConversao ?? 0,
      margemContribuicao: result.margemContribuicao ?? 0,
      receitaBruta: result.receitaBruta ?? 0,
      receitaLiquida: result.receitaLiquida ?? 0,
      budgetBefore: result.budgetBefore ?? 0,
      profitImpact: result.profitImpact ?? 0,
      budgetAfter: result.budgetAfter ?? 0,
      alignmentScore: result.alignmentScore ?? null,
      alignmentIssues: result.alignmentIssues ?? [],
      financialBreakdown: result.financialBreakdown ?? null,
      calculatedAt: new Date(),
    };
    this.productResults.set(id, productResult);
    return productResult;
  }

  async updateProductResult(id: string, data: Partial<ProductResult>): Promise<ProductResult | undefined> {
    const existing = this.productResults.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.productResults.set(id, updated);
    return updated;
  }

  async getAllProductResults(): Promise<ProductResult[]> {
    return Array.from(this.productResults.values());
  }

  async getAllMidias(): Promise<Midia[]> {
    throw new Error("Midias not supported in MemStorage. Use PostgreSQL.");
  }

  async getMidiasByCategoria(categoria: string): Promise<Midia[]> {
    throw new Error("Midias not supported in MemStorage. Use PostgreSQL.");
  }

  async getMidia(id: string): Promise<Midia | undefined> {
    throw new Error("Midias not supported in MemStorage. Use PostgreSQL.");
  }

  async getTeamProduct(teamId: string, roundId: string, productId: string): Promise<TeamProduct | undefined> {
    throw new Error("TeamProducts not supported in MemStorage. Use PostgreSQL.");
  }

  async getTeamProductsByTeamAndRound(teamId: string, roundId: string): Promise<TeamProduct[]> {
    throw new Error("TeamProducts not supported in MemStorage. Use PostgreSQL.");
  }

  async createTeamProduct(teamProduct: InsertTeamProduct): Promise<TeamProduct> {
    throw new Error("TeamProducts not supported in MemStorage. Use PostgreSQL.");
  }

  async updateTeamProduct(id: string, data: Partial<TeamProduct>): Promise<TeamProduct | undefined> {
    throw new Error("TeamProducts not supported in MemStorage. Use PostgreSQL.");
  }
  
  async resetTeamDecisions(teamId: string, roundId: string): Promise<{ deletedAnalyses: number; deletedMixes: number; deletedProducts: number }> {
    throw new Error("resetTeamDecisions not supported in MemStorage. Use PostgreSQL.");
  }
}

import { PgStorage } from "./pg-storage";

const usingPostgreSQL = !!process.env.DATABASE_URL;
console.log(`[STORAGE] Usando ${usingPostgreSQL ? 'PostgreSQL' : 'MemStorage (em memória)'}`);

export const storage = usingPostgreSQL ? new PgStorage() : new MemStorage();
