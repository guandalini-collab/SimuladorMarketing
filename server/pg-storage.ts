import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, isNull, inArray, asc } from "drizzle-orm";
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
  type TeamProduct,
  type InsertTeamProduct,
  users,
  classes,
  teams,
  rounds,
  campaigns,
  marketingMix,
  marketEvents,
  results,
  swotAnalysis,
  porterAnalysis,
  bcgAnalysis,
  pestelAnalysis,
  economicData,
  autoEventConfig,
  aiFeedback,
  classStudents,
  passwordResetTokens,
  strategicRecommendations,
  products,
  productResults,
  midias,
  teamProducts,
  roundAccessLogs,
  deterministicFeedback,
  type DeterministicFeedback,
} from "@shared/schema";
import type { IStorage } from "./storage";

const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_DEV;
if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada.");
}
const sql = neon(databaseUrl);
const db = drizzle(sql);

// Fallback para DATABASE_URL de desenvolvimento se estiver em produção mas sem dados
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.includes("neon.tech")) {
  console.log("[STORAGE] Verificando conexão com banco de dados...");
}

export class PgStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getPendingUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.status, "pending"));
  }

  async updateUserStatus(userId: string, status: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ status })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    const allTeams = await this.getAllTeams();
    for (const team of allTeams) {
      if (team.memberIds.includes(userId)) {
        const updatedMemberIds = team.memberIds.filter(id => id !== userId);
        let updatedLeaderId = team.leaderId;
        
        if (team.leaderId === userId && updatedMemberIds.length > 0) {
          updatedLeaderId = updatedMemberIds[0];
        } else if (team.leaderId === userId && updatedMemberIds.length === 0) {
          updatedLeaderId = null as any;
        }
        
        await db.update(teams)
          .set({ 
            memberIds: updatedMemberIds, 
            leaderId: updatedLeaderId 
          })
          .where(eq(teams.id, team.id));
      }
    }
    
    await db.delete(users).where(eq(users.id, userId));
    return true;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getStudentsByProfessorClasses(professorId: string): Promise<User[]> {
    // Buscar todas as classes do professor
    const professorClasses = await db.select().from(classes).where(eq(classes.professorId, professorId));
    
    if (professorClasses.length === 0) {
      return [];
    }
    
    const classIds = professorClasses.map(c => c.id);
    
    // Buscar todos os alunos dessas classes via class_students
    const studentRecords = await db
      .select({
        userId: classStudents.studentId,
      })
      .from(classStudents)
      .where(inArray(classStudents.classId, classIds));
    
    if (studentRecords.length === 0) {
      return [];
    }
    
    // Obter IDs únicos de alunos
    const uniqueStudentIds = Array.from(new Set(studentRecords.map(s => s.userId)));
    
    // Buscar dados completos dos usuários
    const students = await db
      .select()
      .from(users)
      .where(inArray(users.id, uniqueStudentIds))
      .orderBy(asc(users.name));
    
    return students;
  }

  async getAvailableStudentsForEnrollment(): Promise<User[]> {
    // Buscar todos os alunos já matriculados em alguma turma
    const enrolledStudentRecords = await db
      .select({ studentId: classStudents.studentId })
      .from(classStudents);
    
    const enrolledStudentIds = new Set(enrolledStudentRecords.map(r => r.studentId));
    
    // Buscar todos os alunos aprovados com role='equipe'
    const allApprovedStudents = await db
      .select()
      .from(users)
      .where(and(
        eq(users.role, 'equipe'),
        eq(users.status, 'approved')
      ))
      .orderBy(asc(users.name));
    
    // Filtrar apenas os que NÃO estão matriculados em nenhuma turma
    const availableStudents = allApprovedStudents.filter(
      student => !enrolledStudentIds.has(student.id)
    );
    
    return availableStudents;
  }

  async removeDuplicateUsers(): Promise<void> {
    // Buscar todos os usuários
    const allUsers = await db.select().from(users);
    const emailMap = new Map<string, User[]>();
    
    // Agrupar por email
    allUsers.forEach(user => {
      if (!emailMap.has(user.email)) {
        emailMap.set(user.email, []);
      }
      emailMap.get(user.email)!.push(user);
    });
    
    // Coletar TODOS os IDs de usuários referenciados
    const referencedIds = new Set<string>();
    
    // 1. Usuários em class_students
    const enrolledStudents = await db.select().from(classStudents);
    enrolledStudents.forEach(cs => referencedIds.add(cs.studentId));
    
    // 2. Usuários em teams (memberIds e leaderId)
    const allTeams = await db.select().from(teams);
    allTeams.forEach(team => {
      team.memberIds.forEach((memberId: string) => referencedIds.add(memberId));
      if (team.leaderId) referencedIds.add(team.leaderId);
    });
    
    // 3. Professores donos de turmas
    const allClasses = await db.select().from(classes);
    allClasses.forEach(c => referencedIds.add(c.professorId));
    
    // Para cada email com duplicatas
    const entries = Array.from(emailMap.entries());
    for (const [email, userList] of entries) {
      if (userList.length <= 1) continue;
      
      // Separar usuários referenciados e órfãos
      const active = userList.filter(u => referencedIds.has(u.id));
      const orphans = userList.filter(u => !referencedIds.has(u.id));
      
      // Determinar quais sobrevivem
      const survivors = new Set<string>();
      
      // Manter TODOS os usuários ativos (referenciados)
      active.forEach(u => survivors.add(u.id));
      
      // Se NÃO há nenhum ativo, escolher deterministicamente UM órfão para manter
      if (survivors.size === 0) {
        const chosenOrphan = this.choosePreferredUser(userList);
        survivors.add(chosenOrphan.id);
      }
      
      // Deletar todos que não sobreviveram
      const toDelete = userList.filter(u => !survivors.has(u.id));
      
      for (const user of toDelete) {
        await this.deleteUser(user.id);
      }
    }
  }
  
  private choosePreferredUser(users: User[]): User {
    // Critério deterministico: 1) professor, 2) menor UUID
    const professors = users.filter(u => u.role === 'professor');
    if (professors.length > 0) {
      return professors.sort((a, b) => a.id.localeCompare(b.id))[0];
    }
    return users.sort((a, b) => a.id.localeCompare(b.id))[0];
  }

  async getPasswordResetToken(token: string): Promise<any> {
    const result = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    
    if (!result[0]) return undefined;
    
    if (result[0].expiresAt < new Date()) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
      return undefined;
    }
    
    return { userId: result[0].userId, expiresAt: result[0].expiresAt };
  }

  async getClass(id: string): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
    return result[0];
  }

  async getAllClasses(): Promise<Class[]> {
    return db.select().from(classes);
  }

  async getClassesByProfessor(professorId: string): Promise<Class[]> {
    return db.select().from(classes).where(eq(classes.professorId, professorId));
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(classes).values(classData).returning();
    return result[0];
  }

  async updateClass(id: string, data: Partial<Class>): Promise<Class | undefined> {
    const result = await db.update(classes)
      .set(data)
      .where(eq(classes.id, id))
      .returning();
    return result[0];
  }

  async deleteClass(id: string): Promise<boolean> {
    const classTeams = await this.getTeamsByClass(id);
    for (const team of classTeams) {
      await this.deleteTeam(team.id);
    }

    const classRounds = await this.getRoundsByClass(id);
    for (const round of classRounds) {
      await db.delete(marketEvents).where(eq(marketEvents.roundId, round.id));
      await db.delete(results).where(eq(results.roundId, round.id));
    }

    await db.delete(rounds).where(eq(rounds.classId, id));
    await db.delete(autoEventConfig).where(eq(autoEventConfig.classId, id));
    await db.delete(classStudents).where(eq(classStudents.classId, id));
    await db.delete(classes).where(eq(classes.id, id));
    return true;
  }

  async addStudentToClass(classId: string, studentId: string): Promise<void> {
    const classData = await this.getClass(classId);
    if (!classData) {
      throw new Error('Turma não encontrada');
    }
    
    const user = await this.getUser(studentId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    if (user.role !== 'equipe') {
      throw new Error('Apenas alunos podem ser matriculados em turmas');
    }
    
    const existingEnrollment = await db
      .select()
      .from(classStudents)
      .where(eq(classStudents.studentId, studentId))
      .limit(1);
    
    if (existingEnrollment.length > 0) {
      throw new Error('Aluno já está matriculado em outra turma. Remova-o primeiro.');
    }
    
    await db.insert(classStudents).values({
      classId,
      studentId,
    });
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<void> {
    const enrollment = await db
      .select()
      .from(classStudents)
      .where(
        and(
          eq(classStudents.classId, classId),
          eq(classStudents.studentId, studentId)
        )
      )
      .limit(1);
    
    if (enrollment.length === 0) {
      throw new Error('Aluno não está matriculado nesta turma');
    }
    
    const classTeams = await this.getTeamsByClass(classId);
    for (const team of classTeams) {
      if (team.memberIds.includes(studentId)) {
        await this.removeMemberFromTeam(team.id, studentId);
      }
    }
    
    await db
      .delete(classStudents)
      .where(
        and(
          eq(classStudents.classId, classId),
          eq(classStudents.studentId, studentId)
        )
      );
  }

  async getStudentsByClass(classId: string): Promise<User[]> {
    const enrollments = await db
      .select({
        user: users,
      })
      .from(classStudents)
      .innerJoin(users, eq(classStudents.studentId, users.id))
      .where(eq(classStudents.classId, classId));
    
    return enrollments.map(e => e.user);
  }

  async getClassByStudent(studentId: string): Promise<Class | undefined> {
    const enrollment = await db
      .select({
        class: classes,
      })
      .from(classStudents)
      .innerJoin(classes, eq(classStudents.classId, classes.id))
      .where(eq(classStudents.studentId, studentId))
      .limit(1);
    
    return enrollment[0]?.class;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result[0];
  }

  async getTeamsByClass(classId: string): Promise<Team[]> {
    return db.select().from(teams).where(eq(teams.classId, classId));
  }

  async getTeamByUser(userId: string): Promise<Team | undefined> {
    const allTeams = await db.select().from(teams);
    return allTeams.find(team => team.memberIds.includes(userId));
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async addMemberToTeam(teamId: string, userId: string): Promise<Team | undefined> {
    const team = await this.getTeam(teamId);
    if (!team) return undefined;

    const updatedMemberIds = [...team.memberIds, userId];
    const result = await db.update(teams)
      .set({ memberIds: updatedMemberIds })
      .where(eq(teams.id, teamId))
      .returning();
    return result[0];
  }

  async removeMemberFromTeam(teamId: string, userId: string): Promise<Team | undefined> {
    const team = await this.getTeam(teamId);
    if (!team) return undefined;
    
    const updatedMemberIds = team.memberIds.filter(id => id !== userId);
    let updatedLeaderId = team.leaderId;
    
    if (team.leaderId === userId && updatedMemberIds.length > 0) {
      updatedLeaderId = updatedMemberIds[0];
    }
    
    if (updatedMemberIds.length === 0) {
      updatedLeaderId = null as any;
    }
    
    const result = await db.update(teams)
      .set({ 
        memberIds: updatedMemberIds, 
        leaderId: updatedLeaderId 
      })
      .where(eq(teams.id, teamId))
      .returning();
    return result[0];
  }

  async updateTeam(id: string, data: Partial<Team>): Promise<Team | undefined> {
    const result = await db.update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();
    return result[0];
  }

  async updateTeamLeader(teamId: string, leaderId: string): Promise<Team | undefined> {
    const result = await db.update(teams)
      .set({ leaderId })
      .where(eq(teams.id, teamId))
      .returning();
    return result[0];
  }

  async deleteTeam(id: string): Promise<boolean> {
    const teamMarketingMixes = await db.select().from(marketingMix).where(eq(marketingMix.teamId, id));
    for (const mix of teamMarketingMixes) {
      await db.delete(marketingMix).where(eq(marketingMix.id, mix.id));
    }

    await db.delete(campaigns).where(eq(campaigns.teamId, id));
    await db.delete(results).where(eq(results.teamId, id));
    await db.delete(swotAnalysis).where(eq(swotAnalysis.teamId, id));
    await db.delete(porterAnalysis).where(eq(porterAnalysis.teamId, id));
    await db.delete(bcgAnalysis).where(eq(bcgAnalysis.teamId, id));
    await db.delete(pestelAnalysis).where(eq(pestelAnalysis.teamId, id));
    await db.delete(aiFeedback).where(eq(aiFeedback.teamId, id));
    await db.delete(teams).where(eq(teams.id, id));
    return true;
  }

  async getAllTeams(): Promise<Team[]> {
    return db.select().from(teams);
  }

  async getRound(id: string): Promise<Round | undefined> {
    const result = await db.select().from(rounds).where(eq(rounds.id, id)).limit(1);
    return result[0];
  }

  async getRoundsByClass(classId: string): Promise<Round[]> {
    return db.select().from(rounds).where(eq(rounds.classId, classId));
  }

  async getCurrentRound(classId: string): Promise<Round | undefined> {
    const result = await db.select().from(rounds)
      .where(and(eq(rounds.classId, classId), eq(rounds.status, "active")))
      .limit(1);
    return result[0];
  }

  async createRound(round: InsertRound): Promise<Round> {
    const result = await db.insert(rounds).values(round).returning();
    return result[0];
  }

  async updateRound(id: string, data: Partial<Round>): Promise<Round | undefined> {
    const result = await db.update(rounds)
      .set(data)
      .where(eq(rounds.id, id))
      .returning();
    return result[0];
  }

  async getAllRounds(): Promise<Round[]> {
    return db.select().from(rounds);
  }

  async deleteRound(roundId: string): Promise<boolean> {
    await db.delete(rounds).where(eq(rounds.id, roundId));
    return true;
  }

  async getRoundDependencies(roundId: string): Promise<{ hasDependencies: boolean; details: string[] }> {
    const details: string[] = [];
    
    try {
      // Check for campaigns
      const campaignData = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.roundId, roundId)).limit(1);
      if (campaignData.length > 0) details.push("campanhas");
      
      // Check for marketing mix
      const mixData = await db.select({ id: marketingMix.id }).from(marketingMix).where(eq(marketingMix.roundId, roundId)).limit(1);
      if (mixData.length > 0) details.push("decisões de marketing mix");
      
      // Check for results
      const resultData = await db.select({ id: results.id }).from(results).where(eq(results.roundId, roundId)).limit(1);
      if (resultData.length > 0) details.push("resultados");
      
      // Check for market events
      const eventData = await db.select({ id: marketEvents.id }).from(marketEvents).where(eq(marketEvents.roundId, roundId)).limit(1);
      if (eventData.length > 0) details.push("eventos de mercado");
      
      // Check for SWOT analyses
      const swotData = await db.select({ id: swotAnalysis.id }).from(swotAnalysis).where(eq(swotAnalysis.roundId, roundId)).limit(1);
      if (swotData.length > 0) details.push("análises SWOT");
      
      // Check for Porter analyses
      const porterData = await db.select({ id: porterAnalysis.id }).from(porterAnalysis).where(eq(porterAnalysis.roundId, roundId)).limit(1);
      if (porterData.length > 0) details.push("análises Porter");
      
      // Check for BCG analyses
      const bcgData = await db.select({ id: bcgAnalysis.id }).from(bcgAnalysis).where(eq(bcgAnalysis.roundId, roundId)).limit(1);
      if (bcgData.length > 0) details.push("análises BCG");
      
      // Check for PESTEL analyses
      const pestelData = await db.select({ id: pestelAnalysis.id }).from(pestelAnalysis).where(eq(pestelAnalysis.roundId, roundId)).limit(1);
      if (pestelData.length > 0) details.push("análises PESTEL");
    } catch (error) {
      console.error("Erro ao verificar dependências da rodada:", error);
    }
    
    return {
      hasDependencies: details.length > 0,
      details
    };
  }

  async logRoundAccess(roundId: string, classId: string, userId: string, userRole: string, action: string): Promise<void> {
    try {
      await db.insert(roundAccessLogs).values({ roundId, classId, userId, userRole, action });
    } catch (error) {
      console.error("Erro ao registrar log de acesso:", error);
    }
  }

  async getRoundAccessLogs(classId: string): Promise<any[]> {
    const logs = await db
      .select({
        id: roundAccessLogs.id,
        roundNumber: rounds.roundNumber,
        userName: users.name,
        userId: roundAccessLogs.userId,
        userRole: roundAccessLogs.userRole,
        action: roundAccessLogs.action,
        timestamp: roundAccessLogs.timestamp,
      })
      .from(roundAccessLogs)
      .innerJoin(rounds, eq(roundAccessLogs.roundId, rounds.id))
      .innerJoin(users, eq(roundAccessLogs.userId, users.id))
      .where(eq(roundAccessLogs.classId, classId))
      .orderBy(desc(roundAccessLogs.timestamp));
    
    // Buscar equipes da turma para mapear userId -> teamName
    const classTeams = await db.select({ id: teams.id, name: teams.name, memberIds: teams.memberIds }).from(teams).where(eq(teams.classId, classId));
    
    // Criar mapa de userId para teamName
    const userTeamMap = new Map<string, string>();
    for (const team of classTeams) {
      if (team.memberIds) {
        for (const memberId of team.memberIds) {
          userTeamMap.set(memberId, team.name);
        }
      }
    }
    
    return logs.map(log => ({
      ...log,
      teamName: userTeamMap.get(log.userId) || "Sem equipe"
    }));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return result[0];
  }

  async getCampaignsByTeamAndRound(teamId: string, roundId: string): Promise<Campaign[]> {
    return db.select().from(campaigns)
      .where(and(eq(campaigns.teamId, teamId), eq(campaigns.roundId, roundId)));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const result = await db.insert(campaigns).values(campaign).returning();
    return result[0];
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign | undefined> {
    const result = await db.update(campaigns)
      .set(data)
      .where(eq(campaigns.id, id))
      .returning();
    return result[0];
  }

  async getAllCampaigns(): Promise<Campaign[]> {
    return db.select().from(campaigns);
  }

  async getMarketingMix(teamId: string, roundId: string, productId?: string): Promise<MarketingMix | undefined> {
    const baseConditions = [eq(marketingMix.teamId, teamId), eq(marketingMix.roundId, roundId)];
    const conditions = productId !== undefined 
      ? [...baseConditions, eq(marketingMix.productId, productId)]
      : baseConditions;
    const result = await db.select().from(marketingMix)
      .where(and(...conditions))
      .limit(1);
    return result[0];
  }

  async getMarketingMixesByTeamAndRound(teamId: string, roundId: string): Promise<MarketingMix[]> {
    return db.select().from(marketingMix)
      .where(and(eq(marketingMix.teamId, teamId), eq(marketingMix.roundId, roundId)));
  }

  async getMarketingMixesByClass(classId: string): Promise<MarketingMix[]> {
    const classTeams = await this.getTeamsByClass(classId);
    const teamIds = classTeams.map(t => t.id);
    
    if (teamIds.length === 0) return [];
    
    const allMixes = await db.select().from(marketingMix);
    return allMixes.filter(mix => teamIds.includes(mix.teamId));
  }

  async createMarketingMix(mix: InsertMarketingMix): Promise<MarketingMix> {
    const result = await db.insert(marketingMix).values(mix).returning();
    return result[0];
  }

  async updateMarketingMix(id: string, data: Partial<MarketingMix>): Promise<MarketingMix | undefined> {
    const result = await db.update(marketingMix)
      .set(data)
      .where(eq(marketingMix.id, id))
      .returning();
    return result[0];
  }

  async getAllMarketingMixes(): Promise<MarketingMix[]> {
    return db.select().from(marketingMix);
  }

  async getMarketEvent(id: string): Promise<MarketEvent | undefined> {
    const result = await db.select().from(marketEvents).where(eq(marketEvents.id, id)).limit(1);
    return result[0];
  }

  async getMarketEventsByRound(roundId: string): Promise<MarketEvent[]> {
    return db.select().from(marketEvents).where(eq(marketEvents.roundId, roundId));
  }

  async createMarketEvent(event: InsertMarketEvent): Promise<MarketEvent> {
    const result = await db.insert(marketEvents).values(event).returning();
    return result[0];
  }

  async updateMarketEvent(id: string, data: Partial<MarketEvent>): Promise<MarketEvent | undefined> {
    const result = await db.update(marketEvents)
      .set(data)
      .where(eq(marketEvents.id, id))
      .returning();
    return result[0];
  }

  async getAllMarketEvents(): Promise<MarketEvent[]> {
    return db.select().from(marketEvents);
  }

  async getResult(teamId: string, roundId: string): Promise<Result | undefined> {
    const result = await db.select().from(results)
      .where(and(eq(results.teamId, teamId), eq(results.roundId, roundId)))
      .limit(1);
    return result[0];
  }

  async getResultsByRound(roundId: string): Promise<Result[]> {
    return db.select().from(results).where(eq(results.roundId, roundId));
  }

  async getResultsByClassAndRound(classId: string, roundId: string): Promise<import("./storage").TeamResultData[]> {
    const rows = await db
      .select({
        result: results,
        team: {
          id: teams.id,
          name: teams.name,
          classId: teams.classId,
        },
      })
      .from(results)
      .innerJoin(teams, eq(results.teamId, teams.id))
      .where(and(eq(teams.classId, classId), eq(results.roundId, roundId)));
    
    return rows;
  }

  async createResult(result: InsertResult): Promise<Result> {
    const created = await db.insert(results).values(result).returning();
    return created[0];
  }

  async updateResult(id: string, data: Partial<Result>): Promise<Result | undefined> {
    const result = await db.update(results)
      .set(data)
      .where(eq(results.id, id))
      .returning();
    return result[0];
  }

  async getAllResults(): Promise<Result[]> {
    return db.select().from(results);
  }

  async getPreviousRoundResult(teamId: string, currentRoundId: string): Promise<Result | undefined> {
    const currentRound = await this.getRound(currentRoundId);
    if (!currentRound || currentRound.roundNumber <= 1) {
      return undefined;
    }

    const previousRoundNumber = currentRound.roundNumber - 1;
    const roundsList = await this.getRoundsByClass(currentRound.classId);
    const previousRound = roundsList.find(r => r.roundNumber === previousRoundNumber);
    
    if (!previousRound) {
      return undefined;
    }

    return this.getResult(teamId, previousRound.id);
  }

  async getSwotAnalysis(teamId: string, roundId: string, productId?: string): Promise<SwotAnalysis | undefined> {
    const baseConditions = [eq(swotAnalysis.teamId, teamId), eq(swotAnalysis.roundId, roundId)];
    const conditions = productId !== undefined
      ? [...baseConditions, eq(swotAnalysis.productId, productId)]
      : baseConditions;
    const result = await db.select().from(swotAnalysis)
      .where(and(...conditions))
      .limit(1);
    return result[0];
  }

  async getSwotAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<SwotAnalysis[]> {
    return db.select().from(swotAnalysis)
      .where(and(eq(swotAnalysis.teamId, teamId), eq(swotAnalysis.roundId, roundId)));
  }

  async createSwotAnalysis(swot: InsertSwot & { teamId: string }): Promise<SwotAnalysis> {
    const result = await db.insert(swotAnalysis).values(swot).returning();
    return result[0];
  }

  async updateSwotAnalysis(id: string, data: Partial<SwotAnalysis>): Promise<SwotAnalysis | undefined> {
    const result = await db.update(swotAnalysis)
      .set(data)
      .where(eq(swotAnalysis.id, id))
      .returning();
    return result[0];
  }

  async getPorterAnalysis(teamId: string, roundId: string, productId?: string): Promise<PorterAnalysis | undefined> {
    const baseConditions = [eq(porterAnalysis.teamId, teamId), eq(porterAnalysis.roundId, roundId)];
    const conditions = productId !== undefined
      ? [...baseConditions, eq(porterAnalysis.productId, productId)]
      : baseConditions;
    const result = await db.select().from(porterAnalysis)
      .where(and(...conditions))
      .limit(1);
    return result[0];
  }

  async getPorterAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<PorterAnalysis[]> {
    return db.select().from(porterAnalysis)
      .where(and(eq(porterAnalysis.teamId, teamId), eq(porterAnalysis.roundId, roundId)));
  }

  async createPorterAnalysis(porter: InsertPorter & { teamId: string }): Promise<PorterAnalysis> {
    const result = await db.insert(porterAnalysis).values(porter).returning();
    return result[0];
  }

  async updatePorterAnalysis(id: string, data: Partial<PorterAnalysis>): Promise<PorterAnalysis | undefined> {
    const result = await db.update(porterAnalysis)
      .set(data)
      .where(eq(porterAnalysis.id, id))
      .returning();
    return result[0];
  }

  async getBcgAnalyses(teamId: string, roundId: string): Promise<BcgAnalysis[]> {
    return db.select().from(bcgAnalysis)
      .where(and(eq(bcgAnalysis.teamId, teamId), eq(bcgAnalysis.roundId, roundId)));
  }

  async getBcgAnalysis(teamId: string, roundId: string, productId?: string): Promise<BcgAnalysis | undefined> {
    const baseConditions = [eq(bcgAnalysis.teamId, teamId), eq(bcgAnalysis.roundId, roundId)];
    const conditions = productId !== undefined
      ? [...baseConditions, eq(bcgAnalysis.productId, productId)]
      : baseConditions;
    const result = await db.select().from(bcgAnalysis)
      .where(and(...conditions))
      .limit(1);
    return result[0];
  }

  async getBcgAnalysisById(id: string): Promise<BcgAnalysis | undefined> {
    const result = await db.select().from(bcgAnalysis).where(eq(bcgAnalysis.id, id)).limit(1);
    return result[0];
  }

  async createBcgAnalysis(bcg: InsertBcg & { teamId: string }): Promise<BcgAnalysis> {
    const result = await db.insert(bcgAnalysis).values(bcg).returning();
    return result[0];
  }

  async updateBcgAnalysis(id: string, data: Partial<BcgAnalysis>): Promise<BcgAnalysis | undefined> {
    const result = await db.update(bcgAnalysis)
      .set(data)
      .where(eq(bcgAnalysis.id, id))
      .returning();
    return result[0];
  }

  async deleteBcgAnalysis(id: string): Promise<boolean> {
    await db.delete(bcgAnalysis).where(eq(bcgAnalysis.id, id));
    return true;
  }

  async getPestelAnalysis(teamId: string, roundId: string, productId?: string): Promise<PestelAnalysis | undefined> {
    const baseConditions = [eq(pestelAnalysis.teamId, teamId), eq(pestelAnalysis.roundId, roundId)];
    const conditions = productId !== undefined
      ? [...baseConditions, eq(pestelAnalysis.productId, productId)]
      : baseConditions;
    const result = await db.select().from(pestelAnalysis)
      .where(and(...conditions))
      .limit(1);
    return result[0];
  }

  async getPestelAnalysesByTeamAndRound(teamId: string, roundId: string): Promise<PestelAnalysis[]> {
    return db.select().from(pestelAnalysis)
      .where(and(eq(pestelAnalysis.teamId, teamId), eq(pestelAnalysis.roundId, roundId)));
  }

  async createPestelAnalysis(pestel: InsertPestel & { teamId: string }): Promise<PestelAnalysis> {
    const result = await db.insert(pestelAnalysis).values(pestel).returning();
    return result[0];
  }

  async updatePestelAnalysis(id: string, data: Partial<PestelAnalysis>): Promise<PestelAnalysis | undefined> {
    const result = await db.update(pestelAnalysis)
      .set(data)
      .where(eq(pestelAnalysis.id, id))
      .returning();
    return result[0];
  }

  async getLatestEconomicData(): Promise<EconomicData | undefined> {
    const result = await db.select().from(economicData)
      .orderBy(desc(economicData.date))
      .limit(1);
    return result[0];
  }

  async createEconomicData(data: InsertEconomicData): Promise<EconomicData> {
    const result = await db.insert(economicData).values(data).returning();
    return result[0];
  }

  async getAllEconomicData(limit?: number): Promise<EconomicData[]> {
    const query = db.select().from(economicData).orderBy(desc(economicData.date));
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async getAutoEventConfig(classId: string): Promise<AutoEventConfig | undefined> {
    const result = await db.select().from(autoEventConfig)
      .where(eq(autoEventConfig.classId, classId))
      .limit(1);
    return result[0];
  }

  async createAutoEventConfig(config: InsertAutoEventConfig): Promise<AutoEventConfig> {
    const result = await db.insert(autoEventConfig).values(config).returning();
    return result[0];
  }

  async updateAutoEventConfig(classId: string, data: Partial<AutoEventConfig>): Promise<AutoEventConfig | undefined> {
    const result = await db.update(autoEventConfig)
      .set(data)
      .where(eq(autoEventConfig.classId, classId))
      .returning();
    return result[0];
  }

  async getAiFeedback(teamId: string, roundId: string): Promise<AiFeedback | undefined> {
    const result = await db.select().from(aiFeedback)
      .where(and(eq(aiFeedback.teamId, teamId), eq(aiFeedback.roundId, roundId)))
      .limit(1);
    return result[0];
  }

  async getAiFeedbacksByTeam(teamId: string): Promise<AiFeedback[]> {
    return db.select().from(aiFeedback)
      .where(eq(aiFeedback.teamId, teamId))
      .orderBy(desc(aiFeedback.createdAt));
  }

  async getAiFeedbacksByRound(roundId: string): Promise<AiFeedback[]> {
    return db.select().from(aiFeedback).where(eq(aiFeedback.roundId, roundId));
  }

  async createAiFeedback(feedback: InsertAiFeedback): Promise<AiFeedback> {
    const result = await db.insert(aiFeedback).values(feedback).returning();
    return result[0];
  }

  async deleteAiFeedback(teamId: string, roundId: string): Promise<boolean> {
    const result = await db.delete(aiFeedback)
      .where(and(eq(aiFeedback.teamId, teamId), eq(aiFeedback.roundId, roundId)))
      .returning();
    return result.length > 0;
  }

  async getAllAiFeedbacks(): Promise<AiFeedback[]> {
    return db.select().from(aiFeedback);
  }

  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
    });
  }

  async getPasswordResetTokenByToken(token: string): Promise<{ userId: string; expiresAt: Date } | undefined> {
    const result = await db.select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1);
    
    if (!result[0]) return undefined;
    
    return {
      userId: result[0].userId,
      expiresAt: result[0].expiresAt,
    };
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async setTemporaryPassword(userId: string, hashedTempPassword: string, expiryDate: Date): Promise<void> {
    await db.update(users)
      .set({ 
        temporaryPassword: hashedTempPassword,
        temporaryPasswordExpiry: expiryDate,
        mustChangePassword: true
      })
      .where(eq(users.id, userId));
  }

  async clearTemporaryPassword(userId: string): Promise<void> {
    await db.update(users)
      .set({ 
        temporaryPassword: null,
        temporaryPasswordExpiry: null,
        mustChangePassword: false
      })
      .where(eq(users.id, userId));
  }

  async updatePasswordAndClearTemporary(userId: string, newHashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ 
        password: newHashedPassword,
        temporaryPassword: null,
        temporaryPasswordExpiry: null,
        mustChangePassword: false
      })
      .where(eq(users.id, userId));
  }

  async getStrategicRecommendations(teamId: string, roundId: string, productId?: string): Promise<StrategicRecommendations | undefined> {
    const baseConditions = [
      eq(strategicRecommendations.teamId, teamId),
      eq(strategicRecommendations.roundId, roundId)
    ];
    const conditions = productId !== undefined
      ? [...baseConditions, eq(strategicRecommendations.productId, productId)]
      : baseConditions;
    const result = await db.select()
      .from(strategicRecommendations)
      .where(and(...conditions))
      .limit(1);
    return result[0];
  }

  async getStrategicRecommendationsByTeamAndRound(teamId: string, roundId: string): Promise<StrategicRecommendations[]> {
    return db.select()
      .from(strategicRecommendations)
      .where(and(
        eq(strategicRecommendations.teamId, teamId),
        eq(strategicRecommendations.roundId, roundId)
      ));
  }

  async createStrategicRecommendations(recommendations: InsertStrategicRecommendations & { teamId: string }): Promise<StrategicRecommendations> {
    const result = await db.insert(strategicRecommendations)
      .values(recommendations)
      .returning();
    return result[0];
  }

  async updateStrategicRecommendations(id: string, data: Partial<StrategicRecommendations>): Promise<StrategicRecommendations | undefined> {
    const result = await db.update(strategicRecommendations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(strategicRecommendations.id, id))
      .returning();
    return result[0];
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductsBySector(sectorId: string): Promise<Product[]> {
    return db.select().from(products).where(eq(products.sector, sectorId));
  }

  async getProductsByClass(classId: string): Promise<Product[]> {
    const classData = await this.getClass(classId);
    if (!classData || !classData.sector) return [];
    return this.getProductsBySector(classData.sector);
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async getProductResult(teamId: string, roundId: string, productId: string): Promise<ProductResult | undefined> {
    const result = await db.select().from(productResults)
      .where(and(
        eq(productResults.teamId, teamId),
        eq(productResults.roundId, roundId),
        eq(productResults.productId, productId)
      ))
      .limit(1);
    return result[0];
  }

  async getProductResultsByTeamAndRound(teamId: string, roundId: string): Promise<ProductResult[]> {
    return db.select().from(productResults)
      .where(and(eq(productResults.teamId, teamId), eq(productResults.roundId, roundId)));
  }

  async getProductResultsByRound(roundId: string): Promise<ProductResult[]> {
    return db.select().from(productResults).where(eq(productResults.roundId, roundId));
  }

  async createProductResult(result: InsertProductResult): Promise<ProductResult> {
    const created = await db.insert(productResults).values(result).returning();
    return created[0];
  }

  async updateProductResult(id: string, data: Partial<ProductResult>): Promise<ProductResult | undefined> {
    const result = await db.update(productResults)
      .set(data)
      .where(eq(productResults.id, id))
      .returning();
    return result[0];
  }

  async getAllProductResults(): Promise<ProductResult[]> {
    return db.select().from(productResults);
  }

  async getAllMidias(): Promise<Midia[]> {
    return db.select().from(midias).orderBy(midias.orderIndex);
  }

  async getMidiasByCategoria(categoria: string): Promise<Midia[]> {
    return db.select().from(midias)
      .where(eq(midias.categoria, categoria))
      .orderBy(midias.orderIndex);
  }

  async getMidia(id: string): Promise<Midia | undefined> {
    const result = await db.select().from(midias).where(eq(midias.id, id)).limit(1);
    return result[0];
  }

  async getTeamProduct(teamId: string, roundId: string, productId: string): Promise<TeamProduct | undefined> {
    const result = await db.select().from(teamProducts)
      .where(and(
        eq(teamProducts.teamId, teamId),
        eq(teamProducts.roundId, roundId),
        eq(teamProducts.productId, productId)
      ))
      .limit(1);
    return result[0];
  }

  async getTeamProductsByTeamAndRound(teamId: string, roundId: string): Promise<TeamProduct[]> {
    return db.select().from(teamProducts)
      .where(and(
        eq(teamProducts.teamId, teamId),
        eq(teamProducts.roundId, roundId)
      ));
  }

  async createTeamProduct(teamProduct: InsertTeamProduct): Promise<TeamProduct> {
    const result = await db.insert(teamProducts).values(teamProduct).returning();
    return result[0];
  }

  async updateTeamProduct(id: string, data: Partial<TeamProduct>): Promise<TeamProduct | undefined> {
    const result = await db.update(teamProducts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(teamProducts.id, id))
      .returning();
    return result[0];
  }
  
  async resetTeamDecisions(teamId: string, roundId: string): Promise<{ deletedAnalyses: number; deletedMixes: number; deletedProducts: number }> {
    // Delete SWOT analyses
    const deletedSwot = await db.delete(swotAnalysis)
      .where(and(eq(swotAnalysis.teamId, teamId), eq(swotAnalysis.roundId, roundId)))
      .returning();
    
    // Delete Porter analyses
    const deletedPorter = await db.delete(porterAnalysis)
      .where(and(eq(porterAnalysis.teamId, teamId), eq(porterAnalysis.roundId, roundId)))
      .returning();
    
    // Delete BCG analyses
    const deletedBcg = await db.delete(bcgAnalysis)
      .where(and(eq(bcgAnalysis.teamId, teamId), eq(bcgAnalysis.roundId, roundId)))
      .returning();
    
    // Delete PESTEL analyses
    const deletedPestel = await db.delete(pestelAnalysis)
      .where(and(eq(pestelAnalysis.teamId, teamId), eq(pestelAnalysis.roundId, roundId)))
      .returning();
    
    // Delete Strategic Recommendations
    const deletedRecommendations = await db.delete(strategicRecommendations)
      .where(and(eq(strategicRecommendations.teamId, teamId), eq(strategicRecommendations.roundId, roundId)))
      .returning();
    
    // Delete Marketing Mixes
    const deletedMixes = await db.delete(marketingMix)
      .where(and(eq(marketingMix.teamId, teamId), eq(marketingMix.roundId, roundId)))
      .returning();
    
    // Delete Team Products
    const deletedProducts = await db.delete(teamProducts)
      .where(and(eq(teamProducts.teamId, teamId), eq(teamProducts.roundId, roundId)))
      .returning();
    
    const totalAnalyses = deletedSwot.length + deletedPorter.length + deletedBcg.length + deletedPestel.length + deletedRecommendations.length;
    
    return {
      deletedAnalyses: totalAnalyses,
      deletedMixes: deletedMixes.length,
      deletedProducts: deletedProducts.length
    };
  }

  async getDeterministicFeedback(teamId: string, roundId: string): Promise<DeterministicFeedback | undefined> {
    const result = await db.select().from(deterministicFeedback)
      .where(and(
        eq(deterministicFeedback.teamId, teamId),
        eq(deterministicFeedback.roundId, roundId)
      ))
      .limit(1);
    return result[0];
  }

  async getDeterministicFeedbacksByRound(roundId: string): Promise<DeterministicFeedback[]> {
    return db.select().from(deterministicFeedback)
      .where(eq(deterministicFeedback.roundId, roundId));
  }

  async createDeterministicFeedback(feedback: { teamId: string; roundId: string; summary: string; whatHappened: any; whyItHappened: any; recommendations: any; engineVersion: string }): Promise<DeterministicFeedback> {
    const existing = await this.getDeterministicFeedback(feedback.teamId, feedback.roundId);
    if (existing) {
      const updated = await db.update(deterministicFeedback)
        .set({
          summary: feedback.summary,
          whatHappened: feedback.whatHappened,
          whyItHappened: feedback.whyItHappened,
          recommendations: feedback.recommendations,
          engineVersion: feedback.engineVersion,
        })
        .where(eq(deterministicFeedback.id, existing.id))
        .returning();
      return updated[0];
    }
    const result = await db.insert(deterministicFeedback).values(feedback).returning();
    return result[0];
  }

  async deleteDeterministicFeedback(teamId: string, roundId: string): Promise<boolean> {
    const result = await db.delete(deterministicFeedback)
      .where(and(
        eq(deterministicFeedback.teamId, teamId),
        eq(deterministicFeedback.roundId, roundId)
      ))
      .returning();
    return result.length > 0;
  }
}
