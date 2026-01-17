import { PrismaClient, Role, DestinationType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  console.log("🌱 Seeding database...");

  // Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: "ecorecicla" },
    update: {},
    create: {
      name: "EcoRecicla Ltda",
      slug: "ecorecicla",
    },
  });
  console.log("✅ Organization created:", org.name);

  // Create Material Types
  const materialTypes = [
    { name: "Papel/Papelão", category: "PAPEL", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.50 },
    { name: "PET", category: "PLASTICO", defaultUnit: "kg", requiresSorting: true, referencePrice: 1.20 },
    { name: "PEAD", category: "PLASTICO", defaultUnit: "kg", requiresSorting: true, referencePrice: 1.00 },
    { name: "PP", category: "PLASTICO", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.80 },
    { name: "PVC", category: "PLASTICO", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.60 },
    { name: "Vidro Incolor", category: "VIDRO", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.15 },
    { name: "Vidro Colorido", category: "VIDRO", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.10 },
    { name: "Alumínio", category: "METAL", defaultUnit: "kg", requiresSorting: true, referencePrice: 5.00 },
    { name: "Ferro/Aço", category: "METAL", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.40 },
    { name: "Cobre", category: "METAL", defaultUnit: "kg", requiresSorting: true, referencePrice: 25.00 },
    { name: "Orgânico", category: "ORGANICO", defaultUnit: "kg", requiresSorting: false, allowsContamination: true, referencePrice: 0.05 },
    { name: "Rejeito", category: "REJEITO", defaultUnit: "kg", requiresSorting: false, allowsContamination: true, referencePrice: 0 },
    { name: "Eletrônico", category: "ELETRONICO", defaultUnit: "un", requiresSorting: true, referencePrice: 2.00 },
    { name: "Óleo de Cozinha", category: "OLEO", defaultUnit: "L", requiresSorting: false, referencePrice: 1.50 },
    { name: "Isopor", category: "OUTROS", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.30 },
    { name: "Tetra Pak", category: "OUTROS", defaultUnit: "kg", requiresSorting: true, referencePrice: 0.25 },
  ];

  for (const mt of materialTypes) {
    await prisma.materialType.upsert({
      where: { orgId_name: { orgId: org.id, name: mt.name } },
      update: {},
      create: {
        ...mt,
        orgId: org.id,
        allowsContamination: mt.allowsContamination ?? false,
      },
    });
  }
  console.log("✅ Material Types created:", materialTypes.length);

  // Create Admin User
  const passwordHash = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ecorecicla.com" },
    update: {},
    create: {
      email: "admin@ecorecicla.com",
      passwordHash,
      name: "Administrador",
      role: Role.ADMIN,
      orgId: org.id,
    },
  });
  console.log("✅ Admin user created:", adminUser.email);

  // Create additional users with different roles
  const users = [
    { email: "gestor@ecorecicla.com", name: "Carlos Gestor", role: Role.GESTOR_OPERACAO },
    { email: "almoxarife@ecorecicla.com", name: "Ana Almoxarife", role: Role.ALMOXARIFE },
    { email: "supervisor@ecorecicla.com", name: "Pedro Supervisor", role: Role.SUPERVISOR },
    { email: "coletor@ecorecicla.com", name: "João Coletor", role: Role.COLETOR },
    { email: "triagem@ecorecicla.com", name: "Maria Triagem", role: Role.TRIAGEM },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        passwordHash,
        orgId: org.id,
      },
    });
  }
  console.log("✅ Users created:", users.length + 1);

  // Create Employees
  const employees = [
    { name: "João Silva", cpf: "123.456.789-00", phone: "(11) 99999-0001" },
    { name: "Maria Santos", cpf: "234.567.890-11", phone: "(11) 99999-0002" },
    { name: "Pedro Oliveira", cpf: "345.678.901-22", phone: "(11) 99999-0003" },
    { name: "Ana Costa", cpf: "456.789.012-33", phone: "(11) 99999-0004" },
    { name: "Carlos Souza", cpf: "567.890.123-44", phone: "(11) 99999-0005" },
    { name: "Lucas Lima", cpf: "678.901.234-55", phone: "(11) 99999-0006" },
  ];

  const createdEmployees = [];
  for (const e of employees) {
    const emp = await prisma.employee.upsert({
      where: { id: `emp-${e.cpf}` },
      update: {},
      create: {
        id: `emp-${e.cpf}`,
        ...e,
        orgId: org.id,
      },
    });
    createdEmployees.push(emp);
  }
  console.log("✅ Employees created:", employees.length);

  // Create Teams
  const team1 = await prisma.team.upsert({
    where: { id: "team-alpha" },
    update: {},
    create: {
      id: "team-alpha",
      name: "Equipe Alpha",
      orgId: org.id,
    },
  });

  const team2 = await prisma.team.upsert({
    where: { id: "team-beta" },
    update: {},
    create: {
      id: "team-beta",
      name: "Equipe Beta",
      orgId: org.id,
    },
  });
  console.log("✅ Teams created: 2");

  // Add team members
  await prisma.teamMember.deleteMany({ where: { teamId: team1.id } });
  await prisma.teamMember.deleteMany({ where: { teamId: team2.id } });

  await prisma.teamMember.createMany({
    data: [
      { teamId: team1.id, employeeId: createdEmployees[0].id, role: "motorista" },
      { teamId: team1.id, employeeId: createdEmployees[1].id, role: "coletor" },
      { teamId: team1.id, employeeId: createdEmployees[2].id, role: "coletor" },
      { teamId: team2.id, employeeId: createdEmployees[3].id, role: "motorista" },
      { teamId: team2.id, employeeId: createdEmployees[4].id, role: "coletor" },
      { teamId: team2.id, employeeId: createdEmployees[5].id, role: "coletor" },
    ],
  });
  console.log("✅ Team members assigned");

  // Create Vehicles
  const vehicles = [
    { plate: "ABC-1234", model: "VW Delivery 9.170", capacityKg: 5000 },
    { plate: "DEF-5678", model: "Mercedes Accelo 815", capacityKg: 4000 },
    { plate: "GHI-9012", model: "Fiat Ducato", capacityKg: 1500 },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: `veh-${v.plate}` },
      update: {},
      create: {
        id: `veh-${v.plate}`,
        ...v,
        orgId: org.id,
      },
    });
  }
  console.log("✅ Vehicles created:", vehicles.length);

  // Create Collection Points
  const points = [
    { name: "Condomínio Solar", address: "Rua das Flores, 100", type: "condominio", lat: -23.5505, lng: -46.6333 },
    { name: "Supermercado Extra", address: "Av. Paulista, 500", type: "comercio", lat: -23.5611, lng: -46.6561 },
    { name: "Escola Municipal", address: "Rua da Educação, 200", type: "comercio", lat: -23.5429, lng: -46.6398 },
    { name: "Residência Silva", address: "Rua dos Ipês, 45", type: "residencia", lat: -23.5587, lng: -46.6250 },
    { name: "Ecoponto Centro", address: "Praça Central, s/n", type: "ecoponto", lat: -23.5475, lng: -46.6361 },
    { name: "Shopping Villa", address: "Av. do Comércio, 1000", type: "comercio", lat: -23.5612, lng: -46.6489 },
    { name: "Condomínio Parque Verde", address: "Rua Verde, 300", type: "condominio", lat: -23.5398, lng: -46.6512 },
    { name: "Restaurante Sabor", address: "Rua Gastronômica, 50", type: "comercio", lat: -23.5523, lng: -46.6445 },
  ];

  const createdPoints = [];
  for (let i = 0; i < points.length; i++) {
    const p = await prisma.collectionPoint.upsert({
      where: { id: `point-${i + 1}` },
      update: {},
      create: {
        id: `point-${i + 1}`,
        ...points[i],
        orgId: org.id,
      },
    });
    createdPoints.push(p);
  }
  console.log("✅ Collection Points created:", points.length);

  // Create Routes
  const route1 = await prisma.route.upsert({
    where: { id: "route-centro" },
    update: {},
    create: {
      id: "route-centro",
      name: "Rota Centro",
      description: "Coleta na região central",
      orgId: org.id,
    },
  });

  const route2 = await prisma.route.upsert({
    where: { id: "route-sul" },
    update: {},
    create: {
      id: "route-sul",
      name: "Rota Sul",
      description: "Coleta na região sul",
      orgId: org.id,
    },
  });
  console.log("✅ Routes created: 2");

  // Add Route Stops
  await prisma.routeStop.deleteMany({ where: { routeId: route1.id } });
  await prisma.routeStop.deleteMany({ where: { routeId: route2.id } });

  await prisma.routeStop.createMany({
    data: [
      { routeId: route1.id, pointId: createdPoints[0].id, orderIndex: 0, plannedWindow: "08:00-09:00" },
      { routeId: route1.id, pointId: createdPoints[1].id, orderIndex: 1, plannedWindow: "09:00-10:00" },
      { routeId: route1.id, pointId: createdPoints[2].id, orderIndex: 2, plannedWindow: "10:00-11:00" },
      { routeId: route1.id, pointId: createdPoints[3].id, orderIndex: 3, plannedWindow: "11:00-12:00" },
      { routeId: route2.id, pointId: createdPoints[4].id, orderIndex: 0, plannedWindow: "08:00-09:00" },
      { routeId: route2.id, pointId: createdPoints[5].id, orderIndex: 1, plannedWindow: "09:00-10:00" },
      { routeId: route2.id, pointId: createdPoints[6].id, orderIndex: 2, plannedWindow: "10:00-11:00" },
      { routeId: route2.id, pointId: createdPoints[7].id, orderIndex: 3, plannedWindow: "11:00-12:00" },
    ],
  });
  console.log("✅ Route Stops assigned");

  // Create Destinations
  const destinations = [
    { name: "Cooperativa Verde Vida", type: DestinationType.COOPERATIVA, address: "Rua Industrial, 500", contact: "José", phone: "(11) 3333-0001" },
    { name: "Aterro Sanitário Municipal", type: DestinationType.ATERRO, address: "Estrada do Aterro, km 15", contact: "Prefeitura", phone: "(11) 3333-0002" },
    { name: "ReciclaPlast Indústria", type: DestinationType.INDUSTRIA, address: "Av. Industrial, 1000", contact: "Ricardo", phone: "(11) 3333-0003" },
    { name: "Centro de Compostagem", type: DestinationType.COMPOSTAGEM, address: "Sítio Orgânico, s/n", contact: "Maria", phone: "(11) 3333-0004" },
  ];

  for (let i = 0; i < destinations.length; i++) {
    await prisma.destination.upsert({
      where: { id: `dest-${i + 1}` },
      update: {},
      create: {
        id: `dest-${i + 1}`,
        ...destinations[i],
        orgId: org.id,
      },
    });
  }
  console.log("✅ Destinations created:", destinations.length);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin: admin@ecorecicla.com / admin123");
  console.log("   Gestor: gestor@ecorecicla.com / admin123");
  console.log("   Coletor: coletor@ecorecicla.com / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
