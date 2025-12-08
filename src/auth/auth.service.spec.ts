import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Logger } from '../common/logger/logger.service'
import { TokenBlacklistService } from './token-blacklist.service'
import { ActivityLogService } from './activity-log.service'
import * as speakeasy from 'speakeasy'
import * as qrcode from 'qrcode'

// Mock dependencies
jest.mock('speakeasy')
jest.mock('qrcode')

describe('AuthService - 2FA Flow', () => {
  let authService: AuthService
  let usersService: UsersService
  let jwtService: JwtService
  let configService: ConfigService
  let loggerService: Logger
  let tokenBlacklistService: TokenBlacklistService
  let activityLogService: ActivityLogService

  const mockUserId = 'user-123'
  const mockEmail = 'test@example.com'
  const mockSecret = 'JBSWY3DPEBLW64TMMQQ='

  beforeEach(async () => {
    jest.clearAllMocks()
    // Create mock implementations
    usersService = {
      findById: jest.fn(),
      getTwoFactorSecret: jest.fn(),
      getTempTwoFactorSecret: jest.fn(),
      setTempTwoFactorSecret: jest.fn(),
      enableTwoFactor: jest.fn(),
      clearTempTwoFactorSecret: jest.fn(),
      isTwoFactorEnabled: jest.fn(),
    } as any

    jwtService = {
      sign: jest.fn(),
    } as any

    configService = {
      get: jest.fn(),
    } as any

    loggerService = {
      log: jest.fn(),
    } as any

    tokenBlacklistService = {
      blacklistToken: jest.fn(),
    } as any

    activityLogService = {
      log: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: Logger, useValue: loggerService },
        { provide: TokenBlacklistService, useValue: tokenBlacklistService },
        { provide: ActivityLogService, useValue: activityLogService },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
  })

  describe('setupTwoFactor', () => {
    it('should generate a secret and persist it as temp secret', async () => {
      const mockSecretObj = {
        base32: mockSecret,
        otpauth_url: `otpauth://totp/Bolter%20(${mockEmail})?secret=${mockSecret}&issuer=Bolter%20Banking`,
      }

      const mockQrCodeUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

      jest.spyOn(speakeasy, 'generateSecret').mockReturnValue(mockSecretObj as any)
      jest.spyOn(qrcode, 'toDataURL').mockResolvedValue(mockQrCodeUrl)

      jest.spyOn(usersService, 'findById').mockResolvedValue({
        id: mockUserId,
        email: mockEmail,
      })

      jest.spyOn(usersService, 'setTempTwoFactorSecret').mockResolvedValue(undefined)

      const result = await authService.setupTwoFactor(mockUserId)

      expect(result.secret).toBe(mockSecret)
      expect(result.qrCodeUrl).toBe(mockQrCodeUrl)
      expect(usersService.setTempTwoFactorSecret).toHaveBeenCalledWith(mockUserId, mockSecret)
    })
  })

  describe('enableTwoFactor', () => {
    it('should enable 2FA if valid token is provided', async () => {
      const validToken = '123456'

      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(null)
      jest.spyOn(usersService, 'getTempTwoFactorSecret').mockResolvedValue(mockSecret)
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true)
      jest.spyOn(usersService, 'enableTwoFactor').mockResolvedValue(undefined)
      jest.spyOn(usersService, 'clearTempTwoFactorSecret').mockResolvedValue(undefined)
      jest.spyOn(activityLogService, 'log').mockResolvedValue(undefined)

      const result = await authService.enableTwoFactor(mockUserId, validToken)

      expect(result.success).toBe(true)
      expect(usersService.getTempTwoFactorSecret).toHaveBeenCalledWith(mockUserId)
      expect(speakeasy.totp.verify).toHaveBeenCalledWith({
        secret: mockSecret,
        encoding: 'base32',
        token: validToken,
        window: 2,
      })
      expect(usersService.enableTwoFactor).toHaveBeenCalledWith(mockUserId, mockSecret)
      expect(usersService.clearTempTwoFactorSecret).toHaveBeenCalledWith(mockUserId)
    })

    it('should reject if 2FA is already enabled', async () => {
      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(mockSecret)

      await expect(authService.enableTwoFactor(mockUserId, '123456')).rejects.toThrow(
        '2FA is already enabled'
      )

      expect(usersService.getTempTwoFactorSecret).not.toHaveBeenCalled()
    })

    it('should reject if no pending setup found', async () => {
      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(null)
      jest.spyOn(usersService, 'getTempTwoFactorSecret').mockResolvedValue(null)

      await expect(authService.enableTwoFactor(mockUserId, '123456')).rejects.toThrow(
        'No pending 2FA setup found'
      )
    })

    it('should reject invalid token', async () => {
      const invalidToken = '000000'

      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(null)
      jest.spyOn(usersService, 'getTempTwoFactorSecret').mockResolvedValue(mockSecret)
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false)

      await expect(authService.enableTwoFactor(mockUserId, invalidToken)).rejects.toThrow(
        'Invalid 2FA token'
      )

      expect(usersService.enableTwoFactor).not.toHaveBeenCalled()
      expect(usersService.clearTempTwoFactorSecret).not.toHaveBeenCalled()
    })
  })

  describe('verifyTwoFactor', () => {
    it('should verify valid token', async () => {
      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(mockSecret)
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true)

      const result = await authService.verifyTwoFactor(mockUserId, '123456')

      expect(result).toBe(true)
    })

    it('should reject invalid token', async () => {
      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(mockSecret)
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false)

      const result = await authService.verifyTwoFactor(mockUserId, '000000')

      expect(result).toBe(false)
    })

    it('should log failed attempts when token invalid', async () => {
      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(mockSecret)
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false)
      const spy = jest.spyOn(activityLogService, 'log')

      const result = await authService.verifyTwoFactor(mockUserId, '000000')

      expect(result).toBe(false)
      expect(spy).toHaveBeenCalledWith(mockUserId, '2FA_VERIFY_FAILED', expect.any(String))
    })

    it('should return true if 2FA not enabled', async () => {
      jest.spyOn(usersService, 'getTwoFactorSecret').mockResolvedValue(null)

      const result = await authService.verifyTwoFactor(mockUserId, '123456')

      expect(result).toBe(true)
      expect(speakeasy.totp.verify).not.toHaveBeenCalled()
    })
  })
})
