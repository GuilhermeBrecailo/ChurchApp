import type { DepartmentSong } from "../../composables/useDepartments";

export const getSongCreationPrefill = (searchTerm: string) => ({
  title: searchTerm.trim(),
  artist: "",
});

export const mergeCreatedSongIntoSelection = (
  songs: DepartmentSong[],
  selectedIds: string[],
  createdSong: DepartmentSong,
) => ({
  songs: songs.some((song) => song.id === createdSong.id)
    ? songs
    : [...songs, createdSong],
  selectedIds: selectedIds.includes(createdSong.id)
    ? selectedIds
    : [...selectedIds, createdSong.id],
});
