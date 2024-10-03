import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

export const metadata: Metadata = {
	title: "Cast Keys",
	description: "Quickly and easily create a signer for your Farcaster account",
	icons: {
		apple: "/favicon.ico",
		shortcut: "/favicon.ico",
		icon: "/favicon.ico",
	},
	openGraph: {
		title: "Cast Keys",
		description:
			"Quickly and easily create a signer for your Farcaster account",
		url: "https://castkeys.xyz",
		siteName: "Cast Keys",
		images: ["https://www.castkeys.xyz/og.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "Cast Keys",
		description:
			"Quickly and easily create a signer for your Farcaster account",
		images: ["https://www.castkeys.xyz/og.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
