require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const path = require('path');
const app = express();

// Use environment variable for Stripe secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'checkout.html'));
});

// Stripe payment endpoint
app.post('/create-payment-intent', async (req, res) => {
    const { amount, email } = req.body;
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount, // in cents
            currency: 'usd',
            receipt_email: email,
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.send({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        console.error('Stripe error:', err);
        res.status(500).send({ error: err.message });
    }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Use Railway's PORT or fallback to 3000
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`)); 