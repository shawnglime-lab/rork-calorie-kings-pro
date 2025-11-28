import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect } from "react";

export interface Fast {
  id: string;
  startTime: number;
  endTime: number | null;
  status: "running" | "completed";
}

export interface LastFast {
  endTime: number;
  duration: number;
}

interface FastingData {
  currentFast: Fast | null;
  history: Fast[];
  lastFast: LastFast | null;
}

const DEFAULT_DATA: FastingData = {
  currentFast: null,
  history: [],
  lastFast: null,
};

export const [FastingContext, useFasting] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const fastingQuery = useQuery({
    queryKey: ["fasting"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem("fasting");
        if (!stored || stored === "undefined" || stored === "null") return DEFAULT_DATA;
        const parsed = JSON.parse(stored);
        if (typeof parsed !== "object" || parsed === null) return DEFAULT_DATA;
        return parsed;
      } catch (error) {
        console.error("Error loading fasting data:", error);
        await AsyncStorage.removeItem("fasting");
        return DEFAULT_DATA;
      }
    },
  });

  const { mutate: mutateUpdateFasting } = useMutation({
    mutationFn: async (data: FastingData) => {
      await AsyncStorage.setItem("fasting", JSON.stringify(data));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fasting"] });
    },
  });

  const fastingData = fastingQuery.data || DEFAULT_DATA;

  useEffect(() => {
    if (fastingData.currentFast && fastingData.currentFast.status === "running") {
      const updateElapsed = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - fastingData.currentFast!.startTime) / 1000);
        setElapsedSeconds(elapsed);
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(0);
    }
  }, [fastingData.currentFast]);

  const startFast = useCallback(() => {
    const newFast: Fast = {
      id: Math.random().toString(36).substring(7),
      startTime: Date.now(),
      endTime: null,
      status: "running",
    };

    const newData: FastingData = {
      currentFast: newFast,
      history: fastingData.history,
      lastFast: fastingData.lastFast,
    };

    mutateUpdateFasting(newData);
  }, [fastingData.history, fastingData.lastFast, mutateUpdateFasting]);

  const endFast = useCallback(() => {
    if (!fastingData.currentFast) return;

    const endTime = Date.now();
    const duration = endTime - fastingData.currentFast.startTime;

    const endedFast: Fast = {
      ...fastingData.currentFast,
      endTime,
      status: "completed",
    };

    const newData: FastingData = {
      currentFast: null,
      history: [endedFast, ...fastingData.history],
      lastFast: {
        endTime,
        duration,
      },
    };

    mutateUpdateFasting(newData);
  }, [fastingData, mutateUpdateFasting]);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      hours,
      minutes,
      seconds: secs,
      formatted: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
    };
  }, []);

  const getCompletedFastDuration = useCallback((fast: Fast) => {
    if (fast.status !== "completed" || !fast.endTime) return null;
    const durationMs = fast.endTime - fast.startTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, []);

  const deleteFast = useCallback((fastId: string) => {
    const newData: FastingData = {
      ...fastingData,
      history: fastingData.history.filter((fast: Fast) => fast.id !== fastId),
    };
    mutateUpdateFasting(newData);
  }, [fastingData, mutateUpdateFasting]);

  const clearLastFast = useCallback(() => {
    const newData: FastingData = {
      ...fastingData,
      lastFast: null,
    };
    mutateUpdateFasting(newData);
  }, [fastingData, mutateUpdateFasting]);

  const isLastFastFromToday = useCallback(() => {
    if (!fastingData.lastFast) return false;
    const lastFastDate = new Date(fastingData.lastFast.endTime);
    const today = new Date();
    return (
      lastFastDate.getDate() === today.getDate() &&
      lastFastDate.getMonth() === today.getMonth() &&
      lastFastDate.getFullYear() === today.getFullYear()
    );
  }, [fastingData.lastFast]);

  const clearLastFastIfNeeded = useCallback(() => {
    if (fastingData.lastFast && !isLastFastFromToday()) {
      const newData: FastingData = {
        ...fastingData,
        lastFast: null,
      };
      mutateUpdateFasting(newData);
    }
  }, [fastingData, isLastFastFromToday, mutateUpdateFasting]);

  useEffect(() => {
    clearLastFastIfNeeded();
  }, [clearLastFastIfNeeded]);

  return useMemo(
    () => ({
      currentFast: fastingData.currentFast,
      history: fastingData.history,
      lastFast: fastingData.lastFast,
      elapsedSeconds,
      startFast,
      endFast,
      formatDuration,
      getCompletedFastDuration,
      deleteFast,
      clearLastFast,
      isLastFastFromToday,
      isLoading: fastingQuery.isLoading,
    }),
    [
      fastingData.currentFast,
      fastingData.history,
      fastingData.lastFast,
      elapsedSeconds,
      startFast,
      endFast,
      formatDuration,
      getCompletedFastDuration,
      deleteFast,
      clearLastFast,
      isLastFastFromToday,
      fastingQuery.isLoading,
    ]
  );
});
