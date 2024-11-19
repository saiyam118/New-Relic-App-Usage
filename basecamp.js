import data from "./params.js";
import fs from "fs";
import axios from "axios";
import { time } from "console";
import moment from "moment";

let access_token = data.access_token;
let refresh_token = data.refresh_token;
let creation_date = data.day_created

//access token logic
//check if acces_token is expired then make new one



function checkAndUpdateExpiresIn(){
  // const currentDate = new Date();
  // const expiresDate = data.expires_in;
  // console.log(currentDate);
  // const expiresInThresholdDays = 10;
  // const timeDifference = (data.expires_in - currentDate) / (1000 * 60 * 60 * 24);
  // console.log(timeDifference);
  // if(timeDifference <= expiresInThresholdDays) {
  //   console.log("token valid");
  // } else {
  //   console.log("token expired");
  // }
  const currentDate = moment().format("YYYY-MM-DD");
  const curr_day = moment().format("DD");
  const curr_mon = moment().format("MM");
  // console.log(currentDate);
  // console.log(curr_day,curr_mon);
  // console.log(creation_date);
  let creation_day = moment(creation_date).format("DD");
  let creation_mon = moment(creation_date).format("MM");
  // console.log(creation_day,creation_mon);
  if(curr_mon != creation_mon) {
    console.log("create new token");
    //create new token and set the value of day_created
    console.log("make new token");


    //change value of day_created
    data.day_created = moment().format("YYYY-MM-DD");
    saveParams();
  }
  else {
    //check if 10 gap
    if(curr_day - creation_day <= 10){
      //token valid
      console.log("token valid");
      
    } else {
      //create new token and set the value of day_created
      console.log("make new token");


      //change value of day_created
      data.day_created = moment().format("YYYY-MM-DD");
      saveParams();
    }
    
  }
}

function saveParams() {
  // Convert data to a JSON string with proper formatting
  const dataString = `export default ${JSON.stringify(data, null, 2)};`;

  // Write the updated data to params.js
  fs.writeFileSync("./params.js", dataString, "utf8", (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("params.js successfully updated with new expires_in value.");
    }
  });
}



//comment a message
//postacomment on basecamp
const postToBasecamp = async () => {
  const url =
    "https://3.basecampapi.com/4489886/buckets/20201395/recordings/7964796971/comments.json";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${access_token}`,
  };

  const report = fs.readFileSync(`output.txt`, `utf8`);
  console.log(report);
  const body = {
    content: report,
  };
          try {
            console.log(body.content);

            const response = await axios.post(url,body,{ headers });
            console.log(response);

          } catch (error) {
            console.log(error);
          }
}

export {postToBasecamp}
