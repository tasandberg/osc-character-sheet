import { describe, it, expect, vi, afterEach } from "vitest";
import { notifySettingChanged } from "@src/OscSheet/settings";
import {
  syncPortraitUploadFolder,
  watchPortraitUploadFolder,
} from "@features/portraitImage/uploadFolder";
import { notify, setWorld } from "./__fixtures__/dragWorld";

function stubWorld({
  isGM = true,
  uploads = true,
  path = "worlds/w/osc",
  createDirectory = vi.fn().mockResolvedValue({}),
  s3 = null as { groups: { bucket: string; key: string } } | null,
} = {}) {
  notify.error.mockClear();
  setWorld({ portraitUploads: uploads, portraitUploadPath: path }, { isGM });
  vi.stubGlobal("foundry", {
    applications: {
      apps: {
        FilePicker: {
          implementation: { createDirectory, matchS3URL: () => s3 },
        },
      },
    },
  });
  return createDirectory;
}

afterEach(() => vi.unstubAllGlobals());

describe("syncPortraitUploadFolder", () => {
  it("creates each missing folder down to the upload path, skipping ones that exist", async () => {
    const createDirectory = stubWorld({
      path: " /worlds//w/osc/ ",
      createDirectory: vi
        .fn()
        .mockRejectedValueOnce(new Error("EEXIST: file already exists"))
        .mockResolvedValue({}),
    });
    await syncPortraitUploadFolder();
    expect(createDirectory.mock.calls.map(([, dir]) => dir)).toEqual([
      "worlds",
      "worlds/w",
      "worlds/w/osc",
    ]);
    expect(notify.error).not.toHaveBeenCalled();
  });

  it("creates the key inside an S3 bucket", async () => {
    const createDirectory = stubWorld({
      path: "https://art.s3.amazonaws.com/portraits",
      s3: { groups: { bucket: "art", key: "portraits" } },
    });
    await syncPortraitUploadFolder();
    expect(createDirectory).toHaveBeenCalledWith("s3", "portraits", {
      bucket: "art",
    });
  });

  it("tells the GM when the folder cannot be created", async () => {
    stubWorld({
      createDirectory: vi.fn().mockRejectedValue(new Error("EACCES")),
    });
    await syncPortraitUploadFolder();
    expect(notify.error).toHaveBeenCalledWith(
      "Couldn't create the portrait upload folder worlds/w/osc: EACCES",
    );
  });

  it.each([
    ["on a player client", { isGM: false }],
    ["while uploads are off", { uploads: false }],
    ["while the path is blank", { path: "  " }],
  ])("does nothing %s", async (_, world) => {
    const createDirectory = stubWorld(world);
    await syncPortraitUploadFolder();
    expect(createDirectory).not.toHaveBeenCalled();
  });
});

it("re-syncs when either portrait upload setting changes, until stopped", async () => {
  const createDirectory = stubWorld({ path: "osc" });
  const stop = watchPortraitUploadFolder();
  notifySettingChanged("portraitUploads");
  notifySettingChanged("portraitUploadPath");
  notifySettingChanged("theme");
  await vi.waitFor(() => expect(createDirectory).toHaveBeenCalledTimes(2));
  stop();
  notifySettingChanged("portraitUploads");
  await Promise.resolve();
  expect(createDirectory).toHaveBeenCalledTimes(2);
});
