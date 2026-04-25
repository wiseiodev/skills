# Adversarial Review — Sample Output

## Review Summary

| Metric | Value |
|--------|-------|
| Iterations | 2 |
| Total findings | 7 |
| Critical | 1 |
| Major | 2 |
| Minor | 3 |
| Nitpick | 1 |

## Critical

### F1: SQL injection via unsanitized hotel name parameter
- **File:** `src/features/rates/lib/queries.ts:87`
- **Agreed by:** A, B
- **Detail:** The `hotelName` parameter is interpolated directly into the SQL query string without parameterization. An attacker could inject arbitrary SQL via the search form.
- **Fix:**
```typescript
// Before
const result = await db.execute(sql`SELECT * FROM rates WHERE hotel_name = '${hotelName}'`);

// After
const result = await db.execute(sql`SELECT * FROM rates WHERE hotel_name = ${hotelName}`);
```

## Major

### F2: Race condition in rate update
- **File:** `src/features/rates/actions/update-rate.ts:34`
- **Agreed by:** A, B
- **Detail:** The read-then-write pattern has no optimistic locking. Two concurrent updates will silently overwrite each other.
- **Fix:** Add a `version` column and check it in the UPDATE WHERE clause.

### F3: Missing soft-delete filter in competitor query
- **File:** `src/features/competitors/lib/queries.ts:22`
- **Agreed by:** B (A missed this)
- **Detail:** Query returns deleted competitors because `isNull(competitors.deletedAt)` filter is missing.
- **Fix:** Add `.where(isNull(competitors.deletedAt))` to the query.

## Minor

### F4-F6: Various naming and error message improvements
- F4: Misleading variable name `data` should be `rates` (nitpick upgraded to minor by B)
- F5: Error message "Failed" should include the actual error (agreed)
- F6: Unused import of `eq` operator (agreed)

## Resolved Disagreements

| Finding | Resolution |
|---------|-----------|
| B4 (major): "No rate limiting on API" | Resolved: A correctly noted rate limiting is handled by middleware in `src/lib/orpc/middleware.ts`. Downgraded to not-an-issue. |

## Applied Fixes

- [x] F1 — SQL injection fixed
- [x] F3 — Soft-delete filter added
- [ ] F2 — Race condition (requires schema migration, created issue)
