import { AbilityKeyword } from '@/enums/ability-keyword';
import { Ancestry } from '@/models/ancestry';
import { Characteristic } from '@/enums/characteristic';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

export const terrari: Ancestry = {
	id: 'ancestry-terrari',
	name: 'Terrari',
	description:
    'Hearth-wise, tide-patient, and shellbound—millstones with opinions who root, brace, and nudge the world into compliance.',
	features: [
		// Always-on signature (0 points)
		FactoryLogic.feature.createMultiple({
			id: 'terrari-signature',
			name: 'Terrari Signature',
			features: [
				FactoryLogic.feature.create({
					id: 'terrari-signature-1',
					name: 'Shellback',
					description:
            'When you would be pushed, pulled, or slid, reduce that forced movement by 1 (minimum 0).'
				})
			]
		}),

		// Purchased options (spend 3 points)
		FactoryLogic.feature.createChoice({
			id: 'terrari-options',
			name: 'Terrari Options',
			options: [
				// 1-point options
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'terrari-option-1',
						name: 'Anchored Stance',
						description: 'Your rooted stability makes you difficult to move.',
						field: FeatureField.Stability,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'terrari-option-2',
						name: 'Turtle Step',
						description: 'Your patient movements enhance your ability to withdraw.',
						field: FeatureField.Disengage,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'terrari-option-3',
						name: 'Sturdy Scutes',
						description: 'Your shell-like plates provide enhanced protection.',
						field: FeatureField.Stamina,
						valuePerEchelon: 3
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'terrari-option-4',
						name: 'Riverborn',
						description:
              'You move through water as normal terrain and ignore penalties from being submerged when moving or making tests and strikes. You can hold your breath for minutes equal to your Might (minimum 1).'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'terrari-option-5',
						name: 'Shell Bash',
						description:
              'Triggered; 1/round. When you hit a creature with a melee strike, deal extra damage to that target equal to your highest characteristic.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'terrari-option-6',
						name: 'Stone Patience',
						description:
              'If you did not move on your last turn, your first melee strike this turn gains +2 damage.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'terrari-option-7',
						name: 'Reactive Brace',
						description:
              'When you take weapon damage from an adjacent creature, you may shift 1 after the damage resolves.'
					}),
					value: 1
				},

				// 2-point options
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'terrari-option-8',
							name: 'Hooked Yoke',
							description: 'You grapple and drag your foe with shellbound strength.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Weapon ],
							distance: [ FactoryLogic.distance.createMelee(1) ],
							target: 'One creature',
							cost: 'signature',
							sections: [
								FactoryLogic.createAbilitySectionRoll(
									FactoryLogic.createPowerRoll({
										characteristic: [ Characteristic.Might ],
										tier1: '2 untyped damage; you may slide the target 1 square',
										tier2: '5 untyped damage; you may slide the target 2 squares to a space adjacent to you; it is Grabbed (EoNT)',
										tier3: '7 untyped damage; you may slide the target 2 squares to a space adjacent to you; it is Grabbed (EoNT)'
									})
								)
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'terrari-option-9',
							name: 'Rolling Shell',
							description: 'You drop prone and roll through enemies like a living boulder.',
							type: FactoryLogic.type.createManeuver(),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText('You drop Prone and roll up to 4 squares in a straight line. You can move through enemy spaces. Each enemy you pass through takes 2/5/7 untyped damage by tier and must succeed on an Agility test vs. your Might or fall Prone. You must end in an unoccupied space; you stand as a free flourish at the start of your next turn.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'terrari-option-10',
							name: 'Shell Ward',
							description: 'You interpose your shell to protect yourself or an ally.',
							type: FactoryLogic.type.createTrigger('You or an adjacent ally would take weapon damage'),
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'The triggering creature',
							sections: [
								FactoryLogic.createAbilitySectionText('Halve the weapon damage.')
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'terrari-option-11',
						name: 'Tidewise Guide',
						description:
              'Out of combat or during a respite, for the next day of travel, your party ignores the first instance of difficult terrain caused by water, mud, or marsh each hour, and gains an edge on tests to ford, raft, or swim crossings you scout.'
					}),
					value: 2
				}
			],
			count: 'ancestry'
		})
	],
	ancestryPoints: 3
};
