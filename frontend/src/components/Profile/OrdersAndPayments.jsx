import React, { useEffect, useState } from 'react'
import useStore from '../../store';
import { Button, Container, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../TopNavBar/TopNavBar';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentMethodForm from './PaymentMethodForm';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from "@stripe/stripe-js";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";

const OrdersAndPayments = (props) => {

    const { userName, isTeacher, isStudent } = useStore();
    const axiosPrivate = useAxiosPrivate();
    const [userInfo, setUserInfo] = useState({});
    const [stripeInfo, setStripeInfo] = useState({});
    const [cardInfo, setCardInfo] = useState({});
    const [accountLink, setAccountLink] = useState();
    const [stripePromise, setStripePromise] = useState('')
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const { backendURL, userName } = useStore.getState();

        fetch(`${backendURL}stripe/config`).then(async (res) => {
            const { publishableKey } = await res.json();
            setStripePromise(loadStripe(publishableKey));
            console.log(publishableKey)
        })

        const fetchData = async () => {

            // GET USER INFO WITH STRIPE ID
            const userInfoResponse = await fetch(`${backendURL}user/getUserInfo/${userName}`);
            const userData = await userInfoResponse?.json();
            setUserInfo(userData);
            console.log(userData)

            // USE STRIPE ID TO ONBOARD USER 
            if (userData?.stripeID !== undefined) {
                const stripeID = userData?.stripeID
                const accountLinkResponse = await fetch(`${backendURL}stripe/accountLink/${stripeID}`)
                const accountLinkData = await accountLinkResponse?.json()
                setAccountLink(accountLinkData?.url)

                // GET USER INFO WITH STRIPE ID
                const stripeAccountResponse = await fetch(`${backendURL}stripe/retrieveStripeAccount/${stripeID}`)
                const stripeAccountData = await stripeAccountResponse?.json()
                setStripeInfo(stripeAccountData)

                // RETRIEVE CUSTOMER
                const stripeCustomerFetch = await fetch(`${backendURL}stripe/retrieveStripeCustomerAccount/${userData?.customerStripeID}`)
                const stripeCustomerData = await stripeCustomerFetch?.json()
                setCardInfo(stripeCustomerData.card)
                console.log(stripeCustomerData)
            }
        };

        fetchData();
        setIsLoading(false);

    }, [])

    function stripeOnboarding() {
        navigate(window.location.assign(accountLink))
    }

    const handleSavePaymentMethod = (paymentMethodID) => {
        // Save the payment method ID to your backend
        axiosPrivate.post(`stripe/save-payment-method/${userInfo?.customerStripeID}`,
            { paymentMethodID: paymentMethodID }
        ).then((response) => {
            const { attachedPaymentMethod, retrievePaymentMethod } = response.data;
            console.log('Saved payment method:', attachedPaymentMethod);
            console.log('Retrieved payment method:', retrievePaymentMethod);
            // You can update your component state or take further actions
        }).catch((error) => {
            console.error('Error saving payment method:', error.message);
        });
    };

    return (
        <>
            <TopNavBar back={`/${isTeacher ? 'teachers' : 'students'}/${userName}`} />

            <Container style={{ marginTop: '2rem', width: '90vw' }}>

                <Grid container style={{ flexDirection: 'column', alignItems: 'center' }}>

                    <Typography variant='h3'>Orders & Payments</Typography>

                    {/* vvv Add isOnboarded conditional vvv */}
                    {
                        isLoading && isTeacher ? <></> :
                            <>
                                <Typography>
                                    Studio Time uses Stripe to get you paid quickly and keep your personal and payment
                                    information secure. Thousands of companies around the world trust Stripe to process payments
                                    for their users. Set up a Stripe account to get paid with Studio Time.
                                    Your stripe ID is: <span style={{ color: '#000000' }}>{userInfo?.stripeID}</span>
                                </Typography>

                                <br />

                                <Button
                                    style={{ textAlign: 'left', color: 'white' }}
                                    onClick={stripeOnboarding}
                                    variant='contained'>
                                    Setup Payments
                                </Button>

                                <br />

                                {/* DID USER COMPLETE STRIPE ONBOARDING? IF SO DISPLAY BELOW */}

                                {/* IS DEBIT CARD OR BANK ACCOUNT? IF SO CHANGE ICONS */}

                                {/* User should be able to edit CC and Bank Payout */}

                                <Typography variant='h4'>You'll receive payouts here:</Typography>

                                <br />

                                <Grid container justifyContent='center' columnSpacing={2}>

                                    <Grid item>
                                        <AccountBalanceIcon style={{ fontSize: '30px' }} />
                                    </Grid>

                                    <Grid item>
                                        <Typography variant='h4'>
                                            {stripeInfo?.retrieveAccount?.external_accounts?.data?.[0]?.brand}
                                            ******{stripeInfo?.retrieveAccount?.external_accounts?.data?.[0]?.last4}
                                        </Typography>
                                    </Grid>

                                </Grid>

                                <br />

                                {/* <Typography variant='h4'>Your pending payouts are currently at:</Typography> */}
                                {/* <Typography variant='h4'>{stripeInfo?.balance?.pending?.[0].amount}</Typography> */}

                            </>
                    }

                </Grid>

                <hr></hr>
                <br></br>

                <Grid container justifyContent='space-between' padding={2} direction='column' style={{ borderRadius: '5px', backgroundColor: '#000000', height: '150px', maxWidth: '310px' }}>

                    <Typography color='white' style={{ fontSize: '18px', textAlign: 'right' }}>
                        {cardInfo?.brand}
                    </Typography>

                    <Typography color='white' size='large' style={{ fontSize: '24px', justifyContent: 'center', display: 'flex' }}>
                        **** **** **** {cardInfo?.last4}
                    </Typography>

                    <Grid container justifyContent='space-between'>

                        <Grid>
                            <Typography color='white'>
                                {userInfo?.firstName} {userInfo?.lastName}
                            </Typography>
                        </Grid>

                        <Grid>
                            <Typography color='white'>

                                {cardInfo?.exp_month}
                                /
                                {String(cardInfo?.exp_year).slice(-2)}
                            </Typography>
                        </Grid>

                    </Grid>

                </Grid>

                <Grid container>
                    {
                        isStudent && stripePromise ?
                            <>
                                <Typography style={{ marginTop: '4%' }} variant="h4">Add a Payment Method:</Typography>

                                <Elements stripe={stripePromise}>
                                    <PaymentMethodForm onSavePaymentMethod={handleSavePaymentMethod} />
                                </Elements>
                            </>
                            : <> </>
                    }
                </Grid>

            </Container>

        </>
    )
}

export default OrdersAndPayments