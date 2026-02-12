"use client";

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Idea } from "@/lib/types";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const allIdeas = useLiveQuery(() => db.ideas.toArray(), []);

  const ideasByDay = useMemo(() => {
    const map = new Map<string, Idea[]>();
    if (allIdeas) {
      allIdeas.forEach(idea => {
        const dateKey = format(new Date(idea.createdAt), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)?.push(idea);
      });
    }
    return map;
  }, [allIdeas]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // 前月の日付を追加してカレンダーの最初の週を埋める
    const firstDayOfMonth = days[0].getDay(); // 0 for Sunday, 1 for Monday
    const daysBefore = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); // If Sunday, show 6 days before. If Monday, show 0.
    for (let i = 0; i < daysBefore; i++) {
        days.unshift(new Date(days[0].setDate(days[0].getDate() - 1)));
    }

    // 次月の日付を追加してカレンダーの最後の週を埋める
    const lastDayOfMonth = days[days.length - 1].getDay();
    const daysAfter = (lastDayOfMonth === 0 ? 0 : 7 - lastDayOfMonth); // If Sunday, show 0 days after.
    for (let i = 0; i < daysAfter; i++) {
        days.push(new Date(days[days.length - 1].setDate(days[days.length - 1].getDate() + 1)));
    }

    return days;
  }, [currentMonth]);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['月', '火', '水', '木', '金', '土', '日']; // 月曜始まり

  const ideasForSelectedDate = selectedDate 
    ? ideasByDay.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">カレンダー</h1>

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
          <ChevronLeft />
        </Button>
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'yyyy年M月', { locale: ja })}
        </h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight />
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 text-center text-sm text-muted-foreground">
        {weekDays.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const hasIdeas = ideasByDay.has(dayKey);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <div
              key={index}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 rounded-lg",
                isSameMonth(day, currentMonth) ? "text-foreground" : "text-muted-foreground",
                isSelected && "bg-primary text-primary-foreground",
                isToday && !isSelected && "border border-primary", // Today's date
                "h-12 w-full aspect-square", // Make days square
                "cursor-pointer"
              )}
              onClick={() => setSelectedDate(day)}
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              {hasIdeas && (
                <div className={cn(
                  "absolute bottom-1 w-1 h-1 rounded-full",
                  isSelected ? "bg-primary-foreground" : "bg-primary"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Ideas for Selected Date */}
      {selectedDate && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{format(selectedDate, 'yyyy年M月d日 (eee)', { locale: ja })} の気づき</CardTitle>
              <CardDescription>{ideasForSelectedDate.length} 件</CardDescription>
            </div>
            <Link href={`/new?date=${format(selectedDate, 'yyyy-MM-dd')}`} passHref>
              <Button size="sm" className="flex items-center gap-1">
                <Plus size={16} /> 追加
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {ideasForSelectedDate.length > 0 ? (
              ideasForSelectedDate.map(idea => (
                <Link href={`/idea/${idea.id}`} key={idea.id} className="block text-sm hover:underline">
                  {idea.text}
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">この日はまだ気づきがありません。</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}