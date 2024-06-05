import axios from "axios";
import path from "path";
import { mkdir, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import log from "./src/debug.js";
import Listr from "listr";

const getFileName = (url) => {
  const myURL = new URL(url.trim());
  const myPath = myURL.pathname === "/" ? "" : myURL.pathname;
  return (myURL.hostname + myPath).replaceAll(".", "-").replaceAll("/", "-");
};

const getWorkingDirectory = (fileOutput) => {
  return path.resolve(process.cwd(), fileOutput);
};

const tagToAttrMap = {
  img: "src",
  source: "srcset",
  link: "href",
  script: "src",
};

const isValidUrl = (url, currentHostname) => {
  if (!url) return true;
  try {
    const curURL = new URL(url);
    const hostname = new URL(currentHostname);

    if (curURL.origin === hostname.origin) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
};

const getAssetsPath = (fileURL, catalogPath, hostname) => {
  const filePath = new URL(fileURL, hostname).pathname;
  const ext = path.extname(fileURL) ? "" : ".html";

  return path.join(
    path.basename(hostname).replaceAll(".", "-") +
      "-" +
      filePath
        .split("/")
        .filter((el) => el !== "")
        .join("-") +
      ext
  );
};

const processAssets = (htmlData, outputPath, hostname, catalogPath) => {
  const dom = new JSDOM(htmlData);
  const { document } = dom.window;
  let assetsList = [];

  document.querySelectorAll(Object.keys(tagToAttrMap)).forEach((element) => {
    const tagName = element.nodeName.toLowerCase();
    const attrName = tagToAttrMap[tagName];
    const attrURL = element.getAttribute(attrName);

    if (!isValidUrl(attrURL, hostname)) {
      const filePath = getAssetsPath(attrURL, outputPath, hostname);
      assetsList.push({
        fileURL: new URL(attrURL, hostname).toString(),
        filePath: `${catalogPath}/${filePath}`,
      });
      element.setAttribute(attrName, `${outputPath}_files/${filePath}`);
    }
  });

  return new Promise((resolve) => {
    resolve({ html: dom.serialize(), assets: assetsList });
  });
};

export default (url, outputDirectory = process.cwd()) => {
  log("url: ", url);
  log("directory: ", outputDirectory);
  const fileName = getFileName(url);
  log("fileName: ", fileName);
  const urlObject = new URL(url);
  const hostname = `${urlObject.protocol}//${urlObject.hostname}`;
  const assetsDirName = `${outputDirectory}/${fileName}_files`;

  const filePath = path.join(
    getWorkingDirectory(outputDirectory),
    `${fileName}.html`
  );

  const promises = [mkdir(assetsDirName), axios.get(url)];

  return Promise.all(promises)
    .then(([, response]) => {
      return processAssets(response.data, fileName, hostname, assetsDirName);
    })
    .then(({ html, assets }) => {
      log("write html file:", filePath);
      writeFile(filePath, html, "utf8");
      return {
        assets,
      };
    })
    .then(({ assets }) => {
      const listTasks = assets.map(
        ({ fileURL: assetURL, filePath: assetPath }) => {
          return {
            title: assetURL,
            task: () => {
              axios
                .get(assetURL, { responseType: "arraybuffer" })
                .then(({ data: assetData }) => {
                  return writeFile(assetPath, assetData);
                });
            },
          };
        }
      );
      const listr = new Listr(listTasks, { concurrent: true });
      return listr.run();
    })
    .then(() => {
      return {
        filePath,
      };
    });
};
