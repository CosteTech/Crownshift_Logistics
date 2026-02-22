import { getFirestoreAdmin } from '@/firebase/server-init';

/**
 * Simple ETA predictor that uses historical delivered shipment durations
 * and computes a median duration for the same service + origin/destination pair.
 */
export async function predictAndSaveETA(shipment: any) {
  try {
    const db = getFirestoreAdmin();
    const { serviceSlug, origin, destination, trackingNumber } = shipment;

    // Query historical delivered shipments for same service
    let query = db.collection('shipments')
      .where('serviceSlug', '==', serviceSlug)
      .where('status', '==', 'delivered')
      .orderBy('createdAt', 'desc')
      .limit(200);

    const snapshot = await query.get();
    const durations: number[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      const created = data.createdAt ? data.createdAt.toDate() : null;
      // find delivered timestamp in timeline if available
      let deliveredAt: Date | null = null;
      if (Array.isArray(data.timeline)) {
        const deliveredEntry = data.timeline.find((t: any) => t.status === 'delivered');
        if (deliveredEntry && deliveredEntry.timestamp) deliveredAt = new Date(deliveredEntry.timestamp);
      }
      if (!deliveredAt && data.updatedAt) deliveredAt = data.updatedAt.toDate();

      if (created && deliveredAt) durations.push(deliveredAt.getTime() - created.getTime());
    });

    let predicted: Date;
    if (durations.length > 0) {
      durations.sort((a, b) => a - b);
      const median = durations[Math.floor(durations.length / 2)];
      predicted = new Date(Date.now() + median);
    } else {
      // fallback: 3 days from now
      predicted = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    }

    // Save prediction back to shipment document
    await db.collection('shipments').doc(trackingNumber).update({ estimatedDelivery: predicted, updatedAt: new Date() });
    return predicted;
  } catch (err) {
    console.error('ETA prediction error', err);
    throw err;
  }
}
