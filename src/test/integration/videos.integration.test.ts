import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { listAllVideos, uploadDoctorVideo, deleteVideo } from '@/lib/supabase/videos';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('Learning Videos Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAllVideos', () => {
    it('should fetch all videos successfully', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          title: 'Test Video 1',
          video_url: 'https://example.com/video1.mp4',
          description: 'Test description',
          category: 'Manual',
          views: 100,
          uploaded_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVideos, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      const videos = await listAllVideos();

      expect(videos).toEqual(mockVideos);
      expect(supabase.from).toHaveBeenCalledWith('learning_videos');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should handle errors when fetching videos', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockChain);

      await expect(listAllVideos()).rejects.toThrow();
    });
  });

  describe('uploadDoctorVideo', () => {
    it('should upload video successfully', async () => {
      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const mockUser = { id: 'user-123' };
      const mockUploadedVideo = {
        id: 'video-1',
        title: 'Test Video',
        video_url: 'https://example.com/video.mp4',
        description: 'Test description',
        category: 'Manual',
        views: 0,
        uploaded_by: 'user-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockStorageChain = {
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/video.mp4' },
        }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorageChain);

      const mockDbChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUploadedVideo,
          error: null,
        }),
      };

      (supabase.from as any).mockReturnValue(mockDbChain);

      const result = await uploadDoctorVideo(
        'test-folder',
        mockFile,
        'Test Video',
        'Test description',
        'Manual'
      );

      expect(result).toEqual(mockUploadedVideo);
      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.storage.from).toHaveBeenCalledWith('doctor-videos');
      expect(supabase.from).toHaveBeenCalledWith('learning_videos');
    });

    it('should throw error when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });

      await expect(
        uploadDoctorVideo('test-folder', mockFile, 'Test Video')
      ).rejects.toThrow('Supabase Auth session not found');
    });
  });

  describe('deleteVideo', () => {
    it('should delete video successfully', async () => {
      const videoId = 'video-1';
      const videoUrl = 'https://example.com/storage/v1/object/public/doctor-videos/test-folder/video.mp4';

      const mockDbChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.from as any).mockReturnValue(mockDbChain);

      const mockStorageChain = {
        remove: vi.fn().mockResolvedValue({ error: null }),
      };

      (supabase.storage.from as any).mockReturnValue(mockStorageChain);

      await deleteVideo(videoId, videoUrl);

      expect(supabase.from).toHaveBeenCalledWith('learning_videos');
      expect(mockDbChain.delete).toHaveBeenCalled();
      expect(mockDbChain.eq).toHaveBeenCalledWith('id', videoId);
    });

    it('should handle database errors when deleting', async () => {
      const mockDbChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      };

      (supabase.from as any).mockReturnValue(mockDbChain);

      await expect(
        deleteVideo('video-1', 'https://example.com/video.mp4')
      ).rejects.toThrow();
    });
  });
});
