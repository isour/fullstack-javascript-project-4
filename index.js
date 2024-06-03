import axios from "axios";
import path from "path";
import { mkdir, writeFile } from "node:fs/promises";

const getProxiedUrl = (url) => {
  return url;
  // const urlResult = new URL("/get", "https://allorigins.hexlet.app");
  // urlResult.searchParams.set("url", url);
  // urlResult.searchParams.set("disableCache", "true");
  // return urlResult.toString();
};

const getFileName = (url) => {
  const myURL = new URL(url);
  const protocol = myURL.protocol;
  return (
    myURL.href.replace(protocol, "").replace("//", "").replace(/\W/g, "-") +
    ".html"
  );
};

const getWorkingDirectory = (fileOutput) => {
  return path.resolve(process.cwd(), fileOutput);
};

const createFile = (filePath, data) => {
  return writeFile(filePath, data, "utf8");
};

const prepareCatalog = (catalogPath) => {
  return (
    mkdir(catalogPath, { recursive: true })
      // .then((result) => {
      //   console.log(result, "suecces");
      // })
      .catch((e) => {
        console.log(e);
      })
  );
};

export const loader = (url, outputDirectory = process.cwd()) => {
  const filePath = path.join(
    getWorkingDirectory(outputDirectory),
    getFileName(url)
  );

  const promises = [
    prepareCatalog(outputDirectory),
    axios.get(getProxiedUrl(url)),
  ];

  return Promise.all(promises)
    .then(([, response]) => {
      return writeFile(filePath, response.data, "utf8");
    })
    .then(() => {
      return {
        filePath,
      };
    });
};
