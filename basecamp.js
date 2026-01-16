import fs from "fs";
import axios from "axios";
import { time } from "console";
import moment from "moment";
import CryptoJS from "crypto-js";
import dotenv from "dotenv";

dotenv.config();
const secretKey = process.env.SECRET_KEY;

const encryptedclientId = "U2FsdGVkX1/NvoGhZPkYjP2FcrUErmI/OFS5HOH3OMDdj64Agm1nUejs0iyKh4OySL6xYyzm291i2kMGS5gWZQ==";
const encryptedclientSecret = "U2FsdGVkX19fg2Z9UgfmKxsQi7FXA0hYhXWtzwx2UbHnQGdEROEFryy05VNnpoK2mfBJHeMVkPLxAwO05kBbFA==";
const encryptedrefreshToken = "U2FsdGVkX1+72sPCYOXHplwioGJubtHyi2OeeDxuCrVYby8cnntSTZaM01//QFCWHCHI8983XVMejN3S2A6L0TYVAT8QlwvADcwPQM86tw0h0TK6pDkdbXEEVy8veP5kdTqJwji82HKTalrNOyXcoY6ZGyOYEB7C27cDjBeTM0nyA8F2x/4xCMvGZmekXbWtPcRcAJz8TRAlO/YkaP0Pot+WSkc2iIq7glhEGp84Sygw+Cyc8Q8OQAVfwU+HB1o9jS1eQ/UUROk8OTpWgfO1Q1c5K5QC9Jmh56uMhinCyw1Hx8xFYKKPz4a3Zq2e0mUeqIdVHmxtTMj0iN6y6eFK0eBAe3Kw+GEWPsgC3RvVMJPBUMqmCKRCgcA3zqLkPx8pEePbwZ+cy1iVxxUUVhMrw08C/aqfSAmaP7kG20mX4ilcKXg+Ru8NDUksM09/W6D6HykDkVtJQjFQgFhdmUEBkhSHnH5wB+oAf9xc3nXGqfRCh1plD0G53jgxIE3Sn9AftEpyscig5kO+XTUiHvCqFAfz2KC4SJYlsiZmmtHyE+o=";


async function getAccessTokenFromRefreshToken() {
  const clientId = CryptoJS.AES.decrypt(encryptedclientId, secretKey).toString(CryptoJS.enc.Utf8);
  const clientSecret = CryptoJS.AES.decrypt(encryptedclientSecret, secretKey).toString(CryptoJS.enc.Utf8);
  const refreshToken = CryptoJS.AES.decrypt(encryptedrefreshToken, secretKey).toString(CryptoJS.enc.Utf8);

  try {
    const response = await axios.post("https://launchpad.37signals.com/authorization/token", {
      type: "refresh",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Failed to fetch access token from refresh token:", error.response?.data || error.message);
    throw error;
  }
}

const postToBasecamp = async () => {
const accessToken = await getAccessTokenFromRefreshToken();
console.log("accessToken: "+ accessToken);
  const url = "https://3.basecampapi.com/4489886/buckets/20201395/recordings/7964796971/comments.json";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const report = fs.readFileSync(`output.txt`, `utf8`);
  
  const body = {
    content: report,
  };
  try {
    const response = await axios.post(url, body, { headers });
  } catch (error) {
    console.log(error);
  }
};

export { postToBasecamp };
