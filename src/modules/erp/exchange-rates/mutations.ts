"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { exchangeRatesApi } from "@/modules/erp/exchange-rates/api";
import { exchangeRateKeys } from "@/modules/erp/exchange-rates/queries";

export function useUpsertExchangeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exchangeRatesApi.upsert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: exchangeRateKeys.all });
    },
  });
}
