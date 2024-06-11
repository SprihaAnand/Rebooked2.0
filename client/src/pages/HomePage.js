import React, { useEffect, useState } from 'react'
import {useSelector} from "react-redux"
import Spinner from '../components/Shared/Spinner'
import Layout from '../components/Shared/Layout/Layout'
import Modal from '../components/Shared/modal/Modal'
import { Cursor } from 'mongoose'
import API from '../services/API'
import moment from 'moment'

const HomePage = () => {
  const {loading, error} = useSelector((state)=>state.auth)
  const [data, setData] = useState([])

  //get function
  const getBookRecords = async()=>{
    try {
      const {data} = await API.get('/inventory/get-inventory')
      if(data?.success){
        setData(data?.inventory)
        console.log(data)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(()=>{
    getBookRecords()
  }, [])
  return (
    <Layout>
    {error && <span>{alert(error)}</span>}
    {loading?(
      <Spinner/>):
      (
        <>
          <h4 className='ms-4' data-bs-toggle="modal" data-bs-target="#exampleModal" style={{cursor:"pointer"}}>
            <i className='fa-solid fa-plus text-success py-4'></i>
            Add Inventory
          </h4>
          <div className='container'>
<table className="table ">
  <thead>
    <tr>
      <th scope="col">Genre</th>
      <th scope="col">Inventory Type</th>
      <th scope="col">Donar Email</th>
      <th scope="col">Time & Date</th>
    </tr>
  </thead>
  <tbody>
    {data?.map((record)=>(
    <tr key={record._id}>
      <td>{record.bookGroup}</td>
      <td>{record.inventoryType}</td>
      <td>{record.quantity}</td>
      <td>{record.donateEmail}</td>
      <td>{moment(record.createdAt).format('DD/MM/YYYY hh:mm A')}</td>
    </tr>
    ))}
    
  </tbody>
</table>
</div>

          <Modal/>
        </>

      )
    }
    </Layout>
  )
}

export default HomePage
