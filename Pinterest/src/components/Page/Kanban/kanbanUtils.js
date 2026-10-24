export const INITIAL_COLUMNS = {
  todo: { id: "todo", title: "To Do", cards: [] },
  inprogress: { id: "inprogress", title: "In Progress", cards: [] },
  done: { id: "done", title: "Done", cards: [] }
};

export const COLUMN_ORDER = ["todo", "inprogress", "done"];
export const COLUMN_META = {
  todo: {
    label: "Capture ideas",
    marker: "01"
  },
  inprogress: {
    label: "Make it happen",
    marker: "02"
  },
  done: {
    label: "Keep the momentum",
    marker: "03"
  }
};

export function normalizeSubtask(subtask, index) {
  return {
    id: subtask?.id || `subtask-${Date.now()}-${index}`,
    text: String(subtask?.text || "New subtask").trim() || "New subtask",
    done: Boolean(subtask?.done)
  };
}

export function normalizeCard(card, fallbackIndex = 0) {
  const rawTitle = typeof card?.title === "string" ? card.title : typeof card?.text === "string" ? card.text : "";
  const trimmedTitle = rawTitle.trim().slice(0, 120);
  const normalizedTitle = trimmedTitle || `Untitled task ${fallbackIndex + 1}`;

  return {
    id: card?.id || `card-${Date.now()}-${fallbackIndex}`,
    title: normalizedTitle,
    description: typeof card?.description === "string" ? card.description : "",
    ownerName: typeof card?.ownerName === "string" && card.ownerName.trim()
      ? card.ownerName.trim()
      : typeof card?.owner === "string" && card.owner.trim()
        ? card.owner.trim()
        : typeof card?.assignee === "string" && card.assignee.trim()
          ? card.assignee.trim()
          : "Unassigned",
    createdAt: card?.createdAt || card?.created_at || new Date().toISOString(),
    updatedAt: card?.updatedAt || card?.updated_at || card?.createdAt || new Date().toISOString(),
    labels: Array.isArray(card?.labels)
      ? card.labels
          .filter((label) => label && typeof label.name === "string")
          .map((label) => ({
            name: label.name.trim().slice(0, 30),
            color: typeof label.color === "string" ? label.color : "#1e3a8a"
          }))
      : [],
    subtasks: Array.isArray(card?.subtasks)
      ? card.subtasks.map((subtask, index) => normalizeSubtask(subtask, index))
      : []
  };
}

export function normalizeColumns(inputColumns = {}) {
  return Object.fromEntries(
    COLUMN_ORDER.map((columnId) => {
      const column = inputColumns[columnId] || INITIAL_COLUMNS[columnId];
      return [
        columnId,
        {
          ...INITIAL_COLUMNS[columnId],
          ...column,
          id: columnId,
          title: column?.title || INITIAL_COLUMNS[columnId].title,
          cards: Array.isArray(column?.cards)
            ? column.cards.map((card, index) => normalizeCard(card, index))
            : []
        }
      ];
    })
  );
}

export function formatTimestamp(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatRelativeTime(value) {
  if (!value) return "just now";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return formatTimestamp(value);
}


