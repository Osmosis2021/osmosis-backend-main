import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Switch,
  Snackbar,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import './Settings.css';
import TopNavBar from '../TopNavBar/TopNavBar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LockIcon from '@mui/icons-material/Lock';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import HelpIcon from '@mui/icons-material/Help';
import InfoIcon from '@mui/icons-material/Info';
import PaymentIcon from '@mui/icons-material/Payment';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';

import useStore from '../../store';
import useAuth from '../../hooks/useAuth';
import useLogout from '../../hooks/useLogout';
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import useKeyboard from '../../hooks/useKeyboard';
import UploadProfilePicture from '../Profile/UploadProfilePicture';
import PaymentMethodForm from '../Profile/PaymentMethodForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from "@stripe/stripe-js";
export default function Settings() {
  const { auth, setAuth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const logout = useLogout();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'account';

  const {
    userID, userName, setUserName, isTeacher, isStudent, firstName, setFirstName, lastName, setLastName,
    email, setEmail, description, setDescription, backendURL
  } = useStore();

  // Account Information States
  const [userInfo, setUserInfo] = useState({});
  const [firstName_, setFirstName_] = useState(firstName || '');
  const [lastName_, setLastName_] = useState(lastName || '');
  const [userName_, setUserName_] = useState(userName || '');
  const [email_, setEmail_] = useState(email || '');
  const [description_, setDescription_] = useState(description || '');
  const [phoneNumber_, setPhoneNumber_] = useState('');

  // Feedback toast state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = useCallback((message, severity = 'success') => {
    setToast({ open: true, message, severity });
  }, []);

  const handleGoogleLinkResponse = useCallback(async (response) => {
    try {
      const result = await axiosPrivate.post(`user/link-google`, {
        credential: response.credential
      });
      if (result.data.success) {
        showToast('Google account linked successfully!', 'success');
        setUserInfo(prev => ({ ...prev, googleId: result.data.googleId, isEmailVerified: true }));
        setAuth(prev => ({ ...prev, isEmailVerified: true }));
      } else {
        showToast(result.data.message || 'Failed to link Google account', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Error linking Google account.', 'error');
    }
  }, [axiosPrivate, setAuth, showToast]);

  const handleUnlinkGoogle = async () => {
    try {
      const result = await axiosPrivate.post(`user/unlink-google`);
      if (result.data.success) {
        showToast('Google account unlinked successfully.', 'success');
        setUserInfo(prev => ({ ...prev, googleId: '' }));
      } else {
        showToast('Failed to unlink Google account', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error unlinking Google account.', 'error');
    }
  };

  const manageKeyboard = useKeyboard();
  const [deleteSequence, setDeleteSequence] = useState(false);
  const [confirmUserName, setConfirmUserName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Stripe & Payout States
  const [stripeInfo, setStripeInfo] = useState({});
  const [cardInfo, setCardInfo] = useState({});
  const [accountLink, setAccountLink] = useState('');
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // Security Passwords State
  const [securityPass, setSecurityPass] = useState({ current: '', new: '', confirm: '' });
  const [showSecPassword, setShowSecPassword] = useState({ current: false, new: false, confirm: false });

  // Notification State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsMessages: false,
    inAppAlerts: true,
    weeklySummary: true
  });

  // Help/Contact State
  const [helpContact, setHelpContact] = useState({ subject: '', message: '' });

  useEffect(() => {
    manageKeyboard('settingsFieldGrid'); // hide bottomnav when mobile keyboard showing
  }, [manageKeyboard]);

  // Fetch User Info
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const getUserInfo = async () => {
      try {
        const response = await axiosPrivate.get(`user/getUserInfo/${userName}`, {
          signal: controller.signal
        });
        if (isMounted) {
          setUserInfo(response.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    getUserInfo();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userName, axiosPrivate]);

  // Pre-fill fields when userInfo is loaded
  useEffect(() => {
    if (userInfo.firstName && !firstName_) setFirstName_(userInfo.firstName);
    if (userInfo.lastName && !lastName_) setLastName_(userInfo.lastName);
    if (userInfo.userName && !userName_) setUserName_(userInfo.userName);
    if (userInfo.email && !email_) setEmail_(userInfo.email);
    if (userInfo.description && !description_) setDescription_(userInfo.description);
    if (userInfo.phoneNumber !== undefined && !phoneNumber_) setPhoneNumber_(userInfo.phoneNumber || '');
    if (userInfo.smsEnabled !== undefined) {
      setNotifications(prev => ({ ...prev, smsMessages: userInfo.smsEnabled }));
    }
  }, [userInfo, firstName_, lastName_, userName_, email_, description_, phoneNumber_]);

  useEffect(() => {
    window.google_active_callback = handleGoogleLinkResponse;
  }, [handleGoogleLinkResponse]);

  // Initialize Google link button when account settings tab is active
  useEffect(() => {
    let googleBtnTimeout;
    if (activeTab === 'account' && !userInfo.googleId) {
      const initGoogleLinkBtn = () => {
        if (window.google?.accounts?.id) {
          if (!window.google_initialized) {
            window.google.accounts.id.initialize({
              client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
              callback: (response) => {
                if (typeof window.google_active_callback === 'function') {
                  window.google_active_callback(response);
                }
              }
            });
            window.google_initialized = true;
          }
          const btnElem = document.getElementById("googleLinkBtn");
          if (btnElem) {
            window.google.accounts.id.renderButton(
              btnElem,
              { theme: "outline", size: "medium", width: 400, text: "signin_with" }
            );
          }
        } else {
          // Retry in case GIS script is still loading
          googleBtnTimeout = setTimeout(initGoogleLinkBtn, 200);
        }
      };
      googleBtnTimeout = setTimeout(initGoogleLinkBtn, 100);
    }
    return () => clearTimeout(googleBtnTimeout);
  }, [activeTab, userInfo.googleId]);

  // Fetch Stripe Info (on Demand or Mount)
  useEffect(() => {
    fetch(`${backendURL}stripe/config`).then(async (res) => {
      const { publishableKey } = await res.json();
      setStripePromise(loadStripe(publishableKey));
    }).catch(err => console.error("Error configuring Stripe:", err));

    const fetchStripeData = async () => {
      try {
        const userInfoResponse = await fetch(`${backendURL}user/getUserInfo/${userName}`);
        const userData = await userInfoResponse?.json();

        if (userData?.stripeID !== undefined) {
          const stripeID = userData.stripeID;
          const accountLinkResponse = await fetch(`${backendURL}stripe/accountLink/${stripeID}`);
          const accountLinkData = await accountLinkResponse?.json();
          setAccountLink(accountLinkData?.url);

          const stripeAccountResponse = await fetch(`${backendURL}stripe/retrieveStripeAccount/${stripeID}`);
          const stripeAccountData = await stripeAccountResponse?.json();
          setStripeInfo(stripeAccountData);
          setIsOnboarded(stripeAccountData?.retrieveAccount?.payouts_enabled || false);

          const stripeCustomerFetch = await fetch(`${backendURL}stripe/retrieveStripeCustomerAccount/${userData?.customerStripeID}`);
          const stripeCustomerData = await stripeCustomerFetch?.json();
          setCardInfo(stripeCustomerData.card);
        }
      } catch (err) {
        console.error('Error fetching Stripe data:', err);
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchStripeData();
  }, [userName, backendURL]);

  // Handlers for Account Setting update
  const changeFirstName = e => setFirstName_(e.target.value);
  const changeLastName = e => setLastName_(e.target.value);
  const changeUserName = e => setUserName_(e.target.value);
  const changeEmail = e => setEmail_(e.target.value);
  const changeDescription = e => setDescription_(e.target.value);
  const changeConfirmUserName = e => setConfirmUserName(e.target.value);
  const changeConfirmPassword = e => setConfirmPassword(e.target.value);

  const openDeletionFields = () => {
    setConfirmUserName('');
    setConfirmPassword('');
    setDeleteSequence(true);
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    const newInfo = {};
    if (firstName !== firstName_ && firstName_ !== '') newInfo['firstName'] = firstName_;
    if (lastName !== lastName_ && lastName_ !== '') newInfo['lastName'] = lastName_;
    if (userName !== userName_ && userName_ !== '') newInfo['userName'] = userName_;
    if (description !== description_) newInfo['description'] = description_;
    if (email !== email_ && email_ !== '') newInfo['email'] = email_;
    if (userInfo.phoneNumber !== phoneNumber_) newInfo['phoneNumber'] = phoneNumber_;

    if (Object.keys(newInfo).length === 0) {
      showToast('There are no updates to make.', 'info');
      return;
    }

    const updateObj = { auth, newInfo, userID };
    try {
      const res = await fetch(`${backendURL}user/updateProfile/${userID}`, {
        body: JSON.stringify(updateObj),
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Update failed');
      }

      const data = await res.json();
      if (data.user) {
        setUserInfo(data.user);
        if (data.user.phoneNumber !== undefined) setPhoneNumber_(data.user.phoneNumber || '');

        // If email changed, backend sets isEmailVerified to false
        if (newInfo.email) {
          setAuth(prev => ({
            ...prev,
            isEmailVerified: false,
            email: data.user.email
          }));
          setEmail(data.user.email);
          showToast('Profile updated. Please verify your new email.', 'warning');
          setTimeout(() => navigate('/verify-email'), 1500);
          return;
        }
      }

      newInfo?.firstName && setFirstName(newInfo.firstName);
      newInfo?.lastName && setLastName(newInfo.lastName);
      newInfo?.userName && setUserName(newInfo.userName);
      newInfo?.description && setDescription(newInfo.description);
      newInfo?.email && setEmail(newInfo.email);
      showToast('Successfully updated your profile!', 'success');
    } catch (err) {
      showToast(err.message || 'Update failed, please try again later', 'error');
    }
  };

  const deleteProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendURL}user/deleteProfile/${userInfo._id}/${confirmPassword}`, {
        method: 'DELETE'
      });
      if (response.status === 401) {
        showToast('Incorrect password, please try again', 'error');
        setDeleteSequence(false);
      } else if (response.status === 200) {
        showToast('Successfully DELETED your profile', 'success');
        setTimeout(() => {
          logout("/");
        }, 1500);
      }
    } catch (err) {
      showToast('DELETION failed, please try again later', 'error');
      setDeleteSequence(false);
    }
  };

  // Handlers for Orders & Payments Setup
  const stripeOnboarding = () => {
    if (accountLink) {
      window.location.assign(accountLink);
    } else {
      showToast('Stripe onboarding link not available.', 'error');
    }
  };

  const handleSavePaymentMethod = (paymentMethodID) => {
    axiosPrivate.post(`stripe/save-payment-method/${userInfo?.customerStripeID}`,
      { paymentMethodID: paymentMethodID }
    ).then((response) => {
      const { retrievePaymentMethod } = response.data;
      showToast('Payment method saved successfully!', 'success');
      if (retrievePaymentMethod?.card) {
        setCardInfo(retrievePaymentMethod.card);
      }
    }).catch((error) => {
      showToast('Error saving payment method: ' + error.message, 'error');
    });
  };

  // Security Update handler
  const handleSecuritySave = async (e) => {
    e.preventDefault();
    if (securityPass.new !== securityPass.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (securityPass.new.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      const response = await axiosPrivate.put(`user/changePassword`, {
        currentPassword: securityPass.current,
        newPassword: securityPass.new
      });
      if (response.data.success) {
        showToast('Password updated successfully!', 'success');
        setSecurityPass({ current: '', new: '', confirm: '' });
      } else {
        showToast(response.data.message || 'Failed to update password', 'error');
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Error updating password. Please try again.';
      showToast(errMsg, 'error');
    }
  };

  // Notification toggle handler
  const handleNotificationChange = (field) => {
    setNotifications(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Notification update handler
  const handleNotificationSave = async () => {
    try {
      const response = await axiosPrivate.put(`user/updateProfile/${userID}`, {
        newInfo: {
          smsEnabled: notifications.smsMessages
        }
      });
      if (response.data.success) {
        showToast('Notification preferences saved!', 'success');
        if (response.data.user) {
          setUserInfo(response.data.user);
        }
      } else {
        showToast('Failed to save preferences', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving preferences', 'error');
    }
  };

  // Support Submission handler
  const handleHelpSubmit = (e) => {
    e.preventDefault();
    if (!helpContact.subject || !helpContact.message) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    showToast('Inquiry sent! Support will get back to you shortly.', 'success');
    setHelpContact({ subject: '', message: '' });
  };

  const menuItems = [
    { key: 'account', name: 'Account Settings', icon: <AccountCircleIcon /> },
    { key: 'orders_payments', name: 'Orders and Payments', icon: <PaymentIcon /> },
    { key: 'privacy', name: 'Privacy Policy', icon: <PrivacyTipIcon /> },
    { key: 'security', name: 'Security Settings', icon: <LockIcon /> },
    { key: 'notifications', name: 'Notifications', icon: <NotificationsIcon /> },
    { key: 'about', name: 'About App', icon: <InfoIcon /> },
    { key: 'help', name: 'Help & Support', icon: <HelpIcon /> },
  ];

  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
  };

  const getTabTitle = (key) => {
    const item = menuItems.find(m => m.key === key);
    return item ? item.name : 'Settings';
  };

  // Rendering Right Details Component based on activeTab
  const renderDetailContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <Stack spacing={4} id="settingsFieldGrid">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                Account Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your public profile description and account details.
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <UploadProfilePicture showToast={showToast} />
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 700, fontFamily: 'Outfit' }}>
                {firstName_ || userInfo.firstName} {lastName_ || userInfo.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{userName_ || userInfo.userName}
              </Typography>
            </Box>

            <Box component="form" onSubmit={updateProfile}>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                      First Name
                    </Typography>
                    <TextField
                      onChange={changeFirstName}
                      placeholder={firstName || 'Enter first name'}
                      value={firstName_}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                      Last Name
                    </Typography>
                    <TextField
                      onChange={changeLastName}
                      placeholder={lastName || 'Enter last name'}
                      value={lastName_}
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                    Biography
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    placeholder={description || 'Tell students about your studio/skills...'}
                    value={description_}
                    onChange={changeDescription}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                    Username
                  </Typography>
                  <TextField
                    id='userNameInput'
                    fullWidth
                    placeholder={userName}
                    value={userName_}
                    onChange={changeUserName}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'Inter' }}>
                      Email Address
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {userInfo.isEmailVerified ? (
                        <Typography variant="caption" sx={{ bgcolor: 'success.light', color: 'success.contrastText', px: 1.5, py: 0.5, borderRadius: '12px', fontWeight: 600 }}>
                          Verified
                        </Typography>
                      ) : (
                        <>
                          <Typography variant="caption" sx={{ bgcolor: 'error.light', color: 'error.contrastText', px: 1.5, py: 0.5, borderRadius: '12px', fontWeight: 600 }}>
                            Not Verified
                          </Typography>
                          <Button size="small" onClick={() => navigate('/verify-email')} sx={{ py: 0, textTransform: 'none', fontWeight: 600 }}>
                            Verify Now
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>
                  <TextField
                    type="email"
                    fullWidth
                    placeholder={email || 'your-email@domain.com'}
                    value={email_}
                    onChange={changeEmail}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                    Phone Number
                  </Typography>
                  <TextField
                    type="tel"
                    fullWidth
                    placeholder="Enter phone number"
                    value={phoneNumber_}
                    onChange={(e) => setPhoneNumber_(e.target.value)}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<SaveRoundedIcon />}
                  sx={{ py: 1.5, fontSize: '0.95rem', borderRadius: '12px', mt: 1 }}
                >
                  Save Profile Updates
                </Button>
              </Stack>
            </Box>

            <Divider />

            {/* Connected Accounts */}
            <Card variant="outlined" sx={{ borderRadius: '16px' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                      Connected Accounts
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Manage your third-party account connections for authentication.
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Google Sign-In</Typography>
                      {userInfo.googleId ? (
                        <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                          Connected
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not connected. Link your Google account to log in faster.
                        </Typography>
                      )}
                    </Box>

                    {userInfo.googleId ? (
                      <Button variant="outlined" color="error" size="small" onClick={handleUnlinkGoogle} sx={{ borderRadius: '8px', textTransform: 'none' }}>
                        Disconnect
                      </Button>
                    ) : (
                      <div id="googleLinkBtn"></div>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Divider />

            {/* Danger Zone */}
            <Card variant="outlined" sx={{ borderColor: 'error.light', bgcolor: 'rgba(239, 68, 68, 0.01)', borderRadius: '16px' }}>
              <CardContent sx={{ p: 3 }}>
                {!deleteSequence ? (
                  <Stack spacing={2} alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" color="error" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'Outfit' }}>
                        Danger Zone
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Permanently delete your account and all associated data. This action is irreversible.
                      </Typography>
                    </Box>
                    <Button
                      onClick={openDeletionFields}
                      color='error'
                      variant="outlined"
                      startIcon={<DeleteForeverRoundedIcon />}
                      sx={{ mt: 1, borderRadius: '8px', textTransform: 'none' }}
                    >
                      Delete My Account
                    </Button>
                  </Stack>
                ) : (
                  <Stack spacing={2.5}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <WarningAmberRoundedIcon color="error" />
                      <Box>
                        <Typography variant="subtitle1" color="error" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                          Are you absolutely sure?
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Please confirm your credentials to permanently delete your account.
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} color="error">
                        Confirm Username
                      </Typography>
                      <TextField
                        id='confirmUserNameInput'
                        fullWidth
                        placeholder={userName}
                        value={confirmUserName}
                        onChange={changeConfirmUserName}
                      />
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} color="error">
                        Enter Password
                      </Typography>
                      <TextField
                        id='confirmPasswordInput'
                        type={showPassword ? "text" : "password"}
                        placeholder='Enter your account password'
                        value={confirmPassword}
                        onChange={changeConfirmPassword}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Box>

                    <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
                      <Button
                        onClick={() => setDeleteSequence(false)}
                        type='button'
                        variant="outlined"
                        sx={{ flex: 1, borderRadius: '8px' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={deleteProfile}
                        type='submit'
                        color='error'
                        variant="contained"
                        sx={{ flex: 1, borderRadius: '8px' }}
                        disabled={!((userName === confirmUserName) && (confirmPassword.length > 0))}
                      >
                        Confirm Delete
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        );

      case 'orders_payments':
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                Orders & Payments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure stripe payouts, billing, and credit card profiles.
              </Typography>
            </Box>

            <Divider />

            {paymentsLoading ? (
              <Typography color="text.secondary">Loading payouts and billing info...</Typography>
            ) : (
              <Stack spacing={3}>
                {isTeacher && (
                  <Stack spacing={3}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                      Payout Details (Instructor Setup)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Studio Time uses Stripe to process your payments securely. Thousand of instructors trust Stripe to handle secure payouts.
                    </Typography>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '12px', bgcolor: 'background.paper' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Stripe ID: <strong>{userInfo?.stripeID || 'Not setup'}</strong>
                      </Typography>
                      <Typography variant="body2" color={isOnboarded ? "success.main" : "warning.main"} sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Status: {isOnboarded ? 'Payouts Active' : 'Onboarding Required'}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      onClick={stripeOnboarding}
                      sx={{ py: 1.5, borderRadius: '12px', alignSelf: 'flex-start' }}
                    >
                      {isOnboarded ? 'Stripe Dashboard' : 'Setup Payouts'}
                    </Button>

                    {isOnboarded && stripeInfo?.retrieveAccount?.external_accounts?.data?.[0] && (
                      <Stack spacing={1.5} sx={{ pt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Receiving account:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <AccountBalanceIcon sx={{ color: 'text.secondary' }} />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {(stripeInfo?.retrieveAccount?.external_accounts?.data?.[0]?.brand || 'N/A').toUpperCase()} •••• {stripeInfo?.retrieveAccount?.external_accounts?.data?.[0]?.last4 || '••••'}
                          </Typography>
                        </Box>
                      </Stack>
                    )}
                  </Stack>
                )}

                <Divider sx={{ my: 1 }} />

                <Stack spacing={2.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                    Payment Card Information
                  </Typography>

                  {cardInfo?.last4 ? (
                    <Box className="payment-card-mockup">
                      <Typography sx={{ fontSize: '14px', textAlign: 'right', fontWeight: 600, opacity: 0.8 }}>
                        {(cardInfo?.brand || 'N/A').toUpperCase()}
                      </Typography>
                      <Typography sx={{ fontSize: '20px', letterSpacing: '2px', my: 3, textAlign: 'center' }}>
                        ••••  ••••  ••••  {cardInfo?.last4 || '••••'}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '13px', fontWeight: 500, textTransform: 'uppercase' }}>
                          {userInfo?.firstName || ''} {userInfo?.lastName || ''}
                        </Typography>
                        <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
                          {cardInfo?.exp_month || '••'}/{cardInfo?.exp_year ? String(cardInfo.exp_year).slice(-2) : '••'}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No card saved on file. Add one below to speed up your lesson checkouts.
                    </Typography>
                  )}

                  {isStudent && stripePromise && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                        Add/Change Payment Card:
                      </Typography>
                      <Elements stripe={stripePromise}>
                        <PaymentMethodForm onSavePaymentMethod={handleSavePaymentMethod} />
                      </Elements>
                    </Box>
                  )}
                </Stack>
              </Stack>
            )}
          </Stack>
        );

      case 'privacy':
        return (
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                Privacy Policy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated May 24, 2026. View details about data collections.
              </Typography>
            </Box>

            <Divider />

            <Box
              className="privacy-scroll-container"
              sx={{
                maxHeight: '520px',
                overflowY: 'auto',
                pr: 1.5,
                '& p': { mb: 2, fontSize: '0.95rem', lineHeight: 1.6 },
                '& li': { fontSize: '0.95rem', mb: 1 }
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Privacy Overview</Typography>
              <Typography>
                Studio Time (“Studio Time,” “we” or “us”) is committed to respecting the privacy of our customers. Unless we link to a different policy or state otherwise, this Privacy Notice applies when you visit or use any of our websites, our mobile applications, or related services (collectively the “Services”). By using the Services, you agree to the terms of this Privacy Notice. You shouldn’t use the Services if you don’t agree with this Privacy Notice.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1.5 }}>Types of Information We Collect</Typography>
              <Typography>
                <strong>Account Information:</strong> When you create or update your account, we collect and store the data you provide, such as your name, email address, password, profile photo, and account settings, and assign you a unique identifying number.
              </Typography>
              <Typography>
                <strong>Device/Log Data:</strong> We automatically collect information when you connect to our services including browser types, IP addresses, operating systems, date/time stamps, page interaction tracking, and device locations.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1.5 }}>How We Use Data</Typography>
              <Typography>
                We use information to provide, maintain, customize, and secure your experience. Specifically, to process student-instructor bookings, verify payouts, prevent fraudulent logins, and optimize our directory listings.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1.5 }}>Security of Your Data</Typography>
              <Typography>
                We execute standard administrative and physical safeguards to lock down user credentials and payment records. However, no database, internet connection, or transmission protocols are 100% immune from unauthorized breaches, hence we encourage selecting robust passwords.
              </Typography>

              <Typography variant="h6" sx={{ fontWeight: 700, mt: 3, mb: 1.5 }}>Your Rights</Typography>
              <Typography>
                Depending on geographical laws (e.g. GDPR, CCPA), you hold rights to access, inspect, modify, transfer, or request deletion of data by messaging us directly at hello@studiotime.com.
              </Typography>
            </Box>
          </Stack>
        );

      case 'security':
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                Security Settings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Update passwords and lock down authorization rules.
              </Typography>
            </Box>

            <Divider />

            <Box component="form" onSubmit={handleSecuritySave}>
              <Stack spacing={3} sx={{ maxWidth: '440px' }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                    Current Password
                  </Typography>
                  <TextField
                    type={showSecPassword.current ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={securityPass.current}
                    onChange={(e) => setSecurityPass(p => ({ ...p, current: e.target.value }))}
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowSecPassword(p => ({ ...p, current: !p.current }))} size="small">
                            {showSecPassword.current ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                    New Password
                  </Typography>
                  <TextField
                    type={showSecPassword.new ? "text" : "password"}
                    placeholder="Enter new password (min 6 chars)"
                    value={securityPass.new}
                    onChange={(e) => setSecurityPass(p => ({ ...p, new: e.target.value }))}
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowSecPassword(p => ({ ...p, new: !p.new }))} size="small">
                            {showSecPassword.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontFamily: 'Inter' }}>
                    Confirm New Password
                  </Typography>
                  <TextField
                    type={showSecPassword.confirm ? "text" : "password"}
                    placeholder="Retype new password"
                    value={securityPass.confirm}
                    onChange={(e) => setSecurityPass(p => ({ ...p, confirm: e.target.value }))}
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowSecPassword(p => ({ ...p, confirm: !p.confirm }))} size="small">
                            {showSecPassword.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ py: 1.5, borderRadius: '12px', mt: 1 }}
                >
                  Change Password
                </Button>
              </Stack>
            </Box>
          </Stack>
        );

      case 'notifications':
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                Notification Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Decide how and when you want to receive booking confirmations and class schedules.
              </Typography>
            </Box>

            <Divider />

            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Email Alerts</Typography>
                  <Typography variant="body2" color="text.secondary">Receive message replies, session receipts and booking approvals via email.</Typography>
                </Box>
                <Switch
                  checked={notifications.emailAlerts}
                  onChange={() => handleNotificationChange('emailAlerts')}
                  color="primary"
                />
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>SMS Text Reminders</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Get quick automated text updates 1 hour before scheduled sessions.
                    <br />
                    <span style={{ color: '#D32F2F', fontWeight: 600 }}>
                      (SMS service currently disabled - backend service integration pending)
                    </span>
                  </Typography>
                </Box>
                <Switch
                  disabled={true}
                  checked={notifications.smsMessages}
                  onChange={() => handleNotificationChange('smsMessages')}
                  color="primary"
                />
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>In-App Push Alerts</Typography>
                  <Typography variant="body2" color="text.secondary">Enable badge icons and pop-ups on mobile apps when bookings occur.</Typography>
                </Box>
                <Switch
                  checked={notifications.inAppAlerts}
                  onChange={() => handleNotificationChange('inAppAlerts')}
                  color="primary"
                />
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Weekly Activty Digest</Typography>
                  <Typography variant="body2" color="text.secondary">Receive a Sunday review summarizing classes completed and payout tallies.</Typography>
                </Box>
                <Switch
                  checked={notifications.weeklySummary}
                  onChange={() => handleNotificationChange('weeklySummary')}
                  color="primary"
                />
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleNotificationSave}
                sx={{ py: 1.5, alignSelf: 'flex-start', borderRadius: '12px', mt: 2 }}
              >
                Save Preferences
              </Button>
            </Stack>
          </Stack>
        );

      case 'about':
        return (
          <Stack spacing={4} sx={{ alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                About Studio Time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Technical properties and legal definitions.
              </Typography>
            </Box>

            <Divider sx={{ width: '100%' }} />

            <Stack spacing={2} sx={{ width: '100%' }}>
              <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '16px', bgcolor: 'background.paper', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography sx={{ fontSize: '32px', fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-1px' }}>
                  S
                </Typography>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontFamily: 'Outfit', fontSize: '1.1rem' }}>Studio Time Client</Typography>
                  <Typography variant="body2" color="text.secondary">Version 1.2.0 (Build 3020)</Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                Studio Time is a premium, localized booking portal designed to connect learners and instructors in person. Built using advanced React, Capacitor, and Material UI layers configured with a minimal color philosophy.
              </Typography>

              <Stack spacing={1.5} sx={{ pt: 2 }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.95rem' }}>Related Documents:</Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Link to="/termsofservice" style={{ textDecoration: 'none', color: '#0A0A0A', fontWeight: 600, fontSize: '0.9rem' }}>
                    Terms of Service
                  </Link>
                  <Link to="/privacy" style={{ textDecoration: 'none', color: '#0A0A0A', fontWeight: 600, fontSize: '0.9rem' }}>
                    Privacy Notice
                  </Link>
                </Box>
              </Stack>
            </Stack>
          </Stack>
        );

      case 'help':
        return (
          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'Outfit', mb: 1 }}>
                Help & Support
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search FAQs or submit a customer support query.
              </Typography>
            </Box>

            <Divider />

            <Stack spacing={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Frequently Asked Questions
              </Typography>

              <Box>
                <Accordion variant="outlined" sx={{ mb: 1, borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>How do I schedule a session?</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      Search teachers in the Explore tab. Click on a teacher profile, select from their published calendar dates, and proceed through checkout to confirm.
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion variant="outlined" sx={{ mb: 1, borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>How do teacher payouts work?</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      Teachers link a bank/debit account via Stripe under "Orders and Payments". Payouts clear automatically inside 30 days after class completion.
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion variant="outlined" sx={{ mb: 1, borderRadius: '8px' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>What is the booking refund rule?</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      Cancellations made at least 24 hours prior to slot initiation trigger automated Stripe balance returns. Within 24 hours, contact customer care.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
                Contact Support Desk
              </Typography>

              <Box component="form" onSubmit={handleHelpSubmit}>
                <Stack spacing={2} sx={{ maxWidth: '480px' }}>
                  <Typography variant="body2">
                    Submit a support ticket below or email us directly at <strong>hello@studiotime.com</strong>.
                  </Typography>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Subject</Typography>
                    <TextField
                      placeholder="e.g. Billing Issue, Booking Bug"
                      value={helpContact.subject}
                      onChange={(e) => setHelpContact(p => ({ ...p, subject: e.target.value }))}
                      fullWidth
                      required
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Message Detail</Typography>
                    <TextField
                      multiline
                      rows={3}
                      placeholder="Describe what occurred or what help you require..."
                      value={helpContact.message}
                      onChange={(e) => setHelpContact(p => ({ ...p, message: e.target.value }))}
                      fullWidth
                      required
                    />
                  </Box>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ py: 1.2, borderRadius: '12px', alignSelf: 'flex-start' }}
                  >
                    Submit Ticket
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        );

      default:
        return <Typography>Select a settings tab.</Typography>;
    }
  };

  const handleBackToSettings = () => {
    setSearchParams({}); // clearing searches collapses to navigation view on mobile
  };

  // MOBILE VIEW LAYOUT
  if (isMobile) {
    const isShowingDetail = searchParams.get('tab') !== null;

    if (isShowingDetail) {
      return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 6 }}>
          {/* Mobile Back Header */}
          <Box sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <IconButton onClick={handleBackToSettings} edge="start" sx={{ color: 'text.primary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit' }}>
              {getTabTitle(activeTab)}
            </Typography>
          </Box>

          <Container sx={{ py: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: '16px' }}>
              <CardContent className="settings-content-pane">
                {renderDetailContent()}
              </CardContent>
            </Card>
          </Container>

          <Snackbar
            open={toast.open}
            autoHideDuration={4000}
            onClose={() => setToast({ ...toast, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={() => setToast({ ...toast, open: false })}
              severity={toast.severity}
              variant="filled"
              sx={{ width: '100%', borderRadius: '12px', fontWeight: 600, boxShadow: 3 }}
            >
              {toast.message}
            </Alert>
          </Snackbar>
        </Box>
      );
    }

    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
        <TopNavBar back={`/${isTeacher ? 'teachers' : 'students'}/${userName}`} />
        <Container sx={{ py: 3 }}>
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 800, fontFamily: 'Outfit', px: 1 }}>
            Settings
          </Typography>

          <Card variant="outlined" sx={{ borderRadius: '16px' }}>
            <List sx={{ width: '100%', p: 1 }}>
              {menuItems.map(item => (
                <ListItem key={item.key} disablePadding>
                  <ListItemButton
                    onClick={() => handleTabChange(item.key)}
                    className="settings-menu-item"
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.name} />
                  </ListItemButton>
                </ListItem>
              ))}

              <Divider sx={{ my: 1 }} />

              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => logout("/")}
                  className="settings-menu-item settings-logout-item"
                >
                  <ListItemIcon sx={{ color: 'error.main !important' }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Card>
        </Container>
      </Box>
    );
  }

  // DESKTOP & TABLET VIEW LAYOUT (Master-Detail Dashboard Layout)
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      <TopNavBar back={`/${isTeacher ? 'teachers' : 'students'}/${userName}`} />

      <Container maxWidth="lg" sx={{ mt: 5, px: { xs: 2, md: 4 } }}>
        <Typography variant="h3" sx={{ mb: 3, fontWeight: 800, fontFamily: 'Outfit' }}>
          Settings
        </Typography>

        <Card className="settings-card" variant="outlined">
          <Grid container sx={{ minHeight: '650px' }}>
            {/* Sidebar Navigation */}
            <Grid item xs={12} md={3.5}>
              <Box className="settings-sidebar">
                <List sx={{ p: 0 }}>
                  {menuItems.map(item => {
                    const isActive = activeTab === item.key;
                    return (
                      <ListItem key={item.key} disablePadding>
                        <ListItemButton
                          onClick={() => handleTabChange(item.key)}
                          className={`settings-menu-item ${isActive ? 'active-item' : ''}`}
                        >
                          <ListItemIcon>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText primary={item.name} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}

                  <Divider sx={{ my: 2 }} />

                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => logout("/")}
                      className="settings-menu-item settings-logout-item"
                    >
                      <ListItemIcon sx={{ color: 'error.main !important' }}>
                        <LogoutIcon />
                      </ListItemIcon>
                      <ListItemText primary="Logout" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Box>
            </Grid>

            {/* Selected Panel View Content */}
            <Grid item xs={12} md={8.5}>
              <Box className="settings-content-pane">
                {renderDetailContent()}
              </Box>
            </Grid>
          </Grid>
        </Card>
      </Container>

      {/* Snackbar alerts */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: '12px', fontWeight: 600, boxShadow: 3 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
