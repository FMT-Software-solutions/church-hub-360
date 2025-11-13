import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  Announcement,
  AnnouncementWithMeta,
  AnnouncementSlide,
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  CreateSlideInput,
  UpdateSlideInput,
} from '@/types/announcements';

export const announcementKeys = {
  all: ['announcements'] as const,
  lists: () => [...announcementKeys.all, 'list'] as const,
  list: (organizationId: string) => [...announcementKeys.lists(), organizationId] as const,
  details: () => [...announcementKeys.all, 'detail'] as const,
  detail: (id: string) => [...announcementKeys.details(), id] as const,
  slides: (id: string) => [...announcementKeys.detail(id), 'slides'] as const,
};

export function useAnnouncements() {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: announcementKeys.list(currentOrganization?.id || ''),
    queryFn: async (): Promise<AnnouncementWithMeta[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('announcements')
        .select(`*, profiles!announcements_created_by_fkey2(first_name,last_name), announcement_slides(count)`) // count via implicit relationship
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((a: any) => ({
        ...a,
        slides_count: Array.isArray(a.announcement_slides) ? a.announcement_slides.length : undefined,
        created_by_name:
          a.profiles?.first_name && a.profiles?.last_name
            ? `${a.profiles.first_name} ${a.profiles.last_name}`
            : null,
      }));
    },
    enabled: !!currentOrganization?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAnnouncement(id: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: announcementKeys.detail(id),
    queryFn: async (): Promise<AnnouncementWithMeta> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('announcements')
        .select(`*, profiles!announcements_created_by_fkey2(first_name,last_name)`) 
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .eq('is_deleted', false)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Announcement not found');
      return {
        ...data,
        created_by_name:
          (data as any).profiles?.first_name && (data as any).profiles?.last_name
            ? `${(data as any).profiles.first_name} ${(data as any).profiles.last_name}`
            : null,
      };
    },
    enabled: !!currentOrganization?.id && !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAnnouncementSlides(announcementId: string) {
  const { currentOrganization } = useOrganization();
  return useQuery({
    queryKey: announcementKeys.slides(announcementId),
    queryFn: async (): Promise<AnnouncementSlide[]> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('announcement_slides')
        .select('*')
        .eq('announcement_id', announcementId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && !!announcementId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput): Promise<Announcement> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      if (!user?.id) throw new Error('User authentication required');
      if (!input.title || input.title.length > 100) throw new Error('Title is required and must be <= 100 characters');
      if (!input.description || input.description.length > 255) throw new Error('Description is required and must be <= 255 characters');
      const payload = { ...input, organization_id: currentOrganization.id, created_by: user.id };
      const { data, error } = await supabase.from('announcements').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      toast.success('Announcement created');
    },
    onError: (e) => {
      console.error(e);
      toast.error('Failed to create announcement');
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateAnnouncementInput }): Promise<Announcement> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { data, error } = await supabase
        .from('announcements')
        .update({ ...updates, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: announcementKeys.detail(data.id) });
      toast.success('Announcement updated');
    },
    onError: () => toast.error('Failed to update announcement'),
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!currentOrganization?.id) throw new Error('Organization ID is required');
      const { error } = await supabase
        .from('announcements')
        .update({ is_deleted: true, last_updated_by: user?.id || null })
        .eq('id', id)
        .eq('organization_id', currentOrganization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
      toast.success('Announcement deleted');
    },
    onError: () => toast.error('Failed to delete announcement'),
  });
}

export function useCreateSlide() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CreateSlideInput): Promise<AnnouncementSlide> => {
      if (input.font_size != null && input.font_size < 24) throw new Error('Font size must be >= 24');
      if (!input.position || input.position < 1) throw new Error('Position must be >= 1');
      const payload = { ...input, created_by: user?.id || null };
      const { data, error } = await supabase.from('announcement_slides').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.slides(data.announcement_id) });
      toast.success('Slide added');
    },
    onError: () => toast.error('Failed to add slide'),
  });
}

export function useUpdateSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSlideInput }): Promise<AnnouncementSlide> => {
      if (updates.font_size != null && updates.font_size < 24) throw new Error('Font size must be >= 24');
      const { data, error } = await supabase
        .from('announcement_slides')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.slides(data.announcement_id) });
    },
    onError: () => toast.error('Failed to update slide'),
  });
}

export function useDeleteSlide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }): Promise<void> => {
      const { error } = await supabase.from('announcement_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all slides queries; or use context to pass announcement_id if available
      queryClient.invalidateQueries({ queryKey: announcementKeys.all });
      toast.success('Slide deleted');
    },
    onError: () => toast.error('Failed to delete slide'),
  });
}

export function useReorderSlides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ announcement_id, orderedIds }: { announcement_id: string; orderedIds: string[] }): Promise<void> => {
      // Batch update positions; Supabase doesn't support transactional batch here, but we proceed sequentially
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        const position = i + 1;
        const { error } = await supabase
          .from('announcement_slides')
          .update({ position })
          .eq('id', id)
          .eq('announcement_id', announcement_id);
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.slides(variables.announcement_id) });
      toast.success('Slides reordered');
    },
    onError: () => toast.error('Failed to reorder slides'),
  });
}
