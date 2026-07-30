import { NotificationProvider, UnifiedNotification } from '@/types/notifications';
import { getFamilyNotifications } from '@/services/familyApi';
import { getTodaysReminders } from '@/services/Medicinesapi';
import { reportsApi } from '@/services/reportsApi';

export const FamilyNotificationProvider: NotificationProvider = {
  id: 'family',
  fetchNotifications: async () => {
    try {
      const data = await getFamilyNotifications();
      return data.notifications.map((n): UnifiedNotification => {
        let route = '/family';
        if (n.type === 'invite_pending') route = '/family/invitations';

        return {
          id: `family_${n.notif_id}`,
          category: 'family',
          priority: n.type === 'health_alert' ? 'HIGH' : 'LOW',
          status: n.read ? 'read' : 'unread',
          title: n.title,
          message: '',
          timestamp: n.created_at,
          action: {
            type: 'navigate',
            route: route as any,
          },
          payload: { originalId: n.notif_id, type: n.type }
        };
      });
    } catch (e) {
      console.error('[FamilyProvider] Error fetching:', e);
      return [];
    }
  }
};

export const MedicineNotificationProvider: NotificationProvider = {
  id: 'medicine',
  fetchNotifications: async () => {
    try {
      const reminders = await getTodaysReminders();
      
      const upcoming = reminders.filter(r => r.status === 'upcoming');
      
      return upcoming.map((r): UnifiedNotification => {
        // Auto expire if the reminder time is older than 3 hours ago
        // For simplicity, we just set expiry to end of today, but could be specific
        const now = new Date();
        const expiresAt = new Date(now.setHours(23, 59, 59, 999)).toISOString();

        return {
          id: `med_${r.id}_${r.time}`,
          category: 'medicine',
          priority: 'MEDIUM',
          status: 'unread', // Medicines API doesn't have "read" for upcoming, so default unread
          title: `Medicine Reminder`,
          message: `It's time to take ${r.medicineName}`,
          timestamp: new Date().toISOString(), // Mock timestamp for when it was generated
          expiresAt,
          action: {
            type: 'navigate',
            route: '/medicines/reminders' as any, // User preferred to route to list to Snooze/Take
          }
        };
      });
    } catch (e) {
      console.error('[MedicineProvider] Error fetching:', e);
      return [];
    }
  }
};

export const ReportNotificationProvider: NotificationProvider = {
  id: 'report',
  fetchNotifications: async () => {
    try {
      const reports = await reportsApi.list();
      const attentionReports = reports.filter((r: any) => r.status === 'attention');

      return attentionReports.map((r: any): UnifiedNotification => {
        return {
          id: `report_${r.id}`,
          category: 'report',
          priority: 'HIGH',
          status: 'unread', // Default to unread for now; AI analysis will mark read/archived
          title: 'Health Report Alert',
          message: `${r.abnormalCount} metrics require attention in your recent ${r.reportType} report.`,
          timestamp: r.date,
          action: {
            type: 'navigate',
            route: '/analysis' as any,
            params: {
              reportId: r.id,
              patientName: r.patientName,
              hospitalName: r.labName || '',
              summary: JSON.stringify({ ai_summary: `Attention required for ${r.reportType}`, health_score: r.healthScore, condition_severity: 'Fair' }),
              values: JSON.stringify([]), 
              detectedMedicines: JSON.stringify([]),
              narrative: ''
            }
          }
        };
      });
    } catch (e) {
      console.error('[ReportProvider] Error fetching:', e);
      return [];
    }
  }
};
