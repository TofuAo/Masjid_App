-- Migration: Update Payment Method Providers to ToyyibPay
-- Created: 2025-12-02
-- Updates all payment methods to use ToyyibPay as the provider

USE masjid_app;

-- Update FPX to use ToyyibPay
UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'fpx';

-- Update DuitNow QR to use ToyyibPay (ToyyibPay supports DuitNow QR)
UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'duitnow_qr';

-- Update DuitNow Request to use ToyyibPay (ToyyibPay supports DuitNow Request)
UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'duitnow_request';

-- Update Touch'n Go eWallet to use ToyyibPay
UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'tng_ewallet';

-- Update Boost to use ToyyibPay
UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'boost';

-- Update GrabPay to use ToyyibPay
UPDATE payment_method_settings 
SET provider = 'toyyibpay',
    config = JSON_OBJECT('providers', JSON_ARRAY('toyyibpay'))
WHERE method_code = 'grabpay';

-- Verify the updates
SELECT method_code, method_name, provider, config 
FROM payment_method_settings 
ORDER BY display_order;

