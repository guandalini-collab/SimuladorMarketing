import { pool } from "./pg-storage";
import { marketSectors } from "./data/marketData";

/**
 * Catálogo de produtos (out/2026): mantém a tabela "products" igual às
 * categorias de server/data/marketData.ts, que passaram a ter preço médio
 * com fonte. Antes, o catálogo só era atualizado rodando à mão o script
 * seed-products.ts.
 *
 * - Insere/atualiza cada categoria (slug "<categoria>-<setor>").
 * - Categorias que saíram da base (ex.: "Suplemento Proteico" em Esportes,
 *   trocado por "Bola de Futebol"; os 4 cursos de Educação, trocados pelos
 *   níveis de ensino) ficam inativas — nunca apagadas, para preservar o
 *   histórico de decisões e resultados que apontam para elas.
 * Idempotente: pode rodar a cada boot.
 */
export async function ensureProductCatalog(): Promise<void> {
  try {
    let atualizados = 0;
    for (const sector of marketSectors) {
      const slugs: string[] = [];
      let ordem = 0;
      for (const cat of sector.categories ?? []) {
        const slug = `${cat.id}-${sector.id}`;
        slugs.push(slug);
        await pool.query(
          `INSERT INTO products (name, sector, slug, description, order_index, active)
           VALUES ($1, $2, $3, $4, $5, true)
           ON CONFLICT (slug) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             order_index = EXCLUDED.order_index,
             active = true`,
          [cat.name, sector.id, slug, cat.description, ordem++],
        );
        atualizados++;
      }
      await pool.query(
        `UPDATE products SET active = false WHERE sector = $1 AND NOT (slug = ANY($2::text[])) AND active = true`,
        [sector.id, slugs],
      );
    }
    console.log(`[BOOT] Catálogo de produtos sincronizado com a base de mercado (${atualizados} categorias).`);
  } catch (e) {
    console.log(`[BOOT] Falha ao sincronizar o catálogo de produtos: ${e}`);
  }
}
