const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const app = express();

// Replace with your Stripe secret key
const stripe = Stripe('sk_test_51RNaeTHBUtSzpji25PubpQ9CjYrClVrrSDoBwPbSHTXzYz4ytNshSIe83MgcbMoJb11IBhDJZsTf7wUgWxMeObPz007ghaC4Wz'); // <-- Your secret key here

app.use(cors());
app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
  const { amount, email } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency: 'usd',
      receipt_email: email,
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

app.listen(4242, () => console.log('Server running on port 4242')); 