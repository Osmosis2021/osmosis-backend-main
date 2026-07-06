import { Button, Container, Stack, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../../store';


const StripeOnboarding = () => {

    const [userInfo, setUserInfo] = useState({});
    const [accountLink, setAccountLink] = useState();
    const navigate = useNavigate();

    useEffect(() => {
        const { userName, backendURL } = useStore.getState();

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
                fetch(`${backendURL}stripe/accountLink/${stripeID}`)
                    .then(res => res.json())
                    .then(data => {
                        setAccountLink(data.url)

                        // GET USER INFO WITH STRIPE ID
                        fetch(`${backendURL}stripe/retrieveStripeAccount/${stripeID}`)
                            .then(res => res.json())
                            .then(data => {
                                console.log(data)
                            })
                            .catch(err => {
                                console.log('Error getting stripeInfo:\n', err);
                            });
                    })
            })
    }, [])

    function stripeOnboarding() {
        navigate(window.location.assign(accountLink))
    }

    console.log(userInfo)
    console.log(accountLink)


    return (
        <Container maxWidth='sm' align='center'>

            <Stack mb={2} mt={8} style={{ alignItems: 'center' }}>
                <Typography variant='h4'>
                    Stripe Onboarding
                </Typography>
                <br />
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
                    variant='contained'
                >
                    Setup Payments
                </Button>
            </Stack>

        </Container>

    )
}

export default StripeOnboarding