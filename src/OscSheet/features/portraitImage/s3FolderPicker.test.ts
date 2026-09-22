import { describe, it, expect } from "vitest";
import { s3FolderUrl } from "@features/portraitImage/s3FolderPicker";
import { uploadTarget } from "@features/portraitImage/uploadFolder";

const endpoint = { protocol: "https:", host: "s3.us-east-1.amazonaws.com" };
const virtualHost = new RegExp(
  `^${endpoint.protocol}//(?<bucket>.*).${endpoint.host}/(?<key>.*)`,
);
const pathStyle = new RegExp(
  `^${endpoint.protocol}//${endpoint.host}/(?<bucket>[^/]+)/(?<key>.*)`,
);
const matchS3URL = (url: string) =>
  virtualHost.exec(url) ?? pathStyle.exec(url) ?? null;

describe("s3FolderUrl", () => {
  it("builds a virtual-host URL for a key", () => {
    expect(s3FolderUrl(endpoint, "art-bucket", "worlds/w/osc-portraits")).toBe(
      "https://art-bucket.s3.us-east-1.amazonaws.com/worlds/w/osc-portraits",
    );
  });

  it("normalises leading, trailing and doubled slashes in the key", () => {
    expect(s3FolderUrl(endpoint, "art-bucket", "/worlds//w/osc/")).toBe(
      "https://art-bucket.s3.us-east-1.amazonaws.com/worlds/w/osc",
    );
  });

  it("points at the bucket root for an empty key", () => {
    expect(s3FolderUrl(endpoint, "art-bucket", "")).toBe(
      "https://art-bucket.s3.us-east-1.amazonaws.com/",
    );
  });

  it("is null without an endpoint", () => {
    expect(s3FolderUrl(undefined, "art-bucket", "worlds/w")).toBeNull();
    expect(s3FolderUrl(null, "art-bucket", "worlds/w")).toBeNull();
  });

  it("is null without a bucket", () => {
    expect(s3FolderUrl(endpoint, "", "worlds/w")).toBeNull();
    expect(s3FolderUrl(endpoint, null, "worlds/w")).toBeNull();
  });
});

describe("S3 folder URL round trip", () => {
  it("resolves a picked S3 folder to the s3 source, key and bucket", () => {
    const url = s3FolderUrl(endpoint, "art-bucket", "worlds/w/osc-portraits")!;
    expect(uploadTarget(url, matchS3URL(url))).toEqual({
      source: "s3",
      path: "worlds/w/osc-portraits",
      options: { bucket: "art-bucket" },
    });
  });
});
