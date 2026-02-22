import { FirestoreDataConverter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { Shipment, ShipmentTimelineEntry, Service, Offer, User } from './firestore-models';

function toDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof value.toDate === 'function') return value.toDate();
  return undefined;
}

export const shipmentConverter: FirestoreDataConverter<Shipment> = {
  toFirestore(shipment: Shipment): DocumentData {
    const copy: any = { ...shipment };
    // convert Date to Timestamp-friendly values where necessary
    return copy;
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): Shipment {
    const data = snapshot.data();
    const timeline: ShipmentTimelineEntry[] | undefined = Array.isArray(data.timeline)
      ? data.timeline.map((t: any) => ({ ...t, timestamp: toDate(t.timestamp) }))
      : undefined;

    return {
      id: snapshot.id,
      trackingNumber: data.trackingNumber,
      customerId: data.customerId,
      customerEmail: data.customerEmail,
      serviceSlug: data.serviceSlug,
      origin: data.origin,
      destination: data.destination,
      status: data.status,
      timeline,
      estimatedDelivery: toDate(data.estimatedDelivery) as any,
      payment: data.payment,
      createdAt: toDate(data.createdAt) as any,
      updatedAt: toDate(data.updatedAt) as any,
    };
  },
};

export const serviceConverter: FirestoreDataConverter<Service> = {
  toFirestore: (s) => ({ ...s }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Service) }),
};

export const offerConverter: FirestoreDataConverter<Offer> = {
  toFirestore: (o) => ({ ...o }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Offer) }),
};

export const userConverter: FirestoreDataConverter<User> = {
  toFirestore: (u) => ({ ...u }),
  fromFirestore: (snap) => ({ uid: snap.id, ...(snap.data() as User) }),
};

import { Warehouse, Inventory, InventoryMovement, Vehicle, Driver, VehicleAssignment, Company, InvoiceRecord } from './firestore-models';

export const warehouseConverter: FirestoreDataConverter<Warehouse> = {
  toFirestore: (w) => ({ ...w }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Warehouse) }),
};

export const inventoryConverter: FirestoreDataConverter<Inventory> = {
  toFirestore: (i) => ({ ...i }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Inventory) }),
};

export const inventoryMovementConverter: FirestoreDataConverter<InventoryMovement> = {
  toFirestore: (m) => ({ ...m }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as InventoryMovement) }),
};

export const vehicleConverter: FirestoreDataConverter<Vehicle> = {
  toFirestore: (v) => ({ ...v }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Vehicle) }),
};

export const driverConverter: FirestoreDataConverter<Driver> = {
  toFirestore: (d) => ({ ...d }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Driver) }),
};

export const vehicleAssignmentConverter: FirestoreDataConverter<VehicleAssignment> = {
  toFirestore: (a) => ({ ...a }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as VehicleAssignment) }),
};

export const companyConverter: FirestoreDataConverter<Company> = {
  toFirestore: (c) => ({ ...c }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as Company) }),
};

export const invoiceConverter: FirestoreDataConverter<InvoiceRecord> = {
  toFirestore: (r) => ({ ...r }),
  fromFirestore: (snap) => ({ id: snap.id, ...(snap.data() as InvoiceRecord) }),
};
