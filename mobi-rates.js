const crypto = require('crypto');
const axios = require('axios');

class MobicardForexRates {
    constructor(merchantId, apiKey, secretKey) {
        this.mobicardVersion = "2.0";
        this.mobicardMode = "TEST";
        this.mobicardMerchantId = merchantId;
        this.mobicardApiKey = apiKey;
        this.mobicardSecretKey = secretKey;
        this.mobicardServiceId = "20000";
        this.mobicardServiceType = "FOREXRATES";
        this.mobicardBaseCurrency = "USD";
        
        this.mobicardTokenId = Math.floor(Math.random() * (1000000000 - 1000000 + 1)) + 1000000;
        this.mobicardTxnReference = Math.floor(Math.random() * (1000000000 - 1000000 + 1)) + 1000000;
    }

    generateJWT(queryCurrency = "") {
        const jwtHeader = { typ: "JWT", alg: "HS256" };
        const encodedHeader = Buffer.from(JSON.stringify(jwtHeader)).toString('base64url');

        const jwtPayload = {
            mobicard_version: this.mobicardVersion,
            mobicard_mode: this.mobicardMode,
            mobicard_merchant_id: this.mobicardMerchantId,
            mobicard_api_key: this.mobicardApiKey,
            mobicard_service_id: this.mobicardServiceId,
            mobicard_service_type: this.mobicardServiceType,
            mobicard_token_id: this.mobicardTokenId.toString(),
            mobicard_txn_reference: this.mobicardTxnReference.toString(),
            mobicard_base_currency: this.mobicardBaseCurrency,
            mobicard_query_currency: queryCurrency
        };

        const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');

        const headerPayload = `${encodedHeader}.${encodedPayload}`;
        const signature = crypto.createHmac('sha256', this.mobicardSecretKey)
            .update(headerPayload)
            .digest('base64url');

        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }

    async getForexRates(queryCurrency = "") {
        try {
            const jwtToken = this.generateJWT(queryCurrency);
            
            const url = "https://mobicardsystems.com/api/v1/forex_rates";
            const payload = { mobicard_auth_jwt: jwtToken };

            const response = await axios.post(url, payload, {
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
            });

            const responseData = response.data;

            if (responseData.status === 'SUCCESS') {
                return {
                    status: 'SUCCESS',
                    baseCurrency: responseData.base_currency,
                    timestamp: responseData.timestamp,
                    forexRates: responseData.forex_rates,
                    rawResponse: responseData
                };
            } else {
                return {
                    status: 'ERROR',
                    statusCode: responseData.status_code,
                    statusMessage: responseData.status_message
                };
            }
        } catch (error) {
            return {
                status: 'ERROR',
                errorMessage: error.message
            };
        }
    }
}

// Usage
async function main() {
    const forexRates = new MobicardForexRates(
        "4",
        "YmJkOGY0OTZhMTU2ZjVjYTIyYzFhZGQyOWRiMmZjMmE2ZWU3NGIxZWM3ZTBiZSJ9",
        "NjIwYzEyMDRjNjNjMTdkZTZkMjZhOWNiYjIxNzI2NDQwYzVmNWNiMzRhMzBjYSJ9"
    );

    // Get all forex rates
    const result = await forexRates.getForexRates();
    // Get specific currency rate
    // const result = await forexRates.getForexRates("EUR");

    if (result.status === 'SUCCESS') {
        console.log("Forex Rates Retrieved Successfully!");
        console.log(`Base Currency: ${result.baseCurrency}`);
        console.log(`Timestamp: ${result.timestamp}`);
        console.log(`Total Rates Available: ${Object.keys(result.forexRates).length}`);
        
        console.log("\nSample Exchange Rates:");
        const rates = result.forexRates;
        const pairs = Object.keys(rates);
        for (let i = 0; i < Math.min(5, pairs.length); i++) {
            console.log(`${pairs[i]}: ${rates[pairs[i]]}`);
        }
    } else {
        console.log(`Error: ${result.statusMessage}`);
    }
}

main();
