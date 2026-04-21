import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createEnquiry } from "@/features/enquiries/services/enquiry-service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  try {
    const enquiry = await createEnquiry(body);
    return NextResponse.json(
      { enquiry: { id: enquiry.id, status: enquiry.status } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Please check the form fields and try again.",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 422 },
      );
    }

    console.error("[enquiries] create failed", error);
    return NextResponse.json(
      { message: "Could not save enquiry. Please try again." },
      { status: 500 },
    );
  }
}
