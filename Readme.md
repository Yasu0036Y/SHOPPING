# ShopEase - Complete Shopping Website with Real Payment System

A full-featured e-commerce web application with cart management, delivery tracking, location services, and a **real-time payment system** with customizable account details.

## Features

- 🛍️ **Product Catalog** - Browse and add items to cart
- 🛒 **Shopping Cart** - Update quantities, remove items, persistent storage
- 📍 **Location Services** - Three ways to set delivery address:
  - Auto-detect GPS location
  - Manual address entry
  - Interactive map selection
- 💳 **Real Payment System** - Complete payment processing with:
  - Card payments with Luhn algorithm validation
  - UPI payments with QR code generation
  - Cash on Delivery option
  - Transaction history tracking
  - **Easily customizable merchant details**
- 📦 **Real-time Order Updates** - Simulated order status tracking
- 💾 **Local Storage** - Cart persistence across page refreshes

## Customizing Payment Details

### Update Your Merchant Information

Open `payment.js` and modify the `PAYMENT_CONFIG` object:

```javascript
const PAYMENT_CONFIG = {
    // Update with your actual bank account details
    bankAccount: {
        accountName: "Your Business Name",
        accountNumber: "YOUR_ACCOUNT_NUMBER",
        ifscCode: "YOUR_IFSC_CODE",
        bankName: "Your Bank Name",
        upiId: "your-business@bankname",
    },
    
    // Update UPI app configurations
    upiApps: [
        { name: "Google Pay", id: "your-business@okhdfcbank" },
        { name: "PhonePe", id: "your-business@okhdfcbank" },
        // Add more as needed
    ],
    
    // Update gateway settings
    gateway: {
        name: "Your Business Name",
        merchantId: "YOUR_MERCHANT_ID",
        apiKey: "YOUR_API_KEY"
    }
};