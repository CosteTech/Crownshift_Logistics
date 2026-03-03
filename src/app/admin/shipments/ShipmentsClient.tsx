'use client';

import { useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/provider';
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  ArrowRight,
  Loader2,
  RefreshCw,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface ShipmentRecord {
  id: string;
  trackingNumber: string;
  clientDetails?: { name?: string; email?: string };
  origin: string;
  destination: string;
  dimensions?: string;
  weight?: string;
  quote?: number;
  quoteKES?: number;
  status: string;
  packageType?: string;
  urgency?: string;
  estimatedDeliveryDays?: number;
  creationDate?: Timestamp | string | null;
}

function formatDate(val: Timestamp | string | null | undefined): string {
  if (!val) return '—';
  if (val instanceof Timestamp) return val.toDate().toLocaleDateString('en-KE');
  if (typeof val === 'string') return new Date(val).toLocaleDateString('en-KE');
  return '—';
}

function statusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'order confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'in transit': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export default function AdminShipmentsClient() {
  const { firestore } = useFirebase();
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = async () => {
    if (!firestore) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(firestore, 'shipments'),
        orderBy('creationDate', 'desc')
      );
      const snap = await getDocs(q);
      const data: ShipmentRecord[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ShipmentRecord, 'id'>),
      }));
      setShipments(data);
    } catch (e) {
      console.error('Error fetching shipments:', e);
      setError('Failed to load shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]);

  // Stats
  const totalRevenue = shipments.reduce((acc, s) => acc + (s.quoteKES || 0), 0);
  const confirmed = shipments.filter((s) => s.status?.toLowerCase() === 'order confirmed').length;
  const inTransit = shipments.filter((s) => s.status?.toLowerCase() === 'in transit').length;
  const delivered = shipments.filter((s) => s.status?.toLowerCase() === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 font-headline">Shipments</h1>
          <p className="text-slate-400 text-sm mt-1">
            All client-booked shipments from the website quote form.
          </p>
        </div>
        <Button
          onClick={fetchShipments}
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Shipments', value: shipments.length, icon: Package, color: 'text-orange-400' },
          { label: 'Order Confirmed', value: confirmed, icon: Clock, color: 'text-blue-400' },
          { label: 'In Transit', value: inTransit, icon: TrendingUp, color: 'text-yellow-400' },
          { label: 'Delivered', value: delivered, icon: CheckCircle2, color: 'text-green-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-700">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-100">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue */}
      {totalRevenue > 0 && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-slate-400 text-sm">Total Quoted Revenue (KES)</p>
            <p className="text-2xl font-bold text-orange-400">
              KSH {totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 text-lg">All Bookings</CardTitle>
          <CardDescription className="text-slate-400">
            {shipments.length} shipment{shipments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p>{error}</p>
              <Button onClick={fetchShipments} variant="outline" size="sm" className="mt-4">
                Retry
              </Button>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No shipments yet</p>
              <p className="text-slate-600 text-sm mt-1">
                Bookings made via the website quote form will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-medium">Tracking #</TableHead>
                    <TableHead className="text-slate-400 font-medium">Client</TableHead>
                    <TableHead className="text-slate-400 font-medium">Route</TableHead>
                    <TableHead className="text-slate-400 font-medium">Weight</TableHead>
                    <TableHead className="text-slate-400 font-medium">Quote</TableHead>
                    <TableHead className="text-slate-400 font-medium">Status</TableHead>
                    <TableHead className="text-slate-400 font-medium">Date</TableHead>
                    <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((s) => (
                    <TableRow
                      key={s.id}
                      className="border-slate-700 hover:bg-slate-700/40 transition-colors"
                    >
                      <TableCell className="font-mono text-orange-400 font-semibold text-sm">
                        {s.trackingNumber || s.id.slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-slate-200 font-medium text-sm">
                            {s.clientDetails?.name || '—'}
                          </p>
                          <p className="text-slate-500 text-xs truncate max-w-[160px]">
                            {s.clientDetails?.email || '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-slate-300 truncate max-w-[80px]">{s.origin}</span>
                          <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="text-slate-300 truncate max-w-[80px]">{s.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{s.weight || '—'}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-slate-200 font-semibold text-sm">
                            KSH {s.quoteKES ? s.quoteKES.toLocaleString() : '—'}
                          </p>
                          {s.quote && (
                            <p className="text-slate-500 text-xs">${s.quote.toFixed(2)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(s.status)}`}
                        >
                          {s.status || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(s.creationDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/shipments/${s.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
