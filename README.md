# TrainerCentral Update Workflow

This Cloudflare Worker project enables dynamic interaction with the **TrainerCentral API** to fetch and manage course, lesson, and material data. The Worker processes natural language commands (like "expand on all materials in each lesson of course 'X'") using **OpenAI GPT-4**, caches data in **KV namespaces**, and dynamically performs actions such as expanding course materials.

---

## Features

### 1. Natural Language Command Processing
- Accepts natural language commands via the `/command` endpoint.
- Uses **OpenAI GPT-4** to analyze intent and process requests.

### 2. TrainerCentral API Integration
- Fetches course, lesson, and material data dynamically from the **TrainerCentral API**.
- Fully supports hierarchical data retrieval:
  - Courses → Lessons → Materials.

### 3. KV Namespace Caching
- Caches fetched data in **Cloudflare KV** to reduce redundant API calls.
- Configurable TTL for cache expiration (default: 1 hour).

### 4. OpenAI GPT-4 Integration
- Expands on material text using **GPT-4**.
- Dynamically processes and enhances content for lessons and materials.

### 5. Error Handling
- Handles missing data, invalid commands, and API errors gracefully.
- Logs errors for debugging and troubleshooting.

---

## Endpoints

### 1. `POST /command`
Processes a command in natural language to fetch, cache, and expand on course materials.

#### Example Request
```json
{
  "command": "Expand on all materials in each of the lessons in course 'Introduction to Programming'."
}
```

Example Response
```
[
  {
    "materialId": "material123",
    "original": "This is a brief introduction.",
    "expanded": "This is a detailed and expanded explanation of the brief introduction provided earlier..."
  }
]
```

Setup Instructions

1. Pre-requisites
	•	Cloudflare account with Workers enabled.
	•	TrainerCentral API Key: Obtain an API key from your TrainerCentral account.
	•	OpenAI API Key: Obtain an API key for OpenAI GPT-4 from OpenAI.

2. Clone the Repository

```
git clone <your-repository-url>
cd trainercentral-update-workflow
```

3. Install Wrangler

Install the Cloudflare Wrangler CLI globally:

```
npm install -g wrangler
```

4. Configure wrangler.toml

Update the wrangler.toml file with your KV namespace binding and compatibility date:

```
name = "trainercentral-update-workflow"
main = "src/index.js"
workers_dev = true
compatibility_date = "2025-01-19"

kv_namespaces = [
  { binding = "KV", id = "your-kv-namespace-id" }
]
```

Replace your-kv-namespace-id with your actual KV Namespace ID.

5. Set Secrets

Add the necessary secrets for secure access:

```
wrangler secret put TRAINERCENTRAL_API_KEY
wrangler secret put OPENAI_API_KEY
wrangler secret put KV_NAMESPACE_ID
wrangler secret put CF_API_TOKEN
wrangler secret put CF_ACCOUNT_ID
```

6. Deploy the Worker

Deploy the Worker to Cloudflare:

```
npx wrangler deploy
```

How It Works

1. Command Processing
	•	The /command endpoint analyzes user input using GPT-4 to determine the intent of the command.
	•	Example:
	•	Command: "Expand on all materials in each of the lessons in course 'Introduction to Programming'."
	•	Intent: Fetch course data and expand all materials.

2. TrainerCentral Data Retrieval
	•	The Worker retrieves course data (courses, lessons, materials) from TrainerCentral.
	•	Uses the TrainerCentral API endpoints:
	•	/courses
	•	/courses/{courseId}/lessons
	•	/lessons/{lessonId}/materials

3. Caching in KV Namespace
	•	Data is cached in the KV namespace to reduce repetitive API calls.
	•	TTL (expirationTtl) is set to 1 hour by default.

4. OpenAI Material Expansion
	•	The Worker uses GPT-4 to expand on material text dynamically.
	•	GPT processes each material and returns enhanced content.

Example Workflow
	1.	User sends a command:

```
{
  "command": "Expand on all materials in each of the lessons in course 'X'."
}
```


	2.	Worker processes the command:
	•	Analyzes the intent using OpenAI.
	•	Fetches course, lesson, and material data from TrainerCentral.
	•	Caches the data in KV namespace (if not already cached).
	•	Expands materials using OpenAI GPT.
	3.	Response:

```
[
  {
    "materialId": "material123",
    "original": "This is a brief introduction.",
    "expanded": "This is a detailed and expanded explanation of the brief introduction provided earlier..."
  }
]
```

Environment Variables

Secret Name	Description
TRAINERCENTRAL_API_KEY	API key for TrainerCentral authentication.
OPENAI_API_KEY	API key for OpenAI GPT-4 integration.
KV_NAMESPACE_ID	Cloudflare KV namespace ID for caching.
CF_API_TOKEN	Cloudflare API token with KV read/write access.
CF_ACCOUNT_ID	Cloudflare account ID for KV operations.

Troubleshooting

Common Errors
	1.	Internal Server Error
	•	Cause: Missing or invalid API keys.
	•	Solution: Verify that all secrets are set correctly.
	2.	Command Not Recognized
	•	Cause: Unsupported or invalid command format.
	•	Solution: Ensure the command includes a course name in the format "course 'X'".
	3.	KV Namespace Issues
	•	Cause: KV namespace not configured or accessible.
	•	Solution: Verify the namespace ID in wrangler.toml and ensure proper permissions.

Logs and Debugging

To monitor logs, use:

```
npx wrangler tail
```

This streams logs for debugging errors or monitoring request flow.

Future Enhancements
	1.	Additional Commands
	•	Add support for more complex commands (e.g., update materials, delete lessons).
	2.	Improved Error Handling
	•	Implement detailed error messages for API failures and missing data.
	3.	Multi-Tenancy
	•	Allow commands to target multiple courses dynamically.

License

MIT License
