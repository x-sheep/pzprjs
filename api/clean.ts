import { VercelRequest, VercelResponse } from "@vercel/node";

function decode_vercel_query(url: string): string {
  const decoded = decodeURIComponent(url);
  return decoded.replace(/\s/g, "+");
}

export default (request: VercelRequest, response: VercelResponse) => {
  const tokens = request.url?.split("?") ?? [""];
  const base = tokens[0];

  if (tokens.length === 1) {
    response.redirect(`https://puzz.link${base}`);
  } else {
    // Using Vercel's default redirect will corrupt the query string. Use a server function to redirect manually
    const qs = decode_vercel_query(tokens[1]);
    response.redirect(`https://puzz.link${base}?${qs}`);
  }
};
