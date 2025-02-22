# Cloudflare Analytics API

This project provides a simple API to fetch Cloudflare analytics data using GraphQL. It includes endpoints for retrieving unique visitors over a specified date range.

## Features

- Fetch Cloudflare analytics data via GraphQL.
- Supports both **POST** and **GET** requests (`/cloudflare-analytics` and `/cfa`).
- Allows dynamic date range selection (default: past 7 days).
- Provides a test script (`test.js`) for quick local verification.

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/notsopreety/cloudflare-analytics.git
   cd cloudflare-analytics
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Run the API server:**
   ```sh
   node index.js
   ```

## API Usage

### 1. **POST `/cloudflare-analytics`**
   Fetch analytics using a POST request.

   - **Request Body (JSON):**
     ```json
     {
       "email": "your-email@example.com",
       "api_key": "your-api-key",
       "zone_id": "your-zone-id",
       "days": 7
     }
     ```
     - `days` (optional) – Number of past days to fetch data (default: 7).

   - **Response (Example):**
     ```json
     {
       "total_uniques": 12345,
       "daily_breakdown": [
         { "date": "2025-02-15", "unique_visits": 2500 },
         { "date": "2025-02-16", "unique_visits": 2300 }
       ]
     }
     ```

### 2. **GET `/cfa`**
   Fetch analytics using a GET request.

   - **Query Parameters:**
     ```
     /cfa?email=your-email@example.com&api_key=your-api-key&zone_id=your-zone-id&days=7
     ```

   - **Response:**
     Same as `/cloudflare-analytics`.

## Test Script (`test.js`)

You can test Cloudflare Analytics data directly using `test.js`.

### Running the Test:
```sh
node test.js
```

### Expected Output:
```sh
Total Unique Visits from 2025-02-15 to 2025-02-22: 12345
Daily Breakdown:
Date: 2025-02-15, Unique Visits: 2500
Date: 2025-02-16, Unique Visits: 2300
...
```

## Environment Variables

Instead of hardcoding API credentials, you can use `.env`:

```sh
CLOUDFLARE_EMAIL=your-email@example.com
CLOUDFLARE_API_KEY=your-api-key
CLOUDFLARE_ZONE_ID=your-zone-id
```

Then modify your `index.js` to use `dotenv`:

```js
require('dotenv').config();
const API_EMAIL = process.env.CLOUDFLARE_EMAIL;
const API_KEY = process.env.CLOUDFLARE_API_KEY;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
```

## Contribution

Feel free to fork the repository and contribute improvements. Open a pull request with your changes.

## License

This project is licensed under the MIT License.