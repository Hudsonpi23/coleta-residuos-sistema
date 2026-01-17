# EcoColeta - Sistema de Coleta e Classificação de Resíduos

Sistema web completo para gerenciamento de coleta seletiva, classificação de resíduos recicláveis, controle de estoque e rastreabilidade operacional.

## 🚀 Funcionalidades

### Módulos Principais

- **Dashboard**: KPIs operacionais, métricas de coleta e produtividade
- **Pontos de Coleta**: Cadastro de residências, comércios, condomínios e ecopontos
- **Rotas**: Planejamento de itinerários com ordem de visitas
- **Agenda**: Agendamento de rotas com equipes e veículos
- **Execução**: Acompanhamento em tempo real das coletas
- **Triagem**: Classificação e pesagem dos materiais coletados
- **Estoque**: Controle de lotes e movimentações de materiais
- **Destinos**: Cadastro de cooperativas, aterros e indústrias recicladoras
- **Relatórios**: Análises por período, material, equipe e ponto

### Sistema de Permissões (RBAC)

| Papel | Descrição |
|-------|-----------|
| ADMIN | Acesso completo |
| GESTOR_OPERACAO | Rotas, coletas, equipes, relatórios |
| ALMOXARIFE | Entradas/saídas, inventário, lotes |
| SUPERVISOR | Aprovar/validar coletas, corrigir classificação |
| COLETOR | Apenas sua rota, check-in e coleta |
| TRIAGEM | Classificação, qualidade e pesagem |
| VISUALIZADOR | Relatórios read-only |

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

## 🛠️ Instalação

### 1. Clone o repositório

```bash
cd coleta-residuos
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coleta_residuos?schema=public"

# JWT Secret (altere em produção!)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Execute as migrações do banco de dados

```bash
npm run db:push
```

### 5. Popule o banco com dados iniciais

```bash
npm run db:seed
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🔐 Credenciais de Teste

| Usuário | Email | Senha | Papel |
|---------|-------|-------|-------|
| Admin | admin@ecorecicla.com | admin123 | ADMIN |
| Gestor | gestor@ecorecicla.com | admin123 | GESTOR_OPERACAO |
| Almoxarife | almoxarife@ecorecicla.com | admin123 | ALMOXARIFE |
| Supervisor | supervisor@ecorecicla.com | admin123 | SUPERVISOR |
| Coletor | coletor@ecorecicla.com | admin123 | COLETOR |
| Triagem | triagem@ecorecicla.com | admin123 | TRIAGEM |

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Compila para produção
npm run start        # Inicia servidor de produção

# Banco de Dados
npm run db:generate  # Gera cliente Prisma
npm run db:push      # Aplica schema ao banco
npm run db:migrate   # Cria migrations
npm run db:seed      # Popula dados iniciais
npm run db:studio    # Abre Prisma Studio

# Linting
npm run lint         # Verifica código
```

## 🗃️ Estrutura do Projeto

```
coleta-residuos/
├── prisma/
│   ├── schema.prisma      # Modelo de dados
│   └── seed.ts            # Dados iniciais
├── src/
│   ├── app/
│   │   ├── (auth)/        # Páginas de autenticação
│   │   │   └── login/
│   │   ├── (dashboard)/   # Páginas do sistema
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── pontos-coleta/
│   │   │   ├── rotas/
│   │   │   ├── agenda/
│   │   │   ├── execucao/
│   │   │   ├── triagem/
│   │   │   ├── estoque/
│   │   │   ├── destinos/
│   │   │   ├── equipes/
│   │   │   ├── veiculos/
│   │   │   ├── relatorios/
│   │   │   └── configuracoes/
│   │   └── api/           # Endpoints da API
│   │       ├── auth/
│   │       ├── collection-points/
│   │       ├── routes/
│   │       ├── teams/
│   │       ├── vehicles/
│   │       ├── assignments/
│   │       ├── runs/
│   │       ├── sorting-batches/
│   │       ├── stock/
│   │       ├── destinations/
│   │       ├── material-types/
│   │       └── reports/
│   ├── components/
│   │   ├── layout/        # Componentes de layout
│   │   └── ui/            # Componentes shadcn/ui
│   └── lib/
│       ├── auth.ts        # Autenticação e RBAC
│       ├── prisma.ts      # Cliente Prisma
│       ├── validations.ts # Schemas Zod
│       ├── api-response.ts
│       └── hooks/         # React hooks
```

## 🔄 Fluxo Operacional

### 1. Planejamento
- Gestor cria Rota com pontos de coleta ordenados
- Define Equipe e Veículo
- Gera Agenda (data/turno)

### 2. Execução da Coleta
- Coletor inicia rota (check-in)
- Para cada ponto: chegada → registro de itens → finalização
- Status: PENDENTE → EM_ANDAMENTO → COLETADO/NAO_COLETADO

### 3. Triagem/Classificação
- Triagem recebe a Coleta concluída
- Classifica volumes por MaterialType
- Registra qualidade (A/B/C) e contaminação
- Confirma pesagem final

### 4. Estoque e Destino
- Fechamento da triagem gera lotes em estoque automaticamente
- Saída registrada com destino, veículo e NF
- Rastreabilidade completa do material

## 🧪 Checklist de Testes Manuais

### Happy Path
- [x] Login com usuário admin
- [x] Visualizar dashboard
- [x] Cadastrar ponto de coleta
- [x] Criar rota com paradas
- [x] Agendar rota para equipe
- [x] Iniciar execução de coleta
- [x] Registrar chegada em parada
- [x] Registrar itens coletados
- [x] Finalizar parada como coletado
- [x] Finalizar execução
- [x] Criar triagem da execução
- [x] Adicionar itens classificados
- [x] Fechar triagem (gera estoque)
- [x] Registrar saída de estoque
- [x] Visualizar relatórios

### Validações de Erro
- [x] Login com credenciais inválidas
- [x] Acesso negado por permissão
- [x] Saída maior que disponível em estoque
- [x] Não coletado exige motivo
- [x] Campos obrigatórios em formulários

## 🔧 Tecnologias

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **UI**: shadcn/ui + Tailwind CSS
- **Autenticação**: JWT (jose)
- **Validação**: Zod
- **Formulários**: React Hook Form
- **Tabelas**: TanStack Table
- **Toasts**: Sonner

## 📝 Licença

Este projeto está sob a licença MIT.
