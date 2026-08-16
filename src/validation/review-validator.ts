import fs from "node:fs";
import path from "node:path";

export interface ReviewValidationResult {
    approved: boolean;
    message: string;
}

export function validateReview(): ReviewValidationResult {
    const reviewPath = path.join(
        process.cwd(),
        ".sdlc",
        "storycraft",
        "review.json"
    );

    if (!fs.existsSync(reviewPath)) {
        return {
            approved: false,
            message:
                "Human review has not been completed."
        };
    }

    try {
        const content = fs.readFileSync(
            reviewPath,
            "utf8"
        );

        const review = JSON.parse(content);

        if (review.status !== "approved") {
            return {
                approved: false,
                message:
                    "Stories have not been approved by a human reviewer."
            };
        }

        return {
            approved: true,
            message:
                "Human review approved."
        };
    } catch {
        return {
            approved: false,
            message:
                "Review file is invalid."
        };
    }
}