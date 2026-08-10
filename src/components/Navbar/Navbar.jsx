import "./Navbar.css";
function Navbar(){
    return(
        <nav className="navbar">
            <div className="logo">PinLearn</div>
            <div className="nav-links">
                <a href="/">Home</a>
                <a href="/explore">Explore</a>
                <a href="/boards">My Boards</a>
            </div>
            <div className="search-box">
                <input type="text" placeholder="Search..."></input>

            </div>
            <div className="profile">
                Profile
            </div>
        </nav>
    );
}
export default Navbar;
