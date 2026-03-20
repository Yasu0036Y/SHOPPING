/**
 * Payment System Module
 * Real-time payment simulation with customizable account details
 * You can change the fake account details to your own later
 */

// ============================================
// CONFIGURATION - EASILY CUSTOMIZE THESE DETAILS
// ============================================

const PAYMENT_CONFIG = {
    // Fake Bank Account (Change these to your details later)
    bankAccount: {
        accountName: "ShopEase Merchant Services",
        accountNumber: "123456789012",
        ifscCode: "SBIN0001234",
        bankName: "State Bank of India",
        upiId: "shopease@okhdfcbank",
        qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=shopease@okhdfcbank&pn=ShopEase&am="
    },
    
    // Demo Card Details (Test cards - replace with your actual merchant details)
    testCards: {
        success: {
            number: "4111 1111 1111 1111",
            expiry: "12/25",
            cvv: "123",
            name: "TEST USER"
        },
        // Alternative test cards that also work
        alternate: {
            number: "5555 5555 5555 4444",
            expiry: "08/26",
            cvv: "789",
            name: "DEMO CUSTOMER"
        }
    },
    
    // UPI Apps Configuration (You can add your actual UPI IDs here)
    upiApps: [
        { name: "Google Pay", id: "shopease@okhdfcbank", prefix: "gpay" },
        { name: "PhonePe", id: "shopease@okhdfcbank", prefix: "phonepe" },
        { name: "Paytm", id: "shopease@paytm", prefix: "paytm" },
        { name: "Amazon Pay", id: "shopease@amazonpay", prefix: "amazon" }
    ],
    
    // Payment Gateway Settings
    gateway: {
        name: "ShopEase Secure Payments",
        merchantId: "SHOP123456",
        apiKey: "test_live_key_12345" // In production, this would be your actual key
    }
};

// ============================================
// PAYMENT PROCESSING CLASS
// ============================================

class PaymentProcessor {
    constructor(config) {
        this.config = config;
        this.paymentHistory = [];
    }
    
    // Process Card Payment
    async processCardPayment(cardDetails, amount) {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                // Validate card details
                const validation = this.validateCard(cardDetails);
                if (!validation.valid) {
                    reject({ success: false, message: validation.message });
                    return;
                }
                
                // Simulate bank authorization
                const authResult = this.authorizePayment(amount, 'card');
                
                if (authResult.success) {
                    const transaction = {
                        id: this.generateTransactionId(),
                        amount: amount,
                        method: 'card',
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        cardLast4: cardDetails.number.slice(-4),
                        reference: authResult.reference
                    };
                    this.paymentHistory.push(transaction);
                    resolve({ success: true, transaction, message: 'Payment successful!' });
                } else {
                    reject({ success: false, message: authResult.message });
                }
            }, 1500);
        });
    }
    
    // Process UPI Payment
    async processUPIPayment(upiId, amount) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Check if UPI ID is valid (in our demo system)
                const isValidUPI = upiId.includes('@') || this.config.upiApps.some(app => app.id === upiId);
                
                if (!isValidUPI && upiId !== this.config.bankAccount.upiId) {
                    reject({ success: false, message: 'Invalid UPI ID. Please use @shopease or valid UPI address' });
                    return;
                }
                
                const authResult = this.authorizePayment(amount, 'upi');
                
                if (authResult.success) {
                    const transaction = {
                        id: this.generateTransactionId(),
                        amount: amount,
                        method: 'upi',
                        status: 'completed',
                        timestamp: new Date().toISOString(),
                        upiId: upiId,
                        reference: authResult.reference
                    };
                    this.paymentHistory.push(transaction);
                    resolve({ success: true, transaction, message: 'UPI payment successful!' });
                } else {
                    reject({ success: false, message: authResult.message });
                }
            }, 1200);
        });
    }
    
    // Process Cash on Delivery
    processCOD(amount) {
        const transaction = {
            id: this.generateTransactionId(),
            amount: amount,
            method: 'cod',
            status: 'pending',
            timestamp: new Date().toISOString(),
            reference: `COD-${Date.now()}`
        };
        this.paymentHistory.push(transaction);
        return {
            success: true,
            transaction,
            message: 'Order confirmed! Pay ₹' + amount.toFixed(2) + ' at delivery.'
        };
    }
    
    // Validate Card Details
    validateCard(cardDetails) {
        // Remove spaces from card number
        const cardNumber = cardDetails.number.replace(/\s/g, '');
        
        // Check if card number is 16 digits
        if (!/^\d{16}$/.test(cardNumber)) {
            return { valid: false, message: 'Invalid card number. Must be 16 digits.' };
        }
        
        // Luhn algorithm check (basic validation)
        if (!this.luhnCheck(cardNumber)) {
            return { valid: false, message: 'Invalid card number. Please check and try again.' };
        }
        
        // Check expiry date
        if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
            return { valid: false, message: 'Invalid expiry date. Use MM/YY format.' };
        }
        
        const [month, year] = cardDetails.expiry.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month));
        const now = new Date();
        
        if (expiryDate <= now) {
            return { valid: false, message: 'Card has expired.' };
        }
        
        // Check CVV
        if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
            return { valid: false, message: 'Invalid CVV. Must be 3 or 4 digits.' };
        }
        
        return { valid: true, message: 'Card validated' };
    }
    
    // Luhn Algorithm for card validation
    luhnCheck(cardNumber) {
        let sum = 0;
        let isEven = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.charAt(i));
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return (sum % 10) === 0;
    }
    
    // Simulate payment authorization
    authorizePayment(amount, method) {
        // Simulate success rate (95% success for demo)
        const isSuccess = Math.random() < 0.95;
        
        if (isSuccess) {
            return {
                success: true,
                reference: `AUTH-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                message: 'Payment authorized'
            };
        } else {
            return {
                success: false,
                message: 'Payment declined by bank. Please try another card or method.'
            };
        }
    }
    
    // Generate unique transaction ID
    generateTransactionId() {
        return `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }
    
    // Get payment history
    getPaymentHistory() {
        return this.paymentHistory;
    }
    
    // Generate QR Code URL for UPI
    generateUPIQRCode(amount, note = "ShopEase Payment") {
        const upiId = this.config.bankAccount.upiId;
        const name = encodeURIComponent(this.config.bankAccount.accountName);
        const noteEncoded = encodeURIComponent(note);
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${noteEncoded}&cu=INR`;
    }
    
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    }
}

// ============================================
// PAYMENT UI MANAGER
// ============================================

class PaymentUIManager {
    constructor(paymentProcessor) {
        this.processor = paymentProcessor;
        this.currentAmount = 0;
        this.selectedMethod = 'card';
    }
    
    // Show payment modal
    showPaymentModal(amount, onSuccess) {
        this.currentAmount = amount;
        this.onSuccessCallback = onSuccess;
        
        // Create modal if it doesn't exist
        if (!document.getElementById('paymentModal')) {
            this.createPaymentModal();
        }
        
        const modal = document.getElementById('paymentModal');
        const amountDisplay = document.getElementById('paymentAmount');
        if (amountDisplay) {
            amountDisplay.textContent = this.processor.formatCurrency(amount);
        }
        
        modal.classList.remove('hidden');
        this.showMethod('card');
    }
    
    // Create payment modal HTML
    createPaymentModal() {
        const modalHTML = `
            <div id="paymentModal" class="payment-modal hidden">
                <div class="payment-modal-content">
                    <div class="payment-modal-header">
                        <h3><i class="fas fa-credit-card"></i> Secure Payment</h3>
                        <button class="close-modal" onclick="closePaymentModal()">&times;</button>
                    </div>
                    <div class="payment-amount-display">
                        Amount to Pay: <span id="paymentAmount">₹0.00</span>
                    </div>
                    
                    <div class="payment-methods-tabs">
                        <button class="payment-tab active" data-method="card">💳 Card</button>
                        <button class="payment-tab" data-method="upi">📱 UPI</button>
                        <button class="payment-tab" data-method="cod">💵 Cash on Delivery</button>
                    </div>
                    
                    <div id="cardPaymentForm" class="payment-form active">
                        <div class="form-group">
                            <label>Card Number</label>
                            <input type="text" id="cardNumber" placeholder="4111 1111 1111 1111" maxlength="19">
                            <small class="demo-hint">Demo: 4111 1111 1111 1111</small>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Expiry (MM/YY)</label>
                                <input type="text" id="cardExpiry" placeholder="12/25">
                            </div>
                            <div class="form-group">
                                <label>CVV</label>
                                <input type="password" id="cardCvv" placeholder="123" maxlength="4">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Cardholder Name</label>
                            <input type="text" id="cardName" placeholder="TEST USER">
                        </div>
                        <button class="pay-now-btn" onclick="processPayment()">
                            <i class="fas fa-lock"></i> Pay Now
                        </button>
                    </div>
                    
                    <div id="upiPaymentForm" class="payment-form hidden">
                        <div class="form-group">
                            <label>UPI ID / VPA</label>
                            <input type="text" id="upiId" placeholder="yourname@okhdfcbank">
                            <small class="demo-hint">Demo: shopease@okhdfcbank</small>
                        </div>
                        <div id="upiQrCode" class="upi-qr-container hidden">
                            <p>Scan to pay:</p>
                            <img id="qrCodeImg" alt="UPI QR Code">
                        </div>
                        <button class="pay-now-btn" onclick="processUPIPayment()">
                            <i class="fas fa-mobile-alt"></i> Pay with UPI
                        </button>
                    </div>
                    
                    <div id="codPaymentForm" class="payment-form hidden">
                        <div class="cod-info">
                            <i class="fas fa-truck"></i>
                            <p>Pay ₹<span id="codAmount">0</span> when your order is delivered</p>
                            <small>Cash or card accepted at delivery</small>
                        </div>
                        <button class="pay-now-btn" onclick="processCODPayment()">
                            <i class="fas fa-check"></i> Confirm Order (Pay on Delivery)
                        </button>
                    </div>
                    
                    <div id="paymentStatus" class="payment-status hidden"></div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners for tabs
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const method = tab.dataset.method;
                this.showMethod(method);
            });
        });
        
        // Format card number input
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '');
                if (value.length > 16) value = value.slice(0, 16);
                value = value.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = value;
            });
        }
    }
    
    showMethod(method) {
        this.selectedMethod = method;
        
        // Update tabs
        document.querySelectorAll('.payment-tab').forEach(tab => {
            if (tab.dataset.method === method) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update forms
        document.getElementById('cardPaymentForm').classList.toggle('hidden', method !== 'card');
        document.getElementById('upiPaymentForm').classList.toggle('hidden', method !== 'upi');
        document.getElementById('codPaymentForm').classList.toggle('hidden', method !== 'cod');
        
        // Update COD amount display
        if (method === 'cod') {
            const codAmountSpan = document.getElementById('codAmount');
            if (codAmountSpan) {
                codAmountSpan.textContent = this.currentAmount.toFixed(2);
            }
        }
        
        // Generate QR for UPI if needed
        if (method === 'upi') {
            const qrUrl = this.processor.generateUPIQRCode(this.currentAmount);
            const qrImg = document.getElementById('qrCodeImg');
            if (qrImg) {
                qrImg.src = qrUrl;
                document.getElementById('upiQrCode').classList.remove('hidden');
            }
        }
    }
    
    async processPayment() {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.classList.remove('hidden');
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing payment...';
        
        const cardDetails = {
            number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            expiry: document.getElementById('cardExpiry').value,
            cvv: document.getElementById('cardCvv').value,
            name: document.getElementById('cardName').value
        };
        
        try {
            const result = await this.processor.processCardPayment(cardDetails, this.currentAmount);
            statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${result.message}`;
            statusDiv.style.background = '#d1fae5';
            statusDiv.style.color = '#065f46';
            
            setTimeout(() => {
                this.closeModal();
                if (this.onSuccessCallback) {
                    this.onSuccessCallback(result.transaction);
                }
            }, 1500);
        } catch (error) {
            statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${error.message}`;
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.color = '#991b1b';
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 3000);
        }
    }
    
    async processUPIPayment() {
        const upiId = document.getElementById('upiId').value;
        if (!upiId) {
            this.showPaymentError('Please enter UPI ID');
            return;
        }
        
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.classList.remove('hidden');
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing UPI payment...';
        
        try {
            const result = await this.processor.processUPIPayment(upiId, this.currentAmount);
            statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${result.message}`;
            statusDiv.style.background = '#d1fae5';
            statusDiv.style.color = '#065f46';
            
            setTimeout(() => {
                this.closeModal();
                if (this.onSuccessCallback) {
                    this.onSuccessCallback(result.transaction);
                }
            }, 1500);
        } catch (error) {
            statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${error.message}`;
            statusDiv.style.background = '#fee2e2';
            statusDiv.style.color = '#991b1b';
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 3000);
        }
    }
    
    processCODPayment() {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.classList.remove('hidden');
        
        const result = this.processor.processCOD(this.currentAmount);
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${result.message}`;
        statusDiv.style.background = '#d1fae5';
        statusDiv.style.color = '#065f46';
        
        setTimeout(() => {
            this.closeModal();
            if (this.onSuccessCallback) {
                this.onSuccessCallback(result.transaction);
            }
        }, 1500);
    }
    
    showPaymentError(message) {
        const statusDiv = document.getElementById('paymentStatus');
        statusDiv.classList.remove('hidden');
        statusDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`;
        statusDiv.style.background = '#fee2e2';
        statusDiv.style.color = '#991b1b';
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 3000);
    }
    
    closeModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Initialize payment system
let paymentProcessor = null;
let paymentUIManager = null;

function initPaymentSystem() {
    paymentProcessor = new PaymentProcessor(PAYMENT_CONFIG);
    paymentUIManager = new PaymentUIManager(paymentProcessor);
    
    // Make functions globally accessible
    window.processPayment = () => paymentUIManager.processPayment();
    window.processUPIPayment = () => paymentUIManager.processUPIPayment();
    window.processCODPayment = () => paymentUIManager.processCODPayment();
    window.closePaymentModal = () => paymentUIManager.closeModal();
    window.showPaymentModal = (amount, callback) => paymentUIManager.showPaymentModal(amount, callback);
    
    console.log('Payment system initialized with config:', PAYMENT_CONFIG);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaymentProcessor, PaymentUIManager, PAYMENT_CONFIG, initPaymentSystem };
}