// RFC 9727 API catalog: points API clients at the OpenAPI document in public/openapi.json.
const ORIGIN = "https://www.icancall.co";
const CATALOG = `${ORIGIN}/.well-known/api-catalog`;

const linkset = {
  linkset: [
    {
      anchor: `${ORIGIN}/api`,
      "service-desc": [{ href: `${ORIGIN}/openapi.json`, type: "application/vnd.oai.openapi+json;version=3.1" }],
    },
  ],
};

const headers = {
  "Content-Type": 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"',
  Link: `<${CATALOG}>; rel="api-catalog"`,
};

export function GET() {
  return new Response(JSON.stringify(linkset), { headers });
}

export function HEAD() {
  return new Response(null, { headers });
}
