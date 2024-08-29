const express = require("express");
const puppeteer = require("puppeteer");
const XLSX = require("xlsx"); // Import the xlsx package
const cors = require('cors');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.post("/search", async (req, res) => {
  const { searchQuery } = req.body;
  let browser = null;

  try {
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
      await page.goto("https://www.facebook.com/", { waitUntil: "networkidle2" });
      await page.type("#email", process.env.FB_EMAIL);
      await page.type("#pass", process.env.FB_PASSWORD);
      await page.click('button[name="login"]');
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      const searchUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(searchQuery)}`;
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 60000 });

      // Wait for the initial content to load
      await page.waitForSelector('div[role="feed"]', { timeout: 40000 });

      // Click the "See All" button, if present
      await page.evaluate(async () => {
        const seeAllButtons = Array.from(document.querySelectorAll('button'))
          .filter(button => button.innerText.includes('See All'));

        if (seeAllButtons.length > 0) {
          seeAllButtons[0].click();
        }
      });

      // Wait for additional content to load after clicking "See All"
      await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust timeout as necessary

      const data = await page.evaluate((feedSelector) => {
        const results = [];
        const items = document.querySelectorAll(feedSelector);

        items.forEach((item) => {
          const text = item.innerText || "";
          const lines = text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line);

          const result = {
            name: lines[0] || "",
            category: lines[1] || "",
            followers: lines.find((line) => line.includes("followers")) || "",
            description: lines.slice(2, -2).join(" ") || "",
            recent_activity: lines.find((line) => line.includes("posts")) || "",
            action: lines[lines.length - 1] || "",
          };

          const cleanDescription = result.description
            .replace(/Facebook|Join|See all|Add Friend|Like|Comment|Send|Share/g, "")
            .trim();

          results.push({
            name: result.name,
            category: result.category,
            followers: result.followers,
            description: cleanDescription,
            recent_activity: result.recent_activity,
            action: result.action,
          });
        });

        return results;
      }, 'div[role="feed"]');

      console.log(JSON.stringify(data, null, 2));

      // Convert JSON data to a worksheet using xlsx
      const ws = XLSX.utils.json_to_sheet(data);

      // Create a new workbook and append the worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SearchResults");

      // Create a buffer from the workbook
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

      // Encode the buffer to Base64
      const excelBase64 = excelBuffer.toString('base64');

      // Send the Base64 encoded Excel file along with the JSON data
      res.send({ excelBuffer: excelBase64, data: JSON.stringify(data, null, 2) });

      console.log("Excel file and data sent to frontend");
    } catch (error) {
      console.error("Error occurred during Puppeteer operations:", error);
      await page.screenshot({ path: "error_screenshot.png", fullPage: true });
      if (!res.headersSent) {
        res.status(500).json({ error: "An error occurred during Puppeteer operations" });
      }
    }
  } catch (error) {
    console.error("Error occurred while launching Puppeteer:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred while launching Puppeteer" });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


