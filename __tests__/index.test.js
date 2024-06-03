import os from "os";
import fsp from "fs/promises";
import path from "path";
import url from "url";
import nock from "nock";

import { loader } from "../index";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

const testingDomain = "https://site.ru";
const testName = "ru-hexlet-io-courses";
const testingURI = `/${testName}`;
const testingURL = `${testingDomain}${testingURI}`;

let fileContent;
let testTempPath = "";

beforeAll(async () => {
  fileContent = await fsp.readFile(
    getFixturesPath("ru-hexlet-io-courses.html"),
    "utf-8"
  );

  testTempPath = await fsp.mkdtemp(path.join(os.tmpdir(), "page-loader-"));
});

const scope = nock(testingDomain).persist();
nock.disableNetConnect();

const getFixturesPath = (...paths) =>
  path.join(dirname, "..", "__fixtures__", ...paths);

describe("negative end", () => {
  test.each([404, 500])("code %s", async (code) => {
    scope.get(`/${code}`).reply(code, "");

    await expect(
      loader(`${testingDomain}/${code}`, testTempPath)
    ).rejects.toThrow(code.toString());
  });
});

describe("positive end", () => {
  beforeEach(async () => {});

  test("download file success", async () => {
    await expect(fsp.access(testTempPath)).resolves.not.toThrow();

    scope.get(`${testingURI}`).reply(200, fileContent);

    const { filePath: createdFilePath } = await loader(
      testingURL,
      `${testTempPath}`
    );

    await expect(await fsp.readFile(createdFilePath, "utf-8")).toEqual(
      fileContent
    );
  });

  afterEach(async () => {
    await fsp.rmdir(testTempPath, { recursive: true });
  });
});
