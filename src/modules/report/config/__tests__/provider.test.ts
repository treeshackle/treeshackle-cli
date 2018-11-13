import { createConfigProvider } from "../provider";
import { ConfigProvider as ConfigProviderInstance } from "..";
import { InvalidConfigurationException } from "../../exceptions";

describe("ConfigProvider", () => {
  let ConfigProvider: typeof ConfigProviderInstance;
  const fs = {
    readJson: jest.fn(),
    pathExists: jest.fn().mockResolvedValue(true)
  };

  beforeEach(() => {
    ConfigProvider = createConfigProvider({ fs } as any);
    fs.readJson.mockClear();
    fs.pathExists.mockClear();
  });

  it("should throw an error if the config that is returned is invalid", async () => {
    fs.readJson.mockResolvedValueOnce({ foo: "bar" });
    await expect(ConfigProvider.get("./foo/bar")).rejects.toThrow(
      InvalidConfigurationException
    );
  });

  it("should throw an error if the config fails to be read", async () => {
    fs.readJson.mockRejectedValue({});
    await expect(ConfigProvider.get("./foo/bar")).rejects.toEqual({});
  });

  it("should return a normalized configuration if there is no file", async () => {
    fs.pathExists.mockResolvedValueOnce(false);
    expect(await ConfigProvider.get("./foo/bar")).toEqual({
      modules: {
        exclude: []
      }
    });
  });

  it("should return the configuration if it is available and valid", async () => {
    fs.readJson.mockResolvedValueOnce({ modules: { exclude: ["foo", "bar"] } });
    expect(await ConfigProvider.get("./foo/bar")).toEqual({
      modules: { exclude: ["foo", "bar"] }
    });
  });
});
