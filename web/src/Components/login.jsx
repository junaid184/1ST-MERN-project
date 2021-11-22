import axios from 'axios';
import {useFormik} from 'formik';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import * as yup from 'yup';
import {
    useHistory
} from 'react-router-dom';
import { GlobalContext } from '../context/Context';
import { useContext } from 'react';
const dev = 'http://localhost:8000';
const baseURL = window.location.hostname.split(':')[0] === 'localhost' ? dev : ""
const validationSchema = yup.object({
    email: yup
    .string('Enter string')
    .email('Enter email')
    .required('this field is required'),
    password: yup
    .string('enter string')
    .required('password is required')
  })
function Login(){
    let history = useHistory();
    const {state,dispatch} = useContext(GlobalContext);
    const formik = useFormik({
        validationSchema: validationSchema,
        initialValues:{
            email: '',
            password: ''
          },
          onSubmit: onSubmitFunction
    })
    function onSubmitFunction(values){
        console.log(values);
        axios.post(`${baseURL}/api/v1/login`,{
            email: values.email,
            password: values.password
        },{ withCredentials: true })
        .then((res)=>{
            console.log(res);
            if(res.data.email){ 
                
                dispatch({
                    type: 'USER_LOGIN',
                    payload: {
                        fullName: res.data.fullName,
                        email: res.data.email,
                        address: res.data.address,
                        _id: res.data._id
                    }
                })
                alert('login successfull');
            }
           
        })
        .catch((err)=>{
            alert('login unsuccessfull error found');
            console.log('error: ', err)
        })
    }

    return(
        <div className="login">
            <h1> Log In</h1>
       <form onSubmit={formik.handleSubmit}>
        <Stack spacing={3}>
          <TextField
            
            color="primary"
            id="outlined-basic"
            label="Email"
            variant="outlined"
            type = "email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}

            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />

          <TextField
            
            color="primary"
            type="password"
            id="filled-basic"
            label="Password"
            variant="outlined"
            name="password"
            value={formik.values.password}
            onChange={formik.handleChange}

            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            />

          <Button  variant="contained" color="primary" type="submit">Log in</Button>
        </Stack>
        </form>
        </div>
    )
}

export default Login;