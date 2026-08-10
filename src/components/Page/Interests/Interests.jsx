import "./Interests.css";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
function Interests() {
  const interests = [
    "React",
    "JavaScript",
    "AI",
    "Playwright",
    "DSA",
    "Node.js",
    "Python",
    "Angular",
    "DevOps"
  ];
  
  const[selectedInterests,setSelectedInterests]=useState([]);
  const navigate=useNavigate();
  const handleInterestClick=(interest)=>{
    if(selectedInterests.includes(interest)){
        setSelectedInterests(
            selectedInterests.filter((item)=>item!==interest)
        
    );
    }
    else{
        setSelectedInterests([
            ...selectedInterests,interest
        ]);
    }
  };

  return (
    <div className="interests-page">

      <h1>What interests you?</h1>

      <p>
        Choose at least 3 topics to personalize your PinLearn feed.
      </p>

      <div className="interest-grid">

        {interests.map((interest) => (
          <button key={interest}
            onClick={()=>handleInterestClick(interest)}
            className={selectedInterests.includes(interest)?"interest-card selected":"interest-card"}
            >
                {interest}
          </button>
        ))}

      </div>

      <p>{selectedInterests.length} of 3 selected</p>

      <button className="continue-button" disabled={selectedInterests.length<3}
      onClick={()=>navigate("/dashboard",{state:{selectedInterests}
      })
      }>
        Continue
      </button>

    </div>
  );
}

export default Interests;