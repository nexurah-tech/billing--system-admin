# Super Admin REST API Guide

All server operations request JSON payloads and return JSON payloads. Endpoints are secured via the `admin_session` cookie containing a signed JWT token with role `'super-admin'`.

---

## 1. Session Authentication

### Login Administrative User (`POST /api/auth`)
Verifies administrative credentials and stores session cookie.
- **Request Body**:
  ```json
  {
    "username": "nexurahadmin",
    "password": "admin-password-string"
  }
  ```
- **Response `200 OK`**: Sets cookie header `admin_session` and returns session status:
  ```json
  {
    "success": true,
    "message": "Logged in successfully"
  }
  ```

---

## 2. Retailer Shop Management

### Fetch Shops & Activity Telemetry (`GET /api/shops`)
Queries all registered stores. Computes activity states and active session metadata.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "shops": [
        {
          "_id": "6a1a68f74e5ac2273be9ab15",
          "name": "Arjun Store",
          "email": "arjun@example.com",
          "phone": "9876543210",
          "subscriptionStatus": "active",
          "subscriptionExpiresAt": "2026-07-07T12:00:00.000Z",
          "lastActiveAt": "2026-06-07T22:30:00.000Z",
          "activeStatus": "Online Now"
        }
      ],
      "qrCodeUrl": "https://example.com/qr.png",
      "whatsappNumber": "+919600950190"
    }
  }
  ```

### Execute Administrative Actions (`POST /api/shops`)
Dispatches tasks to extend subscriptions or update payment portals.

#### Action A: Record Manual Payment
- **Request Body**:
  ```json
  {
    "action": "record-payment",
    "shopId": "6a1a68f74e5ac2273be9ab15",
    "amount": 199,
    "paymentMethod": "upi",
    "referenceId": "TXN987654321",
    "notes": "Verified via WhatsApp screenshot"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Payment recorded and subscription extended by 30 days.",
    "data": {
      "shop": {
        "_id": "...",
        "subscriptionStatus": "active",
        "subscriptionExpiresAt": "2026-07-07T12:00:00.000Z"
      }
    }
  }
  ```

#### Action B: Update Global UPI QR Code
- **Request Body**:
  ```json
  {
    "action": "update-qr",
    "qrCodeUrl": "https://res.cloudinary.com/.../new-qr.png"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Global payment QR code updated successfully."
  }
  ```

---

## 3. Financial Renewal Audit Logs

### Fetch Audit Logs (`GET /api/payments`)
Returns chronological list of all manually entered subscription extension logs.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6a219b26e085b1c92eec3bb9",
        "shop": { "_id": "...", "name": "Arjun Store" },
        "amount": 199,
        "paymentMethod": "upi",
        "referenceId": "TXN987654321",
        "paymentDate": "2026-06-07T22:30:00.000Z"
      }
    ]
  }
  ```

---

## 4. Cloudinary Upload Proxy

### Upload QR Image Asset (`POST /api/upload`)
Receives image binary and uploads it securely to Cloudinary storage.
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body**: Form data payload containing `file` key binary.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v157097/qr.png"
    }
  }
  ```
