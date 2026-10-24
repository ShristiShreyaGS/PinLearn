const { z } = require("zod");

const column = z.looseObject({
  cards: z.array(z.looseObject({})).max(500)
});

const saveKanban = z.object({
  columns: z
    .record(z.string().max(30), column)
    .refine((columns) => Object.keys(columns).length <= 10, "Too many columns")
});

module.exports = { saveKanban };
