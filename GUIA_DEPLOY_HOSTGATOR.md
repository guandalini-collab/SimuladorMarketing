# 🚀 Guia Completo de Deploy - Simula+ Marketing

## ⚠️ IMPORTANTE: Hospedagem Compartilhada NÃO Funciona

Sua aplicação Simula+ requer:
- ✅ Node.js rodando 24/7 (backend Express)
- ✅ PostgreSQL (banco de dados)
- ✅ WebSockets (tempo real)
- ✅ Integração OpenAI
- ✅ Sessões de usuário persistentes

**Hospedagem compartilhada HostGator NÃO suporta esses recursos.**

---

## 📊 Comparação de Plataformas

| Plataforma | Preço/Mês | Facilidade | PostgreSQL | Domínio Personalizado | Recomendação |
|-----------|-----------|------------|------------|----------------------|--------------|
| **Railway** | $5-20 | ⭐⭐⭐⭐⭐ | ✅ Incluso | ✅ Grátis | ⭐ **MELHOR** |
| **Render** | $7-15 | ⭐⭐⭐⭐ | ✅ Incluso | ✅ Grátis | ⭐ Ótimo |
| **DigitalOcean** | $12+15 | ⭐⭐⭐ | ✅ Separado | ✅ Grátis | Bom |
| **HostGator VPS** | $24-80 | ⭐ | ⚠️ Manual | ✅ Incluso | Complexo |

---

## 🥇 OPÇÃO 1: Railway (RECOMENDADO)

### Por que Railway?
- ✅ Deploy em 5 minutos
- ✅ Integração direta com GitHub/Replit
- ✅ PostgreSQL incluso e configurado automaticamente
- ✅ SSL grátis (HTTPS automático)
- ✅ Escalabilidade automática
- ✅ $5/mês para começar
- ✅ Domínio personalizado (simulamarketing.com.br)

### Passo a Passo Railway

#### 1. Criar Conta
1. Acesse [railway.app](https://railway.app)
2. Clique em "Start a New Project"
3. Conecte com GitHub (ou use CLI)

#### 2. Preparar Repositório
```bash
# No Replit, crie um repositório Git
git init
git add .
git commit -m "Preparando deploy Railway"

# Crie repositório no GitHub e faça push
git remote add origin https://github.com/SEU-USUARIO/simula-plus.git
git push -u origin main
```

#### 3. Deploy no Railway
1. No Railway: "New Project" → "Deploy from GitHub"
2. Selecione o repositório `simula-plus`
3. Railway detectará automaticamente Node.js

#### 4. Adicionar PostgreSQL
1. No projeto Railway: "+ New" → "Database" → "PostgreSQL"
2. Railway criará automaticamente a variável `DATABASE_URL`

#### 5. Configurar Variáveis de Ambiente
No Railway, vá em "Variables" e adicione:
```
NODE_ENV=production
SESSION_SECRET=seu-secret-super-seguro-aqui
OPENAI_API_KEY=sua-chave-openai
RESEND_API_KEY=sua-chave-resend
PORT=5000
```

#### 6. Configurar Build
Railway detectará automaticamente seu `package.json`:
- Build: `npm run build`
- Start: `npm start`

#### 7. Migrar Banco de Dados
```bash
# Instale Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Execute migração
railway run npm run db:push
```

#### 8. Configurar Domínio Personalizado
1. No Railway: "Settings" → "Domains"
2. Adicione: `simulamarketing.com.br`
3. Configure DNS no HostGator:

**No HostGator cPanel → Zone Editor:**
```
Tipo: CNAME
Nome: @
Destino: SEU-APP.up.railway.app
TTL: 3600
```

**Para www:**
```
Tipo: CNAME
Nome: www
Destino: SEU-APP.up.railway.app
TTL: 3600
```

✅ **Pronto! Aplicação rodando em https://simulamarketing.com.br**

---

## 🥈 OPÇÃO 2: Render

### Passo a Passo Render

#### 1. Criar Conta
1. Acesse [render.com](https://render.com)
2. Conecte com GitHub

#### 2. Deploy
1. "New" → "Web Service"
2. Conecte repositório GitHub
3. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

#### 3. PostgreSQL
1. "New" → "PostgreSQL"
2. Copie a `DATABASE_URL` gerada

#### 4. Variáveis de Ambiente
No Web Service → "Environment":
```
NODE_ENV=production
SESSION_SECRET=seu-secret-aqui
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
DATABASE_URL=postgresql://... (copiado do passo 3)
PORT=5000
```

#### 5. Domínio Personalizado
1. "Settings" → "Custom Domain"
2. Adicione `simulamarketing.com.br`
3. Configure DNS igual Railway

---

## 🥉 OPÇÃO 3: HostGator VPS (Complexo)

### ⚠️ Requisitos
- VPS HostGator (mínimo $24/mês)
- Conhecimento em Linux/SSH
- Tempo de configuração: 2-4 horas

### Passos Resumidos

#### 1. Contratar VPS
- Plano mínimo: Snappy 2000 ($24/mês)
- Solicitar instalação do PostgreSQL ao suporte

#### 2. Acesso SSH
```bash
ssh root@SEU-IP-VPS
```

#### 3. Instalar Node.js
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Instalar Node.js LTS
nvm install --lts
nvm use --lts
node -v
```

#### 4. Instalar PostgreSQL
```bash
# Solicite ao suporte HostGator para instalar
# Ou manualmente:
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 5. Criar Banco
```bash
sudo -u postgres psql
CREATE DATABASE simula_plus;
CREATE USER simula_user WITH PASSWORD 'senha-forte';
GRANT ALL PRIVILEGES ON DATABASE simula_plus TO simula_user;
\q
```

#### 6. Upload da Aplicação
```bash
cd /var/www
git clone https://github.com/SEU-USUARIO/simula-plus.git
cd simula-plus
npm install
npm run build
```

#### 7. Variáveis de Ambiente
```bash
nano .env
```
```
NODE_ENV=production
DATABASE_URL=postgresql://simula_user:senha-forte@localhost:5432/simula_plus
SESSION_SECRET=seu-secret
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
PORT=5000
```

#### 8. PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start npm --name "simula-plus" -- start
pm2 save
pm2 startup
```

#### 9. Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/conf.d/simula.conf
```
```nginx
server {
    listen 80;
    server_name simulamarketing.com.br www.simulamarketing.com.br;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo systemctl restart nginx
```

#### 10. SSL (HTTPS)
```bash
sudo yum install certbot python3-certbot-nginx
sudo certbot --nginx -d simulamarketing.com.br -d www.simulamarketing.com.br
```

---

## 📋 Checklist Pré-Deploy

### Código
- [ ] `package.json` tem scripts `build` e `start`
- [ ] Variável `PORT` configurável via environment
- [ ] Código usa `DATABASE_URL` do ambiente
- [ ] `.gitignore` inclui `node_modules`, `.env`, `dist`

### Banco de Dados
- [ ] Schema definido em `shared/schema.ts`
- [ ] Drizzle configurado corretamente
- [ ] Comando `db:push` funciona

### Segurança
- [ ] `SESSION_SECRET` forte e único
- [ ] Senhas não estão no código
- [ ] CORS configurado corretamente
- [ ] Headers de segurança implementados

### Domínio
- [ ] DNS apontando para servidor
- [ ] SSL/HTTPS configurado
- [ ] Redirecionamento www → não-www (ou vice-versa)

---

## 🎯 Recomendação Final

### Para Você:
🌟 **Use Railway** 

**Por quê?**
1. Deploy em 5 minutos vs 4 horas no VPS
2. PostgreSQL já configurado
3. SSL automático
4. $5-15/mês vs $24+ no VPS
5. Zero manutenção
6. Escalabilidade automática
7. Suporte 24/7

**Como começar:**
1. Crie conta no [Railway](https://railway.app)
2. Conecte seu repositório GitHub
3. Adicione PostgreSQL
4. Configure variáveis de ambiente
5. Deploy automático! ✨

### Migração de Dados
Se tiver dados no Replit PostgreSQL:
```bash
# Exportar do Replit
pg_dump $DATABASE_URL > backup.sql

# Importar no Railway
railway run psql $DATABASE_URL < backup.sql
```

---

## 🆘 Suporte

### Railway
- Documentação: https://docs.railway.app
- Discord: https://discord.gg/railway

### Render
- Documentação: https://render.com/docs

### Problemas Comuns
- **Build falha**: Verifique `package.json` scripts
- **Database erro**: Confirme `DATABASE_URL` correta
- **502 Bad Gateway**: Verifique se app está ouvindo na porta correta
- **Environment vars**: Sempre reinicie após mudar variáveis

---

## 💰 Custos Estimados

### Railway (Recomendado)
- Hobby: $5/mês (500 horas)
- Pro: $20/mês (ilimitado)
- PostgreSQL: Incluso

### Render
- Free: $0 (limitações)
- Starter: $7/mês
- PostgreSQL: $7/mês adicional

### HostGator VPS
- Snappy 2000: $24/mês
- Snappy 4000: $49/mês
- Snappy 8000: $80/mês
- PostgreSQL: Incluso (mas setup manual)

---

Boa sorte com o deploy! 🚀
