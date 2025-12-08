# QA checklist — Profile / KYC / 2FA / Loans (mobile-first)

Quick steps for manual device QA (iOS / Android) to validate keyboard/viewport and functional flows.

1) Preparation
   - Confirm latest build is deployed to a test environment or run `npm --workspace=client run dev` locally.
   - On device: open in browser or use TestFlight / internal build channel for a packaged app.

2) Profile / Tab placement
   - Visit `/profile`.
   - Tabs must appear above the profile content (Profil / KYC / Sécurité).
   - Tap each tab and verify content switches immediately and URL hash updates accordingly.

3) KYC flow
   - With no uploaded docs: ensure each file chooser works and uploads succeed.
   - Upload small image / PDF and confirm it shows in Document History.
   - Test rejection flow if available (server-side test data) and ensure rejection reason is visible.

4) 2FA flow
   - Visit `/profile#profile-2fa` or `/securite/2fa` redirect → ensure QR and secret are visible.
   - Enter a code and click 'Activer 2FA' — confirm success message.
   - Try to disable and confirm success behaviour and messages.

5) Loans
   - With KYC in SUBMITTED state: ensure loan request UI is blocked and message asks to complete KYC.
   - With KYC APPROVED: ensure loan request form shows and you can submit a request.

6) Mobile viewport & keyboard (high priority)
   - On iOS: open in Safari / WebView, scroll in page and focus text input near bottom — make sure the input is visible (not hidden behind keyboard) and layout doesn't break.
   - On Android: same procedure using Chrome; also test the address bar hide/restore behaviour.
   - Confirm the dynamic `--vh` helper behaves correctly when address bar shrinks and on orientation changes.
   - Ensure that the fixed bottom navigation never overlaps action buttons; verify safe-area padding with and without notch / home indicator devices.

7) Edge cases
   - Simulate flaky network (slow/offline) and confirm informative UI (toasts/errors) appears for uploads and loan submission.
   - Try deep-links (`/profile#profile-kyc` and `/profile#profile-2fa`) direct from external links.

8) Smoke tests
   - Sign-in/out flows, visit important routes (`/loans`, `/transactions`, `/profile`) and ensure no uncaught errors in console.

If any issues are found, note the device name, OS and browser version, steps to reproduce, and include a screenshot or a short repro video.
