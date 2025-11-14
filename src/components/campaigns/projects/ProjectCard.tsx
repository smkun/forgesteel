import { Card, Progress, Button, Space, Tag, Tooltip, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, CheckCircleOutlined, PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import { CampaignProject } from '../../../models/campaign';
import './ProjectCard.scss';

const { Text, Paragraph } = Typography;

interface ProjectCardProps {
	project: CampaignProject;
	onEdit?: (project: CampaignProject) => void;
	onDelete?: (project: CampaignProject) => void;
	onUpdateProgress?: (project: CampaignProject) => void;
	onToggleComplete?: (project: CampaignProject) => void;
	onCreateSubProject?: (parentProject: CampaignProject) => void;
	canEdit?: boolean;
	showActions?: boolean;
}

/**
 * ProjectCard Component
 *
 * Displays individual project details in a card format.
 *
 * Features:
 * - Project name and description
 * - Character name display
 * - Progress bar with percentage
 * - Current/Goal points display
 * - Edit, Delete, Complete toggle buttons (permission-based)
 * - Create sub-project button
 * - Aggregate progress for parent projects
 */
export const ProjectCard = ({
	project,
	onEdit,
	onDelete,
	onUpdateProgress,
	onToggleComplete,
	onCreateSubProject,
	canEdit = false,
	showActions = true
}: ProjectCardProps) => {
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const actions: React.ReactNode[] = [];

	if (showActions && canEdit) {
		actions.push(
			<Tooltip title="Update Progress">
				<Button
					type="text"
					icon={<BarChartOutlined />}
					onClick={() => onUpdateProgress?.(project)}
				/>
			</Tooltip>
		);

		actions.push(
			<Tooltip title="Edit Project">
				<Button
					type="text"
					icon={<EditOutlined />}
					onClick={() => onEdit?.(project)}
				/>
			</Tooltip>
		);

		actions.push(
			<Tooltip title="Create Sub-Project">
				<Button
					type="text"
					icon={<PlusOutlined />}
					onClick={() => onCreateSubProject?.(project)}
				/>
			</Tooltip>
		);

		if (!project.isCompleted) {
			actions.push(
				<Tooltip title="Mark Complete">
					<Button
						type="text"
						icon={<CheckCircleOutlined />}
						onClick={() => onToggleComplete?.(project)}
					/>
				</Tooltip>
			);
		}

		actions.push(
			<Tooltip title="Delete Project">
				<Button
					type="text"
					danger
					icon={<DeleteOutlined />}
					onClick={() => onDelete?.(project)}
				/>
			</Tooltip>
		);
	}

	return (
		<Card
			className={`project-card ${project.isCompleted ? 'completed' : ''}`}
			title={
				<div className="project-card-title">
					<span>{project.name}</span>
					{project.isCompleted && (
						<Tag color="success" icon={<CheckCircleOutlined />}>
							Completed
						</Tag>
					)}
				</div>
			}
			extra={
				<Text type="secondary" className="project-character">
					{project.characterName}
				</Text>
			}
			actions={actions.length > 0 ? actions : undefined}
		>
			{project.description && (
				<Paragraph className="project-description" ellipsis={{ rows: 2, expandable: true }}>
					{project.description}
				</Paragraph>
			)}

			<div className="project-progress-section">
				<div className="progress-label">
					<Text strong>Progress</Text>
					<Text type="secondary">
						{project.currentPoints} / {project.goalPoints} points
					</Text>
				</div>
				<Progress
					percent={project.progressPercentage}
					status={project.isCompleted ? 'success' : 'active'}
					strokeColor={project.isCompleted ? '#52c41a' : undefined}
				/>
			</div>

			{project.aggregateProgress && (
				<div className="aggregate-progress-section">
					<div className="progress-label">
						<Text strong>Total Progress (including sub-projects)</Text>
						<Text type="secondary">
							{project.aggregateProgress.totalCurrentPoints} / {project.aggregateProgress.totalGoalPoints} points
						</Text>
					</div>
					<Progress
						percent={project.aggregateProgress.totalPercentage}
						strokeColor="#1890ff"
					/>
				</div>
			)}

			<div className="project-metadata">
				<Space direction="vertical" size="small" style={{ width: '100%' }}>
					<div>
						<Text type="secondary">Created by: </Text>
						<Text>{project.createdBy.displayName || project.createdBy.email}</Text>
					</div>
					<div>
						<Text type="secondary">Created: </Text>
						<Text>{formatDate(project.createdAt)}</Text>
					</div>
					{project.completedAt && (
						<div>
							<Text type="secondary">Completed: </Text>
							<Text>{formatDate(project.completedAt)}</Text>
						</div>
					)}
				</Space>
			</div>
		</Card>
	);
};
