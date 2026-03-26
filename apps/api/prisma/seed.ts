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

  // ── Tickets ──
  const ticketsData = [
    { number: "TK-0001", subject: "Paquete dañado en tránsito", description: "El cliente reporta que el paquete llegó con golpes visibles y contenido roto.", category: "DAMAGE" as const, priority: "HIGH" as const, status: "OPEN" as const, customer: 0 },
    { number: "TK-0002", subject: "Cobro duplicado en factura", description: "Se generaron dos cargos por el mismo envío. Solicita corrección.", category: "BILLING" as const, priority: "MEDIUM" as const, status: "IN_PROGRESS" as const, customer: 1 },
    { number: "TK-0003", subject: "Paquete no entregado", description: "Han pasado 5 días desde que el paquete llegó a RD y no ha sido entregado.", category: "SHIPMENT_ISSUE" as const, priority: "URGENT" as const, status: "OPEN" as const, customer: 2 },
    { number: "TK-0004", subject: "Consulta sobre tarifas", description: "El cliente desea información sobre las tarifas para paquetes mayores de 50 lbs.", category: "GENERAL" as const, priority: "LOW" as const, status: "RESOLVED" as const, customer: 3, resolvedAt: new Date("2026-03-20") },
    { number: "TK-0005", subject: "Paquete extraviado", description: "El tracking muestra entregado pero el cliente dice que no recibió nada.", category: "LOST_PACKAGE" as const, priority: "HIGH" as const, status: "IN_PROGRESS" as const, customer: 4 },
    { number: "TK-0006", subject: "Solicitud de reembolso", description: "Solicita reembolso por paquete perdido hace 2 semanas.", category: "BILLING" as const, priority: "MEDIUM" as const, status: "WAITING_CUSTOMER" as const, customer: 5 },
    { number: "TK-0007", subject: "Error en dirección de entrega", description: "La dirección registrada es incorrecta y necesita actualización antes del despacho.", category: "SHIPMENT_ISSUE" as const, priority: "MEDIUM" as const, status: "RESOLVED" as const, customer: 6, resolvedAt: new Date("2026-03-18") },
    { number: "TK-0008", subject: "Artículo prohibido retenido en aduana", description: "DGA retuvo el paquete por contener artículo restringido. Cliente necesita orientación.", category: "SHIPMENT_ISSUE" as const, priority: "HIGH" as const, status: "CLOSED" as const, customer: 7, resolvedAt: new Date("2026-03-15"), closedAt: new Date("2026-03-16") },
  ];

  for (const t of ticketsData) {
    await prisma.ticket.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: t.number } },
      create: {
        tenantId: tenant.id,
        number: t.number,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        customerId: customers[t.customer]?.id,
        resolvedAt: t.resolvedAt ?? null,
        closedAt: t.closedAt ?? null,
      },
      update: {},
    });
  }

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

// ─── Blumbox seed ────────────────────────────────────────────────

async function seedBlumbox(pepper: string) {
  // ── Tenant ──
  const tenant = await prisma.tenant.upsert({
    where: { slug: "blumbox" },
    create: {
      id: "2f193f7c-8571-4370-ada0-bd770aef1589",
      slug: "blumbox",
      name: "Blumbox Courier",
      casilleroPrefix: "BLX",
      casilleroCounter: 0,
      plan: "GROWTH",
      planStatus: "ACTIVE",
    },
    update: { casilleroCounter: 0 },
  });

  // ── API Key (fixed, deterministic) ──
  const blumboxRawKey = "spq_blumbox_courier-integration-2025";
  const blumboxHash = hashApiKey(blumboxRawKey, pepper);
  await prisma.apiKey.deleteMany({ where: { tenantId: tenant.id, name: "Blumbox Integration key" } });
  await prisma.apiKey.create({
    data: { tenantId: tenant.id, name: "Blumbox Integration key", keyHash: blumboxHash, keyPrefix: "spq_blumbox_cou", role: "INTEGRATION" },
  });

  // ── Users ──
  const userPasswordHash = await bcryptHash("blumbox2025", 12);
  await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@blumbox.com.do",
      passwordHash: userPasswordHash,
      firstName: "Administrador",
      lastName: "Blumbox",
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "operaciones@blumbox.com.do",
      passwordHash: userPasswordHash,
      firstName: "Operaciones",
      lastName: "Blumbox",
      role: "OPERATOR",
    },
  });

  // ── Branches ──
  const branches = await Promise.all([
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "MIA-WH" } },
      create: {
        tenantId: tenant.id, name: "Almacén Miami", code: "MIA-WH", type: "WAREHOUSE",
        address: { street: "8300 NW 53rd St, Suite 100", city: "Doral", state: "FL", zip: "33166", country: "US" },
        coordinates: { lat: 25.8190, lng: -80.3384 }, phone: "+1 305-477-8820", email: "miami@blumbox.com.do",
      },
      update: {},
    }),
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "SDQ-OFF" } },
      create: {
        tenantId: tenant.id, name: "Oficina Santo Domingo", code: "SDQ-OFF", type: "OFFICE",
        address: { street: "Av. Abraham Lincoln #504", city: "Santo Domingo", state: "DN", zip: "10122", country: "DO" },
        coordinates: { lat: 18.4722, lng: -69.9390 }, phone: "809-535-1200", email: "info@blumbox.com.do",
      },
      update: {},
    }),
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "STI-PU" } },
      create: {
        tenantId: tenant.id, name: "Punto de Retiro Santiago", code: "STI-PU", type: "PICKUP_POINT",
        address: { street: "Calle del Sol #120, Plaza Internacional Local 8", city: "Santiago de los Caballeros", state: "Santiago", zip: "51000", country: "DO" },
        coordinates: { lat: 19.4517, lng: -70.6970 }, phone: "809-580-3400", email: "santiago@blumbox.com.do",
      },
      update: {},
    }),
    prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: "LRM-DC" } },
      create: {
        tenantId: tenant.id, name: "Centro de Distribución La Romana", code: "LRM-DC", type: "SORTING_CENTER",
        address: { street: "Carretera La Romana-Higüey Km 3.5", city: "La Romana", state: "La Romana", zip: "22000", country: "DO" },
        coordinates: { lat: 18.4274, lng: -68.9728 }, phone: "809-556-7800", email: "laromana@blumbox.com.do",
      },
      update: {},
    }),
  ]);

  const [miamiBranch, sdqBranch, _stiBranch, _lrmBranch] = branches;
  void _stiBranch; void _lrmBranch;

  // ── Customers ──
  const passwordHash = await bcryptHash("blumbox2025", 12);
  const customersData = [
    { firstName: "Ramón", lastName: "Féliz Castillo", email: "ramon.feliz@gmail.com", phone: "809-555-0101", idType: "CEDULA" as const, idNumber: "001-0234567-8" },
    { firstName: "Yolanda", lastName: "Bautista Reyes", email: "yolanda.bautista@hotmail.com", phone: "809-555-0102", idType: "CEDULA" as const, idNumber: "002-1345678-9" },
    { firstName: "Francisco", lastName: "de la Cruz Marte", email: "francisco.delacruz@gmail.com", phone: "829-555-0103", idType: "CEDULA" as const, idNumber: "003-2456789-0" },
    { firstName: "Altagracia", lastName: "Peña Valdez", email: "altagracia.pena@outlook.com", phone: "809-555-0104", idType: "CEDULA" as const, idNumber: "004-3567890-1" },
    { firstName: "Juan Carlos", lastName: "Rosario Núñez", email: "jcrosario@gmail.com", phone: "849-555-0105", idType: "CEDULA" as const, idNumber: "005-4678901-2" },
    { firstName: "Wendy", lastName: "Jiménez Taveras", email: "wendy.jimenez@yahoo.com", phone: "809-555-0106", idType: "CEDULA" as const, idNumber: "006-5789012-3" },
    { firstName: "Héctor", lastName: "Matos Polanco", email: "hector.matos@gmail.com", phone: "829-555-0107", idType: "RNC" as const, idNumber: "131-45678-9" },
    { firstName: "Maribel", lastName: "Santana De León", email: "maribel.santana@gmail.com", phone: "809-555-0108", idType: "CEDULA" as const, idNumber: "007-6890123-4" },
    { firstName: "Rafael", lastName: "Ureña Almonte", email: "rafael.urena@hotmail.com", phone: "849-555-0109", idType: "CEDULA" as const, idNumber: "008-7901234-5" },
    { firstName: "Esther", lastName: "Capellán Ferreras", email: "esther.capellan@gmail.com", phone: "809-555-0110", idType: "CEDULA" as const, idNumber: "009-8012345-6" },
    { firstName: "Luis Miguel", lastName: "Peralta Guzmán", email: "luismp@gmail.com", phone: "829-555-0111", idType: "CEDULA" as const, idNumber: "010-9123456-7" },
    { firstName: "Yokasta", lastName: "Hernández Mena", email: "yokasta.hdez@outlook.com", phone: "809-555-0112", idType: "CEDULA" as const, idNumber: "011-0234567-8" },
    { firstName: "Diógenes", lastName: "Ramírez Ogando", email: "diogenes.ramirez@gmail.com", phone: "849-555-0113", idType: "PASSPORT" as const, idNumber: "PA9876543" },
    { firstName: "Claribel", lastName: "Mercedes Duarte", email: "claribel.mercedes@yahoo.com", phone: "809-555-0114", idType: "CEDULA" as const, idNumber: "012-1345678-9" },
    { firstName: "Ángel", lastName: "Tavárez Santos", email: "angel.tavarez@gmail.com", phone: "829-555-0115", idType: "CEDULA" as const, idNumber: "013-2456789-0" },
  ];

  // Clean existing blumbox data
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
  await prisma.ticket.deleteMany({ where: { tenantId: tenant.id } });

  // Reset casillero counter
  await prisma.tenant.update({ where: { id: tenant.id }, data: { casilleroCounter: 0 } });

  const customers: Array<{ id: string; firstName: string; lastName: string; idNumber: string | null }> = [];
  for (const c of customersData) {
    const idx = customers.length + 1;
    const customer = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        casillero: `BLX-${String(idx).padStart(4, "0")}`,
        email: c.email,
        passwordHash,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        idType: c.idType,
        idNumber: c.idNumber,
        address: { street: "Calle Ejemplo #" + (idx * 10), city: idx <= 10 ? "Santo Domingo" : "Santiago", country: "DO" },
      },
    });
    customers.push(customer);
  }
  await prisma.tenant.update({ where: { id: tenant.id }, data: { casilleroCounter: customers.length } });

  // ── Rate Table ──
  await prisma.rateTable.create({
    data: {
      tenantId: tenant.id, name: "Tarifa Estándar Blumbox", originZone: "US-FL", destZone: "DO",
      isDefault: true,
      tiers: {
        create: [
          { minWeight: 0, maxWeight: 5, pricePerLb: 3.75, flatFee: 0 },
          { minWeight: 5.01, maxWeight: 20, pricePerLb: 3.25, flatFee: 0 },
          { minWeight: 20.01, maxWeight: 50, pricePerLb: 2.85, flatFee: 0 },
          { minWeight: 50.01, maxWeight: 9999, pricePerLb: 2.50, flatFee: 5.00 },
        ],
      },
    },
  });

  // ── Shipments with tracking events ──
  const shipmentsData = [
    // DELIVERED (complete journey) — 8 shipments
    { tracking: "BLX-2026-0001", customer: 0, phase: "DELIVERED" as const, weight: 3.2, value: 59.99, desc: "Funda iPhone 16 Pro + vidrio templado", daysOld: 28 },
    { tracking: "BLX-2026-0002", customer: 1, phase: "DELIVERED" as const, weight: 8.5, value: 189.00, desc: "Zapatillas New Balance 574 x2", daysOld: 25 },
    { tracking: "BLX-2026-0003", customer: 2, phase: "DELIVERED" as const, weight: 5.0, value: 72.00, desc: "Vitaminas Centrum + Omega 3", daysOld: 22 },
    { tracking: "BLX-2026-0004", customer: 3, phase: "DELIVERED" as const, weight: 14.2, value: 210.00, desc: "Ropa de niños - Carter's", daysOld: 20 },
    { tracking: "BLX-2026-0005", customer: 4, phase: "DELIVERED" as const, weight: 25.0, value: 420.00, desc: "Monitor LG 27\" 4K + soporte", daysOld: 18 },
    { tracking: "BLX-2026-0006", customer: 5, phase: "DELIVERED" as const, weight: 1.8, value: 34.50, desc: "Cosméticos Maybelline", daysOld: 15 },
    { tracking: "BLX-2026-0007", customer: 6, phase: "DELIVERED" as const, weight: 11.0, value: 155.00, desc: "Herramientas Stanley - Home Depot", daysOld: 12 },
    { tracking: "BLX-2026-0008", customer: 7, phase: "DELIVERED" as const, weight: 6.3, value: 95.00, desc: "Juguetes LEGO Star Wars", daysOld: 10 },
    // OUT_FOR_DELIVERY — 3 shipments
    { tracking: "BLX-2026-0009", customer: 8, phase: "OUT_FOR_DELIVERY" as const, weight: 4.7, value: 78.00, desc: "Auriculares Sony WH-1000XM5", daysOld: 5 },
    { tracking: "BLX-2026-0010", customer: 9, phase: "OUT_FOR_DELIVERY" as const, weight: 18.0, value: 290.00, desc: "Aspiradora Dyson V8", daysOld: 4 },
    { tracking: "BLX-2026-0011", customer: 10, phase: "OUT_FOR_DELIVERY" as const, weight: 7.5, value: 110.00, desc: "Ropa deportiva Under Armour", daysOld: 3 },
    // CLEARED — 3 shipments
    { tracking: "BLX-2026-0012", customer: 11, phase: "CLEARED" as const, weight: 2.9, value: 45.00, desc: "Libros Amazon - novelas", daysOld: 3 },
    { tracking: "BLX-2026-0013", customer: 12, phase: "CLEARED" as const, weight: 9.8, value: 165.00, desc: "Zapatos Nike Air Force 1 x3", daysOld: 2 },
    { tracking: "BLX-2026-0014", customer: 0, phase: "CLEARED" as const, weight: 12.0, value: 198.00, desc: "Batería de cocina T-fal", daysOld: 2 },
    // IN_CUSTOMS — 4 shipments
    { tracking: "BLX-2026-0015", customer: 1, phase: "IN_CUSTOMS" as const, weight: 38.0, value: 799.00, desc: "iPad Pro M4 + Apple Pencil", daysOld: 3 },
    { tracking: "BLX-2026-0016", customer: 2, phase: "IN_CUSTOMS" as const, weight: 22.0, value: 350.00, desc: "Impresora HP LaserJet + tóner", daysOld: 2 },
    { tracking: "BLX-2026-0017", customer: 3, phase: "IN_CUSTOMS" as const, weight: 5.5, value: 88.00, desc: "Perfumes Bath & Body Works x6", daysOld: 2 },
    { tracking: "BLX-2026-0018", customer: 13, phase: "IN_CUSTOMS" as const, weight: 16.0, value: 245.00, desc: "Silla de oficina ergonómica", daysOld: 1 },
    // IN_TRANSIT — 5 shipments
    { tracking: "BLX-2026-0019", customer: 4, phase: "IN_TRANSIT" as const, weight: 30.0, value: 550.00, desc: "TV Samsung 55\" QLED - Best Buy", daysOld: 2 },
    { tracking: "BLX-2026-0020", customer: 5, phase: "IN_TRANSIT" as const, weight: 4.0, value: 62.00, desc: "Suplementos GNC", daysOld: 1 },
    { tracking: "BLX-2026-0021", customer: 6, phase: "IN_TRANSIT" as const, weight: 8.2, value: 130.00, desc: "Ropa Zara - paquete mixto", daysOld: 1 },
    { tracking: "BLX-2026-0022", customer: 14, phase: "IN_TRANSIT" as const, weight: 13.5, value: 195.00, desc: "Repuestos Toyota - AutoZone", daysOld: 1 },
    { tracking: "BLX-2026-0023", customer: 7, phase: "IN_TRANSIT" as const, weight: 2.5, value: 38.00, desc: "Cables y accesorios electrónicos", daysOld: 0 },
    // RECEIVED (at Miami warehouse) — 5 shipments
    { tracking: "BLX-2026-0024", customer: 8, phase: "RECEIVED" as const, weight: 6.8, value: 99.00, desc: "Mochila North Face + botella", daysOld: 1 },
    { tracking: "BLX-2026-0025", customer: 9, phase: "RECEIVED" as const, weight: 42.0, value: 680.00, desc: "Caminadora plegable", daysOld: 0 },
    { tracking: "BLX-2026-0026", customer: 10, phase: "RECEIVED" as const, weight: 1.5, value: 28.00, desc: "Mascarillas faciales coreanas", daysOld: 0 },
    { tracking: "BLX-2026-0027", customer: 11, phase: "RECEIVED" as const, weight: 19.0, value: 310.00, desc: "Botas Timberland x2 pares", daysOld: 0 },
    { tracking: "BLX-2026-0028", customer: 12, phase: "RECEIVED" as const, weight: 3.3, value: 48.00, desc: "Juegos de mesa - Target", daysOld: 0 },
    // CREATED (just entered system) — 4 shipments
    { tracking: "BLX-2026-0029", customer: 13, phase: "CREATED" as const, weight: 7.0, value: 105.00, desc: "Tenis Adidas Ultraboost", daysOld: 0 },
    { tracking: "BLX-2026-0030", customer: 14, phase: "CREATED" as const, weight: 15.0, value: 225.00, desc: "Paquete mixto Walmart", daysOld: 0 },
    { tracking: "BLX-2026-0031", customer: 0, phase: "CREATED" as const, weight: 2.0, value: 32.00, desc: "Accesorios para celular", daysOld: 0 },
    { tracking: "BLX-2026-0032", customer: 1, phase: "CREATED" as const, weight: 10.0, value: 160.00, desc: "Set de sábanas Queen - Amazon", daysOld: 0 },
    // EXCEPTION — 2 shipments
    { tracking: "BLX-2026-0033", customer: 3, phase: "EXCEPTION" as const, weight: 48.0, value: 1100.00, desc: "Drone DJI Air 3 + baterías extra", daysOld: 6 },
    { tracking: "BLX-2026-0034", customer: 9, phase: "EXCEPTION" as const, weight: 35.0, value: 750.00, desc: "Generador portátil 2000W", daysOld: 4 },
    // RETURNED — 1 shipment
    { tracking: "BLX-2026-0035", customer: 5, phase: "RETURNED" as const, weight: 3.0, value: 55.00, desc: "Zapatos incorrectos - devolución", daysOld: 8 },
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
    RETURNED: ["CREATED", "RECEIVED", "DEPARTED", "ARRIVED", "CUSTOMS_IN", "EXCEPTION", "DELIVERED"],
  };

  const eventLocations: Record<string, object> = {
    CREATED: { facility: "Compra Online", city: "Various", country: "US" },
    RECEIVED: { facility: "Almacén Miami", city: "Doral", state: "FL", country: "US" },
    DEPARTED: { facility: "Almacén Miami", city: "Doral", state: "FL", country: "US" },
    ARRIVED: { facility: "Puerto de Haina", city: "San Cristóbal", country: "DO" },
    CUSTOMS_IN: { facility: "DGA - Haina", city: "San Cristóbal", country: "DO" },
    CUSTOMS_CLEARED: { facility: "DGA - Haina", city: "San Cristóbal", country: "DO" },
    OUT_FOR_DELIVERY: { facility: "Oficina Santo Domingo", city: "Santo Domingo", country: "DO" },
    DELIVERED: { city: "Santo Domingo", country: "DO" },
    EXCEPTION: { facility: "DGA - Aeropuerto AILA, SDQ", city: "Santo Domingo Este", country: "DO", reason: "Requiere documentación adicional de DGA" },
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
          idempotencyKey: `seed-blumbox-${s.tracking}-${events[i]}`,
        },
      });
    }

    shipments.push(shipment);
  }

  // ── Containers ──
  // 1. Maritime FCL — IN_TRANSIT
  const containerFCL = await prisma.container.create({
    data: {
      tenantId: tenant.id, number: "MSCU8374921", type: "MARITIME_FCL", mode: "SEA",
      origin: "MIA", destination: "SDQ", status: "IN_TRANSIT",
      carrier: "MSC Mediterranean Shipping", vesselName: "MSC ANNA", voyageNumber: "VY2603-A",
      blNumber: "MEDU8901234", sealNumber: "SL-44321",
      estimatedDeparture: daysAgo(4), actualDeparture: daysAgo(3),
      estimatedArrival: daysAgo(-2),
      totalPieces: 5, totalWeightLbs: 57.7,
    },
  });

  // Add IN_TRANSIT shipments to FCL container
  for (const idx of [18, 19, 20, 21, 22]) {
    await prisma.containerItem.create({
      data: {
        containerId: containerFCL.id,
        shipmentId: shipments[idx].id,
        weightLbs: shipmentsData[idx].weight,
        pieces: 1,
        description: shipmentsData[idx].desc,
      },
    });
  }

  // 2. Maritime LCL — IN_CUSTOMS
  const containerLCL = await prisma.container.create({
    data: {
      tenantId: tenant.id, number: "TEMU7643820", type: "MARITIME_LCL", mode: "SEA",
      origin: "MIA", destination: "SDQ", status: "IN_CUSTOMS",
      carrier: "Hapag-Lloyd", vesselName: "ROTTERDAM EXPRESS", voyageNumber: "VY2603-B",
      blNumber: "HLCU6789012", sealNumber: "SL-55678",
      estimatedDeparture: daysAgo(8), actualDeparture: daysAgo(7),
      estimatedArrival: daysAgo(2), actualArrival: daysAgo(1),
      totalPieces: 4, totalWeightLbs: 81.5,
    },
  });

  // Add IN_CUSTOMS shipments to LCL container
  for (const idx of [14, 15, 16, 17]) {
    await prisma.containerItem.create({
      data: {
        containerId: containerLCL.id,
        shipmentId: shipments[idx].id,
        weightLbs: shipmentsData[idx].weight,
        pieces: 1,
        description: shipmentsData[idx].desc,
      },
    });
  }

  // 3. Air cargo — DELIVERED
  const containerAir = await prisma.container.create({
    data: {
      tenantId: tenant.id, number: "AWB-0451239876", type: "AIR", mode: "AIR",
      origin: "MIA", destination: "SDQ", status: "DELIVERED",
      carrier: "Arajet", voyageNumber: "DM-1042",
      blNumber: "045-12398760",
      estimatedDeparture: daysAgo(14), actualDeparture: daysAgo(14),
      estimatedArrival: daysAgo(13), actualArrival: daysAgo(13),
      totalPieces: 3, totalWeightLbs: 21.1,
    },
  });

  // Add some DELIVERED shipments to air container
  for (const idx of [5, 6, 7]) {
    await prisma.containerItem.create({
      data: {
        containerId: containerAir.id,
        shipmentId: shipments[idx].id,
        weightLbs: shipmentsData[idx].weight,
        pieces: 1,
        description: shipmentsData[idx].desc,
      },
    });
  }

  // ── Pre-Alerts ──
  const preAlertsData = [
    { customer: 0, tracking: "1Z999AA30234567890", carrier: "UPS", store: "Amazon", desc: "Apple Watch Series 10", value: 399.99, status: "PENDING" as const },
    { customer: 1, tracking: "9400111899334567890123", carrier: "USPS", store: "Shein", desc: "Vestidos y blusas (8 piezas)", value: 85.00, status: "PENDING" as const },
    { customer: 2, tracking: "794644790245", carrier: "FedEx", store: "Walmart", desc: "Licuadora Ninja + accesorios", value: 129.00, status: "PENDING" as const },
    { customer: 3, tracking: "1Z999BB30345678901", carrier: "UPS", store: "Best Buy", desc: "Teclado mecánico Corsair K70", value: 149.99, status: "PENDING" as const },
    { customer: 4, tracking: "9274899998765432109876", carrier: "USPS", store: "eBay", desc: "Cargador laptop universal", value: 35.00, status: "PENDING" as const },
    { customer: 5, tracking: "794644791357", carrier: "FedEx", store: "Amazon", desc: "Echo Dot 5ta gen + bombillos smart", value: 79.99, status: "RECEIVED" as const },
    { customer: 6, tracking: "1Z999CC40456789012", carrier: "UPS", store: "Target", desc: "Ropa de cama infantil", value: 65.00, status: "RECEIVED" as const },
    { customer: 7, tracking: "9400111899445678901234", carrier: "USPS", store: "Shein", desc: "Accesorios y bisutería (12 piezas)", value: 42.50, status: "RECEIVED" as const },
    { customer: 8, tracking: "794644792468", carrier: "FedEx", store: "Amazon", desc: "Kindle Paperwhite 2025", value: 149.99, status: "RECEIVED" as const },
    { customer: 9, tracking: "1Z999DD50567890123", carrier: "UPS", store: "Best Buy", desc: "Cámara Ring Doorbell", value: 99.99, status: "RECEIVED" as const },
    { customer: 10, tracking: "9274899998765432209876", carrier: "USPS", store: "Walmart", desc: "Set de ollas antiadherentes", value: 89.00, status: "PROCESSED" as const },
    { customer: 11, tracking: "794644793579", carrier: "FedEx", store: "Amazon", desc: "Audífonos JBL Tune 770NC", value: 79.95, status: "PROCESSED" as const },
    { customer: 12, tracking: "1Z999EE60678901234", carrier: "UPS", store: "eBay", desc: "Repuestos bicicleta", value: 55.00, status: "PROCESSED" as const },
    { customer: 13, tracking: "9400111899556789012345", carrier: "USPS", store: "Amazon", desc: "Cámara GoPro Hero 13", value: 349.99, status: "PROCESSED" as const },
    { customer: 14, tracking: "794644794680", carrier: "FedEx", store: "Walmart", desc: "Artículos de limpieza variados", value: 45.00, status: "PENDING" as const },
    { customer: 0, tracking: "1Z999FF70789012345", carrier: "UPS", store: "Amazon", desc: "Tablet Samsung Galaxy Tab S9", value: 449.99, status: "PENDING" as const },
    { customer: 2, tracking: "9400111899667890123456", carrier: "USPS", store: "Shein", desc: "Ropa casual hombre (6 piezas)", value: 72.00, status: "PENDING" as const },
    { customer: 4, tracking: "794644795791", carrier: "FedEx", store: "Best Buy", desc: "Mouse Logitech MX Master 3S", value: 99.99, status: "PENDING" as const },
    { customer: 7, tracking: "1Z999GG80890123456", carrier: "UPS", store: "Amazon", desc: "Filtros de agua Brita x4", value: 38.00, status: "RECEIVED" as const },
    { customer: 11, tracking: "9274899998765432309876", carrier: "USPS", store: "eBay", desc: "Fundas para muebles de patio", value: 62.00, status: "RECEIVED" as const },
  ];

  for (const pa of preAlertsData) {
    await prisma.preAlert.create({
      data: {
        tenantId: tenant.id, customerId: customers[pa.customer].id,
        trackingNumber: pa.tracking, carrier: pa.carrier, store: pa.store,
        description: pa.desc, estimatedValue: pa.value, status: pa.status,
      },
    });
  }

  // ── Receptions (for RECEIVED and beyond shipments) ──
  const receptionShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => !["CREATED"].includes(s.phase));

  let receptionCount = 0;
  for (const s of receptionShipments.slice(0, 15)) {
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
        charges: [{ concept: "Flete", amount: s.weight * 3.25 }, { concept: "Manejo", amount: 2.00 }],
        totalCharge: s.weight * 3.25 + 2.00,
        status: s.phase === "DELIVERED" ? "DELIVERED" : s.phase === "OUT_FOR_DELIVERY" ? "READY_FOR_PICKUP" : "CHARGED",
        receivedAt: daysAgo(s.daysOld),
      },
    });
  }

  // ── DGA Labels ──
  const dgaShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => ["IN_CUSTOMS", "CLEARED", "OUT_FOR_DELIVERY", "DELIVERED", "EXCEPTION"].includes(s.phase));

  for (const s of dgaShipments.slice(0, 6)) {
    const cust = customers[s.customer];
    const isCleared = ["CLEARED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s.phase);
    await prisma.dgaLabel.create({
      data: {
        tenantId: tenant.id,
        shipmentId: shipments[s.idx].id,
        containerId: [14, 15, 16, 17].includes(s.idx) ? containerLCL.id : null,
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
  const invoiceableShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => ["DELIVERED", "OUT_FOR_DELIVERY", "CLEARED", "IN_CUSTOMS"].includes(s.phase));

  let invoiceNum = 0;
  for (const s of invoiceableShipments.slice(0, 10)) {
    invoiceNum++;
    const flete = s.weight * 3.25;
    const manejo = 2.00;
    const subtotal = flete + manejo;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    let status: string;
    let amountPaid: number;
    let balance: number;
    let paidAt: Date | null = null;
    let partialPayment = false;

    if (s.phase === "DELIVERED" && invoiceNum <= 5) {
      status = "PAID";
      amountPaid = total;
      balance = 0;
      paidAt = daysAgo(Math.max(0, s.daysOld - 1));
    } else if (invoiceNum === 6 || invoiceNum === 7) {
      status = "PARTIAL";
      amountPaid = Math.round(total * 0.5 * 100) / 100;
      balance = Math.round((total - amountPaid) * 100) / 100;
      partialPayment = true;
    } else if (invoiceNum === 8) {
      status = "OVERDUE";
      amountPaid = 0;
      balance = total;
    } else {
      status = "ISSUED";
      amountPaid = 0;
      balance = total;
    }

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id, customerId: customers[s.customer].id,
        number: `BLX-INV-${String(invoiceNum).padStart(5, "0")}`,
        status: status as any,
        subtotal, taxTotal: tax, total,
        amountPaid, balance,
        issuedAt: daysAgo(s.daysOld),
        dueAt: daysAgo(s.daysOld - 30),
        paidAt,
        items: {
          create: [
            { shipmentId: shipments[s.idx].id, description: `Flete ${s.weight} lbs`, quantity: s.weight, unitPrice: 3.25, subtotal: flete, total: flete },
            { description: "Cargo por manejo", quantity: 1, unitPrice: 2.00, subtotal: manejo, total: manejo },
          ],
        },
      },
    });

    // Payments for paid/partial invoices
    if (status === "PAID" || partialPayment) {
      const payment = await prisma.payment.create({
        data: {
          tenantId: tenant.id, customerId: customers[s.customer].id,
          method: invoiceNum % 4 === 0 ? "BANK_TRANSFER" : invoiceNum % 3 === 0 ? "CREDIT_CARD" : invoiceNum % 2 === 0 ? "DEBIT_CARD" : "CASH",
          amount: amountPaid, reference: `BLX-REF-${String(invoiceNum).padStart(6, "0")}`,
          paidAt: paidAt ?? daysAgo(Math.max(0, s.daysOld - 1)),
        },
      });
      await prisma.paymentAllocation.create({
        data: { paymentId: payment.id, invoiceId: invoice.id, amount: amountPaid },
      });
    }
  }

  // ── Delivery Orders ──
  const deliveryShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => ["OUT_FOR_DELIVERY", "DELIVERED"].includes(s.phase));

  let doNum = 0;
  const doStatuses = ["DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "IN_TRANSIT", "IN_TRANSIT", "ASSIGNED", "PENDING", "FAILED"];
  for (const s of [...deliveryShipments.slice(0, 8)]) {
    doNum++;
    const doStatus = doStatuses[doNum - 1] || "PENDING";
    await prisma.deliveryOrder.create({
      data: {
        tenantId: tenant.id, shipmentId: shipments[s.idx].id, customerId: customers[s.customer].id,
        number: `BLX-DO-${String(doNum).padStart(5, "0")}`,
        deliveryType: doNum % 3 === 0 ? "HOME_DELIVERY" : "PICKUP",
        status: doStatus as any,
        driverName: ["DELIVERED", "IN_TRANSIT", "ASSIGNED"].includes(doStatus) ? (doNum % 2 === 0 ? "Pedro Almánzar" : "Luis Rosario") : null,
        driverPhone: doNum % 2 === 0 ? "809-555-9001" : "829-555-9002",
        scheduledAt: daysAgo(s.daysOld),
        deliveredAt: doStatus === "DELIVERED" ? daysAgo(Math.max(0, s.daysOld - 1)) : null,
        failReason: doStatus === "FAILED" ? "Cliente no se encontraba en la dirección" : null,
        deliveryAddress: { street: "Calle Ejemplo #" + ((s.customer + 1) * 10), city: s.customer <= 9 ? "Santo Domingo" : "Santiago", country: "DO" },
      },
    });
  }

  // ── Post Alerts (for delivered) ──
  const deliveredShipments = shipmentsData
    .map((s, i) => ({ ...s, idx: i }))
    .filter(s => s.phase === "DELIVERED");

  for (const s of deliveredShipments) {
    await prisma.postAlert.create({
      data: {
        tenantId: tenant.id, shipmentId: shipments[s.idx].id, customerId: customers[s.customer].id,
        trackingNumber: s.tracking,
        recipientName: `${customers[s.customer].firstName} ${customers[s.customer].lastName}`,
        carrier: "Blumbox Express",
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
      body: "Hola {{customerName}},\n\nTu paquete con tracking {{trackingNumber}} ha sido recibido en nuestro almacén de Miami.\n\nPeso: {{weight}} lbs\n\n— Equipo Blumbox Courier",
    },
    update: {},
  });
  await prisma.notificationTemplate.upsert({
    where: { tenantId_event_channel: { tenantId: tenant.id, event: "shipment.delivered", channel: "EMAIL" } },
    create: {
      tenantId: tenant.id, event: "shipment.delivered", channel: "EMAIL",
      subject: "Tu paquete {{trackingNumber}} fue entregado",
      body: "Hola {{customerName}},\n\nTu paquete {{trackingNumber}} ha sido entregado exitosamente.\n\nGracias por usar Blumbox Courier.\n\n— Equipo Blumbox",
    },
    update: {},
  });

  // ── Tickets ──
  const ticketsData = [
    { number: "BLX-TK-0001", subject: "Paquete con daños visibles", description: "El cliente reporta que su paquete de Best Buy llegó con la caja aplastada y el monitor tiene una grieta en la pantalla.", category: "DAMAGE" as const, priority: "HIGH" as const, status: "OPEN" as const, customer: 4 },
    { number: "BLX-TK-0002", subject: "Factura con monto incorrecto", description: "Se facturó peso volumétrico en vez de peso real. Diferencia de RD$450.", category: "BILLING" as const, priority: "MEDIUM" as const, status: "IN_PROGRESS" as const, customer: 1 },
    { number: "BLX-TK-0003", subject: "Paquete retenido en aduana", description: "DGA solicita documentación adicional para el drone. Cliente necesita orientación sobre el proceso.", category: "SHIPMENT_ISSUE" as const, priority: "URGENT" as const, status: "OPEN" as const, customer: 3 },
    { number: "BLX-TK-0004", subject: "Consulta sobre tiempos de entrega", description: "El cliente pregunta cuánto tarda el envío marítimo vs. aéreo desde Miami.", category: "GENERAL" as const, priority: "LOW" as const, status: "RESOLVED" as const, customer: 8, resolvedAt: new Date("2026-03-22") },
    { number: "BLX-TK-0005", subject: "Paquete no localizado", description: "Han pasado 10 días y el tracking no se actualiza. Último estado: recibido en Miami.", category: "LOST_PACKAGE" as const, priority: "HIGH" as const, status: "IN_PROGRESS" as const, customer: 12 },
  ];

  for (const t of ticketsData) {
    await prisma.ticket.upsert({
      where: { tenantId_number: { tenantId: tenant.id, number: t.number } },
      create: {
        tenantId: tenant.id,
        number: t.number,
        subject: t.subject,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        customerId: customers[t.customer]?.id,
        resolvedAt: t.resolvedAt ?? null,
      },
      update: {},
    });
  }

  console.log("\n--- Blumbox Seed OK ---");
  console.log("Tenant ID :", tenant.id);
  console.log("Tenant slug:", tenant.slug);
  console.log("API Key    :", blumboxRawKey);
  console.log("");
  console.log("Dashboard login:");
  console.log("  Tenant: blumbox");
  console.log("  Admin: admin@blumbox.com.do / blumbox2025");
  console.log("  Operador: operaciones@blumbox.com.do / blumbox2025");
  console.log("");
  console.log(`Data created: ${customers.length} customers, ${shipments.length} shipments, ${branches.length} branches`);
  console.log(`             ${invoiceNum} invoices, ${doNum} delivery orders, ${preAlertsData.length} pre-alerts`);
  console.log(`             3 containers, 6 DGA labels, 1 rate table, 2 users, ${ticketsData.length} tickets`);
  console.log(`             ${receptionCount} receptions, 2 notification templates`);
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
  if (mode === "blumbox" || mode === "all") {
    await seedBlumbox(pepper);
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
