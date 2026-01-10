import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { midias } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const midiasData = [
  // MÍDIA IMPRESSA (p. 4)
  {
    categoria: "Mídia Impressa",
    nome: "Jornal",
    formato: "Página Inteira",
    custoUnitarioMinimo: 8500.00,
    unidade: "inserção",
    quantidadeSugerida: "1-3",
    orderIndex: 1
  },
  {
    categoria: "Mídia Impressa",
    nome: "Jornal",
    formato: "Meia Página",
    custoUnitarioMinimo: 4500.00,
    unidade: "inserção",
    quantidadeSugerida: "2-5",
    orderIndex: 2
  },
  {
    categoria: "Mídia Impressa",
    nome: "Revista",
    formato: "Página Inteira",
    custoUnitarioMinimo: 12000.00,
    unidade: "inserção",
    quantidadeSugerida: "1-2",
    orderIndex: 3
  },
  
  // INFLUENCIADORES (p. 7)
  {
    categoria: "Marketing Digital",
    nome: "Influenciador",
    formato: "Micro (até 100k seguidores)",
    custoUnitarioMinimo: 1200.00,
    unidade: "campanha",
    quantidadeSugerida: "3-5",
    orderIndex: 10
  },
  {
    categoria: "Marketing Digital",
    nome: "Influenciador",
    formato: "Médio (100k-500k seguidores)",
    custoUnitarioMinimo: 3500.00,
    unidade: "campanha",
    quantidadeSugerida: "2-3",
    orderIndex: 11
  },
  {
    categoria: "Marketing Digital",
    nome: "Influenciador",
    formato: "Grande (500k+ seguidores)",
    custoUnitarioMinimo: 8000.00,
    unidade: "campanha",
    quantidadeSugerida: "1-2",
    orderIndex: 12
  },
  
  // E-MAIL MARKETING (p. 8)
  {
    categoria: "Marketing Digital",
    nome: "E-mail Marketing",
    formato: "Campanha",
    custoUnitarioMinimo: 0.12,
    unidade: "envio",
    quantidadeSugerida: "1000-10000",
    descricao: "R$ 0,12 por envio",
    orderIndex: 13
  },
  
  // PODCASTS (p. 9)
  {
    categoria: "Marketing Digital",
    nome: "Podcast",
    formato: "Inserção",
    custoUnitarioMinimo: 800.00,
    unidade: "inserção",
    quantidadeSugerida: "2-4",
    orderIndex: 14
  },
  
  // OOH EXTERIOR (p. 13)
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Outdoor",
    formato: "Fixo",
    custoUnitarioMinimo: 1700.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "5-10",
    orderIndex: 20
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Front Light",
    formato: "Padrão",
    custoUnitarioMinimo: 4000.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "3-5",
    orderIndex: 21
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Busdoor",
    formato: "Padrão",
    custoUnitarioMinimo: 900.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "10-20",
    orderIndex: 22
  },
  {
    categoria: "Mídia Exterior (OOH)",
    nome: "Painéis Digitais",
    formato: "Padrão",
    custoUnitarioMinimo: 1400.00,
    unidade: "unidade/mês",
    quantidadeSugerida: "5-10",
    orderIndex: 23
  },
  
  // RÁDIO (p. 16)
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Spot 30s",
    custoUnitarioMinimo: 500.00,
    unidade: "inserção",
    quantidadeSugerida: "20-50",
    orderIndex: 30
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "Rádio",
    formato: "Testemunhal",
    custoUnitarioMinimo: 1200.00,
    unidade: "inserção",
    quantidadeSugerida: "10-20",
    orderIndex: 31
  },
  
  // TV (p. 18)
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Comercial 15s",
    custoUnitarioMinimo: 18000.00,
    unidade: "inserção",
    quantidadeSugerida: "5-10",
    orderIndex: 32
  },
  {
    categoria: "Mídia Eletrônica",
    nome: "TV",
    formato: "Comercial 30s",
    custoUnitarioMinimo: 30000.00,
    unidade: "inserção",
    quantidadeSugerida: "3-8",
    orderIndex: 33
  },
  
  // CINEMA (p. 20)
  {
    categoria: "Mídia Eletrônica",
    nome: "Cinema",
    formato: "Comercial 30s",
    custoUnitarioMinimo: 12000.00,
    unidade: "semana",
    quantidadeSugerida: "2-4",
    orderIndex: 34
  },
  
  // MARKETING DIRETO (p. 21, 36)
  {
    categoria: "Marketing Direto",
    nome: "Carro de Som",
    formato: "Padrão",
    custoUnitarioMinimo: 350.00,
    unidade: "dia",
    quantidadeSugerida: "5-10",
    orderIndex: 40
  },
  {
    categoria: "Marketing Direto",
    nome: "Panfletos e Flyers",
    formato: "Impressão",
    custoUnitarioMinimo: 0.22,
    unidade: "unidade",
    quantidadeSugerida: "5000-20000",
    descricao: "R$ 0,22 por unidade",
    orderIndex: 41
  },
  {
    categoria: "Marketing Direto",
    nome: "Panfletos e Flyers",
    formato: "Distribuição",
    custoUnitarioMinimo: 0.18,
    unidade: "unidade",
    quantidadeSugerida: "5000-20000",
    descricao: "R$ 0,18 por unidade distribuída",
    orderIndex: 42
  },
  
  // RELAÇÕES PÚBLICAS (p. 36)
  {
    categoria: "Relações Públicas",
    nome: "Assessoria de Imprensa",
    formato: "Mensal",
    custoUnitarioMinimo: 3800.00,
    unidade: "mês",
    quantidadeSugerida: "1-3",
    orderIndex: 50
  },
  {
    categoria: "Relações Públicas",
    nome: "Comunicados à Imprensa",
    formato: "Por release",
    custoUnitarioMinimo: 280.00,
    unidade: "release",
    quantidadeSugerida: "3-6",
    orderIndex: 51
  },
  
  // PROMOÇÕES DE VENDAS (p. 36)
  {
    categoria: "Promoção de Vendas",
    nome: "Brindes",
    formato: "Padrão",
    custoUnitarioMinimo: 8.00,
    unidade: "unidade",
    quantidadeSugerida: "500-2000",
    descricao: "R$ 8,00 por brinde",
    orderIndex: 60
  },
  
  // PRODUCT PLACEMENT (p. 37)
  {
    categoria: "Product Placement",
    nome: "Product Placement",
    formato: "Inserção Simples",
    custoUnitarioMinimo: 6000.00,
    unidade: "inserção",
    quantidadeSugerida: "1-2",
    orderIndex: 70
  },
  {
    categoria: "Product Placement",
    nome: "Product Placement",
    formato: "Inserção Premium",
    custoUnitarioMinimo: 18000.00,
    unidade: "inserção",
    quantidadeSugerida: "1",
    orderIndex: 71
  },
];

async function seedMidias() {
  try {
    console.log("🌱 Iniciando seed de mídias...");
    
    // Limpar tabela existente
    await db.delete(midias);
    console.log("✓ Tabela limpa");
    
    // Inserir mídias
    for (const midia of midiasData) {
      await db.insert(midias).values(midia);
    }
    
    console.log(`✓ ${midiasData.length} mídias inseridas com sucesso!`);
    console.log("\nCategorias:");
    const categorias = Array.from(new Set(midiasData.map(m => m.categoria)));
    categorias.forEach(cat => {
      const count = midiasData.filter(m => m.categoria === cat).length;
      console.log(`  - ${cat}: ${count} formatos`);
    });
    
  } catch (error) {
    console.error("❌ Erro ao fazer seed de mídias:", error);
    throw error;
  }
}

seedMidias()
  .then(() => {
    console.log("\n✅ Seed concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Falha no seed:", error);
    process.exit(1);
  });
