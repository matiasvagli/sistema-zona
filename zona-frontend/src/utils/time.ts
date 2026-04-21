import dayjs from "dayjs";

export function calcProgress(tasks: { status: string }[]): number {
  if (!tasks?.length) return 0;
  return Math.round(
    (tasks.filter((t) => t.status === "completada").length / tasks.length) * 100
  );
}

export interface TimeLeft {
  text: string;
  urgent: boolean;
  overdue: boolean;
}

export function timeLeft(estimated: string): TimeLeft {
  const diff = dayjs(estimated).diff(dayjs(), "hour");
  if (diff < 0) return { text: `Venció hace ${Math.abs(diff)}h`, urgent: true,  overdue: true  };
  if (diff < 4)  return { text: `${diff}h restantes`,             urgent: true,  overdue: false };
  if (diff < 24) return { text: `${diff}h restantes`,             urgent: false, overdue: false };
  return { text: dayjs(estimated).format("DD/MM HH:mm"),          urgent: false, overdue: false };
}
