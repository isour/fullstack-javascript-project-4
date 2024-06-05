import os from "os";
import fsp from "fs/promises";
import path from "path";
import url from "url";
import nock from "nock";

import { loader } from "../index";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const testingDomain = "https://ru.hexlet.io";
const testName = "courses";
const testingURI = `/${testName}`;
const testingURL = `${testingDomain}${testingURI}`;

let expectedFileContent, sourceFileContent;
let tempPath = "";

const getFixturesPath = (...paths) =>
  path.join(dirname, "..", "__fixtures__", ...paths);

let assets = [
  {
    url: "/assets/application.css",
    filePath: getFixturesPath("source/assets/", "application.css"),
  },
  {
    url: "/packs/js/runtime.js",
    filePath: getFixturesPath("source/assets/", "runtime.js"),
  },
  {
    url: "/assets/professions/nodejs.png",
    filePath: getFixturesPath("source/assets/", "nodejs.png"),
  },
  {
    url: "/courses",
    filePath: getFixturesPath("source/assets/", "courses.html"),
  },
];

const assetsNames = assets.map((asset) => asset.url);

beforeAll(async () => {
  sourceFileContent = await fsp.readFile(
    getFixturesPath("source", "ru-hexlet-io-courses.html"),
    "utf-8"
  );

  expectedFileContent = await fsp.readFile(
    getFixturesPath("expected", "ru-hexlet-io-courses.html"),
    "utf-8"
  );

  scope.get(`${testingURI}`).reply(200, sourceFileContent);

  const promises = await assets.map(async (asset) => {
    const assetData = await fsp.readFile(asset.filePath);

    scope.get(`${asset.url}`).reply(200, assetData);

    return {
      ...asset,
      data: assetData,
    };
  });

  assets = await Promise.all(promises);
});

const scope = nock(testingDomain).persist();
nock.disableNetConnect();

beforeEach(async () => {
  tempPath = await fsp.mkdtemp(path.join(os.tmpdir(), "page-loader-"));
});

afterEach(async () => {
  await fsp.rmdir(tempPath, { recursive: true });
});

describe("negative end", () => {
  test('bad response', async () => {
    const invalidURL = 'https://wrong.address';
    const error = `getaddrinfo ENOTFOUND ${invalidURL}`;
    nock(invalidURL).persist().get('/').replyWithError(error);

    await expect(loader(invalidURL, tempPath)).rejects.toThrow(error);
  });

  test('access rights', async () => {
    await expect(loader(testingURL, `/root`)).rejects.toThrow();
  });
  
  test.each([404, 500])("code %s", async (code) => {
    scope.get(`/${code}`).reply(code, "");

    await expect(loader(`${testingDomain}/${code}`, tempPath)).rejects.toThrow(
      code.toString()
    );
  });
});

describe("positive end", () => {
  let createdFilePath = "";

  beforeAll(async () => {
    const { filePath } = await loader(testingURL, `${tempPath}`);

    createdFilePath = filePath;
  });

  test("download file success", async () => {
    await expect(fsp.access(tempPath)).resolves.not.toThrow();

    await expect(await fsp.readFile(createdFilePath, "utf-8")).toEqual(
      expectedFileContent
    );
  });

  test.each(assetsNames)("asset %s", async (assetName) => {
    const { data: expectedData, filePath } = assets.find(
      (asset) => asset.url === assetName
    );
    const assetData = await fsp.readFile(filePath);

    await expect(assetData).toEqual(expectedData);
  });
});
