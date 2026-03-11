# Test Tutor API

Let's test the API endpoint directly to see what's happening.

First, let's get a tutor ID from the database:

```sql
SELECT id, name FROM tutors LIMIT 1;
```

Then test the API endpoint:
- Visit: http://localhost:3000/api/tutors/[TUTOR_ID]

If that works, then the issue is with the frontend routing.