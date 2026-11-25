"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { HiOutlineBars3, HiXMark } from "react-icons/hi2";

const PUBLIC_NAV_ITEMS = [
	{ name: "Features", href: "#features" },
	{ name: "Workspaces", href: "#workspaces" },
	{ name: "How It Works", href: "#how-it-works" },
	{ name: "Pricing", href: "#pricing" },
	{ name: "FAQ", href: "#faq" },
];

export default function PublicNavbar() {
	const [openNav, setOpenNav] = useState(false);
	const [scrolled, setScrolled] = useState(false);
	const pathName = usePathname();

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 20) {
				setScrolled(true);
			} else {
				setScrolled(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Close mobile menu on resize to desktop
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				setOpenNav(false);
			}
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const handleOpenNav = () => {
		setOpenNav(!openNav);
	};

	return (
		<header
			className={`sticky top-0 z-50 w-full transition-all duration-200 ${
				scrolled || openNav
					? "bg-[#222222]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20"
					: "bg-[#222222]/60 backdrop-blur-sm border-b border-white/5"
			}`}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex h-14 sm:h-16 items-center justify-between">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center gap-2 focus:outline-none"
						onClick={() => setOpenNav(false)}
					>
						<Image
							src="/resources/logo.png"
							alt="Collaborate Logo"
							width={140}
							height={30}
							priority
							className="h-6 sm:h-7 w-auto object-contain"
						/>
					</Link>

					{/* Desktop Navigation Links */}
					<nav className="hidden md:flex items-center gap-7 text-xs sm:text-[13px] font-medium">
						{PUBLIC_NAV_ITEMS.map((item) => {
							const isActive = pathName === item.href;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={`transition-colors hover:text-white ${
										isActive ? "text-white font-semibold" : "text-[#a8a3a3]"
									}`}
								>
									{item.name}
								</Link>
							);
						})}
					</nav>

					{/* Desktop Action Buttons */}
					<div className="hidden md:flex items-center gap-2.5">
						<Button
							variant="ghost"
							size="sm"
							asChild
							className="text-xs text-[#c5bebe] hover:text-white hover:bg-white/10 rounded-full px-4 h-8"
						>
							<Link href="/sign-in">Sign In</Link>
						</Button>
						<Button
							size="sm"
							asChild
							className="text-xs rounded-full bg-[#C4BEBE] text-[#222222] font-medium hover:bg-[#d4cece] shadow-sm transition-all px-4 h-8"
						>
							<Link href="/sign-up">Get Started</Link>
						</Button>
					</div>

					{/* Mobile Menu Toggle Button */}
					<div className="flex md:hidden items-center">
						<button
							onClick={handleOpenNav}
							type="button"
							aria-label="Toggle navigation menu"
							aria-expanded={openNav}
							className="p-2 text-[#c5bebe] hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none"
						>
							{openNav ? (
								<HiXMark className="w-6 h-6" />
							) : (
								<HiOutlineBars3 className="w-6 h-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Dropdown Menu */}
			{openNav && (
				<div className="md:hidden border-b border-white/10 bg-[#222222] px-4 pt-4 pb-6 space-y-4 shadow-2xl">
					<nav className="flex flex-col space-y-3">
						{PUBLIC_NAV_ITEMS.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								onClick={() => setOpenNav(false)}
								className="px-3 py-2 text-base font-medium text-[#c5bebe] hover:text-white hover:bg-white/5 rounded-lg transition-colors"
							>
								{item.name}
							</Link>
						))}
					</nav>
					<div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
						<Button
							asChild
							variant="outline"
							className="w-full justify-center rounded-full border-white/20 text-white hover:bg-white/10 text-sm py-2.5"
						>
							<Link href="/sign-in" onClick={() => setOpenNav(false)}>
								Sign In
							</Link>
						</Button>
						<Button
							asChild
							className="w-full justify-center rounded-full bg-[#C4BEBE] text-[#222222] hover:bg-[#d4cece] font-semibold text-sm py-2.5"
						>
							<Link href="/sign-up" onClick={() => setOpenNav(false)}>
								Get Started Free
							</Link>
						</Button>
					</div>
				</div>
			)}
		</header>
	);
}
