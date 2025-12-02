import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'failed' | 'seen';
  createdAt: string;
  sentAt?: string;
  user: {
    email: string;
    fullName: string;
  };
}

export function NotificationsPage() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<Notification[]>('/notifications');
      return response.data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500">Изпратено</Badge>;
      case 'seen':
        return <Badge className="bg-blue-500">Видяно</Badge>;
      case 'queued':
        return <Badge className="bg-yellow-500">Чакащо</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Грешка</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div>Зареждане...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">История на нотификациите</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Всички изпратени съобщения</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Потребител</TableHead>
                <TableHead>Тема</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Изпратено на</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications?.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    {format(new Date(notification.createdAt), 'dd MMM yyyy HH:mm', { locale: bg })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{notification.user?.fullName}</span>
                      <span className="text-xs text-muted-foreground">{notification.user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{notification.subject}</TableCell>
                  <TableCell>{getStatusBadge(notification.status)}</TableCell>
                  <TableCell>
                    {notification.sentAt
                      ? format(new Date(notification.sentAt), 'dd MMM HH:mm', { locale: bg })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {notifications?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Няма намерени нотификации
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
