import { Calendar, MapPinned, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { ProximitySettingsDrawer } from '../../components/attendance/ProximitySettingsDrawer';
import { AttendanceSessions } from '../../components/attendance/AttendanceSessions';
import { OccasionsServices } from '../../components/attendance/OccasionsServices';
import { ReportsInsights } from '../../components/attendance/ReportsInsights';
import { Button } from '../../components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';

export function Attendance() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [isProximityDrawerOpen, setIsProximityDrawerOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-800/50 px-6 py-4 rounded-lg border">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">
            Attendance Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Attendance tracking and management
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsProximityDrawerOpen(true)}
          aria-label="Configure attendance proximity settings"
        >
          <MapPinned className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3 border border-primary/20 h-12">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance Sessions</span>
          </TabsTrigger>

          <TabsTrigger value="occasions" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Occasions & Services</span>
          </TabsTrigger>

          <TabsTrigger value="reports" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="occasions" className="space-y-6">
            <OccasionsServices />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <AttendanceSessions />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsInsights />
          </TabsContent>
        </div>
      </Tabs>

      <ProximitySettingsDrawer
        open={isProximityDrawerOpen}
        onOpenChange={setIsProximityDrawerOpen}
      />
    </div>
  );
}
