import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

async function getAuthenticatedUserId() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  const payload = await verifySession(sessionToken);
  return payload?.userId || null;
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Determine file extension
    const contentType = file.type || "image/png";
    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      ext = "jpg";
    } else if (contentType.includes("webp")) {
      ext = "webp";
    } else if (contentType.includes("gif")) {
      ext = "gif";
    }

    const filename = `${userId}.${ext}`;

    // Check if we are running in mock mode
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const isMock = !supabaseUrl || !supabaseServiceKey || supabaseUrl === "placeholder-url" || supabaseServiceKey === "placeholder-key";

    let avatarUrl = "";

    if (isMock) {
      // Local dev mode: save to public/avatars/
      const uploadDir = path.join(process.cwd(), "public", "avatars");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      avatarUrl = `/avatars/${filename}?t=${Date.now()}`;
    } else {
      // Production mode: upload to Supabase Storage
      let uploadResult = await supabase.storage
        .from("avatars")
        .upload(filename, buffer, {
          contentType,
          upsert: true,
        });

      // If bucket doesn't exist, create it and retry upload
      if (uploadResult.error && uploadResult.error.message?.toLowerCase().includes("not found")) {
        console.log("Bucket 'avatars' not found. Creating bucket...");
        try {
          const { error: createError } = await supabase.storage.createBucket("avatars", {
            public: true,
          });
          if (createError) throw createError;

          // Retry upload
          uploadResult = await supabase.storage
            .from("avatars")
            .upload(filename, buffer, {
              contentType,
              upsert: true,
            });
        } catch (bucketErr) {
          console.error("Failed to create bucket or retry upload:", bucketErr);
          return NextResponse.json({ error: "Storage setup failed: " + (bucketErr instanceof Error ? bucketErr.message : "Cannot create bucket") }, { status: 500 });
        }
      }

      if (uploadResult.error) {
        console.error("Supabase storage upload error:", uploadResult.error);
        return NextResponse.json({ error: "Storage upload failed: " + uploadResult.error.message }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filename);

      avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
    }

    // Update profile settings with the new avatarUrl
    const { data: profile } = await supabase
      .from("profiles")
      .select("settings")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      const settings = profile.settings || {};
      settings.avatarUrl = avatarUrl;
      await supabase
        .from("profiles")
        .update({ settings })
        .eq("id", userId);
    }

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err) {
    console.error("Avatar upload API error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 });
  }
}
