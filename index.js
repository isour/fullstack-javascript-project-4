import axios from "axios";
import * as fs from "fs";
import path from "path";

const loader = (url, output = "") => {
  const getProxiedUrl = (url) => {
    const urlResult = new URL("/get", "https://allorigins.hexlet.app");
    urlResult.searchParams.set("url", url);
    urlResult.searchParams.set("disableCache", "true");
    return urlResult.toString();
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

  const createFile = (filename, fileOutput, data) => {
    const fullFileName = path.join(getWorkingDirectory(fileOutput), filename);

    fs.writeFile(fullFileName, data, "utf8", (err) => {
      if (err) throw err;

      console.log("The file was succesfully saved!");
    });
  };

  axios
    .get(getProxiedUrl(url))
    .then((response) => {
      // console.log(response);
      createFile(getFileName(url), output, response.data.contents);
    })
    .catch((error) => {
      console.log(error);
    });

  return getFileName(url);
};

export default loader;
