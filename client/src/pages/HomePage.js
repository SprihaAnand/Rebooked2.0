import React from 'react'
import {useSelector} from "react-redux"
import Spinner from '../components/Shared/Spinner'
import Layout from '../components/Shared/Layout/Layout'
const HomePage = () => {
  const {loading, error} = useSelector((state)=>state.auth)
  return (
    <Layout>
    {error && <span>{alert(error)}</span>}
    {loading?(
      <Spinner/>):
      (
        <div>
          <h1>Home Page</h1>
        </div>

      )
    }
    </Layout>
  )
}

export default HomePage
