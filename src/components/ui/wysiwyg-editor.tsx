"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import {
	Bold,
	Italic,
	Strikethrough,
	Code,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Quote,
	Minus,
	Link as LinkIcon,
	Unlink,
	Undo,
	Redo,
	RemoveFormatting,
	Pilcrow,
	SquareCode,
} from "lucide-react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";

interface WysiwygEditorProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	minHeight?: string;
	height?: string;
	maxHeight?: string;
	textColor?: string;
}

export default function WysiwygEditor({
	value,
	onChange,
	placeholder = "Type a description...",
	disabled = false,
	minHeight = "300px",
	height = "350px",
	maxHeight = "400px",
	textColor = "text-primary",
}: WysiwygEditorProps) {
	const [linkUrl, setLinkUrl] = useState("");
	const [isLinkOpen, setIsLinkOpen] = useState(false);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
			}),
			Placeholder.configure({
				placeholder,
			}),
			LinkExtension.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-primary underline font-medium hover:opacity-80 transition-opacity",
				},
			}),
		],
		content: value,
		editable: !disabled,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange(html === "<p></p>" ? "" : html);
		},
		immediatelyRender: false,
	});

	useEffect(() => {
		if (editor && disabled !== !editor.isEditable) {
			editor.setEditable(!disabled);
		}
	}, [disabled, editor]);

	// Sync external value changes if needed (e.g. form reset)
	useEffect(() => {
		if (editor && value !== editor.getHTML()) {
			if (value === "" && editor.getHTML() === "<p></p>") return;
			editor.commands.setContent(value);
		}
	}, [value, editor]);

	if (!editor) {
		return (
			<div
				style={{ minHeight }}
				className="w-full rounded-[20px] bg-accent/30 animate-pulse flex items-center justify-center text-primary/40 text-sm"
			>
				Loading editor...
			</div>
		);
	}

	const setLink = () => {
		if (linkUrl === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
		} else {
			const formattedUrl =
				linkUrl.startsWith("http://") || linkUrl.startsWith("https://") ?
					linkUrl
				:	`https://${linkUrl}`;
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.setLink({ href: formattedUrl })
				.run();
		}
		setLinkUrl("");
		setIsLinkOpen(false);
	};

	return (
		<div className="w-full text-left flex flex-col rounded-[20px] border-0 bg-transparent overflow-hidden">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-1 p-2 bg-accent rounded-t-[20px] border-0">
				{/* Text formatting group */}
				<div className="flex items-center gap-0.5 pr-2 border-r border-primary/10">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleBold().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("bold") ? "bg-primary text-secondary" : "text-primary"
						}`}
						title="Bold (Ctrl+B)"
					>
						<Bold className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleItalic().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("italic") ? "bg-primary text-secondary" : "text-primary"
						}`}
						title="Italic (Ctrl+I)"
					>
						<Italic className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleStrike().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("strike") ? "bg-primary text-secondary" : "text-primary"
						}`}
						title="Strikethrough"
					>
						<Strikethrough className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleCode().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("code") ? "bg-primary text-secondary" : "text-primary"
						}`}
						title="Inline Code"
					>
						<Code className="w-4 h-4" />
					</Button>
				</div>

				{/* Heading group */}
				<div className="flex items-center gap-0.5 px-2 border-r border-primary/10">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().setParagraph().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("paragraph") && !editor.isActive("heading") ?
								"bg-primary text-secondary"
							:	"text-primary"
						}`}
						title="Paragraph"
					>
						<Pilcrow className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("heading", { level: 1 }) ?
								"bg-primary text-secondary"
							:	"text-primary"
						}`}
						title="Heading 1"
					>
						<Heading1 className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("heading", { level: 2 }) ?
								"bg-primary text-secondary"
							:	"text-primary"
						}`}
						title="Heading 2"
					>
						<Heading2 className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("heading", { level: 3 }) ?
								"bg-primary text-secondary"
							:	"text-primary"
						}`}
						title="Heading 3"
					>
						<Heading3 className="w-4 h-4" />
					</Button>
				</div>

				{/* Lists & Blocks group */}
				<div className="flex items-center gap-0.5 px-2 border-r border-primary/10">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("bulletList") ? "bg-primary text-secondary" : (
								"text-primary"
							)
						}`}
						title="Bullet List"
					>
						<List className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleOrderedList().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("orderedList") ? "bg-primary text-secondary" : (
								"text-primary"
							)
						}`}
						title="Numbered List"
					>
						<ListOrdered className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleBlockquote().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("blockquote") ? "bg-primary text-secondary" : (
								"text-primary"
							)
						}`}
						title="Blockquote"
					>
						<Quote className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
						className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
							editor.isActive("codeBlock") ? "bg-primary text-secondary" : (
								"text-primary"
							)
						}`}
						title="Code Block"
					>
						<SquareCode className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().setHorizontalRule().run()}
						className="h-8 w-8 rounded-lg text-primary hover:bg-primary/20 transition-colors"
						title="Horizontal Divider"
					>
						<Minus className="w-4 h-4" />
					</Button>
				</div>

				{/* Links group */}
				<div className="flex items-center gap-0.5 px-2 border-r border-primary/10">
					<Popover open={isLinkOpen} onOpenChange={setIsLinkOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled}
								onClick={() => {
									const previousUrl = editor.getAttributes("link").href;
									setLinkUrl(previousUrl || "");
								}}
								className={`h-8 w-8 rounded-lg hover:bg-primary/20 transition-colors ${
									editor.isActive("link") ? "bg-primary text-secondary" : (
										"text-primary"
									)
								}`}
								title="Insert Link"
							>
								<LinkIcon className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-72 p-3 bg-accent text-primary border-0 rounded-[15px]">
							<div className="flex flex-col gap-2">
								<p className="text-xs font-semibold">Insert / Edit Link</p>
								<Input
									placeholder="https://example.com"
									value={linkUrl}
									onChange={(e) => setLinkUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											setLink();
										}
									}}
									className="h-8 text-xs bg-primary text-secondary placeholder:text-secondary/60"
								/>
								<div className="flex justify-end gap-1.5 mt-1">
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => setIsLinkOpen(false)}
										className="h-7 text-xs rounded-full"
									>
										Cancel
									</Button>
									<Button
										type="button"
										size="sm"
										onClick={setLink}
										className="h-7 text-xs rounded-full bg-primary text-secondary"
									>
										Save Link
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					{editor.isActive("link") && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							disabled={disabled}
							onClick={() => editor.chain().focus().unsetLink().run()}
							className="h-8 w-8 rounded-lg text-primary hover:bg-primary/20 transition-colors"
							title="Remove Link"
						>
							<Unlink className="w-4 h-4" />
						</Button>
					)}
				</div>

				{/* Utilities group */}
				<div className="flex items-center gap-0.5 pl-2">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled}
						onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
						className="h-8 w-8 rounded-lg text-primary hover:bg-primary/20 transition-colors"
						title="Clear Formatting"
					>
						<RemoveFormatting className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled || !editor.can().chain().focus().undo().run()}
						onClick={() => editor.chain().focus().undo().run()}
						className="h-8 w-8 rounded-lg text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
						title="Undo (Ctrl+Z)"
					>
						<Undo className="w-4 h-4" />
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="icon"
						disabled={disabled || !editor.can().chain().focus().redo().run()}
						onClick={() => editor.chain().focus().redo().run()}
						className="h-8 w-8 rounded-lg text-primary hover:bg-primary/20 transition-colors disabled:opacity-40"
						title="Redo (Ctrl+Y)"
					>
						<Redo className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* Editor Content Box */}
			<div
				className={`p-4 ${textColor} text-left bg-transparent border-0 outline-none focus:outline-none focus:ring-0 custom-scrollbar overflow-y-auto overflow-x-hidden cursor-text w-full max-w-full break-words whitespace-pre-wrap`}
				style={{ height, maxHeight, minHeight }}
				onClick={() => editor.chain().focus().run()}
			>
				<EditorContent editor={editor} className={`wysiwyg-content text-left border-0 outline-none ${textColor} focus:outline-none focus:ring-0 w-full max-w-full break-words whitespace-pre-wrap`} />
			</div>
		</div>
	);
}
