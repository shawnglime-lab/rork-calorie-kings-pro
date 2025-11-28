export function formatTime(time: string, use24Hour: boolean): string {
  const [hours, minutes] = time.split(":").map(Number);
  
  if (use24Hour) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

export function convert12To24(hours: number, period: "AM" | "PM"): number {
  if (period === "AM") {
    return hours === 12 ? 0 : hours;
  } else {
    return hours === 12 ? 12 : hours + 12;
  }
}

export function convert24To12(hours: number): { hours: number; period: "AM" | "PM" } {
  if (hours === 0) {
    return { hours: 12, period: "AM" };
  } else if (hours < 12) {
    return { hours, period: "AM" };
  } else if (hours === 12) {
    return { hours: 12, period: "PM" };
  } else {
    return { hours: hours - 12, period: "PM" };
  }
}
