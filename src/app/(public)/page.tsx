import MaxWidthWrapper from "@/components/shared/layout/max-width-wrapper";
import { Button } from "@/components/ui/button";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	ArrowRight,
	CalendarDays,
	Check,
	CheckCircle2,
	Clock,
	Flame,
	FolderKanban,
	Layers,
	ShieldCheck,
	User,
	Users,
	Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
	return (
		<div className="w-full bg-[#1c1c1e] text-[#c5bebe] selection:bg-[#C4BEBE] selection:text-[#222222]">
			{/* HERO SECTION */}
			<section className="relative overflow-hidden pt-12 pb-12 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-24">
				{/* Background Gradients & Glow */}
				<div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#383838]/70 via-[#222222] to-[#1c1c1e]" />
				<div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[250px] bg-[#C4BEBE]/10 blur-[100px] pointer-events-none -z-10" />

				<MaxWidthWrapper>
					<div className="flex flex-col items-center text-center">
						{/* Hero Headline */}
						<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold tracking-tight text-white max-w-3xl mx-auto leading-[1.2]">
							Stay Organized. <br className="hidden sm:inline" />
							<span className="bg-gradient-to-r from-white via-[#c5bebe] to-[#8f8a8a] bg-clip-text text-transparent">
								Work Smarter.
							</span>{" "}
							Collaborate Better.
						</h1>

						{/* Hero Subtitle */}
						<p className="mt-4 text-xs sm:text-sm md:text-[15px] text-[#a8a3a3] max-w-xl mx-auto leading-relaxed px-4">
							The unified workspace to manage projects, prioritize tasks, track
							deadlines on an interactive calendar, and empower team velocity
							without the chaos.
						</p>

						{/* Action Buttons */}
						<div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4">
							<Button
								asChild
								size="default"
								className="w-full sm:w-auto rounded-full bg-[#C4BEBE] text-[#222222] font-semibold hover:bg-[#d8d2d2] shadow-md transition-all text-xs sm:text-sm px-6 py-5"
							>
								<Link href="/sign-up" className="flex items-center gap-2">
									Get Started Free
									<ArrowRight className="size-3.5" />
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								size="default"
								className="w-full sm:w-auto rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-md text-xs sm:text-sm px-6 py-5"
							>
								<Link href="/sign-in">Sign In to Workspace</Link>
							</Button>
						</div>

						{/* Key Trust Checkmarks */}
						<div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#9c9696]">
							<div className="flex items-center gap-1.5">
								<CheckCircle2 className="size-3.5 text-emerald-400" />
								<span>Free for individuals</span>
							</div>
							<div className="flex items-center gap-1.5">
								<CheckCircle2 className="size-3.5 text-emerald-400" />
								<span>No credit card required</span>
							</div>
							<div className="flex items-center gap-1.5">
								<CheckCircle2 className="size-3.5 text-emerald-400" />
								<span>Instant real-time sync</span>
							</div>
						</div>

						{/* Responsive Dashboard Preview Mockup */}
						<div className="relative mt-10 sm:mt-12 w-full max-w-4xl">
							{/* Outer Glow */}
							<div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-xl opacity-60 pointer-events-none" />

							{/* Mockup Frame */}
							<div className="relative rounded-xl sm:rounded-2xl border border-white/15 bg-[#18181a] p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl">
								{/* Browser-like Header */}
								<div className="flex items-center justify-between pb-2 px-3 border-b border-white/10 text-xs text-[#71717a]">
									<div className="flex items-center gap-2">
										<span className="size-2 rounded-full bg-[#ff5f56]/80" />
										<span className="size-2 rounded-full bg-[#ffbd2e]/80" />
										<span className="size-2 rounded-full bg-[#27c93f]/80" />
									</div>
									<span className="font-mono text-[10px] sm:text-xs text-[#a1a1aa]">
										collaborate.app/dashboard
									</span>
									<div className="w-8 sm:w-12" />
								</div>

								{/* Dashboard Image */}
								<div className="relative mt-2 overflow-hidden rounded-lg sm:rounded-xl bg-[#222222]">
									<Image
										src="/resources/landing-page.png"
										alt="Collaborate Dashboard workspace overview"
										width={1200}
										height={750}
										priority
										className="w-full h-auto object-cover rounded-lg sm:rounded-xl shadow-inner border border-white/5"
									/>
									{/* Subtle bottom fade to blend with page */}
									<div className="absolute inset-x-0 bottom-0 h-14 sm:h-20 bg-gradient-to-t from-[#18181a] to-transparent pointer-events-none" />
								</div>
							</div>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* METRICS & SOCIAL PROOF STRIP */}
			<section className="border-y border-white/10 bg-[#18181b]/60 backdrop-blur-sm py-8 sm:py-9">
				<MaxWidthWrapper>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
						<div className="flex flex-col gap-0.5 p-1.5">
							<span className="text-xl sm:text-2xl font-bold text-white">
								100%
							</span>
							<span className="text-xs text-[#9c9696]">
								Real-Time State Sync
							</span>
						</div>
						<div className="flex flex-col gap-0.5 p-1.5">
							<span className="text-xl sm:text-2xl font-bold text-white">
								5
							</span>
							<span className="text-xs text-[#9c9696]">
								Granular Priority Levels
							</span>
						</div>
						<div className="flex flex-col gap-0.5 p-1.5">
							<span className="text-xl sm:text-2xl font-bold text-white">
								2-in-1
							</span>
							<span className="text-xs text-[#9c9696]">
								Solo Desks &amp; Workspaces
							</span>
						</div>
						<div className="flex flex-col gap-0.5 p-1.5">
							<span className="text-xl sm:text-2xl font-bold text-white">
								&lt; 50ms
							</span>
							<span className="text-xs text-[#9c9696]">
								Interactive Responsiveness
							</span>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* CORE FEATURES SECTION */}
			<section id="features" className="py-14 sm:py-20 relative">
				<MaxWidthWrapper>
					{/* Section Header */}
					<div className="text-center max-w-2xl mx-auto mb-12">
						<p className="text-[11px] font-semibold text-[#a8a3a3] uppercase tracking-wider mb-1.5">
							Core Capabilities
						</p>
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
							Everything you need to deliver on time
						</h2>
						<p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
							Say goodbye to scattered notes, lost deadlines, and missed context.
							Collaborate brings your entire workflow into focus.
						</p>
					</div>

					{/* Features Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
						{/* Feature 1 */}
						<div className="group relative rounded-2xl border border-white/10 bg-[#222224]/80 p-5 sm:p-6 hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40">
							<div className="flex size-10 items-center justify-center rounded-xl bg-[#AD3D3D]/20 text-[#ef5350] border border-[#AD3D3D]/30 mb-4">
								<Flame className="size-5" />
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Priority-Driven Tasks
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Categorize work from Urgent to Low with visual urgency indicators.
								Keep team members aligned on what demands immediate attention.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="group relative rounded-2xl border border-white/10 bg-[#222224]/80 p-5 sm:p-6 hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40">
							<div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-4">
								<FolderKanban className="size-5" />
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Project Milestones
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Group related tasks under defined projects. Track progress
								percentages, completion metrics, and sprint timelines in real time.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="group relative rounded-2xl border border-white/10 bg-[#222224]/80 p-5 sm:p-6 hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40">
							<div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
								<CalendarDays className="size-5" />
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Interactive Calendar
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Visualize upcoming deadlines and milestones across days and
								months. Seamlessly plan ahead and prevent bottleneck overlaps.
							</p>
						</div>

						{/* Feature 4 */}
						<div className="group relative rounded-2xl border border-white/10 bg-[#222224]/80 p-5 sm:p-6 hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40">
							<div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4">
								<Zap className="size-5" />
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Real-Time Team Sync
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Powered by instant event streaming. When colleagues update tasks,
								assign members, or complete deliverables, everyone sees it live.
							</p>
						</div>

						{/* Feature 5 */}
						<div className="group relative rounded-2xl border border-white/10 bg-[#222224]/80 p-5 sm:p-6 hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40">
							<div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 mb-4">
								<Users className="size-5" />
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Team Workspaces &amp; Roles
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Assign Owner, Admin, and Member permissions. Distribute one-click
								invite codes, review incoming member requests, and manage access.
							</p>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* DUAL WORKSPACE MODES SECTION */}
			<section id="workspaces" className="py-14 sm:py-20 bg-[#18181b]/50 border-t border-white/10">
				<MaxWidthWrapper>
					<div className="text-center max-w-2xl mx-auto mb-12">
						<p className="text-[11px] font-semibold text-[#a8a3a3] uppercase tracking-wider mb-1.5">
							Flexible Architecture
						</p>
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
							Tailored for Solos &amp; Teams Alike
						</h2>
						<p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
							Switch effortlessly between your private solo productivity desk and
							multi-member organizational workspaces.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
						{/* Solo Builder Card */}
						<div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/10 bg-[#222224] p-6 sm:p-8 hover:border-white/20 transition-all">
							<div>
								<div className="flex items-center justify-between mb-5">
									<div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white">
										<User className="size-5" />
									</div>
									<span className="text-[11px] font-semibold tracking-wider text-[#a8a3a3] uppercase">
										Individual Mode
									</span>
								</div>
								<h3 className="text-base sm:text-lg font-bold text-white mb-2">
									Individual Focus Desk
								</h3>
								<p className="text-xs sm:text-[13px] text-[#9c9696] mb-5 leading-relaxed">
									Designed for freelancers, independent developers, and solopreneurs
									who need zero distraction and maximum clarity.
								</p>

								<ul className="space-y-2.5 text-xs sm:text-[13px] text-[#c5bebe] mb-6">
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Personal project &amp; task tracking boards</span>
									</li>
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Interactive personal calendar with due-date reminders</span>
									</li>
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Personal task notes &amp; structured checklists</span>
									</li>
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Private workspace with no team clutter</span>
									</li>
								</ul>
							</div>

							<Button
								asChild
								variant="outline"
								className="w-full rounded-full border-white/20 text-white hover:bg-white/10 py-4 text-xs sm:text-sm"
							>
								<Link href="/sign-up">Start as an Individual</Link>
							</Button>
						</div>

						{/* Team Workspace Card */}
						<div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-b from-[#2a2a2e] to-[#202022] p-6 sm:p-8 shadow-xl hover:border-white/25 transition-all">
							<div>
								<div className="flex items-center justify-between mb-5">
									<div className="flex size-10 items-center justify-center rounded-xl bg-[#C4BEBE] text-[#222222]">
										<Users className="size-5" />
									</div>
									<span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase">
										Workspace Mode
									</span>
								</div>
								<h3 className="text-base sm:text-lg font-bold text-white mb-2">
									Collaborative Team Workspaces
								</h3>
								<p className="text-xs sm:text-[13px] text-[#9c9696] mb-5 leading-relaxed">
									Built for startups, agile engineering teams, and agencies looking
									to centralize deliverables and member accountability.
								</p>

								<ul className="space-y-2.5 text-xs sm:text-[13px] text-[#c5bebe] mb-6">
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Multi-team organization with member directories</span>
									</li>
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Role management: Owner, Admin, and Member permissions</span>
									</li>
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Quick share invite codes &amp; request approvals</span>
									</li>
									<li className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Live activity streams &amp; Pusher notifications</span>
									</li>
								</ul>
							</div>

							<Button
								asChild
								className="w-full rounded-full bg-[#C4BEBE] text-[#222222] font-semibold hover:bg-[#d8d2d2] py-4 text-xs sm:text-sm"
							>
								<Link href="/sign-up">Create a Team Workspace</Link>
							</Button>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* HOW IT WORKS SECTION */}
			<section id="how-it-works" className="py-14 sm:py-20 border-t border-white/10">
				<MaxWidthWrapper>
					<div className="text-center max-w-2xl mx-auto mb-12">
						<p className="text-[11px] font-semibold text-[#a8a3a3] uppercase tracking-wider mb-1.5">
							Simple Workflow
						</p>
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
							From idea to execution in three steps
						</h2>
						<p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
							Get your workspace up and running in less than two minutes.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
						{/* Step 1 */}
						<div className="flex flex-col items-start rounded-2xl border border-white/10 bg-[#222224]/70 p-5 sm:p-6">
							<div className="flex size-9 items-center justify-center rounded-full bg-white/10 font-mono text-xs font-bold text-white mb-4">
								01
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Create Your Workspace
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Sign up and spin up a dedicated workspace. Choose individual mode
								or invite teammates with auto-generated secure invite codes.
							</p>
						</div>

						{/* Step 2 */}
						<div className="flex flex-col items-start rounded-2xl border border-white/10 bg-[#222224]/70 p-5 sm:p-6">
							<div className="flex size-9 items-center justify-center rounded-full bg-white/10 font-mono text-xs font-bold text-white mb-4">
								02
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Group &amp; Prioritize
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Break down complex projects into actionable tasks. Assign priorities
								(Urgent, High, Medium, Low) and establish explicit deadlines.
							</p>
						</div>

						{/* Step 3 */}
						<div className="flex flex-col items-start rounded-2xl border border-white/10 bg-[#222224]/70 p-5 sm:p-6">
							<div className="flex size-9 items-center justify-center rounded-full bg-white/10 font-mono text-xs font-bold text-white mb-4">
								03
							</div>
							<h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">
								Track &amp; Ship
							</h3>
							<p className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed">
								Stay on top of delivery dates through the interactive calendar,
								view real-time activity streams, and celebrate finished milestones.
							</p>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* PRICING SECTION */}
			<section id="pricing" className="py-14 sm:py-20 bg-[#18181b]/50 border-t border-white/10">
				<MaxWidthWrapper>
					<div className="text-center max-w-2xl mx-auto mb-12">
						<p className="text-[11px] font-semibold text-[#a8a3a3] uppercase tracking-wider mb-1.5">
							Simple Pricing
						</p>
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
							Transparent plans for every scale
						</h2>
						<p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
							Start free and upgrade when your team expands.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
						{/* Tier 1: Solo */}
						<div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/10 bg-[#222224] p-6 sm:p-7 hover:border-white/20 transition-all">
							<div>
								<h3 className="text-sm sm:text-base font-semibold text-white">Starter Solo</h3>
								<p className="text-[11px] text-[#9c9696] mt-0.5">
									Perfect for freelancers &amp; individuals
								</p>
								<div className="mt-5 flex items-baseline gap-1">
									<span className="text-2xl sm:text-3xl font-bold text-white">$0</span>
									<span className="text-xs text-[#9c9696]">/ month</span>
								</div>
								<p className="text-[11px] text-[#a8a3a3] mt-0.5">Free forever</p>

								<div className="mt-5 pt-5 border-t border-white/10 space-y-2.5 text-xs text-[#c5bebe]">
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Unlimited personal projects</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Up to 100 active tasks</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Interactive calendar view</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Rich task notes &amp; checklists</span>
									</div>
								</div>
							</div>

							<Button
								asChild
								variant="outline"
								className="mt-6 w-full rounded-full border-white/20 text-white hover:bg-white/10 py-4 text-xs sm:text-sm"
							>
								<Link href="/sign-up">Start Free</Link>
							</Button>
						</div>

						{/* Tier 2: Team Pro */}
						<div className="relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border-2 border-[#C4BEBE]/60 bg-gradient-to-b from-[#2b2b2f] to-[#222224] p-6 sm:p-7 shadow-xl transition-all">
							<div className="absolute -top-3 left-5">
								<span className="text-[10px] font-bold text-[#222222] bg-[#C4BEBE] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
									Popular
								</span>
							</div>

							<div>
								<h3 className="text-sm sm:text-base font-semibold text-white">Team Pro</h3>
								<p className="text-[11px] text-[#9c9696] mt-0.5">
									For fast-paced startup teams
								</p>
								<div className="mt-5 flex items-baseline gap-1">
									<span className="text-2xl sm:text-3xl font-bold text-white">$12</span>
									<span className="text-xs text-[#9c9696]">/ member / mo</span>
								</div>
								<p className="text-[11px] text-[#a8a3a3] mt-0.5">Billed annually or monthly</p>

								<div className="mt-5 pt-5 border-t border-white/10 space-y-2.5 text-xs text-[#c5bebe]">
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Unlimited workspaces &amp; projects</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Real-time Pusher state sync</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Member roles (Owner, Admin, Member)</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Invite codes &amp; join requests</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Team activity audit log</span>
									</div>
								</div>
							</div>

							<Button
								asChild
								className="mt-6 w-full rounded-full bg-[#C4BEBE] text-[#222222] font-semibold hover:bg-[#d8d2d2] py-4 text-xs sm:text-sm shadow-md"
							>
								<Link href="/sign-up">Get Started with Team Pro</Link>
							</Button>
						</div>

						{/* Tier 3: Enterprise */}
						<div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-white/10 bg-[#222224] p-6 sm:p-7 hover:border-white/20 transition-all">
							<div>
								<h3 className="text-sm sm:text-base font-semibold text-white">Enterprise</h3>
								<p className="text-[11px] text-[#9c9696] mt-0.5">
									Custom setups for organizations
								</p>
								<div className="mt-5 flex items-baseline gap-1">
									<span className="text-2xl sm:text-3xl font-bold text-white">Custom</span>
								</div>
								<p className="text-[11px] text-[#a8a3a3] mt-0.5">Tailored to your requirements</p>

								<div className="mt-5 pt-5 border-t border-white/10 space-y-2.5 text-xs text-[#c5bebe]">
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Dedicated database instances</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Custom SSO &amp; Auth adapters</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Priority 24/7 SLA support</span>
									</div>
									<div className="flex items-center gap-2.5">
										<Check className="size-3.5 text-emerald-400 shrink-0" />
										<span>Unlimited team seats</span>
									</div>
								</div>
							</div>

							<Button
								asChild
								variant="outline"
								className="mt-6 w-full rounded-full border-white/20 text-white hover:bg-white/10 py-4 text-xs sm:text-sm"
							>
								<Link href="/sign-in">Contact Sales</Link>
							</Button>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* FAQ SECTION */}
			<section id="faq" className="py-14 sm:py-20 border-t border-white/10">
				<MaxWidthWrapper className="max-w-3xl">
					<div className="text-center max-w-xl mx-auto mb-12">
						<p className="text-[11px] font-semibold text-[#a8a3a3] uppercase tracking-wider mb-1.5">
							Got Questions?
						</p>
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
							Frequently Asked Questions
						</h2>
						<p className="mt-2 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed">
							Find answers to common questions about Collaborate.
						</p>
					</div>

					<Accordion type="single" collapsible className="w-full space-y-3">
						<AccordionItem
							value="item-1"
							className="border border-white/10 bg-[#222224]/80 rounded-2xl px-5 py-0.5"
						>
							<AccordionTrigger className="text-left font-medium text-white hover:no-underline text-xs sm:text-sm md:text-[15px]">
								Can I use Collaborate purely for personal productivity?
							</AccordionTrigger>
							<AccordionContent className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed pt-1.5 pb-3">
								Yes, absolutely! Collaborate includes an Individual Mode designed specifically
								for solo creators, freelancers, and students. You get full access to task
								boards, project grouping, and the interactive calendar without needing to invite
								or manage any team members.
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="item-2"
							className="border border-white/10 bg-[#222224]/80 rounded-2xl px-5 py-0.5"
						>
							<AccordionTrigger className="text-left font-medium text-white hover:no-underline text-xs sm:text-sm md:text-[15px]">
								How do team workspaces and invite codes work?
							</AccordionTrigger>
							<AccordionContent className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed pt-1.5 pb-3">
								When you create a Team Workspace, you can generate shareable invite codes or
								approve incoming membership requests. You can assign roles including Owner,
								Admin, and Member to ensure each teammate has the right permissions.
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="item-3"
							className="border border-white/10 bg-[#222224]/80 rounded-2xl px-5 py-0.5"
						>
							<AccordionTrigger className="text-left font-medium text-white hover:no-underline text-xs sm:text-sm md:text-[15px]">
								How does real-time synchronization work?
							</AccordionTrigger>
							<AccordionContent className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed pt-1.5 pb-3">
								Collaborate is integrated with real-time websocket channels powered by Pusher.
								Whenever tasks are re-prioritized, marked completed, or assigned, changes reflect
								instantaneously across all connected teammates without manual page reloads.
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="item-4"
							className="border border-white/10 bg-[#222224]/80 rounded-2xl px-5 py-0.5"
						>
							<AccordionTrigger className="text-left font-medium text-white hover:no-underline text-xs sm:text-sm md:text-[15px]">
								How do priority levels help organize work?
							</AccordionTrigger>
							<AccordionContent className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed pt-1.5 pb-3">
								Tasks are categorized into Urgent, High, Medium, Low, or No Priority. Distinct
								color coding helps your team visually spot high-impact deadlines and triage workloads
								effectively every day.
							</AccordionContent>
						</AccordionItem>

						<AccordionItem
							value="item-5"
							className="border border-white/10 bg-[#222224]/80 rounded-2xl px-5 py-0.5"
						>
							<AccordionTrigger className="text-left font-medium text-white hover:no-underline text-xs sm:text-sm md:text-[15px]">
								Is Collaborate responsive across mobile and tablet devices?
							</AccordionTrigger>
							<AccordionContent className="text-xs sm:text-[13px] text-[#9c9696] leading-relaxed pt-1.5 pb-3">
								Yes! The entire application and landing page are built using modern responsive
								Tailwind layouts, ensuring smooth usability on smartphones, tablets, laptops, and
								ultra-wide desktop monitors.
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</MaxWidthWrapper>
			</section>

			{/* BOTTOM CTA BANNER */}
			<section className="py-14 sm:py-20 border-t border-white/10 relative overflow-hidden bg-gradient-to-b from-[#222224] to-[#18181b]">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[250px] bg-[#C4BEBE]/10 blur-[120px] pointer-events-none -z-10" />

				<MaxWidthWrapper>
					<div className="flex flex-col items-center text-center max-w-2xl mx-auto">
						<h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
							Ready to transform how you &amp; your team get work done?
						</h2>

						<p className="mt-3 text-xs sm:text-sm text-[#a8a3a3] max-w-lg leading-relaxed">
							Join individuals and agile squads shipping faster with Collaborate. Set up your
							first workspace in less than two minutes.
						</p>

						<div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
							<Button
								asChild
								size="default"
								className="w-full sm:w-auto rounded-full bg-[#C4BEBE] text-[#222222] font-semibold hover:bg-[#d8d2d2] shadow-md text-xs sm:text-sm px-7 py-5"
							>
								<Link href="/sign-up" className="flex items-center gap-2">
									Get Started Free
									<ArrowRight className="size-3.5" />
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								size="default"
								className="w-full sm:w-auto rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs sm:text-sm px-7 py-5"
							>
								<Link href="/sign-in">Sign In</Link>
							</Button>
						</div>

						<p className="mt-3 text-[11px] text-[#858080]">
							Free forever for individuals • Quick 30-second sign up
						</p>
					</div>
				</MaxWidthWrapper>
			</section>
		</div>
	);
}
