import axios from "axios";
import path from "path";
import { mkdir, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
// import log from './src/debug.js';

import debug from 'debug';
const log = debug('page-loader');

const getFileName = (url) => {
  const myURL = new URL(url);
  const protocol = myURL.protocol;
  return myURL.href.replace(protocol, "").replace("//", "").replace(/\W/g, "-");
};

const getWorkingDirectory = (fileOutput) => {
  return path.resolve(process.cwd(), fileOutput);
};

const prepareCatalogs = (catalogPath, fileName) => {
  const dirName = `${catalogPath}/${fileName}_files`;
  log('create working & assets directories: ', dirName, 'and', catalogPath);
  
  return mkdir(dirName, { recursive: true }).then(
    () => {
      return { catalogPath };
    }
  );
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
  log(fileURL, catalogPath, hostname)
  const filePath = (new URL(fileURL, hostname)).pathname;
  const ext = path.extname(fileURL) ? '' : '.html';
  
  return path.join(
    catalogPath + "_files/",
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

    console.log(isValidUrl(attrURL, hostname), attrURL, hostname)
    if (!isValidUrl(attrURL, hostname)) {
      const filePath = getAssetsPath(attrURL, outputPath, hostname);
      assetsList.push({
        fileURL: (new URL(attrURL, hostname)).toString(),
        filePath: `${catalogPath}/${filePath}`,
      });
      element.setAttribute(attrName, filePath);
    }
  });

  return new Promise((resolve) => {
    console.log(assetsList, 'asesertasa')
    resolve({ html: dom.serialize(), assets: assetsList });
  });
};

export const loader = (url, outputDirectory = process.cwd()) => {
  log('url: ', url);
  log('directory: ', outputDirectory);
  const fileName = getFileName(url);
  const urlObject = new URL(url);
  const hostname = `${urlObject.protocol}//${urlObject.hostname}`;

  const filePath = path.join(
    getWorkingDirectory(outputDirectory),
    `${fileName}.html`
  );

  const promises = [
    prepareCatalogs(outputDirectory, fileName),
    axios.get(url),
  ];

  return Promise.all(promises)
    .then(([{ catalogPath }, response]) => {
      return processAssets(response.data, fileName, hostname, catalogPath);
    })
    .then(({ html, assets }) => {
      assets.map(({ fileURL: assetURL, filePath: assetPath }) => {
        return axios
          .get(assetURL, { responseType: "arraybuffer" })
          .then(({ data: assetData }) => {
            // log('write asset file:', assetURL, 'to:', assetPath);
            return writeFile(assetPath, assetData);
          });
      });
      log('write html file:', filePath);
      return writeFile(filePath, html, "utf8");
    })
    .then(() => {
      return {
        filePath,
      };
    });
};
