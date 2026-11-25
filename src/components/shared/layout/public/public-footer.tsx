import Image from "next/image";
import Link from "next/link";
import MaxWidthWrapper from "@/components/shared/layout/max-width-wrapper";
import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

export default function PublicFooter() {
	return (
		<footer className="border-t border-white/10 bg-[#1a1a1c] text-[#c5bebe]">
			<MaxWidthWrapper className="py-12 md:py-16">
				<div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5">
					{/* Brand Column */}
					<div className="sm:col-span-2 md:col-span-2 flex flex-col gap-4">
						<Link href="/" className="inline-block">
							<Image
								src="/resources/logo.png"
								alt="Collaborate Logo"
								width={140}
								height={32}
								className="h-7 w-auto object-contain"
							/>
						</Link>
						<p className="text-xs text-[#9c9696] max-w-sm leading-relaxed">
							The modern workspace for high-velocity teams and ambitious individuals.
							Track tasks, organize projects, and stay aligned effortlessly.
						</p>
					</div>

					{/* Product Column */}
					<div className="flex flex-col gap-3">
						<h4 className="text-xs font-semibold text-white tracking-wider uppercase">
							Product
						</h4>
						<ul className="flex flex-col gap-2 text-xs text-[#9c9696]">
							<li>
								<Link href="#features" className="hover:text-white transition-colors">
									Features
								</Link>
							</li>
							<li>
								<Link href="#how-it-works" className="hover:text-white transition-colors">
									How It Works
								</Link>
							</li>
							<li>
								<Link href="#workspaces" className="hover:text-white transition-colors">
									Workspaces
								</Link>
							</li>
							<li>
								<Link href="#pricing" className="hover:text-white transition-colors">
									Pricing
								</Link>
							</li>
							<li>
								<Link href="#faq" className="hover:text-white transition-colors">
									FAQ
								</Link>
							</li>
						</ul>
					</div>

					{/* Solutions Column */}
					<div className="flex flex-col gap-3">
						<h4 className="text-xs font-semibold text-white tracking-wider uppercase">
							Solutions
						</h4>
						<ul className="flex flex-col gap-2 text-xs text-[#9c9696]">
							<li>
								<Link href="/sign-up" className="hover:text-white transition-colors">
									Individual Desk
								</Link>
							</li>
							<li>
								<Link href="/sign-up" className="hover:text-white transition-colors">
									Team Workspaces
								</Link>
							</li>
							<li>
								<Link href="/sign-up" className="hover:text-white transition-colors">
									Task Prioritization
								</Link>
							</li>
							<li>
								<Link href="/sign-up" className="hover:text-white transition-colors">
									Interactive Calendar
								</Link>
							</li>
						</ul>
					</div>

					{/* Account & Resources Column */}
					<div className="flex flex-col gap-3">
						<h4 className="text-xs font-semibold text-white tracking-wider uppercase">
							Get Started
						</h4>
						<ul className="flex flex-col gap-2 text-xs text-[#9c9696]">
							<li>
								<Link href="/sign-up" className="hover:text-white transition-colors">
									Create Account
								</Link>
							</li>
							<li>
								<Link href="/sign-in" className="hover:text-white transition-colors">
									Sign In
								</Link>
							</li>
							<li>
								<Link href="/sign-in/my-workspaces" className="hover:text-white transition-colors">
									Find Workspaces
								</Link>
							</li>
							<li>
								<Link href="/join-workspace" className="hover:text-white transition-colors">
									Join via Invite Code
								</Link>
							</li>
						</ul>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#858080]">
					<p>© {new Date().getFullYear()} Collaborate. Built for productivity.</p>
					<div className="flex items-center gap-6">
						<Link href="/sign-in" className="hover:text-white transition-colors">
							Privacy
						</Link>
						<Link href="/sign-in" className="hover:text-white transition-colors">
							Terms
						</Link>
						<Link href="/sign-in" className="hover:text-white transition-colors">
							Security
						</Link>
					</div>
				</div>
			</MaxWidthWrapper>
		</footer>
	);
}
