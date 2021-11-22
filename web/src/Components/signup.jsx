import axios from 'axios';
import {useFormik} from 'formik';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import * as yup from 'yup';
import {
  useHistory
} from "react-router-dom";
const dev = 'http://localhost:8000';

const baseURL = window.location.hostname.split(':')[0] === 'localhost' ? dev : ""
const validationSchema = yup.object({
  fullName: yup
  .string('Enter String')
  .required('this field is required'),
  email: yup
  .string('Enter string')
  .email('Enter email')
  .required('this field is required'),
  address: yup
  .string('Enter String')
  .required('this field is required'),
  password: yup
  .string('enter string')
  .min(8, 'Password should be of minimum 8 characters')
  .required('password is required')
})
function Signup() {
  let history = useHistory();
  const formik = useFormik({
    validationSchema: validationSchema,
    initialValues:{
      fullName: '',
      email: '',
      password:'',
      address:''
    },
    onSubmit: onSubmitFunction
  });
  function onSubmitFunction(values){
    axios.post(`${baseURL}/api/v1/signup`,{
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      address: values.address
    })
    .then(res=>{
      alert('data Written');
      history.push('/login');
    })
    .catch((err)=>{
      alert('Some thing went wrong please try with different email');
    })
  }
  return (
    <div className="App">
      <h1>  Sign Up </h1>
       <form onSubmit={formik.handleSubmit}>
        <Stack spacing={3}>
          <TextField
            
            color="primary"
            id="outlined-basic"
            label="Full Name"
            variant="outlined"

            name="fullName"
            value={formik.values.fullName}
            onChange={formik.handleChange}

            error={formik.touched.fullName && Boolean(formik.errors.fullName)}
            helperText={formik.touched.fullName && formik.errors.fullName}
          />

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
            >
            

          </TextField>
          <TextField
            
            color="primary"
            id="filled-basic"
            label="Address"
            variant="outlined"
            type="address"

            name="address"
            value={formik.values.address}
            onChange={formik.handleChange}

            error={formik.touched.address && Boolean(formik.errors.address)}
            helperText={formik.touched.address && formik.errors.address}
          />

          <Button  variant="contained" color="primary" type="submit">Sign Up</Button>
        </Stack>
      </form>
      
    </div>
  );
}

export default Signup;
