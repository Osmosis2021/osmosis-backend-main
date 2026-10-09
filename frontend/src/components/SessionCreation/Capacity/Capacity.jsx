import {
	IconButton,
	Typography,
	Grid,
	Stack,
	Box,
	TextField,
	InputAdornment,
	Fade
} from '@mui/material';
import React, { useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import useStore from '../../../store';
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
		range: '4–5 guests',
		description: 'Balanced energy and interaction.',
		defaultValue: 4
	},
	{
		id: 'large',
		label: 'Large',
		range: '6+ guests',
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

	const MAX_CAPACITY = 100;
	const setGuests = (value) => setCapacity(Math.min(MAX_CAPACITY, Math.max(1, value)));

	// Matches the platform fee charged at checkout: 9.9% of each booking plus $0.30.
	// Estimated as if every spot were a separate booking (the worst case for the host).
	const guests = Number(capacity) || 0;
	const totalEarnings = guests * (Number(newCourseCost) || 0);
	const studioTimeFee = totalEarnings * 0.099 + guests * 0.3;
	const hostTakeHome = Math.max(0, totalEarnings - studioTimeFee);

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
										component="button"
										type="button"
										onClick={() => handleTierSelect(tier)}
										aria-pressed={selected}
										sx={{
											width: '100%',
											font: 'inherit',
											color: 'inherit',
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

					{/* Exact number, for when the presets aren't quite right */}
					<Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
						<Typography id="guests-per-session-label" sx={{ fontWeight: 700 }}>Guests per session</Typography>
						<IconButton aria-label="Fewer guests" onClick={() => setGuests(guests - 1)} disabled={guests <= 1} sx={{ border: '1px solid', borderColor: 'divider' }}>
							<RemoveIcon />
						</IconButton>
						<Typography aria-live="polite" aria-labelledby="guests-per-session-label" sx={{ fontWeight: 800, fontSize: '1.25rem', minWidth: 32, textAlign: 'center' }}>
							{guests}
						</Typography>
						<IconButton aria-label="More guests" onClick={() => setGuests(guests + 1)} disabled={guests >= MAX_CAPACITY} sx={{ border: '1px solid', borderColor: 'divider' }}>
							<AddIcon />
						</IconButton>
					</Stack>
				</Box>

				{/* Pricing Input */}
				<Box sx={{ maxWidth: 400, mx: 'auto', width: '100%', textAlign: 'center' }}>
					<Typography component="label" htmlFor="wizard-price" variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5, mb: 2, display: 'block' }}>
						Price per guest
					</Typography>
					<TextField
						id="wizard-price"
						inputProps={{ inputMode: 'numeric', 'aria-describedby': 'wizard-price-help' }}
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

				<Typography id="wizard-price-help" variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: -4 }}>
					Whole dollars. Guests see this price when booking.
				</Typography>

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
							If every spot is booked, you'd receive about
						</Typography>
						<Stack direction="row" spacing={1} justifyContent="center" alignItems="baseline">
							<Typography variant="h4" sx={{ fontWeight: 800 }}>
								${hostTakeHome.toFixed(0)}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								per session
							</Typography>
						</Stack>
						<Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
							{guests} {guests === 1 ? 'guest' : 'guests'} × ${newCourseCost} = ${totalEarnings}, minus the Studio Time fee
							(9.9% + $0.30 per booking, about ${studioTimeFee.toFixed(2)}).
						</Typography>
					</Box>
				</Fade>
			</Stack>
		</Box>
	);
}

export default Capacity;