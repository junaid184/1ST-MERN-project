import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Login from './Components/login';
import Signup from './Components/signup';
import {
  Switch,
  Route,
  useHistory
} from "react-router-dom";
import Profile from './Components/profile';
import Dashboard from './Components/dashboard/dashboard';
import Splash from './Components/Splash';
import { GlobalContext } from './context/Context';
import { useContext, useEffect } from 'react';
import axios from 'axios';
const dev = 'http://localhost:8000';
const baseURL = window.location.hostname.split(':')[0] === 'localhost' ? dev : ""
function App(){
  let history = useHistory();
  let {state, dispatch} = useContext(GlobalContext);
  const logout = ()=>{
    axios.post(`${baseURL}/api/v1/logout`, {},{withCredential: true})
    .then((res)=>{
      dispatch({
        type:'USER_LOGOUT'
      })
    })
  }
  useEffect(() => {
    axios.get(`${baseURL}/api/v1/profile`, { withCredential: true})
    .then((res)=>{
        dispatch({
          type: 'USER_LOGIN',
          payload:{
            fullName: res.data.fullName,
            email: res.data.email,
            _id: res.data._id
          }
        })
    })
    .catch((e)=>{
        dispatch({ type: "USER_LOGOUT" })
    })
    return () => {
      console.log('cleanup');
    }
  }, [])
    return(
    <div className="App">

      {
        (state?.user?.email)?
        <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Button variant="h6" component="div" onClick={()=> history.push('/')}>
              Dashbaord
            </Button>
            <Button color="inherit" onClick={()=> {history.push('/profile')} }>Profile</Button>
            <Button color="inherit" varient="Danger" onClick={logout}>Logout</Button>
          </Toolbar>
        </AppBar>
      </Box>
      :
      <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" onClick={()=> {history.push('/signup')} }>Signup</Button>
          <Button color="inherit" onClick={()=> {history.push('/') }}>Login</Button>
        </Toolbar>
      </AppBar>
    </Box>
      }
      {
        (state?.user === undefined)?
        <Switch>
          <Route exact path="/">
              <Splash/>
          </Route>
        </Switch>
        : null
      }
      {
        (state?.user === null)?
        <Switch>
          <Route exact path='/' component={Login}/>
          <Route exact path='/signup' component={Signup}/>
        </Switch>
        :null
      }
      {
        (state?.user?.email)?
          <Switch>
            <Route exact path="/">
              <Dashboard/>
            </Route>
            <Route exact path="/profile">
              <Profile/>
            </Route>
          </Switch>
          :null
      }
    </div>
   
  )
}
export default App;