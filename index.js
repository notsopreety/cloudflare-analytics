const express = require("express");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { DateTime } = require("luxon");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Function to fetch Cloudflare Analytics
async function fetchCloudflareAnalytics(email, api_key, zone_id, days) {
    try {
        if (!email || !api_key || !zone_id) {
            throw new Error("Missing required fields");
        }

        // Ensure days is a number and at least 1
        days = isNaN(days) || days < 1 ? 7 : parseInt(days);

        // Define date range (past `days` days)
        const now = DateTime.utc().startOf("day");
        const startDateStr = now.minus({ days }).toISODate();
        const endDateStr = now.toISODate();

        // Set up headers
        const headers = {
            "X-Auth-Email": email,
            "X-Auth-Key": api_key,
            "Content-Type": "application/json",
        };

        // GraphQL query
        const query = `
        query GetZoneAnalytics($zoneTag: String!, $date_geq: String!, $date_lt: String!) {
            viewer {
                zones(filter: { zoneTag: $zoneTag }) {
                    totals: httpRequests1dGroups(limit: 10000, filter: { date_geq: $date_geq, date_lt: $date_lt }) {
                        uniq {
                            uniques
                        }
                    }
                    zones: httpRequests1dGroups(orderBy: [date_ASC], limit: 10000, filter: { date_geq: $date_geq, date_lt: $date_lt }) {
                        dimensions {
                            timeslot: date
                        }
                        uniq {
                            uniques
                        }
                    }
                }
            }
        }`;

        // Create request payload
        const payload = {
            query: query,
            variables: {
                zoneTag: zone_id,
                date_geq: startDateStr,
                date_lt: endDateStr,
            },
        };

        // Make API request
        const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Extract relevant data
        const zonesData = data?.data?.viewer?.zones[0];
        const totals = zonesData?.totals || [];
        const httpRequests = zonesData?.zones || [];

        // Calculate total unique visits
        const totalUniques = totals.reduce((sum, group) => sum + (group?.uniq?.uniques || 0), 0);

        // Prepare response with day names
        const result = {
            total_unique_visits: totalUniques,
            daily_breakdown: httpRequests.map(entry => ({
                date: entry.dimensions.timeslot,
                day: DateTime.fromISO(entry.dimensions.timeslot).toFormat("EEEE"), // Convert to day name
                unique_visits: entry.uniq.uniques,
            })),
        };

        return result;
    } catch (error) {
        throw new Error(error.message);
    }
}

// POST Endpoint
app.post("/api/cloudflare-analytics", async (req, res) => {
    const { email, api_key, zone_id, days } = req.body;
    try {
        const data = await fetchCloudflareAnalytics(email, api_key, zone_id, days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Endpoint (Same Functionality as POST)
app.get("/cfa", async (req, res) => {
    const { email, api_key, zone_id, days } = req.query;
    try {
        const data = await fetchCloudflareAnalytics(email, api_key, zone_id, days);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
