import { Test, TestingModule } from '@nestjs/testing'
import { UsersService } from './users.service'
import { SupabaseService } from '../../apps/server/src/supabase/supabase.service'
import { ActivityLogService } from '../auth/activity-log.service'

describe('UsersService - Security', () => {
  let usersService: UsersService
  let supabaseService: SupabaseService
  let activityLogService: ActivityLogService

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'CLIENT',
    password_hash: 'bcrypt-hash-xxx',
    refresh_token: 'refresh-token-xxx',
    two_factor_secret: 'JBSWY3DPEBLW64TMMQ==',
    two_factor_temp_secret: 'TEMP-SECRET-XXX',
  }

  const mockAdminClient = {
    from: jest.fn(),
  }

  beforeEach(async () => {
    supabaseService = {
      getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
    } as any

    activityLogService = {
      log: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: ActivityLogService, useValue: activityLogService },
      ],
    }).compile()

    usersService = module.get<UsersService>(UsersService)
  })

  describe('mapUser - Secret Sanitization', () => {
    it('should not include secrets by default', () => {
      const result = usersService['mapUser'](mockUser)

      expect(result.password).toBeUndefined()
      expect(result.refreshToken).toBeUndefined()
      expect(result.twoFactorSecret).toBeUndefined()
      expect(result.id).toBe(mockUser.id)
      expect(result.email).toBe(mockUser.email)
    })

    it('should include secrets when includeSecrets flag is true', () => {
      const result = usersService['mapUser'](mockUser, { includeSecrets: true })

      expect(result.password).toBe(mockUser.password_hash)
      expect(result.refreshToken).toBe(mockUser.refresh_token)
      expect(result.twoFactorSecret).toBe(mockUser.two_factor_secret)
      expect(result.id).toBe(mockUser.id)
    })

    it('should not expose temp 2FA secret in public responses', () => {
      const result = usersService['mapUser'](mockUser, { includeSecrets: false })

      expect(result.two_factor_temp_secret).toBeUndefined()
    })

    it('should not expose temp 2FA secret even with includeSecrets flag', () => {
      // Note: implementation choice - temp secrets should never be exposed
      const result = usersService['mapUser'](mockUser, { includeSecrets: true })

      // temp secret should not be included (implementation detail)
      expect((result as any).twoFactorTempSecret).toBeUndefined()
    })
  })

  describe('Temp 2FA Secret Helpers', () => {
    it('should set temp 2FA secret', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({}),
      })
      mockAdminClient.from.mockReturnValue({
        update: updateMock,
      })

      await usersService.setTempTwoFactorSecret('user-123', 'temp-secret')

      expect(mockAdminClient.from).toHaveBeenCalledWith('users')
      expect(updateMock).toHaveBeenCalledWith({ two_factor_temp_secret: 'temp-secret' })
    })

    it('should get temp 2FA secret', async () => {
      // Mock the admin client chain: from(...).select(...).eq(...).single()
      mockAdminClient.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: { two_factor_temp_secret: 'temp-secret' }, error: null }),
          }),
        }),
      })

      const result = await usersService.getTempTwoFactorSecret('user-123')

      expect(result).toBe('temp-secret')
    })

    it('should clear temp 2FA secret', async () => {
      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({}),
      })
      mockAdminClient.from.mockReturnValue({
        update: updateMock,
      })

      await usersService.clearTempTwoFactorSecret('user-123')

      expect(updateMock).toHaveBeenCalledWith({ two_factor_temp_secret: null })
    })
  })
})
