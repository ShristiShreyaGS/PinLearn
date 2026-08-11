import "./Boards.css";

function Boards({ boards }) {
  return (
    <div className="boards-page">
      <h1>My Boards</h1>

      <div className="boards-grid">
        {boards.map((board) => (
          <div className="board-card" key={board.id}>
            <h2>{board.name}</h2>
            <p>{board.resources.length} resources</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Boards;