import { writeFileSync } from "fs";
import { env } from "process";

const auth = env["WEBLATE_TOKEN"];

const fullresults = [];

let url =
  "https://hosted.weblate.org/api/translations/pzprjs/failcode/en/units/";

while (url) {
	await new Promise(resolve => setTimeout(resolve, 100));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${auth}`,
      "Content-Type": "application/json"
    }
  });

  console.log("got " + url);

  const body = JSON.parse(await response.text());
  url = body.next;

  fullresults.push(...body.results);
}

writeFileSync("weblate_overview.json", JSON.stringify(fullresults, null, 2));
