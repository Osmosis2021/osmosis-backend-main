import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Container,
	IconButton,
	InputAdornment,
	Skeleton,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useNavigate, useParams } from 'react-router-dom';
import TopNavBar from '../../TopNavBar/TopNavBar';
import useStore from '../../../store';
import EditPhotos from './EditPhotos';
import TERMS from '../../../constants/terms';
import { PremiumCard } from '../../../ui/PremiumCard';
import useAxiosPrivate from '../../../hooks/useAxiosPrivate';
import { useConfirm, useToast } from '../../../ui/feedback';
import SessionScheduler from '../../SessionScheduler/SessionScheduler';
import DurationSelect from '../../SessionScheduler/DurationSelect';
import { browserTimeZone, formatDuration, isUpcomingSession } from '../../../utils/sessionTime';

const EDITABLE_FIELDS = ['courseTitle', 'courseDescription', 'studioVibe', 'whatToBring', 'tags', 'pricePerStudent', 'capacity', 'duration'];
const MAX_TAGS = 20;

const pickEditable = (course) => ({
	courseTitle: course.courseTitle || '',
	courseDescription: course.courseDescription || '',
	studioVibe: course.studioVibe || '',
	whatToBring: course.whatToBring || '',
	tags: Array.isArray(course.tags) ? course.tags : [],
	pricePerStudent: course.pricePerStudent ?? '',
	capacity: course.capacity || 1,
	duration: course.duration || 60,
});

const validate = (form) => {
	const errors = {};
	if (!form.courseTitle.trim()) errors.courseTitle = 'Add a title so guests know what this is.';
	else if (form.courseTitle.length > 100) errors.courseTitle = 'Keep the title under 100 characters.';
	if (form.courseDescription.length > 5000) errors.courseDescription = 'Keep the description under 5,000 characters.';
	const price = Number(form.pricePerStudent);
	if (form.pricePerStudent === '' || !Number.isInteger(price) || price < 1) errors.pricePerStudent = 'Enter a whole-dollar price of at least $1.';
	else if (price > 10000) errors.pricePerStudent = 'Price must be $10,000 or less.';
	if (!Number.isInteger(form.capacity) || form.capacity < 1 || form.capacity > 100) errors.capacity = 'Between 1 and 100 guests.';
	return errors;
};

const Section = ({ title, description, children }) => (
	<PremiumCard sx={{ p: { xs: 2.5, sm: 3 } }}>
		<Typography variant="h6" component="h2" sx={{ fontWeight: 800, fontFamily: 'Outfit' }}>{title}</Typography>
		{description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>}
		<Box sx={{ mt: 2.5 }}>{children}</Box>
	</PremiumCard>
);

const EditCourse = () => {
	const { userName } = useStore();
	const axiosPrivate = useAxiosPrivate();
	const confirm = useConfirm();
	const toast = useToast();
	const navigate = useNavigate();
	const { courseID } = useParams();

	const [course, setCourse] = useState(null);
	const [loadError, setLoadError] = useState('');
	const [saved, setSaved] = useState(null); // last saved values of the form
	const [form, setForm] = useState(null);
	const [touched, setTouched] = useState({});
	const [serverErrors, setServerErrors] = useState({});
	const [isSaving, setIsSaving] = useState(false);
	const [tagDraft, setTagDraft] = useState('');

	const loadCourse = useCallback(async ({ keepForm = false } = {}) => {
		try {
			const { data } = await axiosPrivate.get(`course/getCourse/${courseID}`);
			if (!data?._id) throw new Error('not found');
			setCourse(data);
			if (!keepForm) {
				setSaved(pickEditable(data));
				setForm(pickEditable(data));
			}
			setLoadError('');
		} catch (err) {
			setLoadError("We couldn't load this studio time. Check your connection and try again.");
		}
	}, [axiosPrivate, courseID]);

	useEffect(() => { loadCourse(); }, [loadCourse]);

	const errors = useMemo(() => (form ? { ...validate(form), ...serverErrors } : {}), [form, serverErrors]);
	const isDirty = useMemo(() => form && saved && EDITABLE_FIELDS.some((f) => JSON.stringify(form[f]) !== JSON.stringify(saved[f])), [form, saved]);
	const showError = (field) => (touched[field] || touched.__submit) && errors[field];

	// Warn before closing the tab with unsaved changes.
	useEffect(() => {
		if (!isDirty) return undefined;
		const handler = (event) => { event.preventDefault(); event.returnValue = ''; };
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [isDirty]);

	const update = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }));
		setServerErrors((prev) => ({ ...prev, [field]: undefined }));
	};
	const blur = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

	const addTag = () => {
		const tag = tagDraft.trim().replace(/^#/, '');
		if (!tag) return;
		if (form.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) { setTagDraft(''); return; }
		if (form.tags.length >= MAX_TAGS) { toast.info(`Up to ${MAX_TAGS} tags.`); return; }
		update('tags', [...form.tags, tag]);
		setTagDraft('');
	};

	const save = async () => {
		setTouched((prev) => ({ ...prev, __submit: true }));
		const clientErrors = validate(form);
		if (Object.keys(clientErrors).length) {
			document.getElementById(`edit-${Object.keys(clientErrors)[0]}`)?.focus();
			return;
		}
		const changes = {};
		EDITABLE_FIELDS.forEach((field) => {
			if (JSON.stringify(form[field]) !== JSON.stringify(saved[field])) changes[field] = form[field];
		});
		if (changes.pricePerStudent !== undefined) changes.pricePerStudent = Number(changes.pricePerStudent);

		setIsSaving(true);
		try {
			await axiosPrivate.put(`course/updateCourse/${courseID}`, changes);
			setSaved(form);
			setServerErrors({});
			toast.success('Changes saved.');
			if (changes.capacity !== undefined || changes.duration !== undefined) loadCourse({ keepForm: true });
		} catch (err) {
			const data = err.response?.data;
			if (data?.fieldErrors) setServerErrors(data.fieldErrors);
			toast.error(data?.message || "We couldn't save your changes. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const upcomingSessions = (course?.schedule || []).filter((slot) => isUpcomingSession(slot));
	const bookedSessions = upcomingSessions.filter((slot) => (slot.enrollment || 0) > 0);

	const deleteCourse = async () => {
		if (bookedSessions.length > 0) {
			await confirm({
				title: 'Cancel booked sessions first',
				description: `${bookedSessions.length} upcoming ${bookedSessions.length === 1 ? 'session has' : 'sessions have'} guests booked. Cancel ${bookedSessions.length === 1 ? 'it' : 'them'} in the Sessions section above so guests are refunded and notified, then you can delete this ${TERMS.COURSE.toLowerCase()}.`,
				confirmLabel: 'OK',
				cancelLabel: 'Close',
			});
			return;
		}
		const deleted = await confirm({
			title: `Delete "${course.courseTitle}"?`,
			description: `It will be removed from Studio Time, along with its photos and upcoming sessions. Nobody has booked it, so no guests are affected. This can't be undone.`,
			confirmLabel: `Delete ${TERMS.COURSE.toLowerCase()}`,
			destructive: true,
			onConfirm: () => axiosPrivate.delete(`course/deleteCourse/${courseID}`),
		});
		if (deleted) {
			toast.success(`Your ${TERMS.COURSE.toLowerCase()} was deleted.`);
			navigate(`/teachers/${userName}`);
		}
	};

	if (loadError) {
		return (
			<Container maxWidth="sm" sx={{ py: 4 }}>
				<TopNavBar back={`/teachers/${userName}`} title={`Edit ${TERMS.COURSE.toLowerCase()}`} />
				<Alert severity="error" sx={{ mt: 4, borderRadius: '12px' }}
					action={<Button color="inherit" onClick={() => loadCourse()}>Retry</Button>}>
					{loadError}
				</Alert>
			</Container>
		);
	}

	if (!course || !form) {
		return (
			<Container maxWidth="sm" sx={{ py: 4 }} aria-busy="true">
				<TopNavBar back={`/teachers/${userName}`} title={`Edit ${TERMS.COURSE.toLowerCase()}`} />
				<Stack spacing={2} sx={{ mt: 4 }}>
					{[180, 140, 220].map((height) => <Skeleton key={height} variant="rounded" height={height} sx={{ borderRadius: '16px' }} />)}
				</Stack>
			</Container>
		);
	}

	if (course.userName && userName && course.userName !== userName) {
		return (
			<Container maxWidth="sm" sx={{ py: 4 }}>
				<TopNavBar back={`/teachers/${userName}`} title={`Edit ${TERMS.COURSE.toLowerCase()}`} />
				<Alert severity="warning" sx={{ mt: 4, borderRadius: '12px' }}>You can only edit your own studio times.</Alert>
			</Container>
		);
	}

	const sessionApi = {
		onAdd: async (entries) => {
			await axiosPrivate.post(`course/${courseID}/sessions`, { sessions: entries });
			await loadCourse({ keepForm: true });
		},
		onReschedule: async (slot, entry) => {
			await axiosPrivate.patch(`course/${courseID}/sessions/${slot._id}`, entry);
			await loadCourse({ keepForm: true });
		},
		onCancel: async (slot, note) => {
			const { data } = await axiosPrivate.post(`course/${courseID}/sessions/${slot._id}/cancel`, { note });
			await loadCourse({ keepForm: true });
			return data.summary;
		},
	};

	return (
		<Box sx={{ pb: { xs: 'calc(190px + env(safe-area-inset-bottom))', md: 14 } }}>
			<TopNavBar back={`/teachers/${userName}`} title={`Edit ${TERMS.COURSE.toLowerCase()}`} />
			<Container maxWidth="sm" sx={{ mt: 3 }}>
				<Stack spacing={3}>
					<Section title="Details" description="What guests see first on your listing.">
						<Stack spacing={2.5}>
							<TextField
								id="edit-courseTitle"
								label="Title"
								value={form.courseTitle}
								onChange={(e) => update('courseTitle', e.target.value)}
								onBlur={blur('courseTitle')}
								error={Boolean(showError('courseTitle'))}
								helperText={showError('courseTitle') || `${form.courseTitle.length}/100`}
								inputProps={{ maxLength: 100 }}
								required
								fullWidth
							/>
							<TextField
								id="edit-courseDescription"
								label="Description"
								value={form.courseDescription}
								onChange={(e) => update('courseDescription', e.target.value)}
								onBlur={blur('courseDescription')}
								error={Boolean(showError('courseDescription'))}
								helperText={showError('courseDescription') || 'What will guests do, see and take home?'}
								multiline
								minRows={4}
								fullWidth
							/>
							<TextField
								id="edit-studioVibe"
								label="Studio vibe"
								value={form.studioVibe}
								onChange={(e) => update('studioVibe', e.target.value)}
								helperText="e.g. Quiet and focused, with music on."
								multiline
								minRows={2}
								fullWidth
							/>
							<TextField
								id="edit-whatToBring"
								label="What to bring"
								value={form.whatToBring}
								onChange={(e) => update('whatToBring', e.target.value)}
								helperText="e.g. Clothes you don't mind getting messy. All materials provided."
								multiline
								minRows={2}
								fullWidth
							/>
						</Stack>
					</Section>

					<Section title="Tags" description="Help guests find you in search.">
						<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: form.tags.length ? 2 : 0 }}>
							{form.tags.map((tag) => (
								<Chip key={tag} label={`#${tag}`} onDelete={() => update('tags', form.tags.filter((t) => t !== tag))} />
							))}
						</Stack>
						<Stack direction="row" spacing={1}>
							<TextField
								id="edit-tags"
								size="small"
								label="Add a tag"
								placeholder="e.g. resin"
								value={tagDraft}
								onChange={(e) => setTagDraft(e.target.value)}
								onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
								inputProps={{ maxLength: 40 }}
								fullWidth
							/>
							<Button variant="outlined" onClick={addTag} disabled={!tagDraft.trim()} sx={{ textTransform: 'none', fontWeight: 700 }}>Add</Button>
						</Stack>
					</Section>

					<Section title="Price, guests & length" description="Changes apply to upcoming sessions.">
						<Stack spacing={3}>
							<TextField
								id="edit-pricePerStudent"
								label="Price per guest"
								type="number"
								value={form.pricePerStudent}
								onChange={(e) => update('pricePerStudent', e.target.value === '' ? '' : Math.floor(Number(e.target.value)))}
								onBlur={blur('pricePerStudent')}
								error={Boolean(showError('pricePerStudent'))}
								helperText={showError('pricePerStudent') || "Guests who already booked keep the price they paid."}
								InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
								inputProps={{ min: 1, max: 10000, step: 1, inputMode: 'numeric' }}
								sx={{ maxWidth: 220 }}
							/>

							<Box>
								<Typography id="edit-capacity-label" variant="subtitle2" sx={{ fontWeight: 700 }}>Guests per session</Typography>
								<Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
									<IconButton aria-label="Fewer guests" onClick={() => update('capacity', Math.max(1, form.capacity - 1))} disabled={form.capacity <= 1}
										sx={{ border: '1px solid', borderColor: 'divider' }}>
										<RemoveIcon />
									</IconButton>
									<Typography id="edit-capacity" aria-live="polite" aria-labelledby="edit-capacity-label" sx={{ fontWeight: 800, fontSize: '1.25rem', minWidth: 32, textAlign: 'center' }}>
										{form.capacity}
									</Typography>
									<IconButton aria-label="More guests" onClick={() => update('capacity', Math.min(100, form.capacity + 1))} disabled={form.capacity >= 100}
										sx={{ border: '1px solid', borderColor: 'divider' }}>
										<AddIcon />
									</IconButton>
								</Stack>
								<Typography variant="caption" color={errors.capacity ? 'error' : 'text.secondary'} sx={{ display: 'block', mt: 1 }}>
									{errors.capacity || "Can't go below the number of guests already booked into a session."}
								</Typography>
							</Box>

							<DurationSelect
								id="edit-duration"
								value={form.duration}
								onChange={(minutes) => update('duration', minutes)}
								helperText={bookedSessions.length
									? `Booked sessions keep their current length (${formatDuration(saved.duration)}).`
									: undefined}
							/>
						</Stack>
					</Section>

					<Section title="Photos">
						<EditPhotos
							courseId={courseID}
							images={course.images || []}
							onChange={(images) => setCourse((prev) => ({ ...prev, images }))}
						/>
					</Section>

					<Section title="Sessions" description="Changes to sessions save right away. Booked sessions are locked; you can cancel them and guests are refunded automatically.">
						<SessionScheduler
							mode="live"
							sessions={course.schedule || []}
							durationMinutes={saved.duration}
							timezone={course.timezone || browserTimeZone()}
							{...sessionApi}
						/>
					</Section>

					<PremiumCard sx={{ p: { xs: 2.5, sm: 3 }, borderColor: 'error.light' }}>
						<Typography variant="h6" component="h2" sx={{ fontWeight: 800, fontFamily: 'Outfit', color: 'error.main' }}>
							Delete {TERMS.COURSE.toLowerCase()}
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
							Remove this listing and all of its sessions from Studio Time.
						</Typography>
						<Button variant="outlined" color="error" onClick={deleteCourse} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px' }}>
							Delete {TERMS.COURSE.toLowerCase()}
						</Button>
					</PremiumCard>
				</Stack>
			</Container>

			{/* Sticky save bar, above the mobile bottom navigation */}
			<Box
				sx={{
					position: 'fixed',
					left: { xs: 0, md: 96 },
					right: 0,
					bottom: { xs: 'calc(92px + env(safe-area-inset-bottom))', md: 0 },
					zIndex: 1100,
					bgcolor: 'background.default',
					borderTop: '1px solid',
					borderColor: 'divider',
					boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
					py: 1.5,
				}}
			>
				<Container maxWidth="sm">
					<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
						<Typography variant="body2" color={isDirty ? 'text.primary' : 'text.secondary'} aria-live="polite" sx={{ fontWeight: isDirty ? 700 : 400 }}>
							{isDirty ? 'You have unsaved changes' : 'All changes saved'}
						</Typography>
						<Stack direction="row" spacing={1}>
							{isDirty && (
								<Button onClick={() => { setForm(saved); setServerErrors({}); setTouched({}); }} disabled={isSaving}
									sx={{ textTransform: 'none', color: 'text.secondary' }}>
									Discard
								</Button>
							)}
							<Button
								variant="contained"
								onClick={save}
								disabled={!isDirty || isSaving}
								sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', minWidth: 130 }}
							>
								{isSaving ? <CircularProgress size={20} color="inherit" aria-label="Saving" /> : 'Save changes'}
							</Button>
						</Stack>
					</Stack>
				</Container>
			</Box>
		</Box>
	);
};

export default EditCourse;
