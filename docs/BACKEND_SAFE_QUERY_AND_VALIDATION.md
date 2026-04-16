# Backend Safe Query and Validation

This document describes how runtime API errors (e.g. `Incorrect arguments to mysqld_stmt_execute`, unexpected 500s, invalid query parameters) are eliminated and prevented from recurring.

---

## 1. Root Cause Summary

| Issue | Cause | Fix |
|-------|--------|-----|
| **mysqld_stmt_execute / ER_WRONG_ARGUMENTS** | MySQL does not accept bound parameters for `LIMIT`/`OFFSET` in prepared statements in many drivers/configurations. Using `LIMIT ?` and `OFFSET ?` with bound values can trigger this error. | Never bind LIMIT/OFFSET with `?`. Use sanitized integer literals (e.g. `safeLimit()` / `safeOffset()`) and embed them in the SQL string. |
| **Parameter count mismatch** | Number of `?` placeholders in SQL does not match the length of the params array. | Central `safeQuery.execute()` asserts placeholder count equals params length before running any query. |
| **Invalid parameter values** | `undefined` or `NaN` in the params array passed to `pool.execute()`. | Validate/coerce all inputs in middleware; `validateParams()` / `assertSafeParams()` reject invalid params before execution. |
| **Raw MySQL errors to client** | Uncaught DB errors or 500 responses that leak driver messages. | All DB calls go through `safeQuery`; errors are caught and converted to safe messages. `errorHandler` middleware never sends raw MySQL errors to the client. |

---

## 2. Validation Strategy

- **Validate before DB:** All user-derived inputs (`req.query`, `req.body`, `req.params`) are validated and coerced in middleware **before** any SQL runs.
- **No DB on invalid input:** If validation fails, the API returns **400** with a clear message; no SQL is executed.
- **Type coercion:** Strings → numbers, month names → allowed values, optional vs required, min/max and defaults are applied in one place (e.g. `validateInput.js`).
- **Reusable schemas:** Endpoints that share the same shape (e.g. IB history vs export) use dedicated schemas (e.g. `ibHistoryQuerySchema`, `ibExportHistoryQuerySchema`) so limit defaults and bounds can differ (e.g. limit default 50 vs 500).

---

## 3. Safe SQL Execution Rules

1. **Never bind LIMIT or OFFSET with `?`**  
   Use `safeLimit(value, default, min, max)` and `safeOffset(value, default, max)` to obtain integers, then build SQL with literals:  
   `LIMIT ${lim} OFFSET ${off}`.

2. **Placeholder count must match params**  
   `safeQuery.assertSafeParams(sql, params)` (and thus `execute()`) checks that the number of `?` in the SQL equals `params.length`.

3. **No undefined or NaN in params**  
   `validateParams()` / `assertSafeParams()` ensure every element is valid for MySQL binding.

4. **Central execution**  
   All prepared-statement execution goes through `safeQuery.execute(sql, params)`. Raw queries that use no placeholders (e.g. with `pool.escape()` and literal LIMIT) use `safeQuery.query(sql)`. Both paths catch DB errors and rethrow with `statusCode` and `code` for the error handler.

---

## 4. Middleware and Helpers

### 4.1 `backend/utils/safeQuery.js`

- **`countPlaceholders(sql)`** – Counts `?` in SQL (ignoring inside quoted strings).
- **`safeLimit(value, defaultVal, minVal, maxVal)`** – Returns a safe integer for LIMIT.
- **`safeOffset(value, defaultVal, maxVal)`** – Returns a safe integer for OFFSET.
- **`validateParams(params)`** – Returns `{ valid, invalidIndex }`; no undefined/NaN.
- **`assertSafeParams(sql, params)`** – Throws if placeholder count or params are invalid.
- **`execute(sql, params)`** – Asserts, runs `pool.execute()`, catches errors and maps to safe API errors (e.g. 400 for invalid params, 500 for DB_ERROR).
- **`query(sql)`** – For queries with no placeholders; same error handling.

### 4.2 `backend/middleware/validateInput.js`

- **`validate(schema, source)`** – Generic middleware: `source` is `'query' | 'body' | 'params'`. Validates and coerces using `schema`; sets `req.validated[source]`. On failure sends 400 and does not call `next()`.
- **`validateIbHistoryQuery`** – Validates IB history GET query (bulan, tahun, limit) with default limit 50.
- **`validateIbExportHistoryQuery`** – Same shape with default limit 500 for export.

### 4.3 `backend/middleware/errorHandler.js`

- Handles errors with `statusCode` (e.g. 400, 500) and `code` (e.g. `INVALID_QUERY_PARAMS`, `DB_ERROR`).
- Maps `ER_WRONG_ARGUMENTS` / `mysqld_stmt_execute` to 400 "Invalid query parameters".
- Never sends raw MySQL errors or stack traces to the client in production.

---

## 5. Example: Previously Failing Endpoint Now Fixed

**Endpoint:** `GET /api/ib/history?bulan=...&tahun=...&limit=...`  
**Previous behaviour:** 500 with "Incorrect arguments to mysqld_stmt_execute" when `limit` (or other params) were invalid or when LIMIT was bound with `?`.

**Current behaviour:**

1. **Route** (`backend/routes/ib.js`): Uses `validateIbHistoryQuery` before the controller. Invalid query → 400, no DB call.
2. **Controller** (`backend/controllers/ibController.js`): Reads only `req.validated.query` (validated and coerced). Builds SQL with `pool.escape()` for bulan/tahun and `safeLimit(v.limit, 50, 10, 200)` as a literal in `LIMIT ${limitVal}`. Runs the query via `safeQuery.query(sql)` (no placeholders for LIMIT).
3. **Errors:** Any DB error is caught inside `safeQuery` and rethrown with a safe message; `errorHandler` returns 400 or 500 without exposing MySQL details.

**Export** (`GET /api/ib/export/history`) uses the same pattern with `validateIbExportHistoryQuery` and a higher default/cap for `limit` (500 default, 2000 max).

---

## 6. Hard Rule

**If an input can crash MySQL, the request must be rejected before reaching the database.**

- Validate and coerce in middleware.
- Use only safe literals for LIMIT/OFFSET.
- Run all prepared statements through `safeQuery.execute()` with validated params.
- Never expose raw MySQL errors to the client.
