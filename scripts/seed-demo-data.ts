import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

async function seedDemoData() {
  console.log('🌱 Populando dados demo do Simula+...\n');

  try {
    // 1. Criar mais um aluno aprovado
    const studentId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash('senhaSegura123', 10);
    await sql`
      INSERT INTO users (id, email, password, name, role, status)
      VALUES (
        ${studentId},
        'maria.silva@iffarroupilha.edu.br',
        ${hashedPassword},
        'Maria Silva',
        'equipe',
        'approved'
      )
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Aluno adicional criado: maria.silva@iffarroupilha.edu.br');

    // 2. Obter ID do professor
    const professorResult = await sql`
      SELECT id FROM users WHERE role = 'professor' LIMIT 1
    `;
    const professorId = professorResult[0].id;

    // 3. Criar turma demo completa
    const classId = crypto.randomUUID();
    await sql`
      INSERT INTO classes (
        id, name, professor_id, sector, business_type, market_size, target_consumers,
        competition_level, number_of_competitors, competitor_strength, default_budget
      )
      VALUES (
        ${classId},
        'Turma Demo - Marketing Digital 2025',
        ${professorId},
        'tecnologia',
        'b2c',
        5000000,
        50000,
        'alta',
        8,
        'forte',
        150000
      )
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Turma demo criada: Marketing Digital 2025');

    // 4. Criar equipe demo (com aluno já incluído no member_ids)
    const teamId = crypto.randomUUID();
    await sql`
      INSERT INTO teams (
        id, name, class_id, leader_id, member_ids, budget, initial_budget,
        company_name, slogan, product_category, target_audience_class, target_audience_age
      )
      VALUES (
        ${teamId},
        'Tech Innovators',
        ${classId},
        ${studentId},
        ARRAY[${studentId}],
        150000,
        150000,
        'TechFlow Solutions',
        'Inovação que Transforma',
        'Software de Gestão Empresarial',
        'b2b',
        '25-45'
      )
    `;
    console.log('✅ Equipe criada: Tech Innovators (com Maria Silva como membro e líder)');

    // 6. Criar rodada ativa
    const roundId = crypto.randomUUID();
    await sql`
      INSERT INTO rounds (
        id, class_id, round_number, started_at, status
      )
      VALUES (
        ${roundId},
        ${classId},
        1,
        NOW(),
        'active'
      )
    `;
    console.log('✅ Rodada 1 iniciada (status: active)');

    // 7. Criar decisão de marketing mix (rascunho)
    const mixId = crypto.randomUUID();
    await sql`
      INSERT INTO marketing_mix (
        id, team_id, round_id,
        product_quality, product_features, brand_positioning,
        price_strategy, price_value,
        distribution_channels, distribution_coverage,
        promotion_mix, promotion_intensity, promotion_budgets,
        estimated_cost
      )
      VALUES (
        ${mixId},
        ${teamId},
        ${roundId},
        'premium',
        'avancado',
        'qualidade',
        'premium',
        299.90,
        ARRAY['online', 'parceiros'],
        'nacional',
        ARRAY['digital', 'influenciadores'],
        'alto',
        '{"marketingDigital": 15000, "influenciadores": 10000, "redesSociais": 8000}'::jsonb,
        33000
      )
    `;
    console.log('✅ Marketing Mix (rascunho) criado para Rodada 1');

    // 8. Criar evento de mercado
    const eventId = crypto.randomUUID();
    await sql`
      INSERT INTO market_events (
        id, class_id, round_id, type, title, description, impact, severity, active
      )
      VALUES (
        ${eventId},
        ${classId},
        ${roundId},
        'market',
        'Black Friday 2025',
        'Maior evento de vendas do ano com descontos de até 70%. Consumidores aguardam ansiosamente por promoções em tecnologia.',
        'positive',
        'high',
        true
      )
    `;
    console.log('✅ Evento de mercado criado: Black Friday 2025');

    // 9. Criar análise SWOT
    const swotId = crypto.randomUUID();
    await sql`
      INSERT INTO swot_analysis (
        id, team_id, round_id,
        strengths, weaknesses, opportunities, threats,
        created_at
      )
      VALUES (
        ${swotId},
        ${teamId},
        ${roundId},
        ARRAY['Produto inovador com IA', 'Equipe técnica qualificada'],
        ARRAY['Marca nova no mercado', 'Orçamento limitado'],
        ARRAY['Crescimento do setor', 'Digitalização empresas'],
        ARRAY['Concorrentes estabelecidos', 'Mudanças tecnológicas rápidas'],
        NOW()
      )
    `;
    console.log('✅ Análise SWOT criada');

    // 10. Criar dados econômicos
    const ecoId = crypto.randomUUID();
    await sql`
      INSERT INTO economic_data (
        id, exchange_rate_usd, exchange_rate_trend, inflation_rate, interest_rate, gdp_growth, consumer_confidence
      )
      VALUES (
        ${ecoId},
        5.45,
        'stable',
        4.8,
        11.75,
        2.3,
        65.5
      )
      ON CONFLICT DO NOTHING
    `;
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
  }
}

seedDemoData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
