// Test env — set before any module reads `config` at import time.
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.CASHFREE_APP_ID = "cf_test_app";
process.env.CASHFREE_SECRET_KEY = "cf_test_secret";
process.env.CASHFREE_ENV = "sandbox";
process.env.RUNWARE_WEBHOOK_SECRET = "rw_test_secret";
