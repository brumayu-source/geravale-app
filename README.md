# Gera Vale — App de Gestão de Contratos

## Stack
- React + Vite (frontend)
- Supabase (banco de dados + auth + storage)
- Vercel (hospedagem)

---

## Passo a passo para colocar em produção

### 1. Criar conta no GitHub e subir o projeto

1. Acesse https://github.com e crie uma conta (gratuita)
2. Clique em **New repository** → nome: `geravale-app` → **Create repository**
3. No terminal, dentro da pasta do projeto:
   ```bash
   git init
   git add .
   git commit -m "primeiro commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/geravale-app.git
   git push -u origin main
   ```

---

### 2. Criar projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (gratuita)
2. Clique em **New project** → escolha um nome → defina uma senha segura → **Create project**
3. Vá em **SQL Editor** → cole o conteúdo do arquivo `supabase_schema.sql` → clique **Run**
4. Vá em **Storage** → **New bucket** → nome: `fotos` → marque **Public** → **Save**
5. Vá em **Project Settings** → **API**:
   - Copie a **Project URL** → será o `VITE_SUPABASE_URL`
   - Copie a **anon public key** → será o `VITE_SUPABASE_ANON_KEY`

---

### 3. Deploy no Vercel

1. Acesse https://vercel.com e faça login com sua conta GitHub
2. Clique em **Add New Project** → selecione o repositório `geravale-app`
3. Em **Environment Variables**, adicione:
   ```
   VITE_SUPABASE_URL       = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY  = sua-chave-aqui
   ```
4. Clique em **Deploy** → aguarde 1-2 minutos
5. Pronto — o app estará disponível em `https://geravale-app.vercel.app`

---

### 4. Testar localmente (opcional)

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis locais
cp .env.example .env.local
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local

# Rodar o app
npm run dev
# Acesse http://localhost:5173
```

---

## Estrutura do projeto

```
src/
  pages/
    Clientes.jsx          # Lista de clientes
    ClienteDetail.jsx     # Detalhe do cliente + contratos
    ContratoDetail.jsx    # Detalhe do contrato + equipamentos + visitas
    EquipamentoDetail.jsx # Detalhe do equipamento + peças + baixas + foto
  components/
    ui.jsx                # Componentes reutilizáveis (botões, modais, tabelas...)
    Nav.jsx               # Barra de navegação com breadcrumb
  lib/
    supabase.js           # Cliente Supabase
    pdf.js                # Gerador de PDF de baixas
```

## Funcionalidades

- ✅ Cadastro e edição de clientes
- ✅ Cadastro e edição de contratos (Manutenção ou Locação)
- ✅ Cadastro e edição de equipamentos (múltiplos por contrato)
- ✅ Foto da plaqueta por equipamento
- ✅ Cadastro e edição de peças por equipamento
- ✅ Registro de visitas (manutenção) com horas e KM
- ✅ Registro de baixas de peças com histórico
- ✅ Geração de PDF ao registrar baixa
- ✅ Saldo de peças calculado automaticamente
- ✅ Saldo de horas e KM calculado automaticamente
- ✅ Arquivar clientes e contratos
- ✅ Excluir equipamentos e peças
