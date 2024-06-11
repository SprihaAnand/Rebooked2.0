import {asyncThunkCreator, createAsyncThunk} from '@reduxjs/toolkit'
import API from "../../../services/API"
import { toast } from 'react-toastify';

//login
export const userLogin = createAsyncThunk(
    'auth/login',
    async({role, email, password}, {rejectWithValue})=>{
        try {
            const {data} = await API.post('/auth/login',{role, email, password} )

            //store token
            if(data.success){
                localStorage.setItem("token", data.token)
                toast.success(data.message)
            }
            return data
        } catch (error) {
            if(error.response && error.response.data.message){
                return rejectWithValue(error)
            }
            else{
                return rejectWithValue(error.message)
            }
        }
    }
)

//register
export const userRegister = createAsyncThunk(
    'auth/register',
    async({name,
        role,
        email,
        password,
        phone,
        organisationName,
        address,
        instituteName,
        website}, {rejectWithValue})=>{
        try {
            const {data}= await API.post('/auth/register',{name,
                role,
                email,
                password,
                phone,
                organisationName,
                address,
                instituteName,
                website
            })
            if(data.success){
                toast.success(data.message)
                window.location.replace('/lofin')
            }
        } catch (error) {
            console.log(error)
            if(error.response && error.response.data.message){
                return rejectWithValue(error.response.data.message)
            }
            else{
                return rejectWithValue(error.message)
            }
        }
    }
)