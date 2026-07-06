import React, { useEffect, useState } from 'react';
import {
	Container,
	Typography,
	TextField,
	Box,
	IconButton,
	Stack,
	Chip,
	InputAdornment
} from '@mui/material';
import useStore from "../../../store"
import './SessionTag.css';
import AddIcon from '@mui/icons-material/Add';
import { PremiumChip } from '../../../ui/PremiumChip';

const SUGGESTED_VIBES = ['Quiet', 'Focused', 'High-energy', 'Experimental', 'Chill', 'Social', 'Collaborative', 'Industrial'];

export default function SessionTag(props) {
	const {
		tags, setTags,
		courseTitle, setCourseTitle,
		courseDescription, setCourseDescription,
		studioVibe, setStudioVibe,
		whatToBring, setWhatToBring
	} = useStore()

	const [tagInput, setTagInput] = useState('');

	useEffect(() => {
		// Run validation on every update of these fields
		const isValid = Boolean(courseTitle?.trim()) && Boolean(courseDescription?.trim());
		props.setIsNextDisabled(!isValid);
	}, [courseTitle, courseDescription, props]);

	const addTag = (newTag) => {
		const tagText = newTag?.trim();
		if (tagText && !tags.includes(tagText)) {
			setTags([...tags, tagText]);
		}
		setTagInput('');
	};

	const removeTag = (tagToRemove) => {
		setTags(tags.filter(t => t !== tagToRemove));
	};

	const toggleVibe = (vibe) => {
		// StudioVibe is a string, let's treat it as a comma-separated list or just a string
		// The prompt suggests selectable mood tags. 
		// We'll append/remove from the string or just replace if it's simpler.
		// Let's treat it as a list for better curation feel.
		const currentVibes = studioVibe ? studioVibe.split(', ').filter(Boolean) : [];
		if (currentVibes.includes(vibe)) {
			setStudioVibe(currentVibes.filter(v => v !== vibe).join(', '));
		} else {
			setStudioVibe([...currentVibes, vibe].join(', '));
		}
	};

	const inputStyles = {
		'& .MuiOutlinedInput-root': {
			bgcolor: 'rgba(250, 250, 250, 0.5)',
			'& fieldset': { borderColor: 'rgba(0,0,0,0.05)' },
			'&:hover fieldset': { borderColor: 'rgba(0,0,0,0.1)' },
			'&.Mui-focused fieldset': { borderColor: 'rgba(0,0,0,0.2)', borderWidth: '1px' },
		},
		'& .MuiInputLabel-root': { color: 'text.secondary', fontSize: '0.9rem' },
	};

	return (
		<Container maxWidth="md" sx={{ py: 4, pb: 12 }}>
			<Stack spacing={6}>

				{/* Section 1: The Core Experience */}
				<Box>
					<Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
						The Experience
					</Typography>
					<Stack spacing={3} sx={{ mt: 2 }}>
						<TextField
							fullWidth
							label="Session title"
							placeholder="e.g., Intro to Ceramics or Sunset Painting"
							value={courseTitle}
							onChange={(e) => setCourseTitle(e.target.value)}
							sx={inputStyles}
						/>
						<TextField
							fullWidth
							multiline
							rows={4}
							label="What guests will experience"
							placeholder="Describe the journey. What will they learn? What's the flow of the session?"
							value={courseDescription}
							onChange={(e) => setCourseDescription(e.target.value)}
							sx={inputStyles}
						/>
					</Stack>
				</Box>

				{/* Section 2: Atmosphere & Vibes */}
				<Box>
					<Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
						Atmosphere
					</Typography>
					<Box sx={{ mt: 2 }}>
						<Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
							Select the energy of your studio space:
						</Typography>
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
							{SUGGESTED_VIBES.map((vibe) => {
								const selected = studioVibe?.split(', ').includes(vibe);
								return (
									<Chip
										key={vibe}
										label={vibe}
										onClick={() => toggleVibe(vibe)}
										sx={{
											bgcolor: selected ? 'text.primary' : 'rgba(0,0,0,0.04)',
											color: selected ? 'background.paper' : 'text.primary',
											fontWeight: 600,
											'&:hover': {
												bgcolor: selected ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.08)',
											},
											transition: 'all 0.2s',
											borderRadius: '16px',
											border: 'none'
										}}
									/>
								);
							})}
						</Stack>
						<TextField
							fullWidth
							size="small"
							label="Add custom vibe details"
							placeholder="e.g. music choice, lighting, unique rules"
							value={studioVibe}
							onChange={(e) => setStudioVibe(e.target.value)}
							sx={inputStyles}
						/>
					</Box>
				</Box>

				{/* Section 3: Details & Logistics */}
				<Box>
					<Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
						Logistics
					</Typography>
					<Stack spacing={3} sx={{ mt: 2 }}>
						<TextField
							fullWidth
							label="What guests should bring (optional)"
							placeholder="e.g. comfortable clothes, notebook, water bottle"
							value={whatToBring}
							onChange={(e) => setWhatToBring(e.target.value)}
							sx={inputStyles}
						/>

						<Box>
							<Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
								Supporting tags:
							</Typography>
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
								{tags.map((tag, index) => (
									<PremiumChip
										key={index}
										label={`#${tag}`}
										onDelete={() => removeTag(tag)}
										sx={{
											height: 32,
											borderRadius: '16px',
											px: 1,
											bgcolor: 'rgba(0,0,0,0.04)',
											'& .MuiChip-deleteIcon': { fontSize: 18 }
										}}
									/>
								))}
							</Box>
							<TextField
								fullWidth
								size="small"
								label="Add tags"
								placeholder="Press enter to add tag (e.g. pottery, design)"
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addTag(tagInput);
									}
								}}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>
												<AddIcon size="small" />
											</IconButton>
										</InputAdornment>
									),
								}}
								sx={inputStyles}
							/>
						</Box>
					</Stack>
				</Box>

			</Stack>
		</Container>
	);
}
