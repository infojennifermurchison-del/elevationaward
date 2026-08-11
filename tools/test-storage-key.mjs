const forgeUrl = process.env.BUILT_IN_FORGE_API_URL?.replace(/\/+$/, "");
const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
const key = "applications/60001/formation_doc/1783373493805-Horn of Oil Legal docs 2_f42f16a5.pdf";

for (const candidate of [key, encodeURIComponent(key), key.replaceAll(" ", "+")]) {
  const endpoint = new URL("v1/storage/presign/get", `${forgeUrl}/`);
  endpoint.searchParams.set("path", candidate);
  const presign = await fetch(endpoint, { headers: { Authorization: `Bearer ${forgeKey}` } });
  const body = await presign.json();
  const download = await fetch(body.url, { signal: AbortSignal.timeout(15_000) });
  console.log(JSON.stringify({ candidate, presign: presign.status, download: download.status }));
}
