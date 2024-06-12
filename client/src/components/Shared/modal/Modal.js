import React, {useState} from 'react'
import InputType from "./../Form/InputType";
import './Modal.css'
import API from "./../../../services/API";
import { useSelector } from "react-redux";

const Modal = () => {
    const [inventoryType, setInventoryType] = useState("in");
    const [bookGroup, setBookGroup] = useState("");
    const [quantity, setQuantity] = useState(0);
    const [email, setEmail] = useState("");
    const { user } = useSelector((state) => state.auth);

    const handleModalSubmit = async () => {
        try {
          if (!bookGroup || !quantity) {
            return alert("Please Provide All Fields");
          }
          const { data } = await API.post("/inventory/create-inventory", {
            email,
            organisation: user?._id,
            inventoryType,
            bookGroup,
            quantity,
          });
          if (data?.success) {
            alert("New Record Created");
            window.location.reload();
          }
        } catch (error) {
          alert(error.response.data.message);
          console.log(error);
          window.location.reload();
        }
      };
  return (
    <>
        <div className="modal fade" id="exampleModal" tabIndex={-1} aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
            <div className="modal-content">
            <div className="modal-header">
                <h1 className="modal-title fs-5" id="exampleModalLabel">
                    Manage Books Records
                    </h1>
                    
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="d-flex mb-3">
                Book Type: &nbsp;
                <div className="form-check ms-3">
                  <input
                    type="radio"
                    name="inRadio"
                    defaultChecked
                    value={"in"}
                    onChange={(e) => setInventoryType(e.target.value)}
                    className="form-check-input"
                  />
                  <label htmlFor="in" className="form-check-label">
                    IN
                  </label>
                </div>
                <div className="form-check ms-3">
                  <input
                    type="radio"
                    name="inRadio"
                    value={"out"}
                    onChange={(e) => setInventoryType(e.target.value)}
                    className="form-check-input"
                  />
                  <label htmlFor="out" className="form-check-label">
                    OUT
                  </label>
                </div>
              </div>
              <select
                className="form-select"
                aria-label="Default select example"
                onChange={(e) => setBookGroup(e.target.value)}
              >
                <option defaultValue={"Open this select menu"}>
                  Open this select menu
                </option>
                <option value={"Elementry"}>Elementry</option>
                <option value={"JEE"}>JEE</option>
                <option value={"NEET"}>NEET</option>
                <option value={"Novels"}>Novels</option>
                <option value={"Architecture"}>Architecture</option>
                <option value={"History"}>History</option>
                <option value={"Kids"}>Kids</option>
                <option value={"Autobiographies"}>Autobiographies</option>
              </select>
              <InputType
                labelText={"Donar Email"}
                labelFor={"donateEmail"}
                inputType={"email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <InputType
                labelText={"Quanitity"}
                labelFor={"quantity"}
                inputType={"Number"}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary" onClick={handleModalSubmit}>Submit</button>
            </div>
            </div>
        </div>
        </div>

    </>
  )
}

export default Modal
