# Frontend 2FA Integration Guide

## Overview

The frontend 2FA implementation is located in:

- `apps/client/src/pages/TwoFactorSettings.tsx` - UI for setup/enable/disable
- `apps/client/src/services/authService.ts` - 2FA API calls

## User Flow

### 1. Setup 2FA

```
User navigates to Settings > Security > 2FA
  ↓
Clicks "Setup 2FA"
  ↓
API call: POST /auth/2fa/setup
  ↓
Receives: { secret, qrCodeUrl }
  ↓
Component displays QR code and secret
  ↓
User scans QR with authenticator app
  ↓
```

### 2. Enable 2FA

```
User enters TOTP code from authenticator
  ↓
Clicks "Enable"
  ↓
API call: POST /auth/2fa/enable { token }
  ↓
Server validates against persisted temp secret
  ↓
Success: 2FA is now enabled
  ↓
```

### 3. Login with 2FA

```
User enters email + password
  ↓
API call: POST /auth/login { email, password }
  ↓
Server responds with requiresTwoFactor: true
  ↓
UI prompts for TOTP code
  ↓
User enters code from authenticator
  ↓
API call: POST /auth/login { email, password, twoFactorToken }
  ↓
Success: User is logged in
  ↓
```

## Component Structure

### TwoFactorSettings.tsx

Key states:

```typescript
const [setupInProgress, setSetupInProgress] = useState(false);
const [showSecret, setShowSecret] = useState(false);
const [secret, setSecret] = useState<string | null>(null);
const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
const [verificationCode, setVerificationCode] = useState("");
const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
```

Key methods:

```typescript
// Initiate setup
const handleSetupTwoFactor = async () => {
  const response = await authService.setupTwoFactor();
  setSecret(response.secret);
  setQrCodeUrl(response.qrCodeUrl);
  setSetupInProgress(true);
};

// Enable 2FA with code
const handleEnableTwoFactor = async () => {
  await authService.enableTwoFactor(verificationCode);
  setTwoFactorEnabled(true);
  setSetupInProgress(false);
};

// Disable 2FA with code
const handleDisableTwoFactor = async () => {
  await authService.disableTwoFactor(verificationCode);
  setTwoFactorEnabled(false);
};
```

### AuthService

```typescript
// Setup phase
export const setupTwoFactor = async () => {
  const res = await api.post("/auth/2fa/setup");
  return res.data;
};

// Enable phase
export const enableTwoFactor = async (token: string) => {
  const res = await api.post("/auth/2fa/enable", { token });
  return res.data;
};

// Disable phase
export const disableTwoFactor = async (token: string) => {
  const res = await api.post("/auth/2fa/disable", { token });
  return res.data;
};

// Login with 2FA
export const loginWith2FA = async (
  email: string,
  password: string,
  twoFactorToken: string
) => {
  const res = await api.post("/auth/login", {
    email,
    password,
    twoFactorToken,
  });
  return res.data;
};
```

## UI Components

### QR Code Display

```tsx
{
  qrCodeUrl && (
    <div className="text-center">
      <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto" />
      <p className="text-sm text-gray-600 mt-4">
        Scan this QR code with your authenticator app
      </p>
    </div>
  );
}
```

### Secret Display (Backup)

```tsx
{
  secret && (
    <div className="bg-gray-100 p-4 rounded">
      <p className="text-sm font-mono break-all">{secret}</p>
      <p className="text-xs text-gray-600 mt-2">
        Can't scan? Enter this secret manually
      </p>
    </div>
  );
}
```

### Code Input

```tsx
<input
  type="text"
  placeholder="Enter 6-digit code"
  value={verificationCode}
  onChange={(e) =>
    setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
  }
  maxLength="6"
  className="text-center text-2xl tracking-widest"
/>
```

## Error Handling

```typescript
try {
  await authService.enableTwoFactor(verificationCode);
  // Success
} catch (error) {
  if (error.response?.status === 400) {
    // Invalid code, show retry prompt
    const message = error.response.data.message;
    if (message.includes("Invalid 2FA token")) {
      setErrorMsg("Incorrect code. Please try again.");
    } else if (message.includes("No pending 2FA setup")) {
      setErrorMsg("Setup not found. Please start setup again.");
    }
  }
}
```

## State Management

Use React Query for server state:

```typescript
const setupMutation = useMutation({
  mutationFn: authService.setupTwoFactor,
  onSuccess: (data) => {
    setSecret(data.secret);
    setQrCodeUrl(data.qrCodeUrl);
  },
});

const enableMutation = useMutation({
  mutationFn: authService.enableTwoFactor,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["user-profile"] });
  },
});
```

## Mobile Considerations

1. **QR Code Display**: Use full width on mobile with appropriate padding
2. **Code Input**: Large touch targets (minimum 44x44px)
3. **Copy Button**: Add button to copy secret to clipboard
4. **Authenticator App**: Assume user will switch to authenticator app for code
5. **Viewport**: Ensure 2FA input doesn't scroll off-screen

## Testing

### Unit Tests

```typescript
test('should display QR code after setup', async () => {
  render(<TwoFactorSettings />)

  await userEvent.click(screen.getByText('Setup 2FA'))

  await waitFor(() => {
    expect(screen.getByAltText('2FA QR Code')).toBeInTheDocument()
  })
})

test('should show error on invalid code', async () => {
  // Mock API to return error
  // Enter invalid code
  // Check error message appears
})
```

### E2E Tests

```typescript
test("full 2FA setup and login", async ({ page }) => {
  // Register → Setup 2FA → Enable 2FA → Logout → Login with 2FA
});
```

See `apps/client/e2e/tests/two-factor.spec.ts` for complete tests.

## Common Issues

### "No pending 2FA setup found"

- User clicked Enable without going through Setup first
- Session expired or was refreshed
- **Solution**: Go back to Setup 2FA and scan the QR code again

### "Invalid 2FA token"

- Code is incorrect
- Code has expired (TOTP codes expire every 30 seconds)
- Clock on user's device is out of sync with server
- **Solution**: Wait for new code to generate, ensure device time is correct

### QR Code not displaying

- Setup API call failed
- Browser console shows CORS error
- **Solution**: Check network tab, verify API is running, check CORS headers

## Authenticator Apps Supported

- Google Authenticator
- Microsoft Authenticator
- Authy
- FreeOTP
- 1Password
- Bitwarden

Any app supporting standard TOTP (RFC 6238) should work.

## Production Checklist

- [ ] 2FA is optional (not forced)
- [ ] Backup codes are generated or secret is displayed for manual entry
- [ ] Error messages are user-friendly
- [ ] Audit logs capture 2FA enable/disable events
- [ ] Rate limiting on verification attempts
- [ ] HTTPS enforced (required for secure 2FA)
- [ ] Testing across multiple authenticator apps
- [ ] Mobile responsiveness validated
- [ ] Accessibility (ARIA labels, keyboard nav)
- [ ] Documentation updated
