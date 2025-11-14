import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Typography, Divider } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { CampaignProject, CreateProjectRequest, UpdateProjectRequest } from '../../../models/campaign';
import './ProjectForm.scss';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface ProjectFormProps {
	campaignId: number;
	characters: Array<{ id: number; name: string; owner_user_id: number }>;
	currentUserId: number;
	isGM: boolean;
	existingProject?: CampaignProject;
	parentProjects?: CampaignProject[];
	onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
}

/**
 * ProjectForm Component
 *
 * Form for creating or editing campaign projects.
 *
 * Features:
 * - Name and description inputs
 * - Goal points input (required, positive)
 * - Current points input (optional, <= goal, only shown on create)
 * - Character selector dropdown (REQUIRED for create, filtered by role)
 *   - Players: See only their own characters
 *   - GMs: See all campaign characters
 *   - Disabled in edit mode (character assignment is immutable)
 * - Parent project selector (optional, for sub-projects)
 * - Validation feedback
 * - Projects are sorted by creation date (no manual ordering)
 */
export const ProjectForm = ({
	characters,
	currentUserId,
	isGM,
	existingProject,
	parentProjects = [],
	onSubmit,
	onCancel,
	loading = false
}: ProjectFormProps) => {
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);

	const isEditMode = !!existingProject;

	// Filter characters based on user role
	const availableCharacters = isGM
		? characters // GMs see all campaign characters
		: characters.filter(c => c.owner_user_id === currentUserId); // Players see only their own

	useEffect(() => {
		if (existingProject) {
			form.setFieldsValue({
				name: existingProject.name,
				description: existingProject.description,
				goalPoints: existingProject.goalPoints,
				currentPoints: existingProject.currentPoints,
				parentProjectId: existingProject.parentProjectId
			});
		} else {
			// Set defaults for new project
			form.setFieldsValue({
				currentPoints: 0
			});
		}
	}, [existingProject, form]);

	const handleSubmit = async (values: any) => {
		setSubmitting(true);
		try {
			if (isEditMode) {
				// Update mode - characterId is excluded (immutable)
				const updateData: UpdateProjectRequest = {
					name: values.name,
					description: values.description || null,
					goalPoints: values.goalPoints,
					parentProjectId: values.parentProjectId || null
				};
				await onSubmit(updateData);
			} else {
				// Create mode - characterId is required
				const createData: CreateProjectRequest = {
					name: values.name,
					description: values.description || null,
					goalPoints: values.goalPoints,
					currentPoints: values.currentPoints || 0,
					characterId: values.characterId, // REQUIRED
					parentProjectId: values.parentProjectId || null
				};
				await onSubmit(createData);
			}
		} catch (error) {
			console.error('Project form submission error:', error);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="project-form">
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				autoComplete="off"
			>
				<Form.Item
					name="name"
					label="Project Name"
					rules={[
						{ required: true, message: 'Project name is required' },
						{ max: 255, message: 'Name cannot exceed 255 characters' }
					]}
				>
					<Input placeholder="Enter project name" />
				</Form.Item>

				<Form.Item
					name="description"
					label="Description"
				>
					<TextArea
						rows={4}
						placeholder="Describe the project goals and objectives"
						maxLength={2000}
						showCount
					/>
				</Form.Item>

				<Form.Item
					name="characterId"
					label={
						<>
							Character
							{isEditMode && (
								<Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
									(immutable)
								</Text>
							)}
						</>
					}
					rules={[
						{ required: !isEditMode, message: 'Character is required' }
					]}
					tooltip={
						isEditMode
							? 'Character assignment cannot be changed after creation'
							: 'Select the character who owns this project'
					}
				>
					<Select
						placeholder="Select character"
						disabled={isEditMode}
						showSearch
						filterOption={(input, option) => {
							const label = option?.label?.toString() || '';
							return label.toLowerCase().includes(input.toLowerCase());
						}}
					>
						{availableCharacters.map(character => (
							<Option key={character.id} value={character.id}>
								{character.name}
							</Option>
						))}
					</Select>
				</Form.Item>

				{isEditMode && existingProject && (
					<div className="character-info">
						<Text type="secondary">Current Character: </Text>
						<Text strong>{existingProject.characterName}</Text>
					</div>
				)}

				<Divider />

				<Form.Item
					name="goalPoints"
					label="Goal Points"
					rules={[
						{ required: true, message: 'Goal points is required' },
						{ type: 'number', min: 1, message: 'Goal points must be at least 1' }
					]}
					tooltip="Total points needed to complete this project"
				>
					<InputNumber
						style={{ width: '100%' }}
						placeholder="Enter goal points"
						min={1}
					/>
				</Form.Item>

				{!isEditMode && (
					<Form.Item
						name="currentPoints"
						label="Current Points"
						rules={[
							{ type: 'number', min: 0, message: 'Current points cannot be negative' },
							({ getFieldValue }) => ({
								validator(_, value) {
									const goalPoints = getFieldValue('goalPoints');
									if (value !== undefined && goalPoints && value > goalPoints) {
										return Promise.reject(new Error('Current points cannot exceed goal points'));
									}
									return Promise.resolve();
								}
							})
						]}
						tooltip="Starting progress for this project"
					>
						<InputNumber
							style={{ width: '100%' }}
							placeholder="Enter current points (default: 0)"
							min={0}
						/>
					</Form.Item>
				)}

				<Divider />

				<Form.Item
					name="parentProjectId"
					label="Parent Project (Optional)"
					tooltip="Select a parent project to create a sub-project"
				>
					<Select
						placeholder="None (top-level project)"
						allowClear
						showSearch
						filterOption={(input, option) => {
							const label = option?.label?.toString() || '';
							return label.toLowerCase().includes(input.toLowerCase());
						}}
					>
						{parentProjects
							.filter(p => !isEditMode || p.id !== existingProject?.id) // Can't be parent of itself
							.map(project => (
								<Option key={project.id} value={project.id}>
									{project.name} ({project.characterName})
								</Option>
							))}
					</Select>
				</Form.Item>

				<Form.Item>
					<Space>
						<Button
							type="primary"
							htmlType="submit"
							icon={<SaveOutlined />}
							loading={submitting || loading}
						>
							{isEditMode ? 'Update Project' : 'Create Project'}
						</Button>
						<Button icon={<CloseOutlined />} onClick={onCancel}>
							Cancel
						</Button>
					</Space>
				</Form.Item>
			</Form>
		</div>
	);
};
