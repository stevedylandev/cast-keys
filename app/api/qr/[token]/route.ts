import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import qrcode from "qrcode-generator";

export async function GET(
	request: NextRequest,
	{ params }: { params: { token: string } },
) {
	const token = params.token;
	try {
		const qr = qrcode(0, "H");
		qr.addData(`farcaster://signed-key-request?token=${token}`);
		qr.make();
		const qrCodeDataURL = qr.createDataURL(6, 4);

		const imageData = qrCodeDataURL.split(",")[1];

		const imageBuffer = Uint8Array.from(atob(imageData), (c) =>
			c.charCodeAt(0),
		);

		return new NextResponse(imageBuffer, {
			headers: {
				"Content-Type": "image/png",
			},
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to generate QR code" },
			{ status: 500 },
		);
	}
}
