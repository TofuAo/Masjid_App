import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/ui/Card';
import { Calendar } from 'lucide-react';

const Takwim = () => (
  <PageLayout title="Takwim">
    <Card className="p-6">
      <div className="flex items-center gap-3 text-gray-600">
        <Calendar className="w-12 h-12 text-emerald-500" />
        <div>
          <h3 className="font-semibold text-gray-800">Takwim Akademik</h3>
          <p className="text-sm">Jadual dan tarikh penting akan dipaparkan di sini.</p>
        </div>
      </div>
    </Card>
  </PageLayout>
);

export default Takwim;
