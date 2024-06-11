import FadeLoader from "react-spinners/FadeLoader"

export default function Spinner() {
  return (
    <div className="App">
      <div className="wrapper">
      <FadeLoader 
        color={"brown"} 
        loading={true} 
        size={20}
        margin={1}
        width={4}
        height={7}
      />
      </div>
    </div>
  );
}