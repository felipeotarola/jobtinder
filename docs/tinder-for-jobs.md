# Tinder for Jobs API

## Arbetsformedlingen JobSearch API summary

Base URL: `https://jobsearch.api.jobtechdev.se`

Key endpoints:
- `GET /search` - search current job ads. Supports free text `q` plus filters like `occupation-field`, `region`, `municipality`, `country`, `remote`, `limit`, `offset`, and `resdet` (`full` or `brief`). Response JSON contains `total`, `hits`, and timing metadata.
- `GET /complete` - typeahead suggestions for free text queries.
- `GET /ad/{id}` - fetch a single ad by id with full details.
- `GET /ad/{id}/logo` - employer logo for an ad.

Authentication:
- The official docs note that an API key is required for the Swagger UI and heavy usage. Provide it via an HTTP header (commonly `X-API-Key`). This service reads `JOBTECH_API_KEY` and sends it in the header defined by `JOBTECH_API_KEY_HEADER` (defaults to `X-API-Key`).

Responses:
- JSON for `/search` and `/ad/{id}`. Successful search responses include `total`, `hits`, and `freetext_concepts`. Errors include standard HTTP codes like `400`, `404`, `429`, and `500`.

## Local service behavior

This service caches JobSearch results in SQLite (`data/job-cache.sqlite`) and stores swipes there.

Environment variables:
- `JOBTECH_API_KEY` (optional) - JobSearch API key.
- `JOBTECH_API_KEY_HEADER` (optional) - header name for the key (default `X-API-Key`).
- `JOBTECH_BASE_URL` (optional) - overrides the JobSearch base URL.
- `JOB_CACHE_TTL_SECONDS` (optional) - cache TTL for search results (default `300`).

## Endpoints

### GET `/api/jobs`
Fetches job cards from JobSearch, caches results, and returns a simplified card format.

Query params:
- `q` or `keywords`: free text keywords.
- `location`: free text location; appended to `q`.
- `category`: free text category; appended to `q`.
- `categoryId`: taxonomy concept id for occupation field (mapped to `occupation-field`).
- `region`, `municipality`, `country`: taxonomy concept ids for geography.
- `remote`: `true` or `false`.
- `limit`: number of results (1-100, default 20).
- `offset`: pagination offset.
- `resdet`: `full` or `brief` (default `full`).

Response (excerpt):
```json
{
  "source": "jobtech",
  "cached": false,
  "total": 6789,
  "count": 20,
  "jobs": [
    {
      "id": "12345678",
      "headline": "Backend Developer",
      "employer": { "name": "Example AB" },
      "location": {
        "municipality": "Stockholm",
        "region": "Stockholms lan",
        "country": "Sverige",
        "city": "Stockholm",
        "coordinates": [59.33, 18.06]
      },
      "logoUrl": "https://...",
      "url": "https://...",
      "applicationDeadline": "2026-02-15",
      "publishedAt": "2026-01-22T08:12:33",
      "excerpt": "Short text from the description...",
      "swipe": null
    }
  ]
}
```

### POST `/api/jobs/{id}/swipe`
Stores a swipe decision for a job.

Body:
```json
{ "direction": "right" }
```

Behavior:
- If the job is not yet cached, the service fetches `/ad/{id}` from JobSearch and stores it.
- Writes the swipe to SQLite.

Response (excerpt):
```json
{
  "direction": "right",
  "job": { "id": "12345678", "headline": "Backend Developer", "swipe": "right" }
}
```

### GET `/api/jobs/liked`
Returns jobs swiped to the right.

Response (excerpt):
```json
{
  "count": 2,
  "jobs": [
    {
      "id": "12345678",
      "headline": "Backend Developer",
      "swipe": "right",
      "likedAt": 1769133564000
    }
  ]
}
```

## Example calls

Search with keywords and location:
```bash
curl "http://localhost:3000/api/jobs?q=python&location=stockholm&limit=10"
```

Swipe right:
```bash
curl -X POST "http://localhost:3000/api/jobs/12345678/swipe" \
  -H "Content-Type: application/json" \
  -d "{\"direction\":\"right\"}"
```

List liked jobs:
```bash
curl "http://localhost:3000/api/jobs/liked"
```
