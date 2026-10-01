"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { loadMeetings, saveMeetings } from "@/modules/communication/meetings/lib/storage";
import {
  MeetingFormSchema,
  type Meeting,
  type MeetingFormValues,
  type MeetingType,
} from "@/modules/communication/meetings/schemas";
import { useMe } from "@/modules/users-management/auth/queries";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PageHeader } from "@/shared/components/layout/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/cn";

const MEETING_TYPES: MeetingType[] = [
  "Internal",
  "Customer",
  "Supplier",
  "Sales",
  "Management",
];

const TYPE_VARIANT: Record<MeetingType, "default" | "secondary" | "destructive" | "outline"> = {
  Internal: "secondary",
  Customer: "default",
  Supplier: "outline",
  Sales: "default",
  Management: "destructive",
};

function defaultForm(): MeetingFormValues {
  const today = new Date();
  const date = today.toISOString().slice(0, 10);
  return {
    title: "",
    date,
    startTime: "10:00",
    endTime: "11:00",
    type: "Internal",
    participants: [],
    agenda: "",
  };
}

export function MeetingsScreen() {
  const { data: me } = useMe();
  const [meetings, setMeetings] = useState<Meeting[]>(() => loadMeetings());
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<MeetingFormValues>(defaultForm);

  const upcoming = useMemo(
    () => meetings.filter((meeting) => meeting.status === "Upcoming"),
    [meetings],
  );
  const past = useMemo(
    () => meetings.filter((meeting) => meeting.status !== "Upcoming"),
    [meetings],
  );

  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const todayKey = new Date().toISOString().slice(0, 10);

  function persist(next: Meeting[]) {
    setMeetings(next);
    saveMeetings(next);
  }

  function meetingsForDay(day: number): Meeting[] {
    const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return meetings.filter((meeting) => meeting.date === dateStr && meeting.status === "Upcoming");
  }

  function openCreate() {
    setForm(defaultForm());
    setDialogOpen(true);
  }

  function createMeeting() {
    const parsed = MeetingFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please fill in all required fields");
      return;
    }
    const next: Meeting = {
      ...parsed.data,
      id: `MTG-${String(meetings.length + 1).padStart(3, "0")}`,
      organizer: me?.name ?? "You",
      status: "Upcoming",
    };
    persist([...meetings, next]);
    setDialogOpen(false);
    toast.success("Meeting scheduled");
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Meetings"
        subtitle="Local meetings stored on this device only — not synced to the server yet."
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Button>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">All Meetings</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3 pt-4">
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <Calendar className="text-muted-foreground h-10 w-10" />
                <div>
                  <p className="font-medium">No upcoming meetings</p>
                  <p className="text-muted-foreground text-sm">Schedule a meeting to get started.</p>
                </div>
                <Button onClick={openCreate}>New Meeting</Button>
              </CardContent>
            </Card>
          ) : (
            upcoming.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} onCancel={() => {
                persist(
                  meetings.map((row) =>
                    row.id === meeting.id ? { ...row, status: "Cancelled" } : row,
                  ),
                );
                toast.success("Meeting cancelled");
              }} />
            ))
          )}
        </TabsContent>

        <TabsContent value="calendar" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {calendarDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCalendarDate(
                        (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                      )
                    }
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCalendarDate(
                        (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                      )
                    }
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
                  const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayMeetings = meetingsForDay(day);
                  const isToday = dateStr === todayKey;
                  return (
                    <div
                      key={day}
                      className={cn(
                        "min-h-20 rounded-lg border p-1",
                        isToday ? "border-primary bg-primary/5" : "border-border",
                      )}
                    >
                      <p className={cn("mb-1 text-xs font-medium", isToday && "text-primary")}>
                        {day}
                      </p>
                      {dayMeetings.slice(0, 2).map((meeting) => (
                        <div
                          key={meeting.id}
                          className="bg-primary/10 text-primary mb-0.5 truncate rounded px-1 py-0.5 text-[10px]"
                        >
                          {meeting.startTime} {meeting.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 ? (
                        <p className="text-muted-foreground text-[10px]">+{dayMeetings.length - 2} more</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Title", "Organizer", "Date", "Time", "Type", "Status"].map((heading) => (
                      <th key={heading} className="text-muted-foreground px-3 py-2 text-left text-xs font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meetings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-muted-foreground px-3 py-8 text-center">
                        No meetings scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    meetings.map((meeting) => (
                      <tr key={meeting.id} className="border-b">
                        <td className="px-3 py-2 font-medium">{meeting.title}</td>
                        <td className="px-3 py-2">{meeting.organizer}</td>
                        <td className="px-3 py-2">{meeting.date}</td>
                        <td className="text-muted-foreground px-3 py-2 text-xs">
                          {meeting.startTime}–{meeting.endTime}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={TYPE_VARIANT[meeting.type]}>{meeting.type}</Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={meeting.status === "Cancelled" ? "destructive" : "secondary"}>
                            {meeting.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past" className="space-y-3 pt-4">
          {past.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                No past meetings yet.
              </CardContent>
            </Card>
          ) : (
            past.map((meeting) => <MeetingCard key={meeting.id} meeting={meeting} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Title</Label>
              <Input
                id="meeting-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="meeting-date">Date</Label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value as MeetingType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEETING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="meeting-start">Start</Label>
                <Input
                  id="meeting-start"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-end">End</Label>
                <Input
                  id="meeting-end"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createMeeting}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MeetingCard({
  meeting,
  onCancel,
}: {
  meeting: Meeting;
  onCancel?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-4">
        <div className="bg-primary/10 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl">
          <span className="text-primary text-[10px] font-semibold">
            {new Date(`${meeting.date}T12:00:00`).toLocaleDateString(undefined, { month: "short" })}
          </span>
          <span className="text-primary text-base font-bold">
            {new Date(`${meeting.date}T12:00:00`).getDate()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{meeting.title}</p>
              <p className="text-muted-foreground text-xs">
                {meeting.startTime} – {meeting.endTime} · {meeting.organizer}
              </p>
            </div>
            <Badge variant={TYPE_VARIANT[meeting.type]}>{meeting.type}</Badge>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={meeting.status === "Cancelled" ? "destructive" : "secondary"}>
              {meeting.status}
            </Badge>
            {onCancel && meeting.status === "Upcoming" ? (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
