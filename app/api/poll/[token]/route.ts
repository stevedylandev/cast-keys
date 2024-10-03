import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const revalidate = 0;

export async function GET(
	req: NextRequest,
	{ params }: { params: { token: string } },
) {
	const pollingToken = params.token;
	try {
		const fcSignerRequestResponse = await fetch(
			`https://api.warpcast.com/v2/signed-key-request?token=${pollingToken}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
				},
			},
		);
		const responseBody = (await fcSignerRequestResponse.json()) as {
			result: { signedKeyRequest: any };
		};
		console.log(responseBody);
		return NextResponse.json(
			{
				state: responseBody.result.signedKeyRequest.state,
				userFid: responseBody.result.signedKeyRequest.userFid,
			},
			{ status: 200 },
		);
	} catch (error) {
		return NextResponse.json({ error: error }, { status: 500 });
	}
}
