// Product Data
const products = [
    { id: 1, name: "Wireless Headphones", price: 2999, icon: "🎧", category: "Electronics" },
    { id: 2, name: "Smart Watch", price: 4999, icon: "⌚", category: "Wearables" },
    { id: 3, name: "Cotton T-Shirt", price: 799, icon: "👕", category: "Fashion" },
    { id: 4, name: "Backpack", price: 1299, icon: "🎒", category: "Accessories" },
    { id: 5, name: "Coffee Maker", price: 3499, icon: "☕", category: "Home" },
    { id: 6, name: "Bluetooth Speaker", price: 1999, icon: "🔊", category: "Electronics" }
];

// Cart Management
let cart = [];

// Load cart from localStorage
function loadCart() {
    const saved = localStorage.getItem('shoppingCart');
    if (saved) {
        cart = JSON.parse(saved);
    }
    updateCartUI();
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
    showToast(`${product.name} added to cart!`);
}

// Update quantity
function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        saveCart();
        updateCartUI();
    }
}

// Remove item
function removeItem(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    updateCartUI();
}

// Calculate total
function calculateTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Update Cart UI
function updateCartUI() {
    const cartContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = 'Total: ₹0.00';
        checkoutBtn.disabled = true;
        return;
    }
    
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${item.price}</div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="cart-item-qty">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                <i class="fas fa-trash remove-item" onclick="removeItem(${item.id})"></i>
            </div>
        </div>
    `).join('');
    
    cartTotal.textContent = `Total: ₹${calculateTotal().toFixed(2)}`;
    checkoutBtn.disabled = false;
}

// Render Products
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-img">${product.icon}</div>
            <div class="product-title">${product.name}</div>
            <div class="product-price">₹${product.price}</div>
            <button class="add-to-cart" onclick="addToCart(${product.id})">
                <i class="fas fa-cart-plus"></i> Add to Cart
            </button>
        </div>
    `).join('');
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}