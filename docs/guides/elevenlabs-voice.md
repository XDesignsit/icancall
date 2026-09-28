# ElevenLabs voice and environment configuration

Moved verbatim from AGENTS.md (was section 4 of Billing, Branding & Layout Guardrails).

## ElevenLabs Voice & Environment Configurations
- **Vercel Environment Keys**: Dynamic audio features require `ELEVENLABS_API_KEY`. If setting up a new deployment or environment, verify that this key is propagated using Vercel CLI (`vercel env add ELEVENLABS_API_KEY`) to prevent server-side TTS generation failures.
- **Accents & Genders Mapping**: When listing voice models in the settings dropdown, group options using `<optgroup>` corresponding to each of the application's supported selector languages (EN, ES, FR, JA, ZH, AR, HI, PT, DE, IT, KO). Ensure each language group contains both a **Female** and a **Male** voice choice.
- **Robust Voice IDs**: Rely on standard premade voice IDs that exist on all ElevenLabs account tiers (e.g., Rachel `21m00Tcm4TlvDq8ikWAM`, Drew `29vD33N1CtxCmqQRPOHJ`, Clyde `2EiwWnXF2V4j29thjbwy`, Paul `5Q0t7uMcgp8Aagzh1ZQQ`, Adam `pNInz6obpgmx5142qiA7`, Jessica `cgSgspJ2msm6clMCxT41`, Brian `nPczCjzI2devA2R17O2Y`, Sarah `EXAVITQu4vr4xnSDxMaL`). Avoid custom/private voice IDs that require the API key to have `voices_read` scopes, as production keys are often restricted to write-only text-to-speech access.
