import { useState } from 'react';
import { Tree, Progress, Button, Empty, Spin, Switch, Space } from 'antd';
import { FolderOutlined, FolderOpenOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { CampaignProject } from '../../../models/campaign';
import './ProjectList.scss';

interface ProjectListProps {
	projects: CampaignProject[];
	loading?: boolean;
	onSelectProject?: (project: CampaignProject) => void;
	onCreateProject?: () => void;
	showCompleted?: boolean;
	onToggleShowCompleted?: (show: boolean) => void;
	isGM?: boolean;
}

/**
 * ProjectList Component
 *
 * Displays campaign projects in a hierarchical tree view with expand/collapse functionality.
 * Shows progress bars for each project and supports filtering by completion status.
 *
 * Features:
 * - Hierarchical tree view with expand/collapse
 * - Progress bars showing completion percentage
 * - Filter to show/hide completed projects
 * - Character name display for each project
 * - Click to select and view project details
 * - Create new project button
 */
export const ProjectList = ({
	projects,
	loading = false,
	onSelectProject,
	onCreateProject,
	showCompleted = true,
	onToggleShowCompleted
}: ProjectListProps) => {
	const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

	/**
	 * Convert CampaignProject array to Ant Design Tree DataNode structure
	 */
	const buildTreeData = (projectList: CampaignProject[]): DataNode[] => {
		// Filter by completion status if needed
		const filteredProjects = showCompleted
			? projectList
			: projectList.filter(p => !p.isCompleted);

		return filteredProjects.map(project => {
			const node: DataNode = {
				key: project.id,
				title: (
					<div className="project-tree-node">
						<div className="project-header">
							<span className="project-name">
								{project.name}
								{project.isCompleted && (
									<CheckCircleOutlined className="completed-icon" />
								)}
							</span>
							<span className="project-character">({project.characterName})</span>
						</div>
						<div className="project-progress">
							<Progress
								percent={project.progressPercentage}
								size="small"
								status={project.isCompleted ? 'success' : 'active'}
								format={() => `${project.currentPoints}/${project.goalPoints}`}
							/>
						</div>
					</div>
				),
				icon: expandedKeys.includes(project.id) ? <FolderOpenOutlined /> : <FolderOutlined />,
				children: project.children ? buildTreeData(project.children) : undefined
			};
			return node;
		});
	};

	const handleExpand = (keys: React.Key[]) => {
		setExpandedKeys(keys);
	};

	const handleSelect = (selectedKeys: React.Key[]) => {
		if (selectedKeys.length > 0 && onSelectProject) {
			const projectId = selectedKeys[0] as number;
			const findProject = (list: CampaignProject[]): CampaignProject | undefined => {
				for (const project of list) {
					if (project.id === projectId) return project;
					if (project.children) {
						const found = findProject(project.children);
						if (found) return found;
					}
				}
				return undefined;
			};
			const project = findProject(projects);
			if (project) {
				onSelectProject(project);
			}
		}
	};

	if (loading) {
		return (
			<div className="project-list-loading">
				<Spin size="large" tip="Loading projects..." />
			</div>
		);
	}

	if (!projects || projects.length === 0) {
		return (
			<div className="project-list-empty">
				<Empty
					description="No projects yet"
					image={Empty.PRESENTED_IMAGE_SIMPLE}
				>
					{onCreateProject && (
						<Button type="primary" icon={<PlusOutlined />} onClick={onCreateProject}>
							Create First Project
						</Button>
					)}
				</Empty>
			</div>
		);
	}

	const treeData = buildTreeData(projects);

	return (
		<div className="project-list">
			<div className="project-list-header">
				<h3>Campaign Projects</h3>
				<Space>
					{onToggleShowCompleted && (
						<Switch
							checked={showCompleted}
							onChange={onToggleShowCompleted}
							checkedChildren="Show Completed"
							unCheckedChildren="Hide Completed"
						/>
					)}
					{onCreateProject && (
						<Button type="primary" icon={<PlusOutlined />} onClick={onCreateProject}>
							New Project
						</Button>
					)}
				</Space>
			</div>
			<Tree
				className="project-tree"
				showIcon
				expandedKeys={expandedKeys}
				onExpand={handleExpand}
				onSelect={handleSelect}
				treeData={treeData}
				selectable
			/>
		</div>
	);
};
