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
const encryptedrefreshToken = "U2FsdGVkX1/Bre16n6FlFrJXWuKNw7ZrGEViWogbEEroasznd7/eMe3CX2l07ArlBXxun+CGqCGK0YJY/yrQ6MST69/haVtixckQURWwyJIBUWIR+S08a3JcAzVQqz77wM2HSzg2zIsmvYsMH4yWtcZ501E6NP1RJzoLD9xWDsAmeYb6OC+5iSypsFEQRw26dZ9Mp8wvnSKFieK2bQcosdrCcTF6UW2g2dR5l3qMx1LPiyX7HUoK07jEfL0ULSkN8jFCoFFHCNY3eY3lMsafEPfD/0nhTAMHDJCB5YOUBoy3sNACThXT088Z6AhUvHzr2Q/1MWcAkRzKin9FrU9UwYqnpiRr+RxB++s3voMt3Ow5t/KTRS4q2Sahf3ZZ9VLH14Uu7PoxF1qpLUJD+PdTs41+xe7iWyLKOKbBZKA8BiWWaBUxiRhDt50DL+Y0qRzsUhyJ5Wi/n/58FodmJPRPqqtIYbvFluvf2suDJx04O5GD178ltWmp+pcfhka1/8BodZO+jYqekMGsOvUoMpv4yiOuULPNoQ4NQHVv058o/2Q=";


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
