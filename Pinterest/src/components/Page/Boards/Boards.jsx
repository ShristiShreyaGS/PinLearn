import "./Boards.css";

function Boards({ boards }) {
  return (
    <div className="boards-page">

      <h1>My Boards</h1>

      <div className="boards-grid">

        {boards.map((board) => (
          <div className="board-card" key={board.id}>

            <h2>{board.name}</h2>

            <p>
              {board.resources.length} resources
            </p>

            <div className="board-resources">

              {board.resources.map((resource) => (
                <div
                  className="saved-resource"
                  key={resource.id}
                >
                  <h3>{resource.title}</h3>

                  <p>{resource.description}</p>
                </div>
              ))}

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Boards;