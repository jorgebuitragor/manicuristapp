import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PolishBrand } from '@/types/database.types';

export const POLISH_BRANDS_KEY = ['polish-brands'] as const;

export function usePolishBrands() {
  return useQuery({
    queryKey: POLISH_BRANDS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nail_polish_brands')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as PolishBrand[];
    },
  });
}

export function useCreatePolishBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const trimmed = name.trim();
      const { data: existing, error: selectError } = await supabase
        .from('nail_polish_brands')
        .select('*')
        .ilike('name', trimmed)
        .maybeSingle();
      if (selectError) throw selectError;
      if (existing) return existing as PolishBrand;
      const { data, error } = await supabase
        .from('nail_polish_brands')
        .insert({ name: trimmed })
        .select('*')
        .single();
      if (error) throw error;
      return data as PolishBrand;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POLISH_BRANDS_KEY }),
  });
}

export function useUpdatePolishBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('nail_polish_brands')
        .update({ name: name.trim() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PolishBrand;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POLISH_BRANDS_KEY }),
  });
}

export function useDeletePolishBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nail_polish_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: POLISH_BRANDS_KEY }),
  });
}
