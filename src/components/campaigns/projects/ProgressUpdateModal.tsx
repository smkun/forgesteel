import { useState } from 'react';
import { Modal, Form, InputNumber, Input, Button, Space, Progress, Typography, Radio } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { CampaignProject, UpdateProgressRequest } from '../../../models/campaign';
import './ProgressUpdateModal.scss';

const { TextArea } = Input;
const { Text } = Typography;

interface ProgressUpdateModalProps {
	project: CampaignProject;
	visible: boolean;
	onSubmit: (data: UpdateProgressRequest) => Promise<void>;
	onCancel: () => void;
}

/**
 * ProgressUpdateModal Component
 *
 * Modal dialog for updating project progress.
 *
 * Features:
 * - Current progress display
 * - Input for new points or increment (+1, +5, +10, custom)
 * - Notes field for history tracking
 * - Preview new percentage after update
 * - Confirm/Cancel actions
 * - Validation to prevent exceeding goal points
 */
export const ProgressUpdateModal = ({
	project,
	visible,
	onSubmit,
	onCancel
}: ProgressUpdateModalProps) => {
	const [form] = Form.useForm();
	const [submitting, setSubmitting] = useState(false);
	const [updateMode, setUpdateMode] = useState<'absolute' | 'increment'>('increment');
	const [previewPoints, setPreviewPoints] = useState(project.currentPoints);

	const handleQuickIncrement = (amount: number) => {
		const newPoints = Math.min(project.currentPoints + amount, project.goalPoints);
		form.setFieldsValue({ incrementBy: amount });
		setPreviewPoints(newPoints);
	};

	const handleValuesChange = (changedValues: any) => {
		if (updateMode === 'absolute' && changedValues.currentPoints !== undefined) {
			setPreviewPoints(Math.min(changedValues.currentPoints, project.goalPoints));
		} else if (updateMode === 'increment' && changedValues.incrementBy !== undefined) {
			const newPoints = Math.min(
				project.currentPoints + changedValues.incrementBy,
				project.goalPoints
			);
			setPreviewPoints(newPoints);
		}
	};

	const handleModeChange = (mode: 'absolute' | 'increment') => {
		setUpdateMode(mode);
		if (mode === 'absolute') {
			form.setFieldsValue({ currentPoints: project.currentPoints });
			setPreviewPoints(project.currentPoints);
		} else {
			form.setFieldsValue({ incrementBy: 0 });
			setPreviewPoints(project.currentPoints);
		}
	};

	const handleSubmit = async (values: any) => {
		setSubmitting(true);
		try {
			const data: UpdateProgressRequest = {
				notes: values.notes || undefined
			};

			if (updateMode === 'absolute') {
				data.currentPoints = values.currentPoints;
			} else {
				data.incrementBy = values.incrementBy;
			}

			await onSubmit(data);
			form.resetFields();
		} catch (error) {
			console.error('Progress update error:', error);
		} finally {
			setSubmitting(false);
		}
	};

	const handleCancel = () => {
		form.resetFields();
		setPreviewPoints(project.currentPoints);
		onCancel();
	};

	const previewPercentage = project.goalPoints > 0
		? Math.round((previewPoints / project.goalPoints) * 100)
		: 0;

	return (
		<Modal
			title="Update Project Progress"
			open={visible}
			onCancel={handleCancel}
			footer={null}
			width={600}
			className="progress-update-modal"
		>
			<div className="progress-current">
				<div className="progress-header">
					<Text strong>{project.name}</Text>
					<Text type="secondary">{project.characterName}</Text>
				</div>
				<div className="progress-display">
					<Text type="secondary">Current Progress</Text>
					<Progress
						percent={project.progressPercentage}
						format={() => `${project.currentPoints} / ${project.goalPoints}`}
					/>
				</div>
			</div>

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				onValuesChange={handleValuesChange}
				initialValues={{
					incrementBy: 0,
					currentPoints: project.currentPoints
				}}
			>
				<Form.Item label="Update Mode">
					<Radio.Group
						value={updateMode}
						onChange={(e) => handleModeChange(e.target.value)}
						buttonStyle="solid"
					>
						<Radio.Button value="increment">Increment</Radio.Button>
						<Radio.Button value="absolute">Set Absolute</Radio.Button>
					</Radio.Group>
				</Form.Item>

				{updateMode === 'increment' ? (
					<>
						<Form.Item label="Quick Increments">
							<Space wrap>
								<Button
									icon={<PlusOutlined />}
									onClick={() => handleQuickIncrement(1)}
								>
									+1
								</Button>
								<Button
									icon={<PlusOutlined />}
									onClick={() => handleQuickIncrement(5)}
								>
									+5
								</Button>
								<Button
									icon={<PlusOutlined />}
									onClick={() => handleQuickIncrement(10)}
								>
									+10
								</Button>
								<Button
									icon={<MinusOutlined />}
									onClick={() => handleQuickIncrement(-1)}
								>
									-1
								</Button>
								<Button
									icon={<MinusOutlined />}
									onClick={() => handleQuickIncrement(-5)}
								>
									-5
								</Button>
							</Space>
						</Form.Item>

						<Form.Item
							name="incrementBy"
							label="Custom Increment"
							rules={[
								{ required: true, message: 'Increment value is required' },
								() => ({
									validator(_, value) {
										const newTotal = project.currentPoints + value;
										if (newTotal < 0) {
											return Promise.reject(new Error('Cannot reduce below 0'));
										}
										if (newTotal > project.goalPoints) {
											return Promise.reject(new Error('Cannot exceed goal points'));
										}
										return Promise.resolve();
									}
								})
							]}
						>
							<InputNumber
								style={{ width: '100%' }}
								placeholder="Enter custom increment (positive or negative)"
							/>
						</Form.Item>
					</>
				) : (
					<Form.Item
						name="currentPoints"
						label="New Total Points"
						rules={[
							{ required: true, message: 'Current points is required' },
							{ type: 'number', min: 0, message: 'Points cannot be negative' },
							{ type: 'number', max: project.goalPoints, message: 'Cannot exceed goal points' }
						]}
					>
						<InputNumber
							style={{ width: '100%' }}
							placeholder="Enter new total"
							min={0}
							max={project.goalPoints}
						/>
					</Form.Item>
				)}

				<div className="progress-preview">
					<Text type="secondary">New Progress Preview</Text>
					<Progress
						percent={previewPercentage}
						format={() => `${previewPoints} / ${project.goalPoints}`}
						status={previewPoints === project.goalPoints ? 'success' : 'active'}
					/>
				</div>

				<Form.Item
					name="notes"
					label="Notes (Optional)"
					tooltip="Add notes to track why progress was updated"
				>
					<TextArea
						rows={3}
						placeholder="Add notes about this progress update..."
						maxLength={500}
						showCount
					/>
				</Form.Item>

				<Form.Item>
					<Space style={{ width: '100%', justifyContent: 'flex-end' }}>
						<Button onClick={handleCancel}>
							Cancel
						</Button>
						<Button
							type="primary"
							htmlType="submit"
							loading={submitting}
						>
							Update Progress
						</Button>
					</Space>
				</Form.Item>
			</Form>
		</Modal>
	);
};
