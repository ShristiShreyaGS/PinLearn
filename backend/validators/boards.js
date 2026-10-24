const { z } = require("zod");
const { sanitizeHttpUrl } = require("../utils/url");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const httpUrl = z
  .string()
  .max(2000)
  .refine((value) => value === "" || sanitizeHttpUrl(value) !== "", "Must be an http(s) URL")
  .transform((value) => (value === "" ? "" : sanitizeHttpUrl(value)));

const boardIdParam = z.object({ boardId: objectId });

const createBoard = z.object({ name: z.string().trim().min(1, "Board name is required").max(80) });

const looseId = z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1).max(500));

const resource = z
  .object({
    id: looseId.optional(),
    title: z.string().trim().min(1, "Resource is required").max(300),
    description: z.string().max(2000).optional(),
    thumbnail: httpUrl.optional(),
    image: httpUrl.optional(),
    url: httpUrl.optional(),
    type: z.string().max(40).optional(),
    source: z.string().max(40).optional(),
    channel: z.string().max(200).optional()
  });

const saveResource = z.object({ resource });

const resourceRef = { boardId: objectId, resourceId: looseId };
const noteContent = z.string("Note body is required").trim().min(1, "Note body is required").max(1000, "Note cannot exceed 1000 characters");
const noteIndex = z.number().int().min(0);

const updateStatus = z.object({
  ...resourceRef,
  status: z.enum(["saved", "visited", "in_progress", "completed"])
});

const addNote = z.object({ ...resourceRef, content: noteContent });
const updateNote = z.object({ ...resourceRef, noteIndex, content: noteContent });
const deleteNote = z.object({ ...resourceRef, noteIndex });

module.exports = {
  boardIdParam,
  createBoard,
  saveResource,
  updateStatus,
  addNote,
  updateNote,
  deleteNote
};
