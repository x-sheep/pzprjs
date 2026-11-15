import fs from "fs";
import { env } from "process";

const auth = env["WEBLATE_TOKEN"];

const weblatelist = JSON.parse(
  fs.readFileSync("./weblate_overview.json", { encoding: "utf-8" })
);
const inputs = JSON.parse(
  fs.readFileSync("./failcodes.json", { encoding: "utf-8" })
);

const webmap = {};

weblatelist.forEach(el => {
  if (el.explanation !== inputs[el.context]) {
    webmap[el.context] = el.url;
  }
});

await new Promise(resolve => setTimeout(resolve, 100));

for (const key in inputs) {
  const url = webmap[key];
  if (!url) continue;

  console.log(url);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${auth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ explanation: inputs[key] })
  });

  if (!response.ok) {
    console.error(response.status, await response.text());
    throw new Error("Responsen't");
  }

  await new Promise(resolve => setTimeout(resolve, 250));
}
