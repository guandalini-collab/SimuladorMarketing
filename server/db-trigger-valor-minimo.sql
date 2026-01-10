-- Trigger para validar valores mínimos de mídias ao salvar marketing mix
-- Este trigger garante que todos os valores em promotionBudgets sejam >= valorMinimo da mídia

CREATE OR REPLACE FUNCTION validate_promotion_budgets()
RETURNS TRIGGER AS $$
DECLARE
  midia_id TEXT;
  budget_value NUMERIC;
  min_value NUMERIC;
BEGIN
  -- Verifica se promotionBudgets existe e não é nulo
  IF NEW.promotion_budgets IS NOT NULL THEN
    -- Itera sobre cada chave (midiaId) no JSON promotionBudgets
    FOR midia_id, budget_value IN SELECT * FROM jsonb_each_text(NEW.promotion_budgets::jsonb)
    LOOP
      -- Busca o custo unitário mínimo da mídia (nome correto da coluna)
      SELECT custo_unitario_minimo INTO min_value
      FROM midias
      WHERE id = midia_id;
      
      -- Se a mídia existe e o valor é maior que 0 mas menor que o mínimo, rejeita
      IF min_value IS NOT NULL AND budget_value::numeric > 0 AND budget_value::numeric < min_value THEN
        RAISE EXCEPTION 'Valor de R$ % para mídia % é menor que o mínimo de R$ %', 
          budget_value, midia_id, min_value;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger (DROP IF EXISTS para evitar erro se já existir)
DROP TRIGGER IF EXISTS check_promotion_budgets ON marketing_mix;
CREATE TRIGGER check_promotion_budgets
  BEFORE INSERT OR UPDATE ON marketing_mix
  FOR EACH ROW
  EXECUTE FUNCTION validate_promotion_budgets();
