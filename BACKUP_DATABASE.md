# Backup automático do banco de dados

Este repositório tem um workflow do GitHub Actions
(`.github/workflows/backup-database.yml`) que gera um backup criptografado
do banco PostgreSQL de produção **todo dia às 03:00 (horário de Brasília)**
e guarda o arquivo como artefato do Actions por 90 dias.

## Configuração inicial (fazer uma única vez)

O workflow precisa de dois *secrets* no repositório do GitHub
(Settings → Secrets and variables → Actions → New repository secret):

1. **`DATABASE_URL`** — a connection string pública do PostgreSQL do Railway.
   No painel do Railway: abra o serviço PostgreSQL → aba "Connect" →
   copie a URL em **"Public Network"** (não a URL interna, que só funciona
   dentro da rede do Railway). Formato:
   `postgresql://usuario:senha@host-publico.proxy.rlwy.net:porta/railway`

2. **`BACKUP_PASSPHRASE`** — uma senha forte, escolhida por você, usada para
   criptografar o dump (AES-256 via GPG). Guarde essa senha em local seguro
   (ex.: gerenciador de senhas) — sem ela não é possível abrir os backups.
   Sugestão para gerar uma boa senha no Terminal do Mac:
   `openssl rand -base64 32`

Depois de cadastrar os dois secrets, vá em **Actions → Backup do banco de
dados → Run workflow** para testar manualmente antes de esperar pela
próxima execução agendada.

## Por que o dump é criptografado

O banco contém dados pessoais de alunos (nome, e-mail, decisões). Os
artefatos do GitHub Actions ficam visíveis a qualquer pessoa com acesso de
leitura ao repositório, então o dump é cifrado antes de ser publicado — só
quem tiver a `BACKUP_PASSPHRASE` consegue abrir o conteúdo.

## Como restaurar um backup

1. Baixe o artefato `db-backup-<id>` na aba Actions da execução desejada
   (arquivo `.sql.gz.gpg`).
2. Descriptografe e descompacte:
   ```
   gpg --batch --passphrase "SUA_PASSPHRASE" --decrypt simula-plus-backup-XXXX.sql.gz.gpg | gunzip > restore.sql
   ```
3. Restaure no banco (use uma connection string de teste/staging sempre que
   possível, nunca restaure direto em produção sem necessidade):
   ```
   psql "$DATABASE_URL" < restore.sql
   ```

## Retenção

Os artefatos expiram automaticamente após 90 dias (limite configurado no
workflow). Se precisar manter um backup específico por mais tempo, baixe o
arquivo `.gpg` e guarde-o fora do GitHub (ex.: pasta local, Google Drive).
