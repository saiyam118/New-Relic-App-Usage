import data from "./params.js";
import fs from "fs";
import axios from "axios";
import { time } from "console";
import moment from "moment";

let access_token = data.access_token;
let refresh_token = data.refresh_token;
let creation_date = data.day_created

function checkAndUpdateExpiresIn(){
  const currentDate = moment().format("YYYY-MM-DD");
  const curr_day = moment().format("DD");
  const curr_mon = moment().format("MM");
  let creation_day = moment(creation_date).format("DD");
  let creation_mon = moment(creation_date).format("MM");
  if(curr_mon != creation_mon) {
    //create new token and set the value of day_created


    //change value of day_created
    data.day_created = moment().format("YYYY-MM-DD");
    saveParams();
  }
  else {
    if(curr_day - creation_day <= 10){
      //token valid
      console.log("token valid");
      
    } else {
      //create new token and set the value of day_created


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
