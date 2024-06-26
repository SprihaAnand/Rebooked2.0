import React, { useState, useEffect } from "react";
import Header from "../../components/Shared/Layout/Header";
import API from "./../../services/API";
import moment from "moment";

const Analytics = () => {
  const [data, setData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);

  // GET Book Group Data
  const getBookGroupData = async () => {
    try {
      const { data } = await API.get("/analytics/bookGroups-data");
      if (data?.success) {
        setData(data?.bookGroupData);
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Lifecycle method
  useEffect(() => {
    getBookGroupData();
  }, []);

  // GET Book Records
  const getBookRecords = async () => {
    try {
      const { data } = await API.get("/inventory/get-recent-inventory");
      if (data?.success) {
        setInventoryData(data?.inventory);
        console.log(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getBookRecords();
  }, []);


  return (
    <div className='analytics'>
      <Header />
      <div className="d-flex flex-row flex-wrap ">
        {data?.map((record, i) => (
          <div
            className={`card m-2 p-1 card-${i}`}
            key={i}
            style={{
              width: "18rem",
              backgroundColor: "white",
              color: "black",
            }}
          >
    
            <div className="card-body">
              <h1 className="card-title text-center mb-3">
                {record.bookGroup}
              </h1>
              <p className="card-text">
                Total In : <b>{record.totalIn}</b>
              </p>
              <p className="card-text">
                Total Out : <b>{record.totalOut}</b>
              </p>
            </div>
            <div className="card-footer text-center">
              Total Available : <b>{record.availabeBook}</b>
            </div>
          </div>
        ))}
      </div>
      <div className="container continer3 my-3">
        <h1 className="my-3 heading2">Recent Book Transactions</h1>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Book Genre</th>
              <th scope="col">Inventory Type</th>
              <th scope="col">Quantity</th>
              <th scope="col">Donar Email</th>
              <th scope="col">Time & Date</th>
            </tr>
          </thead>
          <tbody>
            {inventoryData?.map((record) => (
              <tr key={record._id}>
                <td>{record.bookGroup}</td>
                <td>{record.inventoryType}</td>
                <td>{record.quantity}</td>
                <td>{record.email}</td>
                <td>{moment(record.createdAt).format("DD/MM/YYYY hh:mm A")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;
