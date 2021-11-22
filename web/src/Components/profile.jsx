import * as React from 'react';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { GlobalContext } from '../context/Context';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
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

function Profile() {

    let {state, dispatch} = React.useContext(GlobalContext);
  
    return (
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
                            {/* Full Name: Junaid Shakeel Ahmed */}
                            Full Name: {state?.user?.fullName}
                        </Typography>
                        <Typography variant="h5" align="center" color="text.secondary" paragraph>
                            {/* Email: junaidshakil116@gmail.com */}
                            Email: {state?.user?.email}
                        </Typography>
                        <Typography variant="h5" align="center" color="text.secondary" paragraph>
                            {/* Email: junaidshakil116@gmail.com */}
                            Address: {state?.user?.address}
                        </Typography>
                        <Stack
                            sx={{ pt: 4 }}
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                        >
                            <Button variant="contained">Main call to action</Button>
                            <Button variant="outlined">Secondary action</Button>
                        </Stack>
                
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
    );
}

export default Profile;