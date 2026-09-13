import { describe, it, expect, vi, afterEach } from "vitest";
import { notifySettingChanged } from "@src/OscSheet/settings";
import {
  ensureUploadFolder,
  syncPortraitUploadFolder,
  uploadTarget,
  watchPortraitUploadFolder,
} from "@features/portraitDrop/uploadFolder";

describe("uploadTarget", () => {
  it("uses the data source for a user data path", () => {
    expect(uploadTarget("worlds/w/osc-portraits", null)).toEqual({
      source: "data",
      path: "worlds/w/osc-portraits",
      options: {},
    });
  });

  it("uses the s3 source, key and bucket for an S3 URL", () => {
    expect(
      uploadTarget("https://art.s3.amazonaws.com/portraits", {
        groups: { bucket: "art", key: "portraits" },
      }),
    ).toEqual({ source: "s3", path: "portraits", options: { bucket: "art" } });
  });
});

describe("ensureUploadFolder", () => {
  const target = { source: "data", path: "worlds/w/osc", options: {} };

  it("creates each segment in order", async () => {
    const createDirectory = vi.fn().mockResolvedValue({});
    await ensureUploadFolder(target, createDirectory);
    expect(createDirectory.mock.calls).toEqual([
      ["data", "worlds", {}],
      ["data", "worlds/w", {}],
      ["data", "worlds/w/osc", {}],
    ]);
  });

  it("passes the bucket for s3", async () => {
    const createDirectory = vi.fn().mockResolvedValue({});
    await ensureUploadFolder(
      { source: "s3", path: "portraits", options: { bucket: "art" } },
      createDirectory,
    );
    expect(createDirectory).toHaveBeenCalledWith("s3", "portraits", {
      bucket: "art",
    });
  });

  it("tolerates segments that already exist", async () => {
    const createDirectory = vi
      .fn()
      .mockRejectedValueOnce(new Error("EEXIST: file already exists, mkdir"))
      .mockRejectedValueOnce(new Error("The directory already exists"))
      .mockResolvedValueOnce({});
    await expect(
      ensureUploadFolder(target, createDirectory),
    ).resolves.toBeUndefined();
    expect(createDirectory).toHaveBeenCalledTimes(3);
  });

  it("stops and rethrows a real failure", async () => {
    const createDirectory = vi
      .fn()
      .mockRejectedValue(
        new Error("You may not create directories in this location"),
      );
    await expect(ensureUploadFolder(target, createDirectory)).rejects.toThrow(
      "You may not create directories in this location",
    );
    expect(createDirectory).toHaveBeenCalledTimes(1);
  });
});

type World = {
  isGM: boolean;
  uploads: boolean;
  path: string;
  createDirectory?: ReturnType<typeof vi.fn>;
};

function stubWorld({
  isGM,
  uploads,
  path,
  createDirectory = vi.fn().mockResolvedValue({}),
}: World) {
  const error = vi.fn();
  const store: Record<string, unknown> = {
    "osc-character-sheet.portraitUploads": uploads,
    "osc-character-sheet.portraitUploadPath": path,
  };
  Object.assign(globalThis, {
    game: {
      user: { isGM },
      settings: { get: (ns: string, key: string) => store[`${ns}.${key}`] },
    },
    ui: { notifications: { error } },
    foundry: {
      applications: {
        apps: {
          FilePicker: {
            implementation: { createDirectory, matchS3URL: () => null },
          },
        },
      },
    },
  });
  return { createDirectory, error };
}

afterEach(() => {
  const g = globalThis as Record<string, unknown>;
  delete g.game;
  delete g.ui;
  delete g.foundry;
});

describe("syncPortraitUploadFolder", () => {
  it("creates the folder on a GM client when uploads are on", async () => {
    const { createDirectory } = stubWorld({
      isGM: true,
      uploads: true,
      path: " worlds/w/osc ",
    });
    await syncPortraitUploadFolder();
    expect(createDirectory).toHaveBeenLastCalledWith(
      "data",
      "worlds/w/osc",
      {},
    );
  });

  it("does nothing on a player client", async () => {
    const { createDirectory } = stubWorld({
      isGM: false,
      uploads: true,
      path: "worlds/w/osc",
    });
    await syncPortraitUploadFolder();
    expect(createDirectory).not.toHaveBeenCalled();
  });

  it("does nothing while uploads are off or the path is blank", async () => {
    const off = stubWorld({ isGM: true, uploads: false, path: "worlds/w/osc" });
    await syncPortraitUploadFolder();
    expect(off.createDirectory).not.toHaveBeenCalled();
    const blank = stubWorld({ isGM: true, uploads: true, path: "  " });
    await syncPortraitUploadFolder();
    expect(blank.createDirectory).not.toHaveBeenCalled();
  });

  it("tells the GM when the folder cannot be created", async () => {
    const { error } = stubWorld({
      isGM: true,
      uploads: true,
      path: "worlds/w/osc",
      createDirectory: vi.fn().mockRejectedValue(new Error("EACCES")),
    });
    await syncPortraitUploadFolder();
    expect(error).toHaveBeenCalledWith(
      "Couldn't create the portrait upload folder worlds/w/osc: EACCES",
    );
  });
});

describe("watchPortraitUploadFolder", () => {
  it("syncs when either portrait upload setting changes, until stopped", async () => {
    const { createDirectory } = stubWorld({
      isGM: true,
      uploads: true,
      path: "worlds/w/osc",
    });
    const stop = watchPortraitUploadFolder();
    notifySettingChanged("portraitUploads");
    await vi.waitFor(() => expect(createDirectory).toHaveBeenCalledTimes(3));
    notifySettingChanged("portraitUploadPath");
    await vi.waitFor(() => expect(createDirectory).toHaveBeenCalledTimes(6));
    notifySettingChanged("theme");
    stop();
    notifySettingChanged("portraitUploads");
    await Promise.resolve();
    expect(createDirectory).toHaveBeenCalledTimes(6);
  });
});
