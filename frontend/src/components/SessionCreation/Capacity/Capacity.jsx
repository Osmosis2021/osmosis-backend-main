import {
	Typography,
	Grid,
	Button,
	Stack,
	Box,
	TextField,
	InputAdornment,
	Fade
} from '@mui/material';
import React, { useEffect } from 'react';
import useStore from '../../../store';
import TERMS from '../../../constants/terms';
import { PremiumCard } from '../../../ui/PremiumCard';
import { PremiumSectionHeader } from '../../../ui/PremiumSectionHeader';

const CAPACITY_TIERS = [
	{
		id: 'intimate',
		label: 'Intimate',
		range: '1–3 guests',
		description: 'Best for 1-on-1 or small creative sessions.',
		defaultValue: 2
	},
	{
		id: 'moderate',
		label: 'Moderate',
		range: '3–5 guests',
		description: 'Balanced energy and interaction.',
		defaultValue: 4
	},
	{
		id: 'large',
		label: 'Large',
		range: '5+ guests',
		description: 'Group-focused, workshop-style sessions.',
		defaultValue: 8
	}
];

function Capacity(props) {
	const {
		capacity,
		setCapacity,
		newCourseCost,
		setNewCourseCost
	} = useStore();

	useEffect(() => {
		const isValid = Boolean(capacity) && Boolean(newCourseCost) && Number(newCourseCost) > 0;
		props.setIsNextDisabled(!isValid);
	}, [capacity, newCourseCost, props]);

	const handleTierSelect = (tier) => {
		setCapacity(tier.defaultValue);
	};

	const handlePriceChange = (e) => {
		const val = e.target.value;
		if (val === '' || /^\d+$/.test(val)) {
			setNewCourseCost(val === '' ? '' : parseInt(val));
		}
	};

	const totalEarnings = (Number(capacity) || 0) * (Number(newCourseCost) || 0);
	const osmosisFee = totalEarnings * 0.1;

	// Determine current tier for styling
	const getActiveTier = () => {
		if (capacity <= 3) return 'intimate';
		if (capacity <= 5) return 'moderate';
		return 'large';
	};

	const activeTier = getActiveTier();

	return (
		<Box sx={{ py: 4, pb: 12 }}>
			<PremiumSectionHeader
				title="Capacity & Pricing"
				subtitle="Define your session size and guest pricing."
				align="center"
			/>

			<Stack spacing={6} sx={{ mt: 4 }}>
				{/* Capacity Selection */}
				<Box>
					<Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 2, display: 'block' }}>
						Studio Capacity
					</Typography>
					<Grid container spacing={2}>
						{CAPACITY_TIERS.map((tier) => {
							const selected = activeTier === tier.id;
							return (
								<Grid item xs={12} sm={4} key={tier.id}>
									<PremiumCard
										onClick={() => handleTierSelect(tier)}
										sx={{
											p: 3,
											height: '100%',
											borderColor: selected ? 'text.primary' : 'rgba(0,0,0,0.05)',
											bgcolor: selected ? 'rgba(0,0,0,0.02)' : 'transparent',
											transition: 'all 0.2s ease',
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
											textAlign: 'center'
										}}
									>
										<Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
											{tier.label}
										</Typography>
										<Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 1.5, display: 'block' }}>
											{tier.range}
										</Typography>
										<Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
											{tier.description}
										</Typography>
									</PremiumCard>
								</Grid>
							);
						})}
					</Grid>
				</Box>

				{/* Pricing Input */}
				<Box sx={{ maxWidth: 400, mx: 'auto', width: '100%', textAlign: 'center' }}>
					<Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 2, display: 'block' }}>
						Price per guest
					</Typography>
					<TextField
						fullWidth
						variant="outlined"
						value={newCourseCost}
						onChange={handlePriceChange}
						placeholder="0"
						InputProps={{
							startAdornment: <InputAdornment position="start">$</InputAdornment>,
							endAdornment: <InputAdornment position="end">per guest</InputAdornment>,
							autoComplete: 'off'
						}}
						sx={{
							'& .MuiOutlinedInput-root': {
								fontSize: '1.5rem',
								fontWeight: 700,
								textAlign: 'center',
								bgcolor: 'rgba(0,0,0,0.02)',
								'& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
								'&:hover fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
								'&.Mui-focused fieldset': { borderColor: 'rgba(0,0,0,0.2)', borderWidth: '1px' },
							},
							'& input': { textAlign: 'center' }
						}}
					/>
				</Box>

				{/* Earnings Preview */}
				<Fade in={totalEarnings > 0}>
					<Box sx={{
						textAlign: 'center',
						p: 4,
						border: '1px dashed rgba(0,0,0,0.1)',
						borderRadius: 4,
						bgcolor: 'rgba(0,0,0,0.01)'
					}}>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
							Estimated session earnings
						</Typography>
						<Stack direction="row" spacing={1} justifyContent="center" alignItems="baseline">
							<Typography variant="h4" sx={{ fontWeight: 800 }}>
								${totalEarnings}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								total
							</Typography>
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
							{capacity} guests × ${newCourseCost} per guest. Studio Time fee (10%): ${osmosisFee.toFixed(0)}
						</Typography>
					</Box>
				</Fade>
			</Stack>
		</Box>
	);
}

export default Capacity;