import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./Kanban.css";

const INITIAL_COLUMNS = {
  todo: { id: "todo", title: "To Do", cards: [] },
  inprogress: { id: "inprogress", title: "In Progress", cards: [] },
  done: { id: "done", title: "Done", cards: [] }
};

const COLUMN_ORDER = ["todo", "inprogress", "done"];
function Kanban() {
  const [columns, setColumns] = useState(INITIAL_COLUMNS);
  const [newCardText, setNewCardText] = useState({ todo: "", inprogress: "", done: "" });
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
    <div className="kanban-page">
      <h1>Kanban Board</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {COLUMN_ORDER.map(colId => {
            const col = columns[colId];
            return (
              <div className="kanban-column" key={col.id}>
                <div className="kanban-column-header">
                  <h2>{col.title}</h2>
                  <span className="card-count">{col.cards.length}</span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      className={`kanban-cards${snapshot.isDraggingOver ? " dragging-over" : ""}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {col.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className={`kanban-card${snapshot.isDragging ? " dragging" : ""}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <p>{card.text}</p>
                              <button
                                className="delete-card"
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

                <div className="add-card-form">
                  <input
                    type="text"
                    placeholder="Add a card..."
                    value={newCardText[colId]}
                    onChange={e => setNewCardText(prev => ({ ...prev, [colId]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addCard(colId)}
                  />
                  <button onClick={() => addCard(colId)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

export default Kanban;
