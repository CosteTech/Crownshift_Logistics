// Strongly-typed Firestore models for Crownshift Logistics

export type TimestampLike = Date | string | number | { toDate: () => Date };

export interface Service {
  id?: string;
  name: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  icon?: string;
  featured?: boolean;
  basePrice?: number;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export type ShipmentStatus =
  | 'pending'
  | 'picked-up'
  | 'in-transit'
  | 'customs'
  | 'delivered';

export interface ShipmentTimelineEntry {
  status: ShipmentStatus;
  location: string;
  timestamp: TimestampLike;
}

export interface Payment {
  provider: 'stripe' | 'mpesa' | string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface Shipment {
  id?: string;
  trackingNumber: string;
  customerId: string;
  customerEmail?: string;
  serviceSlug: string;
  origin: { country: string; city: string };
  destination: { country: string; city: string };
  status: ShipmentStatus;
  timeline?: ShipmentTimelineEntry[];
  estimatedDelivery?: TimestampLike;
  payment?: Payment;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface User {
  uid?: string;
  name: string;
  email: string;
  role: 'client' | 'admin';
  createdAt?: TimestampLike;
}

export interface Offer {
  id?: string;
  title: string;
  description?: string;
  discountPercent?: number;
  active?: boolean;
  validUntil?: TimestampLike;
  createdAt?: TimestampLike;
}

export interface ETAResult {
  predictedAt: TimestampLike;
  predictedETA: TimestampLike;
  confidence: number; // 0..1
}

export interface Settings {
  key: string;
  value: unknown;
  updatedAt?: TimestampLike;
}

// Inventory / Warehouse models
export interface Warehouse {
  id?: string;
  name: string;
  country: string;
  city: string;
  capacity: number;
  active: boolean;
  companyId: string;
  createdAt?: TimestampLike;
}

export interface Inventory {
  id?: string;
  companyId: string;
  warehouseId: string;
  sku: string;
  productName: string;
  quantityAvailable: number;
  quantityReserved: number;
  reorderLevel: number;
  updatedAt?: TimestampLike;
}

export type InventoryMovementType = 'inbound' | 'outbound' | 'transfer';

export interface InventoryMovement {
  id?: string;
  companyId: string;
  sku: string;
  warehouseId: string;
  type: InventoryMovementType;
  quantity: number;
  relatedShipmentId?: string;
  createdAt?: TimestampLike;
}

// Fleet models
export interface Vehicle {
  id?: string;
  companyId: string;
  plateNumber: string;
  type: 'truck' | 'van' | 'motorbike';
  capacity: number;
  status: 'available' | 'in-transit' | 'maintenance';
  currentLocation?: { latitude: number; longitude: number };
}

export interface Driver {
  id?: string;
  companyId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'available' | 'assigned';
}

export interface VehicleAssignment {
  id?: string;
  companyId: string;
  shipmentId: string;
  vehicleId: string;
  driverId: string;
  assignedAt?: TimestampLike;
}

export interface Company {
  id?: string;
  name: string;
  plan: 'basic' | 'pro' | 'enterprise';
  active: boolean;
  createdAt?: TimestampLike;
}

export interface InvoiceRecord {
  id?: string;
  companyId: string;
  shipmentId: string;
  storagePath: string;
  url?: string;
  createdAt?: TimestampLike;
}
