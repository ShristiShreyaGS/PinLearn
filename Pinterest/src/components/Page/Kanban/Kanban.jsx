import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import PageBackdrop from "../PageBackdrop";
import { fetchKanban, saveKanban } from "../../../api/kanban";

const INITIAL_COLUMNS = {
  todo: { id: "todo", title: "To Do", cards: [] },
  inprogress: { id: "inprogress", title: "In Progress", cards: [] },
  done: { id: "done", title: "Done", cards: [] }
};

const COLUMN_ORDER = ["todo", "inprogress", "done"];
const COLUMN_META = {
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

function normalizeSubtask(subtask, index) {
  return {
    id: subtask?.id || `subtask-${Date.now()}-${index}`,
    text: String(subtask?.text || "New subtask").trim() || "New subtask",
    done: Boolean(subtask?.done)
  };
}

function normalizeCard(card, fallbackIndex = 0) {
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

function normalizeColumns(inputColumns = {}) {
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

function formatTimestamp(value) {
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

function formatRelativeTime(value) {
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


function Kanban() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [newCardText, setNewCardText] = useState({ todo: "", inprogress: "", done: "" });
  const [editingCard, setEditingCard] = useState(null);
  const [draftCard, setDraftCard] = useState(null);
  const [undoToast, setUndoToast] = useState(null);
  const [draggingCardIds, setDraggingCardIds] = useState([]);
  const hasLoadedColumns = useRef(false);
  const modalRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const previousFocusRef = useRef(null);
  const cardRefs = useRef({});
  const pendingDeleteRef = useRef(null);
  const deleteTimerRef = useRef(null);
  const boardRef = useRef(columns);

  const totalCards = useMemo(
    () => COLUMN_ORDER.reduce((total, colId) => total + columns[colId].cards.length, 0),
    [columns]
  );

  useEffect(() => {
    let isMounted = true;

    const loadKanban = async () => {
      try {
        const data = await fetchKanban();
        if (isMounted && data?.columns) {
          setColumns((current) => normalizeColumns({ ...current, ...data.columns }));
        }
      } catch (error) {
        console.error("Failed to load Kanban board:", error);
      } finally {
        if (isMounted) {
          hasLoadedColumns.current = true;
          setIsLoading(false);
        }
      }
    };

    loadKanban();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    boardRef.current = columns;
  }, [columns]);

  useEffect(() => {
    if (!hasLoadedColumns.current || pendingDeleteRef.current) {
      return;
    }

    saveKanban(columns).catch((error) => {
      console.error("Failed to save Kanban board:", error);
    });
  }, [columns]);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        window.clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  function toggleCardSelection(cardId, event) {
    if (event && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.stopPropagation();
      setSelectedCardIds((current) =>
        current.includes(cardId)
          ? current.filter((id) => id !== cardId)
          : [...current, cardId]
      );
      return;
    }

    setSelectedCardIds([]);
  }

  function onDragStart(start) {
    const { draggableId } = start;
    const activeSelection = selectedCardIds.includes(draggableId)
      ? selectedCardIds
      : [draggableId];

    setDraggingCardIds(activeSelection);
  }

  function onDragEnd(result) {
    const { source, destination, draggableId } = result;

    if (!destination) {
      setSelectedCardIds([]);
      setDraggingCardIds([]);
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      setSelectedCardIds([]);
      setDraggingCardIds([]);
      return;
    }

    const selection = selectedCardIds.includes(draggableId) ? selectedCardIds : [draggableId];
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceCards = [...sourceCol.cards];
    const sourceSet = new Set(selection);
    const movedCards = sourceCards.filter((card) => sourceSet.has(card.id));

    if (movedCards.length === 0) {
      setDraggingCardIds([]);
      return;
    }

    const remainingSourceCards = sourceCards.filter((card) => !sourceSet.has(card.id));

    if (source.droppableId === destination.droppableId) {
      const destinationIndex = Math.min(destination.index, remainingSourceCards.length);
      remainingSourceCards.splice(destinationIndex, 0, ...movedCards);

      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: {
          ...prev[source.droppableId],
          cards: remainingSourceCards
        }
      }));
    } else {
      const destinationCards = [...destCol.cards];
      const destinationIndex = Math.min(destination.index, destinationCards.length);
      destinationCards.splice(destinationIndex, 0, ...movedCards);

      setColumns((prev) => ({
        ...prev,
        [source.droppableId]: {
          ...prev[source.droppableId],
          cards: remainingSourceCards
        },
        [destination.droppableId]: {
          ...prev[destination.droppableId],
          cards: destinationCards
        }
      }));
    }

    setSelectedCardIds([]);
    setDraggingCardIds([]);
  }

  function addCard(colId) {
    const title = newCardText[colId].trim().slice(0, 120);
    if (!title) return;

    const timestamp = new Date().toISOString();
    const card = {
      id: `card-${Date.now()}`,
      title,
      description: "",
      ownerName: "You",
      createdAt: timestamp,
      updatedAt: timestamp,
      labels: [],
      subtasks: []
    };

    setColumns((prev) => ({
      ...prev,
      [colId]: { ...prev[colId], cards: [...prev[colId].cards, card] }
    }));
    setNewCardText((prev) => ({ ...prev, [colId]: "" }));
  }

  function deleteCard(colId, cardId) {
    const sourceColumn = columns[colId];
    if (!sourceColumn) return;

    const cardIndex = sourceColumn.cards.findIndex((card) => card.id === cardId);
    const card = sourceColumn.cards[cardIndex];
    if (!card) return;

    pendingDeleteRef.current = {
      colId,
      cardId,
      card,
      index: cardIndex
    };

    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
    }

    setColumns((prev) => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        cards: prev[colId].cards.filter((item) => item.id !== cardId)
      }
    }));
    setSelectedCardIds((prev) => prev.filter((id) => id !== cardId));
    setUndoToast({ message: "Card deleted — Undo", colId, cardId, index: cardIndex, card });

    deleteTimerRef.current = window.setTimeout(() => {
      pendingDeleteRef.current = null;
      setUndoToast(null);
      saveKanban(boardRef.current).catch((error) => {
        console.error("Failed to save deleted Kanban card:", error);
      });
    }, 6000);
  }

  function undoDelete() {
    const pendingDelete = pendingDeleteRef.current || undoToast;
    if (!pendingDelete) return;

    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }

    setColumns((prev) => {
      const target = prev[pendingDelete.colId];
      if (!target) return prev;

      const nextCards = [...target.cards];
      const insertIndex = Math.min(pendingDelete.index, nextCards.length);
      nextCards.splice(insertIndex, 0, pendingDelete.card);

      return {
        ...prev,
        [pendingDelete.colId]: {
          ...target,
          cards: nextCards
        }
      };
    });

    pendingDeleteRef.current = null;
    setUndoToast(null);
  }

  function openCardDetail(cardId, colId) {
    const card = columns[colId]?.cards.find((item) => item.id === cardId);
    if (!card) return;

    previousFocusRef.current = cardRefs.current[cardId] || null;
    setDraftCard({
      id: card.id,
      colId,
      title: card.title,
      description: card.description || "",
      ownerName: card.ownerName || "",
      labels: (card.labels || []).map((label) => label.name),
      subtasks: (card.subtasks || []).map((subtask) => ({
        id: subtask.id,
        text: subtask.text,
        done: Boolean(subtask.done)
      })),
      newSubtaskText: ""
    });
    setEditingCard({ cardId, colId });
  }

  function closeCardDetail() {
    setEditingCard(null);
    setDraftCard(null);

    requestAnimationFrame(() => {
      previousFocusRef.current?.focus();
    });
  }

  function saveCardDetail() {
    if (!editingCard || !draftCard) return;

    const nextTitle = draftCard.title.trim();
    if (!nextTitle) return;

    const nextLabels = draftCard.labels
      .map((label, index) => ({
        name: String(label).trim(),
        color: ["#0b1736", "#1e3a8a", "#1d4ed8", "#334155", "#1e40af", "#164e63"][index % 6]
      }))
      .filter((label) => label.name && label.name.length <= 30);

    const normalizedSubtasks = (draftCard.subtasks || [])
      .map((subtask, index) => ({
        id: subtask.id || `subtask-${Date.now()}-${index}`,
        text: String(subtask.text || "").trim(),
        done: Boolean(subtask.done)
      }))
      .filter((subtask) => subtask.text.length > 0);

    setColumns((prev) => ({
      ...prev,
      [editingCard.colId]: {
        ...prev[editingCard.colId],
        cards: prev[editingCard.colId].cards.map((card) =>
          card.id === editingCard.cardId
            ? {
                ...card,
                title: nextTitle.slice(0, 120),
                description: draftCard.description.trim(),
                ownerName: draftCard.ownerName.trim() || "Unassigned",
                labels: nextLabels,
                subtasks: normalizedSubtasks,
                updatedAt: new Date().toISOString()
              }
            : card
        )
      }
    }));

    closeCardDetail();
  }

  function addDraftSubtask() {
    if (!draftCard) return;
    const value = draftCard.newSubtaskText?.trim();
    if (!value) return;

    setDraftCard((prev) => ({
      ...prev,
      subtasks: [
        ...(prev.subtasks || []),
        {
          id: `subtask-${Date.now()}`,
          text: value,
          done: false
        }
      ],
      newSubtaskText: ""
    }));
  }

  function toggleDraftSubtask(subtaskId) {
    setDraftCard((prev) => ({
      ...prev,
      subtasks: (prev.subtasks || []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
      )
    }));
  }

  function removeDraftSubtask(subtaskId) {
    setDraftCard((prev) => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter((subtask) => subtask.id !== subtaskId)
    }));
  }

  function moveDraftSubtask(subtaskId, direction) {
    setDraftCard((prev) => {
      const current = prev.subtasks || [];
      const index = current.findIndex((subtask) => subtask.id === subtaskId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return prev;

      const updated = [...current];
      const [moved] = updated.splice(index, 1);
      updated.splice(nextIndex, 0, moved);

      return { ...prev, subtasks: updated };
    });
  }

  useEffect(() => {
    const handleGlobalEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedCardIds([]);
      }
    };

    document.addEventListener("keydown", handleGlobalEscape);
    return () => document.removeEventListener("keydown", handleGlobalEscape);
  }, []);

  useEffect(() => {
    if (!editingCard || !modalRef.current) return;

    const modalNode = modalRef.current;
    const focusableSelector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const focusableNodes = Array.from(modalNode.querySelectorAll(focusableSelector));
    const firstNode = focusableNodes[0] || modalNode;
    const lastNode = focusableNodes[focusableNodes.length - 1] || modalNode;

    firstNode.focus();
    firstFocusableRef.current = firstNode;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedCardIds([]);
        closeCardDetail();
        return;
      }

      if (event.key !== "Tab") return;

      if (focusableNodes.length === 0) {
        event.preventDefault();
        modalNode.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingCard]);

  const detailCard = draftCard ? columns[draftCard.colId]?.cards.find((item) => item.id === draftCard.id) : null;
  const detailDone = draftCard ? draftCard.subtasks.filter((subtask) => subtask.done).length : 0;
  const detailTotal = draftCard ? draftCard.subtasks.length : 0;
  const detailPercent = detailTotal ? Math.round((detailDone / detailTotal) * 100) : 0;
  const detailFieldClass =
    "w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600 dark:focus:border-[#1e3a8a]";
  const detailLabelClass = "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400";

  return (
    <main className="relative isolate min-h-screen bg-transparent px-4 pb-8 pt-[88px] text-[#0b1736] dark:text-slate-100 sm:px-6 lg:px-12 lg:py-12">
      <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
      <div className="relative mx-auto max-w-7xl">
        {isLoading && <p className="mb-5 text-sm font-medium text-slate-500">Loading your board...</p>}

        <header className="mb-8 flex scroll-mt-[88px] flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1e3a8a]">Learning workflow</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">Kanban Board</h1>
            <p className="mt-3 max-w-xl text-base leading-6 text-slate-500 dark:text-slate-400">Turn loose ideas into visible progress, one small step at a time.</p>
          </div>

          <div className="flex min-w-[190px] items-center gap-3 rounded-[10px] border border-[#dbe3ef] bg-white/90 px-5 py-4 text-sm font-semibold text-slate-500 shadow-[0_10px_24px_rgba(11,23,54,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400">
            <span className="text-3xl font-extrabold text-[#0b1736] dark:text-white">{totalCards}</span>
            <span>{totalCards === 1 ? "task on your board" : "tasks on your board"}</span>
          </div>
        </header>

        {undoToast && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <span>{undoToast.message}</span>
            <button
              type="button"
              onClick={undoDelete}
              className="rounded-md bg-amber-600 px-2.5 py-1.5 font-semibold text-white transition hover:bg-amber-500"
            >
              Undo
            </button>
          </div>
        )}

        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="grid items-stretch gap-[18px] lg:grid-cols-3">
            {COLUMN_ORDER.map((colId) => {
              const col = columns[colId];
              const meta = COLUMN_META[colId];
              const completedSubtasks = col.cards.reduce(
                (count, card) => count + card.subtasks.filter((subtask) => subtask.done).length,
                0
              );

              return (
                <section
                  key={col.id}
                  className="flex min-w-0 flex-col rounded-[8px] border border-[#dbe3ef] bg-slate-100/90 p-2.5 shadow-[0_8px_20px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <div className="mb-2 flex items-center gap-2 px-1.5 py-1" title={meta.label}>
                    <h2 className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[#0b1736] dark:text-white">{col.title}</h2>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">{col.cards.length}</span>
                    {col.cards.length > 0 && (
                      <span className="ml-auto text-[11px] font-medium text-slate-400">
                        {completedSubtasks} subtasks done
                      </span>
                    )}
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex min-h-[80px] flex-1 flex-col gap-2 rounded-[6px] p-1 transition ${
                          snapshot.isDraggingOver
                            ? "border border-dashed border-[#0b1736] bg-[#eef3ff] outline-none dark:border-[#1e3a8a] dark:bg-[#0f172a]"
                            : "border border-transparent"
                        }`}
                      >
                        {col.cards.length === 0 && !snapshot.isDraggingOver && (
                          <div className="grid min-h-[70px] place-items-center content-center gap-0.5 rounded-[6px] border border-dashed border-slate-300 bg-white/40 text-slate-400 dark:border-slate-600 dark:bg-slate-900/60">
                            <span className="text-xl font-light text-[#1e3a8a]">+</span>
                            <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em]">Drop a task here</p>
                          </div>
                        )}

                        {col.cards.map((card, index) => {
                          const isSelected = selectedCardIds.includes(card.id);
                          const completedCount = card.subtasks.filter((subtask) => subtask.done).length;
                          const ownerName = card.ownerName || "Unassigned";
                          const firstLabel = card.labels?.[0];
                          const firstLabelColor = firstLabel?.color || "#1e3a8a";

                          return (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(provided, snapshot) => (
                                <article
                                  ref={(node) => {
                                    provided.innerRef(node);
                                    cardRefs.current[card.id] = node;
                                  }}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  aria-label={`Task ${card.title}`}
                                  className={`group relative flex cursor-grab flex-col gap-2 rounded-[6px] border border-slate-200/70 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-shadow duration-150 hover:border-[#1e3a8a]/40 hover:shadow-[0_4px_10px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-slate-800/90 ${
                                    isSelected
                                      ? "ring-2 ring-[#0b1736]/35 dark:ring-[#1e3a8a]/50"
                                      : ""
                                  } ${
                                    snapshot.isDragging ? "scale-[1.01] rotate-[0.3deg] opacity-90 shadow-xl" : ""
                                  }`}
                                  style={{ ...provided.draggableProps.style, userSelect: "none", WebkitUserSelect: "none" }}
                                >
                                  {snapshot.isDragging && draggingCardIds.length > 1 && (
                                    <span className="absolute right-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-[6px] bg-[#0b1736] px-1.5 text-[10px] font-bold text-white shadow-sm">
                                      {draggingCardIds.length}
                                    </span>
                                  )}

                                  <div className="flex items-start gap-2">
                                    <div
                                      className="flex min-w-0 flex-1 cursor-pointer flex-col gap-2"
                                      onClick={(event) => {
                                        if (event.metaKey || event.ctrlKey) {
                                          toggleCardSelection(card.id, event);
                                          return;
                                        }

                                        setSelectedCardIds([]);
                                        openCardDetail(card.id, col.id);
                                      }}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          setSelectedCardIds([]);
                                          openCardDetail(card.id, col.id);
                                        }
                                      }}
                                    >
                                      <h3 className="m-0 line-clamp-3 text-[13px] font-medium leading-[18px] text-slate-800 dark:text-slate-100">
                                        {card.title}
                                      </h3>

                                      {firstLabel && (
                                        <span
                                          className="inline-flex w-fit max-w-full items-center truncate rounded-[3px] px-1.5 text-[10px] font-bold uppercase leading-4 tracking-[0.04em]"
                                          style={{
                                            backgroundColor: `${firstLabelColor}1f`,
                                            color: firstLabelColor
                                          }}
                                        >
                                          {firstLabel.name}
                                        </span>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteCard(col.id, card.id);
                                      }}
                                      className="-mr-1 -mt-0.5 rounded-[4px] px-1 text-base leading-5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100 dark:hover:bg-red-500/10"
                                      aria-label={`Delete ${card.title}`}
                                    >
                                      ×
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                    {card.subtasks.length > 0 && (
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-[3px] px-1.5 py-px font-semibold ${
                                          completedCount === card.subtasks.length
                                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                                        }`}
                                        title="Subtasks completed"
                                      >
                                        ✓ {completedCount}/{card.subtasks.length}
                                      </span>
                                    )}

                                    <span className="min-w-0 flex-1 truncate">
                                      {formatRelativeTime(card.updatedAt || card.createdAt)}
                                    </span>

                                    <span
                                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] text-[10px] font-bold uppercase text-white"
                                      title={ownerName}
                                    >
                                      {ownerName.trim().charAt(0) || "?"}
                                    </span>
                                  </div>
                                </article>
                              )}
                            </Draggable>
                          );
                        })}

                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <div className="mt-2 px-1 pb-0.5">
                    <div className="flex gap-2 max-sm:flex-col">
                      <input
                        type="text"
                        placeholder="+ Add a task..."
                        className="min-w-0 flex-1 rounded-[6px] border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0b1736] focus:ring-2 focus:ring-[#0b1736]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        value={newCardText[colId]}
                        onChange={(event) =>
                          setNewCardText((prev) => ({ ...prev, [colId]: event.target.value }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") addCard(colId);
                        }}
                      />
                      <button
                        type="button"
                        className="rounded-[6px] bg-[#0b1736] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#12214a] max-sm:w-full dark:bg-[#0b1736] dark:hover:bg-[#12214a]"
                        onClick={() => addCard(colId)}
                      >
                        Add
                      </button>
                    </div>

                  </div>
                </section>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {editingCard && draftCard && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 pt-20 backdrop-blur-sm"
          onClick={closeCardDetail}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="relative flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)] dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-detail-title"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] px-6 py-3.5 text-white dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <span className="rounded-[5px] bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em]">
                  {columns[draftCard.colId]?.title || "Task"}
                </span>
                <h3 id="card-detail-title" className="m-0 text-sm font-semibold tracking-wide text-white/90">
                  Task details
                </h3>
              </div>

              <button
                type="button"
                onClick={closeCardDetail}
                className="flex h-8 w-8 items-center justify-center rounded-[6px] text-xl text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Close card details"
              >
                ×
              </button>
            </div>

            <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_270px] md:overflow-hidden">
              <div className="min-h-0 space-y-5 px-6 py-5 md:overflow-y-auto">
                <label className="block">
                  <span className={detailLabelClass}>Title</span>
                  <input
                    ref={firstFocusableRef}
                    type="text"
                    value={draftCard.title}
                    maxLength={120}
                    onChange={(event) => setDraftCard((prev) => ({ ...prev, title: event.target.value }))}
                    className={`${detailFieldClass} !py-2.5 !text-base font-semibold`}
                  />
                </label>

                <label className="block">
                  <span className={detailLabelClass}>Description</span>
                  <textarea
                    value={draftCard.description}
                    rows={4}
                    placeholder="Add more detail about this task..."
                    onChange={(event) => setDraftCard((prev) => ({ ...prev, description: event.target.value }))}
                    className={`${detailFieldClass} resize-none leading-6`}
                  />
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                      Subtasks
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                      {detailDone}/{detailTotal} · {detailPercent}%
                    </span>
                  </div>

                  <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1e3a8a] to-[#1d4ed8] transition-all duration-300"
                      style={{ width: `${detailPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draftCard.newSubtaskText || ""}
                      onChange={(event) =>
                        setDraftCard((prev) => ({
                          ...prev,
                          newSubtaskText: event.target.value
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addDraftSubtask();
                        }
                      }}
                      placeholder="Add a subtask and press Enter"
                      className={detailFieldClass}
                    />
                    <button
                      type="button"
                      onClick={addDraftSubtask}
                      className="h-[38px] shrink-0 rounded-[8px] bg-[#0b1736] px-4 text-sm font-semibold text-white transition hover:bg-[#12214a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/40"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {(draftCard.subtasks || []).length === 0 ? (
                      <p className="rounded-[8px] border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400 dark:border-slate-600">
                        No subtasks yet.
                      </p>
                    ) : (
                      (draftCard.subtasks || []).map((subtask, index) => (
                        <div
                          key={subtask.id}
                          className="group flex items-center gap-2.5 rounded-[8px] border border-slate-200 bg-slate-50/70 px-3 py-2 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.done}
                            onChange={() => toggleDraftSubtask(subtask.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#0b1736] focus:ring-[#0b1736]"
                            aria-label={`Toggle subtask ${subtask.text}`}
                          />

                          <span
                            className={`min-w-0 flex-1 break-words text-sm ${
                              subtask.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {subtask.text}
                          </span>

                          <div className="flex items-center gap-1 opacity-60 transition group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => moveDraftSubtask(subtask.id, -1)}
                              disabled={index === 0}
                              className="rounded-[5px] px-1.5 py-0.5 text-xs text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                              aria-label="Move subtask up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDraftSubtask(subtask.id, 1)}
                              disabled={index === (draftCard.subtasks || []).length - 1}
                              className="rounded-[5px] px-1.5 py-0.5 text-xs text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                              aria-label="Move subtask down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDraftSubtask(subtask.id)}
                              className="rounded-[5px] px-1.5 py-0.5 text-xs text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                              aria-label={`Delete subtask ${subtask.text}`}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-5 border-t border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-700 dark:bg-slate-950/40 md:min-h-0 md:overflow-y-auto md:border-l md:border-t-0">
                <label className="block">
                  <span className={detailLabelClass}>Owner</span>
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] text-xs font-bold uppercase text-white">
                      {draftCard.ownerName.trim().charAt(0) || "?"}
                    </span>
                    <input
                      type="text"
                      value={draftCard.ownerName}
                      placeholder="Unassigned"
                      onChange={(event) => setDraftCard((prev) => ({ ...prev, ownerName: event.target.value }))}
                      className={detailFieldClass}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={detailLabelClass}>Labels</span>
                  <input
                    type="text"
                    value={draftCard.labels.join(", ")}
                    placeholder="e.g. Design, Urgent"
                    onChange={(event) =>
                      setDraftCard((prev) => ({
                        ...prev,
                        labels: event.target.value
                          .split(",")
                          .map((label) => label.trim())
                          .filter(Boolean)
                      }))
                    }
                    className={detailFieldClass}
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">Separate labels with commas</span>
                </label>

                <div className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{columns[draftCard.colId]?.title}</span>
                  </div>
                  {detailCard?.createdAt && (
                    <div className="flex items-center justify-between">
                      <span>Created</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatRelativeTime(detailCard.createdAt)}</span>
                    </div>
                  )}
                  {detailCard?.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span>Updated</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{formatRelativeTime(detailCard.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </aside>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3.5 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={closeCardDetail}
                className="rounded-[8px] border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCardDetail}
                className="rounded-[8px] bg-[#0b1736] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(11,23,54,0.25)] transition hover:bg-[#12214a]"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Kanban;
