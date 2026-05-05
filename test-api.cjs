const axios = require('axios');

async function test() {
  try {
    const response = await axios.get('https://seun-trading-bot-api-2026-28f6d6f40e1b.herokuapp.com/api/Assets', {
      timeout: 15000
    });
    const assets = Array.isArray(response.data?.data) ? response.data.data : [];
    console.log(`Assets count: ${assets.length}`);
    
    const liveResponse = await axios.get('https://seun-trading-bot-api-2026-28f6d6f40e1b.herokuapp.com/api/Assets/live-prices', {
      timeout: 15000
    });
    let payload = liveResponse.data || {};
    let liveArray = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
    console.log(`Live Prices count: ${liveArray.length}`);
  } catch (error) {
    console.error(error.message);
  }
}

test();
