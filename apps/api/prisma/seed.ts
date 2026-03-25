import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { hash as bcryptHash } from "bcryptjs";

const prisma = new PrismaClient();

function hashApiKey(rawKey: string, pepper: string): string {
  return createHash("sha256").update(`${pepper}:${rawKey}`, "utf8").digest("hex");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursAgo(n: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d;
}

// ─── Dev seed (original) ─────────────────────────────────────────

async function seedDev(pepper: string) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "syspaq-dev" },
    create: { slug: "syspaq-dev", name: "SysPaq Dev" },
    update: {},
  });

  const rawKey = `spq_live_${randomBytes(24).toString("base64url")}`;
  const keyHash = hashApiKey(rawKey, pepper);
  const keyPrefix = rawKey.slice(0, 16);

  await prisma.apiKey.deleteMany({ where: { tenantId: tenant.id, name: "Development seed key" } });
  await prisma.apiKey.create({
    data: { tenantId: tenant.id, name: "Development seed key", keyHash, keyPrefix, role: "ADMIN" },
  });

  console.log("--- Dev Seed OK ---");
  console.log("Tenant ID:", tenant.id);
  console.log("API key (save once):", rawKey);
  return tenant;
}

// ─── Demo seed ───────────────────────────────────────────────────

async function seedDemo(pepper: string) {
  // ── Tenant ──
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    create: { slug: "demo", name: "SysPaq Demo", casilleroPrefix: "SPQ", casilleroCounter: 0 },
    update: { casilleroCounter: 0 },
  });

  // ── API Key (fixed, deterministic for demo) ──
  const demoRawKey = "spq_demo_syspaq-sandbox-2025";
  const demoHash = hashApiKey(demoRawKey, pepper);
  await prisma.apiKey.deleteMany({ where: { tenantId: tenant.id, name: "Demo key" } });
  await prisma.apiKey.create({
    data: { tenantId: tenant.id, name: "Demo key", keyHash: demoHash, keyPrefix: "spq_demo_syspaq", role: "ADMIN" },
  });

  // ── Branches ──
  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "MIA-WH" } },
      create: {
        tenantId: tenant.id, name: "Warehouse Miami", code: "MIA-WH", type: "WAREHOUSE",
        address: { street: "7850 NW 146th St", city: "Miami Lakes", state: "FL", zip: "33016", country: "US" },
        coordinates: { lat: 25.9224, lng: -80.3190 }, phone: "+1 305-555-0100", email: "miami@syspaq-demo.com",
      },
      update: {},
    }),
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "SDQ-OFF" } },
      create: {
        tenantId: tenant.id, name: "Oficina Santo Domingo", code: "SDQ-OFF", type: "OFFICE",
        address: { street: "Av. Winston Churchill #885", city: "Santo Domingo", state: "DN", zip: "10148", country: "DO" },
        coordinates: { lat: 18.4655, lng: -69.9447 }, phone: "+1 809-555-0200", email: "sdq@syspaq-demo.com",
      },
      update: {},
    }),
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "STI-PU" } },
      create: {
        tenantId: tenant.id, name: "Punto de Retiro Santiago", code: "STI-PU", type: "PICKUP_POINT",
        address: { street: "Calle del Sol #45", city: "Santiago de los Caballeros", state: "Santiago", zip: "51000", country: "DO" },
        coordinates: { lat: 19.4517, lng: -70.6970 }, phone: "+1 809-555-0300", email: "sti@syspaq-demo.com",
      },
      update: {},
    }),
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "SDQ-SC" } },
      create: {
        tenantId: tenant.id, name: "Centro de Clasificación AILA", code: "SDQ-SC", type: "SORTING_CENTER",
        address: { street: "Aeropuerto Internacional de Las Américas", city: "Santo Domingo Este", state: "Santo Domingo", zip: "11604", country: "DO" },
        coordinates: { lat: 18.4297, lng: -69.6689 }, phone: "+1 809-555-0400",
      },
      update: {},
    }),
  ]);

  const [miamiBranch, _sdqBranch, _stiBranch] = branches;
  void _sdqBranch; void _stiBranch;

  // ── Customers ──
  const passwordHash = await bcryptHash("demo1234", 12);
  const customersData = [
    { firstName: "María", lastName: "Rodríguez", email: "maria.rodriguez@demo.com", phone: "+1 809-555-1001", idType: "CEDULA" as const, idNumber: "001-1234567-8" },
    { firstName: "Carlos", lastName: "Martínez", email: "carlos.martinez@demo.com", phone: "+1 809-555-1002", idType: "CEDULA" as const, idNumber: "002-9876543-2" },
    { firstName: "Ana", lastName: "Pérez García", email: "ana.perez@demo.com", phone: "+1 809-555-1003", idType: "CEDULA" as const, idNumber: "003-4567890-1" },
    { firstName: "José", lastName: "Hernández", email: "jose.hernandez@demo.com", phone: "+1 809-555-1004", idType: "PASSPORT" as const, idNumber: "PA1234567" },
    { firstName: "Laura", lastName: "Sánchez De los Santos", email: "laura.sanchez@demo.com", phone: "+1 829-555-1005", idType: "CEDULA" as const, idNumber: "004-2345678-9" },
    { firstName: "Pedro", lastName: "Gómez Rijo", email: "pedro.gomez@demo.com", phone: "+1 849-555-1006", idType: "RNC" as const, idNumber: "130-12345-6" },
    { firstName: "Carmen", lastName: "Díaz Marte", email: "carmen.diaz@demo.com", phone: "+1 809-555-1007", idType: "CEDULA" as const, idNumber: "005-6789012-3" },
    { firstName: "Miguel", lastName: "Torres", email: "miguel.torres@demo.com", phone: "+1 829-555-1008", idType: "CEDULA" as const, idNumber: "006-3456789-0" },
  ];

  // Clean existing demo data
  await prisma.trackingEvent.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { tenantId: tenant.id } } });
  await prisma.paymentAllocation.deleteMany({ where: { payment: { tenantId: tenant.id } } });
  await prisma.creditNote.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.dgaLabel.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.containerItem.deleteMany({ where: { container: { tenantId: tenant.id } } });
  await prisma.reception.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.postAlert.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.deliveryOrder.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.preAlert.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.shipment.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.container.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.customer.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.rateTable.deleteMany({ where: { tenantId: tenant.id } });

  // Reset casillero counter
  await prisma.tenant.update({ where: { id: tenant.id }, data: { casilleroCounter: 0 } });

  const customers: Array<{ id: string; firstName: string; lastName: string; idNumber: string | null }> = [];
  for (const c of customersData) {
    const idx = customers.length + 1;
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        casillero: `SPQ-${String(idx).padStart(5, "0")}`,
        email: c.email,
        passwordHash,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        idType: c.idType,
        idNumber: c.idNumber,
        address: { street: "Calle Demo #" + idx, city: "Santo Domingo", country: "DO" },
      },
    });
    customers.push(customer);
  }
  await prisma.tenant.update({ where: { id: tenant.id }, data: { casilleroCounter: customers.length } });

  // ── Demo Users ──
  const userPasswordHash = await bcryptHash("demo1234", 12);
  await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@syspaq-demo.com",
      passwordHash: userPasswordHash,
      firstName: "Admin",
      lastName: "Demo",
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "operador@syspaq-demo.com",
      passwordHash: userPasswordHash,
      firstName: "Operador",
      lastName: "Demo",
      role: "OPERATOR",
    },
  });

  // ── Rate Table ──
  await prisma.rateTable.create({
    data: {
      tenantId: tenant.id, name: "Tarifa Estándar Miami → RD", originZone: "US-FL", destZone: "DO",
      isDefault: true,
      tiers: {
        create: [
          { minWeight: 0, maxWeight: 5, pricePerLb: 3.50, flatFee: 0 },
          { minWeight: 5.01, maxWeight: 20, pricePerLb: 3.00, flatFee: 0 },
          { minWeight: 20.01, maxWeight: 50, pricePerLb: 2.75, flatFee: 0 },
          { minWeight: 50.01, maxWeight: 100, pricePerLb: 2.50, flatFee: 5.00 },
          { minWeight: 100.01, maxWeight: 9999, pricePerLb: 2.25, flatFee: 10.00 },
        ],
      },
    },
  });

  // ── Shipments with tracking events ──
  // We'll create shipments in various phases to make the dashboard look alive.

  const shipmentsData = [
    // DELIVERED (complete journey)
    { tracking: "SPQ-240301-001", customer: 0, phase: "DELIVERED" as const, weight: 4.5, value: 89.99, desc: "iPhone 15 Case + Protector", daysOld: 12 },
    { tracking: "SPQ-240301-002", customer: 1, phase: "DELIVERED" as const, weight: 12.3, value: 245.00, desc: "Nike Air Max 90 x2", daysOld: 10 },
    { tracking: "SPQ-240302-003", customer: 2, phase: "DELIVERED" as const, weight: 2.1, value: 35.50, desc: "Vitaminas y suplementos", daysOld: 8 },
    { tracking: "SPQ-240303-004", customer: 0, phase: "DELIVERED" as const, weight: 8.7, value: 120.00, desc: "Ropa de niños - Amazon", daysOld: 7 },
    { tracking: "SPQ-240304-005", customer: 3, phase: "DELIVERED" as const, weight: 22.0, value: 380.00, desc: "Monitor Dell 27\" + teclado", daysOld: 5 },
    // OUT_FOR_DELIVERY
    { tracking: "SPQ-240310-006", customer: 4, phase: "OUT_FOR_DELIVERY" as const, weight: 6.2, value: 95.00, desc: "Juguetes para niños", daysOld: 4 },
    { tracking: "SPQ-240310-007", customer: 5, phase: "OUT_FOR_DELIVERY" as const, weight: 15.8, value: 210.00, desc: "Repuestos auto - AutoZone", daysOld: 3 },
    // CLEARED (through customs)
    { tracking: "SPQ-240312-008", customer: 6, phase: "CLEARED" as const, weight: 3.4, value: 55.00, desc: "Libros técnicos x4", daysOld: 3 },
    { tracking: "SPQ-240312-009", customer: 7, phase: "CLEARED" as const, weight: 9.0, value: 150.00, desc: "Zapatos y accesorios", daysOld: 2 },
    // IN_CUSTOMS
    { tracking: "SPQ-240314-010", customer: 0, phase: "IN_CUSTOMS" as const, weight: 45.0, value: 890.00, desc: "MacBook Air M3", daysOld: 2 },
    { tracking: "SPQ-240314-011", customer: 1, phase: "IN_CUSTOMS" as const, weight: 18.5, value: 320.00, desc: "Electrodomésticos pequeños", daysOld: 2 },
    { tracking: "SPQ-240315-012", customer: 2, phase: "IN_CUSTOMS" as const, weight: 7.0, value: 110.00, desc: "Cosméticos y perfumes", daysOld: 1 },
    // IN_TRANSIT
    { tracking: "SPQ-240316-013", customer: 3, phase: "IN_TRANSIT" as const, weight: 28.0, value: 450.00, desc: "TV Samsung 50\" - Best Buy", daysOld: 1 },
    { tracking: "SPQ-240316-014", customer: 4, phase: "IN_TRANSIT" as const, weight: 5.5, value: 78.00, desc: "Ropa deportiva Nike", daysOld: 1 },
    { tracking: "SPQ-240317-015", customer: 5, phase: "IN_TRANSIT" as const, weight: 11.2, value: 165.00, desc: "Herramientas DeWalt", daysOld: 0 },
    // RECEIVED (at Miami warehouse)
    { tracking: "SPQ-240318-016", customer: 6, phase: "RECEIVED" as const, weight: 2.8, value: 42.00, desc: "Accesorios celular", daysOld: 0 },
    { tracking: "SPQ-240318-017", customer: 7, phase: "RECEIVED" as const, weight: 35.0, value: 520.00, desc: "Silla gaming + mousepad", daysOld: 0 },
    { tracking: "SPQ-240318-018", customer: 0, phase: "RECEIVED" as const, weight: 1.2, value: 25.00, desc: "Audífonos Bluetooth", daysOld: 0 },
    // CREATED (just entered system)
    { tracking: "SPQ-240319-019", customer: 1, phase: "CREATED" as const, weight: 6.0, value: 88.00, desc: "Zapatillas Adidas", daysOld: 0 },
    { tracking: "SPQ-240319-020", customer: 2, phase: "CREATED" as const, weight: 14.0, value: 200.00, desc: "Paquete mixto Walmart", daysOld: 0 },
    // EXCEPTION
    { tracking: "SPQ-240310-021", customer: 3, phase: "EXCEPTION" as const, weight: 55.0, value: 1200.00, desc: "Drone DJI Mini 4 Pro", daysOld: 5 },
  ];

  const eventSequences: Record<string, string[]> = {
    CREATED: ["CREATED"],
    RECEIVED: ["CREATED", "RECEIVED"],
    IN_TRANSIT: ["CREATED", "RECEIVED", "DEPARTED"],
    IN_CUSTOMS: ["CREATED", "RECEIVED", "DEPARTED", "ARRIVED", "CUSTOMS_IN"],
    CLEARED: ["CREATED", "RECEIVED", "DEPARTED", "ARRIVED", "CUSTOMS_IN", "CUSTOMS_CLEARED"],
    OUT_FOR_DELIVERY: ["CREATED", "RECEIVED", "DEPARTED", "ARRIVED", "CUSTOMS_IN", "CUSTOMS_CLEARED", "OUT_FOR_DELIVERY"],
    DELIVERED: ["CREATED", "RECEIVED", "DEPARTED", "ARRIVED", "CUSTOMS_IN", "CUSTOMS_CLEARED", "OUT_FOR_DELIVERY", "DELIVERED"],
    EXCEPTION: ["CREATED", "RECEIVED", "DEPARTED", "ARRIVED", "CUSTOMS_IN", "EXCEPTION"],
  };

  const eventLocations: Record<string, object> = {
    CREATED: { facility: "Online Order", city: "Various", country: "US" },
    RECEIVED: { facility: "Warehouse Miami", city: "Miami Lakes", state: "FL", country: "US" },
    DEPARTED: { facility: "Warehouse Miami", city: "Miami Lakes", state: "FL", country: "US" },
    ARRIVED: { facility: "Centro de Clasificación AILA", city: "Santo Domingo Este", country: "DO" },
    CUSTOMS_IN: { facility: "DGA - AILA", city: "Santo Domingo", country: "DO" },
    CUSTOMS_CLEARED: { facility: "DGA - AILA", city: "Santo Domingo", country: "DO" },
    OUT_FOR_DELIVERY: { facility: "Oficina Santo Domingo", city: "Santo Domingo", country: "DO" },
    DELIVERED: { city: "Santo Domingo", country: "DO" },
    EXCEPTION: { facility: "DGA - AILA", city: "Santo Domingo", country: "DO", reason: "Requiere documentación adicional" },
  };

  const shipments = [];
  for (const s of shipmentsData) {
    const customer = customers[s.customer];
    const events = eventSequences[s.phase];

    const shipment = await prisma.shipment.create({
      data: {
        tenantId: tenant.id,
        trackingNumber: s.tracking,
        reference: s.desc,
        currentPhase: s.phase,
        customerId: customer.id,
        metadata: { weight: s.weight, declaredValue: s.value, description: s.desc },
      },
    });

    // Create tracking events spaced out over the shipment's lifetime
    const totalHours = s.daysOld * 24;
    const hoursPerStep = events.length > 1 ? totalHours / (events.length - 1) : 0;

    for (let i = 0; i < events.length; i++) {
      const eventHoursAgo = Math.max(0, totalHours - i * hoursPerStep);
      await prisma.trackingEvent.create({
        data: {
          tenantId: tenant.id,
          shipmentId: shipment.id,
          occurredAt: hoursAgo(eventHoursAgo),
          type: events[i] as any,
          source: i === 0 ? "SYSTEM" : "SCAN",
          location: eventLocations[events[i]] ?? null,
          idempotencyKey: `seed-${s.tracking}-${events[i]}`,
        },
      });
    }

    shipments.push(shipment);
  }

  // ── Container ──
  const container = await prisma.container.create({
    data: {
      tenantId: tenant.id, number: "MSKU7294031", type: "MARITIME_LCL", mode: "SEA",
      origin: "MIA", destination: "SDQ", status: "IN_CUSTOMS",
      carrier: "MSC Mediterranean Shipping", vesselName: "MSC CRISTINA", voyageNumber: "VY2403",
      blNumber: "MEDU4501234", sealNumber: "SL-98765",
      estimatedDeparture: daysAgo(6), actualDeparture: daysAgo(5),
      estimatedArrival: daysAgo(1), actualArrival: hoursAgo(18),
      totalPieces: 5, totalWeightLbs: 98.5,
    },
  });

  // Add shipments 10-12 (IN_CUSTOMS) to container
  for (const idx of [9, 10, 11]) {
    await prisma.containerItem.create({
      data: {
        containerId: container.id,
        shipmentId: shipments[idx].id,
        weightLbs: shipmentsData[idx].weight,
        pieces: 1,
        description: shipmentsData[idx].desc,
      },
    });
  }

  // ── Air container ──
  const airContainer = await prisma.container.create({
    data: {
      tenantId: tenant.id, number: "AWB-0239847562", type: "AIR", mode: "AIR",
      origin: "MIA", destination: "SDQ", status: "IN_TRANSIT",
      carrier: "Copa Airlines Cargo", voyageNumber: "CM-802",
      blNumber: "023-98475620",
      estimatedDeparture: hoursAgo(6), actualDeparture: hoursAgo(5),
      estimatedArrival: hoursAgo(1),
      totalPieces: 3, totalWeightLbs: 44.7,
    },
  });

  for (const idx of [12, 13, 14]) {
    await prisma.containerItem.create({
      data: {
        containerId: airContainer.id,
        shipmentId: shipments[idx].id,
        weightLbs: shipmentsData[idx].weight,
        pieces: 1,
        description: shipmentsData[idx].desc,
      },
    });
  }

  // ── Pre-Alerts ──
  const preAlertsData = [
    { customer: 0, tracking: "1Z999AA10123456784", carrier: "UPS", store: "Amazon", desc: "AirPods Pro 2nd Gen", value: 249.99 },
    { customer: 1, tracking: "9400111899223456789012", carrier: "USPS", store: "Shein", desc: "Ropa variada (5 piezas)", value: 67.50 },
    { customer: 4, tracking: "794644790132", carrier: "FedEx", store: "Walmart", desc: "Electrodoméstico pequeño", value: 89.00 },
    { customer: 6, tracking: "1Z999BB20123456785", carrier: "UPS", store: "eBay", desc: "Repuestos de impresora", value: 34.99 },
  ];

  for (const pa of preAlertsData) {
    await prisma.preAlert.create({
      data: {
        tenantId: tenant.id, customerId: customers[pa.customer].id,
        trackingNumber: pa.tracking, carrier: pa.carrier, store: pa.store,
        description: pa.desc, estimatedValue: pa.value, status: "PENDING",
      },
    });
  }

  // ── Receptions (for RECEIVED and beyond shipments) ──
  const receptionShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => !["CREATED"].includes(s.phase));

  let receptionCount = 0;
  for (const s of receptionShipments.slice(0, 10)) {
    receptionCount++;
    await prisma.reception.create({
      data: {
        tenantId: tenant.id,
        shipmentId: shipments[s.idx].id,
        branchId: miamiBranch.id,
        customerId: customers[s.customer].id,
        weightLbs: s.weight,
        lengthCm: 30 + Math.floor(s.weight * 2),
        widthCm: 20 + Math.floor(s.weight),
        heightCm: 15 + Math.floor(s.weight * 0.5),
        volumetricWeight: s.weight * 1.1,
        notes: s.weight > 20 ? "Paquete grande — verificar dimensiones" : null,
        charges: [{ concept: "Flete", amount: s.weight * 3.00 }, { concept: "Manejo", amount: 2.50 }],
        totalCharge: s.weight * 3.00 + 2.50,
        status: s.phase === "DELIVERED" ? "DELIVERED" : s.phase === "OUT_FOR_DELIVERY" ? "READY_FOR_PICKUP" : "CHARGED",
        receivedAt: daysAgo(s.daysOld),
      },
    });
  }

  // ── DGA Labels (for shipments in customs or beyond) ──
  const dgaShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => ["IN_CUSTOMS", "CLEARED", "OUT_FOR_DELIVERY", "DELIVERED", "EXCEPTION"].includes(s.phase));

  for (const s of dgaShipments) {
    const cust = customers[s.customer];
    const isCleared = ["CLEARED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s.phase);
    await prisma.dgaLabel.create({
      data: {
        tenantId: tenant.id,
        shipmentId: shipments[s.idx].id,
        containerId: [9, 10, 11].includes(s.idx) ? container.id : null,
        customerId: cust.id,
        consigneeName: `${cust.firstName} ${cust.lastName}`,
        consigneeCedula: cust.idNumber,
        trackingNumber: s.tracking,
        description: s.desc,
        pieces: 1,
        weightLbs: s.weight,
        fobValue: s.value,
        originCountry: "US",
        dgaBarcode: `DGA${s.tracking.replace(/[^A-Z0-9]/g, "").slice(-10)}`,
        status: s.phase === "EXCEPTION" ? "HELD" : isCleared ? "CLEARED" : "SUBMITTED",
        generatedAt: daysAgo(s.daysOld),
        clearedAt: isCleared ? daysAgo(Math.max(0, s.daysOld - 1)) : null,
        itbisAmount: s.value * 0.18,
        customsDuty: s.value > 200 ? s.value * 0.20 : 0,
        totalTaxes: s.value * 0.18 + (s.value > 200 ? s.value * 0.20 : 0),
      },
    });
  }

  // ── Invoices ──
  const deliveredShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => ["DELIVERED", "OUT_FOR_DELIVERY"].includes(s.phase));

  let invoiceNum = 0;
  for (const s of deliveredShipments) {
    invoiceNum++;
    const flete = s.weight * 3.00;
    const manejo = 2.50;
    const subtotal = flete + manejo;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    const isPaid = s.phase === "DELIVERED";

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id, customerId: customers[s.customer].id,
        number: `INV-${String(invoiceNum).padStart(5, "0")}`,
        status: isPaid ? "PAID" : "ISSUED",
        subtotal, taxTotal: tax, total,
        amountPaid: isPaid ? total : 0,
        balance: isPaid ? 0 : total,
        issuedAt: daysAgo(s.daysOld),
        dueAt: daysAgo(s.daysOld - 30),
        paidAt: isPaid ? daysAgo(Math.max(0, s.daysOld - 1)) : null,
        items: {
          create: [
            { shipmentId: shipments[s.idx].id, description: `Flete ${s.weight} lbs`, quantity: s.weight, unitPrice: 3.00, subtotal: flete, total: flete },
            { description: "Cargo por manejo", quantity: 1, unitPrice: 2.50, subtotal: manejo, total: manejo },
          ],
        },
      },
    });

    // Payments for paid invoices
    if (isPaid) {
      const payment = await prisma.payment.create({
        data: {
          tenantId: tenant.id, customerId: customers[s.customer].id,
          method: invoiceNum % 3 === 0 ? "BANK_TRANSFER" : invoiceNum % 2 === 0 ? "CREDIT_CARD" : "CASH",
          amount: total, reference: `REF-${String(invoiceNum).padStart(6, "0")}`,
          paidAt: daysAgo(Math.max(0, s.daysOld - 1)),
        },
      });
      await prisma.paymentAllocation.create({
        data: { paymentId: payment.id, invoiceId: invoice.id, amount: total },
      });
    }
  }

  // ── Delivery Orders ──
  const deliveryShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => ["OUT_FOR_DELIVERY", "DELIVERED"].includes(s.phase));

  let doNum = 0;
  for (const s of deliveryShipments) {
    doNum++;
    const isDelivered = s.phase === "DELIVERED";
    await prisma.deliveryOrder.create({
      data: {
        tenantId: tenant.id, shipmentId: shipments[s.idx].id, customerId: customers[s.customer].id,
        number: `DO-${String(doNum).padStart(5, "0")}`,
        deliveryType: doNum % 2 === 0 ? "HOME_DELIVERY" : "PICKUP",
        status: isDelivered ? "DELIVERED" : "IN_TRANSIT",
        driverName: isDelivered || s.phase === "OUT_FOR_DELIVERY" ? "Juan Ramírez" : null,
        driverPhone: "+1 809-555-9000",
        scheduledAt: daysAgo(s.daysOld),
        deliveredAt: isDelivered ? daysAgo(Math.max(0, s.daysOld - 1)) : null,
        deliveryAddress: { street: "Calle Demo #" + (s.customer + 1), city: "Santo Domingo", country: "DO" },
      },
    });
  }

  // ── Post Alerts (for delivered) ──
  for (const s of deliveredShipments) {
    await prisma.postAlert.create({
      data: {
        tenantId: tenant.id, shipmentId: shipments[s.idx].id, customerId: customers[s.customer].id,
        trackingNumber: s.tracking,
        recipientName: `${customers[s.customer].firstName} ${customers[s.customer].lastName}`,
        carrier: "SysPaq Express",
        fob: s.value,
        content: s.desc,
        deliveredAt: daysAgo(Math.max(0, s.daysOld - 1)),
      },
    });
  }

  // ── Notification Templates ──
  await prisma.notificationTemplate.upsert({
    where: { tenantId_event_channel: { tenantId: tenant.id, event: "shipment.received", channel: "EMAIL" } },
    create: {
      tenantId: tenant.id, event: "shipment.received", channel: "EMAIL",
      subject: "Tu paquete {{trackingNumber}} fue recibido en Miami",
      body: "Hola {{customerName}},\n\nTu paquete con tracking {{trackingNumber}} ha sido recibido en nuestro almacén de Miami.\n\nPeso: {{weight}} lbs\n\n— Equipo SysPaq",
    },
    update: {},
  });
  await prisma.notificationTemplate.upsert({
    where: { tenantId_event_channel: { tenantId: tenant.id, event: "shipment.delivered", channel: "EMAIL" } },
    create: {
      tenantId: tenant.id, event: "shipment.delivered", channel: "EMAIL",
      subject: "Tu paquete {{trackingNumber}} fue entregado",
      body: "Hola {{customerName}},\n\nTu paquete {{trackingNumber}} ha sido entregado exitosamente.\n\nGracias por usar SysPaq.\n\n— Equipo SysPaq",
    },
    update: {},
  });

  console.log("\n--- Demo Seed OK ---");
  console.log("Tenant ID :", tenant.id);
  console.log("Tenant slug:", tenant.slug);
  console.log("API Key    :", demoRawKey);
  console.log("");
  console.log("Dashboard login:");
  console.log("  Tenant: demo");
  console.log("  Admin: admin@syspaq-demo.com / demo1234");
  console.log("  Operador: operador@syspaq-demo.com / demo1234");
  console.log("");
  console.log(`Data created: ${customers.length} customers, ${shipments.length} shipments, ${branches.length} branches`);
  console.log(`             ${invoiceNum} invoices, ${doNum} delivery orders, ${preAlertsData.length} pre-alerts`);
  console.log(`             2 containers, ${dgaShipments.length} DGA labels, 1 rate table, 2 users`);
}

// ─── Owner seed (SysPaq superadmin) ──────────────────────────────

async function seedOwner(pepper: string) {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "syspaq" },
    create: {
      slug: "syspaq",
      name: "SysPaq",
      casilleroPrefix: "SYS",
      plan: "ENTERPRISE",
      planStatus: "ACTIVE",
    },
    update: {},
  });

  const rawKey = `spq_live_${randomBytes(24).toString("base64url")}`;
  const keyHash = hashApiKey(rawKey, pepper);
  const keyPrefix = rawKey.slice(0, 16);

  await prisma.apiKey.deleteMany({ where: { tenantId: tenant.id, name: "Owner key" } });
  await prisma.apiKey.create({
    data: { tenantId: tenant.id, name: "Owner key", keyHash, keyPrefix, role: "ADMIN" },
  });

  const ownerEmail = process.env.OWNER_EMAIL ?? "admin@syspaq.com";
  const ownerPassword = process.env.OWNER_PASSWORD ?? "changeme123!";
  const passwordHash = await bcryptHash(ownerPassword, 12);

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: ownerEmail } },
    create: {
      tenantId: tenant.id,
      email: ownerEmail,
      passwordHash,
      firstName: "SysPaq",
      lastName: "Admin",
      role: "ADMIN",
      isSuperAdmin: true,
    },
    update: { isSuperAdmin: true },
  });

  console.log("--- Owner Seed OK ---");
  console.log("Tenant ID:", tenant.id);
  console.log("Login email:", ownerEmail);
  console.log("Login tenant: syspaq");
  console.log("API key (save once):", rawKey);
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  const pepper = process.env.API_KEY_PEPPER ?? "dev-pepper-change-in-production-min-16-chars";
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required for seed");
  }

  const mode = process.argv[2] ?? "all";

  if (mode === "dev" || mode === "all") {
    await seedDev(pepper);
  }
  if (mode === "demo" || mode === "all") {
    await seedDemo(pepper);
  }
  if (mode === "owner" || mode === "all") {
    await seedOwner(pepper);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
