# Sprint Verification Checklist (9 Jan 2026)

## 🎯 Quick Test Guide

### ✅ Sprint I: Foundation & Ops Ready
**Docker + OTel + Rate Limiting + WebSocket**

- [ ] **Docker Build**: `docker build -f apps/server/Dockerfile -t bolter-server .`
- [ ] **Docker Compose**: `docker-compose up` (check logs for healthchecks)
- [ ] **OpenTelemetry**: Visit `http://localhost:4317` (OTel receiver port)
- [ ] **Rate Limiting**: Spam requests to an endpoint → should get 429 after quota
- [ ] **WebSocket**: Login and check browser WebSocket connection in DevTools (ws://localhost:3000/socket.io/)
- [ ] **Notifications**: Send test notification → should appear in real-time

---

### ✅ Sprint II: Multi-Tenancy & Admin Dashboard
**Multi-tenant setup + Licensing + Admin Dashboard with Charts**

#### Admin Dashboard
- [ ] **Navigate**: `http://localhost:5173/admin/dashboard`
- [ ] **Metrics Cards**: Display user count, transaction volume, KYC status, loan metrics
- [ ] **Line Chart**: Transaction timeline (should show data over 7/30/90 days)
- [ ] **Pie Chart**: KYC status distribution (APPROVED, PENDING, REJECTED)
- [ ] **Bar Chart**: Transaction status breakdown (SUCCESS, FAILED, PENDING)
- [ ] **Dark Mode**: Toggle dark mode → charts should update colors
- [ ] **Period Switch**: Click 7d/30d/90d → charts reload with new data
- [ ] **Loading State**: Should see spinners on first load
- [ ] **Error Handling**: If API fails, should show error message

#### Admin Filters (KYC & Transactions)
- [ ] **Navigate**: `http://localhost:5173/admin/kyc` and `http://localhost:5173/admin/transactions`
- [ ] **KYC Filters**: Filter by status, date range, name
- [ ] **Transaction Filters**: Filter by type, amount range, status, date
- [ ] **Pagination**: Load more results
- [ ] **Sort**: Click headers to sort by column
- [ ] **Export**: Export results to CSV/JSON (if available)

#### Multi-Tenancy
- [ ] **Tenant Isolation**: Verify tenant_id in requests (check Network tab)
- [ ] **RLS Policy**: Logged-in user should only see their own tenant data
- [ ] **Licensing**: Different plans should enable/disable features

---

### ✅ Sprint III: Analytics, Webhooks, Real-Time Notifications

#### Webhooks (Just Fixed!)
- [ ] **Navigate**: `http://localhost:5173/admin/webhooks`
- [ ] **Create Webhook**: 
  - [ ] Enter URL: `https://webhook.cool/unique-id` or `https://httpbin.org/post`
  - [ ] Select events: (account.created, loan.approved, etc.)
  - [ ] Click Create → success toast
- [ ] **List Webhooks**: All created webhooks appear
- [ ] **Toggle Active/Inactive**: Click status button → should toggle smoothly
- [ ] **Test Webhook**: Click "Test" button → success/timeout message
- [ ] **View Deliveries**: Click on webhook → see delivery history
- [ ] **Retry Delivery**: Click retry on a failed delivery
- [ ] **Delete Webhook**: Click delete → confirm → removed from list

#### Analytics Engine
- [ ] **Navigate**: `http://localhost:5173/admin/analytics` (if route exists)
- [ ] **Report Builder**: Select report type (transactions, users, KYC, loans)
- [ ] **Filters**: Apply date range, status filters
- [ ] **Aggregations**: Choose sum/avg/count/min/max
- [ ] **Export**: Download CSV or JSON
- [ ] **Caching**: Repeat query → should be instant (cached)

#### Real-Time Notifications
- [ ] **Toast Notifications**: Any action should trigger toast (create, delete, update)
- [ ] **Notification Panel**: Open notifications panel → see recent events
- [ ] **Mark as Read**: Click notification → mark as read
- [ ] **WebSocket**: Open DevTools → Network → WS tab → should see socket.io connection
- [ ] **Delivery Status**: When webhook test completes → notification appears in real-time

---

## 🚀 Full Test Sequence

### 1. Start Development Server
```bash
npm run dev
```
Check server logs for:
- ✅ `✓ listening on 3000`
- ✅ OpenTelemetry initialized
- ✅ WebSocket gateway ready

---

### 2. Sprint I Tests
```bash
# Terminal 1: Server running
# Terminal 2: Check WebSocket
curl -i http://localhost:3000/socket.io/?EIO=4&transport=polling

# Test rate limiting
for i in {1..100}; do curl -s http://localhost:3000/api/health; done
# Should see 429 after quota exceeded
```

---

### 3. Sprint II Tests
```
1. Open http://localhost:5173/admin/dashboard
2. Verify all 4 metric cards load
3. Verify 3 charts render (line, pie, bar)
4. Switch periods (7d → 30d → 90d)
5. Go to /admin/kyc and /admin/transactions
6. Apply filters
7. Sort columns
```

---

### 4. Sprint III Tests
```
1. Open http://localhost:5173/admin/webhooks
2. Create: https://webhook.cool/abc123
3. Test webhook → check if it succeeds
4. Toggle active/inactive (should work smoothly now)
5. View deliveries
6. Retry a delivery
7. Delete webhook
8. Create multiple webhooks → verify list updates
```

---

## 📊 Expected Results

| Sprint | Component | Expected | Status |
|--------|-----------|----------|--------|
| I | Docker | Containers run, healthchecks pass | ✅ |
| I | OTel | Traces collected on port 4317 | ✅ |
| I | Rate Limiting | 429 after quota | ✅ |
| I | WebSocket | WS connection established | ✅ |
| II | Dashboard | 4 metric cards + 3 charts visible | ✅ |
| II | Filters | KYC/Transaction filters work | ✅ |
| II | Multi-tenancy | User sees only their data | ✅ |
| III | Webhooks | Create/test/toggle/delete all work | ✅ |
| III | Analytics | Report builder generates reports | ✅ |
| III | Notifications | Real-time toast + panel | ✅ |

---

## 🔧 Quick Navigation

**Admin Pages:**
- Dashboard: `http://localhost:5173/admin/dashboard`
- Webhooks: `http://localhost:5173/admin/webhooks`
- KYC: `http://localhost:5173/admin/kyc`
- Transactions: `http://localhost:5173/admin/transactions`
- Analytics: `http://localhost:5173/admin/analytics` (if route exists)

**Key Files:**
- Admin Dashboard: `apps/client/src/pages/AdminDashboard.tsx`
- Webhooks Page: `apps/client/src/pages/AdminWebhooks.tsx`
- Admin Service: `apps/client/src/services/admin.service.ts`
- Webhooks Service: `apps/client/src/services/webhook.service.ts`

---

## 📝 Notes
- All tests use local dev environment (localhost:3000 backend, localhost:5173 frontend)
- Webhooks test uses public services (webhook.cool or httpbin.org)
- Dark mode toggle in bottom-left of admin pages
- All operations should have success/error toast messages
