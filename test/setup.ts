// Test env — set before any module reads `config` at import time.
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
process.env.RAZORPAY_WEBHOOK_SECRET = "rzp_webhook_secret";
process.env.RUNWARE_WEBHOOK_SECRET = "rw_test_secret";
