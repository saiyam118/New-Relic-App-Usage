import fs from "fs";
import csv from "csv-parser";
import { Parser } from "json2csv";
import axios from "axios";
import moment from "moment";
import sendEmail from "./notify.js";
// import sendFailureMail from "./notify.js"
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY; // Use API_KEY from .env
const ACCOUNT_ID = process.env.ACCOUNT_ID; // Use ACCOUNT_ID from .env

const reportDate = process.argv[2]
  ? moment(process.argv[2], "YYYY-MM-DD 11:00:00+0530")
  : moment(); // Use the provided date or default to today
const today = reportDate.format("YYYY-MM-DD 11:00:00+0530");
const today_formatted = reportDate.format("YYYY-MM-DD");
const yesterday = reportDate
  .clone()
  .subtract(1, "day")
  .format("YYYY-MM-DD 11:00:00+0530");
const yesterday_formatted = reportDate.subtract(1, "day").format("YYYY-MM-DD");


// Queries to New Relic API
const queries = [
  `{ actor { account(id: ${ACCOUNT_ID}) { nrql(query: \"SELECT max(aws.ecs.runningCount.byService) AS 'Running Task Count' FROM Metric Where aws.ecs.ClusterName = 'dls-cup-prod1-apps' FACET aws.ecs.ServiceName LIMIT MAX SINCE '${yesterday}' UNTIL '${today}'\") { results } } } }`,
  `{ actor { account(id: ${ACCOUNT_ID}) { nrql(query: \"SELECT max(aws.ecs.runningCount.byService) AS 'Running Task Count' FROM Metric Where aws.ecs.ClusterName = 'dls-cup-prod1' FACET aws.ecs.ServiceName LIMIT MAX SINCE '${yesterday}' UNTIL '${today}'\") { results } } } }`,
  `{ actor { account(id: ${ACCOUNT_ID}) { nrql(query: \"SELECT max(aws.ecs.runningCount.byService) AS 'Running Task Count' FROM Metric Where aws.ecs.ClusterName = 'dls-cup-prod1-builder' FACET aws.ecs.ServiceName LIMIT MAX SINCE '${yesterday}' UNTIL '${today}'\") { results } } } }`,
];

const delay = (delaytime) => {
  return new Promise((resolve) => setTimeout(resolve, delaytime));
};

// Function to fetch query results from New Relic

async function sendrequest(queryObject, retries) {
  for (let i = 0; i < retries; i++) {
    console.log('Retry attempt: ' + (i + 1));
    await delay(5000);
    
    try {
      const response = await axios.post(
        "https://api.eu.newrelic.com/graphql",
        { query: queryObject },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "API-Key": API_KEY,
          },
        }
      );

      // Check if response contains expected data
      if (response.data.data.actor.account.nrql != null) {
        console.log("Successful response received.");
        return response;
      } else {
        console.log("Response does not contain expected data.");
      }
      
    } catch (error) {
      console.log(`Request failed on attempt ${i + 1}: ${error.message}`);
    }
  }

  console.log("All retries exhausted.");
  return null;
}

async function fetchQueryResults() {
  const results = [];

  for (const queryObject of queries) {
    console.log(
      "=============================================================="
    );

    // const response = await axios.post(
    //   "https://api.eu.newrelic.com/graphql",
    //   { query: queryObject },
    //   {
    //     headers: {
    //       "Content-Type": "application/json",
    //       Accept: "application/json",
    //       "API-Key": API_KEY,
    //     },
    //   }
    // );
    const response = await sendrequest(queryObject, 3); 
    // Store the response data
    //error handling

    if (response == null) {
      //send failure mail
      await sendEmail(1);
      throw new Error("Error in getting data");
    } else {
      results.push(response.data);
      await delay(10000);
    }
  }
  return results;
}

// Function to load max tasks data from CSV
function loadMaxTasksFromCSV(filePath, callback) {
  const maxTasks = {};

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      maxTasks[row.Worker] = parseInt(row.MaxTasks, 10);
    })
    .on("end", () => {
      console.log("Max tasks data loaded:");
      callback(maxTasks);
    });
}

function processAndSaveOutput(queryData, maxTasks) {
  let outputData = [];

  // Add the report date to the beginning of the output data
  const reportHeader = `Report Date: ${yesterday} - ${today} \n`;
  outputData.push({ Output: reportHeader });

  // Loop through each query result in queryData
  queryData.forEach((queryResult, index) => {
    console.log(`Processing query result ${index + 1}:`);

    // Add a label for each query result (First Query, Second Query, etc.)
    const queryLabel =
      index === 0
        ? "Data Format: (MaxCount,Threshold) \n\nApp Cluster "
        : index == 1
        ? "Microservices"
        : "\nBuilder";
    outputData.push({ Output: queryLabel });

    // Create queryOutput array with status messages
    let queryOutput = queryResult.data.actor.account.nrql.results
      .filter((result) => {
        // Only include workers that are present in the maxTasks object
        return maxTasks.hasOwnProperty(result["facet"]);
      })
      .map((result) => {
        const workerName = result["facet"];
        const maxCount = result["Running Task Count"];
        const threshold = maxTasks[workerName];

        let statusMessage = "";

        if (threshold !== "Unknown") {
          if (maxCount == threshold) {
            statusMessage = "Max threshold reached";
          } else if (maxCount > threshold) {
            statusMessage = "Please update the threshold value";
          } else if (maxCount > 0.8 * threshold) {
            statusMessage = "Warning: 80% threshold reached";
          }
        }

        return {
          Output: `${workerName}: (${maxCount}, ${threshold})  ${statusMessage}`,
          StatusPriority:
            statusMessage === "Max threshold reached"
              ? 1
              : statusMessage === "Warning: 80% threshold reached"
              ? 2
              : statusMessage == "Please update the threshold value"
              ? 3
              : 4,
        };
      });

    // Sort queryOutput based on StatusPriority
    queryOutput.sort((a, b) => a.StatusPriority - b.StatusPriority);

    // Combine the sorted output of all queries
    outputData = outputData.concat(
      queryOutput.map((item) => ({ Output: item.Output }))
    );

    // After the first query's data, add a separator line on its own
    if (index === 0) {
      outputData.push({ Output: "" });
    }
  });

  const json2csvParser = new Parser({ fields: ["Output"] });
  let csvData = json2csvParser.parse(outputData);

  // Remove all quotes from the CSV data
  csvData = csvData.replace(/"/g, "");

  fs.writeFileSync("output.txt", csvData, "utf8");
  console.log("CSV file has been saved.");
}

// Main logic to load tasks and fetch & process query results
async function main() {
  const maxTasksFile = `max_tasks.csv`;

  loadMaxTasksFromCSV(maxTasksFile, async (maxTasks) => {
    try {
      const results = await fetchQueryResults();
      console.log("Fetched query results:");

      processAndSaveOutput(results, maxTasks);

      // Send email after processing the data
      await sendEmail(0);
      console.log("Email sent successfully.");
      //send to basecamp
      //await posttobasecamp();
      //console.log("posted to basecamp")
    } catch (error) {
      console.log(error);
    }
  });
}

// Call the main function
main();
