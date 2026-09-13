import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Mesmo driver usado em pg-storage.ts: o Postgres hospedado no Railway fala
// o protocolo TCP padrão, não o endpoint HTTP/WebSocket da Neon.tech, então
// @neondatabase/serverless (usado antes aqui) não conseguia se conectar
// (script órfão, nunca atualizado quando o driver principal foi corrigido).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedDemoData() {
  console.log('🌱 Populando dados demo do Simula+...\n');

  const client = await pool.connect();
  try {
    // 1. Criar mais um aluno aprovado
    const studentId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash('senhaSegura123', 10);
    await client.query(
      `INSERT INTO users (id, email, password, name, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [studentId, 'maria.silva@iffarroupilha.edu.br', hashedPassword, 'Maria Silva', 'equipe', 'approved']
    );
    console.log('✅ Aluno adicional criado: maria.silva@iffarroupilha.edu.br');

    // 2. Obter ID do professor
    const professorResult = await client.query(
      `SELECT id FROM users WHERE role = 'professor' LIMIT 1`
    );
    const professorId = professorResult.rows[0].id;

    // 3. Criar turma demo completa
    const classId = crypto.randomUUID();
    await client.query(
      `INSERT INTO classes (
        id, name, professor_id, sector, business_type, market_size, target_consumers,
        competition_level, number_of_competitors, competitor_strength, default_budget
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING`,
      [classId, 'Turma Demo - Marketing Digital 2025', professorId, 'tecnologia', 'b2c', 5000000, 50000, 'alta', 8, 'forte', 150000]
    );
    console.log('✅ Turma demo criada: Marketing Digital 2025');

    // 4. Criar equipe demo (com aluno já incluído no member_ids)
    const teamId = crypto.randomUUID();
    await client.query(
      `INSERT INTO teams (
        id, name, class_id, leader_id, member_ids, budget, initial_budget,
        company_name, slogan, product_category, target_audience_class, target_audience_age
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [teamId, 'Tech Innovators', classId, studentId, [studentId], 150000, 150000, 'TechFlow Solutions', 'Inovação que Transforma', 'Software de Gestão Empresarial', 'b2b', '25-45']
    );
    console.log('✅ Equipe criada: Tech Innovators (com Maria Silva como membro e líder)');

    // 6. Criar rodada ativa
    const roundId = crypto.randomUUID();
    await client.query(
      `INSERT INTO rounds (id, class_id, round_number, started_at, status)
       VALUES ($1, $2, $3, NOW(), $4)`,
      [roundId, classId, 1, 'active']
    );
    console.log('✅ Rodada 1 iniciada (status: active)');

    // 7. Criar decisão de marketing mix (rascunho)
    const mixId = crypto.randomUUID();
    await client.query(
      `INSERT INTO marketing_mix (
        id, team_id, round_id,
        product_quality, product_features, brand_positioning,
        price_strategy, price_value,
        distribution_channels, distribution_coverage,
        promotion_mix, promotion_intensity, promotion_budgets,
        estimated_cost
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14)`,
      [
        mixId, teamId, roundId,
        'premium', 'avancado', 'qualidade',
        'premium', 299.90,
        ['online', 'parceiros'], 'nacional',
        ['digital', 'influenciadores'], 'alto',
        JSON.stringify({ marketingDigital: 15000, influenciadores: 10000, redesSociais: 8000 }),
        33000,
      ]
    );
    console.log('✅ Marketing Mix (rascunho) criado para Rodada 1');

    // 8. Criar evento de mercado
    const eventId = crypto.randomUUID();
    await client.query(
      `INSERT INTO market_events (
        id, class_id, round_id, type, title, description, impact, severity, active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventId, classId, roundId, 'market', 'Black Friday 2025',
        'Maior evento de vendas do ano com descontos de até 70%. Consumidores aguardam ansiosamente por promoções em tecnologia.',
        'positive', 'high', true,
      ]
    );
    console.log('✅ Evento de mercado criado: Black Friday 2025');

    // 9. Criar análise SWOT
    const swotId = crypto.randomUUID();
    await client.query(
      `INSERT INTO swot_analysis (
        id, team_id, round_id,
        strengths, weaknesses, opportunities, threats,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        swotId, teamId, roundId,
        ['Produto inovador com IA', 'Equipe técnica qualificada'],
        ['Marca nova no mercado', 'Orçamento limitado'],
        ['Crescimento do setor', 'Digitalização empresas'],
        ['Concorrentes estabelecidos', 'Mudanças tecnológicas rápidas'],
      ]
    );
    console.log('✅ Análise SWOT criada');

    // 10. Criar dados econômicos
    const ecoId = crypto.randomUUID();
    await client.query(
      `INSERT INTO economic_data (
        id, exchange_rate_usd, exchange_rate_trend, inflation_rate, interest_rate, gdp_growth, consumer_confidence
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING`,
      [ecoId, 5.45, 'stable', 4.8, 11.75, 2.3, 65.5]
    );
    console.log('✅ Dados econômicos atualizados');

    console.log('\n🎉 Dados demo criados com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   • Turma: Marketing Digital 2025');
    console.log('   • Equipe: Tech Innovators (TechFlow Solutions)');
    console.log('   • Líder: Maria Silva (maria.silva@iffarroupilha.edu.br / senhaSegura123)');
    console.log('   • Rodada 1: ATIVA');
    console.log('   • Marketing Mix: Rascunho salvo');
    console.log('   • Evento: Black Friday 2025');
    console.log('   • Análise SWOT: Completa\n');

  } catch (error) {
    console.error('❌ Erro ao criar dados demo:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemoData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
