# 🚂 Deploy Rápido no Railway - 5 Minutos

## Por que Railway?
- ✅ Deploy automático em minutos
- ✅ PostgreSQL configurado automaticamente
- ✅ SSL/HTTPS grátis
- ✅ $5-15/mês (muito mais barato que VPS)
- ✅ Domínio personalizado incluído

---

## 🚀 Passo a Passo Simplificado

### 1️⃣ Criar Conta Railway
1. Acesse: https://railway.app
2. Clique em "Start a New Project"
3. Faça login com GitHub

### 2️⃣ Preparar Código no GitHub
```bash
# No terminal do Replit:
git init
git add .
git commit -m "Deploy inicial"

# Crie um repositório no GitHub
# Depois conecte:
git remote add origin https://github.com/SEU-USUARIO/simula-plus.git
git branch -M main
git push -u origin main
```

### 3️⃣ Deploy no Railway
1. No Railway: **"New Project"**
2. **"Deploy from GitHub repo"**
3. Selecione o repositório `simula-plus`
4. Railway detecta automaticamente Node.js ✅

### 4️⃣ Adicionar PostgreSQL
1. No seu projeto: **"+ New"**
2. **"Database"** → **"Add PostgreSQL"**
3. Railway cria automaticamente `DATABASE_URL` ✅

### 5️⃣ Configurar Variáveis
Clique em seu serviço → **"Variables"** → **"+ New Variable"**

Adicione:
```
NODE_ENV=production
SESSION_SECRET=gere-um-secret-super-seguro-aleatório-aqui
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
```

> **Gerar SESSION_SECRET seguro:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 6️⃣ Migrar Banco de Dados
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Fazer login
railway login

# Conectar ao projeto
railway link

# Rodar migração
railway run npm run db:push
```

### 7️⃣ Configurar Domínio Personalizado

#### No Railway:
1. Clique no serviço → **"Settings"**
2. **"Domains"** → **"Custom Domain"**
3. Adicione: `simulamarketing.com.br`

#### No HostGator (cPanel):
1. **Zone Editor**
2. Adicione registro **CNAME**:

```
Tipo: CNAME
Nome: @
Destino: seu-app.up.railway.app
TTL: 3600
```

Para **www**:
```
Tipo: CNAME
Nome: www
Destino: seu-app.up.railway.app
TTL: 3600
```

> **Nota**: Aguarde 5-60 minutos para DNS propagar

### 8️⃣ Verificar Deploy
1. Vá em **"Deployments"**
2. Verifique se status é **"Success"** ✅
3. Clique no link gerado (ex: `simula-plus-production.up.railway.app`)
4. Teste login e funcionalidades

---

## ✅ Checklist Final

- [ ] Aplicação rodando em Railway
- [ ] PostgreSQL conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio personalizado funcionando
- [ ] HTTPS ativo (automático)
- [ ] Login funciona
- [ ] Banco de dados migrado

---

## 🔧 Comandos Úteis Railway CLI

```bash
# Ver logs em tempo real
railway logs

# Executar comando no servidor
railway run npm run db:push

# Abrir banco de dados
railway connect postgres

# Ver variáveis
railway variables

# Deploy manual
railway up
```

---

## 📊 Custos Railway

### Hobby Plan (Recomendado para iniciar)
- **$5/mês**
- 500 horas de execução
- PostgreSQL incluído
- Domínio personalizado incluído
- SSL grátis

### Pro Plan (Para escala)
- **$20/mês**
- Execução ilimitada
- Mais recursos
- Suporte prioritário

**Estimativa para Simula+**: $5-15/mês

---

## 🆘 Troubleshooting

### Build Falha
```bash
# Verifique logs
railway logs

# Comum: falta variável
# Solução: Adicione todas as variáveis de ambiente
```

### Database Connection Error
```bash
# Verifique DATABASE_URL
railway variables

# Execute migração novamente
railway run npm run db:push
```

### Aplicação não inicia
```bash
# Verifique se PORT está configurada
# Railway injeta PORT automaticamente
# Seu código já está preparado para isso ✅
```

### Domínio não funciona
- Aguarde 30-60 minutos para DNS propagar
- Verifique registros CNAME no HostGator
- Teste com `nslookup simulamarketing.com.br`

---

## 📱 Deploy Automático

Após configuração inicial, cada `git push` faz deploy automático:

```bash
# Fazer mudanças no código
git add .
git commit -m "Nova funcionalidade"
git push

# Railway detecta e faz deploy automaticamente! 🎉
```

---

## 🔄 Migração de Dados do Replit

Se tiver dados no PostgreSQL do Replit:

```bash
# 1. Exportar do Replit
pg_dump $DATABASE_URL > backup.sql

# 2. Importar no Railway
railway run psql $DATABASE_URL < backup.sql
```

---

## 🎓 Próximos Passos

1. ✅ **Teste completo** da aplicação
2. ✅ **Configure monitoramento** (Railway tem built-in)
3. ✅ **Backups automáticos** do banco
4. ✅ **Adicione analytics** (opcional)
5. ✅ **Configure email** de notificações

---

## 💡 Dicas Extras

### Performance
- Railway usa servidores nos EUA (latência ~150ms Brasil)
- Para melhor performance: considere Fly.io (tem região BR)

### Segurança
- Sempre use HTTPS (Railway faz automático)
- Gere SESSION_SECRET forte
- Nunca commite `.env` no Git

### Backups
```bash
# Backup manual
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Automatize com GitHub Actions (opcional)
```

---

## 📞 Suporte

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Status**: https://status.railway.app

---

Seu Simula+ estará online em **https://simulamarketing.com.br** em minutos! 🚀
