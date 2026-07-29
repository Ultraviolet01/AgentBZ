'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch this from the API
    // For now, we'll try to simulate or just show the ID
    setLoading(false);
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading analysis...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/agents/scamsniff">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to ScamSniff
        </Button>
      </Link>

      <div className="space-y-6">
        <Card className="p-8 border-t-4 border-t-orange-500">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Report</h1>
              <p className="text-gray-500 font-mono text-sm">ID: {id}</p>
            </div>
            <Badge className="bg-orange-100 text-orange-700 px-4 py-1 text-lg">
              SIMULATED REPORT
            </Badge>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Live Report Feature Coming Soon</h3>
                <p className="text-blue-800 text-sm">
                  We are currently integrating the real-time database viewer. 
                  This report ID has been safely stored in our system.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gray-50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Trust Signals
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Valid SSL Certificate</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Domain Age Verified</li>
              </ul>
            </Card>

            <Card className="p-6 bg-gray-50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Risk Indicators
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full" /> New Domain Presence</li>
                <li className="flex items-center gap-2"><div className="w-2 h-2 bg-orange-400 rounded-full" /> Social Pattern Mismatch</li>
              </ul>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
}
