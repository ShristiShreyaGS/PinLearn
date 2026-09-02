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

  function toggleSubtask(colId, cardId, subtaskId) {
    setColumns((prev) => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        cards: prev[colId].cards.map((card) => {
          if (card.id !== cardId) return card;

          return {
            ...card,
            updatedAt: new Date().toISOString(),
            subtasks: card.subtasks.map((subtask) =>
              subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask
            )
          };
        })
      }
    }));
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
          <div className="grid gap-[18px] lg:grid-cols-3">
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
                  className="flex min-w-0 max-h-[70vh] flex-col rounded-[10px] border border-[#dbe3ef] bg-white/85 p-[18px] shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
                    <div className="flex items-center gap-[11px]">
                      <span className="grid h-[34px] w-[34px] place-items-center rounded-[6px] bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] text-[11px] font-extrabold text-white shadow-sm">
                        {meta.marker}
                      </span>
                      <div>
                        <h2 className="text-[1.15rem] font-bold text-[#0b1736] dark:text-white">{col.title}</h2>
                        <p className="mt-[3px] text-xs text-slate-400">{meta.label}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="grid h-[30px] min-w-[30px] place-items-center rounded-[6px] bg-slate-700 px-2.5 text-xs font-extrabold text-white shadow-sm ring-1 ring-slate-300 dark:bg-slate-100 dark:text-slate-800 dark:ring-slate-700">
                        {col.cards.length}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                        {completedSubtasks}/{col.cards.length} done
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex min-h-[200px] flex-1 min-h-0 flex-col gap-3 overflow-y-auto rounded-[8px] p-2 transition ${
                          snapshot.isDraggingOver
                            ? "border border-dashed border-[#0b1736] bg-[#eef3ff] outline-none dark:border-[#1e3a8a] dark:bg-[#0f172a]"
                            : "border border-transparent bg-slate-50/60 dark:bg-slate-950/30"
                        }`}
                      >
                        {col.cards.length === 0 && !snapshot.isDraggingOver && (
                          <div className="grid min-h-[130px] place-items-center content-center gap-1 rounded-[8px] border border-dashed border-slate-300 bg-white/40 text-slate-400 shadow-inner dark:border-slate-600 dark:bg-slate-900/60">
                            <span className="text-2xl font-light text-[#1e3a8a]">+</span>
                            <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em]">Drop a task here</p>
                          </div>
                        )}

                        {col.cards.map((card, index) => {
                          const isSelected = selectedCardIds.includes(card.id);
                          const completedCount = card.subtasks.filter((subtask) => subtask.done).length;
                          const ownerName = card.ownerName || "Unassigned";
                          const firstLabel = card.labels?.[0];
                          const firstLabelColor = firstLabel?.color || "#1e3a8a";
                          const progressValue = card.subtasks.length
                            ? (completedCount / card.subtasks.length) * 100
                            : 0;

                          return (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(provided, snapshot) => (
                                <article
                                  ref={(node) => {
                                    provided.innerRef(node);
                                    cardRefs.current[card.id] = node;
                                  }}
                                  {...provided.draggableProps}
                                  className={`relative flex flex-col gap-2 rounded-[8px] border border-slate-200/80 bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-800/90 ${
                                    isSelected
                                      ? "ring-2 ring-[#0b1736]/35 dark:ring-[#1e3a8a]/50"
                                      : ""
                                  } ${
                                    snapshot.isDragging ? "scale-[1.01] rotate-[0.3deg] opacity-90 shadow-xl" : ""
                                  }`}
                                  style={{ ...provided.draggableProps.style, borderLeft: `4px solid ${firstLabelColor}` }}
                                >
                                  {snapshot.isDragging && draggingCardIds.length > 1 && (
                                    <span className="absolute right-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-[6px] bg-[#0b1736] px-1.5 text-[10px] font-bold text-white shadow-sm">
                                      {draggingCardIds.length}
                                    </span>
                                  )}

                                  <div className="flex items-start gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      onClick={(event) => event.stopPropagation()}
                                      className="mt-0.5 flex h-7 w-7 shrink-0 cursor-grab select-none items-center justify-center rounded-[5px] border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-600"
                                      aria-label={`Drag card ${card.title}`}
                                      style={{ userSelect: "none", WebkitUserSelect: "none", MozUserSelect: "none" }}
                                    >
                                      <span className="text-[10px] tracking-[0.2em]">⋮⋮</span>
                                    </div>

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
                                      {firstLabel && (
                                        <span
                                          className="inline-flex w-fit items-center rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                                          style={{
                                            borderColor: `${firstLabelColor}55`,
                                            backgroundColor: `${firstLabelColor}15`,
                                            color: firstLabelColor
                                          }}
                                        >
                                          {firstLabel.name}
                                        </span>
                                      )}

                                      <h3 className="m-0 line-clamp-2 text-[0.98rem] font-semibold leading-5 text-slate-800 dark:text-slate-100">
                                        {card.title}
                                      </h3>

                                      {card.description && (
                                        <p className="m-0 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-300">
                                          {card.description}
                                        </p>
                                      )}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        deleteCard(col.id, card.id);
                                      }}
                                      className="mt-0.5 rounded-[5px] p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                                      aria-label={`Delete ${card.title}`}
                                    >
                                      ×
                                    </button>
                                  </div>

                                  <div className="mt-1 border-t border-slate-200 pt-3 dark:border-slate-700">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex min-w-0 items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                        <span className="truncate font-medium">{ownerName}</span>
                                      </div>

                                      <span className="shrink-0 text-[11px] font-medium text-slate-400 dark:text-slate-400">
                                        {formatRelativeTime(card.updatedAt || card.createdAt)}
                                      </span>
                                    </div>

                                    {card.subtasks.length > 0 && (
                                      <div className="mt-3">
                                        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-300">
                                          <span>{completedCount}/{card.subtasks.length}</span>
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-[3px] bg-slate-200 dark:bg-slate-700">
                                          <div
                                            className="h-full rounded-[3px] bg-[#1e3a8a] transition-all duration-200"
                                            style={{ width: `${(completedCount / card.subtasks.length) * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                    )}
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

                  <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-700">
                    <div className="flex gap-2.5 max-sm:flex-col">
                      <input
                        type="text"
                        placeholder="Add a task..."
                        className="min-w-0 flex-1 rounded-[8px] border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0b1736] focus:ring-4 focus:ring-[#0b1736]/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
                        className="rounded-[8px] bg-[#0b1736] px-4 py-2.5 font-bold text-white shadow-[0_8px_18px_rgba(11,23,54,0.2)] transition hover:-translate-y-0.5 hover:bg-[#12214a] max-sm:w-full dark:bg-[#0b1736] dark:hover:bg-[#12214a]"
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 pt-20"
          onClick={closeCardDetail}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="relative flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-detail-title"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Card details</p>
                <h3 id="card-detail-title" className="text-[2rem] font-semibold leading-none tracking-[-0.05em] text-slate-900 dark:text-white">Edit task</h3>
              </div>

              <button
                type="button"
                onClick={closeCardDetail}
                className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus:ring-slate-600"
                aria-label="Close card details"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[6px] bg-slate-50 px-3 py-2.5 dark:bg-slate-800/80">
                    <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-slate-500 dark:text-slate-400">Progress</p>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {draftCard.subtasks.filter((subtask) => subtask.done).length} of {draftCard.subtasks.length} complete
                    </p>
                  </div>

                  <div className="rounded-[6px] bg-slate-50 px-3 py-2.5 dark:bg-slate-800/80">
                    <p className="text-[10px] font-medium uppercase tracking-[0.17em] text-slate-500 dark:text-slate-400">Subtasks</p>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {draftCard.subtasks.length} total
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Title</span>
                    <input
                      ref={firstFocusableRef}
                      type="text"
                      value={draftCard.title}
                      maxLength={120}
                      onChange={(event) => setDraftCard((prev) => ({ ...prev, title: event.target.value }))}
                      className="w-full rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700/60"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Description</span>
                    <textarea
                      value={draftCard.description}
                      rows={3}
                      onChange={(event) => setDraftCard((prev) => ({ ...prev, description: event.target.value }))}
                      className="w-full resize-none rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700/60"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Owner</span>
                      <input
                        type="text"
                        value={draftCard.ownerName}
                        onChange={(event) => setDraftCard((prev) => ({ ...prev, ownerName: event.target.value }))}
                        className="w-full rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700/60"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Labels</span>
                      <input
                        type="text"
                        value={draftCard.labels.join(", ")}
                        onChange={(event) =>
                          setDraftCard((prev) => ({
                            ...prev,
                            labels: event.target.value
                              .split(",")
                              .map((label) => label.trim())
                              .filter(Boolean)
                          }))
                        }
                        className="w-full rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700/60"
                      />
                    </label>
                  </div>
                </div>

                <div className="mt-4 rounded-[6px] border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/80">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Subtasks</p>
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
                      placeholder="Add a subtask"
                      className="min-w-0 flex-1 rounded-[6px] border border-slate-200 bg-white px-3 py-2.5 text-[15px] text-slate-800 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500 dark:focus:ring-slate-700/60"
                    />
                    <button
                      type="button"
                      onClick={addDraftSubtask}
                      className="h-[42px] min-w-[92px] rounded-[6px] bg-[#0b1736] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12214a] focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(draftCard.subtasks || []).length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">No subtasks yet.</p>
                    ) : (
                      (draftCard.subtasks || []).map((subtask, index) => (
                        <div
                          key={subtask.id}
                          className="flex items-center gap-2 rounded-[6px] border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={subtask.done}
                            onChange={() => toggleDraftSubtask(subtask.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#0b1736] focus:ring-[#0b1736]"
                            aria-label={`Toggle subtask ${subtask.text}`}
                          />

                          <span
                            className={`flex-1 text-sm ${
                              subtask.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {subtask.text}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveDraftSubtask(subtask.id, -1)}
                              disabled={index === 0}
                              className="rounded-md border border-slate-200 p-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                              aria-label={`Move subtask up`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDraftSubtask(subtask.id, 1)}
                              disabled={index === (draftCard.subtasks || []).length - 1}
                              className="rounded-md border border-slate-200 p-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                              aria-label={`Move subtask down`}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDraftSubtask(subtask.id)}
                              className="rounded-md border border-red-200 bg-red-50 p-1 text-xs text-red-600 transition hover:bg-red-100 dark:border-red-700/50 dark:bg-red-500/10 dark:text-red-300"
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
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={closeCardDetail}
                className="rounded-[6px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCardDetail}
                className="rounded-[6px] bg-[#0b1736] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(11,23,54,0.22)] transition hover:bg-[#12214a]"
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
