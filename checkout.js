// Get cart items from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

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

// Display cart items
function displayCheckoutItems() {
    if (!cart || cart.length === 0) {
        checkoutItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        checkoutTotal.textContent = '$0.00';
        return;
    }

    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span class="checkout-item-title">${item.title} <span style='color:#ff0000;font-size:0.9em;'>[${item.license}]</span></span>
            <span class="checkout-item-price">$${item.price.toFixed(2)}</span>
        </div>
    `).join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    checkoutTotal.textContent = `$${total.toFixed(2)}`;
}

// Handle form submission
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if cart is empty
    if (!cart || cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    submitButton.disabled = true;
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Processing...';

    try {
        // Calculate total in cents
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const amount = Math.round(total * 100);

        // 1. Create PaymentIntent on your server
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                email: document.getElementById('email').value,
                items: cart // Send cart items to server
            })
        });
        const { clientSecret, error } = await response.json();
        if (error) throw new Error(error);

        // 2. Confirm the card payment
        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    email: document.getElementById('email').value
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

// Format card number input
const cardNumber = document.getElementById('card-number');
cardNumber.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    e.target.value = value;
});

// Format expiry date input
const expiry = document.getElementById('expiry');
expiry.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
});

// Format CVV input
const cvv = document.getElementById('cvv');
cvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
});

// Initialize checkout page
displayCheckoutItems();

// Add back button functionality
const backButton = document.createElement('button');
backButton.className = 'back-button';
backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Store';
backButton.onclick = () => window.location.href = 'index.html';
document.querySelector('.checkout-container').insertBefore(backButton, document.querySelector('.checkout-content')); 