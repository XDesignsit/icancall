# Local development mocks (database and external services)

Moved verbatim from AGENTS.md.

## Mocking Database Clients in Local Development
When creating local mock shims for database clients (such as Supabase) to support unconfigured or offline local development:
- **Deferred Chain Execution**: Emulate the synchronous/asynchronous mechanics of the target library's builder chain. Chained action and filter methods (e.g., `select`, `eq`, `not`, `insert`, `update`, `upsert`, `delete`) must return the query builder object synchronously. Defer actual execution (such as reading/writing local JSON files) to the builder's `then()` method (which acts as the awaitable Promise hook). This prevents subsequent chained methods from throwing `TypeError: ... is not a function`.
- **Immediate Cache Invalidation**: Ensure that any endpoint or controller modifying settings or lines explicitly invalidates the associated cache key to prevent webhooks or background processes from reading stale cache values.

## Mocking External Services in Local Development
When credentials for external messaging providers (SMTP or Twilio) are missing or unconfigured in the local environment:
- **Fail-Open SMTP Fallback**: The email dispatch system (`sendEmail` in `src/lib/mail.ts`) must gracefully mock transmission, log the simulated message details to the console, and return `{ success: true, messageId: ... }` rather than letting connection failures throw exceptions.
- **Graceful Twilio SMS Fallback**: The SMS dispatch system (`sendSms` in `src/lib/twilio.ts`) must check for client initialization, log a warning if absent, and return gracefully. Webhooks calling it must handle uninitialized states to prevent returning 500 errors to caller gateways during testing.
