import React, { useState } from 'react';
import MapComponent from './MapComponent';
import HuronNetwork from './HuronNetwork';
import SewerTycoon from './SewerTycoon';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


import { Amplify, Auth } from 'aws-amplify';
import awsconfig from './aws-exports'; // Path might vary based on where your aws-exports.js is located
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './css/style.css'; // Import the external CSS

// Create a theme instance.
const darkTheme = createTheme({
  palette: {
    mode: 'dark', // Switch to 'light' mode by changing this to 'light'
  },
});

Amplify.configure(awsconfig);

function App({ signOut, user }) {
  const [openDialog, setOpenDialog] = useState(true); // By default, it will be open
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    signOut();
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const menuId = 'primary-search-account-menu';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline /> {/* Ensures consistent baseline styles */}
      <div className="appContainer">
        <Router>
          <AppBar position="fixed" className="appBar">
            <Toolbar className="toolbar">
              <a href="http://digitalwaterlab.org/" target="_blank" className="logoLink">
                <img src="WaterDrop.png" alt="Digital Water Lab Logo" className="logo" />
              </a>
              <Typography variant="h6" noWrap component="h1" className="title">
                Huron Watershed Interactive Map
              </Typography>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls={menuId}
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                className="profileIcon"
              >
                <AccountCircle />
              </IconButton>
            </Toolbar>
          </AppBar>
          {renderMenu}

          
          <Routes>
            {/* <Route path="/" element={<SewerTycoon />} /> */}
            {/* <Route path="/" element={<MapComponent mode='Huron' />} /> */}
            <Route path="/" element={<HuronNetwork mode='Huron'/>} />
            {/* You can add more routes here */}
          </Routes>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default withAuthenticator(App);
