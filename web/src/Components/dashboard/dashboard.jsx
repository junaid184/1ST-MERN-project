import axios from 'axios';
import { useState, useEffect, useRef } from "react"
import { GlobalContext } from './../../context/Context';
import { useContext } from "react";
import Post from "./posts"
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { TextField } from '@mui/material';
import io from 'socket.io-client';
const dev = 'http://localhost:8000';
const baseURL = window.location.hostname.split(':')[0] === 'localhost' ? dev : ""

function Copyright(){
    return (
        <Typography varient='body2' color="text.secondary" align='center'>
            {'Copyright © '}
            <Link color='inherit' href="https://mui.com">
                Your Website
            </Link> {' '}
            {new Date().getFullYear()}
            {'.'}
        </Typography>
    )
}
const theme = createTheme();
function Dashboard(){
    const [inputText, setInputText] = useState("");
    let { state, dispatch } = useContext(GlobalContext);

    const [posts, setPosts] = useState([])
    const [refresh, setRefresh] = useState(false)
    const [isMore, setIsMore] = useState(true)

    useEffect(() => {
        axios.get(`${baseURL}/api/v1/posts?page=0`, {
            withCredentials: true
        })
            .then((res) => {
                console.log("res +++: ", res.data);
                setPosts(res.data)

            })
    }, [])

    useEffect(() => {
        const socket = io(baseURL); // to connect with locally running Socker.io server

        socket.on('connect', function () {
            console.log("connected to server")
        });
        socket.on('disconnect', function (message) {
            console.log("disconnected from server: ", message);
        });
        socket.on('POSTS', function (data) {
            console.log(data);
            setPosts((prev) => [data, ...prev])
        });

        return () => {
            socket.close();
        };
    }, []);

    const loadMore = () => {
        axios.get(`${baseURL}/api/v1/posts?page=${posts.length}`,
            {
                withCredentials: true
            })
            .then((res) => {
                console.log("res +++: ", res.data);
                if (res.data?.length) {
                    const newPosts = [...posts, ...res.data]
                    setPosts(newPosts)
                } else {
                    setIsMore(false)
                }
            })
    }


    const submit = () => {
        if (inputText !== "") {
            axios.post(`${baseURL}/api/v1/post`, {
                postText: inputText
            }, {
                withCredentials: true
            })
                .then((res) => {
                    console.log("res: ", res.data);
                    setRefresh(!refresh)
                    // alert("post created");

                })
        }
    }
    return(
        <ThemeProvider theme={theme}>
        <CssBaseline/>
        <main>
            <Box
                sx = {{
                    bgcolor: 'background.paper',
                    pt: 8,
                    pb: 6
                }}
            >
                <Container maxWidth="sm">
                    <Typography
                        component="h5"
                        variant="h4"
                        align="center"
                        color="text.primary"
                        gutterBottom
                    >
                        Dashboard Page
                    </Typography>
                    <TextField
                    fullWidth
                    id="outlined-multiline-static"
                    multiline
                    rows={4}
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value)
                    }}
                    placeholder="What's in your mind"
                /> 
                <br />
                    <Button fullWidth variant="contained" onClick={submit}>Post</Button>
                    <Stack
                        sx={{ pt: 4 }}
                        direction="row"
                        spacing={2}
                        justifyContent="center"
                    >
                    </Stack>
                    
                    <br/>
                    {posts.map((eachPost, index) => (
                        <Post key={index} name={eachPost.fullName} email={eachPost.email} text={eachPost.postText} />
                    ))}

                   {/* {
                       JSON.stringify(posts)
                   } */}

                   <br/>    

                   {(isMore) ? <Button onClick={loadMore}>Load More ...</Button> : null}

                </Container>
            </Box>
        </main>

        {/* Footer */}
        <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
        <Typography variant="h6" align="center" gutterBottom>
                Footer
            </Typography>
            <Typography
                variant="subtitle1"
                align="center"
                color="text.secondary"
                component="p"
            >
                Something here to give the footer a purpose!
            </Typography>
            <Copyright />
        </Box>
    </ThemeProvider>
    )
}

export default Dashboard;