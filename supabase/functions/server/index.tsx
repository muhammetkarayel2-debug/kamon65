import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();
app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const PREFIX = "/make-server-e2702d20";

function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
}

async function getUser(c: any): Promise<{ id: string } | null> {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  const sb = adminClient();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return { id: data.user.id };
}

/* ── Storage Init ── */
const BUCKET_NAME = "make-e2702d20-docs";
let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const sb = adminClient();
  const { data: buckets } = await sb.storage.listBuckets();
  const exists = buckets?.some((b: any) => b.name === BUCKET_NAME);
  if (!exists) {
    await sb.storage.createBucket(BUCKET_NAME, { public: false });
  }
  bucketReady = true;
}

/* ── Health ── */
app.get(`${PREFIX}/health`, (c) => c.json({ status: "ok" }));

/* ── Signup ── */
app.post(`${PREFIX}/signup`, async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    if (!email || !password) return c.json({ error: "Email ve şifre gerekli" }, 400);
    const sb = adminClient();
    const { data, error } = await sb.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || "" },
      email_confirm: true,
    });
    if (error) {
      console.log("Signup error:", error.message);
      return c.json({ error: error.message }, 400);
    }
    return c.json({ userId: data.user.id });
  } catch (e: any) {
    console.log("Signup exception:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

/* ── Company CRUD ── */
// List user companies
app.get(`${PREFIX}/companies`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const companies = (await kv.getByPrefix(`company:${user.id}:`)) || [];
    return c.json({ companies });
  } catch (e: any) {
    console.log("Error listing companies:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Create/update company
app.post(`${PREFIX}/companies`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const companyId = body.id || crypto.randomUUID();
    const companyData = {
      ...body,
      id: companyId,
      userId: user.id,
      updatedAt: new Date().toISOString(),
      createdAt: body.createdAt || new Date().toISOString(),
    };
    await kv.set(`company:${user.id}:${companyId}`, companyData);
    return c.json({ company: companyData });
  } catch (e: any) {
    console.log("Error saving company:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Get single company
app.get(`${PREFIX}/companies/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const companyId = c.req.param("id");
    const data = await kv.get(`company:${user.id}:${companyId}`);
    if (!data) return c.json({ error: "Company not found" }, 404);
    return c.json({ company: data });
  } catch (e: any) {
    console.log("Error getting company:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Delete company
app.delete(`${PREFIX}/companies/:id`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const companyId = c.req.param("id");
    await kv.del(`company:${user.id}:${companyId}`);
    // Also delete associated process data
    await kv.del(`process:${user.id}:${companyId}`);
    return c.json({ ok: true });
  } catch (e: any) {
    console.log("Error deleting company:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

/* ── Process / Status Tracking ── */
app.get(`${PREFIX}/process/:companyId`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const companyId = c.req.param("companyId");
    const data = await kv.get(`process:${user.id}:${companyId}`);
    return c.json({ process: data || null });
  } catch (e: any) {
    console.log("Error getting process:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

app.post(`${PREFIX}/process/:companyId`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const companyId = c.req.param("companyId");
    const body = await c.req.json();
    const processData = {
      ...body,
      companyId,
      userId: user.id,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`process:${user.id}:${companyId}`, processData);
    return c.json({ process: processData });
  } catch (e: any) {
    console.log("Error saving process:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

/* ── Document Upload ── */
app.post(`${PREFIX}/documents/upload`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    await ensureBucket();
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const companyId = formData.get("companyId") as string;
    const docType = formData.get("docType") as string;
    if (!file || !companyId || !docType) return c.json({ error: "file, companyId, docType gerekli" }, 400);

    const sb = adminClient();
    const path = `${user.id}/${companyId}/${docType}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await sb.storage.from(BUCKET_NAME).upload(path, file, { upsert: true });
    if (uploadError) {
      console.log("Upload error:", uploadError.message);
      return c.json({ error: uploadError.message }, 500);
    }

    // Save doc metadata
    const docMeta = {
      path,
      docType,
      fileName: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
    const docsKey = `docs:${user.id}:${companyId}`;
    const existing = (await kv.get(docsKey)) || [];
    existing.push(docMeta);
    await kv.set(docsKey, existing);

    return c.json({ document: docMeta });
  } catch (e: any) {
    console.log("Upload exception:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// List documents for a company
app.get(`${PREFIX}/documents/:companyId`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const companyId = c.req.param("companyId");
    const docs = (await kv.get(`docs:${user.id}:${companyId}`)) || [];
    return c.json({ documents: docs });
  } catch (e: any) {
    console.log("Error listing docs:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Get signed URL for a document
app.post(`${PREFIX}/documents/signed-url`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    await ensureBucket();
    const { path } = await c.req.json();
    const sb = adminClient();
    const { data, error } = await sb.storage.from(BUCKET_NAME).createSignedUrl(path, 3600);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ url: data.signedUrl });
  } catch (e: any) {
    console.log("Signed URL error:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

// Delete a document
app.post(`${PREFIX}/documents/delete`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    await ensureBucket();
    const { path, companyId } = await c.req.json();
    const sb = adminClient();
    await sb.storage.from(BUCKET_NAME).remove([path]);
    // Remove from metadata
    const docsKey = `docs:${user.id}:${companyId}`;
    const existing = (await kv.get(docsKey)) || [];
    const updated = existing.filter((d: any) => d.path !== path);
    await kv.set(docsKey, updated);
    return c.json({ ok: true });
  } catch (e: any) {
    console.log("Delete doc error:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

/* ── Reports (save wizard result as report) ── */
app.post(`${PREFIX}/reports`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const reportId = body.id || crypto.randomUUID();
    const reportData = { ...body, id: reportId, userId: user.id, createdAt: new Date().toISOString() };
    await kv.set(`report:${user.id}:${body.companyId}:${reportId}`, reportData);
    return c.json({ report: reportData });
  } catch (e: any) {
    console.log("Error saving report:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

app.get(`${PREFIX}/reports/:companyId`, async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const companyId = c.req.param("companyId");
    const reports = (await kv.getByPrefix(`report:${user.id}:${companyId}:`)) || [];
    return c.json({ reports });
  } catch (e: any) {
    console.log("Error listing reports:", e.message);
    return c.json({ error: e.message }, 500);
  }
});

Deno.serve(app.fetch);
