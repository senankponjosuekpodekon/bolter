import { AvatarService } from './avatar.service';
import { SupabaseService } from '../supabase/supabase.service';

const mockStorage = {
  from: jest.fn().mockReturnThis(),
  upload: jest.fn(),
  list: jest.fn(),
  remove: jest.fn(),
  createSignedUrl: jest.fn(),
};

const mockSupabaseService = {
  getClient: jest.fn(() => ({ storage: mockStorage })),
} as unknown as SupabaseService;

function makeService() {
  return new AvatarService(mockSupabaseService);
}

jest.mock('sharp', () => {
  const fn = jest.fn((buffer: Buffer) => ({
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(buffer),
  }));
  return fn;
});

describe('AvatarService (simple)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects unsupported mime', async () => {
    const svc = makeService();
    await expect(
      svc.upload('user-1', {
        mimetype: 'application/pdf',
        size: 10,
        buffer: Buffer.from('x'),
      } as unknown as { mimetype: string; size: number; buffer: Buffer })
    ).rejects.toThrow('Unsupported file type');
  });

  it('rejects oversized file', async () => {
    const svc = makeService();
    await expect(
      svc.upload('user-1', {
        mimetype: 'image/png',
        size: 3 * 1024 * 1024,
        buffer: Buffer.alloc(10),
      } as unknown as { mimetype: string; size: number; buffer: Buffer })
    ).rejects.toThrow('File too large');
  });

  it('uploads and returns signed url', async () => {
    const svc = makeService();
    mockStorage.upload.mockResolvedValue({ data: { path: 'user-1/avatar_123_standard.png' }, error: null });
    mockStorage.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed' }, error: null });

    const res = await svc.upload('user-1', {
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('binary'),
    } as unknown as { mimetype: string; size: number; buffer: Buffer });

    expect(mockStorage.upload).toHaveBeenCalled();
    expect(res.url).toBe('https://signed');
    expect(res.path).toContain('user-1/');
  });

  it('prefers standard size on get', async () => {
    const svc = makeService();
    mockStorage.list.mockResolvedValue({
      data: [
        { name: 'avatar_1_thumb.png' },
        { name: 'avatar_1_standard.png' },
      ],
      error: null,
    });
    mockStorage.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed-std' }, error: null });

    const url = await svc.get('user-1');
    expect(url).toBe('https://signed-std');
    expect(mockStorage.list).toHaveBeenCalled();
  });

  it('lists latest and returns signed url', async () => {
    const svc = makeService();
    mockStorage.list.mockResolvedValue({ data: [{ name: 'avatar_2.png' }, { name: 'avatar_1.png' }], error: null });
    mockStorage.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed2' }, error: null });

    const url = await svc.get('user-1');
    expect(url).toBe('https://signed2');
    expect(mockStorage.list).toHaveBeenCalledWith('user-1', expect.any(Object));
  });

  it('deletes all user avatars', async () => {
    const svc = makeService();
    mockStorage.list.mockResolvedValue({ data: [{ name: 'a.png' }, { name: 'b.png' }], error: null });
    mockStorage.remove.mockResolvedValue({ data: {}, error: null });

    await expect(svc.delete('user-9')).resolves.toBeUndefined();
    expect(mockStorage.remove).toHaveBeenCalledWith(['user-9/a.png', 'user-9/b.png']);
  });
});
