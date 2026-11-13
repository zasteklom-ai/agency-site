import { describe, expect, it } from "vitest";
import { buildVkVideoEmbedUrl, parseVkVideoUrl } from "./vk-video";

describe("parseVkVideoUrl", () => {
  it("разбирает vkvideo.ru/video{oid}_{id}", () => {
    expect(parseVkVideoUrl("https://vkvideo.ru/video-123456_789")).toEqual({
      oid: "-123456",
      id: "789",
    });
  });

  it("разбирает vk.com/video{oid}_{id} с www и хвостом", () => {
    expect(parseVkVideoUrl("https://www.vk.com/video123_45678?from=post")).toEqual(
      { oid: "123", id: "45678" },
    );
  });

  it("принимает уже готовую video_ext.php", () => {
    expect(
      parseVkVideoUrl("https://vk.com/video_ext.php?oid=-1&id=2&hd=2"),
    ).toEqual({ oid: "-1", id: "2" });
  });

  it("отвергает мусор", () => {
    expect(parseVkVideoUrl("")).toBeNull();
    expect(parseVkVideoUrl("https://youtube.com/watch?v=1")).toBeNull();
    expect(parseVkVideoUrl("https://vk.com/club123")).toBeNull();
    expect(parseVkVideoUrl("not a url")).toBeNull();
    expect(parseVkVideoUrl("https://vk.com/video_ext.php?oid=abc&id=2")).toBeNull();
  });
});

describe("buildVkVideoEmbedUrl", () => {
  it("строит iframe-URL с экранированием", () => {
    expect(buildVkVideoEmbedUrl({ oid: "-123", id: "45" })).toBe(
      "https://vk.com/video_ext.php?oid=-123&id=45&hd=2",
    );
  });
});
