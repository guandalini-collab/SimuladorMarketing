import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("approved"),
  temporaryPassword: text("temporary_password"),
  temporaryPasswordExpiry: timestamp("temporary_password_expiry"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  recoveryCodeHash: text("recovery_code_hash"),
});

export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  professorId: varchar("professor_id").notNull(),
  currentRound: integer("current_round").notNull().default(0),
  maxRounds: integer("max_rounds").notNull().default(10),
  defaultBudget: real("default_budget").notNull().default(100000),
  sector: text("sector"),
  businessType: text("business_type"),
  marketSize: real("market_size"),
  marketGrowthRate: real("market_growth_rate"),
  competitionLevel: text("competition_level"),
  numberOfCompetitors: integer("number_of_competitors"),
  marketConcentration: text("market_concentration"),
  competitorStrength: text("competitor_strength"),
  targetConsumers: integer("target_consumers"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const classStudents = pgTable("class_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  studentId: varchar("student_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp("enrolled_at").notNull().default(sql`now()`),
}, (table) => ({
  uniqueStudentIdx: uniqueIndex("unique_student_idx").on(table.studentId),
  classIdIdx: index("class_id_idx").on(table.classId),
}));

export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  classId: varchar("class_id").notNull(),
  memberIds: text("member_ids").array().notNull().default(sql`ARRAY[]::text[]`),
  leaderId: varchar("leader_id"),
  initialBudget: real("initial_budget").notNull().default(100000),
  budget: real("budget").notNull().default(100000),
  companyName: text("company_name"),
  slogan: text("slogan"),
  logoUrl: text("logo_url"),
  productCategory: text("product_category"),
  targetAudienceClass: text("target_audience_class"),
  targetAudienceAge: text("target_audience_age"),
  targetAudienceProfile: text("target_audience_profile"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const rounds = pgTable("rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  roundNumber: integer("round_number").notNull(),
  status: text("status").notNull().default("locked"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  scheduledStartAt: timestamp("scheduled_start_at"),
  scheduledEndAt: timestamp("scheduled_end_at"),
  aiAssistanceLevel: integer("ai_assistance_level").notNull().default(1),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull().default("planejando"),
  budget: real("budget").notNull(),
  channel: text("channel").notNull(),
  duration: integer("duration").notNull(),
  targetAudience: text("target_audience").notNull(),
  reach: integer("reach").default(0),
  engagement: real("engagement").default(0),
  roi: real("roi").default(0),
});

export const marketingMix = pgTable("marketing_mix", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  productId: varchar("product_id"),
  productQuality: text("product_quality").notNull().default("medio"),
  productFeatures: text("product_features").notNull().default("basico"),
  brandPositioning: text("brand_positioning").notNull().default("qualidade"),
  priceStrategy: text("price_strategy").notNull().default("competitivo"),
  priceValue: real("price_value").notNull().default(50),
  distributionChannels: text("distribution_channels").array().notNull().default(sql`ARRAY['varejo']::text[]`),
  distributionCoverage: text("distribution_coverage").notNull().default("regional"),
  promotionMix: text("promotion_mix").array().notNull().default(sql`ARRAY['digital']::text[]`),
  promotionIntensity: text("promotion_intensity").notNull().default("medio"),
  promotionBudgets: jsonb("promotion_budgets"),
  estimatedCost: real("estimated_cost").notNull().default(0),
  submittedAt: timestamp("submitted_at"),
}, (table) => ({
  teamRoundProductIdx: index("marketing_mix_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
}));

export const marketEvents = pgTable("market_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull(),
  roundId: varchar("round_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  impact: text("impact").notNull(),
  severity: text("severity").notNull(),
  active: boolean("active").notNull().default(true),
  autoGenerated: boolean("auto_generated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const results = pgTable("results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  revenue: real("revenue").notNull().default(0),
  costs: real("costs").notNull().default(0),
  profit: real("profit").notNull().default(0),
  margin: real("margin").notNull().default(0),
  marketShare: real("market_share").notNull().default(0),
  roi: real("roi").notNull().default(0),
  brandPerception: real("brand_perception").notNull().default(50),
  customerSatisfaction: real("customer_satisfaction").notNull().default(50),
  customerLoyalty: real("customer_loyalty").notNull().default(50),
  cac: real("cac").notNull().default(0),
  ltv: real("ltv").notNull().default(0),
  taxaConversao: real("taxa_conversao").notNull().default(0),
  ticketMedio: real("ticket_medio").notNull().default(0),
  razaoLtvCac: real("razao_ltv_cac").notNull().default(0),
  nps: real("nps").notNull().default(0),
  tempoMedioConversao: real("tempo_medio_conversao").notNull().default(0),
  margemContribuicao: real("margem_contribuicao").notNull().default(0),
  receitaBruta: real("receita_bruta").notNull().default(0),
  receitaLiquida: real("receita_liquida").notNull().default(0),
  budgetBefore: real("budget_before").notNull().default(0),
  profitImpact: real("profit_impact").notNull().default(0),
  budgetAfter: real("budget_after").notNull().default(0),
  alignmentScore: real("alignment_score"),
  alignmentIssues: text("alignment_issues").array(),
  financialBreakdown: jsonb("financial_breakdown"),
  
  // DRE Completa - Demonstrativo do Resultado do Exercício
  impostos: real("impostos").notNull().default(0),
  devolucoes: real("devolucoes").notNull().default(0),
  descontos: real("descontos").notNull().default(0),
  cpv: real("cpv").notNull().default(0),
  lucroBruto: real("lucro_bruto").notNull().default(0),
  despesasVendas: real("despesas_vendas").notNull().default(0),
  despesasAdmin: real("despesas_admin").notNull().default(0),
  despesasFinanc: real("despesas_financ").notNull().default(0),
  outrasDespesas: real("outras_despesas").notNull().default(0),
  ebitda: real("ebitda").notNull().default(0),
  depreciacao: real("depreciacao").notNull().default(0),
  lair: real("lair").notNull().default(0),
  irCsll: real("ir_csll").notNull().default(0),
  lucroLiquido: real("lucro_liquido").notNull().default(0),
  
  // Balanço Patrimonial - Ativo
  caixa: real("caixa").notNull().default(0),
  contasReceber: real("contas_receber").notNull().default(0),
  estoques: real("estoques").notNull().default(0),
  ativoCirculante: real("ativo_circulante").notNull().default(0),
  imobilizado: real("imobilizado").notNull().default(0),
  intangivel: real("intangivel").notNull().default(0),
  ativoNaoCirculante: real("ativo_nao_circulante").notNull().default(0),
  ativoTotal: real("ativo_total").notNull().default(0),
  
  // Balanço Patrimonial - Passivo + PL
  fornecedores: real("fornecedores").notNull().default(0),
  obrigFiscais: real("obrig_fiscais").notNull().default(0),
  outrasObrig: real("outras_obrig").notNull().default(0),
  passivoCirculante: real("passivo_circulante").notNull().default(0),
  financiamentosLP: real("financiamentos_lp").notNull().default(0),
  passivoNaoCirculante: real("passivo_nao_circulante").notNull().default(0),
  capitalSocial: real("capital_social").notNull().default(0),
  lucrosAcumulados: real("lucros_acumulados").notNull().default(0),
  patrimonioLiquido: real("patrimonio_liquido").notNull().default(0),
  passivoPlTotal: real("passivo_pl_total").notNull().default(0),
  
  calculatedAt: timestamp("calculated_at").notNull().default(sql`now()`),
});

export const productResults = pgTable("product_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  productId: varchar("product_id").notNull(),
  revenue: real("revenue").notNull().default(0),
  costs: real("costs").notNull().default(0),
  profit: real("profit").notNull().default(0),
  margin: real("margin").notNull().default(0),
  marketShare: real("market_share").notNull().default(0),
  roi: real("roi").notNull().default(0),
  brandPerception: real("brand_perception").notNull().default(50),
  customerSatisfaction: real("customer_satisfaction").notNull().default(50),
  customerLoyalty: real("customer_loyalty").notNull().default(50),
  cac: real("cac").notNull().default(0),
  ltv: real("ltv").notNull().default(0),
  taxaConversao: real("taxa_conversao").notNull().default(0),
  ticketMedio: real("ticket_medio").notNull().default(0),
  razaoLtvCac: real("razao_ltv_cac").notNull().default(0),
  nps: real("nps").notNull().default(0),
  tempoMedioConversao: real("tempo_medio_conversao").notNull().default(0),
  margemContribuicao: real("margem_contribuicao").notNull().default(0),
  receitaBruta: real("receita_bruta").notNull().default(0),
  receitaLiquida: real("receita_liquida").notNull().default(0),
  budgetBefore: real("budget_before").notNull().default(0),
  profitImpact: real("profit_impact").notNull().default(0),
  budgetAfter: real("budget_after").notNull().default(0),
  alignmentScore: real("alignment_score"),
  alignmentIssues: text("alignment_issues").array(),
  financialBreakdown: jsonb("financial_breakdown"),
  calculatedAt: timestamp("calculated_at").notNull().default(sql`now()`),
}, (table) => ({
  teamRoundProductIdx: index("product_results_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
  uniqueTeamRoundProduct: uniqueIndex("product_results_unique_team_round_product").on(table.teamId, table.roundId, table.productId),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  currentRound: true,
});

export const insertClassFormSchema = z.object({
  name: z.string().min(1),
  professorId: z.string(),
  maxRounds: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 10 : typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().default(10)
  ),
  defaultBudget: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 100000 : typeof val === "string" ? parseFloat(val) : val),
    z.number().positive().default(100000)
  ),
  sector: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional()
  ),
  businessType: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional()
  ),
  marketSize: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : typeof val === "string" ? parseFloat(val) : val),
    z.number().positive().nullable().optional()
  ),
  marketGrowthRate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : typeof val === "string" ? parseFloat(val) : val),
    z.number().nullable().optional()
  ),
  competitionLevel: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional()
  ),
  numberOfCompetitors: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().nullable().optional()
  ),
  marketConcentration: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional()
  ),
  competitorStrength: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().nullable().optional()
  ),
  targetConsumers: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().nullable().optional()
  ),
});

export const insertClassStudentSchema = createInsertSchema(classStudents).omit({
  id: true,
  enrolledAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  budget: true,
  memberIds: true,
  leaderId: true,
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  reach: true,
  engagement: true,
  roi: true,
});

export const insertMarketingMixSchema = createInsertSchema(marketingMix).omit({
  id: true,
  submittedAt: true,
});

export const insertMarketEventSchema = createInsertSchema(marketEvents).omit({
  id: true,
  createdAt: true,
}).extend({
  severity: z.enum(["baixo", "medio", "alto", "critico"]),
});

export const updateTeamIdentitySchema = z.object({
  companyName: z.string().max(100).optional(),
  slogan: z.string().max(200).optional(),
});

export const updateTeamLogoSchema = z.object({
  logoUrl: z.string().url().max(500),
});

export const updateTeamLeaderSchema = z.object({
  leaderId: z.string().uuid(),
});

export const updateClassMarketSchema = z.object({
  sector: z.string().optional(),
  businessType: z.string().optional(),
  marketSize: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? parseFloat(val) : val),
    z.number().positive().optional()
  ),
  marketGrowthRate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? parseFloat(val) : val),
    z.number().optional()
  ),
  defaultBudget: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? parseFloat(val) : val),
    z.number().positive().optional()
  ),
  competitionLevel: z.string().optional(),
  numberOfCompetitors: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().optional()
  ),
  marketConcentration: z.string().optional(),
  competitorStrength: z.string().optional(),
  targetConsumers: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? parseInt(val, 10) : val),
    z.number().int().positive().optional()
  ),
});

export const updateTeamBudgetSchema = z.object({
  budget: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : typeof val === "string" ? parseFloat(val) : val),
    z.number().positive()
  ),
});

export const insertResultSchema = createInsertSchema(results).omit({
  id: true,
  calculatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClassStudent = z.infer<typeof insertClassStudentSchema>;
export type ClassStudent = typeof classStudents.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertMarketingMix = z.infer<typeof insertMarketingMixSchema>;
export type MarketingMix = typeof marketingMix.$inferSelect;
export type InsertMarketEvent = z.infer<typeof insertMarketEventSchema>;
export type MarketEvent = typeof marketEvents.$inferSelect;
export const swotAnalysis = pgTable("swot_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  productId: varchar("product_id"),
  strengths: text("strengths").array().notNull().default(sql`ARRAY[]::text[]`),
  weaknesses: text("weaknesses").array().notNull().default(sql`ARRAY[]::text[]`),
  opportunities: text("opportunities").array().notNull().default(sql`ARRAY[]::text[]`),
  threats: text("threats").array().notNull().default(sql`ARRAY[]::text[]`),
  aiGeneratedPercentage: real("ai_generated_percentage").notNull().default(0),
  originalAIContent: jsonb("original_ai_content"),
  editedByUser: boolean("edited_by_user").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  teamRoundProductIdx: index("swot_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
}));

export const porterAnalysis = pgTable("porter_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  productId: varchar("product_id"),
  competitiveRivalry: integer("competitive_rivalry").notNull().default(5),
  supplierPower: integer("supplier_power").notNull().default(5),
  buyerPower: integer("buyer_power").notNull().default(5),
  threatOfSubstitutes: integer("threat_of_substitutes").notNull().default(5),
  threatOfNewEntry: integer("threat_of_new_entry").notNull().default(5),
  rivalryNotes: text("rivalry_notes"),
  supplierNotes: text("supplier_notes"),
  buyerNotes: text("buyer_notes"),
  substitutesNotes: text("substitutes_notes"),
  newEntryNotes: text("new_entry_notes"),
  aiGeneratedPercentage: real("ai_generated_percentage").notNull().default(0),
  originalAIContent: jsonb("original_ai_content"),
  editedByUser: boolean("edited_by_user").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  teamRoundProductIdx: index("porter_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
}));

export const bcgAnalysis = pgTable("bcg_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  productId: varchar("product_id"),
  productName: text("product_name").notNull(),
  marketGrowth: real("market_growth").notNull(),
  relativeMarketShare: real("relative_market_share").notNull(),
  quadrant: text("quadrant").notNull(),
  notes: text("notes"),
  aiGeneratedPercentage: real("ai_generated_percentage").notNull().default(0),
  originalAIContent: jsonb("original_ai_content"),
  editedByUser: boolean("edited_by_user").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  teamRoundProductIdx: index("bcg_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
}));

export const pestelAnalysis = pgTable("pestel_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  productId: varchar("product_id"),
  political: text("political").array().notNull().default(sql`ARRAY[]::text[]`),
  economic: text("economic").array().notNull().default(sql`ARRAY[]::text[]`),
  social: text("social").array().notNull().default(sql`ARRAY[]::text[]`),
  technological: text("technological").array().notNull().default(sql`ARRAY[]::text[]`),
  environmental: text("environmental").array().notNull().default(sql`ARRAY[]::text[]`),
  legal: text("legal").array().notNull().default(sql`ARRAY[]::text[]`),
  aiGeneratedPercentage: real("ai_generated_percentage").notNull().default(0),
  originalAIContent: jsonb("original_ai_content"),
  editedByUser: boolean("edited_by_user").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  teamRoundProductIdx: index("pestel_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
}));

export const insertSwotSchema = createInsertSchema(swotAnalysis).omit({
  id: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPorterSchema = createInsertSchema(porterAnalysis).omit({
  id: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBcgSchema = createInsertSchema(bcgAnalysis).omit({
  id: true,
  teamId: true,
  createdAt: true,
});

export const insertPestelSchema = createInsertSchema(pestelAnalysis).omit({
  id: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
});

export type UpdateTeamIdentity = z.infer<typeof updateTeamIdentitySchema>;
export type UpdateTeamLogo = z.infer<typeof updateTeamLogoSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof results.$inferSelect;
export type InsertSwot = z.infer<typeof insertSwotSchema>;
export type SwotAnalysis = typeof swotAnalysis.$inferSelect;
export type InsertPorter = z.infer<typeof insertPorterSchema>;
export type PorterAnalysis = typeof porterAnalysis.$inferSelect;
export type InsertBcg = z.infer<typeof insertBcgSchema>;
export type BcgAnalysis = typeof bcgAnalysis.$inferSelect;
export type InsertPestel = z.infer<typeof insertPestelSchema>;
export type PestelAnalysis = typeof pestelAnalysis.$inferSelect;

export const economicData = pgTable("economic_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull().default(sql`now()`),
  exchangeRateUSD: real("exchange_rate_usd").notNull(),
  exchangeRateTrend: text("exchange_rate_trend"),
  inflationRate: real("inflation_rate"),
  interestRate: real("interest_rate"),
  gdpGrowth: real("gdp_growth"),
  consumerConfidence: real("consumer_confidence"),
  source: text("source").notNull().default("api"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const autoEventConfig = pgTable("auto_event_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  eventFrequency: text("event_frequency").notNull().default("every_round"),
  minEventsPerRound: integer("min_events_per_round").notNull().default(1),
  maxEventsPerRound: integer("max_events_per_round").notNull().default(3),
  economicWeight: real("economic_weight").notNull().default(0.4),
  technologicalWeight: real("technological_weight").notNull().default(0.2),
  socialWeight: real("social_weight").notNull().default(0.2),
  competitiveWeight: real("competitive_weight").notNull().default(0.2),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertEconomicDataSchema = createInsertSchema(economicData).omit({
  id: true,
  createdAt: true,
});

export const insertAutoEventConfigSchema = createInsertSchema(autoEventConfig).omit({
  id: true,
  updatedAt: true,
});

export const aiFeedback = pgTable("ai_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  overallAnalysis: text("overall_analysis").notNull(),
  strengths: jsonb("strengths").notNull(),
  weaknesses: jsonb("weaknesses").notNull(),
  suggestions: jsonb("suggestions").notNull(),
  literatureRecommendations: jsonb("literature_recommendations").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAiFeedbackSchema = createInsertSchema(aiFeedback).omit({
  id: true,
  createdAt: true,
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  sectorIdx: index("product_sector_idx").on(table.sector),
  slugIdx: index("product_slug_idx").on(table.slug),
}));

export const strategicRecommendations = pgTable("strategic_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull(),
  roundId: varchar("round_id").notNull(),
  productId: varchar("product_id"),
  product: text("product").array().notNull().default(sql`ARRAY[]::text[]`),
  price: text("price").array().notNull().default(sql`ARRAY[]::text[]`),
  place: text("place").array().notNull().default(sql`ARRAY[]::text[]`),
  promotion: text("promotion").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  teamRoundProductIdx: index("strategic_recommendations_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
}));

export const insertStrategicRecommendationsSchema = createInsertSchema(strategicRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStrategicRecommendations = z.infer<typeof insertStrategicRecommendationsSchema>;
export type StrategicRecommendations = typeof strategicRecommendations.$inferSelect;

export type InsertEconomicData = z.infer<typeof insertEconomicDataSchema>;
export type EconomicData = typeof economicData.$inferSelect;
export type InsertAutoEventConfig = z.infer<typeof insertAutoEventConfigSchema>;
export type AutoEventConfig = typeof autoEventConfig.$inferSelect;
export type InsertAiFeedback = z.infer<typeof insertAiFeedbackSchema>;
export type AiFeedback = typeof aiFeedback.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertProductResultSchema = createInsertSchema(productResults).omit({
  id: true,
  calculatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductResult = z.infer<typeof insertProductResultSchema>;
export type ProductResult = typeof productResults.$inferSelect;

export const midias = pgTable("midias", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoria: text("categoria").notNull(),
  nome: text("nome").notNull(),
  formato: text("formato"),
  custoUnitarioMinimo: real("custo_unitario_minimo").notNull(),
  unidade: text("unidade").notNull().default("unidade"),
  quantidadeSugerida: text("quantidade_sugerida"),
  descricao: text("descricao"),
  orderIndex: integer("order_index").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  categoriaIdx: index("midias_categoria_idx").on(table.categoria),
}));

export const teamProducts = pgTable("team_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  roundId: varchar("round_id").notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  productName: text("product_name"),
  productDescription: text("product_description"),
  targetAudienceClass: text("target_audience_class"),
  targetAudienceAge: text("target_audience_age"),
  targetAudienceProfile: text("target_audience_profile"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
}, (table) => ({
  teamRoundProductIdx: uniqueIndex("team_products_team_round_product_idx").on(table.teamId, table.roundId, table.productId),
}));

export const insertMidiaSchema = createInsertSchema(midias).omit({
  id: true,
  createdAt: true,
});

export const insertTeamProductSchema = createInsertSchema(teamProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const roundAccessLogs = pgTable("round_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  classId: varchar("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
}, (table) => ({
  roundClassIdx: index("round_access_logs_round_class_idx").on(table.roundId, table.classId),
  classIdx: index("round_access_logs_class_idx").on(table.classId),
}));

export type InsertMidia = z.infer<typeof insertMidiaSchema>;
export type Midia = typeof midias.$inferSelect;
export type InsertTeamProduct = z.infer<typeof insertTeamProductSchema>;
export type TeamProduct = typeof teamProducts.$inferSelect;
export type RoundAccessLog = typeof roundAccessLogs.$inferSelect;
export type InsertRoundAccessLog = typeof roundAccessLogs.$inferInsert;
