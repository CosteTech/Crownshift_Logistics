type PlainObject = Record<string, unknown>;

function isTimestampLike(value: unknown): value is { toDate: () => Date } {
  return !!value && typeof (value as any).toDate === 'function';
}

function isDocumentReferenceLike(value: unknown): value is { path: string } {
  return !!value && typeof (value as any).path === 'string' && typeof value === 'object';
}

function isPlainObject(value: unknown): value is PlainObject {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Converts Firestore Timestamp-like values into ISO strings.
 * - Timestamp -> timestamp.toDate().toISOString()
 * - Date -> date.toISOString()
 * - string -> unchanged
 */
export function serializeTimestamp(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (isTimestampLike(value)) return value.toDate().toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  return undefined;
}

/**
 * Deeply serializes Firestore data into plain JSON-safe values.
 * - Timestamp -> ISO string
 * - Date -> ISO string
 * - DocumentReference -> path string
 * - Arrays/objects are recursively serialized
 */
export function serializeFirestoreValue<T = unknown>(value: T): unknown {
  if (value === null || value === undefined) return value;

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (value instanceof Date) return value.toISOString();
  if (isTimestampLike(value)) return value.toDate().toISOString();
  if (isDocumentReferenceLike(value)) return value.path;

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (isPlainObject(value)) {
    const out: PlainObject = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = serializeFirestoreValue(nested);
    }
    return out;
  }

  // Class instance fallback: keep own enumerable fields only.
  if (typeof value === 'object') {
    const out: PlainObject = {};
    for (const [key, nested] of Object.entries(value as PlainObject)) {
      out[key] = serializeFirestoreValue(nested);
    }
    return out;
  }

  return value;
}

export function serializeFirestoreDoc(data: unknown, id?: string) {
  const plain = (serializeFirestoreValue(data) || {}) as PlainObject;
  if (id) plain.id = id;
  return plain;
}

export function serializeService(data: unknown, id?: string) {
  const raw = (data || {}) as PlainObject;
  const plain = serializeFirestoreDoc(raw, id);
  const createdAt = serializeTimestamp(raw.createdAt);
  const updatedAt = serializeTimestamp(raw.updatedAt);
  if (createdAt) plain.createdAt = createdAt;
  if (updatedAt) plain.updatedAt = updatedAt;
  return plain;
}

export function serializeFAQ(data: unknown, id?: string) {
  const raw = (data || {}) as PlainObject;
  const plain = serializeFirestoreDoc(raw, id);
  const createdAt = serializeTimestamp(raw.createdAt);
  const updatedAt = serializeTimestamp(raw.updatedAt);
  const lastUpdatedAt = serializeTimestamp(raw.lastUpdatedAt);
  if (createdAt) plain.createdAt = createdAt;
  if (updatedAt) plain.updatedAt = updatedAt;
  if (lastUpdatedAt) plain.lastUpdatedAt = lastUpdatedAt;
  return plain;
}

export function serializeShipment(data: unknown, id?: string) {
  const raw = (data || {}) as PlainObject;
  const plain = serializeFirestoreDoc(raw, id);
  const createdAt = serializeTimestamp(raw.createdAt);
  const updatedAt = serializeTimestamp(raw.updatedAt);
  const estimatedDelivery = serializeTimestamp(raw.estimatedDelivery);

  if (createdAt) plain.createdAt = createdAt;
  if (updatedAt) plain.updatedAt = updatedAt;
  if (estimatedDelivery) plain.estimatedDelivery = estimatedDelivery;

  if (Array.isArray(raw.timeline)) {
    plain.timeline = raw.timeline.map((entry) => {
      const timelineEntry = serializeFirestoreDoc(entry) as PlainObject;
      const ts = serializeTimestamp((entry as PlainObject)?.timestamp);
      if (ts) timelineEntry.timestamp = ts;
      return timelineEntry;
    });
  }

  return plain;
}
