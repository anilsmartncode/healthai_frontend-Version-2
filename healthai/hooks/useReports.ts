import { useEffect, useState } from 'react';
import { reportsService } from '@/services/reports';
import type { Report } from '@/types';

export function useReports() {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    reportsService.list().then((r) => {
      setData(r);
      setLoading(false);
    });
  }, []);
  return { data, loading };
}
