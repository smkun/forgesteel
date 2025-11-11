import { AbilityDistanceType } from '@/enums/abiity-distance-type';
import { AbilityKeyword } from '@/enums/ability-keyword';
import { Ancestry } from '@/models/ancestry';
import { Characteristic } from '@/enums/characteristic';
import { FactoryLogic } from '@/logic/factory-logic';
import { FeatureField } from '@/enums/feature-field';

/**
 * LOXONTA — CARAVAN PILLARS
 *
 * "The long road remembers who carried it." — Loxonta saying
 *
 * High-browed, far-striding, and thunder-calm until roused, the Loxonta are road-keepers,
 * archivists of markets, and stewards of old treaties. Their caravan bells mark time across
 * continents; their memory guilds recite price ledgers and peace terms with equal gravity.
 * When danger comes, Loxonta plant their feet and make the ground do the work.
 */

export const loxonta: Ancestry = {
	id: 'ancestry-loxonta',
	name: 'Loxonta',
	description:
    'Road-keepers, archivists of markets, and stewards of old treaties. When danger comes, Loxonta plant their feet and make the ground do the work.',

	features: [
		// Signature traits (always on, 0 points)
		FactoryLogic.feature.createMultiple({
			id: 'loxonta-signature',
			name: 'Loxonta Signature',
			features: [
				FactoryLogic.feature.createSize({
					id: 'loxonta-signature-big',
					name: 'Big!',
					description: 'Your size is 1L.',
					sizeValue: 2
				}),
				FactoryLogic.feature.createBonus({
					id: 'loxonta-signature-massive-frame',
					name: 'Massive Frame',
					description: 'You are built like a moving bastion.',
					field: FeatureField.Stability,
					value: 1
				})
			]
		}),

		// Ancestry options (2 points to spend - because size costs 1 point, leaving 2)
		FactoryLogic.feature.createChoice({
			id: 'loxonta-options',
			name: 'Loxonta Options',
			options: [
				// 1-POINT OPTIONS

				{
					feature: FactoryLogic.feature.createBonus({
						id: 'loxonta-option-wide-gait',
						name: 'Wide Gait',
						description: 'Your long strides enhance your ability to withdraw from danger.',
						field: FeatureField.Disengage,
						value: 1
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.createBonus({
						id: 'loxonta-option-sturdy-hide',
						name: 'Sturdy Hide',
						description: 'Your thick skin provides natural armor.',
						field: FeatureField.Stamina,
						valuePerEchelon: 3
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'loxonta-option-tusks',
						name: 'Tusks',
						description:
              'Triggered; 1/round. When you hit a creature with a melee strike, deal extra damage to that target equal to your Might.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'loxonta-option-road-sense',
						name: 'Road-Sense',
						description:
              'You ignore difficult terrain from rubble, underbrush, and shallow debris. During overland travel, you and allies guided by you gain an edge on tests to navigate, haul, or set camp on rough ground.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'loxonta-option-trunkcraft',
						name: 'Trunkcraft',
						description:
              'You have a prehensile trunk. Once per turn, you may perform a simple Interact as a free flourish (pick up, open, drink, stow). Your trunk can\'t perform delicate tasks that require fine tool control or wield weapons or shields.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'loxonta-option-trunk-wrestler',
						name: 'Trunk Wrestler',
						description:
              'You gain an edge on Grapple or Escape tests against creatures your size or smaller. On a success, you may Slide 1.'
					}),
					value: 1
				},
				{
					feature: FactoryLogic.feature.create({
						id: 'loxonta-option-ledger-memory',
						name: 'Ledger Memory',
						description:
              'You have an edge on Recall tests related to routes, prices, and treaties; during a respite, you can reproduce a page of notes or a simple map from memory.'
					}),
					value: 1
				},

				// 2-POINT OPTIONS

				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'loxonta-option-thunder-stomp',
							name: 'Thunder Stomp',
							description: 'You slam the ground with earthshaking force.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Area, AbilityKeyword.Melee, AbilityKeyword.Weapon ],
							distance: [ FactoryLogic.distance.create({ type: AbilityDistanceType.Burst, value: 1 }) ],
							target: 'Enemies in burst',
							cost: 'signature',
							sections: [
								FactoryLogic.createAbilitySectionRoll(
									FactoryLogic.createPowerRoll({
										characteristic: [ Characteristic.Might ],
										tier1: '2 untyped damage; prone',
										tier2: '5 untyped damage; prone',
										tier3: '7 untyped damage; prone'
									})
								),
								FactoryLogic.createAbilitySectionText(
									'Targets test Agility vs. your Might. On a failure, they take damage and fall Prone. On a success, they take half damage and can\'t make Opportunity Strikes against you until end of your next turn.'
								)
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'loxonta-option-momentum-charge',
							name: 'Momentum Charge',
							description: 'You build up devastating momentum in a straight-line rush.',
							type: FactoryLogic.type.createManeuver(),
							keywords: [ AbilityKeyword.Weapon ],
							distance: [ FactoryLogic.distance.createSelf() ],
							target: 'Self',
							sections: [
								FactoryLogic.createAbilitySectionText(
									'Move up to your Speed + 2 in a straight line. The first enemy you enter adjacency with must test Might vs. your Might or be Pushed 2 and Slowed (end of their next turn). On a success, they are Pushed 1.'
								)
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'loxonta-option-trunk-yank',
							name: 'Trunk Yank',
							description: 'Prerequisite: Trunkcraft. You seize a foe with your powerful trunk.',
							type: FactoryLogic.type.createMain(),
							keywords: [ AbilityKeyword.Melee, AbilityKeyword.Weapon ],
							distance: [ FactoryLogic.distance.createMelee(2) ],
							target: '1 creature',
							cost: 'signature',
							sections: [
								FactoryLogic.createAbilitySectionRoll(
									FactoryLogic.createPowerRoll({
										characteristic: [ Characteristic.Might ],
										tier1: 'Pull 2; 2 untyped damage; grabbed (EoNT)',
										tier2: 'Pull 2; 5 untyped damage; grabbed (EoNT)',
										tier3: 'Pull 2; 7 untyped damage; grabbed (EoNT)'
									})
								),
								FactoryLogic.createAbilitySectionText(
									'Roll Might vs. Might. On a success, Pull 2, deal damage, and the target is Grabbed (end of your next turn). On a failure, Pull 1 and deal half damage.'
								)
							]
						})
					}),
					value: 2
				},
				{
					feature: FactoryLogic.feature.createAbility({
						ability: FactoryLogic.createAbility({
							id: 'loxonta-option-rampart-step',
							name: 'Rampart Step',
							description: 'You shield your allies with your massive bulk.',
							type: FactoryLogic.type.createTrigger('An adjacent ally would take weapon damage'),
							keywords: [ AbilityKeyword.Magic ],
							distance: [ FactoryLogic.distance.createMelee(1) ],
							target: 'The triggering ally',
							sections: [
								FactoryLogic.createAbilitySectionText(
									'You interpose, becoming the target of that damage instead, then halve it.'
								)
							]
						})
					}),
					value: 2
				}
			],
			count: 'ancestry'
		})
	],
	ancestryPoints: 2
};
