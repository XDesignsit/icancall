const { signSession, verifySession } = require("../src/lib/session");

async function run() {
  try {
    const payload = {
      email: "support@icancall.co",
      role: "user",
      expiresAt: Date.now() + 10000
    };
    
    console.log("Signing payload:", payload);
    const token = await signSession(payload);
    console.log("Generated Token:", token);
    
    const verified = await verifySession(token);
    console.log("Verified Payload:", verified);
    
    if (verified && verified.email === payload.email) {
      console.log("SUCCESS: Session works perfectly!");
    } else {
      console.error("FAIL: Verification returned mismatch or null.");
    }
  } catch (err) {
    console.error("CRITICAL ERROR during execution:", err);
  }
}

run();
