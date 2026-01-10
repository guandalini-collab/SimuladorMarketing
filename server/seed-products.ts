import { Pool } from 'pg';
import { marketSectors } from './data/marketData';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedProducts() {
  const client = await pool.connect();
  try {
    console.log('Starting product seeding...');
    
    let productCount = 0;
    for (const sector of marketSectors) {
      let orderIndex = 0;
      for (const category of sector.categories || []) {
        const slug = `${category.id}-${sector.id}`;
        const query = `
          INSERT INTO products (name, sector, slug, description, order_index, active)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            order_index = EXCLUDED.order_index,
            active = EXCLUDED.active
          RETURNING id, name, sector;
        `;
        
        const result = await client.query(query, [
          category.name,
          sector.id,
          slug,
          category.description,
          orderIndex++,
          true
        ]);
        
        console.log(`✓ Created/Updated: ${result.rows[0].name} (${result.rows[0].sector})`);
        productCount++;
      }
    }
    
    console.log(`\n✅ Seeding complete! ${productCount} products processed.`);
    
    const countResult = await client.query('SELECT COUNT(*) FROM products');
    console.log(`Total products in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedProducts();
