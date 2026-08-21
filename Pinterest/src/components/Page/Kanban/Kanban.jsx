import { useEffect, useRef, useState } from "react";
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
    tone: "blue",
    marker: "01"
  },
  inprogress: {
    label: "Make it happen",
    tone: "indigo",
    marker: "02"
  },
  done: {
    label: "Keep the momentum",
    tone: "emerald",
    marker: "03"
  }
};

function Kanban() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedColumns = useRef(false);
  const [newCardText, setNewCardText] = useState({ todo: "", inprogress: "", done: "" });
  const totalCards = COLUMN_ORDER.reduce((total, colId) => total + columns[colId].cards.length, 0);

  useEffect(() => {
    let isMounted = true;

    const loadKanban = async () => {
      try {
        const data = await fetchKanban();
        if (isMounted && data?.columns) {
          setColumns((current) => ({
            ...current,
            ...Object.fromEntries(
              COLUMN_ORDER.map((columnId) => [
                columnId,
                {
                  ...current[columnId],
                  ...(data.columns[columnId] || {}),
                  cards: Array.isArray(data.columns[columnId]?.cards)
                    ? data.columns[columnId].cards
                    : current[columnId].cards
                }
              ])
            )
          }));
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
    if (!hasLoadedColumns.current) {
      return;
    }

    saveKanban(columns).catch((error) => {
      console.error("Failed to save Kanban board:", error);
    });
  }, [columns]);

  function onDragEnd(result) {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const sourceCards = [...sourceCol.cards];
    const [moved] = sourceCards.splice(source.index, 1);
    if (source.droppableId === destination.droppableId) {
      sourceCards.splice(destination.index, 0, moved);
      setColumns(prev => ({
        ...prev,
        [source.droppableId]: { ...sourceCol, cards: sourceCards }
      }));
    } else {
      const destCards = [...destCol.cards];
      destCards.splice(destination.index, 0, moved);
      setColumns(prev => ({
        ...prev,
        [source.droppableId]: { ...sourceCol, cards: sourceCards },
        [destination.droppableId]: { ...destCol, cards: destCards }
      }));
    }
  }
  function addCard(colId) {
    const text = newCardText[colId].trim();
    if (!text) return;
    const card = { id: `card-${Date.now()}`, text };
    setColumns(prev => ({
      ...prev,
      [colId]: { ...prev[colId], cards: [...prev[colId].cards, card] }
    }));
    setNewCardText(prev => ({ ...prev, [colId]: "" }));
  }
  function deleteCard(colId, cardId) {
    setColumns(prev => ({
      ...prev,
      [colId]: {
        ...prev[colId],
        cards: prev[colId].cards.filter(c => c.id !== cardId)
      }
    }));
  }
  return (
    <main className="relative isolate min-h-screen bg-transparent px-4 py-8 text-[#0b1736] dark:text-slate-100 sm:px-6 lg:px-12 lg:py-12">
      <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
      <div className="mx-auto max-w-7xl">
        {isLoading && <p className="mb-4 text-sm text-slate-500">Loading your board...</p>}
        <header className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#1e3a8a]">Learning workflow</p>
            <h1 className="text-4xl font-bold tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">Kanban Board</h1>
            <p className="mt-3 max-w-xl text-base leading-6 text-slate-500 dark:text-slate-400">Turn loose ideas into visible progress, one small step at a time.</p>
          </div>
          <div className="flex min-w-[190px] items-center gap-3 rounded-[18px] border border-[#dbe3ef] bg-white px-5 py-4 text-sm font-semibold text-slate-500 shadow-[0_10px_24px_rgba(11,23,54,0.08)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            <span className="text-3xl font-extrabold text-[#0b1736] dark:text-white">{totalCards}</span>
            <span>{totalCards === 1 ? "task on your board" : "tasks on your board"}</span>
          </div>
        </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-[18px] lg:grid-cols-3">
          {COLUMN_ORDER.map(colId => {
            const col = columns[colId];
            const meta = COLUMN_META[colId];
            return (
              <section className="min-w-0 rounded-[22px] border border-[#dbe3ef] bg-white/90 p-[18px] shadow-[0_10px_26px_rgba(11,23,54,0.07)] backdrop-blur dark:border-slate-700 dark:bg-slate-900" key={col.id}>
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
                  <div className="flex items-center gap-[11px]">
                    <span className="grid h-[34px] w-[34px] place-items-center rounded-[11px] bg-blue-50 text-[11px] font-extrabold text-[#1e3a8a] dark:bg-blue-950/40 dark:text-blue-200">{meta.marker}</span>
                    <div>
                      <h2 className="text-[1.15rem] font-bold text-[#0b1736] dark:text-white">{col.title}</h2>
                      <p className="mt-[3px] text-xs text-slate-400">{meta.label}</p>
                    </div>
                  </div>
                  <span className="grid h-[30px] min-w-[30px] place-items-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{col.cards.length}</span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      className={`flex min-h-[320px] flex-col gap-3 rounded-[14px] p-1.5 transition ${snapshot.isDraggingOver ? "bg-blue-50 outline-dashed outline-2 outline-blue-300 outline-offset-2 dark:bg-blue-950/40 dark:outline-blue-700" : ""}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {col.cards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="grid min-h-[130px] place-items-center content-center gap-1 rounded-[14px] border border-dashed border-slate-300 text-slate-400 dark:border-slate-600">
                          <span className="text-2xl font-light text-[#1e3a8a]">+</span>
                          <p className="m-0 text-xs font-semibold">Drop a task here</p>
                        </div>
                      )}
                      {col.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className={`relative flex min-h-[94px] cursor-grab rounded-[15px] border border-slate-300/40 p-6 pb-4 pr-9 shadow-[0_6px_14px_rgba(11,23,54,0.08)] transition hover:z-10 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(11,23,54,0.14)] dark:border-slate-700/60 ${index % 4 === 0 ? "bg-blue-50 dark:bg-blue-950/40" : index % 4 === 1 ? "bg-blue-100 dark:bg-blue-900/40" : index % 4 === 2 ? "bg-indigo-50 dark:bg-indigo-950/40" : "bg-indigo-100 dark:bg-indigo-900/40"} ${snapshot.isDragging ? "z-50 rotate-1 scale-[1.02] shadow-[0_18px_30px_rgba(11,23,54,0.2)]" : ""}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <span className="absolute left-[15px] top-[7px] text-[11px] tracking-[2px] text-blue-800/35">•••</span>
                              <p className="m-0 text-sm font-semibold leading-5 text-[#0b1736] dark:text-slate-100">{card.text}</p>
                              <button
                                className="absolute right-2 top-1.5 border-0 bg-transparent text-base text-blue-900/50 transition hover:text-red-600"
                                onClick={() => deleteCard(col.id, card.id)}
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="mt-3.5 flex gap-2.5 max-sm:flex-col">
                  <input
                    type="text"
                    placeholder="Add a card..."
                    className="min-w-0 flex-1 rounded-[10px] border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    value={newCardText[colId]}
                    onChange={e => setNewCardText(prev => ({ ...prev, [colId]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addCard(colId)}
                  />
                  <button className="rounded-[10px] bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] px-4 py-2.5 font-bold text-white transition hover:-translate-y-0.5 hover:from-[#0b1736] hover:to-[#0b1736] max-sm:w-full" onClick={() => addCard(colId)}>+</button>
                </div>
              </section>
            );
          })}
        </div>
      </DragDropContext>
      </div>
    </main>
  );
}

export default Kanban;
