// Import required modules
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { DateTime } = require('luxon');

// Cloudflare API credentials
const API_KEY = 'YOUR_API_KEY';
const ZONE_ID = 'YOUR_ZONE_ID';
const API_EMAIL = 'YOUR_EMAIL';

// Get number of days from command-line argument (default: 7)
const args = process.argv.slice(2);
const days = args.length > 0 && !isNaN(args[0]) ? parseInt(args[0]) : 7;

// Ensure days is at least 1
const validDays = Math.max(days, 1);

// Define date range
const now = DateTime.utc().startOf('day');
const startDate = now.minus({ days: validDays });
const endDate = now;

// Date format (YYYY-MM-DD)
const startDateStr = startDate.toISODate();
const endDateStr = endDate.toISODate();

// Set up headers
const headers = {
  'X-Auth-Email': API_EMAIL,
  'X-Auth-Key': API_KEY,
  'Content-Type': 'application/json',
};

// GraphQL query with date range filter
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
}
`;

// Create request body
const payload = {
  query: query,
  variables: {
    zoneTag: ZONE_ID,
    date_geq: startDateStr,
    date_lt: endDateStr,
  },
};

// Function to fetch analytics data
async function fetchAnalytics() {
  try {
    console.log(`\nFetching Cloudflare analytics for the past ${validDays} days...\n`);

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract data safely
    const zonesData = data?.data?.viewer?.zones[0];
    const totals = zonesData?.totals || [];
    const httpRequests = zonesData?.zones || [];

    // Calculate total unique visits
    const totalUniques = totals.reduce((sum, group) => sum + (group?.uniq?.uniques || 0), 0);

    // Display results
    console.log(`📊 Total Unique Visits from ${startDateStr} to ${endDateStr}: ${totalUniques}\n`);

    console.log("📅 Daily Breakdown:");
    console.log("------------------------------");

    httpRequests.forEach(entry => {
      const date = entry.dimensions.timeslot;
      const day = DateTime.fromISO(date).toFormat("EEEE"); // Convert to day name
      const uniqueVisits = entry.uniq.uniques;
      console.log(`📅 ${day} (${date}): ${uniqueVisits} unique visits`);
    });

    console.log("\n✅ Fetching completed successfully.\n");

  } catch (error) {
    console.error(`❌ Error fetching Cloudflare analytics: ${error.message}`);
  }
}

// Execute the function
fetchAnalytics();
