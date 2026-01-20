import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import Slider from "react-slick";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const NextArrow = ({ onClick }) => (
    <IconButton
        onClick={onClick}
        sx={{
            position: 'absolute',
            right: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.8)',
            '&:hover': { bgcolor: 'white' },
            display: { xs: 'none', md: 'flex' }
        }}
    >
        <ArrowForwardIosIcon sx={{ fontSize: 18, ml: 0.5 }} />
    </IconButton>
);

const PrevArrow = ({ onClick }) => (
    <IconButton
        onClick={onClick}
        sx={{
            position: 'absolute',
            left: 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            bgcolor: 'rgba(255,255,255,0.8)',
            '&:hover': { bgcolor: 'white' },
            display: { xs: 'none', md: 'flex' }
        }}
    >
        <ArrowBackIosNewIcon sx={{ fontSize: 18, mr: 0.5 }} />
    </IconButton>
);

export const PremiumHero = ({ images, title, industry }) => {
    const settings = {
        dots: true,
        infinite: images?.length > 1,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        nextArrow: <NextArrow />,
        prevArrow: <PrevArrow />,
        appendDots: dots => (
            <Box sx={{ position: 'absolute', bottom: 20, width: '100%' }}>
                <ul style={{ margin: 0, padding: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}> {dots} </ul>
            </Box>
        ),
        customPaging: i => (
            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.5)',
                    '.slick-active &': { bgcolor: 'white', width: 24, borderRadius: 4 },
                    transition: 'all 0.3s ease'
                }}
            />
        )
    };

    if (!images || images.length === 0) {
        return (
            <Box
                sx={{
                    height: { xs: '45vh', md: '500px' },
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: 'text.secondary'
                }}
            >
                <img
                    src={require(`../assets/icons/${industry || 'Sharing'}.png`)}
                    alt={industry}
                    style={{ width: '80px', height: '80px', opacity: 0.3, marginBottom: '20px' }}
                />
                <Typography variant="h4" sx={{ fontWeight: 700, opacity: 0.5 }}>
                    {title}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ position: 'relative', height: { xs: '45vh', md: '500px' }, overflow: 'hidden' }}>
            <Slider {...settings}>
                {images.map((photo, index) => (
                    <Box key={index} sx={{ height: { xs: '45vh', md: '500px' }, position: 'relative' }}>
                        <img
                            src={photo.url}
                            alt={`${title} ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '30%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                                pointerEvents: 'none'
                            }}
                        />
                    </Box>
                ))}
            </Slider>
        </Box>
    );
};
