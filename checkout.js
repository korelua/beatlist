// Get cart items from localStorage
let cart = [];
try {
    const storedCart = localStorage.getItem('cart');
    console.log('Raw cart data from localStorage:', storedCart);
    if (storedCart) {
        cart = JSON.parse(storedCart);
        console.log('Parsed cart data:', cart);
        if (!Array.isArray(cart)) {
            console.error('Invalid cart data in localStorage - not an array');
            cart = [];
        }
    } else {
        console.log('No cart data found in localStorage');
    }
} catch (error) {
    console.error('Error reading cart from localStorage:', error);
    cart = [];
}

// DOM Elements
const checkoutItems = document.getElementById('checkout-items');
const checkoutTotal = document.getElementById('checkout-total-amount');
const paymentForm = document.getElementById('payment-form');
const submitButton = document.getElementById('submit-button');
const spinner = document.getElementById('spinner');
const buttonText = document.getElementById('button-text');
const cartCount = document.getElementById('cart-count');

// Update cart count
cartCount.textContent = cart.length;

// Initialize Stripe (replace with your actual publishable key)
const stripe = Stripe('pk_live_51RNaeJH4jaj8obY2Cb2TK4ThCwW7d0ArfKJLznasbKqKsKVBEbwZQHOqkFGopVsbhPGxSFMWFcTMPW1b5c4GPTp100BrVZsQt5');
const elements = stripe.elements();

// Create card element
const card = elements.create('card', {
    style: {
        base: {
            color: '#fff',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#ff0000',
            iconColor: '#ff0000'
        }
    }
});

// Mount card element
card.mount('#card-element');

// Handle real-time validation errors
card.addEventListener('change', ({error}) => {
    const displayError = document.getElementById('card-errors');
    if (error) {
        displayError.textContent = error.message;
    } else {
        displayError.textContent = '';
    }
});

// In-memory map to track files for each service item (by cart index)
const serviceFilesMap = {};

// Display cart items and set up file inputs
function displayCheckoutItems() {
    // Ensure cart is valid
    if (!Array.isArray(cart)) {
        console.error('Invalid cart data');
        cart = [];
    }

    if (cart.length === 0) {
        checkoutItems.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty</p>
                <button class="back-button" onclick="window.location.href='index.html'">
                    <i class="fas fa-arrow-left"></i> Back to Store
                </button>
            </div>`;
        checkoutTotal.textContent = '$0.00';
        return;
    }

    checkoutItems.innerHTML = cart.map((item, idx) => {
        // Ensure item has required properties
        if (!item || !item.title || typeof item.price !== 'number') {
            console.error('Invalid item in cart:', item);
            return '';
        }
        let fileInputHtml = '';
        if (item.license === 'Service') {
            fileInputHtml = `
                <div class="service-upload-group" style="margin: 0.5em 0 1.5em 0;">
                    <label style="color:#00ff00;">Upload audio files for <b>${item.title}</b>:</label>
                    <input type="file" class="service-file-input" data-idx="${idx}" multiple accept="audio/*" style="margin-top:0.5em;">
                    <div class="service-file-list" id="service-file-list-${idx}" style="font-size:0.95em;color:#fff;margin-top:0.3em;"></div>
                    <div class="service-file-error" id="service-file-error-${idx}" style="color:#ff0000;font-size:0.95em;"></div>
                </div>
            `;
        }
        return `
            <div class="checkout-item">
                <span class="checkout-item-title">${item.title} <span style='color:#ff0000;font-size:0.9em;'>[${item.license || 'Unknown'}]</span></span>
                <span class="checkout-item-price">$${item.price.toFixed(2)}</span>
            </div>
            ${fileInputHtml}
        `;
    }).join('');

    // Update total
    const total = cart.reduce((sum, item) => {
        if (typeof item.price === 'number') {
            return sum + item.price;
        }
        return sum;
    }, 0);
    checkoutTotal.textContent = `$${total.toFixed(2)}`;

    // After rendering, set up file input listeners:
    setupServiceFileInputs();
}

function setupServiceFileInputs() {
    document.querySelectorAll('.service-file-input').forEach(input => {
        const idx = input.getAttribute('data-idx');
        input.addEventListener('change', (e) => {
            // Only allow audio files
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('audio/'));
            serviceFilesMap[idx] = files;
            // Show file names
            const fileListDiv = document.getElementById(`service-file-list-${idx}`);
            const errorDiv = document.getElementById(`service-file-error-${idx}`);
            if (files.length > 0) {
                fileListDiv.innerHTML = '<ul>' + files.map(f => `<li>${f.name} (${(f.size/1024).toFixed(1)} KB)</li>`).join('') + '</ul>';
                errorDiv.textContent = '';
            } else {
                fileListDiv.innerHTML = '';
                errorDiv.textContent = 'Please select at least one audio file.';
            }
        });
    });
}

// Initial render
displayCheckoutItems();

// If cart changes (e.g., storage event), re-render and re-setup file inputs
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
        try {
            const newCart = JSON.parse(e.newValue);
            if (Array.isArray(newCart)) {
                cart = newCart;
                displayCheckoutItems();
            }
        } catch (error) {
            console.error('Error updating cart from storage event:', error);
        }
    }
});

// Update form submission logic
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if cart is empty
    if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    // Validate all service items have at least one file
    let allFilesValid = true;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].license === 'Service') {
            if (!serviceFilesMap[i] || serviceFilesMap[i].length === 0) {
                document.getElementById(`service-file-error-${i}`).textContent = 'Please select at least one audio file.';
                allFilesValid = false;
            }
        }
    }
    if (!allFilesValid) {
        submitButton.disabled = false;
        spinner.classList.add('hidden');
        buttonText.textContent = 'Complete Purchase';
        return;
    }

    submitButton.disabled = true;
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Processing...';

    try {
        // 1. Upload audio service files if any
        const email = document.getElementById('email').value;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].license === 'Service' && serviceFilesMap[i] && serviceFilesMap[i].length > 0) {
                const formData = new FormData();
                formData.append('email', email);
                for (const file of serviceFilesMap[i]) {
                    formData.append('files', file, file.name);
                }
                const uploadRes = await fetch('/upload-audio-service', {
                    method: 'POST',
                    body: formData
                });
                const uploadJson = await uploadRes.json();
                if (!uploadJson.success) throw new Error('File upload failed');
            }
        }

        // 2. Calculate total in cents
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const amount = Math.round(total * 100);

        // 3. Create PaymentIntent on your server
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                email,
                items: cart // Send cart items to server
            })
        });
        const { clientSecret, error } = await response.json();
        if (error) throw new Error(error);

        // 4. Confirm the card payment
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    email: email
                }
            }
        });

        if (result.error) {
            throw result.error;
        }

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <h3>Purchase Successful!</h3>
            <p>Thank you for your order. You will receive a confirmation email shortly.</p>
            <p>Order ID: ${result.paymentIntent.id}</p>
        `;
        paymentForm.innerHTML = '';
        paymentForm.appendChild(successMessage);

        // Clear cart and redirect after 3 seconds
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    } catch (error) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message;
        submitButton.disabled = false;
        spinner.classList.add('hidden');
        buttonText.textContent = 'Complete Purchase';
    }
});

// Initialize checkout page

console.log('Initial cart state:', cart);
displayCheckoutItems();

// Add event listener for storage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'cart') {
        console.log('Cart updated in localStorage');
        try {
            const newCart = JSON.parse(e.newValue);
            if (Array.isArray(newCart)) {
                cart = newCart;
                displayCheckoutItems();
            }
        } catch (error) {
            console.error('Error updating cart from storage event:', error);
        }
    }
});

// Add back button functionality
const backButton = document.createElement('button');
backButton.className = 'back-button';
backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Store';
backButton.onclick = () => window.location.href = 'index.html';
document.querySelector('.checkout-container').insertBefore(backButton, document.querySelector('.checkout-content')); 