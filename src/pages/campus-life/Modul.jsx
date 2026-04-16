import React from 'react';
import PageLayout from '../../components/layout/PageLayout';
import Card from '../../components/ui/Card';
import { BookOpen } from 'lucide-react';

const Modul = () => (
  <PageLayout title="Modul">
    <Card className="p-6">
      <div className="flex items-center gap-3 text-gray-600">
        <BookOpen className="w-12 h-12 text-emerald-500" />
        <div>
          <h3 className="font-semibold text-gray-800">Modul Pengajian</h3>
          <p className="text-sm">Modul dan bahan pengajian akan dipaparkan di sini.</p>
        </div>
      </div>
    </Card>
  </PageLayout>
);

export default Modul;
