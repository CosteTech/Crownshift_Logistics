import { getFirestoreAdmin } from '@/firebase/server-init';
import { logger } from '@/lib/logger';

export type RetryableOperation = 'payment_processing' | 'inventory_reservation' | 'fleet_assignment' | 'webhook_processing';

export interface RetryQueueItem {
  id: string;
  operation: RetryableOperation;
  data: any;
  retries: number;
  maxRetries: number;
  nextRetryTime: Date;
  createdAt: Date;
  lastError?: string;
}

/**
 * Queue an operation for retry with exponential backoff
 */
export async function queueForRetry(
  operation: RetryableOperation,
  data: any,
  maxRetries: number = 3
): Promise<string> {
  try {
    const db = await getFirestoreAdmin();
    const itemId = crypto.randomUUID();
    
    const item: RetryQueueItem = {
      id: itemId,
      operation,
      data,
      retries: 0,
      maxRetries,
      nextRetryTime: new Date(),
      createdAt: new Date(),
    };
    
    await db.collection('retryQueue').doc(itemId).set(item);
    
    logger.info('Operation queued for retry', {
      operation,
      itemId,
      maxRetries,
    });
    
    return itemId;
  } catch (error) {
    logger.error('Failed to queue operation for retry', { operation, error });
    throw error;
  }
}

/**
 * Process pending retry queue items
 * Should be called periodically (e.g., every 5 minutes via cron job)
 */
export async function processRetryQueue(): Promise<void> {
  try {
    const db = await getFirestoreAdmin();
    const now = new Date();
    
    // Fetch items ready for retry
    const pendingDocs = await db
      .collection('retryQueue')
      .where('nextRetryTime', '<=', now)
      .where('retries', '<', 'maxRetries')
      .limit(10) // Process max 10 per run
      .get();
    
    logger.info('Processing retry queue', { itemCount: pendingDocs.size });
    
    for (const doc of pendingDocs.docs) {
      const item = doc.data() as RetryQueueItem;
      
      try {
        await processRetryItem(item);
        
        // Success - remove from queue
        await doc.ref.delete();
        logger.info('Retry succeeded and removed from queue', { itemId: item.id });
      } catch (error) {
        // Calculate exponential backoff: 2^retries * 60 seconds
        const delaySeconds = Math.pow(2, item.retries) * 60;
        const nextRetryTime = new Date(Date.now() + delaySeconds * 1000);
        
        // Update retry count and next retry time
        await doc.ref.update({
          retries: item.retries + 1,
          nextRetryTime,
          lastError: error instanceof Error ? error.message : String(error),
        });
        
        logger.warn('Retry failed, queued for next attempt', {
          itemId: item.id,
          retries: item.retries + 1,
          maxRetries: item.maxRetries,
          nextRetryTime,
          error,
        });
        
        // Move to dead letter queue if max retries exceeded
        if (item.retries + 1 >= item.maxRetries) {
          await moveToDeadLetterQueue(doc.ref, item);
        }
      }
    }
  } catch (error) {
    logger.error('Error processing retry queue', { error });
  }
}

/**
 * Process a single retry item based on operation type
 */
async function processRetryItem(item: RetryQueueItem): Promise<void> {
  switch (item.operation) {
    case 'payment_processing':
      await retryPaymentProcessing(item.data);
      break;
    case 'inventory_reservation':
      await retryInventoryReservation(item.data);
      break;
    case 'fleet_assignment':
      await retryFleetAssignment(item.data);
      break;
    case 'webhook_processing':
      await retryWebhookProcessing(item.data);
      break;
    default:
      throw new Error(`Unknown operation type: ${item.operation}`);
  }
}

/**
 * Retry payment processing
 */
async function retryPaymentProcessing(data: any): Promise<void> {
  const { shipmentId, provider } = data;
  
  const db = await getFirestoreAdmin();
  const shipRef = db.collection('shipments').doc(shipmentId);
  
  // Re-fetch current payment status from provider
  if (provider === 'stripe') {
    // Query Stripe API for current status
    // This is handled by the Stripe webhook, so just verify
    logger.info('Retrying Stripe payment status check', { shipmentId });
  } else if (provider === 'mpesa') {
    logger.info('Retrying M-Pesa payment status check', { shipmentId });
    // Query M-Pesa API for current status
  }
}

/**
 * Retry inventory reservation
 */
async function retryInventoryReservation(data: any): Promise<void> {
  const { shipmentId, items, companyId } = data;
  
  const db = await getFirestoreAdmin();
  
  await db.runTransaction(async (tx: any) => {
    for (const item of items) {
      const query = db
        .collection('inventory')
        .where('companyId', '==', companyId)
        .where('warehouseId', '==', item.warehouseId)
        .where('sku', '==', item.sku)
        .limit(1);
      
      const snap = await tx.get(query);
      if (snap.empty) {
        throw new Error(`Inventory not found for sku ${item.sku}`);
      }
      
      const invDoc = snap.docs[0];
      const data = invDoc.data();
      const available = data.quantityAvailable ?? 0;
      
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for sku ${item.sku}`);
      }
      
      // Reserve inventory
      tx.update(invDoc.ref, {
        quantityAvailable: available - item.quantity,
        quantityReserved: (data.quantityReserved ?? 0) + item.quantity,
        updatedAt: new Date(),
      });
    }
  });
  
  logger.info('Inventory reservation retry succeeded', { shipmentId });
}

/**
 * Retry fleet assignment
 */
async function retryFleetAssignment(data: any): Promise<void> {
  const { shipmentId, vehicleId, driverId, companyId } = data;
  
  const db = await getFirestoreAdmin();
  
  await db.runTransaction(async (tx: any) => {
    const vehicleRef = db.collection('vehicles').doc(vehicleId);
    const driverRef = db.collection('drivers').doc(driverId);
    
    const [vSnap, dSnap] = await Promise.all([
      tx.get(vehicleRef),
      tx.get(driverRef),
    ]);
    
    if (!vSnap.exists || !dSnap.exists) {
      throw new Error('Vehicle or driver not found');
    }
    
    const vData = vSnap.data();
    const dData = dSnap.data();
    
    if (vData.status !== 'available' || dData.status !== 'available') {
      throw new Error('Vehicle or driver not available');
    }
    
    // Create assignment
    const assignmentRef = db.collection('vehicleAssignments').doc();
    tx.set(assignmentRef, {
      companyId,
      shipmentId,
      vehicleId,
      driverId,
      assignedAt: new Date(),
    });
    
    // Update vehicle and driver status
    tx.update(vehicleRef, { status: 'in-transit' });
    tx.update(driverRef, { status: 'assigned' });
  });
  
  logger.info('Fleet assignment retry succeeded', { shipmentId });
}

/**
 * Retry webhook processing
 */
async function retryWebhookProcessing(data: any): Promise<void> {
  const { eventId, eventType, eventData } = data;
  
  logger.info('Retrying webhook processing', { eventId, eventType });
  
  // Note: Actual webhook processing logic would go here
  // This is a placeholder for webhook retry logic
}

/**
 * Move failed item to dead letter queue
 */
async function moveToDeadLetterQueue(
  docRef: any,
  item: RetryQueueItem
): Promise<void> {
  try {
    const db = await getFirestoreAdmin();
    
    // Copy to dead letter queue
    await db.collection('deadLetterQueue').doc(item.id).set({
      ...item,
      failedAt: new Date(),
      status: 'failed',
    });
    
    // Remove from retry queue
    await docRef.delete();
    
    logger.error('Item moved to dead letter queue', {
      itemId: item.id,
      operation: item.operation,
      retries: item.retries,
      maxRetries: item.maxRetries,
    });
  } catch (error) {
    logger.error('Failed to move item to dead letter queue', { error });
  }
}

/**
 * Get dead letter queue items for manual review
 */
export async function getDeadLetterItems(limit: number = 10): Promise<RetryQueueItem[]> {
  try {
    const db = await getFirestoreAdmin();
    
    const docs = await db
      .collection('deadLetterQueue')
      .orderBy('failedAt', 'desc')
      .limit(limit)
      .get();
    
    return docs.docs.map(doc => doc.data() as RetryQueueItem);
  } catch (error) {
    logger.error('Failed to fetch dead letter queue', { error });
    return [];
  }
}

/**
 * Replay an item from dead letter queue
 */
export async function replayDeadLetterItem(itemId: string): Promise<void> {
  try {
    const db = await getFirestoreAdmin();
    const doc = await db.collection('deadLetterQueue').doc(itemId).get();
    
    if (!doc.exists) {
      throw new Error('Item not found in dead letter queue');
    }
    
    const item = doc.data() as RetryQueueItem;
    
    // Re-queue for retry
    await queueForRetry(item.operation, item.data, item.maxRetries);
    
    // Remove from dead letter queue
    await doc.ref.delete();
    
    logger.info('Dead letter item replayed', { itemId });
  } catch (error) {
    logger.error('Failed to replay dead letter item', { itemId, error });
    throw error;
  }
}

export default {
  queueForRetry,
  processRetryQueue,
  getDeadLetterItems,
  replayDeadLetterItem,
};
