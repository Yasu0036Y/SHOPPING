// Global variables
let currentLocation = null;
let currentAddress = "";
let map = null;
let mapMarker = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    loadCart();
    setupEventListeners();
    initLocationServices();
    initPaymentSystem(); // Initialize payment system
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        if (cart.length === 0) return;
        document.getElementById('deliverySection').classList.remove('hidden');
        document.getElementById('checkoutBtn').disabled = true;
        document.getElementById('cartSection').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Location method tabs
    document.querySelectorAll('.location-method-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const method = btn.dataset.method;
            switchLocationMethod(method);
        });
    });
    
    document.getElementById('refreshLocationBtn')?.addEventListener('click', () => detectLocation());
    document.getElementById('saveManualBtn')?.addEventListener('click', saveManualAddress);
    document.getElementById('confirmMapBtn')?.addEventListener('click', confirmMapAddress);
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
}

// Switch between location input methods
function switchLocationMethod(method) {
    document.querySelectorAll('.location-method-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.location-method-btn[data-method="${method}"]`).classList.add('active');
    
    document.getElementById('autoLocation').classList.add('hidden');
    document.getElementById('manualLocation').classList.add('hidden');
    document.getElementById('mapLocation').classList.add('hidden');
    
    if (method === 'auto') {
        document.getElementById('autoLocation').classList.remove('hidden');
        detectLocation();
    } else if (method === 'manual') {
        document.getElementById('manualLocation').classList.remove('hidden');
    } else if (method === 'map') {
        document.getElementById('mapLocation').classList.remove('hidden');
        initMapForSelection();
    }
}

// Global variable to store location callback
window.currentLocationCallback = null;

// Updated Location Detection with VPN Check
async function detectLocation() {
    const statusDiv = document.getElementById('locationStatus');
    const resultDiv = document.getElementById('autoLocationResult');
    
    // First, check for VPN
    statusDiv.innerHTML = '<i class="fas fa-shield-alt"></i> Checking security settings...';
    
    // Enforce no VPN
    const vpnCheckPassed = await vpnDetector.enforceNoVPN();
    
    if (!vpnCheckPassed) {
        // VPN detected - user will see warning modal
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> VPN detected. Please disable VPN to continue.';
        resultDiv.innerHTML = 'Location access blocked due to VPN. Please disable your VPN and try again.';
        return;
    }
    
    // Proceed with location detection
    if (!navigator.geolocation) {
        statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Geolocation not supported';
        return;
    }
    
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching your location...';
    
    // Request permission with VPN warning
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            // Double-check VPN hasn't been enabled during location fetch
            const vpnCheckAgain = await vpnDetector.detectVPN();
            if (vpnCheckAgain.detected) {
                statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> VPN detected during location fetch';
                vpnDetector.showVPNWarning();
                return;
            }
            
            const { latitude, longitude } = position.coords;
            currentLocation = { lat: latitude, lng: longitude };
            
            // Reverse geocoding with VPN check
            currentAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            statusDiv.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> Location detected securely!';
            resultDiv.innerHTML = `
                <strong>📍 Coordinates:</strong> ${currentAddress}<br>
                <strong>Accuracy:</strong> ${position.coords.accuracy} meters<br>
                <strong>🔒 Security:</strong> VPN not detected ✓
            `;
            
            updateDeliveryAddress(currentAddress);
        },
        (error) => {
            let errorMessage = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location permission denied. Please enable location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Failed to get location';
            resultDiv.innerHTML = `Error: ${errorMessage}. Using default location.`;
            currentAddress = "MG Road, Bengaluru (Default)";
            updateDeliveryAddress(currentAddress);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Add VPN monitoring to detect if user enables VPN during session
function startVPNMonitoring() {
    vpnDetector.startVPNMonitoring((vpnDetected) => {
        if (vpnDetected) {
            showToast('⚠️ VPN detected! Please disable VPN for accurate location services.');
            // Update location status to show warning
            const statusDiv = document.getElementById('locationStatus');
            if (statusDiv && document.getElementById('autoLocation').classList.contains('active')) {
                statusDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> VPN detected. Location services paused.';
            }
        } else {
            showToast('✓ VPN disabled. Location services restored.');
            if (document.getElementById('autoLocation').classList.contains('active')) {
                detectLocation();
            }
        }
    });
}

// Initialize with VPN monitoring
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    loadCart();
    setupEventListeners();
    initLocationServices();
    initPaymentSystem();
    startVPNMonitoring(); // Start VPN monitoring
    
    // Store callback for retry
    window.currentLocationCallback = detectLocation;
});

// Manual Address Save
function saveManualAddress() {
    const address = document.getElementById('manualAddress').value;
    const landmark = document.getElementById('manualLandmark').value;
    if (address.trim()) {
        currentAddress = landmark ? `${address}, ${landmark}` : address;
        updateDeliveryAddress(currentAddress);
        showToast('Manual address saved!');
    } else {
        showToast('Please enter an address');
    }
}

// Map Selection
function initMapForSelection() {
    if (!map) {
        map = L.map('map').setView([12.9716, 77.5946], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            if (mapMarker) map.removeLayer(mapMarker);
            mapMarker = L.marker([lat, lng]).addTo(map);
            document.getElementById('selectedCoords').innerHTML = `Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            currentLocation = { lat, lng };
        });
    } else {
        map.invalidateSize();
    }
}

function confirmMapAddress() {
    if (currentLocation) {
        currentAddress = `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`;
        updateDeliveryAddress(currentAddress);
        showToast('Map location confirmed!');
    } else {
        showToast('Please click on the map to select a location');
    }
}

function updateDeliveryAddress(address) {
    document.getElementById('displayAddress').innerHTML = `
        <i class="fas fa-location-dot"></i> ${address}
    `;
}

// Initialize location services
function initLocationServices() {
    detectLocation();
}

// Updated Place Order with Real Payment Modal
function placeOrder() {
    if (cart.length === 0) {
        showToast('Cart is empty!');
        return;
    }
    
    if (!currentAddress) {
        showToast('Please provide delivery address');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Show payment modal instead of direct processing
    window.showPaymentModal(total, (transaction) => {
        // Payment successful callback
        const orderStatusDiv = document.getElementById('orderStatusMsg');
        const paymentMethod = document.getElementById('paymentMethod').value;
        
        orderStatusDiv.innerHTML = `
            <i class="fas fa-check-circle" style="color:#10b981"></i> 
            ✅ Order placed successfully!<br>
            <small>Transaction ID: ${transaction.id}</small><br>
            <small>Payment Method: ${transaction.method.toUpperCase()}</small><br>
            <small>Amount: ${paymentProcessor.formatCurrency(transaction.amount)}</small>
        `;
        
        // Real-time order updates simulation
        setTimeout(() => {
            orderStatusDiv.innerHTML += '<br><i class="fas fa-box"></i> Order packed and ready for dispatch';
        }, 2000);
        
        setTimeout(() => {
            orderStatusDiv.innerHTML += '<br><i class="fas fa-truck"></i> Out for delivery 🚚';
        }, 5000);
        
        setTimeout(() => {
            orderStatusDiv.innerHTML += '<br><i class="fas fa-check-double"></i> Delivered! Thank you for shopping with ShopEase 🎉';
        }, 9000);
        
        // Clear cart after order
        cart = [];
        saveCart();
        updateCartUI();
        
        // Show order summary
        showToast(`Order placed! Total: ₹${total.toFixed(2)}`);
        
        // Scroll to order updates
        document.getElementById('orderUpdates').scrollIntoView({ behavior: 'smooth' });
    });
}

// Helper function (already defined in products.js but ensure global)
window.showToast = showToast;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;