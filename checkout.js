// Get cart items from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const checkoutItems = document.getElementById('checkout-items');
const checkoutTotal = document.getElementById('checkout-total-amount');
const paymentForm = document.getElementById('payment-form');
const submitButton = document.getElementById('submit-button');
const spinner = document.getElementById('spinner');
const buttonText = document.getElementById('button-text');

// Initialize Stripe (replace with your actual publishable key)
const stripe = Stripe('pk_test_51RNaeTHBUtSzpji2ocG2DL0Jk3dxEV4AG6GM4NmvZ193diwBQqpjn1w5ZSAA30lC2oA7x7RsO5pgpKPEJm4g2ANU00cMOhulSV');
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
    if (cart.length === 0) {
        checkoutItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        return;
    }

    checkoutItems.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <span class="checkout-item-title">${item.title}</span>
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
    submitButton.disabled = true;
    spinner.classList.remove('hidden');
    buttonText.textContent = 'Processing...';

    try {
        // Calculate total in cents
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const amount = Math.round(total * 100);

        // 1. Create PaymentIntent on your server
        const response = await fetch('http://localhost:4242/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount,
                email: document.getElementById('email').value
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

        alert('Purchase successful! Thank you for your order.');
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        window.location.href = 'index.html';
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