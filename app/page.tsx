"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, CopyIcon, ReloadIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useState } from "react";

interface Signer {
	publicKey: string;
	privateKey: string;
}

export default function Home() {
	const [loading, setLoading] = useState(false);
	const [signer, setSigner] = useState<Signer | undefined>({
		publicKey:
			"0xada17d8e1b20405fab1f47305939facba9148abcda3599f78ca78f83c4257d57",
		privateKey:
			"0xada17d8e1b20405fkdjafklasdjflafab1f47305939facba9148abcda3599f78ca78f83c4257d57",
	});
	const [qrCode, setQrCode] = useState("");
	const [pollingToken, setPollingToken] = useState();

	const [copiedPublic, setCopiedPublic] = useState(false);
	const [copiedPrivate, setCopiedPrivate] = useState(false);
	const [copiedBoth, setCopiedBoth] = useState(false);

	const wait = () => new Promise((resolve) => setTimeout(resolve, 1000));

	async function handleCopy(
		setCopiedState: React.Dispatch<React.SetStateAction<boolean>>,
	) {
		setCopiedState(true);
		await wait();
		setCopiedState(false);
	}

	async function copyToClipboard(
		content: string,
		setCopiedState: React.Dispatch<React.SetStateAction<boolean>>,
	) {
		navigator.clipboard
			.writeText(content)
			.then(async () => await handleCopy(setCopiedState))
			.catch(() => alert("Failed to copy"));
	}

	async function createSigner() {
		setLoading(true);
		try {
			const signInReq = await fetch("/api/sign-in", {
				method: "POST",
			});
			const signInRes = await signInReq.json();
			setPollingToken(signInRes.pollingToken);
			setQrCode(`/api/qr/${signInRes.pollingToken}`);

			const pollReq = await fetch(`/api/poll/${signInRes.pollingToken}`);
			const pollRes = await pollReq.json();

			const pollStartTime = Date.now();
			while (pollRes.state !== "completed") {
				if (Date.now() - pollStartTime > 120000) {
					setLoading(false);
					throw Error("Timed out");
				}
				const pollReq = await fetch(`/api/poll/${signInRes.pollingToken}`, {
					headers: {
						"Cache-Control": "no-cache",
					},
				});
				const pollRes = await pollReq.json();
				console.log(pollRes);
				if (pollRes.state === "completed") {
					setSigner({
						publicKey: signInRes.publicKey,
						privateKey: signInRes.privateKey,
					});
					setQrCode("");
					setLoading(false);
					return pollRes;
				}
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
		} catch (error) {
			console.log(error);
			setLoading(false);
		}
	}

	function ButtonLoading() {
		return (
			<Button disabled>
				<ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
				Creating Signer...
			</Button>
		);
	}

	return (
		<main className="flex flex-col gap-12 min-h-screen justify-start mt-12 items-center">
			<div className="flex flex-col gap-4 justify-center items-center">
				<Image width={250} height={250} src="/logo.png" alt="logo" />
				<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
					Cast Keys
				</h1>
				<h4 className="scroll-m-20 text-xl font-semibold tracking-tight text-center mx-2">
					Quickly and easily create a signer for your Farcaster account
				</h4>
				<a
					className="font-bold underline"
					href="https://github.com/stevedylandev/cast-keys"
					target="_blank"
					rel="noreferrer"
				>
					Source Code
				</a>
			</div>
			{loading && ButtonLoading()}
			{!signer && !loading && (
				<Button onClick={createSigner}>Create Signer</Button>
			)}
			{qrCode && !signer && (
				<div className="flex flex-col gap-4 items-center justify-center">
					<Image src={qrCode} alt="sign in qr code" height={250} width={250} />
					<p className="mx-4 mb-12">
						Scan the QR code to approve in Warpcast, or{" "}
						<a
							className="underline"
							href={`farcaster://signed-key-request?token=${pollingToken}`}
						>
							click here if you're on mobile
						</a>
					</p>
				</div>
			)}
			{signer && (
				<div className="flex flex-col gap-2 justify-center items-center w-full max-w-[500px] sm:px-auto px-4">
					<p className="">Approved! Copy your keys down somewhere safe.</p>
					<p>Once you refresh the page they cannot be recovered</p>
					<div className="grid gap-4 py-4 w-full">
						<div className="flex flex-col items-center gap-4 w-full">
							<div className="flex items-center w-full gap-2">
								<Label htmlFor="publicKey" className="w-24 text-right">
									Public
								</Label>
								<Input
									id="publicKey"
									value={signer.publicKey}
									className="flex-grow"
								/>
								<Button
									onClick={() =>
										copyToClipboard(signer.publicKey, setCopiedPublic)
									}
								>
									{copiedPublic ? (
										<CheckIcon className="h-4 w-4" />
									) : (
										<CopyIcon className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>
						<div className="flex items-center w-full gap-2">
							<Label htmlFor="privateKey" className="w-24 text-right">
								Private
							</Label>
							<Input
								id="privatekey"
								value={signer.privateKey}
								type="password"
								className="flex-grow"
							/>
							<Button
								onClick={() =>
									copyToClipboard(signer.privateKey, setCopiedPrivate)
								}
							>
								{copiedPrivate ? (
									<CheckIcon className="h-4 w-4" />
								) : (
									<CopyIcon className="h-4 w-4" />
								)}
							</Button>
						</div>
						<Button
							onClick={() =>
								copyToClipboard(
									`publicKey: ${signer?.publicKey} \n privateKey: ${signer?.privateKey}`,
									setCopiedBoth,
								)
							}
						>
							{copiedBoth ? "Copied!" : "Copy Both to Clipboard"}
						</Button>
						<Button onClick={() => setSigner(undefined)}>Create Another</Button>
					</div>
				</div>
			)}
		</main>
	);
}
