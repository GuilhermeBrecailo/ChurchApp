import { isValidSongKey, normalizeSongKey } from "../src/application/Services/Department/SongKey";

describe("normalizeSongKey", () => {
  it("accepts the twelve major keys", () => {
    expect(normalizeSongKey("C")).toBe("C");
    expect(normalizeSongKey("g")).toBe("G");
    expect(normalizeSongKey(" F# ")).toBe("F#");
  });

  it("normalizes flats to their sharp form", () => {
    expect(normalizeSongKey("Bb")).toBe("A#");
    expect(normalizeSongKey("bb")).toBe("A#");
    expect(normalizeSongKey("Db")).toBe("C#");
    expect(normalizeSongKey("Cb")).toBe("B");
  });

  it("accepts minor keys", () => {
    expect(normalizeSongKey("Am")).toBe("Am");
    expect(normalizeSongKey("f#min")).toBe("F#m");
    expect(normalizeSongKey("Ebm")).toBe("D#m");
  });

  it("rejects anything that is not a key", () => {
    expect(normalizeSongKey("sol")).toBeNull();
    expect(normalizeSongKey("72")).toBeNull();
    expect(normalizeSongKey("G maior")).toBeNull();
    expect(normalizeSongKey("H")).toBeNull();
    expect(normalizeSongKey("")).toBeNull();
  });
});

describe("isValidSongKey", () => {
  it("mirrors normalizeSongKey", () => {
    expect(isValidSongKey("A#m")).toBe(true);
    expect(isValidSongKey("bpm 90")).toBe(false);
  });
});
