import { z } from "zod";

// ============================================
// AUTH
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// ============================================
// MATERIAL TYPES
// ============================================

export const createMaterialTypeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().optional(),
  defaultUnit: z.string().default("kg"),
  requiresSorting: z.boolean().default(true),
  allowsContamination: z.boolean().default(false),
  referencePrice: z.number().optional(),
});

export const updateMaterialTypeSchema = createMaterialTypeSchema.partial();

// ============================================
// COLLECTION POINTS
// ============================================

export const createCollectionPointSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  type: z.enum(["residencia", "comercio", "condominio", "ecoponto"]).optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCollectionPointSchema = createCollectionPointSchema.partial();

// ============================================
// ROUTES
// ============================================

export const createRouteSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

export const updateRouteSchema = createRouteSchema.partial();

export const addRouteStopSchema = z.object({
  pointId: z.string().min(1, "Ponto de coleta é obrigatório"),
  orderIndex: z.number().int().min(0),
  plannedWindow: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// TEAMS
// ============================================

export const createTeamSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

export const updateTeamSchema = createTeamSchema.partial();

export const addTeamMemberSchema = z.object({
  employeeId: z.string().min(1, "Funcionário é obrigatório"),
  role: z.string().optional(),
});

// ============================================
// EMPLOYEES
// ============================================

export const createEmployeeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().optional(),
  phone: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

// ============================================
// VEHICLES
// ============================================

export const createVehicleSchema = z.object({
  plate: z.string().min(1, "Placa é obrigatória"),
  model: z.string().optional(),
  capacityKg: z.number().positive().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// ============================================
// DESTINATIONS
// ============================================

export const createDestinationSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["COOPERATIVA", "ATERRO", "INDUSTRIA", "COMPOSTAGEM"]),
  address: z.string().optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
});

export const updateDestinationSchema = createDestinationSchema.partial();

// ============================================
// ASSIGNMENTS (AGENDA)
// ============================================

export const createAssignmentSchema = z.object({
  routeId: z.string().min(1, "Rota é obrigatória"),
  teamId: z.string().min(1, "Equipe é obrigatória"),
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  shift: z.enum(["manha", "tarde", "noite"]).optional(),
});

// ============================================
// COLLECTION RUNS
// ============================================

export const startRunSchema = z.object({
  assignmentId: z.string().min(1, "Assignment é obrigatório"),
});

export const arriveStopSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const collectItemsSchema = z.object({
  items: z.array(
    z.object({
      materialTypeId: z.string().min(1),
      quantity: z.number().positive("Quantidade deve ser positiva"),
      unit: z.string().default("kg"),
      isEstimated: z.boolean().default(true),
    })
  ),
  notes: z.string().optional(),
});

export const closeStopSchema = z.object({
  status: z.enum(["COLETADO", "NAO_COLETADO"]),
  skipReason: z.string().optional(),
});

// ============================================
// SORTING / TRIAGEM
// ============================================

export const createSortingBatchSchema = z.object({
  runId: z.string().min(1, "Run é obrigatório"),
  notes: z.string().optional(),
});

export const addSortedItemSchema = z.object({
  materialTypeId: z.string().min(1, "Tipo de material é obrigatório"),
  weightKg: z.number().positive("Peso deve ser positivo"),
  qualityGrade: z.enum(["A", "B", "C"]).default("B"),
  contaminationPct: z.number().min(0).max(100).optional(),
  contaminationNote: z.string().optional(),
});

// ============================================
// STOCK
// ============================================

export const createStockLotSchema = z.object({
  materialTypeId: z.string().min(1, "Tipo de material é obrigatório"),
  totalKg: z.number().positive("Peso deve ser positivo"),
  qualityGrade: z.enum(["A", "B", "C"]).optional(),
  originNote: z.string().optional(),
});

export const createStockMovementSchema = z.object({
  lotId: z.string().min(1, "Lote é obrigatório"),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantityKg: z.number().positive("Quantidade deve ser positiva"),
  destinationId: z.string().optional(),
  vehicleId: z.string().optional(),
  invoiceRef: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// USERS
// ============================================

export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.enum(["ADMIN", "GESTOR_OPERACAO", "ALMOXARIFE", "SUPERVISOR", "COLETOR", "TRIAGEM", "VISUALIZADOR"]),
  employeeId: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "GESTOR_OPERACAO", "ALMOXARIFE", "SUPERVISOR", "COLETOR", "TRIAGEM", "VISUALIZADOR"]).optional(),
  isActive: z.boolean().optional(),
  employeeId: z.string().optional(),
});
