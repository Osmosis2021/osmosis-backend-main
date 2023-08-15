import axios from 'axios';
import React, { useEffect, useState } from 'react'
import useStore from '../../store';
import { Button, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../TopNavBar/TopNavBar';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const backendURL = process.env.NODE_ENV === 'production' ? 'https://getosmosis.io/' : 'http://localhost:8126/'

const OrdersAndPayments = (props) => {

    const { userName, isTeacher } = useStore();
    const [userInfo, setUserInfo] = useState({});
    const [stripeInfo, setStripeInfo] = useState({});
    const [accountLink, setAccountLink] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // ASK ALEX ABOUT RUNNING FUNCTIONS & SAVING STORAGE FOR REDIRECT

    useEffect(() => {

        // GET USER INFO WITH STRIPE ID
        fetch(`${backendURL}user/getUserInfo/${userName}`)
            .then(res => res.json())
            .then(data => {
                setUserInfo(data)
                if (data.stripeID === undefined) {
                    return;
                }
                const stripeID = data.stripeID
                console.log(stripeID)

                // USE STRIPE ID TO ONBOARD USER 
                fetch (`${backendURL}stripe/accountLink/${stripeID}`)
                .then(res => res.json())
                .then(data => {
                    setAccountLink(data.url)
                    setIsLoading(false)

                    // GET USER INFO WITH STRIPE ID
                    fetch(`${backendURL}stripe/retrieveStripeAccount/${stripeID}`)
                    .then(res => res.json())
                    .then(data => {
                        setStripeInfo(data)
                        console.log(data)
                    })
                    .catch(err => {
                        console.log('Error getting stripeInfo:\n', err);
                    });
                })
            })
        }, [])

    function stripeOnboarding () {
        navigate(window.location.assign(accountLink))
    }

    console.log(userInfo)
    console.log(accountLink)

  return (
    <>
        <TopNavBar back={`/${isTeacher ? 'teachers' : 'students'}/${userName}`}/>
        <Container style={{ marginTop: '2rem', width:'90vw' }}>
        <Grid container style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant='h3'>Orders & Payments</Typography>

            { 
                isLoading ? <></> :
            <>
                <Typography>
                Osmosis uses Stripe to get you paid quickly and keep your personal and payment 
                information secure. Thousands of companies around the world trust Stripe to process payments 
                for their users. Set up a Stripe account to get paid with Osmosis. 
                Your stripe ID is: <span style={{color:'#00aeef'}}>{userInfo?.stripeID}</span>
                </Typography>
                        <br/>
                    <Button 
                    style={{textAlign:'left', color:'white'}}
                    onClick={stripeOnboarding}
                    variant='contained'>
                        Setup Payments
                    </Button>
                        <br/>

                    {/* DID USER COMPLETE STRIPE ONBOARDING? IF SO DISPLAY BELOW */}

                    {/* IS DEBIT CARD OR BANK ACCOUNT? IF SO CHANGE ICONS */}
                    
                    <Typography variant='h4'>You'll receive payouts here:</Typography>
                    <br/>
                    <Grid container columnSpacing={2}>
                    
                        <Grid item>
                            <AccountBalanceIcon style={{fontSize:'30px'}}/>
                        </Grid>

                        <Grid item>
                            <Typography variant='h4'>
                                {stripeInfo?.retrieveAccount?.external_accounts?.data?.[0]?.brand}
                                ******{stripeInfo?.retrieveAccount?.external_accounts?.data?.[0]?.last4}
                            </Typography>
                        </Grid>
                    </Grid>
                    
                    <br/>
                    {/* <Typography variant='h4'>Your pending payouts are currently at:</Typography> */}
                    {/* <Typography variant='h4'>{stripeInfo?.balance?.pending?.[0].amount}</Typography> */}


                </>
            }
        </Grid>
        </Container>

    </>
  )
}

export default OrdersAndPayments