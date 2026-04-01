import {
	Bell,
	Blocks,
	Box,
	CalendarDays,
	CircleDashed,
	Group,
	LayoutDashboard,
	ListTodo,
	Settings,
	Users,
	Workflow,
} from "lucide-react";
import { Quote } from "./types";

export const NAVLINKS = [
	{
		name: "Home",
		link: "/",
	},
	{
		name: "Product",
		link: "/product",
	},
	{
		name: "Guides",
		link: "/guides",
	},
	{
		name: "Docs",
		link: "/docs",
	},
	{
		name: "Blogs",
		link: "/blogs",
	},
];

export const WORKSPACE = [
	{
		id: "132",
		name: "From Nothing To FAANG",
		mode: "WORKSPACE",
		value: 20,
	},
	{
		id: "453",
		name: "From Nothing To FAANG",
		mode: "WORKSPACE",
		value: 20,
	},
	{
		id: "565",
		name: "From Nothing To FAANG",
		mode: "INDIVIDUAL",
		value: 20,
	},
	{
		id: "233",
		name: "From Nothing To FAANG",
		mode: "WORKSPACE",
		value: 20,
	},
];

export const INDUSTRY_TYPES = [
	"Technology / Software",
	"Marketing & Advertising",
	"Design & Creative",
	"Education",
	"Consulting",
	"Finance & Accounting",
	"Healthcare",
	"Real Estate",
	"E-commerce & Retail",
	"Media & Entertainment",
	"Construction & Engineering",
	"Legal Services",
	"Manufacturing",
	"Non-profit / NGO",
	"Government / Public Sector",
	"Hospitality & Tourism",
	"Human Resources",
	"Research & Development",
	"Startups",
	"Other",
];

export const TEAM_SIZE = [
	"2-5",
	"6-10",
	"11-20",
	"21-50",
	"51-100",
	"101-250",
	"251-500",
	"500+",
];

export const PROTECTEDPERSONALNAVBAR = [
	{
		name: "Dashboard",
		link: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Tasks",
		link: "/tasks",
		icon: ListTodo,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
	},
	{
		name: "Calendar",
		link: "/calendar",
		icon: CalendarDays,
	},
	{
		name: "Settings",
		link: "/settings",
		icon: Settings,
	},
];

export const PROTECTEADMINNAVBAR = [
	{
		name: "Dashboard",
		link: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Tasks",
		link: "/tasks",
		icon: ListTodo,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
	},
	{
		name: "Calendar",
		link: "/calendar",
		icon: CalendarDays,
	},
	{
		name: "Members",
		link: "/members",
		icon: Users,
	},
	{
		name: "Teams",
		link: "/teams",
		icon: Group,
	},
	{
		name: "Activity",
		link: "/activity",
		icon: Workflow,
	},
	{
		name: "Notifications",
		link: "/notifications",
		icon: Bell,
	},
	{
		name: "Invite Codes",
		link: "/invite-codes",
		icon: CircleDashed,
	},
	{
		name: "Requests",
		link: "/requests",
		icon: Blocks,
	},
	{
		name: "Settings",
		link: "/settings",
		icon: Settings,
	},
];

export const PROTECTEDMEMBERNAVBAR = [
	{
		name: "Dashboard",
		link: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		name: "Tasks",
		link: "/tasks",
		icon: ListTodo,
	},
	{
		name: "Projects",
		link: "/projects",
		icon: Box,
	},
	{
		name: "Calendar",
		link: "/calendar",
		icon: CalendarDays,
	},
	{
		name: "Members",
		link: "/members",
		icon: Users,
	},
	{
		name: "Settings",
		link: "/settings",
		icon: Settings,
	},
];

export const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const motivationalQuotes: Quote[] = [
	{
		text: "Great things are done by a series of small things brought together.",
		author: "Vincent Van Gogh",
	},
	{
		text: "The only way to do great work is to love what you do.",
		author: "Steve Jobs",
	},
	{
		text: "Innovation distinguishes between a leader and a follower.",
		author: "Steve Jobs",
	},
	{
		text: "Life is what happens when you're busy making other plans.",
		author: "John Lennon",
	},
	{
		text: "The future belongs to those who believe in the beauty of their dreams.",
		author: "Eleanor Roosevelt",
	},
	{
		text: "It is during our darkest moments that we must focus to see the light.",
		author: "Aristotle",
	},
	{
		text: "The only impossible journey is the one you never begin.",
		author: "Tony Robbins",
	},
	{
		text: "Success is not final, failure is not fatal.",
		author: "Winston Churchill",
	},
	{
		text: "Believe you can and you're halfway there.",
		author: "Theodore Roosevelt",
	},
	{
		text: "The best time to plant a tree was 20 years ago. The second best time is now.",
		author: "Chinese Proverb",
	},
	{
		text: "Don't watch the clock; do what it does. Keep going.",
		author: "Sam Levenson",
	},
	{
		text: "We are what our thoughts have made us; so take care about what you think.",
		author: "Swami Vivekananda",
	},
	{
		text: "The way to get started is to quit talking and begin doing.",
		author: "Walt Disney",
	},
	{
		text: "Don't let yesterday take up too much of today.",
		author: "Will Rogers",
	},
	{
		text: "You learn more from failure than from success.",
		author: "Unknown",
	},
	{
		text: "It's not whether you get knocked down, it's whether you get up.",
		author: "Vince Lombardi",
	},
	{
		text: "Start where you are, use what you have, do what you can.",
		author: "Arthur Ashe",
	},
	{
		text: "Fall seven times, stand up eight.",
		author: "Japanese Proverb",
	},
	{
		text: "Everything you want is on the other side of fear.",
		author: "Jack Canfield",
	},
	{
		text: "The only limit to our realization of tomorrow is our doubts of today.",
		author: "Franklin D. Roosevelt",
	},
	{
		text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.",
		author: "Roy T. Bennett",
	},
	{
		text: "I learned that courage was not the absence of fear, but the triumph over it.",
		author: "Nelson Mandela",
	},
	{
		text: "The future depends on what you do today.",
		author: "Mahatma Gandhi",
	},
	{
		text: "Quality is not an act, it is a habit.",
		author: "Aristotle",
	},
	{
		text: "The only person you are destined to become is the person you decide to be.",
		author: "Ralph Waldo Emerson",
	},
	{
		text: "Success usually comes to those who are too busy to be looking for it.",
		author: "Henry David Thoreau",
	},
	{
		text: "Don't be afraid to give up the good to go for the great.",
		author: "John D. Rockefeller",
	},
	{
		text: "I find that the harder I work, the more luck I seem to have.",
		author: "Thomas Jefferson",
	},
	{
		text: "The only person liable to know better than I know myself who I am is me.",
		author: "Michael Bassey Johnson",
	},
	{
		text: "Great minds have purposes; others have wishes.",
		author: "Washington Irving",
	},
	{
		text: "Everything is possible for who believe.",
		author: "Mark 9:23",
	},
	{
		text: "Whether you believe you can do a thing or not, you are right.",
		author: "Henry Ford",
	},
	{
		text: "What lies behind us and what lies ahead of us are tiny matters compared to what lies within us.",
		author: "Ralph Waldo Emerson",
	},
	{
		text: "The most difficult thing is the decision to act, the rest is merely tenacity.",
		author: "Amelia Earhart",
	},
	{
		text: "You are never too old to set another goal or to dream a new dream.",
		author: "C.S. Lewis",
	},
	{
		text: "What we fear doing most is usually what we most need to do.",
		author: "Tim Ferriss",
	},
	{
		text: "Your limitation—it's only your imagination.",
		author: "Unknown",
	},
	{
		text: "There is nothing impossible to those who will try.",
		author: "Alexander the Great",
	},
	{
		text: "The best revenge is massive success.",
		author: "Frank Sinatra",
	},
	{
		text: "Opportunity is missed by most people because it is dressed in overalls and looks like work.",
		author: "Thomas Edison",
	},
	{
		text: "We cannot direct the wind, but we can adjust the sails.",
		author: "Dolly Parton",
	},
	{
		text: "The only way to do great work is to do work you love.",
		author: "Steve Jobs",
	},
	{
		text: "Success is getting what you want. Happiness is wanting what you get.",
		author: "Dale Carnegie",
	},
	{
		text: "If you do what you love, you'll never work a day in your life.",
		author: "Marc Anthony",
	},
	{
		text: "You don't have to be great to start, but you have to start to be great.",
		author: "Zig Ziglar",
	},
	{
		text: "The way to predict the future is to create it.",
		author: "Peter Drucker",
	},
	{
		text: "Don't worry about failures, worry about the chances you miss when you don't even try.",
		author: "Jack Canfield",
	},
	{
		text: "Life is like riding a bicycle. To keep your balance, you must keep moving.",
		author: "Albert Einstein",
	},
	{
		text: "If you are willing to do only what is easy, life will be hard.",
		author: "Unknown",
	},
	{
		text: "The man who moves a mountain begins by carrying away small stones.",
		author: "Confucius",
	},
	{
		text: "Success is not about how high you have climbed, but how you make those below feel when climbing.",
		author: "Unknown",
	},
	{
		text: "You miss 100% of the shots you don't take.",
		author: "Wayne Gretzky",
	},
	{
		text: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
		author: "Ralph Waldo Emerson",
	},
	{
		text: "The only true wisdom is in knowing you know nothing.",
		author: "Socrates",
	},
	{
		text: "Darkness cannot drive out darkness; only light can do that.",
		author: "Martin Luther King Jr.",
	},
	{
		text: "Our deepest fear is not that we are inadequate. Our deepest fear is that we are powerful beyond measure.",
		author: "Nelson Mandela",
	},
	{
		text: "The best time for new beginnings is now.",
		author: "Unknown",
	},
	{
		text: "Courage is grace under pressure.",
		author: "Ernest Hemingway",
	},
	{
		text: "If you're going through hell, keep going.",
		author: "Winston Churchill",
	},
	{
		text: "Life shrinks or expands in proportion to one's courage.",
		author: "Anaïs Nin",
	},
	{
		text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
		author: "Nelson Mandela",
	},
	{
		text: "In order to succeed, we must first believe that we can.",
		author: "Nikos Kazantzakis",
	},
	{
		text: "Everything you desire is on the other side of the fear you feel.",
		author: "Unknown",
	},
	{
		text: "A goal is a dream with a deadline.",
		author: "Unknown",
	},
	{
		text: "Don't aim at success—the more you aim at it and make it a target, the more you are going to miss it.",
		author: "Viktor Frankl",
	},
	{
		text: "The mind is everything. What you think, you become.",
		author: "Buddha",
	},
	{
		text: "Success is not final, failure is not fatal; it is the courage to continue that counts.",
		author: "Winston Churchill",
	},
	{
		text: "Only a life lived for others is a life worthwhile.",
		author: "Albert Einstein",
	},
	{
		text: "The greatest wealth is health.",
		author: "Virgil",
	},
	{
		text: "You are the master of your destiny.",
		author: "Unknown",
	},
	{
		text: "A single act of kindness throws out roots in all directions.",
		author: "Amelia Earhart",
	},
	{
		text: "The only genuine power is the power to alleviate suffering.",
		author: "Rumi",
	},
	{
		text: "All our dreams can come true if we have the courage to pursue them.",
		author: "Walt Disney",
	},
	{
		text: "Do something every day that scares you.",
		author: "Eleanor Roosevelt",
	},
	{
		text: "Great achievement is a gift, but it is not the final word.",
		author: "Nelson Mandela",
	},
	{
		text: "Your education is a dress rehearsal for a life that is yours to lead.",
		author: "Nora Ephron",
	},
	{
		text: "You can't use up creativity. The more you use, the more you have.",
		author: "Maya Angelou",
	},
	{
		text: "It always seems impossible until it's done.",
		author: "Nelson Mandela",
	},
	{
		text: "The journey of a thousand miles begins with a single step.",
		author: "Lao Tzu",
	},
	{
		text: "You are braver than you believe, stronger than you seem, and smarter than you think.",
		author: "A.A. Milne",
	},
	{
		text: "Believe in something larger than yourself.",
		author: "Barbara Bush",
	},
	{
		text: "The only person who can pull you down is yourself, and you're the only one who can lift yourself up.",
		author: "Chris Freytag",
	},
	{
		text: "Good things come to those who wait, great things come to those who try.",
		author: "Unknown",
	},
	{
		text: "The difference between who you are and who you want to be is what you do.",
		author: "Unknown",
	},
	{
		text: "Success is walking from failure to failure with no loss of enthusiasm.",
		author: "Winston Churchill",
	},
	{
		text: "It's not about how hard you hit. It's about how hard you can get hit and keep moving forward.",
		author: "Rocky Balboa",
	},
	{
		text: "Success is 1% inspiration and 99% perspiration.",
		author: "Thomas Edison",
	},
	{
		text: "The secret of getting ahead is getting started.",
		author: "Mark Twain",
	},
	{
		text: "You are stronger than you think.",
		author: "Unknown",
	},
	{
		text: "Success is going from failure to failure without a loss of enthusiasm.",
		author: "Unknown",
	},
	{
		text: "Don't let success go to your head or failure go to your heart.",
		author: "Unknown",
	},
	{
		text: "Your biggest limitation is yourself.",
		author: "Unknown",
	},
	{
		text: "Surround yourself with those who will push you higher.",
		author: "Oprah Winfrey",
	},
	{
		text: "The best projects are the ones that make you slightly uncomfortable.",
		author: "Unknown",
	},
	{
		text: "Life is 10% what happens and 90% how you react to it.",
		author: "Charles R. Swindoll",
	},
	{
		text: "You are never a failure unless you accept defeat as final.",
		author: "Og Mandino",
	},
	{
		text: "Perfection is not just about control, it's also about letting go.",
		author: "Stanley Kubrick",
	},
	{
		text: "The way to do is to be.",
		author: "Lao Tzu",
	},
	{
		text: "Be yourself; everyone else is already taken.",
		author: "Oscar Wilde",
	},
	{
		text: "The greatest show of love is time.",
		author: "Unknown",
	},
	{
		text: "Nothing is impossible to willing hearts.",
		author: "John Heywood",
	},
	{
		text: "You are the author of your own story.",
		author: "Unknown",
	},
	{
		text: "The harder you work for something, the greater you'll feel when you achieve it.",
		author: "Unknown",
	},
];
