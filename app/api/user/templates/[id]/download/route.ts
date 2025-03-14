import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSignedUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db"; // Ensure correct database import

export async function GET(req: Request, { params }: { params: { id: string } }) {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Validate ID
    const { id } = params;
    if (!id) {
        return new NextResponse("Bad Request: Missing ID", { status: 400 });
    }

    try {
        // Fetch document data from the correct model (replace 'document' with actual model name)
        const document = await db.document.findUnique({
            where: { id },
            select: { fileUrl: true }
        });

        if (!document || !document.fileUrl) {
            return new NextResponse("Not Found: Document not available", { status: 404 });
        }

        // Generate a signed URL for the document
        const signedUrl = await getSignedUrl(document.fileUrl);

        // Return the signed URL in JSON format
        return NextResponse.json({ url: signedUrl });
    } catch (error) {
        console.error("Error fetching document:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
