# E-Commerce Product & Order Management System
### *API-Based Product, Inventory, and Order Management Platform*

A complete, full-stack, production-ready college API project with independent REST API modules, intelligent multi-warehouse inventory allocation, order lifecycle state management, safe digital payment simulation, in-app notifications, interactive REST API explorer, and a catalog-grounded Gemini AI shopping assistant.

---

## 1. Project Overview & Problem Statement
E-commerce enterprises struggle with managing products across distributed regional distribution centers. Inefficient stock routing leads to delivery delays, order failures, unnecessary order splitting, and inflated logistics overhead.

This project delivers:
- **Independent Business REST APIs**: Clean separation of Auth, Products, Warehouses, Inventory, Cart, Orders, Payments, Notifications, and Admin modules.
- **Intelligent Multi-Warehouse Routing Engine**: Evaluates available inventory across Mumbai (WH-01), Delhi (WH-02), and Bengaluru (WH-03) hubs. Prioritizes single-hub fulfillment to avoid unnecessary order splitting, while gracefully executing multi-hub split fulfillment when required.
- **Order Lifecycle Management**: End-to-end state machine (`PLACED` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED` or `CANCELLED`).
- **Safe Payment Simulation**: Realistic mock transactions for UPI, Card, and Cash on Delivery without storing sensitive card numbers or CVVs.
- **Interactive API Documentation & Tester**: Built-in Postman-style test bench with live execution, status code badges, millisecond latency measurements, and an 8-test automated verification suite.
- **AI Shopping Assistant**: Grounded in real store catalog data using Google Gemini with reliable heuristic fallback.

---

## 2. System Architecture
```
                                 [ Web Browser / Client ]
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      ▼                                           ▼
             Customer Storefront                           Admin Portal
         (Catalog, Cart, Orders, AI)              (KPIs, Stock Matrix, Statuses)
                      │                                           │
                      └─────────────────────┬─────────────────────┘
                                            │ HTTP / JSON (JWT Bearer)
                                            ▼
                                   [ Node.js + Express ]
                                 (Server & Vite Middleware)
                                            │
        ┌──────────────┬──────────────┬─────┴────────┬──────────────┬──────────────┐
        ▼              ▼              ▼              ▼              ▼              ▼
   Auth API     Product API    Warehouse API   Order API     Payment API    AI Assistant
   (/auth)       (/products)    (/warehouses)   (/orders)     (/payments)       (/ai)
        │              │              │              │              │              │
        └──────────────┴──────────────┴──────┬───────┴──────────────┴──────────────┘
                                             ▼
                              [ Multi-Warehouse Router Engine ]
                             - Single-warehouse prioritization
                             - Greedy split order allocation
                             - Invariant: available = quantity - reserved
                                             ▼
                             [ Persistent Storage Adapter ]
                               (data/ecommerce_db.json)
```

---

## 3. Technologies Used
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express.js 4, tsx
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`)
- **AI Integration**: Google GenAI SDK (`@google/genai`) with Gemini 2.5 Flash
- **Database Engine**: Persistent JSON Document Store with atomic temporary writes and auto-seeding

---

## 4. Folder Structure
```
├── data/
│   └── ecommerce_db.json        # Persistent database file
├── server/
│   ├── db/
│   │   ├── database.ts          # Storage engine & collection helpers
│   │   └── seedData.ts          # Seed data (users, products, inventory)
│   ├── middleware/
│   │   └── auth.ts              # JWT verification and RBAC guards
│   ├── routes/
│   │   ├── adminRoutes.ts       # Admin dashboard & stats
│   │   ├── aiRoutes.ts          # AI assistant endpoints
│   │   ├── authRoutes.ts        # Register, login, profile
│   │   ├── cartRoutes.ts        # Customer cart operations
│   │   ├── healthRoutes.ts      # Health check & test runner
│   │   ├── inventoryRoutes.ts   # Inventory & multi-hub allocation
│   │   ├── notificationRoutes.ts# Notification center
│   │   ├── orderRoutes.ts       # Order lifecycle & state changes
│   │   ├── paymentRoutes.ts     # Safe payment simulation
│   │   ├── productRoutes.ts     # Product CRUD & search
│   │   └── warehouseRoutes.ts   # Warehouse management
│   └── services/
│       ├── aiService.ts         # Catalog-grounded Gemini AI assistant
│       └── warehouseService.ts  # Intelligent warehouse routing algorithm
├── shared/
│   └── types.ts                 # Shared domain TypeScript interfaces
├── src/
│   ├── components/
│   │   ├── AdminSidebar.tsx
│   │   ├── AiShoppingModal.tsx
│   │   ├── DemoSwitcher.tsx     # One-click reviewer account switcher
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   └── StatusBadge.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── ToastContext.tsx
│   ├── pages/
│   │   ├── AdminCustomersPage.tsx
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminInventoryPage.tsx
│   │   ├── AdminOrdersPage.tsx
│   │   ├── AdminProductsPage.tsx
│   │   ├── AdminWarehousesPage.tsx
│   │   ├── ApiDocsPage.tsx      # Postman-style REST API tester
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MyOrdersPage.tsx
│   │   ├── OrderDetailPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── RegisterPage.tsx
│   ├── services/
│   │   └── api.ts               # Typed client & raw request tester
│   ├── App.tsx
│   └── main.tsx
├── server.ts                    # Server entry point
├── package.json
└── README.md
```

---

## 5. Database Schema & Entities
- **User**: `id`, `name`, `email`, `password` (bcrypt), `role` (`customer` | `admin`), `phone`, `address`, `createdAt`
- **Warehouse**: `warehouseId`, `warehouseName`, `location`, `status` (`ACTIVE` | `INACTIVE`), `capacity`
- **Product**: `productId`, `productName`, `description`, `category`, `price`, `image`, `stockQuantity`, `warehouseId`, `status`, `createdAt`, `updatedAt`
- **Inventory**: `inventoryId`, `productId`, `warehouseId`, `quantity`, `reservedQuantity`, `availableQuantity` (`quantity - reservedQuantity`)
- **CartItem**: `id`, `customerId`, `productId`, `quantity`, `addedAt`
- **Order**: `orderId`, `customerId`, `customerName`, `customerEmail`, `orderItems`, `totalAmount`, `shippingAddress`, `orderStatus`, `paymentStatus`, `paymentMethod`, `fulfillmentType`, `fulfillmentDetails`, `createdAt`, `updatedAt`
- **Payment**: `paymentId`, `orderId`, `amount`, `paymentMethod`, `paymentStatus`, `transactionId`, `paymentDate`, `customerEmail`
- **Notification**: `notificationId`, `customerId`, `orderId`, `message`, `type`, `isRead`, `createdAt`

---

## 6. Complete REST API Endpoints
| HTTP Method | Endpoint | Access Level | Description |
|:---|:---|:---|:---|
| `GET` | `/api/health` | Public | System health and database status |
| `GET` | `/api/system/test-suite` | Public | Automated backend test runner |
| `POST` | `/api/auth/register` | Public | Create new customer/admin user |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT |
| `GET` | `/api/auth/profile` | Auth | Get current authenticated user profile |
| `GET` | `/api/products` | Public | List products with search, category, and price filters |
| `GET` | `/api/products/:id` | Public | Product details with multi-warehouse inventory breakdown |
| `POST` | `/api/products` | Admin | Create product with warehouse stock |
| `PUT` | `/api/products/:id` | Admin | Update product details |
| `DELETE` | `/api/products/:id` | Admin | Delete product and related inventory |
| `GET` | `/api/warehouses` | Public | List regional warehouse hubs |
| `POST` | `/api/warehouses` | Admin | Register new warehouse |
| `GET` | `/api/inventory` | Public | List all multi-hub inventory records |
| `POST` | `/api/inventory/plan` | Public | Simulate and preview multi-hub stock allocation |
| `GET` | `/api/inventory/low-stock`| Public | Fetch SKUs with inventory &le; 5 units |
| `PUT` | `/api/inventory/:id` | Admin | Adjust warehouse stock quantity |
| `GET` | `/api/cart` | Auth | Get authenticated user cart items |
| `POST` | `/api/cart` | Auth | Add item to cart |
| `PUT` | `/api/cart/:id` | Auth | Update cart item quantity |
| `DELETE` | `/api/cart/:id` | Auth | Remove item from cart |
| `DELETE` | `/api/cart` | Auth | Clear entire cart |
| `POST` | `/api/orders` | Auth | Place order with multi-warehouse allocation |
| `GET` | `/api/orders` | Auth | Get user orders (admin gets all) |
| `GET` | `/api/orders/:id` | Auth | Get order details and payment history |
| `PUT` | `/api/orders/:id/status`| Admin | Advance order status (`SHIPPED`, `DELIVERED`, etc.) |
| `PUT` | `/api/orders/:id/cancel`| Auth | Cancel order and release reserved stock |
| `POST` | `/api/payments/process` | Auth | Simulate digital transaction |
| `GET` | `/api/notifications` | Auth | Fetch user notifications |
| `PUT` | `/api/notifications/:id/read` | Auth | Mark single notification as read |
| `GET` | `/api/admin/dashboard` | Admin | Aggregated stats, KPIs, and charts |
| `POST` | `/api/admin/reset-database` | Admin | Reset database to initial seed data |
| `POST` | `/api/ai/assistant` | Public | Gemini shopping assistant with live catalog grounding |

---

## 7. Demo Credentials
Use the top reviewer bar to switch accounts in one click, or use these credentials:

| Role | Name | Email | Password |
|:---|:---|:---|:---|
| **Admin** | Admin Manager | `admin@ecommerce.com` | `admin123` |
| **Customer 1** | John Doe | `john@example.com` | `customer123` |
| **Customer 2** | Sarah Connor | `sarah@example.com` | `customer123` |
| **Customer 3** | Rajesh Kumar | `raj@example.com` | `customer123` |

---

## 8. Environment Variables
Defined in `.env.example`:
```env
PORT=3000
JWT_SECRET="ecommerce-super-secret-jwt-key-2026-production"
GEMINI_API_KEY="MY_GEMINI_API_KEY"
DATABASE_URL=""
APP_URL="MY_APP_URL"
```

---

## 9. How to Run Locally
```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

---

## 10. How to Build & Deploy to Google Cloud Run
```bash
# Build frontend
npm run build

# Start production server
npm start
```
The application is pre-configured for Google Cloud Run:
- Server binds to `0.0.0.0` on `process.env.PORT || 3000`
- Serves static assets from `dist/` in production
- Health endpoint `/api/health` available for Cloud Run readiness checks

---

## 11. Complete 20-Step College Demo Flow
1. **Login**: Log in as John Doe (`john@example.com`).
2. **Catalog**: Open **Products** page.
3. **Search**: Search for `"Keyboard"`.
4. **Product Details**: Open "Mechanical Tactile Keyboard RGB" (PROD-104).
5. **Stock Inspection**: Note warehouse stock (WH-01: 3 units, WH-02: 4 units, WH-03: 0 units).
6. **Cart**: Set quantity to `5` and click **Add to Cart**.
7. **Allocation Preview**: Open **Cart**; note the allocation preview showing the order will be split across WH-02 (4) and WH-01 (1).
8. **Checkout**: Click **Proceed to Checkout**.
9. **Simulate Payment**: Select **UPI** and click **Confirm & Place Order**.
10. **Order Created**: The engine reserves stock and confirms the transaction.
11. **Receipt**: View the **Order Details** screen with the multi-warehouse dispatch breakdown.
12. **Notification**: Notice the notification bell badge with order confirmation message.
13. **Switch to Admin**: Click **Admin** in the top reviewer bar.
14. **Dashboard**: Open **Admin Hub**; inspect KPI cards and charts.
15. **Orders**: Open **Orders & Fulfillment**; locate John Doe's order.
16. **State Machine**: Advance status from `CONFIRMED` to `SHIPPED`, then `DELIVERED`.
17. **Switch back to Customer**: Click **Customer (John)** in the top bar.
18. **Status Updated**: Open **My Orders** to verify updated `DELIVERED` status.
19. **API Explorer**: Open **API Explorer** and click **Run Automated API Test Suite**.
20. **Verification**: Observe 8/8 automated test suites passing.
