import { VercelRequest, VercelResponse } from '@vercel/node';

function decode_vercel_query(url: string): string {
	const decoded = decodeURIComponent(url);
	return decoded.replace(/\s/g, "+");
}

export default (request: VercelRequest, response: VercelResponse) => {
	const tokens = request.url?.split('?') ?? "";
	
	// Using Vercel's default redirect will corrupt the query string. Use a server function to redirect manually
	const qs = decode_vercel_query(tokens[1]);
	response.end(`${request.url}\n${qs}`);
	// response.redirect(308, '/p?' + qs);
}
