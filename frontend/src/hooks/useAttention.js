import { useQuery } from "@tanstack/react-query";
import { getAttentionEvents } from "../services/events";

export function useAttention() {
  return useQuery({
    queryKey: ["attention"],
    queryFn: getAttentionEvents,
  });
}