import { NextResponse } from "next/server";
import { mnemonicToAccount } from "viem/accounts";
import * as ed from "@noble/ed25519";

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
	name: "Farcaster SignedKeyRequestValidator",
	version: "1",
	chainId: 10,
	verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
} as const;

const SIGNED_KEY_REQUEST_TYPE = [
	{ name: "requestFid", type: "uint256" },
	{ name: "key", type: "bytes" },
	{ name: "deadline", type: "uint256" },
] as const;

export async function POST() {
	try {
		const signInWithWarpcast = async () => {
			const privateKeyBytes = ed.utils.randomPrivateKey();
			const publicKeyBytes = await ed.getPublicKeyAsync(privateKeyBytes);

			const keypairString = {
				publicKey: `0x${Buffer.from(publicKeyBytes).toString("hex")}`,
				privateKey: `0x${Buffer.from(privateKeyBytes).toString("hex")}`,
			};
			const appFid = process.env.DEVELOPER_FID!;
			const account = mnemonicToAccount(process.env.DEVELOPER_MNEMONIC!);

			const deadline = Math.floor(Date.now() / 1000) + 86400; // signature is valid for 1 day
			const requestFid = Number.parseInt(appFid);
			const signature = await account.signTypedData({
				domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
				types: {
					SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE,
				},
				primaryType: "SignedKeyRequest",
				message: {
					requestFid: BigInt(appFid),
					key: keypairString.publicKey as `0x`,
					deadline: BigInt(deadline),
				},
			});
			const authData = {
				signature: signature,
				requestFid: requestFid,
				deadline: deadline,
				requestSigner: account.address,
			};
			const {
				result: { signedKeyRequest },
			} = (await (
				await fetch("https://api.warpcast.com/v2/signed-key-requests", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						key: keypairString.publicKey,
						signature,
						requestFid,
						deadline,
					}),
				})
			).json()) as {
				result: { signedKeyRequest: { token: string; deeplinkUrl: string } };
			};
			const user: any = {
				...authData,
				publicKey: keypairString.publicKey,
				deadline: deadline,
				token: signedKeyRequest.token,
				signerApprovalUrl: signedKeyRequest.deeplinkUrl,
				privateKey: keypairString.privateKey,
				status: "pending_approval",
			};
			return user;
		};

		const signInData = await signInWithWarpcast();
		if (!signInData) {
			return NextResponse.json(
				{ error: "Failed to sign in user" },
				{ status: 500 },
			);
		}
		if (signInData) {
			return NextResponse.json({
				deepLinkUrl: signInData?.signerApprovalUrl,
				pollingToken: signInData?.token,
				publicKey: signInData?.publicKey,
				privateKey: signInData?.privateKey,
			});
		}
		return NextResponse.json(
			{ error: "Failed to get farcaster user" },
			{ status: 500 },
		);
	} catch (error) {
		console.log(error);
		return NextResponse.json({ error: error }, { status: 500 });
	}
}
