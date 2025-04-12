const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();
const AMADEUS_BASE_URL = process.env.AMADEUS_BASE_URL;
const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;
class AmadeusService {

   
    
  static async getAccessToken() {
    try {
        console.log(AMADEUS_BASE_URL)
        console.log(AMADEUS_CLIENT_SECRET)
        console.log(AMADEUS_CLIENT_ID)
      const response = await axios.post(
        `${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
        `grant_type=client_credentials&client_id=${AMADEUS_CLIENT_ID}&client_secret=${AMADEUS_CLIENT_SECRET}`,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      return response.data.access_token;
    } catch (err) {
      console.error("Token Error:", err.response ? err.response.data : err.message);
      throw err;
    }
  }

  static async getHotelsByCity(cityCode) {
    const accessToken = await this.getAccessToken();
    const response = await axios.get(
      `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { cityCode },
      }
    );
    return response.data.data;
  }

  static async getActivitiesByCity(cityData) {
    const accessToken = await this.getAccessToken();
    const response = await axios.get(
      `${AMADEUS_BASE_URL}/v1/shopping/activities`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          latitude: cityData.lat,
          longitude: cityData.lon,
          radius: 40,
          sort: 'rating'
        }
      }
    );
    return response.data.data;
  }
}

module.exports = AmadeusService;